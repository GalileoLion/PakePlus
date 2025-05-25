/**
 * settings.js
 * 应用设置管理模块
 */

const AppSettings = {
    STORAGE_KEY: 'relationshipManagerSettings',
    
    // 默认设置
    defaultSettings: {
        // 一般设置
        darkMode: false,
        language: 'zh-CN',
        
        // 情感分析设置
        useEmotionAnalysis: true, // 是否使用情感分析
        autoAnalyzeEvents: true,  // 是否自动分析新事件
        useApiForAnalysis: false, // 是否使用API（否则使用本地模拟分析）
        apiKey: "",               // API密钥
    },
    
    // 当前设置
    settings: {},
    
    // 初始化设置
    init: function() {
        this.loadSettings();
    },
    
    // 从本地存储加载设置
    loadSettings: function() {
        const savedSettings = localStorage.getItem(this.STORAGE_KEY);
        
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                this.settings = { ...this.defaultSettings, ...parsedSettings };
            } catch (error) {
                console.error('解析设置出错:', error);
                this.settings = { ...this.defaultSettings };
            }
        } else {
            this.settings = { ...this.defaultSettings };
            this.saveSettings();
        }
        
        console.log('已加载设置:', this.settings);
    },
    
    // 保存设置到本地存储
    saveSettings: function() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    },
    
    // 更新单个设置并保存
    updateSetting: function(key, value) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = value;
            this.saveSettings();
            return true;
        }
        return false;
    },
    
    // 重置所有设置为默认值
    resetSettings: function() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
    },
    
    // 打开设置面板
    openSettingsPanel: function() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (!settingsPanel) {
            this.createSettingsPanel();
        } else {
            this.updateSettingsPanel();
            settingsPanel.style.display = 'flex';
        }
    },
    
    // 关闭设置面板
    closeSettingsPanel: function() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.style.display = 'none';
        }
    },
    
    // 创建设置面板
    createSettingsPanel: function() {
        // 创建设置面板DOM元素
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settingsPanel';
        settingsPanel.className = 'settings-panel';
        
        settingsPanel.innerHTML = `
            <div class="settings-content">
                <div class="settings-header">
                    <h2>应用设置</h2>
                    <button class="close-btn" onclick="AppSettings.closeSettingsPanel()">×</button>
                </div>
                <div class="settings-body">
                    <div class="settings-section">
                        <h3>一般设置</h3>
                        <div class="setting-item">
                            <label for="darkModeToggle">
                                <span>深色模式</span>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="darkModeToggle" ${this.settings.darkMode ? 'checked' : ''} 
                                        onchange="AppSettings.updateSetting('darkMode', this.checked)">
                                    <span class="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>情感分析设置</h3>
                        <div class="setting-item">
                            <label for="useEmotionToggle">
                                <span>使用情感分析</span>
                                <div class="tooltip">ℹ️
                                    <span class="tooltip-text">开启后，系统会分析互动记录中的情感信息</span>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="useEmotionToggle" ${this.settings.useEmotionAnalysis ? 'checked' : ''}
                                        onchange="AppSettings.updateSetting('useEmotionAnalysis', this.checked)">
                                    <span class="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label for="autoAnalyzeToggle">
                                <span>自动分析新事件</span>
                                <div class="tooltip">ℹ️
                                    <span class="tooltip-text">开启后，添加新互动记录时会自动进行情感分析</span>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="autoAnalyzeToggle" ${this.settings.autoAnalyzeEvents ? 'checked' : ''}
                                        onchange="AppSettings.updateSetting('autoAnalyzeEvents', this.checked)">
                                    <span class="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label for="useApiToggle">
                                <span>使用API进行分析</span>
                                <div class="tooltip">ℹ️
                                    <span class="tooltip-text">开启后，使用大语言模型API进行精确分析。关闭则使用本地规则进行简单分析。</span>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="useApiToggle" ${this.settings.useApiForAnalysis ? 'checked' : ''}
                                        onchange="AppSettings.updateSetting('useApiForAnalysis', this.checked)">
                                    <span class="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="setting-item" id="apiKeySetting" style="${this.settings.useApiForAnalysis ? 'display:block' : 'display:none'}">
                            <label for="apiKeyInput">
                                <span>API密钥</span>
                                <div class="tooltip">ℹ️
                                    <span class="tooltip-text">输入您的大语言模型API密钥</span>
                                </div>
                            </label>
                            <input type="password" id="apiKeyInput" value="${this.settings.apiKey}" placeholder="输入API密钥">
                            <button class="save-btn" onclick="AppSettings.saveApiKey()">保存密钥</button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <div class="setting-actions">
                            <button class="reset-btn" onclick="AppSettings.resetSettingsPrompt()">恢复默认设置</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加设置面板样式
        this.addSettingsStyles();
        
        // 添加到文档
        document.body.appendChild(settingsPanel);
        
        // 绑定API开关与API密钥输入框的显示/隐藏关系
        const useApiToggle = document.getElementById('useApiToggle');
        const apiKeySetting = document.getElementById('apiKeySetting');
        
        useApiToggle.addEventListener('change', function() {
            apiKeySetting.style.display = this.checked ? 'block' : 'none';
        });
    },
    
    // 更新设置面板的值
    updateSettingsPanel: function() {
        // 更新开关状态
        document.getElementById('darkModeToggle').checked = this.settings.darkMode;
        document.getElementById('useEmotionToggle').checked = this.settings.useEmotionAnalysis;
        document.getElementById('autoAnalyzeToggle').checked = this.settings.autoAnalyzeEvents;
        document.getElementById('useApiToggle').checked = this.settings.useApiForAnalysis;
        
        // 更新API密钥设置区域
        const apiKeySetting = document.getElementById('apiKeySetting');
        if (apiKeySetting) {
            apiKeySetting.style.display = this.settings.useApiForAnalysis ? 'block' : 'none';
        }
        
        // 更新API密钥输入框
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (apiKeyInput) {
            apiKeyInput.value = this.settings.apiKey;
        }
    },
    
    // 保存API密钥
    saveApiKey: function() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput.value.trim();
        
        this.updateSetting('apiKey', apiKey);
        
        // 如果EmotionAnalyzer已加载，更新其API密钥
        if (window.EmotionAnalyzer) {
            EmotionAnalyzer.updateApiKey(apiKey);
        }
        
        alert('API密钥已保存');
    },
    
    // 重置设置前询问确认
    resetSettingsPrompt: function() {
        if (confirm('确定要将所有设置恢复为默认值吗？此操作无法撤销。')) {
            this.resetSettings();
            this.updateSettingsPanel();
            
            // 如果EmotionAnalyzer已加载，更新其API密钥
            if (window.EmotionAnalyzer) {
                EmotionAnalyzer.updateApiKey(this.settings.apiKey);
            }
            
            alert('已恢复默认设置');
        }
    },
    
    // 添加设置面板样式
    addSettingsStyles: function() {
        const styleEl = document.createElement('style');
        styleEl.id = 'settings-panel-styles';
        
        styleEl.textContent = `
            .settings-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .settings-content {
                background-color: white;
                border-radius: 8px;
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            .settings-header {
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .settings-header h2 {
                margin: 0;
                font-size: 1.2rem;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                color: #777;
            }
            
            .settings-body {
                padding: 20px;
            }
            
            .settings-section {
                margin-bottom: 20px;
            }
            
            .settings-section h3 {
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 1.1rem;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 8px;
            }
            
            .setting-item {
                margin-bottom: 15px;
                display: flex;
                flex-direction: column;
            }
            
            .setting-item label {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .setting-item label span {
                flex-grow: 1;
            }
            
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 46px;
                height: 24px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .toggle-slider {
                background-color: #4a6bdf;
            }
            
            input:focus + .toggle-slider {
                box-shadow: 0 0 1px #4a6bdf;
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(22px);
            }
            
            .setting-item input[type="text"],
            .setting-item input[type="password"] {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                width: 100%;
                margin-bottom: 8px;
            }
            
            .setting-actions {
                display: flex;
                justify-content: flex-end;
                margin-top: 10px;
            }
            
            .reset-btn {
                background-color: #f44336;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .save-btn {
                background-color: #4a6bdf;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 5px;
            }
            
            .tooltip {
                position: relative;
                display: inline-block;
                margin-left: 8px;
                cursor: help;
                color: #777;
            }
            
            .tooltip .tooltip-text {
                visibility: hidden;
                width: 200px;
                background-color: #333;
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 5px;
                position: absolute;
                z-index: 1;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                opacity: 0;
                transition: opacity 0.3s;
                font-size: 12px;
            }
            
            .tooltip:hover .tooltip-text {
                visibility: visible;
                opacity: 1;
            }
        `;
        
        document.head.appendChild(styleEl);
    }
};

// 初始化设置
document.addEventListener('DOMContentLoaded', function() {
    AppSettings.init();
});

// 在settings.js底部
// 确保AppSettings在全局可用
window.AppSettings = AppSettings;
console.log('AppSettings已导出到全局对象');
