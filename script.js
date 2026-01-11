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
    
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}')[id] || [];
    const roadmapList = document.getElementById('roadmapList');
    
    if (roadmapList) {
        roadmapList.innerHTML = '';
        if (roadmaps.length === 0) {
            roadmapList.innerHTML = '<li class="empty-state"><div class="empty-state-icon">🗺️</div><p>Нет этапов роудмапа. Добавьте первый этап выше.</p></li>';
        } else {
            roadmaps.forEach((step, index) => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    <div class="list-item-title">Этап ${index + 1}: ${step}</div>
                `;
                roadmapList.appendChild(li);
            });
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

// Добавление этапа роудмапа
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
        roadmaps[currentStudentId] = [];
    }
    
    roadmaps[currentStudentId].push(step);
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
    
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}')[id] || [];
    const roadmapList = document.getElementById('roadmapStudent');
    
    if (roadmapList) {
        roadmapList.innerHTML = '';
        if (roadmaps.length === 0) {
            roadmapList.innerHTML = '<li class="empty-state"><div class="empty-state-icon">🗺️</div><p>Роудмап обучения пока не создан.</p></li>';
        } else {
            roadmaps.forEach((step, index) => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    <div class="list-item-title">Этап ${index + 1}: ${step}</div>
                `;
                roadmapList.appendChild(li);
            });
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
