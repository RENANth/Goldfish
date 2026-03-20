const {
  app,
  BrowserWindow,
  screen,
  Menu,
  Tray,
  globalShortcut,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");

const { startWindowTracker } = require("./src/main/windowTracker");
const { initIPC, setIgnoreMouseIPC } = require("./src/main/ipc");
const { getPreferences } = require("./src/main/store");

let win;
let tray = null;

function createWindow() {
  const primary = screen.getPrimaryDisplay();
  const { width, height, x, y } = primary.bounds;

  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));

  if (process.env.DEBUG_DEVTOOLS === "1") {
    win.webContents.openDevTools({ mode: "detach" });
  }

  // Custom Context Menu
  win.webContents.on("context-menu", (e, props) => {
    const prefs = getPreferences();
    let skinsList = [];
    try {
      skinsList = fs
        .readdirSync(path.join(__dirname, "skins"))
        .filter((f) =>
          fs.statSync(path.join(__dirname, "skins", f)).isDirectory(),
        );
    } catch (err) {}

    const skinSubmenu = skinsList.map((s) => ({
      label: s,
      type: "radio",
      checked: prefs.skinName === s,
      click: () => {
        win.webContents.send("context-menu-action", "set-skin:" + s);
      },
    }));

    const template = [
      {
        label: "Alimentar (Duplo Clique)",
        accelerator: "Ctrl+Shift+F",
        click: () => {
          win.webContents.send("context-menu-action", "feed");
        },
      },
      {
        label: "Dar Brinquedo",
        click: () => {
          win.webContents.send("context-menu-action", "spawn-toy");
        },
      },
      { type: "separator" },
      {
        label: "Personalidade",
        submenu: [
          {
            label: "Aleatória",
            type: "radio",
            checked: prefs.personalityAuto,
            click: () =>
              win.webContents.send(
                "context-menu-action",
                "set-personality:aleatoria",
              ),
          },
          {
            label: "Calmo",
            type: "radio",
            checked: !prefs.personalityAuto && prefs.personality === "calmo",
            click: () =>
              win.webContents.send(
                "context-menu-action",
                "set-personality:calmo",
              ),
          },
          {
            label: "Travesso",
            type: "radio",
            checked: !prefs.personalityAuto && prefs.personality === "travesso",
            click: () =>
              win.webContents.send(
                "context-menu-action",
                "set-personality:travesso",
              ),
          },
          {
            label: "Caótico",
            type: "radio",
            checked: !prefs.personalityAuto && prefs.personality === "caotico",
            click: () =>
              win.webContents.send(
                "context-menu-action",
                "set-personality:caotico",
              ),
          },
        ],
      },
      {
        label: "Skin",
        submenu:
          skinSubmenu.length > 0
            ? skinSubmenu
            : [{ label: "Nenhuma pasta encontrada", enabled: false }],
      },
      {
        label: "Modo colega de trabalho",
        type: "checkbox",
        checked: prefs.workMode,
        click: () => {
          win.webContents.send("context-menu-action", "toggle-work-mode");
        },
      },
      {
        label: "Adicionar frase personalizada...",
        click: () => {
          win.webContents.send("context-menu-action", "add-custom-phrase");
        },
      },
      { type: "separator" },
      {
        label: "Dormir",
        accelerator: "Ctrl+Shift+S",
        click: () => {
          win.webContents.send("context-menu-action", "sleep");
        },
      },
      { type: "separator" },
      {
        label: "Sair",
        click: () => {
          app.quit();
        },
      },
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: win });
  });

  setIgnoreMouseIPC(win);
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

initIPC(__dirname);

// Ícone 16x16 minimal (peixe/água) em base64
const TRAY_ICON_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAiklEQVQ4T2NkoBAwUqifgYGB4T8DA8P/f///MzD8/8/wn+H/fwYGBob/DBSYwMDA8J+RkZGBAReACvxnZPz/n4HxPwMjAwMDIwMDAyMjIwMjIyMDIyMjAyMjIwMjIyMDIyMjAyMjIwMjIyMDIyMjAyMjIwMjIyMDIyMjAyMjIwMjIyMDIyMjAyMjIwMjIyMDIyMjAwAAN+gOErk2QiAAAAAASUVORK5CYII=";

function createTray() {
  const iconPath = path.join(__dirname, "renderer", "assets", "tray-icon.png");
  const icon = fs.existsSync(iconPath)
    ? iconPath
    : nativeImage.createFromDataURL(
        "data:image/png;base64," + TRAY_ICON_BASE64,
      );
  tray = new Tray(icon);
  tray.setToolTip("Peixe Pixel Supremo");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Alimentar",
        accelerator: "Ctrl+Shift+F",
        click: () => win?.webContents?.send("context-menu-action", "feed"),
      },
      {
        label: "Dormir",
        accelerator: "Ctrl+Shift+S",
        click: () => win?.webContents?.send("context-menu-action", "sleep"),
      },
      { type: "separator" },
      { label: "Mostrar", click: () => win?.show() },
      { label: "Esconder", click: () => win?.hide() },
      { type: "separator" },
      { label: "Sair", click: () => app.quit() },
    ]),
  );
  tray.on("double-click", () => win?.show());
}

app.whenReady().then(() => {
  createWindow();
  startWindowTracker(win, __dirname);

  globalShortcut.register("Ctrl+Shift+F", () => {
    win?.webContents?.send("context-menu-action", "feed");
  });
  globalShortcut.register("Ctrl+Shift+S", () => {
    win?.webContents?.send("context-menu-action", "sleep");
  });
  if (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_DEVTOOLS === "1"
  ) {
    globalShortcut.register("Ctrl+Shift+D", () => {
      if (win?.webContents?.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win?.webContents?.openDevTools({ mode: "detach" });
      }
    });
  }

  try {
    createTray();
  } catch (e) {
    console.log("Tray não disponível:", e.message);
  }

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
