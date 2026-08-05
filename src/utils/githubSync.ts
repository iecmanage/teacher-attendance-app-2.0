import { AdminSettings, Teacher, AttendanceRecord } from '../types';

export interface FullAttendanceExport {
  version: string;
  lastUpdated: string;
  instituteName: string;
  settings: AdminSettings;
  teachers: Teacher[];
  records: AttendanceRecord[];
}

/**
 * Fetch full attendance JSON from a GitHub Gist
 */
export async function fetchGistData(
  githubToken: string,
  gistId: string
): Promise<FullAttendanceExport | null> {
  if (!gistId) return null;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    if (!res.ok) {
      throw new Error(`GitHub Gist API error (${res.status}): ${res.statusText}`);
    }

    const gistObj = await res.json();
    const files = gistObj.files;
    
    // Look for attendance.json or first file in gist
    const targetFileKey = Object.keys(files).find(
      (key) => key.endsWith('.json') || key === 'iec_attendance_data.json'
    ) || Object.keys(files)[0];

    if (!targetFileKey || !files[targetFileKey]) {
      throw new Error('No JSON file found inside specified GitHub Gist.');
    }

    let contentStr = files[targetFileKey].content;
    if (!contentStr && files[targetFileKey].raw_url) {
      const rawRes = await fetch(files[targetFileKey].raw_url);
      contentStr = await rawRes.text();
    }

    if (!contentStr) {
      throw new Error('JSON file content inside GitHub Gist is empty.');
    }

    const parsedData: FullAttendanceExport = JSON.parse(contentStr);
    return parsedData;
  } catch (err) {
    console.error('Error fetching data from GitHub Gist:', err);
    throw err;
  }
}

/**
 * Save / Update full attendance JSON in GitHub Gist
 */
export async function updateGistData(
  githubToken: string,
  gistId: string,
  exportData: FullAttendanceExport
): Promise<boolean> {
  if (!githubToken || !gistId) return false;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${githubToken}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      description: `IEC Faculty Attendance Database - Updated ${new Date().toLocaleString()}`,
      files: {
        'iec_attendance_data.json': {
          content: JSON.stringify(exportData, null, 2),
        },
      },
    };

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`GitHub Gist update failed (${res.status}): ${res.statusText}`);
    }

    return true;
  } catch (err) {
    console.error('Error updating GitHub Gist:', err);
    throw err;
  }
}

/**
 * Create a new GitHub Gist with initial IEC Attendance JSON
 */
export async function createNewGist(
  githubToken: string,
  exportData: FullAttendanceExport
): Promise<string> {
  if (!githubToken) {
    throw new Error('GitHub Personal Access Token is required to create a Gist.');
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${githubToken}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    description: 'Islamic Education Center - Faculty Attendance Database JSON',
    public: false, // Secret Gist
    files: {
      'iec_attendance_data.json': {
        content: JSON.stringify(exportData, null, 2),
      },
    },
  };

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`GitHub Gist creation failed (${res.status}): ${res.statusText}`);
  }

  const gistObj = await res.json();
  return gistObj.id;
}
