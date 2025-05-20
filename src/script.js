const STORAGE_KEY = 'relationshipManagerData';

const defaultFriendsData = [
    {
        id: 1,
        emoji: "👨",
        name: "张伟",
        age: 32,
        relationship: "同事",
        location: "北京",
        tags: [
            { text: "篮球", type: "hobby" },
            { text: "技术宅", type: "hobby" },
            { text: "咖啡爱好者", type: "hobby" },
            { text: "电影迷", type: "hobby" }
        ],
        events: [
            { date: "2023-10-15", content: "一起参加了公司组织的篮球比赛，他表现出色拿了MVP。" },
            { date: "2023-09-28", content: "推荐了一部科幻电影《星际穿越》，周末一起观影后讨论了剧情。" },
            { date: "2023-08-10", content: "帮他解决了一个技术难题，他请我喝了咖啡表示感谢。" },
            { date: "2023-06-05", content: "公司团建时发现我们都喜欢打篮球，约好每周三下班后一起打球。" }
        ]
    },
    {
        id: 2,
        emoji: "👩",
        name: "李娜",
        age: 28,
        relationship: "大学同学",
        location: "上海",
        tags: [
            { text: "旅行", type: "hobby" },
            { text: "摄影", type: "hobby" },
            { text: "美食", type: "hobby" },
            { text: "闺蜜", type: "friend" }
        ],
        events: [
            { date: "2023-11-02", content: "她刚从日本旅行回来，给我带了抹茶巧克力和精美的明信片。" },
            { date: "2023-09-15", content: "一起庆祝了她的生日，在一家新开的意大利餐厅用餐。" },
            { date: "2023-07-22", content: "周末一起去郊外拍照，她教我使用单反相机的技巧。" },
            { date: "2023-05-18", content: "她帮我修改了简历，给了我很多求职建议。" }
        ]
    }
];

let currentFriendId = 1;
let friendsData = [];
let currentTags = [];
let isEditMode = false;
let isEventEditMode = false;

function initPage() {
    loadData();
    renderFriendsNav();
    renderFriendCard(currentFriendId);
    setupEmojiSelector();
    setupFormValidation();
    setupFormSubmit();
    setupEventFormValidation();
    setupEventFormSubmit();
}

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        friendsData = JSON.parse(savedData);
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

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

function renderFriendsNav() {
    const friendsNav = document.getElementById('friendsNav');
    friendsNav.innerHTML = '';
    
    friendsData.forEach(friend => {
        const navItem = document.createElement('div');
        navItem.className = `friend-nav-item ${friend.id === currentFriendId ? 'active' : ''}`;
        navItem.textContent = friend.emoji;
        navItem.onclick = () => switchFriend(friend.id);
        friendsNav.appendChild(navItem);
    });
    
    const addBtn = document.createElement('button');
    addBtn.className = 'add-friend-btn';
    addBtn.textContent = '+';
    addBtn.onclick = openAddModal;
    friendsNav.appendChild(addBtn);
}

function renderFriendCard(friendId) {
    const friend = friendsData.find(f => f.id === friendId);
    if (!friend) return;
    
    const friendCard = document.getElementById('friendCard');
    
    const tagsHtml = friend.tags.map(tag => 
        `<span class="tag ${tag.type}">${tag.text}</span>`
    ).join('');
    
    const eventsHtml = friend.events.map((event, index) => `
        <div class="timeline-item">
            <div class="event-date-display">${formatDisplayDate(event.date)}</div>
            <div class="event-item" data-date="${formatDisplayDate(event.date)}">
                <div class="event-actions">
                    <button class="event-action" onclick="editEvent(${friend.id}, ${index})">✏️</button>
                    <button class="event-action" onclick="deleteEventPrompt(${friend.id}, ${index})">🗑️</button>
                </div>
                <div class="event-content">${event.content}</div>
            </div>
        </div>
    `).join('');
    
    friendCard.innerHTML = `
        <button class="edit-btn" onclick="openEditModal(${friend.id})">✏️</button>
        <div class="friend-header">
            <div class="friend-avatar">${friend.emoji}</div>
            <div class="friend-info">
                <h1 class="friend-name">${friend.name}</h1>
                <div class="friend-meta">${friend.age}岁 · ${friend.relationship} · ${friend.location}</div>
                <div class="tags-container">
                    ${tagsHtml}
                </div>
            </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="events-section">
            <div class="events-header">
                <h3>近期互动</h3>
                <button class="add-event-btn" onclick="openEventModal(${friend.id})">+</button>
            </div>
            <div class="timeline">
                ${eventsHtml}
            </div>
        </div>
    `;
}

function switchFriend(friendId) {
    currentFriendId = friendId;
    renderFriendsNav();
    renderFriendCard(friendId);
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

// 修改setupEmojiSelector函数中的自定义输入处理
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
    
    if (fieldName === 'age') {
        const age = parseInt(field.value);
        if (isNaN(age) || age < 1 || age > 120) {
            field.classList.add('error');
            field.classList.remove('success');
            if (errorElement) errorElement.textContent = '请输入有效的年龄(1-120)';
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
        const age = parseInt(formData.get('age'));
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
                    age,
                    relationship,
                    location,
                    tags: [...currentTags]
                };
            }
        } else {
            const newFriend = {
                id,
                emoji,
                name,
                age,
                relationship,
                location,
                tags: [...currentTags],
                events: firstEvent ? [
                    { date: new Date().toISOString().split('T')[0], content: firstEvent },
                    ...friendsData.find(f => f.id === id)?.events || []
                ] : [...friendsData.find(f => f.id === id)?.events || []]
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
        
        if (isEventEditMode && eventIndex >= 0) {
            friend.events[eventIndex] = { date, content };
        } else {
            friend.events.unshift({ date, content });
        }
        
        saveData();
        renderFriendCard(friendId);
        closeEventModal();
    });
}

// 修复模态框问题，添加事件冒泡阻止
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
    document.getElementById('friendAge').value = friend.age;
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

window.onload = initPage;