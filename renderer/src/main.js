import { fish, skin, globals, rand } from "./state.js";
import { CONFIG } from "./config.js";
import { loadPreferences, setPreferences, getWorkMode } from "./preferences.js";
import { initInput } from "./input.js";
import { initSpeech, speak, pickPhrase } from "./speech.js";
import { playBeep } from "./audio.js";
import { loadSkin } from "./fish.js";
import { updatePhysics } from "./physics.js";
import { drawFrame } from "./drawing.js";

function applyDayNightTheme() {
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;
  document.documentElement.classList.toggle("theme-night", isNight);
  document.documentElement.classList.toggle("theme-day", !isNight);
}

(async () => {
  globals.canvas = document.getElementById("stage");
  globals.ctx = globals.canvas.getContext("2d");

  initSpeech();
  const prefs = await loadPreferences();
  fish.skinName = prefs.skinName;
  fish.personality = prefs.personality;
  fish.personalityAuto = prefs.personalityAuto;

  const bounds = await window.api.getScreenBounds();
  globals.canvas.width = bounds.width;
  globals.canvas.height = bounds.height;

  await loadSkin(fish.skinName);
  if (skin.meta && skin.meta.displayScale) fish.scale = skin.meta.displayScale;

  applyDayNightTheme();
  setInterval(applyDayNightTheme, 60000);

  initInput();

  globals.lastTime = performance.now();

  // Timers de Personalidade
  fish.personalityAuto = true;
  setInterval(
    () => {
      if (!fish.personalityAuto) return;
      const r = Math.random();
      if (r < 0.33) fish.personality = CONFIG.PERSONALITIES.CALMO;
      else if (r < 0.66) fish.personality = CONFIG.PERSONALITIES.TRAVESSO;
      else fish.personality = CONFIG.PERSONALITIES.CAOTICO;
    },
    1000 * 60 * rand(1.5, 4),
  );

  // Timers de Frases
  setInterval(() => {
    const freq =
      {
        [CONFIG.PERSONALITIES.CALMO]: 0.3,
        [CONFIG.PERSONALITIES.TRAVESSO]: 0.6,
        [CONFIG.PERSONALITIES.CAOTICO]: 0.95,
      }[fish.personality] || 0.5;
    if (Math.random() < freq) speak(pickPhrase());
  }, CONFIG.PHRASE_INTERVAL);

  // Timers de Sons
  setInterval(() => {
    const freqMap =
      {
        [CONFIG.PERSONALITIES.CALMO]: 600,
        [CONFIG.PERSONALITIES.TRAVESSO]: 900,
        [CONFIG.PERSONALITIES.CAOTICO]: 1200,
      }[fish.personality] || 800;
    if (Math.random() < 0.7) playBeep(freqMap, 0.12, 0.06);
  }, CONFIG.SOUND_INTERVAL);

  // Timer de Movimentos do Mouse (Caos)
  setInterval(async () => {
    if (
      fish.personality === CONFIG.PERSONALITIES.CAOTICO &&
      Math.random() < 0.4
    ) {
      const dx = rand(-80, 80);
      const dy = rand(-50, 50);
      try {
        await window.api.robotMove(dx, dy, true);
      } catch (e) {}
    }
  }, 12000);

  // Loop de Animação
  function frame(now) {
    let dt = (now - globals.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    globals.lastTime = now;

    updatePhysics(dt, now);
    drawFrame(globals.ctx, globals.canvas);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
