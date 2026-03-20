const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getCursorPos: () => ipcRenderer.invoke("get-cursor-pos"),
  setIgnoreMouse: (ignore) => ipcRenderer.send("set-ignore-mouse", !!ignore),
  robotMove: (dx, dy, smooth = true) =>
    ipcRenderer.invoke("robot-move", dx, dy, smooth),
  getScreenBounds: () => ipcRenderer.invoke("get-screen-bounds"),
  getSkin: (name) => ipcRenderer.invoke("get-skin", name),
  onContextMenuAction: (callback) =>
    ipcRenderer.on("context-menu-action", (event, action) => callback(action)),
  trashItem: (filePath) => ipcRenderer.invoke("trash-item", filePath),
  onActiveWindowBounds: (callback) =>
    ipcRenderer.on("active-window-bounds", (event, bounds) => callback(bounds)),
});
