import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import { spawn } from "child_process";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  //Push information to renderer process upon loading finish.
  win.webContents.on("did-finish-load", async () => {});
}

//Define the base paths for development and production
const basePath = VITE_DEV_SERVER_URL
  ? path.join(process.env.VITE_PUBLIC, "..", "extras") // Development path
  : path.join(process.resourcesPath, "emulators"); // Production path

// Define programs with properties
const programs = [
  {
    name: "RetroArch",
    executable: path.join(basePath, "RetroArch", "retroarch.exe"),
  },
  {
    name: "Dolphin",
    executable: path.join(basePath, "Dolphin", "Dolphin.exe"),
  },
  {
    name: "PCSX2",
    executable: path.join(basePath, "PCSX2", "pcsx2-qt.exe"),
  },
  {
    name: "RPCS3",
    executable: path.join(basePath, "RPCS3", "rpcs3.exe"),
  },
  {
    name: "Cemu",
    executable: path.join(basePath, "Cemu", "Cemu.exe"),
  },
  {
    name: "ArcadeFlashWeb",
    executable: path.join(basePath, "ArcadeFlashWeb", "ArcadeFlashWeb.exe"),
  },
  {
    name: "VPinball",
    executable: path.join(basePath, "VPinball", "VPinballX.exe"),
  },
];

ipcMain.on("run-emulator", (event, emulator) => {
  console.log(event);
  const program = programs.find((p) => p.name === emulator);
  if (program) {
    spawn(program.executable, { shell: true }); // Include `shell: true` for better compatibility
  } else {
    console.error(`Emulator ${emulator} not found.`);
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
