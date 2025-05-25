/**
 * emotion-core.js
 * 情感分析核心功能模块
 * 用于计算和展示互动中的情感指标：好感度、熟悉度和自在度
 */

(function(window) {
    // 创建情感分析器对象
    const EmotionAnalyzer = {
        // API配置
        apiConfig: {
            apiKey: "",
            baseUrl: "https://api.deepseek.com",
            model: "deepseek-chat",
        },
        
        // 系统提示词
        systemPrompt: `
        请分析给定的互动描述文本，并评估以下三个指标（范围均为-10到10）：

        1. 好感度（-10到10）：表示用户对好友的情感倾向
           - 正面值(例如3~10)：表达出明显的爱慕、生理性喜欢、赞美、钦佩
           - 负面值(例如-3~-10)：表达出厌恶、嫌弃、指责、失望
           - 中性值(例如-2~2)：情感倾向不明显

        2. 熟悉度（-10到10）：表示用户对好友的认知变化
           - 正面值(例如3~10)：深入了解好友的喜好、特长、家庭背景、人生经历，增进相互了解
           - 负面值(例如-3~-10)：发现好友的陌生面或反差，感到"这不是我认识的那个人"，发现出人意料的一面，察觉到之前的认知是错误的，颠覆了原有印象
           - 中性值(例如-2~2)：对好友的认知基本维持原状

        3. 自在度（-10到10）：表示用户在互动过程中的舒适程度
           - 正面值(例如3~10)：互动轻松愉快，感到亲切、舒适、自在
           - 负面值(例如-3~-10)：互动感到尴尬、紧张、不自在、疏离
           - 中性值(例如-2~2)：没有明显的舒适或不适感受

        特别注意：
        - 当文本中出现"陌生"、"不是我认识的"、"原来他是这样的人"、"看错他了"等表达时，这通常表示熟悉度出现负向变化（负值）
        - 惊讶、震惊的情绪反应可能与熟悉度降低相关，尤其是当这种惊讶来自对好友认知的改变
        - "三观不合"、"价值观差异"等描述往往同时影响好感度（负向）和熟悉度（负向）

        请以JSON格式返回分析结果，包括分值和简短理由：
        {
            "liking": <-10到10的整数>,
            "likingReason": "<简短说明好感度评分的理由>",
            "familiarity": <-10到10的整数>,
            "familiarityReason": "<简短说明熟悉度评分的理由>",
            "comfort": <-10到10的整数>,
            "comfortReason": "<简短说明自在度评分的理由>"
        }
        `,
        
        // 初始化
        init: function(apiKey) {
            // 设置API密钥
            this.apiConfig.apiKey = apiKey || "";
            
            // 添加情感分析相关样式
            this.addEmotionStyles();
            
            console.log("EmotionAnalyzer 初始化完成");
        },
        
        // 更新API密钥
        updateApiKey: function(apiKey) {
            this.apiConfig.apiKey = apiKey || "";
        },
        
        // 添加情感样式
        addEmotionStyles: function() {
            // 创建样式元素
            const styleEl = document.createElement('style');
            styleEl.id = 'emotion-analyzer-styles';
            
            // 定义样式内容
            styleEl.textContent = `
                .emotion-indicators {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                    font-size: 12px;
                    color: #777;
                    align-items: center;
                }
                
                .emotion-indicator {
                    display: flex;
                    align-items: center;
                    position: relative;
                }
                
                .emotion-icon {
                    cursor: help;
                    font-size: 14px;
                }
                
                .emotion-value {
                    font-weight: 500;
                    margin-left: 2px;
                    min-width: 16px;
                }
                
                .emotion-positive {
                    color: #10b981;
                }
                
                .emotion-negative {
                    color: #ef4444;
                }
                
                .emotion-neutral {
                    color: #777;
                }
                
                .emotion-tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: normal;
                    z-index: 100;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.2s, visibility 0.2s;
                    margin-bottom: 5px;
                    width: max-content;
                    max-width: 250px;
                    text-align: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    pointer-events: none;
                }
                
                .emotion-icon:hover + .emotion-tooltip {
                    opacity: 1;
                    visibility: visible;
                }
                
                .emotion-recalc-btn {
                    background: none;
                    border: none;
                    font-size: 14px;
                    padding: 0;
                    margin-left: 5px;
                    cursor: pointer;
                    color: #777;
                    transition: transform 0.2s ease;
                    opacity: 0.7;
                }
                
                .emotion-recalc-btn:hover {
                    transform: rotate(30deg);
                    color: #4a6bdf;
                    opacity: 1;
                }
                
                .emotion-action {
                    margin-left: auto;
                }
            `;
            
            // 将样式添加到文档头部
            if (!document.getElementById('emotion-analyzer-styles')) {
                document.head.appendChild(styleEl);
            }
        },
        
        // 分析文本
        analyze: async function(text, useMock = true) {
            if (!text) return null;
            
            try {
                // 根据参数决定使用模拟数据还是API
                if (useMock || !this.apiConfig.apiKey) {
                    return this.getMockResponse(text);
                } else {
                    return await this.callApi(text);
                }
            } catch (error) {
                console.error('情感分析出错:', error);
                return null;
            }
        },
        
        // 调用API进行分析
        callApi: async function(text) {
            try {
                const response = await fetch(this.apiConfig.baseUrl + '/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.apiConfig.model,
                        messages: [
                            { role: "system", content: this.systemPrompt },
                            { role: "user", content: text }
                        ],
                        response_format: { type: "json_object" }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API响应错误: ${response.status}`);
                }
                
                const data = await response.json();
                return JSON.parse(data.choices[0].message.content);
            } catch (error) {
                console.error('API请求失败:', error);
                throw error;
            }
        },
        
        // 获取模拟响应（无需API）
        getMockResponse: function(text) {
            // 好感度关键词
            const positiveWords = ['喜欢', '开心', '快乐', '愉快', '享受', '欣赏', '感谢', '温暖', '美好', '亲切', '舒适'];
            const negativeWords = ['讨厌', '厌恶', '生气', '失望', '烦躁', '渣男', '看错', '反感'];
            
            // 熟悉度关键词
            const familiarityPosWords = ['了解', '共同点', '兴趣相投', '爱好相似', '深入交流', '分享', '相似'];
            const familiarityNegWords = ['陌生', '不是我认识的', '原来他是这样', '看错他', '震惊', '没想到', '居然', '三观不合', '渣男'];
            
            // 自在度关键词
            const comfortPosWords = ['放松', '自在', '舒服', '畅所欲言', '无拘束', '亲切', '如沐春风'];
            const comfortNegWords = ['尴尬', '不自在', '紧张', '拘束', '疏离', '冷场', '局促', '不安'];
            
            let liking = 0, familiarity = 0, comfort = 0;
            
            // 计算好感度
            for (const word of positiveWords) {
                if (text.includes(word)) liking += 2;
            }
            for (const word of negativeWords) {
                if (text.includes(word)) liking -= 3; // 加大负面词汇的权重
            }
            
            // 计算熟悉度 
            for (const word of familiarityPosWords) {
                if (text.includes(word)) familiarity += 2;
            }
            for (const word of familiarityNegWords) {
                if (text.includes(word)) familiarity -= 3; // 加大负面词汇的权重
            }
            
            // 计算自在度
            for (const word of comfortPosWords) {
                if (text.includes(word)) comfort += 2;
            }
            for (const word of comfortNegWords) {
                if (text.includes(word)) comfort -= 2;
            }
            
            // 特定组合的模式检测
            if (text.includes('陌生') && (text.includes('他') || text.includes('她'))) {
                familiarity -= 5; // 强化"陌生感"对熟悉度的负面影响
            }
            
            if (text.includes('渣男') || text.includes('渣女')) {
                liking -= 5;
                familiarity -= 4; // "渣男/渣女"标签通常表示认知被颠覆
            }
            
            // 检测类似于"这还是我认识的他吗"的句式
            if (text.includes('这还是') && text.includes('认识的')) {
                familiarity -= 7; // 这种表达强烈暗示了熟悉度的下降
            }
            
            // 限制在-10到10的范围内
            liking = Math.max(-10, Math.min(10, liking));
            familiarity = Math.max(-10, Math.min(10, familiarity));
            comfort = Math.max(-10, Math.min(10, comfort));
            
            // 准备原因说明
            let likingReason = liking > 4 
                ? "用户表达了明显的喜爱或欣赏" 
                : liking < -4 
                    ? "用户表达了明显的失望或反感" 
                    : "用户的情感倾向相对中性";
                    
            let familiarityReason = familiarity > 4 
                ? "用户增进了对好友的了解" 
                : familiarity < -4 
                    ? "用户发现好友与自己认知中的形象有很大差异，感到陌生" 
                    : "用户对好友的认知没有明显变化";
                    
            let comfortReason = comfort > 4 
                ? "用户在互动中感到舒适和自在" 
                : comfort < -4 
                    ? "用户在互动中感到不适或尴尬" 
                    : "用户没有表达出明显的舒适度变化";
            
            return {
                liking: Math.round(liking),
                likingReason,
                familiarity: Math.round(familiarity),
                familiarityReason,
                comfort: Math.round(comfort),
                comfortReason
            };
        },
        
        // 创建情感指标显示HTML - 简化版本只显示图标+数值
        createEmotionHTML: function(emotion, friendId, eventIndex) {
            if (!emotion) return '';
            
            const likingClass = emotion.liking > 0 ? 'emotion-positive' : (emotion.liking < 0 ? 'emotion-negative' : 'emotion-neutral');
            const familiarityClass = emotion.familiarity > 0 ? 'emotion-positive' : (emotion.familiarity < 0 ? 'emotion-negative' : 'emotion-neutral');
            const comfortClass = emotion.comfort > 0 ? 'emotion-positive' : (emotion.comfort < 0 ? 'emotion-negative' : 'emotion-neutral');
            
            return `
                <div class="emotion-indicators">
                    <div class="emotion-indicator">
                        <span class="emotion-icon ${likingClass}" title="好感度">❣️</span>
                        <span class="emotion-tooltip">${emotion.likingReason || '好感度分析'}</span>
                        <span class="emotion-value ${likingClass}">${emotion.liking}</span>
                    </div>
                    <div class="emotion-indicator">
                        <span class="emotion-icon ${familiarityClass}" title="熟悉度">🔍</span>
                        <span class="emotion-tooltip">${emotion.familiarityReason || '熟悉度分析'}</span>
                        <span class="emotion-value ${familiarityClass}">${emotion.familiarity}</span>
                    </div>
                    <div class="emotion-indicator">
                        <span class="emotion-icon ${comfortClass}" title="自在度">😌</span>
                        <span class="emotion-tooltip">${emotion.comfortReason || '自在度分析'}</span>
                        <span class="emotion-value ${comfortClass}">${emotion.comfort}</span>
                    </div>
                    <div class="emotion-action">
                        <button class="emotion-recalc-btn" title="重新分析" onclick="window.recalculateEmotion(${friendId}, ${eventIndex})">🔄</button>
                    </div>
                </div>
            `;
        },
        
        // 创建加载中的情感指标HTML - 使用省略号表示加载状态
        createLoadingEmotionHTML: function() {
            return `
                <div class="emotion-indicators">
                    <div class="emotion-indicator">
                        <span class="emotion-icon" title="好感度">❣️</span>
                        <span class="emotion-value">…</span>
                    </div>
                    <div class="emotion-indicator">
                        <span class="emotion-icon" title="熟悉度">🔍</span>
                        <span class="emotion-value">…</span>
                    </div>
                    <div class="emotion-indicator">
                        <span class="emotion-icon" title="自在度">😌</span>
                        <span class="emotion-value">…</span>
                    </div>
                </div>
            `;
        },
        
        // 批量分析事件，用于处理历史数据
        batchAnalyzeEvents: function(friendsData, callback) {
            if (!Array.isArray(friendsData)) {
                console.error('无效的friendsData，期望数组格式');
                return;
            }
            
            let totalEvents = 0;
            let analyzedEvents = 0;
            let pendingAnalysis = 0;
            
            // 统计需要分析的事件总数
            friendsData.forEach(friend => {
                if (friend.events && Array.isArray(friend.events)) {
                    friend.events.forEach(event => {
                        if (!event.emotion) {
                            totalEvents++;
                        }
                    });
                }
            });
            
            if (totalEvents === 0) {
                console.log('没有事件需要分析');
                if (typeof callback === 'function') callback();
                return;
            }
            
            console.log(`开始批量分析 ${totalEvents} 个事件`);
            
            // 分析所有缺少emotion的事件
            friendsData.forEach(friend => {
                if (friend.events && Array.isArray(friend.events)) {
                    friend.events.forEach((event, index) => {
                        if (!event.emotion && event.content) {
                            pendingAnalysis++;
                            
                            // 使用setTimeout避免同时发起太多请求
                            setTimeout(() => {
                                this.analyze(event.content, true) // 使用模拟数据
                                    .then(emotion => {
                                        if (emotion) {
                                            event.emotion = emotion;
                                        }
                                        analyzedEvents++;
                                        pendingAnalysis--;
                                        
                                        // 完成所有分析后保存并回调
                                        if (analyzedEvents === totalEvents && pendingAnalysis === 0) {
                                            console.log('所有事件分析完成');
                                            if (typeof callback === 'function') callback();
                                        }
                                    })
                                    .catch(error => {
                                        console.error('批量分析出错:', error);
                                        analyzedEvents++;
                                        pendingAnalysis--;
                                        
                                        if (analyzedEvents === totalEvents && pendingAnalysis === 0) {
                                            console.log('所有事件分析完成（含错误）');
                                            if (typeof callback === 'function') callback();
                                        }
                                    });
                            }, index * 50); // 错开分析时间
                        }
                    });
                }
            });
        },
        
        // 以下为调试工具相关功能，供独立页面使用
        
        // 加载并显示调试工具
        loadDebugTool: function() {
            // 创建调试界面
            document.body.innerHTML = `
            <div class="container">
                <h1>互动情感分析器调试工具</h1>
                <div class="form-group">
                    <label for="debugApiKey">API Key:</label>
                    <input type="password" id="debugApiKey" placeholder="输入您的API key">
                    <button id="debugSaveApiKey">保存</button>
                </div>
                <div class="analyzer-section">
                    <h2>分析互动记录</h2>
                    <div class="form-group">
                        <label for="debugEventText">互动描述:</label>
                        <textarea id="debugEventText" rows="4" placeholder="输入互动描述文本...例如: 今天和他一起去看电影，聊得很开心，发现我们有很多共同爱好。"></textarea>
                    </div>
                    <button id="debugAnalyzeBtn">分析情感</button>
                    <div id="debugExamples">
                        <h3>示例文本:</h3>
                        <button class="example-btn" data-text="今天和他一起去看电影，聊得很开心，发现我们有很多共同爱好。">正向例子</button>
                        <button class="example-btn" data-text="见面后感觉很尴尬，找不到共同话题，草草结束了聚会。">负向例子</button>
                        <button class="example-btn" data-text="偶然得知他喜欢收集邮票，这是我从未了解过的一面。">中性例子</button>
                        <button class="example-btn" data-text="他居然是个渣男？！这还是我认识的他吗？好陌生。">反差例子</button>
                    </div>
                    
                    <div id="debugMockSwitch">
                        <label>
                            <input type="checkbox" id="debugUseMock" checked>
                            使用模拟数据 (无需API)
                        </label>
                    </div>
                    
                    <div id="debugResults" class="hidden">
                        <h3>分析结果:</h3>
                        <div class="result-section">
                            <div class="indicator">
                                <span class="label">好感度:</span>
                                <div class="meter-container">
                                    <div class="meter">
                                        <div id="debugLikingMeter" class="meter-fill"></div>
                                    </div>
                                    <span id="debugLikingValue" class="value">0</span>
                                </div>
                            </div>
                            <div id="debugLikingReason" class="reason"></div>
                        </div>
                        
                        <div class="result-section">
                            <div class="indicator">
                                <span class="label">熟悉度:</span>
                                <div class="meter-container">
                                    <div class="meter">
                                        <div id="debugFamiliarityMeter" class="meter-fill"></div>
                                    </div>
                                    <span id="debugFamiliarityValue" class="value">0</span>
                                </div>
                            </div>
                            <div id="debugFamiliarityReason" class="reason"></div>
                        </div>
                        
                        <div class="result-section">
                            <div class="indicator">
                                <span class="label">自在度:</span>
                                <div class="meter-container">
                                    <div class="meter">
                                        <div id="debugComfortMeter" class="meter-fill"></div>
                                    </div>
                                    <span id="debugComfortValue" class="value">0</span>
                                </div>
                            </div>
                            <div id="debugComfortReason" class="reason"></div>
                        </div>
                        
                        <div class="raw-json">
                            <h3>原始JSON响应:</h3>
                            <pre id="debugRawJson"></pre>
                        </div>
                        
                        <div class="preview-section">
                            <h3>在应用中的显示效果预览:</h3>
                            <div id="previewDisplay" class="preview-display"></div>
                        </div>
                    </div>
                    
                    <div id="debugLoading" class="hidden">
                        <div class="spinner"></div>
                        <p>分析中，请稍候...</p>
                    </div>
                    
                    <div id="debugError" class="hidden">
                        <p class="error-message">分析出错，请重试。</p>
                    </div>
                </div>
            </div>
            `;
            
            // 添加调试样式
            this.addDebugStyles();
            
            // 绑定调试事件
            this.bindDebugEvents();
            
            console.log("情感分析调试工具已加载");
        },
        
        // 添加调试工具样式
        addDebugStyles: function() {
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f7fa;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #4a6bdf;
                    text-align: center;
                    margin-bottom: 20px;
                }
                h2, h3 {
                    color: #4a6bdf;
                    margin-top: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                input[type="text"], input[type="password"], textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 16px;
                    box-sizing: border-box;
                    margin-bottom: 10px;
                }
                button {
                    background-color: #4a6bdf;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-right: 5px;
                    transition: background-color 0.2s;
                }
                button:hover {
                    background-color: #3a5bcf;
                }
                .hidden {
                    display: none;
                }
                .result-section {
                    margin-bottom: 20px;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #4a6bdf;
                }
                .indicator {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .label {
                    min-width: 80px;
                    font-weight: 600;
                }
                .meter-container {
                    display: flex;
                    align-items: center;
                    flex-grow: 1;
                }
                .meter {
                    height: 20px;
                    background-color: #e0e0e0;
                    width: 100%;
                    border-radius: 10px;
                    position: relative;
                    overflow: hidden;
                    margin-right: 10px;
                }
                .meter-fill {
                    height: 100%;
                    background-color: #4caf50;
                    width: 50%;
                    border-radius: 10px;
                    transition: all 0.5s ease;
                    position: relative;
                }
                .value {
                    font-weight: bold;
                    min-width: 30px;
                    text-align: right;
                }
                .reason {
                    margin-top: 5px;
                    font-style: italic;
                    color: #666;
                }
                .raw-json {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: #f1f1f1;
                    border-radius: 6px;
                    overflow-x: auto;
                }
                pre {
                    white-space: pre-wrap;
                    margin: 0;
                }
                #debugExamples {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f0f4ff;
                    border-radius: 6px;
                    border-left: 4px solid #4a6bdf;
                }
                .example-btn {
                    margin-top: 10px;
                    padding: 8px 15px;
                    background-color: #e0e7ff;
                    color: #3a5bcf;
                }
                #debugMockSwitch {
                    margin: 15px 0;
                    display: flex;
                    align-items: center;
                }
                #debugMockSwitch input {
                    margin-right: 8px;
                }
                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top: 4px solid #4a6bdf;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .error-message {
                    color: #e74c3c;
                    background-color: #fdeaeb;
                    padding: 10px;
                    border-radius: 6px;
                    text-align: center;
                    margin: 15px 0;
                }
                .preview-section {
                    margin-top: 20px;
                    padding: 15px;
                    border-top: 1px solid #eee;
                }
                .preview-display {
                    background-color: #fff;
                    padding: 15px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    margin-top: 10px;
                }
            `;
            
            document.head.appendChild(styleEl);
        },
        
        // 绑定调试事件
        bindDebugEvents: function() {
            // 分析按钮
            document.getElementById('debugAnalyzeBtn').addEventListener('click', () => {
                const eventText = document.getElementById('debugEventText').value.trim();
                if (!eventText) {
                    alert('请输入互动描述文本');
                    return;
                }
                
                const useMock = document.getElementById('debugUseMock').checked;
                
                this.showDebugLoading();
                
                // 进行分析
                const analyzePromise = useMock ? 
                    Promise.resolve(this.getMockResponse(eventText)) : 
                    this.callApi(eventText);
                
                analyzePromise
                    .then(result => {
                        this.displayDebugResults(result);
                        
                        // 显示预览
                        const previewHTML = this.createEmotionHTML(result, 999, 0);
                        document.getElementById('previewDisplay').innerHTML = `
                            <div class="event-content">${eventText}</div>
                            ${previewHTML}
                        `;
                    })
                    .catch(error => {
                        console.error('分析错误:', error);
                        this.showDebugError();
                    });
            });
            
            // 示例按钮
            document.querySelectorAll('.example-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.getElementById('debugEventText').value = e.target.dataset.text;
                });
            });
            
            // 保存API密钥
            document.getElementById('debugSaveApiKey').addEventListener('click', () => {
                const apiKey = document.getElementById('debugApiKey').value.trim();
                if (apiKey) {
                    this.apiConfig.apiKey = apiKey;
                    localStorage.setItem('emotion_analyzer_api_key', apiKey);
                    alert('API密钥已保存');
                } else {
                    alert('请输入有效的API密钥');
                }
            });
            
            // 加载保存的API密钥
            const savedApiKey = localStorage.getItem('emotion_analyzer_api_key');
            if (savedApiKey) {
                document.getElementById('debugApiKey').value = savedApiKey;
                this.apiConfig.apiKey = savedApiKey;
            }
        },
        
        // 显示调试工具的加载状态
        showDebugLoading: function() {
            document.getElementById('debugLoading').classList.remove('hidden');
            document.getElementById('debugResults').classList.add('hidden');
            document.getElementById('debugError').classList.add('hidden');
        },
        
        // 隐藏调试工具的加载状态
        hideDebugLoading: function() {
            document.getElementById('debugLoading').classList.add('hidden');
        },
        
        // 显示调试工具的错误信息
        showDebugError: function() {
            this.hideDebugLoading();
            document.getElementById('debugError').classList.remove('hidden');
        },
        
        // 显示调试工具的分析结果
        displayDebugResults: function(result) {
            this.hideDebugLoading();
            document.getElementById('debugResults').classList.remove('hidden');
            
            // 更新仪表盘
            this.updateDebugMeter('Liking', result.liking);
            this.updateDebugMeter('Familiarity', result.familiarity);
            this.updateDebugMeter('Comfort', result.comfort);
            
            // 更新原因说明
            document.getElementById('debugLikingReason').textContent = result.likingReason;
            document.getElementById('debugFamiliarityReason').textContent = result.familiarityReason;
            document.getElementById('debugComfortReason').textContent = result.comfortReason;
            
            // 更新原始JSON
            document.getElementById('debugRawJson').textContent = JSON.stringify(result, null, 2);
        },
        
        // 更新调试仪表盘
        updateDebugMeter: function(type, value) {
            const meter = document.getElementById(`debug${type}Meter`);
            const valueElement = document.getElementById(`debug${type}Value`);
            
            if (!meter || !valueElement) return;
            
            // 设置数值
            valueElement.textContent = value;
            
            // 计算填充宽度百分比
            const percentage = ((value + 10) / 20) * 100;
            meter.style.width = `${percentage}%`;
            
            // 设置颜色
            if (value > 0) {
                meter.style.backgroundColor = '#4caf50'; // 绿色，积极
            } else if (value < 0) {
                meter.style.backgroundColor = '#f44336'; // 红色，消极
            } else {
                meter.style.backgroundColor = '#9e9e9e'; // 灰色，中性
            }
        }
    };

    // 定义全局重新分析函数
// 全局定义重新分析函数
function recalculateEmotion(friendId, eventIndex) {
    console.log('重新分析情感:', friendId, eventIndex);
    
    // 使用全局window对象明确访问friendsData
    if (!window.friendsData || !Array.isArray(window.friendsData)) {
        console.error('friendsData未定义或不是数组，无法分析');
        console.log('当前window.friendsData:', window.friendsData);
        return;
    }
    
    // 获取事件内容
    const friend = window.friendsData.find(f => f.id === friendId);
    if (!friend || !friend.events[eventIndex]) {
        console.error('找不到指定的好友或事件:', friendId, eventIndex);
        return;
    }
    
    const event = friend.events[eventIndex];
    const eventContent = event.content;
    
    // 确定是否使用API
    const useApi = window.AppSettings && 
                  window.AppSettings.settings && 
                  window.AppSettings.settings.useApiForAnalysis;
    
    // 更新UI为加载中状态
    const eventElement = document.getElementById(`event-${friendId}-${eventIndex}`);
    if (eventElement) {
        const emotionContainer = eventElement.querySelector('.emotion-indicators');
        if (emotionContainer) {
            emotionContainer.outerHTML = window.EmotionAnalyzer.createLoadingEmotionHTML();
        }
    }
    
    console.log('开始分析内容:', eventContent);
    
    // 分析情感
    window.EmotionAnalyzer.analyze(eventContent, !useApi)
        .then(emotion => {
            console.log('分析结果:', emotion);
            if (!emotion) return;
            
            // 更新事件的情感数据
            event.emotion = emotion;
            
            // 保存到本地存储
            if (typeof window.saveData === 'function') {
                window.saveData();
            } else {
                console.error('saveData函数未定义，尝试手动保存');
                // 尝试手动保存
                localStorage.setItem('relationshipManagerData', JSON.stringify(window.friendsData));
            }
            
            // 更新UI显示
            if (eventElement) {
                const emotionContainer = eventElement.querySelector('.emotion-indicators');
                if (emotionContainer) {
                    emotionContainer.outerHTML = window.EmotionAnalyzer.createEmotionHTML(emotion, friendId, eventIndex);
                }
            }
        })
        .catch(error => {
            console.error('情感分析出错:', error);
        });
}

    // 直接初始化以避免依赖项问题
    document.addEventListener('DOMContentLoaded', function() {
        // 一些基本初始化，不依赖其他组件
        EmotionAnalyzer.addEmotionStyles();
        
        console.log('EmotionAnalyzer基础初始化完成');

        // 如果是调试页面，加载调试工具
        if (window.location.pathname.includes('emotion-debug')) {
            EmotionAnalyzer.loadDebugTool();
        }
    });

    // 导出到全局对象
    window.EmotionAnalyzer = EmotionAnalyzer;
    window.recalculateEmotion = recalculateEmotion;
    
    console.log('EmotionAnalyzer已导出到全局对象');

// 设置一个间隔检查AppSettings是否已加载
let appSettingsCheckInterval = setInterval(function() {
    if (window.AppSettings && window.AppSettings.settings) {
        clearInterval(appSettingsCheckInterval);
        const apiKey = window.AppSettings.settings.apiKey || "";
        EmotionAnalyzer.updateApiKey(apiKey);
        console.log('从AppSettings获取到API密钥，长度:', apiKey ? apiKey.length : 0);
        
        // 手动将AppSettings导出到window对象，确保全局可用
        if (!window.AppSettings) {
            window.AppSettings = window.AppSettings;
            console.log('手动导出AppSettings到全局');
        }
    }
}, 500);

    // 确保在5秒后停止检查，避免无限循环
    setTimeout(function() {
        clearInterval(appSettingsCheckInterval);
    }, 5000);
})(window);
