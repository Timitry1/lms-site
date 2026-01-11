// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const API_BASE = 'https://lms-backend-2ft2.onrender.com'; // URL вашего backend сервера

// ============================================
// ИНИЦИАЛИЗАЦИЯ И СИНХРОНИЗАЦИЯ
// ============================================

// Инициализация localStorage при первом запуске
function initStorage() {
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify({}));
    }
    if (!localStorage.getItem('lessons')) {
        localStorage.setItem('lessons', JSON.stringify({}));
    }
    if (!localStorage.getItem('roadmaps')) {
        localStorage.setItem('roadmaps', JSON.stringify({}));
    }
}

// Флаг для предотвращения одновременных синхронизаций
let isSyncing = false;

// Обновление статуса синхронизации
function updateSyncStatus(status, message) {
    const statusEl = document.getElementById('syncStatus');
    if (!statusEl) return;
    
    statusEl.className = `sync-status ${status}`;
    const icon = statusEl.querySelector('span:first-child');
    const text = statusEl.querySelector('span:last-child');
    
    if (icon) {
        icon.textContent = '●';
        icon.style.color = {
            'ready': '#64748b',
            'syncing': '#f59e0b',
            'success': '#10b981',
            'error': '#ef4444'
        }[status] || '#64748b';
    }
    if (text) {
        text.textContent = message;
    }
}

// Синхронизация данных с сервером
async function syncToServer() {
    if (!API_BASE || isSyncing) return;
    
    isSyncing = true;
    updateSyncStatus('syncing', 'Синхронизация...');
    
    try {
        const payload = {
            students: JSON.parse(localStorage.getItem('students') || '{}'),
            lessons: JSON.parse(localStorage.getItem('lessons') || '{}'),
            roadmaps: JSON.parse(localStorage.getItem('roadmaps') || '{}')
        };
        
        const url = API_BASE.replace(/\/$/, '') + '/sync';
        console.log('🔄 Попытка синхронизации с:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Сервер не найден. Проверьте, что на Render.com создан Web Service (не Static Site)!');
            }
            throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Данные успешно синхронизированы:', result);
        
        updateSyncStatus('success', 'Синхронизировано');
        setTimeout(() => updateSyncStatus('ready', 'Готов к синхронизации'), 2000);
        
    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);
        console.error('💡 Проверьте:');
        console.error('   1. На Render.com создан Web Service (не Static Site)');
        console.error('   2. URL в API_BASE правильный:', API_BASE);
        console.error('   3. Сервер запущен (проверьте логи на Render.com)');
        
        updateSyncStatus('error', 'Ошибка синхронизации');
        setTimeout(() => updateSyncStatus('ready', 'Готов к синхронизации'), 3000);
    } finally {
        isSyncing = false;
    }
}

// Загрузка данных с сервера
async function syncFromServer() {
    if (!API_BASE || isSyncing) return;
    
    isSyncing = true;
    updateSyncStatus('syncing', 'Загрузка данных...');
    
    try {
        const url = API_BASE.replace(/\/$/, '') + '/sync';
        console.log('🔄 Попытка загрузки данных с:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Сервер не найден. Проверьте, что на Render.com создан Web Service (не Static Site)!');
            }
            throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Данные успешно загружены:', data);
        
        // Сохраняем данные с сервера
        if (data.students) localStorage.setItem('students', JSON.stringify(data.students));
        if (data.lessons) localStorage.setItem('lessons', JSON.stringify(data.lessons));
        if (data.roadmaps) localStorage.setItem('roadmaps', JSON.stringify(data.roadmaps));
        
        updateSyncStatus('success', 'Данные загружены');
        setTimeout(() => updateSyncStatus('ready', 'Готов к синхронизации'), 2000);
        
        // Обновляем UI
        refreshUI();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        console.error('💡 Проверьте:');
        console.error('   1. На Render.com создан Web Service (не Static Site)');
        console.error('   2. URL в API_BASE правильный:', API_BASE);
        console.error('   3. Сервер запущен (проверьте логи на Render.com)');
        
        updateSyncStatus('error', 'Ошибка загрузки');
        showAlert('Ошибка синхронизации. Проверьте консоль (F12) для деталей.', 'error');
        setTimeout(() => updateSyncStatus('ready', 'Готов к синхронизации'), 3000);
    } finally {
        isSyncing = false;
    }
}

// Обновление UI после загрузки данных
function refreshUI() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'admin') {
        loadAdminContent();
        if (currentStudentId) {
            loadStudentAdmin(currentStudentId);
        }
    } else if (user.role === 'student' && user.id) {
        loadStudentContent(user.id);
    }
}

// ============================================
// АВТОРИЗАЦИЯ
// ============================================

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    initStorage();
    
    // Проверка и отладка API_BASE
    console.log('🔧 Конфигурация:');
    console.log('   API_BASE:', API_BASE || 'НЕ УСТАНОВЛЕН!');
    
    if (!API_BASE || API_BASE.trim() === '') {
        console.warn('⚠️ API_BASE не установлен! Синхронизация не будет работать.');
        console.warn('💡 Установите API_BASE в script.js на строке 4');
    } else {
        console.log('✅ API_BASE установлен, начинаем синхронизацию...');
        // Автоматическая загрузка данных с сервера при загрузке
        await syncFromServer();
    }
    
    const path = window.location.pathname.split('/').pop();
    if (path === 'index.html' || path === '' || !path) {
        checkLogin();
    } else {
        loadDashboard(path);
    }
});

// Обработка формы входа
function checkLogin() {
    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!form) return;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Проверка админа
        if (email === 'admin' && password === 'admin') {
            localStorage.setItem('user', JSON.stringify({ id: 'admin', role: 'admin' }));
            window.location.href = 'admin.html';
            return;
        }
        
        // Проверка ученика
        const students = JSON.parse(localStorage.getItem('students') || '{}');
        if (students[email] && students[email].password === password) {
            localStorage.setItem('user', JSON.stringify({
                id: email,
                role: 'student',
                name: students[email].name
            }));
            window.location.href = 'student.html';
            return;
        }
        
        // Ошибка входа
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.className = 'alert alert-error';
            errorMessage.textContent = 'Неверный логин или пароль';
        }
    };
}

// Загрузка dashboard
function loadDashboard(page) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user || !user.role) {
        window.location.href = 'index.html';
        return;
    }
    
    if (page === 'admin.html' && user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    if (page === 'student.html' && user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    if (user.role === 'student') {
        document.getElementById('studentDash').style.display = 'block';
        document.getElementById('studentNameDisp').textContent = user.name || 'Ученик';
        loadStudentContent(user.id);
    } else if (user.role === 'admin') {
        document.getElementById('adminDash').style.display = 'block';
        loadAdminContent();
    }
}

// Выход из системы
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ============================================
// АДМИН-ПАНЕЛЬ
// ============================================

let currentStudentId = '';

// Загрузка списка учеников
function loadAdminContent() {
    const students = JSON.parse(localStorage.getItem('students') || '{}');
    const list = document.getElementById('studentsList');
    
    if (!list) return;
    
    list.innerHTML = '';
    
    if (Object.keys(students).length === 0) {
        list.innerHTML = '<li class="empty-state"><div class="empty-state-icon">👥</div><p>Нет учеников. Добавьте первого ученика выше.</p></li>';
        return;
    }
    
    Object.keys(students).forEach(id => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
            <div class="list-item-title">${students[id].name}</div>
            <div class="list-item-meta">ID: ${id}</div>
            <button onclick="loadStudentAdmin('${id}')" class="btn btn-primary btn-small" style="margin-top: 8px;">
                Выбрать для редактирования
            </button>
        `;
        list.appendChild(li);
    });
}

// Добавление ученика
async function addStudent() {
    const id = document.getElementById('studentId').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const password = document.getElementById('studentPassword').value.trim() || '12345';
    
    if (!id || !name) {
        showAlert('Заполните ID и имя ученика', 'error');
        return;
    }
    
    const students = JSON.parse(localStorage.getItem('students') || '{}');
    
    if (students[id]) {
        showAlert('Ученик с таким ID уже существует', 'error');
        return;
    }
    
    students[id] = { name, password };
    localStorage.setItem('students', JSON.stringify(students));
    
    // Очистка полей
    document.getElementById('studentId').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('studentPassword').value = '';
    
    loadAdminContent();
    await syncToServer();
    showAlert('Ученик успешно добавлен', 'success');
}

// Загрузка данных ученика для редактирования
function loadStudentAdmin(id) {
    currentStudentId = id;
    const students = JSON.parse(localStorage.getItem('students') || '{}');
    document.getElementById('currentStudent').textContent = students[id]?.name || id;
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '{}')[id] || [];
    const lessonsList = document.getElementById('lessonsList');
    
    if (lessonsList) {
        lessonsList.innerHTML = '';
        if (lessons.length === 0) {
            lessonsList.innerHTML = '<li class="empty-state"><div class="empty-state-icon">📚</div><p>Нет уроков. Добавьте первый урок выше.</p></li>';
        } else {
            lessons.forEach((lesson, index) => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    <div class="list-item-title">${lesson.title || 'Без названия'}</div>
                    <div class="list-item-content">${lesson.materials || 'Нет материалов'}</div>
                    ${lesson.homework ? `<div class="list-item-meta">ДЗ: ${lesson.homework}</div>` : ''}
                `;
                lessonsList.appendChild(li);
            });
        }
    }
    
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}')[id];
    const roadmapList = document.getElementById('roadmapList');
    
    if (roadmapList) {
        roadmapList.innerHTML = '';
        
        // Проверяем формат данных
        let roadmapData = roadmaps;
        if (Array.isArray(roadmaps)) {
            // Старый формат - конвертируем
            roadmapData = {
                nodes: roadmaps.map((step, index) => ({
                    id: `node_${index}`,
                    title: step,
                    x: 100 + (index % 5) * 200,
                    y: 100 + Math.floor(index / 5) * 150,
                    completed: false
                })),
                connections: roadmaps.slice(1).map((_, index) => ({
                    from: `node_${index}`,
                    to: `node_${index + 1}`
                }))
            };
            // Сохраняем конвертированные данные
            const allRoadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}');
            allRoadmaps[id] = roadmapData;
            localStorage.setItem('roadmaps', JSON.stringify(allRoadmaps));
        }
        
        if (!roadmapData || !roadmapData.nodes || roadmapData.nodes.length === 0) {
            roadmapList.innerHTML = '<li class="empty-state"><div class="empty-state-icon">🗺️</div><p>Нет этапов роудмапа. Добавьте первый этап выше или используйте визуальный редактор.</p></li>';
        } else {
            // Показываем визуальный редактор роудмапа
            roadmapList.innerHTML = '<div id="roadmapEditorContainer"></div>';
            initRoadmapEditor(id, roadmapData);
        }
    }
}

// Добавление урока
async function addLesson() {
    const title = document.getElementById('lessonTitle').value.trim();
    const materials = document.getElementById('lessonMaterials').value.trim();
    const homework = document.getElementById('homework').value.trim();
    
    if (!title) {
        showAlert('Введите название урока', 'error');
        return;
    }
    
    if (!currentStudentId) {
        showAlert('Сначала выберите ученика из списка выше', 'error');
        return;
    }
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '{}');
    if (!lessons[currentStudentId]) {
        lessons[currentStudentId] = [];
    }
    
    lessons[currentStudentId].push({ title, materials, homework });
    localStorage.setItem('lessons', JSON.stringify(lessons));
    
    // Очистка полей
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonMaterials').value = '';
    document.getElementById('homework').value = '';
    
    loadStudentAdmin(currentStudentId);
    await syncToServer();
    showAlert('Урок успешно добавлен', 'success');
}

// Добавление этапа роудмапа (старая функция, оставлена для совместимости)
async function addRoadmap() {
    const step = document.getElementById('roadmapStep').value.trim();
    
    if (!step) {
        showAlert('Введите название этапа', 'error');
        return;
    }
    
    if (!currentStudentId) {
        showAlert('Сначала выберите ученика из списка выше', 'error');
        return;
    }
    
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}');
    if (!roadmaps[currentStudentId]) {
        roadmaps[currentStudentId] = { nodes: [], connections: [] };
    }
    
    // Если это старый формат (массив строк), конвертируем в новый формат
    if (Array.isArray(roadmaps[currentStudentId])) {
        const oldSteps = roadmaps[currentStudentId];
        roadmaps[currentStudentId] = {
            nodes: oldSteps.map((step, index) => ({
                id: `node_${index}`,
                title: step,
                x: 100 + (index % 5) * 200,
                y: 100 + Math.floor(index / 5) * 150,
                completed: false
            })),
            connections: oldSteps.slice(1).map((_, index) => ({
                from: `node_${index}`,
                to: `node_${index + 1}`
            }))
        };
    }
    
    // Добавляем новый узел
    const nodeId = `node_${Date.now()}`;
    const nodes = roadmaps[currentStudentId].nodes || [];
    const lastNode = nodes[nodes.length - 1];
    
    roadmaps[currentStudentId].nodes.push({
        id: nodeId,
        title: step,
        x: lastNode ? lastNode.x + 200 : 100,
        y: lastNode ? lastNode.y : 100,
        completed: false
    });
    
    // Добавляем связь с предыдущим узлом, если он есть
    if (lastNode) {
        roadmaps[currentStudentId].connections.push({
            from: lastNode.id,
            to: nodeId
        });
    }
    
    localStorage.setItem('roadmaps', JSON.stringify(roadmaps));
    
    // Очистка поля
    document.getElementById('roadmapStep').value = '';
    
    loadStudentAdmin(currentStudentId);
    await syncToServer();
    showAlert('Этап роудмапа успешно добавлен', 'success');
}

// ============================================
// КАБИНЕТ УЧЕНИКА
// ============================================

// Загрузка контента для ученика
function loadStudentContent(id) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '{}')[id] || [];
    const lessonsList = document.getElementById('lessonsStudent');
    
    if (lessonsList) {
        lessonsList.innerHTML = '';
        if (lessons.length === 0) {
            lessonsList.innerHTML = '<li class="empty-state"><div class="empty-state-icon">📚</div><p>Пока нет уроков. Ожидайте, пока преподаватель добавит материалы.</p></li>';
        } else {
            lessons.forEach(lesson => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    <div class="list-item-title">${lesson.title || 'Без названия'}</div>
                    <div class="list-item-content">${lesson.materials || 'Нет материалов'}</div>
                `;
                lessonsList.appendChild(li);
            });
        }
    }
    
    const homeworks = lessons.filter(l => l.homework).map(l => l.homework);
    const homeworkList = document.getElementById('homeworkList');
    
    if (homeworkList) {
        homeworkList.innerHTML = '';
        if (homeworks.length === 0) {
            homeworkList.innerHTML = '<li class="empty-state"><div class="empty-state-icon">📝</div><p>Нет домашних заданий.</p></li>';
        } else {
            homeworks.forEach(hw => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    <div class="list-item-content">${hw}</div>
                `;
                homeworkList.appendChild(li);
            });
        }
    }
    
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}')[id];
    const roadmapList = document.getElementById('roadmapStudent');
    
    if (roadmapList) {
        roadmapList.innerHTML = '';
        
        // Проверяем формат данных
        let roadmapData = roadmaps;
        if (Array.isArray(roadmaps)) {
            // Старый формат - конвертируем
            roadmapData = {
                nodes: roadmaps.map((step, index) => ({
                    id: `node_${index}`,
                    title: step,
                    x: 100 + (index % 5) * 200,
                    y: 100 + Math.floor(index / 5) * 150,
                    completed: false
                })),
                connections: roadmaps.slice(1).map((_, index) => ({
                    from: `node_${index}`,
                    to: `node_${index + 1}`
                }))
            };
            // Сохраняем конвертированные данные
            const allRoadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}');
            allRoadmaps[id] = roadmapData;
            localStorage.setItem('roadmaps', JSON.stringify(allRoadmaps));
        }
        
        if (!roadmapData || !roadmapData.nodes || roadmapData.nodes.length === 0) {
            roadmapList.innerHTML = '<li class="empty-state"><div class="empty-state-icon">🗺️</div><p>Роудмап обучения пока не создан.</p></li>';
        } else {
            // Показываем визуальный роудмап для студента
            roadmapList.innerHTML = '<div id="roadmapViewContainer"></div>';
            initRoadmapView(id, roadmapData);
        }
    }
}

// ============================================
// УТИЛИТЫ
// ============================================

// Показ уведомлений
function showAlert(message, type = 'info') {
    // Создаем элемент уведомления
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '10000';
    alert.style.maxWidth = '400px';
    alert.style.animation = 'slideUp 0.3s ease-out';
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-20px)';
        alert.style.transition = 'all 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// ============================================
// ВИЗУАЛЬНЫЙ РЕДАКТОР РОУДМАПА (для админа)
// ============================================

let roadmapEditor = null;

function initRoadmapEditor(studentId, roadmapData) {
    const container = document.getElementById('roadmapEditorContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button onclick="addRoadmapNode('${studentId}')" class="btn btn-primary btn-small">
                ➕ Добавить узел
            </button>
            <button id="connectModeBtn" onclick="toggleConnectMode()" class="btn btn-secondary btn-small">
                🔗 Режим создания связей (выкл)
            </button>
            <button onclick="saveRoadmap('${studentId}')" class="btn btn-success btn-small">
                💾 Сохранить роудмап
            </button>
            <button onclick="deleteSelectedNode('${studentId}')" class="btn btn-danger btn-small" id="deleteNodeBtn" style="display: none;">
                🗑️ Удалить узел
            </button>
        </div>
        <div style="position: relative; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-color); overflow: hidden;">
            <canvas id="roadmapCanvas" width="1200" height="600" style="display: block; cursor: move;"></canvas>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
            💡 <strong>Перетаскивание:</strong> Перетаскивайте узлы мышью для изменения их позиции.<br>
            💡 <strong>Редактирование:</strong> Двойной клик по узлу для изменения названия.<br>
            💡 <strong>Связи:</strong> Включите режим создания связей, затем кликните на два узла подряд для создания связи.<br>
            💡 <strong>Удаление:</strong> Выберите узел (кликните на него), затем нажмите кнопку "Удалить узел".<br>
            💡 <strong>Масштаб:</strong> Используйте колесико мыши для масштабирования.
        </div>
    `;
    
    const canvas = document.getElementById('roadmapCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let nodes = roadmapData.nodes || [];
    let connections = roadmapData.connections || [];
    const state = {
        selectedNode: null,
        connectingFrom: null
    };
    let dragging = false;
    let dragOffset = { x: 0, y: 0 };
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let lastPanPoint = { x: 0, y: 0 };
    
    // Обработка изменения размера canvas
    function resizeCanvas() {
        const parentContainer = container.parentElement;
        canvas.width = Math.max(1200, parentContainer ? parentContainer.clientWidth - 40 : 1200);
        canvas.height = 600;
        draw();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Применяем трансформации
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(scale, scale);
        
        // Рисуем связи
        connections.forEach(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (fromNode && toNode) {
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(fromNode.x + 60, fromNode.y + 40);
                ctx.lineTo(toNode.x + 60, toNode.y + 40);
                ctx.stroke();
                
                // Стрелка
                const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
                ctx.beginPath();
                ctx.moveTo(toNode.x + 60 - Math.cos(angle) * 15, toNode.y + 40 - Math.sin(angle) * 15);
                ctx.lineTo(toNode.x + 60 - Math.cos(angle) * 15 - Math.cos(angle - Math.PI / 6) * 8, toNode.y + 40 - Math.sin(angle) * 15 - Math.sin(angle - Math.PI / 6) * 8);
                ctx.lineTo(toNode.x + 60 - Math.cos(angle) * 15 - Math.cos(angle + Math.PI / 6) * 8, toNode.y + 40 - Math.sin(angle) * 15 - Math.sin(angle + Math.PI / 6) * 8);
                ctx.closePath();
                ctx.fillStyle = '#94a3b8';
                ctx.fill();
            }
        });
        
        // Рисуем узлы
        nodes.forEach(node => {
            const x = node.x;
            const y = node.y;
            
            // Тень
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Фон узла
            ctx.fillStyle = node === state.selectedNode ? '#6366f1' : (node.completed ? '#10b981' : '#ffffff');
            ctx.beginPath();
            ctx.arc(x + 60, y + 40, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // Сброс тени
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Обводка
            ctx.strokeStyle = node === state.selectedNode ? '#4f46e5' : '#e2e8f0';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Текст
            ctx.fillStyle = node === state.selectedNode || node.completed ? '#ffffff' : '#1e293b';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = node.title.length > 15 ? node.title.substring(0, 12) + '...' : node.title;
            ctx.fillText(text, x + 60, y + 40);
            
            // Индикатор выполнения
            if (node.completed) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px sans-serif';
                ctx.fillText('✓', x + 60, y + 40);
            }
        });
        
        ctx.restore();
    }
    
    function getNodeAt(x, y) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = (x - rect.left - panX) / scale;
        const canvasY = (y - rect.top - panY) / scale;
        
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const dx = canvasX - (node.x + 60);
            const dy = canvasY - (node.y + 40);
            if (dx * dx + dy * dy <= 40 * 40) {
                return node;
            }
        }
        return null;
    }
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const node = getNodeAt(e.clientX, e.clientY);
        
        // Проверяем режим создания связей
        const connectModeBtn = document.getElementById('connectModeBtn');
        const isConnectMode = connectModeBtn && connectModeBtn.textContent.includes('(вкл)');
        
        if (isConnectMode) {
            // Режим создания связи
            if (node) {
                if (state.connectingFrom) {
                    if (state.connectingFrom !== node && !connections.find(c => c.from === state.connectingFrom.id && c.to === node.id)) {
                        connections.push({ from: state.connectingFrom.id, to: node.id });
                        saveRoadmapData(studentId);
                        showAlert('Связь создана', 'success');
                    }
                    state.connectingFrom = null;
                    if (connectModeBtn) connectModeBtn.textContent = '🔗 Режим создания связей (вкл)';
                    canvas.style.cursor = 'crosshair';
                } else {
                    state.connectingFrom = node;
                    if (connectModeBtn) connectModeBtn.textContent = '🔗 Режим создания связей (выберите второй узел)';
                    canvas.style.cursor = 'crosshair';
                }
                draw();
            }
        } else if (node) {
            // Начало перетаскивания узла
            state.selectedNode = node;
            dragging = true;
            dragOffset.x = (x - panX) / scale - node.x;
            dragOffset.y = (y - panY) / scale - node.y;
            canvas.style.cursor = 'grabbing';
            draw();
        } else {
            // Начало панорамирования
            isPanning = true;
            lastPanPoint = { x: x - panX, y: y - panY };
            canvas.style.cursor = 'move';
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const connectModeBtn = document.getElementById('connectModeBtn');
        const isConnectMode = connectModeBtn && connectModeBtn.textContent.includes('(вкл)');
        
        if (dragging && state.selectedNode && !isConnectMode) {
            state.selectedNode.x = (x - panX) / scale - dragOffset.x;
            state.selectedNode.y = (y - panY) / scale - dragOffset.y;
            draw();
        } else if (isPanning) {
            panX = x - lastPanPoint.x;
            panY = y - lastPanPoint.y;
            draw();
        } else {
            const node = getNodeAt(e.clientX, e.clientY);
            if (isConnectMode) {
                canvas.style.cursor = connectingFrom ? 'crosshair' : (node ? 'crosshair' : 'default');
            } else {
                canvas.style.cursor = node ? 'grab' : 'default';
            }
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        dragging = false;
        isPanning = false;
        const connectModeBtn = document.getElementById('connectModeBtn');
        const isConnectMode = connectModeBtn && connectModeBtn.textContent.includes('(вкл)');
        if (!isConnectMode) {
            canvas.style.cursor = 'default';
        }
        if (state.selectedNode && !isConnectMode) {
            saveRoadmapData(studentId);
        }
    });
    
    canvas.addEventListener('click', (e) => {
        const connectModeBtn = document.getElementById('connectModeBtn');
        const isConnectMode = connectModeBtn && connectModeBtn.textContent.includes('(вкл)');
        
        if (!isConnectMode) {
            const node = getNodeAt(e.clientX, e.clientY);
            if (node) {
                state.selectedNode = node;
                const deleteBtn = document.getElementById('deleteNodeBtn');
                if (deleteBtn) deleteBtn.style.display = 'inline-block';
                draw();
            } else {
                state.selectedNode = null;
                const deleteBtn = document.getElementById('deleteNodeBtn');
                if (deleteBtn) deleteBtn.style.display = 'none';
                draw();
            }
        }
    });
    
    canvas.addEventListener('dblclick', (e) => {
        const connectModeBtn = document.getElementById('connectModeBtn');
        const isConnectMode = connectModeBtn && connectModeBtn.textContent.includes('(вкл)');
        
        if (!isConnectMode) {
            const node = getNodeAt(e.clientX, e.clientY);
            if (node) {
                const newTitle = prompt('Введите новое название узла:', node.title);
                if (newTitle !== null && newTitle.trim()) {
                    node.title = newTitle.trim();
                    saveRoadmapData(studentId);
                    draw();
                }
            }
        }
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(2, scale * zoomFactor));
        
        panX = x - (x - panX) * (newScale / scale);
        panY = y - (y - panY) * (newScale / scale);
        scale = newScale;
        
        draw();
    });
    
    function saveRoadmapData(sId) {
        const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}');
        roadmaps[sId] = { nodes, connections };
        localStorage.setItem('roadmaps', JSON.stringify(roadmaps));
        syncToServer();
    }
    
    roadmapEditor = { nodes, connections, saveRoadmapData, draw, state };
    draw();
}

async function addRoadmapNode(studentId) {
    const title = prompt('Введите название узла:');
    if (!title || !title.trim()) return;
    
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}');
    if (!roadmaps[studentId]) {
        roadmaps[studentId] = { nodes: [], connections: [] };
    }
    
    const nodes = roadmaps[studentId].nodes || [];
    const nodeId = `node_${Date.now()}`;
    const newNode = {
        id: nodeId,
        title: title.trim(),
        x: nodes.length > 0 ? nodes[nodes.length - 1].x + 200 : 100,
        y: nodes.length > 0 ? nodes[nodes.length - 1].y : 100,
        completed: false
    };
    
    nodes.push(newNode);
    roadmaps[studentId].nodes = nodes;
    localStorage.setItem('roadmaps', JSON.stringify(roadmaps));
    
    await syncToServer();
    loadStudentAdmin(studentId);
    showAlert('Узел добавлен', 'success');
}

async function saveRoadmap(studentId) {
    if (roadmapEditor) {
        roadmapEditor.saveRoadmapData(studentId);
        await syncToServer();
        showAlert('Роудмап сохранен', 'success');
    }
}

function toggleConnectMode() {
    const btn = document.getElementById('connectModeBtn');
    if (!btn) return;
    
    if (btn.textContent.includes('(вкл)')) {
        btn.textContent = '🔗 Режим создания связей (выкл)';
        btn.className = 'btn btn-secondary btn-small';
    } else {
        btn.textContent = '🔗 Режим создания связей (вкл)';
        btn.className = 'btn btn-primary btn-small';
    }
    
    // Сбрасываем состояние соединения
    if (roadmapEditor && roadmapEditor.state) {
        roadmapEditor.state.connectingFrom = null;
        roadmapEditor.draw();
    }
}

async function deleteSelectedNode(studentId) {
    if (!roadmapEditor || !roadmapEditor.state || !roadmapEditor.state.selectedNode) return;
    
    const node = roadmapEditor.state.selectedNode;
    if (!confirm(`Удалить узел "${node.title}"? Все связи с этим узлом также будут удалены.`)) {
        return;
    }
    
    // Удаляем узел
    roadmapEditor.nodes = roadmapEditor.nodes.filter(n => n.id !== node.id);
    
    // Удаляем все связи, связанные с этим узлом
    roadmapEditor.connections = roadmapEditor.connections.filter(
        c => c.from !== node.id && c.to !== node.id
    );
    
    roadmapEditor.state.selectedNode = null;
    const deleteBtn = document.getElementById('deleteNodeBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    roadmapEditor.saveRoadmapData(studentId);
    roadmapEditor.draw();
    await syncToServer();
    showAlert('Узел удален', 'success');
}

// ============================================
// ВИЗУАЛЬНЫЙ ПРОСМОТР РОУДМАПА (для студента)
// ============================================

function initRoadmapView(studentId, roadmapData) {
    const container = document.getElementById('roadmapViewContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="position: relative; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-color); overflow: hidden;">
            <canvas id="roadmapViewCanvas" width="1200" height="600" style="display: block; cursor: move;"></canvas>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
            💡 Кликните на узел, чтобы отметить его как выполненный или невыполненный.
        </div>
    `;
    
    const canvas = document.getElementById('roadmapViewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let nodes = JSON.parse(JSON.stringify(roadmapData.nodes || [])); // Копия для редактирования
    let connections = roadmapData.connections || [];
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let lastPanPoint = { x: 0, y: 0 };
    
    function resizeCanvas() {
        const parentContainer = container.parentElement;
        canvas.width = Math.max(1200, parentContainer ? parentContainer.clientWidth - 40 : 1200);
        canvas.height = 600;
        draw();
    }
    
    resizeCanvas();
    const resizeHandler = () => resizeCanvas();
    window.addEventListener('resize', resizeHandler);
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(scale, scale);
        
        // Рисуем связи
        connections.forEach(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (fromNode && toNode) {
                ctx.strokeStyle = fromNode.completed && toNode.completed ? '#10b981' : '#94a3b8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(fromNode.x + 60, fromNode.y + 40);
                ctx.lineTo(toNode.x + 60, toNode.y + 40);
                ctx.stroke();
                
                // Стрелка
                const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
                ctx.beginPath();
                ctx.moveTo(toNode.x + 60 - Math.cos(angle) * 15, toNode.y + 40 - Math.sin(angle) * 15);
                ctx.lineTo(toNode.x + 60 - Math.cos(angle) * 15 - Math.cos(angle - Math.PI / 6) * 8, toNode.y + 40 - Math.sin(angle) * 15 - Math.sin(angle - Math.PI / 6) * 8);
                ctx.lineTo(toNode.x + 60 - Math.cos(angle) * 15 - Math.cos(angle + Math.PI / 6) * 8, toNode.y + 40 - Math.sin(angle) * 15 - Math.sin(angle + Math.PI / 6) * 8);
                ctx.closePath();
                ctx.fillStyle = fromNode.completed && toNode.completed ? '#10b981' : '#94a3b8';
                ctx.fill();
            }
        });
        
        // Рисуем узлы
        nodes.forEach(node => {
            const x = node.x;
            const y = node.y;
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillStyle = node.completed ? '#10b981' : '#ffffff';
            ctx.beginPath();
            ctx.arc(x + 60, y + 40, 40, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.strokeStyle = node.completed ? '#059669' : '#e2e8f0';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.fillStyle = node.completed ? '#ffffff' : '#1e293b';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = node.title.length > 15 ? node.title.substring(0, 12) + '...' : node.title;
            ctx.fillText(text, x + 60, y + 40);
            
            if (node.completed) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px sans-serif';
                ctx.fillText('✓', x + 60, y + 40);
            }
        });
        
        ctx.restore();
    }
    
    function getNodeAt(x, y) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = (x - rect.left - panX) / scale;
        const canvasY = (y - rect.top - panY) / scale;
        
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const dx = canvasX - (node.x + 60);
            const dy = canvasY - (node.y + 40);
            if (dx * dx + dy * dy <= 40 * 40) {
                return node;
            }
        }
        return null;
    }
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const node = getNodeAt(e.clientX, e.clientY);
        
        if (node) {
            // Переключение статуса выполнения
            node.completed = !node.completed;
            saveRoadmapViewData(studentId);
            draw();
        } else {
            // Начало панорамирования
            isPanning = true;
            lastPanPoint = { x: x - panX, y: y - panY };
            canvas.style.cursor = 'move';
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            panX = x - lastPanPoint.x;
            panY = y - lastPanPoint.y;
            draw();
        } else {
            const node = getNodeAt(e.clientX, e.clientY);
            canvas.style.cursor = node ? 'pointer' : 'default';
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        isPanning = false;
        canvas.style.cursor = 'default';
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(2, scale * zoomFactor));
        
        panX = x - (x - panX) * (newScale / scale);
        panY = y - (y - panY) * (newScale / scale);
        scale = newScale;
        
        draw();
    });
    
    async function saveRoadmapViewData(sId) {
        const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}');
        if (roadmaps[sId]) {
            roadmaps[sId].nodes = nodes;
            localStorage.setItem('roadmaps', JSON.stringify(roadmaps));
            await syncToServer();
        }
    }
    
    draw();
}
