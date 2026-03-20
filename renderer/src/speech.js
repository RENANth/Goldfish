import { CONFIG } from "./config.js";
import { getPhrases } from "./preferences.js";

let speechEl = null;

export function initSpeech() {
  speechEl = document.getElementById("speech");
}

export function pickPhrase() {
  const phrases = getPhrases();
  if (phrases.length === 0) return ".";

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isFriday = day === 5;

  if (Math.random() < 0.15) {
    const timeKey = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const timePhrases = CONFIG.TIME_PHRASES[timeKey] || [];
    if (isFriday && CONFIG.TIME_PHRASES.friday) {
      timePhrases.push(...CONFIG.TIME_PHRASES.friday);
    }
    if (timePhrases.length > 0) {
      return timePhrases[Math.floor(Math.random() * timePhrases.length)];
    }
  }

  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function pickHappyPhrase() {
  return CONFIG.HAPPY_PHRASES[
    Math.floor(Math.random() * CONFIG.HAPPY_PHRASES.length)
  ];
}

export function speak(text, ttl = 3000) {
  if (!speechEl) return;
  speechEl.textContent = text;
  speechEl.classList.remove("hidden");
  speechEl.active = true;
  if (speechEl.timeoutId) clearTimeout(speechEl.timeoutId);
  speechEl.timeoutId = setTimeout(() => {
    speechEl.classList.add("hidden");
    speechEl.active = false;
  }, ttl);
}

export function updateSpeechPos(x, y, yOffset) {
  if (speechEl && speechEl.active) {
    speechEl.style.left = x + "px";
    speechEl.style.top = y - yOffset + "px";
  }
}

export function isSpeaking() {
  return speechEl && speechEl.active;
}
