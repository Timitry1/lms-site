// Инициализация данных (первый запуск)
if (!localStorage.getItem('students')) {
    localStorage.setItem('students', JSON.stringify({}));
}
if (!localStorage.getItem('lessons')) {
    localStorage.setItem('lessons', JSON.stringify({}));
}
if (!localStorage.getItem('roadmaps')) {
    localStorage.setItem('roadmaps', JSON.stringify({}));
}

// Логин
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split('/').pop();
    if (path === 'index.html' || !path) checkLogin();
    else loadDashboard(path);
});

function checkLogin() {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const form = document.getElementById('loginForm');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const userId = email.value;
            const pass = password.value;
            if (userId === 'admin' && pass === 'admin') {
                localStorage.setItem('user', JSON.stringify({id: 'admin', role: 'admin'}));
                window.location.href = 'admin.html';
            } else {
                const students = JSON.parse(localStorage.getItem('students') || '{}');
                if (students[userId] && students[userId].password === pass) {  // Регистрируйте с паролем в admin
                    localStorage.setItem('user', JSON.stringify({id: userId, role: 'student', name: students[userId].name}));
                    window.location.href = 'student.html';
                } else {
                    alert('Неверный логин/пароль');
                }
            }
        };
    }
}

function loadDashboard(page) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return window.location.href = 'index.html';
    if (page === 'admin.html' && user.role !== 'admin') return window.location.href = 'index.html';
    if (page === 'student.html' && user.role !== 'student') return window.location.href = 'admin.html';
    document.getElementById(user.role + 'Dash' || 'dashboard').style.display = 'block';
    if (user.role === 'student') {
        document.getElementById('studentNameDisp').textContent = user.name;
        loadStudentContent(user.id);
    } else {
        loadAdminContent();
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Админ функции
function loadAdminContent() {
    const students = JSON.parse(localStorage.getItem('students') || '{}');
    const list = document.getElementById('studentsList');
    list.innerHTML = '';
    Object.keys(students).forEach(id => {
        const li = document.createElement('li');
        li.innerHTML = `${id}: ${students[id].name} <button onclick="loadStudentContent('${id}')">Загрузить</button>`;
        list.appendChild(li);
    });
}

function addStudent() {
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value;
    if (!id || !name) return alert('Заполните ID и имя');
    const students = JSON.parse(localStorage.getItem('students') || '{}');
    students[id] = {name, password: '12345'};  // Меняйте пароль вручную
    localStorage.setItem('students', JSON.stringify(students));
    loadAdminContent();
}

let currentStudentId = '';
function loadStudentContent(id) {
    currentStudentId = id;
    document.getElementById('currentStudent').textContent = id;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '{}')[id] || [];
    const list = document.getElementById('lessonsList');
    list.innerHTML = lessons.map(l => `<li>${l.title}: ${l.materials} | ДЗ: ${l.homework}</li>`).join('');
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}')[id] || [];
    document.getElementById('roadmapList').innerHTML = roadmaps.map(r => `<li>${r}</li>`).join('');
}

function addLesson() {
    const title = document.getElementById('lessonTitle').value;
    const materials = document.getElementById('lessonMaterials').value;
    const hw = document.getElementById('homework').value;
    if (!title) return;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '{}');
    if (!lessons[currentStudentId]) lessons[currentStudentId] = [];
    lessons[currentStudentId].push({title, materials, homework: hw});
    localStorage.setItem('lessons', JSON.stringify(lessons));
    loadStudentContent(currentStudentId);
}

function addRoadmap() {
    const step = document.getElementById('roadmapStep').value;
    if (!step) return;
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}');
    if (!roadmaps[currentStudentId]) roadmaps[currentStudentId] = [];
    roadmaps[currentStudentId].push(step);
    localStorage.setItem('roadmaps', JSON.stringify(roadmaps));
    loadStudentContent(currentStudentId);
}

// Студент контент
function loadStudentContent(id) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '{}')[id] || [];
    document.getElementById('lessonsStudent').innerHTML = lessons.map(l => `<li><strong>${l.title}</strong><br>Материалы: ${l.materials}<br>ДЗ: ${l.homework}</li>`).join('');
    const roadmaps = JSON.parse(localStorage.getItem('roadmaps') || '{}')[id] || [];
    document.getElementById('roadmapStudent').innerHTML = roadmaps.map(r => `<li>${r}</li>`).join('');
    const hws = lessons.map(l => l.homework).filter(h => h);
    document.getElementById('homeworkList').innerHTML = hws.map(hw => `<li>${hw}</li>`).join('');
}

function refreshCurrent() {
    if (currentStudentId) loadStudentContent(currentStudentId);
}