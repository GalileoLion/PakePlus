const STORAGE_KEY = 'relationshipManagerData';

const defaultFriendsData = [
    {
        id: 1,
        emoji: "👨",
        name: "张伟",
        birthdate: "1993-05-15", // 修改为生日
        relationship: "同事",
        location: "北京",
        tags: [
            { text: "篮球", type: "hobby" },
            { text: "技术宅", type: "hobby" },
            { text: "咖啡爱好者", type: "hobby" },
            { text: "电影迷", type: "hobby" }
        ],
        events: [
            { 
                date: "2023-10-15", 
                content: "一起参加了公司组织的篮球比赛，他表现出色拿了MVP。",
                emotion: {
                    liking: 5,
                    likingReason: "用户表达了对好友篮球技能的欣赏",
                    familiarity: 2,
                    familiarityReason: "通过共同活动增进了解",
                    comfort: 4,
                    comfortReason: "在活动中感到轻松愉快"
                }
            },
            { 
                date: "2023-09-28", 
                content: "推荐了一部科幻电影《星际穿越》，周末一起观影后讨论了剧情。",
                emotion: {
                    liking: 4,
                    likingReason: "用户对共同爱好表达了欣赏",
                    familiarity: 3,
                    familiarityReason: "通过讨论电影加深了解",
                    comfort: 5,
                    comfortReason: "在讨论中表现得很放松"
                }
            },
            { 
                date: "2023-08-10", 
                content: "帮他解决了一个技术难题，他请我喝了咖啡表示感谢。",
                emotion: {
                    liking: 3,
                    likingReason: "在互助中体验积极情感",
                    familiarity: 2,
                    familiarityReason: "了解彼此的专业能力",
                    comfort: 4,
                    comfortReason: "互动过程轻松自然"
                }
            },
            { 
                date: "2023-06-05", 
                content: "公司团建时发现我们都喜欢打篮球，约好每周三下班后一起打球。",
                emotion: {
                    liking: 4,
                    likingReason: "发现共同爱好带来好感",
                    familiarity: 3,
                    familiarityReason: "了解对方的兴趣爱好",
                    comfort: 3,
                    comfortReason: "感到适度轻松"
                }
            }
        ]
    },
    {
        id: 2,
        emoji: "👩",
        name: "李娜",
        birthdate: "1997-03-22", // 修改为生日
        relationship: "大学同学",
        location: "上海",
        tags: [
            { text: "旅行", type: "hobby" },
            { text: "摄影", type: "hobby" },
            { text: "美食", type: "hobby" },
            { text: "闺蜜", type: "friend" }
        ],
        events: [
            { 
                date: "2023-11-02", 
                content: "她刚从日本旅行回来，给我带了抹茶巧克力和精美的明信片。",
                emotion: {
                    liking: 6,
                    likingReason: "对好友的贴心表达明显喜爱",
                    familiarity: 2,
                    familiarityReason: "了解好友的旅行记忆",
                    comfort: 5,
                    comfortReason: "互动中感到十分温暖"
                }
            },
            { 
                date: "2023-09-15", 
                content: "一起庆祝了她的生日，在一家新开的意大利餐厅用餐。",
                emotion: {
                    liking: 5,
                    likingReason: "在重要日子共度时光表示关心",
                    familiarity: 3,
                    familiarityReason: "了解更多个人喜好",
                    comfort: 4,
                    comfortReason: "在用餐氛围中放松愉快"
                }
            },
            { 
                date: "2023-07-22", 
                content: "周末一起去郊外拍照，她教我使用单反相机的技巧。",
                emotion: {
                    liking: 4,
                    likingReason: "分享技能中增进好感",
                    familiarity: 4,
                    familiarityReason: "了解对方的专业技能",
                    comfort: 5,
                    comfortReason: "在户外活动中非常自在"
                }
            },
            { 
                date: "2023-05-18", 
                content: "她帮我修改了简历，给了我很多求职建议。",
                emotion: {
                    liking: 5,
                    likingReason: "感谢对方的帮助和支持",
                    familiarity: 3,
                    familiarityReason: "了解彼此的职业规划",
                    comfort: 4,
                    comfortReason: "在交流中感到支持和理解"
                }
            }
        ]
    }
];

let currentFriendId = 1;
let friendsData = [];
let currentTags = [];
let isEditMode = false;
let isEventEditMode = false;
let dragSrcElement = null;

function initPage() {
    loadData();
    
    // 确保friendsData是全局变量
    window.friendsData = friendsData;
    console.log('已将friendsData导出到全局作用域');
    
    updateTrianglePosition();
    
    // 检查是否需要对已有事件进行情感分析
    if (window.EmotionAnalyzer) {
        // 分析所有没有情感数据的事件
        EmotionAnalyzer.batchAnalyzeEvents(friendsData, function() {
            // 分析完成后保存数据
            saveData();
            // 然后渲染UI
            renderFriendsNav();
            renderFriendCard(currentFriendId);
        });
    } else {
        // 如果EmotionAnalyzer不可用，直接渲染
        renderFriendsNav();
        renderFriendCard(currentFriendId);
    }
    
    // 确保saveData函数是全局可用的
    window.saveData = saveData;
    
    setupEmojiSelector();
    setupFormValidation();
    setupFormSubmit();
    setupEventFormValidation();
    setupEventFormSubmit();
    
    // 检测全局变量可用性
    console.log('全局变量检查:', {
        'window.friendsData可用': window.friendsData !== undefined,
        'window.saveData可用': typeof window.saveData === 'function',
        'window.EmotionAnalyzer可用': window.EmotionAnalyzer !== undefined,
        'window.AppSettings可用': window.AppSettings !== undefined
    });
    
    // 位置三角形
    setTimeout(positionCardTriangle, 100);
    window.addEventListener('resize', debounce(positionCardTriangle, 250));
    window.addEventListener('orientationchange', debounce(positionCardTriangle, 250));
    window.addEventListener('scroll', debounce(positionCardTriangle, 250));
    
    // 确保EmotionAnalyzer已定义后再初始化
    if (window.EmotionAnalyzer) {
        // 尝试获取API密钥
        let apiKey = "";
        if (window.AppSettings && window.AppSettings.settings) {
            apiKey = window.AppSettings.settings.apiKey || "";
        } else if (localStorage.getItem('relationshipManagerSettings')) {
            // 尝试直接从localStorage获取
            try {
                const settings = JSON.parse(localStorage.getItem('relationshipManagerSettings'));
                apiKey = settings.apiKey || "";
                console.log('从本地存储直接获取API密钥');
            } catch (e) {
                console.error('解析本地存储的设置出错:', e);
            }
        }
        
        EmotionAnalyzer.init(apiKey);
        console.log('情感分析器初始化完成，apiKey长度:', apiKey ? apiKey.length : 0);
    } else {
        console.warn('EmotionAnalyzer未定义，请确保emotion-core.js正确加载');
        // 检查脚本是否加载
        const scripts = document.getElementsByTagName('script');
        let emotionScriptFound = false;
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.includes('emotion-core.js')) {
                emotionScriptFound = true;
                break;
            }
        }
        console.log('emotion-core.js脚本' + (emotionScriptFound ? '已找到' : '未找到'));
    }
}

// 添加debounce函数以防止过度触发事件
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// 添加函数用于分析事件情感
function analyzeEventEmotion(friendId, eventIndex) {
    console.log('开始分析事件情感:', friendId, eventIndex);
    
    const friend = friendsData.find(f => f.id === friendId);
    if (!friend || !friend.events[eventIndex]) {
        console.error('找不到指定的好友或事件');
        return;
    }
    
    const event = friend.events[eventIndex];
    if (event.emotion) {
        console.log('该事件已有情感分析数据:', event.emotion);
        return; // 已有情感数据，不重复分析
    }
    
    const eventContent = event.content;
    
    // 确定是否使用API
    const useApi = window.AppSettings && 
                   AppSettings.settings && 
                   AppSettings.settings.useApiForAnalysis;
    
    // 确保EmotionAnalyzer可用
    if (!window.EmotionAnalyzer) {
        console.error('EmotionAnalyzer不可用，无法进行情感分析');
        return;
    }
    
    // 查找DOM元素
    const eventElement = document.getElementById(`event-${friendId}-${eventIndex}`);
    if (!eventElement) {
        console.error(`找不到事件元素: event-${friendId}-${eventIndex}`);
        return;
    }
    
    // 查找事件内容元素
    const eventContentElement = eventElement.querySelector('.event-content');
    if (!eventContentElement) {
        console.error('找不到事件内容元素');
        return;
    }
    
    // 查找是否已有情感指标容器
    let emotionContainer = eventElement.querySelector('.emotion-indicators');
    
    // 如果没有情感容器，创建一个加载状态的容器
    if (!emotionContainer) {
        console.log('未找到情感容器，创建加载状态');
        const loadingHtml = EmotionAnalyzer.createLoadingEmotionHTML();
        eventContentElement.insertAdjacentHTML('afterend', loadingHtml);
    } else {
        // 更新现有容器为加载状态
        emotionContainer.outerHTML = EmotionAnalyzer.createLoadingEmotionHTML();
    }
    
    // 进行情感分析
    console.log('调用情感分析API，内容:', eventContent);
    EmotionAnalyzer.analyze(eventContent, !useApi)
        .then(emotion => {
            if (!emotion) {
                console.error('情感分析结果为空');
                return;
            }
            
            console.log('情感分析结果:', emotion);
            
            // 更新事件的情感数据
            event.emotion = emotion;
            
            // 保存到本地存储
            saveData();
            
            // 重新查找元素，因为DOM可能已经变化
            const updatedEventElement = document.getElementById(`event-${friendId}-${eventIndex}`);
            if (updatedEventElement) {
                const updatedEmotionContainer = updatedEventElement.querySelector('.emotion-indicators');
                if (updatedEmotionContainer) {
                    console.log('更新情感容器的HTML');
                    updatedEmotionContainer.outerHTML = EmotionAnalyzer.createEmotionHTML(emotion, friendId, eventIndex);
                } else {
                    console.log('找不到情感容器，添加新的');
                    const eventContentEl = updatedEventElement.querySelector('.event-content');
                    if (eventContentEl) {
                        eventContentEl.insertAdjacentHTML('afterend', EmotionAnalyzer.createEmotionHTML(emotion, friendId, eventIndex));
                    }
                }
            } else {
                console.error('找不到更新后的事件元素');
            }
        })
        .catch(error => {
            console.error('情感分析出错:', error);
        });
}

function positionCardTriangle() {
    const activeNavItem = document.querySelector('.friend-nav-item.active');
    const friendCard = document.getElementById('friendCard');
    
    if (activeNavItem && friendCard) {
        // Get the positions and dimensions
        const navRect = activeNavItem.getBoundingClientRect();
        const cardRect = friendCard.getBoundingClientRect();
        
        // Calculate the center position of the active nav item
        const navCenterX = navRect.left + (navRect.width / 2);
        
        // Calculate the horizontal position relative to the card
        const trianglePosition = navCenterX - cardRect.left;
        
        // Apply the position to the triangle with a small adjustment to ensure perfect centering
        friendCard.style.setProperty('--triangle-position', `${trianglePosition}px`);
    }
}

function updateTrianglePosition() {
    const style = document.createElement('style');
    style.textContent = `
        .friend-card::before {
            left: var(--triangle-position, 40px);
        }
    `;
    document.head.appendChild(style);
}

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        friendsData = JSON.parse(savedData);
        // 兼容旧数据：将age转换为birthdate
        friendsData = friendsData.map(friend => {
            if (!friend.birthdate && friend.age) {
                // 根据年龄估算生日（设为当年减去年龄年的1月1日）
                const currentYear = new Date().getFullYear();
                friend.birthdate = `${currentYear - friend.age}-01-01`;
            }
            return friend;
        });
        
        if (friendsData.length > 0) {
            currentFriendId = friendsData[0].id;
        }
    } else {
        friendsData = JSON.parse(JSON.stringify(defaultFriendsData));
        saveData();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(friendsData));
}

// 计算年龄的函数
function calculateAge(birthdate) {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

// 格式化生日为中文显示格式
function formatBirthdate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
}

function handleDragStart(e) {
    dragSrcElement = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-friend-id'));
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter() {
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (dragSrcElement !== this) {
        const srcFriendId = parseInt(e.dataTransfer.getData('text/plain'));
        const destFriendId = parseInt(this.getAttribute('data-friend-id'));
        
        const srcIndex = friendsData.findIndex(f => f.id === srcFriendId);
        const destIndex = friendsData.findIndex(f => f.id === destFriendId);
        
        if (srcIndex !== -1 && destIndex !== -1) {
            // 重新排序数组
            const [movedItem] = friendsData.splice(srcIndex, 1);
            friendsData.splice(destIndex, 0, movedItem);
            
            // 保存到本地存储并重新渲染
            saveData();
            renderFriendsNav();
        }
    }
    
    return false;
}

function handleDragEnd() {
    // 移除所有的拖拽相关样式
    const items = document.querySelectorAll('.friend-nav-item');
    items.forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
    });
}

function renderFriendsNav() {
    const friendsNav = document.getElementById('friendsNav');
    friendsNav.innerHTML = '';
    
    // First add the add button to ensure it's in the first position
    const addBtn = document.createElement('button');
    addBtn.className = 'add-friend-btn';
    addBtn.textContent = '+';
    addBtn.onclick = openAddModal;
    friendsNav.appendChild(addBtn);
    
    // Then add all friend items
    friendsData.forEach(friend => {
        const navItem = document.createElement('div');
        navItem.className = `friend-nav-item ${friend.id === currentFriendId ? 'active' : ''}`;
        navItem.textContent = friend.emoji;
        navItem.setAttribute('data-friend-id', friend.id);
        navItem.onclick = () => switchFriend(friend.id);
        
        // 添加拖拽属性和事件监听
        navItem.setAttribute('draggable', 'true');
        navItem.addEventListener('dragstart', handleDragStart);
        navItem.addEventListener('dragover', handleDragOver);
        navItem.addEventListener('dragenter', handleDragEnter);
        navItem.addEventListener('dragleave', handleDragLeave);
        navItem.addEventListener('drop', handleDrop);
        navItem.addEventListener('dragend', handleDragEnd);
        
        friendsNav.appendChild(navItem);
    });
}

function renderFriendCard(friendId) {
    const friend = friendsData.find(f => f.id === friendId);
    if (!friend) return;
    
    const friendCard = document.getElementById('friendCard');
    
    const tagsHtml = friend.tags.map(tag => 
        `<span class="tag ${tag.type}">${tag.text}</span>`
    ).join('');
    
    // 修改这部分代码，添加情感指标显示
    const eventsHtml = friend.events.map((event, index) => {
        // 检查是否有情感数据，或者是否需要分析
        let emotionHtml = '';
        
        if (event.emotion) {
            // 已有情感数据，直接显示
            emotionHtml = window.EmotionAnalyzer ? 
                EmotionAnalyzer.createEmotionHTML(event.emotion, friend.id, index) : '';
        } else if (window.AppSettings && 
                  AppSettings.settings && 
                  AppSettings.settings.useEmotionAnalysis && 
                  AppSettings.settings.autoAnalyzeEvents && 
                  window.EmotionAnalyzer) {
            // 需要分析情感，显示加载状态
            emotionHtml = EmotionAnalyzer.createLoadingEmotionHTML();
            // 使用setTimeout避免阻塞渲染
            setTimeout(() => {
                analyzeEventEmotion(friendId, index);
            }, 100 * (index + 1)); // 添加间隔时间避免同时请求太多
        }
        
        return `
            <div class="timeline-item" id="event-${friendId}-${index}">
                <div class="event-date-display">${formatDisplayDate(event.date)}</div>
                <div class="event-item" data-date="${formatDisplayDate(event.date)}">
                    <div class="event-actions">
                        <button class="event-action" onclick="editEvent(${friend.id}, ${index})">✏️</button>
                        <button class="event-action" onclick="deleteEventPrompt(${friend.id}, ${index})">🗑️</button>
                    </div>
                    <div class="event-content">${event.content}</div>
                    ${emotionHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // 计算年龄
    const age = calculateAge(friend.birthdate);
    
    friendCard.innerHTML = `
        <button class="edit-btn" onclick="openEditModal(${friend.id})">✏️</button>
        <div class="friend-header">
            <div class="friend-avatar">${friend.emoji}</div>
            <div class="friend-info">
                <h1 class="friend-name">${friend.name}</h1>
                <div class="friend-meta">${age}岁 · ${friend.relationship} · ${friend.location}</div>
                <div class="tags-container">
                    ${tagsHtml}
                </div>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="events-section">
            <div class="events-header">
                <h3>近期互动</h3>
                <div class="events-actions">
                    <button class="add-event-btn" onclick="openEventModal(${friend.id})">+</button>
                    <button class="graph-btn" onclick="openRelationshipGraph()">🌐</button>
                </div>
            </div>
            <div class="timeline">
                ${eventsHtml}
            </div>
        </div>
    `;
    
    // Position the triangle after the card is rendered
    setTimeout(positionCardTriangle, 0);
}

function switchFriend(friendId) {
    currentFriendId = friendId;
    renderFriendsNav();
    renderFriendCard(friendId);
    
    // Position the triangle after rendering the card
    setTimeout(positionCardTriangle, 50); // Small delay to ensure DOM is updated
}

function showCustomEmojiInput(button) {
    const input = document.getElementById('customEmojiInput');
    button.style.display = 'none';  // 隐藏加号按钮
    input.style.display = 'flex';   // 显示输入框
    input.value = '';               // 清空输入框
    input.focus();                  // 聚焦输入框

    // 添加失去焦点时的处理
    input.onblur = function() {
        if (!this.value) {         // 如果没有输入内容
            this.style.display = 'none';
            button.style.display = 'flex';
        }
    };
    
    // 添加回车键确认处理
    input.onkeydown = function(e) {
        if (e.key === 'Enter') {
            this.blur();           // 触发blur事件
        }
    };
}

function setupEmojiSelector() {
    const emojiOptions = document.querySelectorAll('.emoji-option:not(.emoji-option-input)');
    const customInput = document.getElementById('customEmojiInput');
    
    emojiOptions.forEach(option => {
        if (option.textContent !== '＋') {
            option.addEventListener('click', function() {
                emojiOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('friendEmoji').value = this.getAttribute('data-emoji');
                // 重置自定义输入框状态
                const plusButton = document.querySelector('.emoji-option[onclick^="showCustomEmojiInput"]');
                customInput.style.display = 'none';
                customInput.value = '';
                if (plusButton) plusButton.style.display = 'flex';
            });
        }
    });
    
    customInput.addEventListener('input', function() {
        if (this.value) {
            document.getElementById('friendEmoji').value = this.value;
            emojiOptions.forEach(opt => opt.classList.remove('selected'));
        }
    });
}

function validateField(field) {
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    if (!field.value.trim()) {
        field.classList.add('error');
        field.classList.remove('success');
        if (errorElement) errorElement.textContent = '此字段为必填项';
        return false;
    }
    
    if (fieldName === 'birthdate') {
        const birthdate = new Date(field.value);
        const today = new Date();
        if (isNaN(birthdate.getTime()) || birthdate > today) {
            field.classList.add('error');
            field.classList.remove('success');
            if (errorElement) errorElement.textContent = '请输入有效的生日日期';
            return false;
        }
    }
    
    field.classList.add('success');
    field.classList.remove('error');
    if (errorElement) errorElement.textContent = '';
    return true;
}

function validateForm() {
    const form = document.getElementById('friendForm');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        const result = validateField(input);
        if (!result) isValid = false;
    });
    
    return isValid;
}

function setupFormValidation() {
    const form = document.getElementById('friendForm');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateField(this);
        });
    });
}

function setupFormSubmit() {
    const form = document.getElementById('friendForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const formData = new FormData(this);
        const id = parseInt(formData.get('id')) || Date.now();
        const emoji = formData.get('emoji');
        const name = formData.get('name');
        const birthdate = formData.get('birthdate');
        const relationship = formData.get('relationship');
        const location = formData.get('location');
        const firstEvent = formData.get('firstEvent');
        
        if (isEditMode) {
            const friendIndex = friendsData.findIndex(f => f.id === id);
            if (friendIndex !== -1) {
                friendsData[friendIndex] = {
                    ...friendsData[friendIndex],
                    emoji,
                    name,
                    birthdate,
                    relationship,
                    location,
                    tags: [...currentTags]
                };
            }
        } else {
            const newEvents = [];
            if (firstEvent) {
                // 添加第一个事件
                const newEvent = { 
                    date: new Date().toISOString().split('T')[0], 
                    content: firstEvent 
                };
                
                // 如果配置了自动分析，在稍后分析
                newEvents.push(newEvent);
            }
            
            const newFriend = {
                id,
                emoji,
                name,
                birthdate,
                relationship,
                location,
                tags: [...currentTags],
                events: [...newEvents, ...(friendsData.find(f => f.id === id)?.events || [])]
            };
            
            friendsData.unshift(newFriend);
        }
        
        saveData();
        currentFriendId = id;
        renderFriendsNav();
        renderFriendCard(id);
        closeModal();
    });
}

function validateEventField(field) {
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    if (!field.value.trim()) {
        field.classList.add('error');
        field.classList.remove('success');
        if (errorElement) errorElement.textContent = '此字段为必填项';
        return false;
    }
    
    field.classList.add('success');
    field.classList.remove('error');
    if (errorElement) errorElement.textContent = '';
    return true;
}

function validateEventForm() {
    const form = document.getElementById('eventForm');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        const result = validateEventField(input);
        if (!result) isValid = false;
    });
    
    return isValid;
}

function setupEventFormValidation() {
    const form = document.getElementById('eventForm');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateEventField(this);
        });
    });
}

function setupEventFormSubmit() {
    const form = document.getElementById('eventForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateEventForm()) return;
        
        const formData = new FormData(this);
        const friendId = parseInt(formData.get('friendId'));
        const eventIndex = parseInt(formData.get('eventIndex'));
        const date = formData.get('date');
        const content = formData.get('content');
        
        const friend = friendsData.find(f => f.id === friendId);
        if (!friend) return;
        
        let newEventIndex = 0; // 默认新事件索引
        
        if (isEventEditMode && !isNaN(eventIndex) && eventIndex >= 0) {
            // 编辑现有事件，清除原有情感数据
            friend.events[eventIndex] = { date, content };
            newEventIndex = eventIndex;
        } else {
            // 添加新事件
            friend.events.unshift({ date, content });
            // 新事件被添加到数组开头，所以索引是0
            newEventIndex = 0;
        }
        
        saveData();
        closeEventModal();
        
        // 渲染更新后的卡片
        renderFriendCard(friendId);
        
        // 明确的延时，确保DOM更新后再分析
        setTimeout(() => {
            console.log('准备分析事件:', friendId, newEventIndex);
            // 检查是否开启了自动分析
            if (window.AppSettings && 
                AppSettings.settings && 
                AppSettings.settings.useEmotionAnalysis && 
                AppSettings.settings.autoAnalyzeEvents && 
                window.EmotionAnalyzer) {
                console.log('自动分析已开启，开始分析事件');
                analyzeEventEmotion(friendId, newEventIndex);
            } else {
                console.log('自动分析未开启或相关组件未加载完成');
            }
        }, 300);
    });
}

function openEventModal(friendId, eventIndex = null) {
    if (event) event.stopPropagation();
    
    isEventEditMode = eventIndex !== null;
    document.getElementById('eventModalTitle').textContent = isEventEditMode ? '编辑互动' : '添加互动';
    document.getElementById('deleteEventBtn').style.display = isEventEditMode ? 'block' : 'none';
    
    document.getElementById('eventFriendId').value = friendId;
    document.getElementById('eventIndex').value = eventIndex !== null ? eventIndex : '';
    
    if (isEventEditMode) {
        const event = friendsData.find(f => f.id === friendId).events[eventIndex];
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventContent').value = event.content;
    } else {
        document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('eventContent').value = '';
    }
    
    document.getElementById('eventModal').style.display = 'flex';
}

function editEvent(friendId, eventIndex) {
    if (event) event.stopPropagation();
    openEventModal(friendId, eventIndex);
}

function deleteEventPrompt(friendId, eventIndex) {
    if (event) event.stopPropagation();
    if (confirm('确定要删除这条互动记录吗？此操作无法撤销。')) {
        deleteEvent(friendId, eventIndex);
    }
}

function deleteEvent(friendId, eventIndex) {
    // 如果未传入参数，则从表单中获取
    if (friendId === undefined || eventIndex === undefined) {
        friendId = parseInt(document.getElementById('eventFriendId').value);
        eventIndex = parseInt(document.getElementById('eventIndex').value);
    }
    
    const friend = friendsData.find(f => f.id === friendId);
    if (friend && friend.events[eventIndex]) {
        friend.events.splice(eventIndex, 1);
        saveData();
        renderFriendCard(friendId);
        closeEventModal();
    }
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
}

function openAddModal() {
    isEditMode = false;
    currentTags = [];
    
    document.getElementById('modalTitle').textContent = '添加新好友';
    document.getElementById('firstEventGroup').style.display = 'block';
    document.getElementById('modalFooter').innerHTML = `
        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">保存</button>
    `;
    
    document.getElementById('friendForm').reset();
    document.getElementById('friendId').value = '';
    document.getElementById('modalTags').innerHTML = '';
    document.getElementById('customEmojiInput').style.display = 'none';
    document.getElementById('customEmojiInput').value = '';
    
    // 设置默认日期为空
    document.getElementById('friendBirthdate').value = '';
    
    const emojiOptions = document.querySelectorAll('.emoji-option:not(.emoji-option-input)');
    emojiOptions.forEach(opt => {
        opt.style.display = 'flex';
        opt.classList.remove('selected');
    });
    
    if (emojiOptions.length > 0) {
        emojiOptions[0].classList.add('selected');
        document.getElementById('friendEmoji').value = emojiOptions[0].getAttribute('data-emoji');
    }
    
    document.getElementById('friendModal').style.display = 'flex';
}

function openEditModal(friendId) {
    if (event) event.stopPropagation();
    
    isEditMode = true;
    const friend = friendsData.find(f => f.id === friendId);
    if (!friend) return;
    
    currentTags = [...friend.tags];
    
    document.getElementById('modalTitle').textContent = '编辑好友信息';
    document.getElementById('firstEventGroup').style.display = 'none';
    document.getElementById('modalFooter').innerHTML = `
        <button type="button" class="btn btn-danger" onclick="deleteFriend(${friendId})">删除好友</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">保存更改</button>
    `;
    
    document.getElementById('friendId').value = friend.id;
    document.getElementById('friendName').value = friend.name;
    document.getElementById('friendBirthdate').value = friend.birthdate || '';
    document.getElementById('friendRelationship').value = friend.relationship;
    document.getElementById('friendLocation').value = friend.location;
    document.getElementById('friendEmoji').value = friend.emoji;
    
    const emojiOptions = document.querySelectorAll('.emoji-option:not(.emoji-option-input)');
    emojiOptions.forEach(option => {
        option.style.display = 'flex';
        option.classList.remove('selected');
        if (option.getAttribute('data-emoji') === friend.emoji) {
            option.classList.add('selected');
        }
    });
    
    document.getElementById('customEmojiInput').style.display = 'none';
    document.getElementById('customEmojiInput').value = '';
    
    renderModalTags();
    document.getElementById('friendModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('friendModal').style.display = 'none';
}

function addTag() {
    const tagInput = document.getElementById('tagInput');
    const tagType = document.getElementById('tagType').value;
    const tagText = tagInput.value.trim();
    
    if (tagText) {
        currentTags.push({ text: tagText, type: tagType });
        renderModalTags();
        tagInput.value = '';
    }
}

function renderModalTags() {
    const modalTags = document.getElementById('modalTags');
    modalTags.innerHTML = '';
    
    currentTags.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.className = `modal-tag ${tag.type}`;
        tagElement.innerHTML = `
            ${tag.text}
            <span class="remove-tag" onclick="removeTag(${index})">×</span>
        `;
        modalTags.appendChild(tagElement);
    });
}

function removeTag(index) {
    currentTags.splice(index, 1);
    renderModalTags();
}

function deleteFriend(friendId) {
    if (confirm('确定要删除这个好友吗？此操作无法撤销。')) {
        friendsData = friendsData.filter(f => f.id !== friendId);
        saveData();
        
        if (friendsData.length > 0) {
            currentFriendId = friendsData[0].id;
        } else {
            currentFriendId = 0;
        }
        
        renderFriendsNav();
        if (currentFriendId > 0) {
            renderFriendCard(currentFriendId);
        } else {
            document.getElementById('friendCard').innerHTML = '<p>暂无好友，请添加新好友</p>';
        }
        
        closeModal();
    }
}

// 关系图谱相关函数
function openRelationshipGraph() {
    const graphModal = document.getElementById('graphModal');
    graphModal.style.display = 'flex';
    
    // 将friendsData转换为图谱需要的格式
    const graphData = friendsData.map(friend => ({
        id: friend.id,
        name: friend.name,
        emoji: friend.emoji,
        birthdate: friend.birthdate,
        relationship: friend.relationship,
        location: friend.location
    }));
    
    // 延迟初始化图谱，确保模态窗口已经显示
    setTimeout(function() {
        if (typeof RelationshipGraph !== 'undefined') {
            RelationshipGraph.init('relationshipGraphContainer').loadData(graphData);
        } else {
            console.error('RelationshipGraph not found. Make sure relationship-graph.js is loaded.');
        }
    }, 100);
}

function closeGraphModal() {
    document.getElementById('graphModal').style.display = 'none';
}

// 添加Escape键关闭图谱模态窗口的事件监听器
document.addEventListener('keydown', function(e) {
    const graphModal = document.getElementById('graphModal');
    if (e.key === 'Escape' && graphModal && graphModal.style.display === 'flex') {
        graphModal.style.display = 'none';
    }
});

window.onload = initPage;
