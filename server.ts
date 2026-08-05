import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_ADMIN_SETTINGS,
  INITIAL_TEACHERS,
  generateInitialAttendanceRecords,
} from './src/data/seedData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const STORE_PATH = path.join(process.cwd(), 'data_store.json');

function loadStoreData() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const fileContent = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (parsed && parsed.teachers && parsed.records && parsed.settings) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading data_store.json:', err);
  }

  const initial = {
    settings: INITIAL_ADMIN_SETTINGS,
    teachers: INITIAL_TEACHERS,
    records: generateInitialAttendanceRecords(),
    lastUpdated: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error initializing data_store.json:', err);
  }

  return initial;
}

let storeData = loadStoreData();

function saveStoreData(newData: any) {
  const ts = newData.lastUpdated || new Date().toISOString();
  storeData = {
    ...storeData,
    ...(newData.settings ? { settings: newData.settings } : {}),
    ...(newData.teachers ? { teachers: newData.teachers } : {}),
    ...(newData.records ? { records: newData.records } : {}),
    lastUpdated: ts,
  };

  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(storeData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data_store.json:', err);
  }
}

// Global API sync endpoint for all mobile devices & browsers
app.get('/api/sync', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json(storeData);
});

app.post('/api/sync', (req, res) => {
  const { settings, teachers, records, lastUpdated } = req.body;
  saveStoreData({ settings, teachers, records, lastUpdated });
  res.json({ success: true, storeData });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
