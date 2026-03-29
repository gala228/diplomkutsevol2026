// Глобальные переменные
let currentRole = null; // 'admin' или 'user'
let traineesData = [];
let mentorsData = [];
let certificationsData = [];
let coursesList = [];
let currentFilters = { id: '', fullName: '', startDate: '', mentor: '', status: '' };

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
}

function shortName(fullName) {
    if (!fullName) return '';
    let parts = fullName.split(' ');
    if (parts.length >= 2) return parts[0] + ' ' + parts[1][0] + '.' + (parts[2] ? parts[2][0] + '.' : '');
    return fullName;
}

function getTraineeStatus(trainee) {
    // Определяем статус на основе аттестаций
    if (trainee.attestations && trainee.attestations.length > 0) {
        const last = trainee.attestations[0];
        if (last.Результат === 'не сдал') return 'Аттестация';
        if (last.Результат === 'сдал') return 'Завершил';
    }
    return 'Активен';
}

function getStatusColor(trainee) {
    const status = getTraineeStatus(trainee);
    if (status === 'Активен') return '#27ae60';
    if (status === 'Аттестация') return '#f39c12';
    return '#3498db';
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadTrainees() {
    try {
        const response = await fetch('api/get_trainees.php');
        traineesData = await response.json();
        renderTrainees();
        updateCounters();
        if (!document.getElementById('reports').classList.contains('hidden')) renderReports();
    } catch (error) {
        console.error('Ошибка загрузки стажёров:', error);
    }
}

async function loadMentors() {
    try {
        const response = await fetch('api/get_mentors.php');
        mentorsData = await response.json();
        renderMentorsTable();
    } catch (error) {
        console.error('Ошибка загрузки наставников:', error);
    }
}

async function loadCertifications() {
    try {
        const response = await fetch('api/get_certifications.php');
        certificationsData = await response.json();
        renderCertificationTable();
    } catch (error) {
        console.error('Ошибка загрузки аттестаций:', error);
    }
}

async function loadTrainingData() {
    try {
        const response = await fetch('api/get_data.php');
        const data = await response.json();
        renderTrainingTable(data);
    } catch (error) {
        console.error(error);
    }
}

async function loadStats() {
    try {
        const response = await fetch('api/get_stats.php');
        const stats = await response.json();
        document.getElementById('traineesCount').textContent = stats.trainees;
        document.getElementById('activeTrainings').textContent = stats.activeTrainings;
    } catch (error) {
        console.error(error);
    }
}

async function loadCourses() {
    try {
        const response = await fetch('api/get_courses.php');
        coursesList = await response.json();
        renderSettingsCourses();
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
    }
}

async function refreshAll() {
    await loadTrainees();
    await loadMentors();
    await loadCertifications();
    await loadTrainingData();
    await loadStats();
    await loadCourses();
}

// ==================== СТАЖЁРЫ ====================
function filterTrainees(trainees) {
    return trainees.filter(t => {
        const mentorName = t.mentor || (t.mentorId ? (mentorsData.find(m => m.id_наставника == t.mentorId)?.ФИО || '') : '');
        return (!currentFilters.id || t.id_стажера.toString().includes(currentFilters.id)) &&
               (!currentFilters.fullName || t.ФИО.toLowerCase().includes(currentFilters.fullName.toLowerCase())) &&
               (!currentFilters.startDate || formatDateForDisplay(t.Дата_начала_стажировки).includes(currentFilters.startDate)) &&
               (!currentFilters.mentor || mentorName.toLowerCase().includes(currentFilters.mentor.toLowerCase())) &&
               (!currentFilters.status || getTraineeStatus(t).toLowerCase().includes(currentFilters.status.toLowerCase()));
    });
}

function renderTrainees() {
    const tbody = document.getElementById('traineesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const filtered = filterTrainees(traineesData);
    filtered.forEach(t => {
        const mentorName = t.mentor || (t.mentorId ? mentorsData.find(m => m.id_наставника == t.mentorId)?.ФИО : '');
        const tr = document.createElement('tr');
        let actionsHtml = '';
        if (currentRole === 'admin') {
            actionsHtml = `<button class="btn btn-primary btn-sm" onclick="openEditModal('${t.id_стажера}')">Просмотр</button>
                           <button class="btn btn-warning btn-sm" onclick="openEditModal('${t.id_стажера}')">Редакт.</button>
                           <button class="btn btn-danger btn-sm" onclick="deleteTrainee('${t.id_стажера}')">Удалить</button>`;
        }
        tr.innerHTML = `
             <td>${t.id_стажера}</td>
             <td>${t.ФИО}</td>
             <td>${formatDateForDisplay(t.Дата_начала_стажировки)}</td>
             <td>${shortName(mentorName)}</td>
             <td><span style="color: ${getStatusColor(t)};">${getTraineeStatus(t)}</span></td>
             <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function applyFilters() {
    currentFilters.id = document.getElementById('filterId').value;
    currentFilters.fullName = document.getElementById('filterName').value;
    currentFilters.startDate = document.getElementById('filterStart').value;
    currentFilters.mentor = document.getElementById('filterMentor').value;
    currentFilters.status = document.getElementById('filterStatus').value;
    renderTrainees();
}

function resetFilters() {
    document.getElementById('filterId').value = '';
    document.getElementById('filterName').value = '';
    document.getElementById('filterStart').value = '';
    document.getElementById('filterMentor').value = '';
    document.getElementById('filterStatus').value = '';
    currentFilters = { id: '', fullName: '', startDate: '', mentor: '', status: '' };
    renderTrainees();
}

function toggleFilterPanel() {
    document.getElementById('filterPanel').classList.toggle('hidden');
}

async function saveNewTrainee() {
    if (!checkAdmin()) return;
    const fullName = document.getElementById('traineeName').value.trim();
    const startDate = document.getElementById('startDate').value;
    const mentorId = document.getElementById('mentorSelect').value;
    const notes = document.getElementById('traineeNotes').value;
    if (!fullName || !startDate) {
        alert('Заполните ФИО и дату начала');
        return;
    }
    try {
        const response = await fetch('api/add_trainee.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, startDate, mentorId, notes })
        });
        const result = await response.json();
        if (result.success) {
            alert('Стажёр добавлен');
            hideAddForm();
            await refreshAll();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при добавлении');
    }
}

async function deleteTrainee(id) {
    if (!checkAdmin()) return;
    if (!confirm('Удалить стажёра?')) return;
    try {
        const response = await fetch('api/delete_trainee.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await response.json();
        if (result.success) {
            await refreshAll();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при удалении');
    }
}

let currentEditTraineeId = null;

function openEditModal(id) {
    const trainee = traineesData.find(t => t.id_стажера == id);
    if (!trainee) return;
    currentEditTraineeId = id;
    document.getElementById('editId').value = trainee.id_стажера;
    document.getElementById('editFullName').value = trainee.ФИО;
    document.getElementById('editStartDate').value = trainee.Дата_начала_стажировки;
    // Заполнение наставников
    const mentorSelect = document.getElementById('editMentor');
    mentorSelect.innerHTML = '';
    mentorsData.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id_наставника;
        option.textContent = m.ФИО;
        if (trainee.mentorId == m.id_наставника) option.selected = true;
        mentorSelect.appendChild(option);
    });
    document.getElementById('editStatus').value = getTraineeStatus(trainee);
    document.getElementById('editNotes').value = trainee.примечания || '';
    document.getElementById('traineeModal').classList.remove('hidden');
}

async function saveTraineeFromModal() {
    if (!checkAdmin()) return;
    const id = document.getElementById('editId').value;
    const fullName = document.getElementById('editFullName').value;
    const startDate = document.getElementById('editStartDate').value;
    const mentorId = document.getElementById('editMentor').value;
    const notes = document.getElementById('editNotes').value;
    try {
        const response = await fetch('api/update_trainee.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, fullName, startDate, mentorId, notes })
        });
        const result = await response.json();
        if (result.success) {
            closeModal();
            await refreshAll();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при обновлении');
    }
}

function closeModal() {
    document.getElementById('traineeModal').classList.add('hidden');
    currentEditTraineeId = null;
}

function showAddForm() {
    if (!checkAdmin()) return;
    document.getElementById('addTraineeForm').classList.remove('hidden');
    const mentorSelect = document.getElementById('mentorSelect');
    mentorSelect.innerHTML = '';
    mentorsData.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id_наставника;
        option.textContent = m.ФИО;
        mentorSelect.appendChild(option);
    });
}

function hideAddForm() {
    document.getElementById('addTraineeForm').classList.add('hidden');
    document.getElementById('traineeName').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('traineeNotes').value = '';
}

// ==================== НАСТАВНИКИ ====================
async function addMentor() {
    if (!checkAdmin()) return;
    const name = document.getElementById('newMentorName').value.trim();
    const email = document.getElementById('newMentorEmail').value.trim();
    const phone = document.getElementById('newMentorPhone').value.trim();
    if (!name) {
        alert('Введите имя');
        return;
    }
    try {
        const response = await fetch('api/add_mentor.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone })
        });
        const result = await response.json();
        if (result.success) {
            hideAddMentorForm();
            await loadMentors();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при добавлении наставника');
    }
}

async function deleteMentor(id) {
    if (!checkAdmin()) return;
    if (!confirm('Удалить наставника?')) return;
    try {
        const response = await fetch('api/delete_mentor.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await response.json();
        if (result.success) {
            await loadMentors();
            await loadTrainees();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при удалении');
    }
}

function renderMentorsTable() {
    const tbody = document.getElementById('mentorsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    mentorsData.forEach(mentor => {
        const count = traineesData.filter(t => t.mentorId == mentor.id_наставника).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
             <td>${mentor.id_наставника}</td>
             <td>${mentor.ФИО}</td>
             <td>${mentor.Email || ''}</td>
             <td>${mentor.Контактный_телефон || ''}</td>
             <td>${count}</td>
             <td>${currentRole === 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteMentor(${mentor.id_наставника})">Удалить</button>` : ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showAddMentorForm() {
    if (!checkAdmin()) return;
    document.getElementById('addMentorForm').classList.remove('hidden');
}

function hideAddMentorForm() {
    document.getElementById('addMentorForm').classList.add('hidden');
    document.getElementById('newMentorName').value = '';
    document.getElementById('newMentorEmail').value = '';
    document.getElementById('newMentorPhone').value = '';
}

// ==================== АТТЕСТАЦИЯ ====================
async function saveCertification() {
    if (!checkAdmin()) return;
    const traineeId = document.getElementById('certTraineeSelect').value;
    const theme = document.getElementById('certTheme').value.trim();
    const date = document.getElementById('certDate').value;
    const result = document.getElementById('certResult').value;
    if (!traineeId || !theme || !date) {
        alert('Заполните все поля');
        return;
    }
    try {
        const response = await fetch('api/add_certification.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ traineeId, theme, date, result })
        });
        const res = await response.json();
        if (res.success) {
            hideAddCertificationForm();
            await loadCertifications();
        } else {
            alert('Ошибка: ' + res.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при добавлении аттестации');
    }
}

async function deleteCertification(id) {
    if (!checkAdmin()) return;
    if (!confirm('Удалить аттестацию?')) return;
    try {
        const response = await fetch('api/delete_certification.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await response.json();
        if (result.success) {
            await loadCertifications();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при удалении');
    }
}

function renderCertificationTable() {
    const tbody = document.getElementById('certificationTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    certificationsData.forEach(cert => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
             <td>${cert.trainee_name}</td>
             <td>${cert.комментарий || ''}</td>
             <td>${formatDateForDisplay(cert.Дата)}</td>
             <td>${cert.Результат}</td>
             <td>${currentRole === 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteCertification(${cert.id_аттестации})">Удалить</button>` : ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showAddCertificationForm() {
    if (!checkAdmin()) return;
    const select = document.getElementById('certTraineeSelect');
    select.innerHTML = '';
    traineesData.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id_стажера;
        option.textContent = t.ФИО;
        select.appendChild(option);
    });
    document.getElementById('certDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addCertificationForm').classList.remove('hidden');
}

function hideAddCertificationForm() {
    document.getElementById('addCertificationForm').classList.add('hidden');
    document.getElementById('certTheme').value = '';
}

// ==================== ОБУЧЕНИЕ ====================
function renderTrainingTable(data) {
    const tbody = document.getElementById('trainingTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        const status = row.status === 'завершено' ? '100%' : '0%';
        tr.innerHTML = `
             <td>${row.intern_name}</td>
             <td>${row.block_name}</td>
             <td><progress value="${row.status === 'завершено' ? 100 : 0}" max="100"></progress> ${status}</td>
             <td>${currentRole === 'admin' ? `<button class="btn btn-primary btn-sm" onclick="changeProgress(${row.order_id}, '${row.block_name}', ${row.intern_id})">Изменить</button>` : ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function changeProgress(orderId, courseName, traineeId) {
    if (!checkAdmin()) return;
    const newStatus = prompt('Введите статус (завершено/в процессе):', 'завершено');
    if (!newStatus) return;
    if (newStatus !== 'завершено' && newStatus !== 'в процессе') {
        alert('Некорректный статус');
        return;
    }
    // Для API update_course_progress.php нужен traineeId, courseName и прогресс (100 или 0)
    const progress = newStatus === 'завершено' ? 100 : 0;
    try {
        const response = await fetch('api/update_course_progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ traineeId, courseName, progress })
        });
        const result = await response.json();
        if (result.success) {
            await loadTrainingData();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при обновлении статуса');
    }
}

// ==================== ОТЧЁТЫ ====================
function renderReports() {
    // Прогресс стажёров (средний % по курсам)
    const progressBody = document.getElementById('progressReportBody');
    progressBody.innerHTML = '';
    traineesData.forEach(t => {
        const courses = t.courses || [];
        const avg = courses.length ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length) : 0;
        const lastAtt = t.attestations && t.attestations.length ? t.attestations[0].комментарий + ' (' + t.attestations[0].Результат + ')' : 'нет';
        const row = `<tr><td>${t.ФИО}</td><td>${courses.map(c => `${c.name} (${c.progress}%)`).join(', ') || 'нет'}</td><td>${avg}%</td><td>${lastAtt}</td></tr>`;
        progressBody.innerHTML += row;
    });

    // Средний % по курсам
    const courseStats = {};
    traineesData.forEach(t => {
        (t.courses || []).forEach(c => {
            if (!courseStats[c.name]) courseStats[c.name] = { sum: 0, count: 0 };
            courseStats[c.name].sum += c.progress;
            courseStats[c.name].count++;
        });
    });
    const tbodyCourses = document.getElementById('coursesAvgBody');
    tbodyCourses.innerHTML = '';
    for (let [name, stat] of Object.entries(courseStats)) {
        const avg = stat.count ? Math.round(stat.sum / stat.count) : 0;
        tbodyCourses.innerHTML += `<tr><td>${name}</td><td>${avg}%</td></tr>`;
    }

    // Статистика по наставникам
    const mentorStats = {};
    traineesData.forEach(t => {
        const mentorName = t.mentor || (t.mentorId ? mentorsData.find(m => m.id_наставника == t.mentorId)?.ФИО : 'Не назначен');
        mentorStats[mentorName] = (mentorStats[mentorName] || 0) + 1;
    });
    const tbodyMentors = document.getElementById('mentorsStatsBody');
    tbodyMentors.innerHTML = '';
    for (let [name, count] of Object.entries(mentorStats)) {
        tbodyMentors.innerHTML += `<tr><td>${name}</td><td>${count}</td></tr>`;
    }
}

// ==================== НАСТРОЙКИ (УПРАВЛЕНИЕ КУРСАМИ) ====================
function renderSettingsCourses() {
    const container = document.getElementById('coursesSettings');
    if (!container) return;
    container.innerHTML = '';
    coursesList.forEach((course, index) => {
        const div = document.createElement('div');
        div.className = 'settings-item';
        div.innerHTML = `
            <input type="text" value="${course.name}" onchange="updateCourseName(${course.id}, this.value)" style="flex:1; padding:8px;">
            <button class="btn btn-danger btn-sm" onclick="deleteCourse(${course.id})">Удалить</button>
        `;
        container.appendChild(div);
    });
}

async function updateCourseName(id, newName) {
    if (!checkAdmin()) return;
    if (!newName.trim()) return;
    try {
        const response = await fetch('api/update_course.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name: newName, description: '', duration: 0, level: 'Начальный' })
        });
        const result = await response.json();
        if (result.success) {
            await loadCourses();
            await loadTrainingData();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при обновлении курса');
    }
}

async function deleteCourse(id) {
    if (!checkAdmin()) return;
    if (!confirm('Удалить курс?')) return;
    try {
        const response = await fetch('api/delete_course.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await response.json();
        if (result.success) {
            await loadCourses();
            await loadTrainingData();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при удалении курса');
    }
}

async function addCourse() {
    if (!checkAdmin()) return;
    const name = document.getElementById('newCourseName').value.trim();
    if (!name) {
        alert('Введите название курса');
        return;
    }
    try {
        const response = await fetch('api/add_course.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: '', duration: 0, level: 'Начальный' })
        });
        const result = await response.json();
        if (result.success) {
            document.getElementById('newCourseName').value = '';
            await loadCourses();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка при добавлении курса');
    }
}

// ==================== ЭКСПОРТ ====================
function exportToCSV() {
    if (traineesData.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    const headers = ['ID', 'ФИО', 'Дата начала', 'Наставник', 'Статус', 'Примечания', 'Курсы', 'Аттестации'];
    const rows = traineesData.map(t => {
        const mentorName = t.mentor || (t.mentorId ? mentorsData.find(m => m.id_наставника == t.mentorId)?.ФИО : '');
        return [
            t.id_стажера,
            t.ФИО,
            formatDateForDisplay(t.Дата_начала_стажировки),
            mentorName,
            getTraineeStatus(t),
            t.примечания || '',
            (t.courses || []).map(c => `${c.name} (${c.progress}%)`).join('; '),
            (t.attestations || []).map(a => `${a.комментарий} ${formatDateForDisplay(a.Дата)} ${a.Результат}`).join('; ')
        ];
    });
    let csv = headers.join(';') + '\n';
    rows.forEach(r => csv += r.join(';') + '\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'stazhery.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==================== НАВИГАЦИЯ ====================
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    switch (sectionId) {
        case 'trainees':
            loadTrainees();
            break;
        case 'mentors':
            loadMentors();
            break;
        case 'certification':
            loadCertifications();
            break;
        case 'training':
            loadTrainingData();
            break;
        case 'reports':
            renderReports();
            break;
        case 'settings':
            loadCourses();
            break;
    }
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) link.classList.add('active');
    });
}

// ==================== АВТОРИЗАЦИЯ ====================
function showUserLogin() {
    currentRole = 'user';
    sessionStorage.setItem('currentRole', 'user');
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    applyRoleToUI();
    refreshAll();
    showSection('trainees');
}

function showAdminLogin() {
    document.getElementById('adminLoginFields').style.display = 'block';
}

function adminLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (username === 'Kutsevol' && password === '123diplom') {
        currentRole = 'admin';
        sessionStorage.setItem('currentRole', 'admin');
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        applyRoleToUI();
        refreshAll();
        showSection('trainees');
    } else {
        document.getElementById('loginError').innerText = 'Неверный логин или пароль';
    }
}

function logout() {
    currentRole = null;
    sessionStorage.removeItem('currentRole');
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('adminLoginFields').style.display = 'none';
    document.getElementById('loginError').innerText = '';
    closeModal();
}

function applyRoleToUI() {
    document.body.classList.remove('role-user', 'role-admin');
    document.body.classList.add(currentRole === 'admin' ? 'role-admin' : 'role-user');
}

function checkAdmin() {
    if (currentRole !== 'admin') {
        alert('Недостаточно прав');
        return false;
    }
    return true;
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    const savedRole = sessionStorage.getItem('currentRole');
    if (savedRole) {
        currentRole = savedRole;
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        applyRoleToUI();
        refreshAll();
        showSection('trainees');
    }
});