const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = process.env.PORT      || 1793;
const DATA_DIR = process.env.DATA_DIR  || '/data';
const DATA_FILE = path.join(DATA_DIR, 'appdata.json');

const defaultData = {
  incomes: [],
  savings: [],
  expenses: [],
  goals: [],
  businessTransactions: [],
  settings: { husbandName: 'Husband', wifeName: 'Wife', currency: '₹' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return defaultData;
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return defaultData;
  }
}

function writeData(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf8');
}

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));

// Serve built React app
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes ─────────────────────────────────────────────────────────────────

app.get('/api/data', (_req, res) => {
  res.json(readData());
});

app.put('/api/data', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    writeData(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('Write error:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// ── SPA fallback ───────────────────────────────────────────────────────────────

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Finance Tracker server running on port ${PORT}`);
  console.log(`Data stored at: ${DATA_FILE}`);
});
