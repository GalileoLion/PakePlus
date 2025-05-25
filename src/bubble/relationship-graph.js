/**
 * 好友关系图谱 - 与主应用集成版本
 * 支持内联编辑关系、拖拽惯性效果和关系持久化存储
 */

// 关系图谱对象
const RelationshipGraph = {
    // 基础属性
    canvas: null,
    ctx: null,
    container: null,
    width: 0,
    height: 0,
    nodes: [],
    links: [],
    labelElements: {}, // 存储每条连线对应的标签元素
    isInitialized: false,  // 是否已初始化过
    
    // 交互状态
    draggedNode: null,
    selectedNode: null,
    hoveredLink: null,
    editingLink: null,  // 正在编辑关系的连接
    isEditMode: false,
    isInfoHovered: false, // 信息图标是否被悬停
    
    // 物理引擎参数
    simulation: null,
    useD3: false,
    isLayoutStabilized: false, // 布局是否已稳定
    
    // 惯性相关
    dragVelocity: { x: 0, y: 0 },
    lastDragPosition: { x: 0, y: 0 },
    lastDragTime: 0,
    inertiaNodes: [],
    
    // 样式常量
    NODE_RADIUS: 30,
    COLORS: {
        node: {
            stroke: '#4a90e2',
            fill: '#ffffff',
            text: '#333333',
            highlight: '#ff7675',
            selected: '#0984e3',
            self: '#34495e'  // 自己节点的颜色
        },
        link: {
            default: '#95a5a6',
            hover: '#3498db',
            bidirectional: '#27ae60',
            directional: '#e74c3c'
        },
        background: '#f5f6fa',
        info: '#3498db'
    },
    
    // 清理旧的模拟，确保第二次打开时不会出现问题
    cleanUp: function() {
        // 停止旧的模拟
        if (this.simulation) {
            this.simulation.stop();
            this.simulation = null;
        }
        
        // 清空节点和连接
        this.nodes = [];
        this.links = [];
        this.selectedNode = null;
        this.hoveredLink = null;
        this.editingLink = null;
        this.draggedNode = null;
        this.inertiaNodes = [];
        
        // 清理所有标签元素
        this.removeAllLabels();
        this.labelElements = {};
        
        // 重置状态
        this.isLayoutStabilized = false;
    },
    
    // 移除所有标签元素
    removeAllLabels: function() {
        if (!this.container) return;
        
        // 移除所有带有relation-label类的元素
        const labels = this.container.querySelectorAll('.relation-label');
        labels.forEach(label => label.remove());
    },
    
    // 初始化图谱
    init: function(containerId) {
        console.log("初始化图谱，容器ID:", containerId);
        
        // 先清理旧的模拟
        this.cleanUp();
        
        // 获取容器
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('找不到容器:', containerId);
            return this;
        }
        
        this.container.innerHTML = '';
        
        // 创建模式切换按钮
        const modeToggleBtn = document.createElement('button');
        modeToggleBtn.id = 'modeToggleBtn';
        modeToggleBtn.className = 'mode-toggle-btn';
        modeToggleBtn.textContent = '进入编辑模式';
        modeToggleBtn.addEventListener('click', () => this.toggleEditMode());
        this.container.appendChild(modeToggleBtn);
        
        // 创建canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'relationship-canvas';
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 添加事件监听
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // 检查D3.js是否可用
        if (typeof d3 !== 'undefined') {
            try {
                this.useD3 = true;
                console.log('使用D3.js物理引擎');
            } catch (e) {
                console.warn('D3.js初始化失败，将使用简单布局', e);
                this.useD3 = false;
            }
        } else {
            console.warn('未检测到D3.js，将使用简单布局');
            this.useD3 = false;
        }
        
        // 标记初始化完成
        this.isInitialized = true;
        
        // 开始动画循环
        requestAnimationFrame(() => this.draw());
        
        return this;
    },
    
    // 调整画布大小
    resizeCanvas: function() {
        if (!this.container || !this.canvas) return;
        
        // 获取容器实际大小
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        // 计算合适的节点半径，根据容器大小和节点数量动态调整
        const nodeCount = this.nodes.length || 10; // 假设至少有10个节点
        const minDimension = Math.min(this.width, this.height);
        // 动态计算节点大小，但有最小和最大限制
        this.NODE_RADIUS = Math.min(Math.max(minDimension / (nodeCount * 1.5), 20), 40);
        
        // 设置画布大小，考虑设备像素比
        const pixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = this.width * pixelRatio;
        this.canvas.height = this.height * pixelRatio;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        // 重新布局节点
        if (this.nodes.length > 0) {
            if (this.simulation && this.useD3) {
                this.simulation.force('center')
                    .x(this.width / 2)
                    .y(this.height / 2);
                // 更新碰撞检测半径
                this.simulation.force('collision').radius(this.NODE_RADIUS * 1.2);
                this.simulation.alpha(0.3).restart();
            } else {
                this.arrangeNodesInCircle();
            }
        }
    },
    
    // 在圆形中布局节点
    arrangeNodesInCircle: function() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // 计算适当的半径，根据节点数和容器大小确定
        const radius = Math.min(this.width, this.height) * 0.35;
        
        // 找到自己的节点(ID为0)
        const selfNode = this.nodes.find(n => n.id === 0);
        
        this.nodes.forEach((node, i) => {
            // 自己的节点特别处理
            if (node.id === 0 && selfNode) {
                // 把自己的节点放在中心
                node.x = centerX;
                node.y = centerY;
                return;
            }
            
            // 如果节点位置已经设置，且不是在默认位置，则保持原位置
            if (node.x !== undefined && node.y !== undefined && 
                (node.x !== this.width / 2 + (Math.random() - 0.5) * 20) && 
                (node.y !== this.height / 2 + (Math.random() - 0.5) * 20)) {
                return;
            }
            
            // 计算节点在圆上的均匀分布位置
            // 如果有自己的节点，友谊节点的索引要-1
            let index = selfNode ? i - (i > this.nodes.indexOf(selfNode) ? 1 : 0) : i;
            const friendCount = selfNode ? this.nodes.length - 1 : this.nodes.length;
            const angle = (index / friendCount) * Math.PI * 2;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });
        
        this.isLayoutStabilized = true;
        
        // 更新所有标签位置
        this.updateAllLabelPositions();
    },
    
    // 初始化D3物理引擎
    initSimulation: function() {
        if (!this.useD3 || !d3) return;
        
        try {
            // 停止旧的模拟
            if (this.simulation) {
                this.simulation.stop();
            }
            
            // 重置布局稳定状态
            this.isLayoutStabilized = false;
            
            // 创建力导向图
            this.simulation = d3.forceSimulation(this.nodes)
                // 节点间斥力大小，增加稳定性并减少震荡
                .force('charge', d3.forceManyBody().strength(-150).distanceMax(300))
                // 设置连接线的参数，增加理想长度
                .force('link', d3.forceLink(this.links)
                    .id(d => d.id)
                    .distance(d => this.NODE_RADIUS * 4)
                    .strength(0.2))
                // 向中心的引力
                .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                // 防止节点重叠
                .force('collision', d3.forceCollide().radius(this.NODE_RADIUS * 1.5))
                // 添加一个轻微的x和y方向的阻力来提高稳定性
                .force('x', d3.forceX(this.width / 2).strength(0.01))
                .force('y', d3.forceY(this.height / 2).strength(0.01))
                .on('tick', () => {
                    // 找到自己的节点(ID为0)
                    const selfNode = this.nodes.find(n => n.id === 0);
                    if (selfNode) {
                        // 给自己的节点一个向中心移动的趋势
                        const centerX = this.width / 2;
                        const centerY = this.height / 2;
                        const dx = centerX - selfNode.x;
                        const dy = centerY - selfNode.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist > 1) {
                            selfNode.x += dx * 0.1;
                            selfNode.y += dy * 0.1;
                        }
                    }
                    
                    // 限制节点位置在画布内
                    this.nodes.forEach(node => {
                        node.x = Math.max(this.NODE_RADIUS, Math.min(this.width - this.NODE_RADIUS, node.x));
                        node.y = Math.max(this.NODE_RADIUS, Math.min(this.height - this.NODE_RADIUS, node.y));
                    });
                    
                    // 更新所有标签位置
                    this.updateAllLabelPositions();
                })
                .on('end', () => {
                    this.isLayoutStabilized = true;
                    console.log("物理引擎布局已稳定");
                });
            
            // 降低alpha衰减率，使布局变化更平滑
            this.simulation.alphaDecay(0.02);
            this.simulation.velocityDecay(0.4); // 增加惯性，使运动更流畅
            
            // 初始时用更高的冷却值进行一次预热，让节点快速找到合适位置
            this.simulation.alpha(0.8).restart();
            
            // 预先进行一些迭代，使初始布局更加稳定
            for (let i = 0; i < 100; i++) {
                this.simulation.tick();
            }
            
            // 重置alpha并进行一些额外的迭代
            this.simulation.alpha(0.3).restart();
            
            // 找到自己的节点(ID为0)，将其固定在中心
            const selfNode = this.nodes.find(n => n.id === 0);
            if (selfNode) {
                selfNode.fx = this.width / 2;
                selfNode.fy = this.height / 2;
            }
        } catch (e) {
            console.error('D3物理引擎初始化失败', e);
            this.useD3 = false;
            this.arrangeNodesInCircle();
        }
    },
    
    // 获取唯一的存储键
    getRelationshipsStorageKey: function() {
        // 使用类似 "relationships_friendsGraph" 的键
        return 'relationships_friendsGraph';
    },
    
    // 保存关系数据
    saveRelationships: function() {
        console.log("保存关系数据，共", this.links.length, "条关系");
        
        // 将复杂对象转换为可存储的格式
        const relationshipsToSave = this.links.map(link => ({
            sourceId: typeof link.source === 'object' ? link.source.id : link.source,
            targetId: typeof link.target === 'object' ? link.target.id : link.target,
            bidirectional: link.bidirectional,
            relationship: link.relationship || "认识"
        }));
        
        try {
            // 保存到 localStorage
            localStorage.setItem(this.getRelationshipsStorageKey(), JSON.stringify(relationshipsToSave));
        } catch (e) {
            console.error("保存关系数据失败:", e);
        }
    },
    
    // 加载保存的关系数据
    loadSavedRelationships: function() {
        try {
            const savedData = localStorage.getItem(this.getRelationshipsStorageKey());
            if (!savedData) {
                console.log("未找到保存的关系数据");
                return false;
            }
            
            const savedRelationships = JSON.parse(savedData);
            console.log("加载保存的关系数据，共", savedRelationships.length, "条");
            
            // 清空当前关系
            this.links = [];
            
            // 恢复保存的关系
            savedRelationships.forEach(rel => {
                // 验证源节点和目标节点仍然存在
                const sourceExists = this.nodes.some(node => node.id === rel.sourceId);
                const targetExists = this.nodes.some(node => node.id === rel.targetId);
                
                if (sourceExists && targetExists) {
                    this.links.push({
                        source: rel.sourceId,
                        target: rel.targetId,
                        bidirectional: rel.bidirectional,
                        relationship: rel.relationship || "认识"
                    });
                }
            });
            
            // 创建所有连线的标签
            this.createAllLabels();
            
            return true;
        } catch (e) {
            console.error("加载保存的关系数据失败:", e);
            return false;
        }
    },
    
    // 创建所有连线标签
    createAllLabels: function() {
        // 首先移除所有现有标签
        this.removeAllLabels();
        this.labelElements = {};
        
        // 为每条连线创建标签
        this.links.forEach(link => {
            this.createLabelForLink(link);
        });
    },
    
    // 创建单个连线标签
    createLabelForLink: function(link) {
        const source = this.getNodeById(link.source);
        const target = this.getNodeById(link.target);
        
        if (!source || !target) return;
        
        // 创建标签元素
        const label = document.createElement('input');
        label.type = 'text';
        label.className = 'relation-label';
        label.value = link.relationship || '认识';
        label.readOnly = true; // 默认只读
        
        // 计算适合的字体大小，根据节点半径动态调整
        const fontSize = Math.max(8, Math.min(10, this.NODE_RADIUS * 0.3));
        
        // 设置标签样式
        label.style.position = 'absolute';
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'; // 增加透明度
        label.style.border = '1px solid #ccc';
        label.style.borderRadius = '3px';
        label.style.padding = '1px 2px';
        label.style.fontSize = `${fontSize}px`;
        label.style.textAlign = 'center';
        label.style.pointerEvents = 'none'; // 默认不响应鼠标事件
        label.style.zIndex = '5';
        label.style.minWidth = '30px'; // 设置最小宽度，保证至少可容纳2个字
        
        // 更新标签位置
        this.updateLabelPosition(link, label);
        
        // 双击事件 - 只在编辑模式下生效
        label.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (this.isEditMode) {
                this.activateLabelEdit(label, link);
            }
        });
        
        // 按下回车或失去焦点时保存
        label.addEventListener('blur', () => {
            if (!label.readOnly) {
                this.saveLabelEdit(label, link);
            }
        });
        
        label.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveLabelEdit(label, link);
            }
        });
        
        // 将标签添加到容器
        this.container.appendChild(label);
        
        // 存储标签元素的引用
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const linkId = `${sourceId}-${targetId}`;
        this.labelElements[linkId] = label;
    },
    
    // 激活标签编辑模式
    activateLabelEdit: function(label, link) {
        label.readOnly = false;
        label.style.pointerEvents = 'auto';
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // 编辑时略微降低透明度
        label.style.border = '1px solid #4a90e2';
        label.focus();
        label.select(); // 选中内容方便编辑
    },
    
    // 保存标签编辑内容
    saveLabelEdit: function(label, link) {
        let value = label.value.trim();
        if (value === '') value = '认识';
        
        // 更新连线关系描述
        link.relationship = value;
        label.value = value;
        
        // 恢复只读状态
        label.readOnly = true;
        label.style.pointerEvents = 'none';
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        label.style.border = '1px solid #ccc';
        
        // 更新标签位置和大小
        this.updateLabelPosition(link, label);
        
        // 保存关系数据
        this.saveRelationships();
    },
    
    // 更新标签位置
    updateLabelPosition: function(link, label) {
        if (!label) return;
        
        const source = this.getNodeById(link.source);
        const target = this.getNodeById(link.target);
        
        if (!source || !target) return;
        
        // 计算两点间直线
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 单位向量
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        // 计算起点和终点（考虑节点半径）
        const startX = source.x + unitX * this.NODE_RADIUS;
        const startY = source.y + unitY * this.NODE_RADIUS;
        const endX = target.x - unitX * this.NODE_RADIUS;
        const endY = target.y - unitY * this.NODE_RADIUS;
        
        // 计算标签位置（线段中点）
        const labelX = (startX + endX) / 2;
        const labelY = (startY + endY) / 2;
        
        // 计算适合的宽度，根据关系文本长度动态调整
        const textLength = label.value.length;
        const fontSize = parseInt(label.style.fontSize);
        const labelWidth = Math.max(30, Math.min(80, textLength * fontSize * 0.7));
        
        // 更新标签位置和宽度
        label.style.width = `${labelWidth}px`;
        label.style.left = `${labelX - labelWidth/2}px`;
        label.style.top = `${labelY - fontSize/2}px`;
    },
    
    // 更新所有标签位置
    updateAllLabelPositions: function() {
        this.links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const linkId = `${sourceId}-${targetId}`;
            const label = this.labelElements[linkId];
            
            if (label) {
                this.updateLabelPosition(link, label);
            }
        });
    },
    
    // 加载数据
    loadData: function(friendsData) {
        console.log("加载数据，好友数量:", friendsData.length);
        
        // 清理旧的状态和模拟
        this.cleanUp();
        
        // 添加一个代表自己的节点
        const selfNode = {
            id: 0, // 使用0作为自己的ID
            name: "我",
            emoji: "👤", // 使用一个默认的emoji表示自己
            birthdate: null,
            isSelf: true,  // 标记这是自己的节点
            x: this.width / 2,
            y: this.height / 2,
            vx: 0,
            vy: 0
        };
        
        // 创建节点 - 确保从friendsData加载
        this.nodes = friendsData.map(friend => ({
            id: friend.id,
            name: friend.name,
            emoji: friend.emoji,
            birthdate: friend.birthdate,
            relationship: friend.relationship,
            location: friend.location,
            // 初始位置设在中心附近，小范围随机分布
            x: this.width / 2 + (Math.random() - 0.5) * 20,
            y: this.height / 2 + (Math.random() - 0.5) * 20,
            vx: 0, // 速度x
            vy: 0  // 速度y
        }));
        
        // 添加自己的节点到数组开头
        this.nodes.unshift(selfNode);
        
        // 尝试加载保存的关系数据
        const relationshipsLoaded = this.loadSavedRelationships();
        if (!relationshipsLoaded) {
            // 如果没有保存的关系数据，links数组将保持为空
            console.log("没有加载到保存的关系数据");
        }
        
        console.log("节点数量:", this.nodes.length, "连接数量:", this.links.length);
        
        // 先使用圆形布局初始化节点位置，再应用物理引擎
        this.arrangeNodesInCircle();
        
        // 初始化物理引擎
        if (this.useD3) {
            this.initSimulation();
        }
        
        return this;
    },
    
    // 绘制图谱
    draw: function() {
        if (!this.ctx) return;
        
        // 重置变换
        this.ctx.resetTransform();
        const pixelRatio = window.devicePixelRatio || 1;
        this.ctx.scale(pixelRatio, pixelRatio);
        
        // 清空画布
        this.ctx.fillStyle = this.COLORS.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 处理带有惯性的节点
        this.updateNodeInertia();
        
        // 绘制连接线
        this.links.forEach(link => this.drawLink(link));
        
        // 绘制节点
        this.nodes.forEach(node => this.drawNode(node));
        
        // 绘制信息图标
        this.drawInfoIcon();
        
        // 继续动画
        requestAnimationFrame(() => this.draw());
    },
    
    // 绘制信息图标
    drawInfoIcon: function() {
        const iconRadius = 12;
        const x = iconRadius + 10;
        const y = iconRadius + 10;
        
        // 绘制圆形背景
        this.ctx.beginPath();
        this.ctx.arc(x, y, iconRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.isInfoHovered ? 'rgba(52, 152, 219, 0.9)' : 'rgba(52, 152, 219, 0.7)';
        this.ctx.fill();
        
        // 绘制感叹号
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('!', x, y);
        
        // 如果鼠标悬停在图标上，显示帮助文本
        if (this.isInfoHovered) {
            const helpText = this.isEditMode ? [
                "编辑模式操作指南：",
                "• 左键点击两个好友：添加双向关系",
                "• 左键点击好友1，右键点击好友2：单向关系",
                "• 右键点击连接线：删除关系",
                "• 拖拽好友：调整位置",
                "• 双击标签：编辑关系描述"
            ] : [
                "浏览模式操作指南：",
                "• 拖拽好友：调整位置",
                "• 点击右上角按钮进入编辑模式",
                "• 编辑模式下才能修改关系"
            ];
            
            // 计算文本框大小
            const lineHeight = 20;
            const padding = 10;
            const boxWidth = 280;
            const boxHeight = helpText.length * lineHeight + padding * 2;
            
            // 绘制文本背景
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fillRect(x + iconRadius, y - boxHeight / 2, boxWidth, boxHeight);
            this.ctx.shadowColor = 'transparent';
            
            // 绘制文本
            this.ctx.textAlign = 'left';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#333333';
            this.ctx.fillText(helpText[0], x + iconRadius + padding, y - boxHeight / 2 + padding + lineHeight / 2);
            
            this.ctx.font = '13px Arial';
            for (let i = 1; i < helpText.length; i++) {
                this.ctx.fillText(helpText[i], x + iconRadius + padding, y - boxHeight / 2 + padding + lineHeight / 2 + i * lineHeight);
            }
        }
    },
    
    // 更新节点惯性
    updateNodeInertia: function() {
        const friction = 0.95; // 摩擦系数
        const minSpeed = 0.1;  // 最小速度阈值
        
        // 处理所有带惯性的节点
        for (let i = this.inertiaNodes.length - 1; i >= 0; i--) {
            const nodeData = this.inertiaNodes[i];
            const node = nodeData.node;
            
            // 如果是自己的节点（ID=0），跳过惯性处理
            if (node.id === 0) continue;
            
            // 应用惯性运动
            node.x += node.vx;
            node.y += node.vy;
            
            // 应用摩擦力
            node.vx *= friction;
            node.vy *= friction;
            
            // 边界检查
            if (node.x < this.NODE_RADIUS) {
                node.x = this.NODE_RADIUS;
                node.vx = -node.vx * 0.5; // 碰撞反弹，损失部分能量
            } else if (node.x > this.width - this.NODE_RADIUS) {
                node.x = this.width - this.NODE_RADIUS;
                node.vx = -node.vx * 0.5;
            }
            
            if (node.y < this.NODE_RADIUS) {
                node.y = this.NODE_RADIUS;
                node.vy = -node.vy * 0.5;
            } else if (node.y > this.height - this.NODE_RADIUS) {
                node.y = this.height - this.NODE_RADIUS;
                node.vy = -node.vy * 0.5;
            }
            
            // 如果速度足够小，从惯性列表中移除
            if (Math.abs(node.vx) < minSpeed && Math.abs(node.vy) < minSpeed) {
                node.vx = 0;
                node.vy = 0;
                this.inertiaNodes.splice(i, 1);
            }
        }
        
        // 找到自己的节点，让它向中心移动
        const selfNode = this.nodes.find(n => n.id === 0);
        if (selfNode && !this.draggedNode) {  // 如果不在拖拽中
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const dx = centerX - selfNode.x;
            const dy = centerY - selfNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 1) {
                selfNode.x += dx * 0.05;  // 缓慢向中心移动
                selfNode.y += dy * 0.05;
            }
        }
        
        // 更新所有标签位置
        if (this.inertiaNodes.length > 0 || this.draggedNode) {
            this.updateAllLabelPositions();
        }
    },
    
    // 绘制节点
    drawNode: function(node) {
        const isSelf = node.id === 0;
        
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, this.NODE_RADIUS, 0, Math.PI * 2);
        
        // 自己的节点使用不同的填充颜色
        this.ctx.fillStyle = isSelf ? 'rgba(52, 152, 219, 0.1)' : this.COLORS.node.fill;
        this.ctx.fill();
        
        // 根据状态设置边框色
        if (node === this.selectedNode) {
            this.ctx.strokeStyle = this.COLORS.node.selected;
            this.ctx.lineWidth = 3;
        } else if (node === this.draggedNode) {
            this.ctx.strokeStyle = this.COLORS.node.highlight;
            this.ctx.lineWidth = 3;
        } else if (isSelf) {
            this.ctx.strokeStyle = this.COLORS.node.self;
            this.ctx.lineWidth = 2.5;
        } else {
            this.ctx.strokeStyle = this.COLORS.node.stroke;
            this.ctx.lineWidth = 2;
        }
        this.ctx.stroke();
        
        // 绘制头像（emoji）
        const emojiFontSize = Math.max(16, Math.min(24, this.NODE_RADIUS * 0.8));
        this.ctx.font = `${emojiFontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(node.emoji, node.x, node.y - 5);
        
        // 绘制名称
        const nameFontSize = Math.max(10, Math.min(12, this.NODE_RADIUS * 0.4));
        this.ctx.font = `${nameFontSize}px Arial`;
        this.ctx.fillStyle = isSelf ? this.COLORS.node.self : this.COLORS.node.text;
        this.ctx.fillText(node.name, node.x, node.y + this.NODE_RADIUS * 0.6);
    },
    
    // 绘制连接线
    drawLink: function(link) {
        const source = this.getNodeById(link.source);
        const target = this.getNodeById(link.target);
        
        if (!source || !target) return;
        
        // 开始绘制线条
        this.ctx.beginPath();
        
        // 计算两个节点间的直线，但考虑节点的半径
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 单位向量
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        // 计算起点和终点（考虑节点半径）
        const startX = source.x + unitX * this.NODE_RADIUS;
        const startY = source.y + unitY * this.NODE_RADIUS;
        const endX = target.x - unitX * this.NODE_RADIUS;
        const endY = target.y - unitY * this.NODE_RADIUS;
        
        // 绘制直线连接
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        
        // 设置线条样式
        this.ctx.strokeStyle = (link === this.hoveredLink) 
            ? this.COLORS.link.hover 
            : (link.bidirectional 
                ? this.COLORS.link.bidirectional 
                : this.COLORS.link.directional);
        this.ctx.lineWidth = (link === this.hoveredLink) ? 3 : 2;
        this.ctx.stroke();
        
        // 若为单向链接，绘制箭头
        if (!link.bidirectional) {
            // 在终点绘制箭头
            const arrowLength = this.NODE_RADIUS * 0.5;
            const arrowAngle = 30 * Math.PI / 180; // 30度
            
            // 计算箭头两个点
            const arrowX1 = endX - arrowLength * Math.cos(Math.atan2(dy, dx) - arrowAngle);
            const arrowY1 = endY - arrowLength * Math.sin(Math.atan2(dy, dx) - arrowAngle);
            const arrowX2 = endX - arrowLength * Math.cos(Math.atan2(dy, dx) + arrowAngle);
            const arrowY2 = endY - arrowLength * Math.sin(Math.atan2(dy, dx) + arrowAngle);
            
            // 绘制实心箭头
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(arrowX1, arrowY1);
            this.ctx.lineTo(arrowX2, arrowY2);
            this.ctx.closePath();
            this.ctx.fillStyle = (link === this.hoveredLink) 
                ? this.COLORS.link.hover 
                : this.COLORS.link.directional;
            this.ctx.fill();
        }
        
        // 确保每条连线都有对应的标签
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const linkId = `${sourceId}-${targetId}`;
        
        if (!this.labelElements[linkId]) {
            this.createLabelForLink(link);
        }
    },
    
    // 检查点到线段的距离
    pointToLineDistance: function(x, y, x1, y1, x2, y2) {
        // 计算线段长度
        const lineLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        if (lineLength === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
        
        // 计算点在线段上的投影位置
        const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (lineLength * lineLength)));
        
        // 计算投影点坐标
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        
        // 返回点到投影点的距离
        return Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
    },
    
    // 检查点击位置是否在任何节点上
    isPointInsideAnyNode: function(x, y) {
        return this.nodes.some(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= this.NODE_RADIUS;
        });
    },
    
    // 通过ID获取节点
    getNodeById: function(id) {
        if (typeof id === 'object' && id !== null) {
            return id; // D3有时会直接传递对象而不是ID
        }
        return this.nodes.find(n => n.id === id);
    },
    
    // 获取当前鼠标下的节点
    getNodeAtPosition: function(x, y) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            const dx = node.x - x;
            const dy = node.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.NODE_RADIUS) {
                return node;
            }
        }
        return null;
    },
    
    // 检查鼠标是否悬停在信息图标上
    isMouseOverInfoIcon: function(x, y) {
        const iconX = 22;
        const iconY = 22;
        const iconRadius = 12;
        
        const dx = x - iconX;
        const dy = y - iconY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= iconRadius;
    },
    
    // 获取当前鼠标下的连接线
    getLinkAtPosition: function(x, y) {
        // 优先级1: 如果鼠标在气泡上，就不检测连线
        if (this.isPointInsideAnyNode(x, y)) {
            return null;
        }
        
        const threshold = 10; // 鼠标与线的最大距离
        let closestLink = null;
        let minDistance = Infinity;
        
        // 遍历所有连接线找出最近的一条
        for (let i = 0; i < this.links.length; i++) {
            const link = this.links[i];
            const source = this.getNodeById(link.source);
            const target = this.getNodeById(link.target);
            
            if (!source || !target) continue;
            
            // 计算节点边缘的起点和终点（考虑节点半径）
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 单位向量
            const unitX = dx / distance;
            const unitY = dy / distance;
            
            const startX = source.x + unitX * this.NODE_RADIUS;
            const startY = source.y + unitY * this.NODE_RADIUS;
            const endX = target.x - unitX * this.NODE_RADIUS;
            const endY = target.y - unitY * this.NODE_RADIUS;
            
            // 计算点到线段的距离
            const dist = this.pointToLineDistance(x, y, startX, startY, endX, endY);
            
            if (dist <= threshold && dist < minDistance) {
                // 检查线段上是否有其他节点
                let blocked = false;
                
                for (const node of this.nodes) {
                    if (node === source || node === target) continue;
                    
                    // 计算节点到线段的距离
                    const nodeDist = this.pointToLineDistance(node.x, node.y, startX, startY, endX, endY);
                    
                    // 如果节点很靠近线段，且投影点在线段上，则认为线段被阻挡
                    if (nodeDist <= this.NODE_RADIUS) {
                        // 计算节点在线段上的投影位置
                        const lineLength = Math.sqrt((endX - startX) * (endX - startX) + (endY - startY) * (endY - startY));
                        const t = ((node.x - startX) * (endX - startX) + (node.y - startY) * (endY - startY)) / (lineLength * lineLength);
                        
                        // 如果投影在线段上，则线段被阻挡
                        if (t >= 0 && t <= 1) {
                            blocked = true;
                            break;
                        }
                    }
                }
                
                if (!blocked) {
                    closestLink = link;
                    minDistance = dist;
                }
            }
        }
        
        return closestLink;
    },
    
    // 切换编辑模式
    toggleEditMode: function() {
        this.isEditMode = !this.isEditMode;
        console.log("切换编辑模式:", this.isEditMode ? "进入" : "退出", "编辑模式");
        
        // 更新按钮文本
        const btn = document.getElementById('modeToggleBtn');
        if (btn) {
            btn.textContent = this.isEditMode ? '退出编辑模式' : '进入编辑模式';
        }
        
        // 重置选中状态
        this.selectedNode = null;
        
        // 重置所有标签为只读
        Object.values(this.labelElements).forEach(label => {
            label.readOnly = true;
            label.style.pointerEvents = 'none';
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            label.style.border = '1px solid #ccc';
        });
    },
    
    // 鼠标按下事件处理
    handleMouseDown: function(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击了信息图标
        if (this.isMouseOverInfoIcon(x, y)) {
            return; // 点击信息图标不做其他操作
        }
        
        // 检测是否点击了节点
        const node = this.getNodeAtPosition(x, y);
        
        if (node) {
            if (e.button === 0) { // 左键
                if (this.isEditMode) {
                    if (this.selectedNode && this.selectedNode !== node) {
                        console.log("尝试添加双向关系:", this.selectedNode.name, "->", node.name);
                        // 如果已经选中了一个节点，创建从选中节点到当前节点的双向关系
                        this.addRelationship(this.selectedNode, node, true);
                        this.selectedNode = null;
                    } else {
                        // 选中当前节点
                        console.log("选中节点:", node.name);
                        this.selectedNode = node;
                    }
                }
                // 开始拖拽节点
                this.draggedNode = node;
                
                // 记录拖拽开始的位置和时间（用于计算速度）
                this.lastDragPosition = { x: node.x, y: node.y };
                this.lastDragTime = Date.now();
                
                // 暂停物理引擎动画
                if (this.simulation && this.useD3) {
                    this.simulation.alphaTarget(0);
                }
            }
        } else {
            // 如果点击位置不在任何节点上，检查是否点击了连接线
            const link = this.getLinkAtPosition(x, y);
            
            if (!link) {
                // 点击空白处，取消选择和编辑状态
                this.selectedNode = null;
                
                // 重置所有标签为只读
                Object.values(this.labelElements).forEach(label => {
                    label.readOnly = true;
                    label.style.pointerEvents = 'none';
                    label.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                    label.style.border = '1px solid #ccc';
                });
            }
        }
    },
    
    // 鼠标移动事件处理
    handleMouseMove: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否悬停在信息图标上
        this.isInfoHovered = this.isMouseOverInfoIcon(x, y);
        
        // 拖拽节点
        if (this.draggedNode) {
            // 计算拖拽速度
            const now = Date.now();
            const dt = now - this.lastDragTime;
            if (dt > 0) {
                this.dragVelocity = {
                    x: (x - this.lastDragPosition.x) / dt * 16, // 转换为每帧的移动距离
                    y: (y - this.lastDragPosition.y) / dt * 16
                };
                this.lastDragPosition = { x, y };
                this.lastDragTime = now;
            }
            
            this.draggedNode.x = x;
            this.draggedNode.y = y;
            
            // 如果使用D3引擎，需要更新节点固定位置
            if (this.simulation && this.useD3) {
                this.draggedNode.fx = x;
                this.draggedNode.fy = y;
                this.simulation.alphaTarget(0.3).restart();
            }
            
            // 更新标签位置
            this.updateAllLabelPositions();
        }
        
        // 检测鼠标下是否有连接线
        this.hoveredLink = this.getLinkAtPosition(x, y);
    },
    
    // 鼠标抬起事件处理
    handleMouseUp: function(e) {
        if (this.draggedNode) {
            // 如果这是自己的节点，释放后会逐渐回到中心
            if (this.draggedNode.id === 0) {
                this.draggedNode.fx = null;
                this.draggedNode.fy = null;
                // 不添加惯性，让它自然回到中心
            } else {
                // 添加惯性效果
                if (Math.abs(this.dragVelocity.x) > 0.1 || Math.abs(this.dragVelocity.y) > 0.1) {
                    // 设置节点速度
                    this.draggedNode.vx = this.dragVelocity.x;
                    this.draggedNode.vy = this.dragVelocity.y;
                    
                    // 将节点添加到惯性列表
                    this.inertiaNodes.push({
                        node: this.draggedNode,
                        startTime: Date.now()
                    });
                }
                
                // 如果使用D3引擎，需要释放节点固定位置
                if (this.simulation && this.useD3) {
                    this.draggedNode.fx = null;
                    this.draggedNode.fy = null;
                    this.simulation.alpha(0.1).restart();
                }
            }
            
            this.draggedNode = null;
        }
    },
    
    // 双击事件处理
    handleDoubleClick: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 只在编辑模式下允许编辑连接线
        if (!this.isEditMode) return;
        
        // 先排除点击在节点上的情况
        if (this.isPointInsideAnyNode(x, y)) return;
        
        // 检测是否双击了连接线
        const link = this.getLinkAtPosition(x, y);
        if (link) {
            console.log("双击连接线，编辑关系");
            
            // 获取对应的标签元素
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const linkId = `${sourceId}-${targetId}`;
            const label = this.labelElements[linkId];
            
            if (label) {
                // 激活标签编辑模式
                this.activateLabelEdit(label, link);
            }
        }
    },
    
    // 右键点击事件处理
    handleRightClick: function(e) {
        // 只在编辑模式下允许右键操作
        if (!this.isEditMode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否在节点内
        const node = this.getNodeAtPosition(x, y);
        if (node) {
            // 如果已经有选中节点且不是同一个节点，添加单向关系
            if (this.selectedNode && this.selectedNode !== node) {
                console.log("尝试添加单向关系:", this.selectedNode.name, "->", node.name);
                this.addRelationship(this.selectedNode, node, false);
                this.selectedNode = null;
            }
            return;
        }
        
        // 检查是否右键点击了连接线（确保不在任何节点内）
        if (!this.isPointInsideAnyNode(x, y)) {
            const link = this.getLinkAtPosition(x, y);
            if (link) {
                // 删除关系连线
                console.log("删除关系连线");
                this.removeRelationship(link);
                return;
            }
        }
    },
    
    // 添加关系
    addRelationship: function(source, target, bidirectional) {
        // 只在编辑模式下允许添加关系
        if (!this.isEditMode) return;
        
        console.log("添加关系:", source.name, "->", target.name, bidirectional ? "(双向)" : "(单向)");
        
        const sourceId = source.id;
        const targetId = target.id;
        
        // 检查是否已存在相同的关系
        const existingLink = this.links.find(link => {
            const linkSource = typeof link.source === 'object' ? link.source.id : link.source;
            const linkTarget = typeof link.target === 'object' ? link.target.id : link.target;
            
            return (linkSource === sourceId && linkTarget === targetId) ||
                   (bidirectional && linkSource === targetId && linkTarget === sourceId);
        });
        
        if (existingLink) {
            console.log("关系已存在，更新双向状态");
            // 如果已存在关系但是类型不同，更新为双向
            if (bidirectional && !existingLink.bidirectional) {
                existingLink.bidirectional = true;
                
                // 如果使用D3引擎，需要更新连接
                if (this.simulation && this.useD3) {
                    this.simulation.force('link').links(this.links);
                    this.simulation.alpha(0.3).restart();
                }
                
                // 保存关系数据
                this.saveRelationships();
            }
            return;
        }
        
        // 创建新关系
        const newLink = {
            source: sourceId,
            target: targetId,
            bidirectional: bidirectional,
            relationship: "认识" // 默认关系名称
        };
        
        // 添加到links数组
        this.links.push(newLink);
        
        // 创建标签元素
        this.createLabelForLink(newLink);
        
        // 如果使用D3引擎，需要更新连接
        if (this.simulation && this.useD3) {
            this.simulation.force('link').links(this.links);
            this.simulation.alpha(0.3).restart();
        }
        
        // 保存关系数据
        this.saveRelationships();
        
        console.log("关系已添加，当前连接数:", this.links.length);
        
        // 激活标签编辑模式
        const linkId = `${sourceId}-${targetId}`;
        const label = this.labelElements[linkId];
        if (label) {
            this.activateLabelEdit(label, newLink);
        }
    },
    
    // 移除关系
    removeRelationship: function(link) {
        // 只在编辑模式下允许删除关系
        if (!this.isEditMode) return;
        
        const index = this.links.indexOf(link);
        if (index !== -1) {
            console.log("移除关系, 索引:", index);
            
            // 移除对应的标签元素
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const linkId = `${sourceId}-${targetId}`;
            
            if (this.labelElements[linkId]) {
                this.labelElements[linkId].remove();
                delete this.labelElements[linkId];
            }
            
            // 从links数组中移除
            this.links.splice(index, 1);
            
            // 如果使用D3引擎，需要更新连接
            if (this.simulation && this.useD3) {
                this.simulation.force('link').links(this.links);
                this.simulation.alpha(0.3).restart();
            }
            
            // 保存关系数据
            this.saveRelationships();
        }
    }
};

// 打开关系图谱模态窗口
function openRelationshipGraph() {
    console.log("打开关系图谱模态窗口");
    
    const graphModal = document.getElementById('graphModal');
    if (!graphModal) {
        console.error("找不到graphModal元素");
        return;
    }
    
    // 显示模态窗口
    graphModal.style.display = 'flex';
    
    // 延迟初始化图谱，确保模态窗口已显示
    setTimeout(function() {
        // 初始化并加载数据
        console.log("初始化图谱并加载数据");
        try {
            // 使用全局friendsData数组
            if (typeof window.friendsData !== 'undefined' && window.friendsData.length > 0) {
                RelationshipGraph.init('relationshipGraphContainer').loadData(window.friendsData);
            } else {
                // 如果找不到friendsData，使用默认测试数据
                const testData = [
                    { id: 1, name: "张三", emoji: "👨", birthdate: "1990-01-01", relationship: "朋友", location: "北京" },
                    { id: 2, name: "李四", emoji: "👩", birthdate: "1992-05-20", relationship: "同事", location: "上海" },
                    { id: 3, name: "王五", emoji: "👴", birthdate: "1985-10-15", relationship: "家人", location: "广州" }
                ];
                console.warn("未找到全局friendsData，使用测试数据");
                RelationshipGraph.init('relationshipGraphContainer').loadData(testData);
            }
        } catch (e) {
            console.error("图谱初始化失败:", e);
        }
    }, 100);
}

// 关闭关系图谱模态窗口
function closeGraphModal() {
    console.log("关闭关系图谱模态窗口");
    
    const graphModal = document.getElementById('graphModal');
    if (graphModal) {
        graphModal.style.display = 'none';
    }
}

// 添加ESC键关闭模态窗口事件监听
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const graphModal = document.getElementById('graphModal');
        if (graphModal && graphModal.style.display === 'flex') {
            closeGraphModal();
        }
    }
});
