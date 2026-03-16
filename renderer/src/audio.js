const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playBeep(freq = 440, time = 0.12, gain = 0.08) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + time);
}

export function playSound(type) {
    if (type === 'bounce') playBeep(200 + Math.random() * 100, 0.1, 0.04);
    if (type === 'eat') playBeep(1200 + Math.random() * 200, 0.08, 0.1);
    if (type === 'spawn') playBeep(600, 0.05, 0.02);
}
