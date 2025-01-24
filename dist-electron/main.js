import { ipcMain as d, app as m, BrowserWindow as h } from "electron";
import { fileURLToPath as A } from "node:url";
import { spawn as P } from "child_process";
import f from "fs";
import o from "node:path";
const j = o.dirname(A(import.meta.url));
process.env.APP_ROOT = o.join(j, "..");
const g = process.env.VITE_DEV_SERVER_URL, v = o.join(process.env.APP_ROOT, "dist-electron"), x = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = g ? o.join(process.env.APP_ROOT, "public") : x;
let i = null;
function w() {
  i = new h({
    width: 1600,
    height: 900,
    maximizable: !0,
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(j, "preload.mjs"),
      contextIsolation: !0
    },
    autoHideMenuBar: !0
  }), i.on("will-resize", (e) => {
    i.isMaximized() || e.preventDefault();
  }), g ? i.loadURL(g) : i.loadFile(o.join(x, "index.html")), i.setAspectRatio(16 / 9), i.setBackgroundColor("#101010"), i.webContents.on("did-finish-load", async () => {
  });
}
d.on("get-resources-path", (e) => {
  const t = m.isPackaged ? o.join(process.resourcesPath) : "./extras";
  e.returnValue = t;
});
d.on("read-file", (e, t) => {
  try {
    const s = f.readFileSync(t, "utf-8");
    e.returnValue = s;
  } catch (s) {
    console.error("Error reading file:", s), e.returnValue = null;
  }
});
const n = g ? o.join(process.env.VITE_PUBLIC, "..", "extras") : o.join(process.resourcesPath, "emulators");
let b = [
  {
    name: "RetroArch",
    executable: o.join(n, "emulators", "RetroArch", "retroarch.exe"),
    getCommandArgs: (e) => [
      "-L",
      `"${o.join(
        n,
        "emulators",
        "RetroArch",
        "cores",
        `${e.core}_libretro.dll`
      )}"`,
      "-c",
      `"${o.join(n, "emulators", "RetroArch", "retroarch.cfg")}"`,
      `"${o.join(n, "roms", e.platform, e.game)}"`
    ]
  },
  {
    name: "Dolphin",
    executable: o.join(n, "emulators", "Dolphin", "Dolphin.exe"),
    getCommandArgs: (e) => [
      "-e",
      `"${o.join(n, "roms", e.platform, e.game)}"`
    ]
  },
  {
    name: "PCSX2",
    executable: o.join(n, "emulators", "PCSX2", "pcsx2-qt.exe"),
    getCommandArgs: (e) => [`"${o.join(n, "roms", "ps2", e.game)}"`]
  },
  {
    name: "RPCS3",
    executable: o.join(n, "emulators", "RPCS3", "rpcs3.exe"),
    getCommandArgs: (e) => [`"${o.join(n, "roms", "ps3", e.game)}"`]
  },
  {
    name: "Cemu",
    executable: o.join(n, "emulators", "Cemu", "Cemu.exe"),
    getCommandArgs: (e) => [
      "-f",
      "-g",
      `"${o.join(n, "roms", "wiiu", e.game)}"`
    ]
  },
  {
    name: "ArcadeFlashWeb",
    executable: o.join(
      n,
      "emulators",
      "ArcadeFlashWeb",
      "ArcadeFlashWeb.exe"
    ),
    getCommandArgs: (e) => [
      "-fullscreen",
      `-source:"${o.join(n, "roms", "flash", e.game)}"`
    ]
  },
  {
    name: "VPinball",
    executable: o.join(n, "emulators", "VPinball", "VPinballX.exe"),
    getCommandArgs: (e) => [
      "-play",
      `"${o.join(n, "roms", "vpinball", e.game)}"`
    ]
  }
];
d.handle("get-emulator-names", () => b.map((e) => e.name));
d.handle("execute-emulator-command", (e, t, s) => {
  const l = b.find((r) => r.name === t);
  if (!l)
    throw new Error(`Emulator "${t}" not found.`);
  const u = s ? l.getCommandArgs(s) : [], a = P(l.executable, u, {
    shell: !1
  });
  return a.stdout.on("data", (r) => {
    console.log(`[${t} stdout]: ${r}`);
  }), a.stderr.on("data", (r) => {
    console.error(`[${t} stderr]: ${r}`);
  }), a.on("close", (r) => {
    console.log(`[${t}] exited with code ${r}`), e.sender.send("emulator-closed", { emulatorName: t, code: r });
  }), { pid: a.pid };
});
const R = async (e) => {
  try {
    const s = await (await import("./index-D8luuwzV.js").then((p) => p.X)).parseFile(e), { title: l, artist: u, bpm: a, picture: r } = s.common;
    let c = null;
    return r && r.length > 0 && (c = `data:${r[0].format};base64,${Buffer.from(
      r[0].data
    ).toString("base64")}`), {
      name: l || o.parse(e).name,
      author: u || "Unknown",
      bpm: a || "Unknown",
      file: o.basename(e),
      coverArt: c
    };
  } catch (t) {
    return console.error("Error reading metadata:", t), null;
  }
};
d.on("close-app", () => {
  m.quit();
});
m.on("window-all-closed", () => {
  process.platform !== "darwin" && (m.quit(), i = null);
});
m.on("activate", () => {
  h.getAllWindows().length === 0 && w();
});
m.whenReady().then(async () => {
  w();
  const e = o.join(n, "assets", "music"), t = [".mp3", ".flac", ".wav", ".ogg"];
  f.readdir(e, async (s, l) => {
    if (s) {
      console.error("Error reading music folder:", s);
      return;
    }
    const u = l.filter((r) => {
      const c = o.extname(r).toLowerCase();
      return t.includes(c) && r !== "songs.json";
    }), a = [];
    for (const r of u) {
      const c = o.join(e, r), p = await R(c);
      p && a.push(p);
    }
    f.writeFile(
      o.join(e, "songs.json"),
      JSON.stringify(a, null, 2),
      (r) => {
        r && console.error("Error writing songs JSON file:", r);
      }
    );
  });
});
export {
  v as MAIN_DIST,
  x as RENDERER_DIST,
  g as VITE_DEV_SERVER_URL
};
