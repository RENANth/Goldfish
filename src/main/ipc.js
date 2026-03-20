const { ipcMain, screen, shell } = require("electron");
const path = require("path");
const fs = require("fs");

let robot = null;
try {
  robot = require("robotjs");
} catch (e) {
  console.log("robotjs não instalado - ignorando funções nativas de cursor");
}

function initIPC(appDir) {
  ipcMain.handle("get-cursor-pos", () => {
    try {
      return screen.getCursorScreenPoint();
    } catch (e) {
      return { x: 0, y: 0 };
    }
  });

  ipcMain.handle("robot-move", async (event, dx, dy, smooth = true) => {
    if (!robot) return { ok: false, reason: "robotjs não disponível" };
    try {
      const pos = screen.getCursorScreenPoint();
      const nx = Math.round(pos.x + dx);
      const ny = Math.round(pos.y + dy);
      if (smooth && robot.moveMouseSmooth) robot.moveMouseSmooth(nx, ny);
      else robot.moveMouse(nx, ny);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  });

  ipcMain.handle("get-screen-bounds", () => {
    return screen.getPrimaryDisplay().bounds;
  });

  ipcMain.handle("get-skin", async (event, skinName) => {
    const skinDir = path.join(appDir, "skins", skinName);
    let meta = {};
    try {
      meta = JSON.parse(
        fs.readFileSync(path.join(skinDir, "meta.json"), "utf8"),
      );
    } catch (e) {}

    const sheetFile = meta.sheetFile || "sheet.png";
    const sheetPath = path.join(skinDir, sheetFile);
    const sheetPngPath = path.join(skinDir, "sheet.png");
    const tryPaths = [sheetPath];
    if (sheetPath !== sheetPngPath) tryPaths.push(sheetPngPath);

    let imageDataUrl = null;
    for (const tryPath of tryPaths) {
      try {
        const buf = fs.readFileSync(tryPath);
        const base64 = buf.toString("base64");
        const ext = path.extname(tryPath).toLowerCase();
        const mime = ext === ".svg" ? "image/svg+xml" : "image/png";
        imageDataUrl = `data:${mime};base64,${base64}`;
        break;
      } catch (e) {}
    }

    let bubblesDataUrl = null;
    const bubblesPath = path.join(skinDir, "bubbles.png");
    try {
      if (fs.existsSync(bubblesPath)) {
        const bBase64 = fs.readFileSync(bubblesPath).toString("base64");
        bubblesDataUrl = `data:image/png;base64,${bBase64}`;
      }
    } catch (e) {}

    return { meta, imageDataUrl, bubblesDataUrl };
  });

  ipcMain.handle("trash-item", async (event, filePath) => {
    try {
      await shell.trashItem(filePath);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  });
}

function setIgnoreMouseIPC(win) {
  ipcMain.on("set-ignore-mouse", (event, ignore) => {
    if (!win) return;
    try {
      win.setIgnoreMouseEvents(ignore, { forward: true });
    } catch (e) {
      console.error(e);
    }
  });
}

module.exports = { initIPC, setIgnoreMouseIPC };
