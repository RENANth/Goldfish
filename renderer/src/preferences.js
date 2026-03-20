import { CONFIG } from "./config.js";

let _prefs = {
  skinName: "goldfish",
  personality: "travesso",
  personalityAuto: true,
  workMode: false,
  customPhrases: [],
};

export async function loadPreferences() {
  try {
    const p = await window.api.getPreferences();
    _prefs = { ..._prefs, ...p };
    return _prefs;
  } catch (e) {
    console.warn("Falha ao carregar preferências:", e);
    return _prefs;
  }
}

export function getPreferences() {
  return { ..._prefs };
}

export function getWorkMode() {
  return _prefs.workMode;
}

export function getCustomPhrases() {
  return [...(_prefs.customPhrases || [])];
}

export function getPhrases() {
  const custom = getCustomPhrases();
  const base = _prefs.workMode ? CONFIG.WORK_PHRASES : CONFIG.PHRASES;
  return custom.length ? [...base, ...custom] : base;
}

export async function setPreferences(partial) {
  _prefs = { ..._prefs, ...partial };
  await window.api.setPreferences(_prefs);
}

export async function addCustomPhrase(phrase) {
  const result = await window.api.addCustomPhrase(phrase);
  if (result.ok) {
    await loadPreferences();
    return true;
  }
  return false;
}
