/**
 * 本地文件同步插件 - 与 WebDAV 同步并行使用
 */

const LocalSync = {
    // 导出数据到文件
    exportData: function() {
        // 准备要导出的数据
        const dataToExport = {
            data: friendsData,
            lastModified: new Date().toISOString()
        };
        
        // 创建 Blob 并下载
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'relationship-data.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        this.showNotification('数据已导出到文件', 'success');
    },
    
    // 从文件导入数据
    importData: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const content = event.target.result;
                    const importedData = JSON.parse(content);
                    
                    if (importedData && importedData.data) {
                        friendsData = importedData.data;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(friendsData));
                        localStorage.setItem('last-modified', importedData.lastModified || new Date().toISOString());
                        
                        // 刷新界面
                        renderFriendsNav();
                        renderFriendCard(currentFriendId);
                        
                        this.showNotification('数据已成功导入', 'success');
                    } else {
                        throw new Error('文件格式无效');
                    }
                } catch (error) {
                    this.showNotification('导入失败: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    },
    
    // 显示通知
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#4a6bdf'};
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },
    
    // 添加按钮到界面 - 调整了位置以避免与 WebDAV 按钮重叠
    addButtons: function() {
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(10px); }
            }
            
            .local-sync-btn:hover {
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);
        
        // 导出按钮
        const exportBtn = document.createElement('button');
        exportBtn.innerHTML = '⬇️';
        exportBtn.title = '导出数据到本地';
        exportBtn.className = 'local-sync-btn';
        exportBtn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #4a6bdf;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 900;
            transition: transform 0.2s ease;
        `;
        exportBtn.addEventListener('click', () => this.exportData());
        
        // 导入按钮
        const importBtn = document.createElement('button');
        importBtn.innerHTML = '⬆️';
        importBtn.title = '从本地文件导入数据';
        importBtn.className = 'local-sync-btn';
        importBtn.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #10b981;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 900;
            transition: transform 0.2s ease;
        `;
        importBtn.addEventListener('click', () => this.importData());
        
        document.body.appendChild(exportBtn);
        document.body.appendChild(importBtn);
    }
};

// 初始化
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        LocalSync.addButtons();
    }, 1000);
});