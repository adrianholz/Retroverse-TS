import { ipcMain, app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import { spawn } from "child_process";
import fs from "fs";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true
    },
    autoHideMenuBar: true
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.setAspectRatio(16 / 9);
  win.setBackgroundColor("#101010");
  win.webContents.on("did-finish-load", async () => {
  });
}
ipcMain.on("get-resources-path", (event) => {
  const resourcesPath = app.isPackaged ? path.join(process.resourcesPath) : "./extras";
  event.returnValue = resourcesPath;
});
ipcMain.on("read-file", (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    event.returnValue = content;
  } catch (error) {
    console.error("Error reading file:", error);
    event.returnValue = null;
  }
});
const basePath = VITE_DEV_SERVER_URL ? path.join(process.env.VITE_PUBLIC, "..", "extras") : path.join(process.resourcesPath, "emulators");
let emulators = [
  {
    name: "RetroArch",
    executable: path.join(basePath, "emulators", "RetroArch", "retroarch.exe"),
    getCommandArgs: (args) => {
      return [
        "-L",
        `"${path.join(
          basePath,
          "emulators",
          "RetroArch",
          "cores",
          `${args.core}_libretro.dll`
        )}"`,
        "-c",
        `"${path.join(basePath, "emulators", "RetroArch", "retroarch.cfg")}"`,
        `"${path.join(basePath, "roms", args.platform, args.game)}"`
      ];
    }
  },
  {
    name: "Dolphin",
    executable: path.join(basePath, "emulators", "Dolphin", "Dolphin.exe"),
    getCommandArgs: (args) => {
      return [
        "-e",
        `"${path.join(basePath, "roms", args.platform, args.game)}"`
      ];
    }
  },
  {
    name: "PCSX2",
    executable: path.join(basePath, "emulators", "PCSX2", "pcsx2-qt.exe"),
    getCommandArgs: (args) => {
      return [`"${path.join(basePath, "roms", "ps2", args.game)}"`];
    }
  },
  {
    name: "RPCS3",
    executable: path.join(basePath, "emulators", "RPCS3", "rpcs3.exe"),
    getCommandArgs: (args) => {
      return [`"${path.join(basePath, "roms", "ps3", args.game)}"`];
    }
  },
  {
    name: "Cemu",
    executable: path.join(basePath, "emulators", "Cemu", "Cemu.exe"),
    getCommandArgs: (args) => {
      return [
        "-f",
        "-g",
        `"${path.join(basePath, "roms", "wiiu", args.game)}"`
      ];
    }
  },
  {
    name: "ArcadeFlashWeb",
    executable: path.join(
      basePath,
      "emulators",
      "ArcadeFlashWeb",
      "ArcadeFlashWeb.exe"
    ),
    getCommandArgs: (args) => {
      return [
        "-fullscreen",
        `-source:"${path.join(basePath, "roms", "flash", args.game)}"`
      ];
    }
  },
  {
    name: "VPinball",
    executable: path.join(basePath, "emulators", "VPinball", "VPinballX.exe"),
    getCommandArgs: (args) => {
      return [
        "-play",
        `"${path.join(basePath, "roms", "vpinball", args.game)}"`
      ];
    }
  }
];
ipcMain.handle("get-emulator-names", () => {
  return emulators.map((emulator) => emulator.name);
});
ipcMain.handle("execute-emulator-command", (event, emulatorName, args) => {
  const emulator = emulators.find((p) => p.name === emulatorName);
  if (!emulator) {
    throw new Error(`Emulator "${emulatorName}" not found.`);
  }
  const commandArgs = args ? emulator.getCommandArgs(args) : [];
  const child = spawn(emulator.executable, commandArgs, {
    shell: false
  });
  child.stdout.on("data", (data) => {
    console.log(`[${emulatorName} stdout]: ${data}`);
  });
  child.stderr.on("data", (data) => {
    console.error(`[${emulatorName} stderr]: ${data}`);
  });
  child.on("close", (code) => {
    console.log(`[${emulatorName}] exited with code ${code}`);
    event.sender.send("emulator-closed", { emulatorName, code });
  });
  return { pid: child.pid };
});
const extractMetadata = async (filePath) => {
  try {
    const mm = await import("./index-BNevSUcy.js").then((n) => n.X);
    const metadata = await mm.parseFile(filePath);
    const { title, artist, bpm, picture } = metadata.common;
    let coverArt = null;
    if (picture && picture.length > 0) {
      coverArt = `data:${picture[0].format};base64,${Buffer.from(
        picture[0].data
      ).toString("base64")}`;
    }
    return {
      name: title || path.parse(filePath).name,
      author: artist || "Unknown",
      bpm: bpm || "Unknown",
      file: path.basename(filePath),
      coverArt
    };
  } catch (err) {
    console.error("Error reading metadata:", err);
    return null;
  }
};
ipcMain.on("close-app", () => {
  app.quit();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(async () => {
  createWindow();
  const musicDir = path.join(basePath, "assets", "music");
  const supportedExtensions = [".mp3", ".flac", ".wav", ".ogg"];
  fs.readdir(musicDir, async (err, files) => {
    if (err) {
      console.error("Error reading music folder:", err);
      return;
    }
    const songs = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return supportedExtensions.includes(ext) && file !== "songs.json";
    });
    const songsJson = [];
    for (const song of songs) {
      const songPath = path.join(musicDir, song);
      const metadata = await extractMetadata(songPath);
      if (metadata) {
        songsJson.push(metadata);
      }
    }
    fs.writeFile(
      path.join(musicDir, "songs.json"),
      JSON.stringify(songsJson, null, 2),
      (err2) => {
        if (err2) {
          console.error("Error writing songs JSON file:", err2);
        }
      }
    );
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
