const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let windowTrackerProc = null;

function startWindowTracker(win, appDir) {
    if (process.platform !== 'win32') return;

    const scriptPath = path.join(appDir, 'scripts', 'window-bounds.ps1');
    if (!fs.existsSync(scriptPath)) return;

    windowTrackerProc = spawn('powershell.exe', [
        '-ExecutionPolicy', 'Bypass',
        '-NoProfile',
        '-NonInteractive',
        '-File', scriptPath
    ]);

    let lastBoundsStr = "";

    windowTrackerProc.stdout.on('data', (data) => {
        if (!win) return;
        const lines = data.toString().split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
            const boundsStr = lines[lines.length - 1];
            if (boundsStr !== lastBoundsStr) {
                lastBoundsStr = boundsStr;
                const [l, t, r, b] = boundsStr.split(',').map(Number);
                if (!isNaN(l) && !isNaN(r)) {
                    win.webContents.send('active-window-bounds', { left: l, top: t, right: r, bottom: b });
                }
            }
        }
    });

    windowTrackerProc.stderr.on('data', (data) => console.log('PS Error: ' + data.toString()));
}

app.on('quit', () => {
    if (windowTrackerProc) {
        windowTrackerProc.kill();
    }
});

module.exports = { startWindowTracker };
