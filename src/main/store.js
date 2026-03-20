const Store = require("electron-store");

const store = new Store({
  defaults: {
    skinName: "goldfish",
    personality: "travesso",
    personalityAuto: true,
    workMode: false,
    customPhrases: [],
  },
});

function getPreferences() {
  return {
    skinName: store.get("skinName"),
    personality: store.get("personality"),
    personalityAuto: store.get("personalityAuto"),
    workMode: store.get("workMode"),
    customPhrases: store.get("customPhrases"),
  };
}

function setPreference(key, value) {
  store.set(key, value);
}

function setPreferences(prefs) {
  if (prefs.skinName != null) store.set("skinName", prefs.skinName);
  if (prefs.personality != null) store.set("personality", prefs.personality);
  if (prefs.personalityAuto != null)
    store.set("personalityAuto", prefs.personalityAuto);
  if (prefs.workMode != null) store.set("workMode", prefs.workMode);
  if (prefs.customPhrases != null)
    store.set("customPhrases", prefs.customPhrases);
}

function addCustomPhrase(phrase) {
  const list = store.get("customPhrases");
  if (!phrase || typeof phrase !== "string") return false;
  const trimmed = phrase.trim();
  if (!trimmed || list.includes(trimmed)) return false;
  list.push(trimmed);
  store.set("customPhrases", list);
  return true;
}

function getUserDataPath() {
  return require("electron").app.getPath("userData");
}

module.exports = {
  getPreferences,
  setPreference,
  setPreferences,
  addCustomPhrase,
  getUserDataPath,
};
