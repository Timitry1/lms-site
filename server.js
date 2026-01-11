const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return { students: {}, lessons: {}, roadmaps: {}, schedule: { slots: {} }, whiteboards: {} };
  }
}

function writeData(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// Корневой маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LMS Backend is running',
    endpoints: {
      'GET /sync': 'Get all data',
      'POST /sync': 'Save all data'
    }
  });
});

// GET full dataset
app.get('/sync', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST to merge and overwrite dataset
app.post('/sync', (req, res) => {
  const newData = req.body;
  if (!newData || typeof newData !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  // Читаем текущие данные с диска
  const currentData = readData();

  // Аккуратно объединяем данные. Новые данные имеют приоритет.
  const mergedData = {
    students: { ...currentData.students, ...newData.students },
    lessons: { ...currentData.lessons, ...newData.lessons },
    roadmaps: { ...currentData.roadmaps, ...newData.roadmaps },
    schedule: { ...currentData.schedule, ...newData.schedule },
    whiteboards: { ...currentData.whiteboards, ...newData.whiteboards },
  };

  // Обрабатываем удаление: если у ученика в новых данных нет, а в старых есть,
  // то нужно удалить его уроки, роудмапы и слоты в расписании.
  if (newData.students) {
      Object.keys(currentData.students || {}).forEach(studentId => {
          if (!newData.students[studentId]) {
              delete mergedData.lessons[studentId];
              delete mergedData.roadmaps[studentId];
              delete mergedData.whiteboards[studentId];
              if (mergedData.schedule && mergedData.schedule.slots) {
                  Object.keys(mergedData.schedule.slots).forEach(slotKey => {
                      if (mergedData.schedule.slots[slotKey] === studentId) {
                          delete mergedData.schedule.slots[slotKey];
                      }
                  });
              }
          }
      });
  }

  writeData(mergedData);
  res.json({ ok: true, message: 'Data merged successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LMS backend listening on port ${PORT}`));
