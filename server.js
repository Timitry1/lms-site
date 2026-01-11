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
    return { students: {}, lessons: {}, roadmaps: {} };
  }
}

function writeData(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// GET full dataset
app.get('/sync', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST to overwrite dataset (basic, no auth)
app.post('/sync', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid body' });
  const normalized = {
    students: body.students || {},
    lessons: body.lessons || {},
    roadmaps: body.roadmaps || {}
  };
  writeData(normalized);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LMS backend listening on port ${PORT}`));
