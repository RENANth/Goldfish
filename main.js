const { app, BrowserWindow, screen, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const { startWindowTracker } = require("./src/main/windowTracker");
const { initIPC, setIgnoreMouseIPC } = require("./src/main/ipc");

let win;

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
      click: () => {
        win.webContents.send("context-menu-action", "set-skin:" + s);
      },
    }));

    const template = [
      {
        label: "Alimentar (Duplo Clique)",
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
            checked: true,
            click: () =>
              win.webContents.send(
                "context-menu-action",
                "set-personality:aleatoria",
              ),
          },
          {
            label: "Calmo",
            type: "radio",
            checked: false,
            click: () =>
              win.webContents.send(
                "context-menu-action",
                "set-personality:calmo",
              ),
          },
          {
            label: "Travesso",
            type: "radio",
            checked: false,
            click: () =>
              win.webContents.send(
                "context-menu-action",
                "set-personality:travesso",
              ),
          },
          {
            label: "Caótico",
            type: "radio",
            checked: false,
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
      { type: "separator" },
      {
        label: "Dormir",
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

app.whenReady().then(() => {
  createWindow();
  startWindowTracker(win, __dirname);

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
