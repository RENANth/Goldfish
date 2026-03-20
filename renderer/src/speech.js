import { CONFIG } from "./config.js";

let speechEl = null;

export function initSpeech() {
  speechEl = document.getElementById("speech");
}

export function pickPhrase() {
  return CONFIG.PHRASES[Math.floor(Math.random() * CONFIG.PHRASES.length)];
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
