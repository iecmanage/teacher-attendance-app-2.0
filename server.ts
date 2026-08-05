import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import fetch from 'node-fetch';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  INITIAL_ADMIN_SETTINGS,
  INITIAL_TEACHERS,
  generateInitialAttendanceRecords,
} from './src/data/seedData';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const STORE_PATH = path.join(process.cwd(), 'data_store.json');
let storeData: any = null;

// Helper: read stream to string
async function streamToString(stream: any) {
  return await new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function readFromS3() {
  const bucket = process.env.S3_BUCKET;
  const key = process.env.S3_KEY || 'data_store.json';
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const region = process.env.AWS_REGION || 'us-east-1';
  const client = new S3Client({ region });
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await client.send(cmd);
  const body = await streamToString(res.Body as any);
  return JSON.parse(body);
}

async function writeToS3(obj: any) {
  const bucket = process.env.S3_BUCKET;
  const key = process.env.S3_KEY || 'data_store.json';
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const region = process.env.AWS_REGION || 'us-east-1';
  const client = new S3Client({ region });
  const body = JSON.stringify(obj, null, 2);
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/json' });
  await client.send(cmd);
}

async function readFromGist() {
  const gistId = process.env.GIST_ID;
  const token = process.env.GIST_TOKEN;
  if (!gistId) throw new Error('GIST_ID not configured');
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: token ? { Authorization: `token ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Gist read failed: ${res.status}`);
  const data = await res.json();
  // Expect a file named data_store.json or first file
  if (data.files && data.files['data_store.json'] && data.files['data_store.json'].content) {
    return JSON.parse(data.files['data_store.json'].content);
  }
  // fallback: try first file
  const firstFileKey = Object.keys(data.files || {})[0];
  if (firstFileKey) {
    return JSON.parse(data.files[firstFileKey].content);
  }
  throw new Error('No file content found in gist');
}

async function writeToGist(obj: any) {
  const gistId = process.env.GIST_ID;
  const token = process.env.GIST_TOKEN;
  if (!gistId) throw new Error('GIST_ID not configured');
  if (!token) throw new Error('GIST_TOKEN not configured');
  const body = {
    files: {
      'data_store.json': {
        content: JSON.stringify(obj, null, 2),
      },
    },
  };
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gist write failed: ${res.status}`);
}

async function loadStoreData() {
  // Try configured backends in order
  const backend = (process.env.STORAGE_BACKEND || 'filesystem').toLowerCase();
  try {
    if (backend === 's3') {
      return await readFromS3();
    } else if (backend === 'gist') {
      return await readFromGist();
    } else {
      // filesystem
      if (fs.existsSync(STORE_PATH)) {
        const fileContent = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed && parsed.teachers && parsed.records && parsed.settings) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Error reading store from backend:', backend, err);
  }

  // If we reach here, return initial seed and persist it
  const initial = {
    settings: INITIAL_ADMIN_SETTINGS,
    teachers: INITIAL_TEACHERS,
    records: generateInitialAttendanceRecords(),
    lastUpdated: new Date().toISOString(),
  };

  try {
    await saveStoreData(initial);
  } catch (err) {
    console.error('Error initializing remote store:', err);
  }

  return initial;
}

async function saveStoreData(newData: any) {
  const ts = newData.lastUpdated || new Date().toISOString();
  // If storeData exists, prevent stale writes unless incoming timestamp is newer
  if (storeData && newData.lastUpdated) {
    const incoming = new Date(newData.lastUpdated).getTime();
    const current = new Date(storeData.lastUpdated || 0).getTime();
    if (incoming < current) {
      const err: any = new Error('Incoming data is older than current store (stale write)');
      err.code = 'STALE_WRITE';
      err.currentStore = storeData;
      throw err;
    }
  }

  const merged = {
    ...storeData,
    ...(newData.settings ? { settings: newData.settings } : {}),
    ...(newData.teachers ? { teachers: newData.teachers } : {}),
    ...(newData.records ? { records: newData.records } : {}),
    lastUpdated: ts,
  };

  const backend = (process.env.STORAGE_BACKEND || 'filesystem').toLowerCase();
  try {
    if (backend === 's3') {
      await writeToS3(merged);
    } else if (backend === 'gist') {
      await writeToGist(merged);
    } else {
      fs.writeFileSync(STORE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    }
    storeData = merged;
  } catch (err) {
    console.error('Error writing store to backend:', backend, err);
    throw err;
  }
}

// Global API sync endpoint for all mobile devices & browsers
app.get('/api/sync', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (!storeData) {
    return res.status(500).json({ error: 'Store not initialized' });
  }
  res.json(storeData);
});

app.post('/api/sync', async (req, res) => {
  const { settings, teachers, records, lastUpdated } = req.body;
  try {
    await saveStoreData({ settings, teachers, records, lastUpdated });
    return res.json({ success: true, storeData });
  } catch (err: any) {
    console.error('POST /api/sync failed', err);
    if (err.code === 'STALE_WRITE') {
      return res.status(409).json({ success: false, error: 'stale_write', currentStore: err.currentStore });
    }
    return res.status(500).json({ success: false, error: String(err) });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  // Initialize store data from chosen backend
  storeData = await loadStoreData();

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
    console.log('Storage backend:', process.env.STORAGE_BACKEND || 'filesystem');
  });
}

startServer().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
