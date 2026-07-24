const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');

const PORT = process.env.PORT || 7777;
const LHM_URL = process.env.LHM_URL || 'http://localhost:8085/data.json';
const PUBLIC_DIR = path.join(__dirname, 'public');
const ACTIONS_PATH = path.join(__dirname, 'actions.json');
const MEDIA_ACTIONS = new Set(['playpause', 'next', 'prev', 'stop', 'volup', 'voldown', 'mute']);

const SYSTEM_ACTIONS = {
    lock: (cb) => execFile('rundll32.exe', ['user32.dll,LockWorkStation'], cb),
    sleep: (cb) => execFile('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0'], cb),
};

function loadActions() {
    return JSON.parse(fs.readFileSync(ACTIONS_PATH, 'utf8'));
}

function findButton(actions, id) {
    for (const page of actions.pages) {
        const hit = page.buttons.find((b) => b.id === id);
        if (hit) return hit;
    }
    return null;
}

function runButton(button, callback) {
    if (button.type === 'launch') {
        exec(`start "" "${button.target}"`, callback);
        return;
    }
    if (button.type === 'system') {
        const fn = SYSTEM_ACTIONS[button.action];
        if (!fn) return callback(new Error('unknown system action'));
        fn(callback);
        return;
    }
    if (button.type === 'hotkey') {
        execFile(
            'powershell.exe',
            ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'hotkey.ps1'), '-Combo', button.keys],
            callback
        );
        return;
    }
    if (button.type === 'script') {
        execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', button.target], callback);
        return;
    }
    callback(new Error('unknown button type'));
}

// Walks the LibreHardwareMonitor sensor tree and returns every leaf sensor
// as {label, sensorId, value}. `label` is the leaf's own name (e.g. "CPU Package"),
// distinct from the full breadcrumb, so matching doesn't depend on parent naming.
function flattenSensors(node, out) {
    const children = node.Children || [];
    if (children.length === 0) {
        if (node.SensorId && node.Value !== undefined && node.Value !== '') {
            out.push({ label: node.Text || '', sensorId: node.SensorId, value: node.Value });
        }
        return;
    }
    children.forEach((child) => flattenSensors(child, out));
}

const isCpuVendor = (id) => id.includes('/intelcpu/') || id.includes('/amdcpu/');
const isGpuVendor = (id) => id.includes('gpu-');
const isCpuTemp = (id) => isCpuVendor(id) && id.includes('/temperature/');
const isCpuLoad = (id) => isCpuVendor(id) && id.includes('/load/');
const isGpuTemp = (id) => isGpuVendor(id) && id.includes('/temperature/');
const isGpuLoad = (id) => isGpuVendor(id) && id.includes('/load/');

function pickBySensorId(sensors, exactId) {
    const hit = sensors.find((s) => s.sensorId === exactId);
    return hit ? hit.value : null;
}

// Tries each label in priority order (exact match first, then substring) within
// sensors whose SensorId passes idFilter. Handles vendor differences (Intel vs AMD)
// and hardware that doesn't expose every sensor (e.g. iGPUs with no temp reading).
function pickByLabel(sensors, idFilter, labelsInPriorityOrder) {
    const pool = sensors.filter((s) => idFilter(s.sensorId));
    for (const wanted of labelsInPriorityOrder) {
        const hit = pool.find((s) => s.label.toLowerCase() === wanted.toLowerCase());
        if (hit) return hit.value;
    }
    for (const wanted of labelsInPriorityOrder) {
        const hit = pool.find((s) => s.label.toLowerCase().includes(wanted.toLowerCase()));
        if (hit) return hit.value;
    }
    return null;
}

function summarize(sensors) {
    return {
        cpuTemp: pickByLabel(sensors, isCpuTemp, ['CPU Package', 'Core (Tctl/Tdie)', 'Core Max']),
        cpuLoad: pickByLabel(sensors, isCpuLoad, ['CPU Total']),
        gpuTemp: pickByLabel(sensors, isGpuTemp, ['GPU Core', 'GPU Hot Spot', 'Temperature']),
        gpuLoad: pickByLabel(sensors, isGpuLoad, ['GPU Core', 'D3D 3D']),
        ramUsed: pickBySensorId(sensors, '/ram/load/0'),
        ramUsedGb: pickBySensorId(sensors, '/ram/data/0'),
    };
}

async function getStats() {
    const res = await fetch(LHM_URL);
    if (!res.ok) throw new Error(`LibreHardwareMonitor responded ${res.status}`);
    const tree = await res.json();
    const sensors = [];
    flattenSensors(tree, sensors);
    return { summary: summarize(sensors), raw: sensors };
}

function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
    const reqPath = req.url === '/' ? '/dashboard.html' : req.url;
    const filePath = path.join(PUBLIC_DIR, path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, ''));
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath);
        const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/api/stats' && req.method === 'GET') {
        try {
            const { summary } = await getStats();
            sendJson(res, 200, summary);
        } catch (err) {
            sendJson(res, 502, { error: err.message });
        }
        return;
    }

    if (req.url === '/api/raw' && req.method === 'GET') {
        try {
            const { raw } = await getStats();
            sendJson(res, 200, raw);
        } catch (err) {
            sendJson(res, 502, { error: err.message });
        }
        return;
    }

    if (req.url.startsWith('/api/media/') && req.method === 'POST') {
        const action = req.url.split('/')[3];
        if (!MEDIA_ACTIONS.has(action)) {
            sendJson(res, 400, { error: 'unknown action' });
            return;
        }
        execFile(
            'powershell.exe',
            ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'media-key.ps1'), '-Key', action],
            (err) => {
                if (err) sendJson(res, 500, { error: err.message });
                else sendJson(res, 200, { ok: true });
            }
        );
        return;
    }

    if (req.url === '/api/nowplaying' && req.method === 'GET') {
        execFile(
            'powershell.exe',
            ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'get-nowplaying.ps1')],
            (err, stdout) => {
                if (err) {
                    sendJson(res, 502, { error: err.message });
                    return;
                }
                try {
                    sendJson(res, 200, JSON.parse(stdout));
                } catch (parseErr) {
                    sendJson(res, 502, { error: 'bad nowplaying output' });
                }
            }
        );
        return;
    }

    if (req.url === '/api/actions' && req.method === 'GET') {
        try {
            sendJson(res, 200, loadActions());
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    if (req.url.startsWith('/api/action/') && req.method === 'POST') {
        const id = req.url.split('/')[3];
        let actions;
        try {
            actions = loadActions();
        } catch (err) {
            sendJson(res, 500, { error: err.message });
            return;
        }
        const button = findButton(actions, id);
        if (!button) {
            sendJson(res, 404, { error: 'unknown button' });
            return;
        }
        runButton(button, (err) => {
            if (err) sendJson(res, 500, { error: err.message });
            else sendJson(res, 200, { ok: true });
        });
        return;
    }

    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log(`PC dock server running at http://localhost:${PORT}`);
    console.log(`Reading sensors from ${LHM_URL}`);
});
