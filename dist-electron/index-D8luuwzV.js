import { open as gt, stat as wt } from "node:fs/promises";
import Ue from "tty";
import bt from "util";
import Tt from "os";
const yt = "End-Of-Stream";
class x extends Error {
  constructor() {
    super(yt);
  }
}
class kt {
  constructor() {
    this.resolve = () => null, this.reject = () => null, this.promise = new Promise((e, t) => {
      this.reject = t, this.resolve = e;
    });
  }
}
class Xe {
  constructor() {
    this.maxStreamReadSize = 1 * 1024 * 1024, this.endOfStream = !1, this.peekQueue = [];
  }
  async peek(e, t, r) {
    const a = await this.read(e, t, r);
    return this.peekQueue.push(e.subarray(t, t + a)), a;
  }
  async read(e, t, r) {
    if (r === 0)
      return 0;
    let a = this.readFromPeekBuffer(e, t, r);
    if (a += await this.readRemainderFromStream(e, t + a, r - a), a === 0)
      throw new x();
    return a;
  }
  /**
   * Read chunk from stream
   * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
   * @param offset - Offset target
   * @param length - Number of bytes to read
   * @returns Number of bytes read
   */
  readFromPeekBuffer(e, t, r) {
    let a = r, n = 0;
    for (; this.peekQueue.length > 0 && a > 0; ) {
      const s = this.peekQueue.pop();
      if (!s)
        throw new Error("peekData should be defined");
      const u = Math.min(s.length, a);
      e.set(s.subarray(0, u), t + n), n += u, a -= u, u < s.length && this.peekQueue.push(s.subarray(u));
    }
    return n;
  }
  async readRemainderFromStream(e, t, r) {
    let a = r, n = 0;
    for (; a > 0 && !this.endOfStream; ) {
      const s = Math.min(a, this.maxStreamReadSize), u = await this.readFromStream(e, t + n, s);
      if (u === 0)
        break;
      n += u, a -= u;
    }
    return n;
  }
}
class It extends Xe {
  constructor(e) {
    if (super(), this.s = e, this.deferred = null, !e.read || !e.once)
      throw new Error("Expected an instance of stream.Readable");
    this.s.once("end", () => this.reject(new x())), this.s.once("error", (t) => this.reject(t)), this.s.once("close", () => this.reject(new Error("Stream closed")));
  }
  /**
   * Read chunk from stream
   * @param buffer Target Uint8Array (or Buffer) to store data read from stream in
   * @param offset Offset target
   * @param length Number of bytes to read
   * @returns Number of bytes read
   */
  async readFromStream(e, t, r) {
    if (this.endOfStream)
      return 0;
    const a = this.s.read(r);
    if (a)
      return e.set(a, t), a.length;
    const n = {
      buffer: e,
      offset: t,
      length: r,
      deferred: new kt()
    };
    return this.deferred = n.deferred, this.s.once("readable", () => {
      this.readDeferred(n);
    }), n.deferred.promise;
  }
  /**
   * Process deferred read request
   * @param request Deferred read request
   */
  readDeferred(e) {
    const t = this.s.read(e.length);
    t ? (e.buffer.set(t, e.offset), e.deferred.resolve(t.length), this.deferred = null) : this.s.once("readable", () => {
      this.readDeferred(e);
    });
  }
  reject(e) {
    this.endOfStream = !0, this.deferred && (this.deferred.reject(e), this.deferred = null);
  }
  async abort() {
    this.s.destroy();
  }
}
class Ge extends Xe {
  constructor(e) {
    super(), this.reader = e.getReader({ mode: "byob" });
  }
  async readFromStream(e, t, r) {
    if (this.endOfStream)
      throw new x();
    const a = await this.reader.read(new Uint8Array(r));
    return a.done && (this.endOfStream = a.done), a.value ? (e.set(a.value, t), a.value.byteLength) : 0;
  }
  async abort() {
    await this.reader.cancel(), this.reader.releaseLock();
  }
}
let fe = class {
  /**
   * Constructor
   * @param options Tokenizer options
   * @protected
   */
  constructor(e) {
    this.numBuffer = new Uint8Array(8), this.position = 0, this.onClose = e == null ? void 0 : e.onClose, e != null && e.abortSignal && e.abortSignal.addEventListener("abort", () => {
      this.abort();
    });
  }
  /**
   * Read a token from the tokenizer-stream
   * @param token - The token to read
   * @param position - If provided, the desired position in the tokenizer-stream
   * @returns Promise with token data
   */
  async readToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.readBuffer(r, { position: t }) < e.len)
      throw new x();
    return e.get(r, 0);
  }
  /**
   * Peek a token from the tokenizer-stream.
   * @param token - Token to peek from the tokenizer-stream.
   * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
   * @returns Promise with token data
   */
  async peekToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.peekBuffer(r, { position: t }) < e.len)
      throw new x();
    return e.get(r, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async readNumber(e) {
    if (await this.readBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new x();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async peekNumber(e) {
    if (await this.peekBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new x();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Ignore number of bytes, advances the pointer in under tokenizer-stream.
   * @param length - Number of bytes to ignore
   * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
   */
  async ignore(e) {
    if (this.fileInfo.size !== void 0) {
      const t = this.fileInfo.size - this.position;
      if (e > t)
        return this.position += t, t;
    }
    return this.position += e, e;
  }
  async close() {
    var e;
    await this.abort(), await ((e = this.onClose) == null ? void 0 : e.call(this));
  }
  normalizeOptions(e, t) {
    if (!this.supportsRandomAccess() && t && t.position !== void 0 && t.position < this.position)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    return {
      mayBeLess: !1,
      offset: 0,
      length: e.length,
      position: this.position,
      ...t
    };
  }
  abort() {
    return Promise.resolve();
  }
};
const vt = 256e3;
let je = class extends fe {
  /**
   * Constructor
   * @param streamReader stream-reader to read from
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.streamReader = e, this.fileInfo = (t == null ? void 0 : t.fileInfo) ?? {};
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
   * @param options - Read behaviour options
   * @returns Promise with number of bytes read
   */
  async readBuffer(e, t) {
    const r = this.normalizeOptions(e, t), a = r.position - this.position;
    if (a > 0)
      return await this.ignore(a), this.readBuffer(e, t);
    if (a < 0)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    if (r.length === 0)
      return 0;
    const n = await this.streamReader.read(e, 0, r.length);
    if (this.position += n, (!t || !t.mayBeLess) && n < r.length)
      throw new x();
    return n;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array - Uint8Array (or Buffer) to write data to
   * @param options - Read behaviour options
   * @returns Promise with number of bytes peeked
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t);
    let a = 0;
    if (r.position) {
      const n = r.position - this.position;
      if (n > 0) {
        const s = new Uint8Array(r.length + n);
        return a = await this.peekBuffer(s, { mayBeLess: r.mayBeLess }), e.set(s.subarray(n)), a - n;
      }
      if (n < 0)
        throw new Error("Cannot peek from a negative offset in a stream");
    }
    if (r.length > 0) {
      try {
        a = await this.streamReader.peek(e, 0, r.length);
      } catch (n) {
        if (t != null && t.mayBeLess && n instanceof x)
          return 0;
        throw n;
      }
      if (!r.mayBeLess && a < r.length)
        throw new x();
    }
    return a;
  }
  async ignore(e) {
    const t = Math.min(vt, e), r = new Uint8Array(t);
    let a = 0;
    for (; a < e; ) {
      const n = e - a, s = await this.readBuffer(r, { length: Math.min(t, n) });
      if (s < 0)
        return s;
      a += s;
    }
    return a;
  }
  abort() {
    return this.streamReader.abort();
  }
  supportsRandomAccess() {
    return !1;
  }
}, St = class extends fe {
  /**
   * Construct BufferTokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.uint8Array = e, this.fileInfo = { ...(t == null ? void 0 : t.fileInfo) ?? {}, size: e.length };
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async readBuffer(e, t) {
    t != null && t.position && (this.position = t.position);
    const r = await this.peekBuffer(e, t);
    return this.position += r, r;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t), a = Math.min(this.uint8Array.length - r.position, r.length);
    if (!r.mayBeLess && a < r.length)
      throw new x();
    return e.set(this.uint8Array.subarray(r.position, r.position + a)), a;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(e) {
    this.position = e;
  }
};
function Ct(i, e) {
  return new je(new It(i), e);
}
function At(i, e) {
  return new je(new Ge(i), e);
}
function ce(i, e) {
  return new St(i, e);
}
class de extends fe {
  /**
   * Create tokenizer from provided file path
   * @param sourceFilePath File path
   */
  static async fromFile(e) {
    const t = await gt(e, "r"), r = await t.stat();
    return new de(t, { fileInfo: { path: e, size: r.size } });
  }
  constructor(e, t) {
    super(t), this.fileHandle = e, this.fileInfo = t.fileInfo;
  }
  /**
   * Read buffer from file
   * @param uint8Array - Uint8Array to write result to
   * @param options - Read behaviour options
   * @returns Promise number of bytes read
   */
  async readBuffer(e, t) {
    const r = this.normalizeOptions(e, t);
    if (this.position = r.position, r.length === 0)
      return 0;
    const a = await this.fileHandle.read(e, 0, r.length, r.position);
    if (this.position += a.bytesRead, a.bytesRead < r.length && (!t || !t.mayBeLess))
      throw new x();
    return a.bytesRead;
  }
  /**
   * Peek buffer from file
   * @param uint8Array - Uint8Array (or Buffer) to write data to
   * @param options - Read behaviour options
   * @returns Promise number of bytes read
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t), a = await this.fileHandle.read(e, 0, r.length, r.position);
    if (!r.mayBeLess && a.bytesRead < r.length)
      throw new x();
    return a.bytesRead;
  }
  async close() {
    return await this.fileHandle.close(), super.close();
  }
  setPosition(e) {
    this.position = e;
  }
  supportsRandomAccess() {
    return !0;
  }
}
async function Et(i, e) {
  const t = Ct(i, e);
  if (i.path) {
    const r = await wt(i.path);
    t.fileInfo.path = i.path, t.fileInfo.size = r.size;
  }
  return t;
}
const Rt = de.fromFile;
function _t(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var le = { exports: {} }, X = { exports: {} }, re, Te;
function Bt() {
  if (Te) return re;
  Te = 1;
  var i = 1e3, e = i * 60, t = e * 60, r = t * 24, a = r * 7, n = r * 365.25;
  re = function(m, o) {
    o = o || {};
    var l = typeof m;
    if (l === "string" && m.length > 0)
      return s(m);
    if (l === "number" && isFinite(m))
      return o.long ? c(m) : u(m);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(m)
    );
  };
  function s(m) {
    if (m = String(m), !(m.length > 100)) {
      var o = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        m
      );
      if (o) {
        var l = parseFloat(o[1]), f = (o[2] || "ms").toLowerCase();
        switch (f) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return l * n;
          case "weeks":
          case "week":
          case "w":
            return l * a;
          case "days":
          case "day":
          case "d":
            return l * r;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return l * t;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return l * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return l * i;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return l;
          default:
            return;
        }
      }
    }
  }
  function u(m) {
    var o = Math.abs(m);
    return o >= r ? Math.round(m / r) + "d" : o >= t ? Math.round(m / t) + "h" : o >= e ? Math.round(m / e) + "m" : o >= i ? Math.round(m / i) + "s" : m + "ms";
  }
  function c(m) {
    var o = Math.abs(m);
    return o >= r ? p(m, o, r, "day") : o >= t ? p(m, o, t, "hour") : o >= e ? p(m, o, e, "minute") : o >= i ? p(m, o, i, "second") : m + " ms";
  }
  function p(m, o, l, f) {
    var h = o >= l * 1.5;
    return Math.round(m / l) + " " + f + (h ? "s" : "");
  }
  return re;
}
var ae, ye;
function $e() {
  if (ye) return ae;
  ye = 1;
  function i(e) {
    r.debug = r, r.default = r, r.coerce = p, r.disable = u, r.enable = n, r.enabled = c, r.humanize = Bt(), r.destroy = m, Object.keys(e).forEach((o) => {
      r[o] = e[o];
    }), r.names = [], r.skips = [], r.formatters = {};
    function t(o) {
      let l = 0;
      for (let f = 0; f < o.length; f++)
        l = (l << 5) - l + o.charCodeAt(f), l |= 0;
      return r.colors[Math.abs(l) % r.colors.length];
    }
    r.selectColor = t;
    function r(o) {
      let l, f = null, h, g;
      function b(...T) {
        if (!b.enabled)
          return;
        const A = b, N = Number(/* @__PURE__ */ new Date()), dt = N - (l || N);
        A.diff = dt, A.prev = l, A.curr = N, l = N, T[0] = r.coerce(T[0]), typeof T[0] != "string" && T.unshift("%O");
        let U = 0;
        T[0] = T[0].replace(/%([a-zA-Z%])/g, (ie, ht) => {
          if (ie === "%%")
            return "%";
          U++;
          const be = r.formatters[ht];
          if (typeof be == "function") {
            const xt = T[U];
            ie = be.call(A, xt), T.splice(U, 1), U--;
          }
          return ie;
        }), r.formatArgs.call(A, T), (A.log || r.log).apply(A, T);
      }
      return b.namespace = o, b.useColors = r.useColors(), b.color = r.selectColor(o), b.extend = a, b.destroy = r.destroy, Object.defineProperty(b, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (h !== r.namespaces && (h = r.namespaces, g = r.enabled(o)), g),
        set: (T) => {
          f = T;
        }
      }), typeof r.init == "function" && r.init(b), b;
    }
    function a(o, l) {
      const f = r(this.namespace + (typeof l > "u" ? ":" : l) + o);
      return f.log = this.log, f;
    }
    function n(o) {
      r.save(o), r.namespaces = o, r.names = [], r.skips = [];
      const l = (typeof o == "string" ? o : "").trim().replace(" ", ",").split(",").filter(Boolean);
      for (const f of l)
        f[0] === "-" ? r.skips.push(f.slice(1)) : r.names.push(f);
    }
    function s(o, l) {
      let f = 0, h = 0, g = -1, b = 0;
      for (; f < o.length; )
        if (h < l.length && (l[h] === o[f] || l[h] === "*"))
          l[h] === "*" ? (g = h, b = f, h++) : (f++, h++);
        else if (g !== -1)
          h = g + 1, b++, f = b;
        else
          return !1;
      for (; h < l.length && l[h] === "*"; )
        h++;
      return h === l.length;
    }
    function u() {
      const o = [
        ...r.names,
        ...r.skips.map((l) => "-" + l)
      ].join(",");
      return r.enable(""), o;
    }
    function c(o) {
      for (const l of r.skips)
        if (s(o, l))
          return !1;
      for (const l of r.names)
        if (s(o, l))
          return !0;
      return !1;
    }
    function p(o) {
      return o instanceof Error ? o.stack || o.message : o;
    }
    function m() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return r.enable(r.load()), r;
  }
  return ae = i, ae;
}
var ke;
function Mt() {
  return ke || (ke = 1, function(i, e) {
    e.formatArgs = r, e.save = a, e.load = n, e.useColors = t, e.storage = s(), e.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), e.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function t() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function r(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + i.exports.humanize(this.diff), !this.useColors)
        return;
      const p = "color: " + this.color;
      c.splice(1, 0, p, "color: inherit");
      let m = 0, o = 0;
      c[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (m++, l === "%c" && (o = m));
      }), c.splice(o, 0, p);
    }
    e.log = console.debug || console.log || (() => {
    });
    function a(c) {
      try {
        c ? e.storage.setItem("debug", c) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function n() {
      let c;
      try {
        c = e.storage.getItem("debug");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function s() {
      try {
        return localStorage;
      } catch {
      }
    }
    i.exports = $e()(e);
    const { formatters: u } = i.exports;
    u.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (p) {
        return "[UnexpectedJSONParseError]: " + p.message;
      }
    };
  }(X, X.exports)), X.exports;
}
var G = { exports: {} }, ne, Ie;
function Ft() {
  return Ie || (Ie = 1, ne = (i, e = process.argv) => {
    const t = i.startsWith("-") ? "" : i.length === 1 ? "-" : "--", r = e.indexOf(t + i), a = e.indexOf("--");
    return r !== -1 && (a === -1 || r < a);
  }), ne;
}
var se, ve;
function Dt() {
  if (ve) return se;
  ve = 1;
  const i = Tt, e = Ue, t = Ft(), { env: r } = process;
  let a;
  t("no-color") || t("no-colors") || t("color=false") || t("color=never") ? a = 0 : (t("color") || t("colors") || t("color=true") || t("color=always")) && (a = 1), "FORCE_COLOR" in r && (r.FORCE_COLOR === "true" ? a = 1 : r.FORCE_COLOR === "false" ? a = 0 : a = r.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(r.FORCE_COLOR, 10), 3));
  function n(c) {
    return c === 0 ? !1 : {
      level: c,
      hasBasic: !0,
      has256: c >= 2,
      has16m: c >= 3
    };
  }
  function s(c, p) {
    if (a === 0)
      return 0;
    if (t("color=16m") || t("color=full") || t("color=truecolor"))
      return 3;
    if (t("color=256"))
      return 2;
    if (c && !p && a === void 0)
      return 0;
    const m = a || 0;
    if (r.TERM === "dumb")
      return m;
    if (process.platform === "win32") {
      const o = i.release().split(".");
      return Number(o[0]) >= 10 && Number(o[2]) >= 10586 ? Number(o[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in r)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((o) => o in r) || r.CI_NAME === "codeship" ? 1 : m;
    if ("TEAMCITY_VERSION" in r)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(r.TEAMCITY_VERSION) ? 1 : 0;
    if (r.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in r) {
      const o = parseInt((r.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (r.TERM_PROGRAM) {
        case "iTerm.app":
          return o >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(r.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(r.TERM) || "COLORTERM" in r ? 1 : m;
  }
  function u(c) {
    const p = s(c, c && c.isTTY);
    return n(p);
  }
  return se = {
    supportsColor: u,
    stdout: n(s(!0, e.isatty(1))),
    stderr: n(s(!0, e.isatty(2)))
  }, se;
}
var Se;
function Ot() {
  return Se || (Se = 1, function(i, e) {
    const t = Ue, r = bt;
    e.init = m, e.log = u, e.formatArgs = n, e.save = c, e.load = p, e.useColors = a, e.destroy = r.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const l = Dt();
      l && (l.stderr || l).level >= 2 && (e.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    e.inspectOpts = Object.keys(process.env).filter((l) => /^debug_/i.test(l)).reduce((l, f) => {
      const h = f.substring(6).toLowerCase().replace(/_([a-z])/g, (b, T) => T.toUpperCase());
      let g = process.env[f];
      return /^(yes|on|true|enabled)$/i.test(g) ? g = !0 : /^(no|off|false|disabled)$/i.test(g) ? g = !1 : g === "null" ? g = null : g = Number(g), l[h] = g, l;
    }, {});
    function a() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : t.isatty(process.stderr.fd);
    }
    function n(l) {
      const { namespace: f, useColors: h } = this;
      if (h) {
        const g = this.color, b = "\x1B[3" + (g < 8 ? g : "8;5;" + g), T = `  ${b};1m${f} \x1B[0m`;
        l[0] = T + l[0].split(`
`).join(`
` + T), l.push(b + "m+" + i.exports.humanize(this.diff) + "\x1B[0m");
      } else
        l[0] = s() + f + " " + l[0];
    }
    function s() {
      return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function u(...l) {
      return process.stderr.write(r.formatWithOptions(e.inspectOpts, ...l) + `
`);
    }
    function c(l) {
      l ? process.env.DEBUG = l : delete process.env.DEBUG;
    }
    function p() {
      return process.env.DEBUG;
    }
    function m(l) {
      l.inspectOpts = {};
      const f = Object.keys(e.inspectOpts);
      for (let h = 0; h < f.length; h++)
        l.inspectOpts[f[h]] = e.inspectOpts[f[h]];
    }
    i.exports = $e()(e);
    const { formatters: o } = i.exports;
    o.o = function(l) {
      return this.inspectOpts.colors = this.useColors, r.inspect(l, this.inspectOpts).split(`
`).map((f) => f.trim()).join(" ");
    }, o.O = function(l) {
      return this.inspectOpts.colors = this.useColors, r.inspect(l, this.inspectOpts);
    };
  }(G, G.exports)), G.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? le.exports = Mt() : le.exports = Ot();
var zt = le.exports;
const z = /* @__PURE__ */ _t(zt);
class We {
  /**
   * Constructor
   * @param options Tokenizer options
   * @protected
   */
  constructor(e) {
    this.numBuffer = new Uint8Array(8), this.position = 0, this.onClose = e == null ? void 0 : e.onClose, e != null && e.abortSignal && e.abortSignal.addEventListener("abort", () => {
      this.abort();
    });
  }
  /**
   * Read a token from the tokenizer-stream
   * @param token - The token to read
   * @param position - If provided, the desired position in the tokenizer-stream
   * @returns Promise with token data
   */
  async readToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.readBuffer(r, { position: t }) < e.len)
      throw new x();
    return e.get(r, 0);
  }
  /**
   * Peek a token from the tokenizer-stream.
   * @param token - Token to peek from the tokenizer-stream.
   * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
   * @returns Promise with token data
   */
  async peekToken(e, t = this.position) {
    const r = new Uint8Array(e.len);
    if (await this.peekBuffer(r, { position: t }) < e.len)
      throw new x();
    return e.get(r, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async readNumber(e) {
    if (await this.readBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new x();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async peekNumber(e) {
    if (await this.peekBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new x();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Ignore number of bytes, advances the pointer in under tokenizer-stream.
   * @param length - Number of bytes to ignore
   * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
   */
  async ignore(e) {
    if (this.fileInfo.size !== void 0) {
      const t = this.fileInfo.size - this.position;
      if (e > t)
        return this.position += t, t;
    }
    return this.position += e, e;
  }
  async close() {
    var e;
    await this.abort(), await ((e = this.onClose) == null ? void 0 : e.call(this));
  }
  normalizeOptions(e, t) {
    if (t && t.position !== void 0 && t.position < this.position)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    return t ? {
      mayBeLess: t.mayBeLess === !0,
      offset: t.offset ? t.offset : 0,
      length: t.length ? t.length : e.length - (t.offset ? t.offset : 0),
      position: t.position ? t.position : this.position
    } : {
      mayBeLess: !1,
      offset: 0,
      length: e.length,
      position: this.position
    };
  }
  abort() {
    return Promise.resolve();
  }
}
const Lt = 256e3;
class Pt extends We {
  /**
   * Constructor
   * @param streamReader stream-reader to read from
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.streamReader = e, this.fileInfo = (t == null ? void 0 : t.fileInfo) ?? {};
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
   * @param options - Read behaviour options
   * @returns Promise with number of bytes read
   */
  async readBuffer(e, t) {
    const r = this.normalizeOptions(e, t), a = r.position - this.position;
    if (a > 0)
      return await this.ignore(a), this.readBuffer(e, t);
    if (a < 0)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    if (r.length === 0)
      return 0;
    const n = await this.streamReader.read(e, r.offset, r.length);
    if (this.position += n, (!t || !t.mayBeLess) && n < r.length)
      throw new x();
    return n;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array - Uint8Array (or Buffer) to write data to
   * @param options - Read behaviour options
   * @returns Promise with number of bytes peeked
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t);
    let a = 0;
    if (r.position) {
      const n = r.position - this.position;
      if (n > 0) {
        const s = new Uint8Array(r.length + n);
        return a = await this.peekBuffer(s, { mayBeLess: r.mayBeLess }), e.set(s.subarray(n), r.offset), a - n;
      }
      if (n < 0)
        throw new Error("Cannot peek from a negative offset in a stream");
    }
    if (r.length > 0) {
      try {
        a = await this.streamReader.peek(e, r.offset, r.length);
      } catch (n) {
        if (t != null && t.mayBeLess && n instanceof x)
          return 0;
        throw n;
      }
      if (!r.mayBeLess && a < r.length)
        throw new x();
    }
    return a;
  }
  async ignore(e) {
    const t = Math.min(Lt, e), r = new Uint8Array(t);
    let a = 0;
    for (; a < e; ) {
      const n = e - a, s = await this.readBuffer(r, { length: Math.min(t, n) });
      if (s < 0)
        return s;
      a += s;
    }
    return a;
  }
  abort() {
    return this.streamReader.abort();
  }
  supportsRandomAccess() {
    return !1;
  }
}
class Nt extends We {
  /**
   * Construct BufferTokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.uint8Array = e, this.fileInfo = { ...(t == null ? void 0 : t.fileInfo) ?? {}, size: e.length };
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async readBuffer(e, t) {
    if (t != null && t.position) {
      if (t.position < this.position)
        throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
      this.position = t.position;
    }
    const r = await this.peekBuffer(e, t);
    return this.position += r, r;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async peekBuffer(e, t) {
    const r = this.normalizeOptions(e, t), a = Math.min(this.uint8Array.length - r.position, r.length);
    if (!r.mayBeLess && a < r.length)
      throw new x();
    return e.set(this.uint8Array.subarray(r.position, r.position + a), r.offset), a;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(e) {
    this.position = e;
  }
}
function Ut(i, e) {
  return new Pt(new Ge(i), e);
}
function Xt(i, e) {
  return new Nt(i, e);
}
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
var Q = function(i, e, t, r, a) {
  var n, s, u = a * 8 - r - 1, c = (1 << u) - 1, p = c >> 1, m = -7, o = t ? a - 1 : 0, l = t ? -1 : 1, f = i[e + o];
  for (o += l, n = f & (1 << -m) - 1, f >>= -m, m += u; m > 0; n = n * 256 + i[e + o], o += l, m -= 8)
    ;
  for (s = n & (1 << -m) - 1, n >>= -m, m += r; m > 0; s = s * 256 + i[e + o], o += l, m -= 8)
    ;
  if (n === 0)
    n = 1 - p;
  else {
    if (n === c)
      return s ? NaN : (f ? -1 : 1) * (1 / 0);
    s = s + Math.pow(2, r), n = n - p;
  }
  return (f ? -1 : 1) * s * Math.pow(2, n - r);
}, ee = function(i, e, t, r, a, n) {
  var s, u, c, p = n * 8 - a - 1, m = (1 << p) - 1, o = m >> 1, l = a === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, f = r ? 0 : n - 1, h = r ? 1 : -1, g = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
  for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (u = isNaN(e) ? 1 : 0, s = m) : (s = Math.floor(Math.log(e) / Math.LN2), e * (c = Math.pow(2, -s)) < 1 && (s--, c *= 2), s + o >= 1 ? e += l / c : e += l * Math.pow(2, 1 - o), e * c >= 2 && (s++, c /= 2), s + o >= m ? (u = 0, s = m) : s + o >= 1 ? (u = (e * c - 1) * Math.pow(2, a), s = s + o) : (u = e * Math.pow(2, o - 1) * Math.pow(2, a), s = 0)); a >= 8; i[t + f] = u & 255, f += h, u /= 256, a -= 8)
    ;
  for (s = s << a | u, p += a; p > 0; i[t + f] = s & 255, f += h, s /= 256, p -= 8)
    ;
  i[t + f - h] |= g * 128;
};
function d(i) {
  return new DataView(i.buffer, i.byteOffset);
}
const B = {
  len: 1,
  get(i, e) {
    return d(i).getUint8(e);
  },
  put(i, e, t) {
    return d(i).setUint8(e, t), e + 1;
  }
}, S = {
  len: 2,
  get(i, e) {
    return d(i).getUint16(e, !0);
  },
  put(i, e, t) {
    return d(i).setUint16(e, t, !0), e + 2;
  }
}, O = {
  len: 2,
  get(i, e) {
    return d(i).getUint16(e);
  },
  put(i, e, t) {
    return d(i).setUint16(e, t), e + 2;
  }
}, qe = {
  len: 3,
  get(i, e) {
    const t = d(i);
    return t.getUint8(e) + (t.getUint16(e + 1, !0) << 8);
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint8(e, t & 255), r.setUint16(e + 1, t >> 8, !0), e + 3;
  }
}, He = {
  len: 3,
  get(i, e) {
    const t = d(i);
    return (t.getUint16(e) << 8) + t.getUint8(e + 2);
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint16(e, t >> 8), r.setUint8(e + 2, t & 255), e + 3;
  }
}, w = {
  len: 4,
  get(i, e) {
    return d(i).getUint32(e, !0);
  },
  put(i, e, t) {
    return d(i).setUint32(e, t, !0), e + 4;
  }
}, Y = {
  len: 4,
  get(i, e) {
    return d(i).getUint32(e);
  },
  put(i, e, t) {
    return d(i).setUint32(e, t), e + 4;
  }
}, ue = {
  len: 1,
  get(i, e) {
    return d(i).getInt8(e);
  },
  put(i, e, t) {
    return d(i).setInt8(e, t), e + 1;
  }
}, Gt = {
  len: 2,
  get(i, e) {
    return d(i).getInt16(e);
  },
  put(i, e, t) {
    return d(i).setInt16(e, t), e + 2;
  }
}, jt = {
  len: 2,
  get(i, e) {
    return d(i).getInt16(e, !0);
  },
  put(i, e, t) {
    return d(i).setInt16(e, t, !0), e + 2;
  }
}, $t = {
  len: 3,
  get(i, e) {
    const t = qe.get(i, e);
    return t > 8388607 ? t - 16777216 : t;
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint8(e, t & 255), r.setUint16(e + 1, t >> 8, !0), e + 3;
  }
}, Wt = {
  len: 3,
  get(i, e) {
    const t = He.get(i, e);
    return t > 8388607 ? t - 16777216 : t;
  },
  put(i, e, t) {
    const r = d(i);
    return r.setUint16(e, t >> 8), r.setUint8(e + 2, t & 255), e + 3;
  }
}, Ye = {
  len: 4,
  get(i, e) {
    return d(i).getInt32(e);
  },
  put(i, e, t) {
    return d(i).setInt32(e, t), e + 4;
  }
}, qt = {
  len: 4,
  get(i, e) {
    return d(i).getInt32(e, !0);
  },
  put(i, e, t) {
    return d(i).setInt32(e, t, !0), e + 4;
  }
}, Ve = {
  len: 8,
  get(i, e) {
    return d(i).getBigUint64(e, !0);
  },
  put(i, e, t) {
    return d(i).setBigUint64(e, t, !0), e + 8;
  }
}, Ht = {
  len: 8,
  get(i, e) {
    return d(i).getBigInt64(e, !0);
  },
  put(i, e, t) {
    return d(i).setBigInt64(e, t, !0), e + 8;
  }
}, Yt = {
  len: 8,
  get(i, e) {
    return d(i).getBigUint64(e);
  },
  put(i, e, t) {
    return d(i).setBigUint64(e, t), e + 8;
  }
}, Vt = {
  len: 8,
  get(i, e) {
    return d(i).getBigInt64(e);
  },
  put(i, e, t) {
    return d(i).setBigInt64(e, t), e + 8;
  }
}, Zt = {
  len: 2,
  get(i, e) {
    return Q(i, e, !1, 10, this.len);
  },
  put(i, e, t) {
    return ee(i, t, e, !1, 10, this.len), e + this.len;
  }
}, Kt = {
  len: 2,
  get(i, e) {
    return Q(i, e, !0, 10, this.len);
  },
  put(i, e, t) {
    return ee(i, t, e, !0, 10, this.len), e + this.len;
  }
}, Jt = {
  len: 4,
  get(i, e) {
    return d(i).getFloat32(e);
  },
  put(i, e, t) {
    return d(i).setFloat32(e, t), e + 4;
  }
}, Qt = {
  len: 4,
  get(i, e) {
    return d(i).getFloat32(e, !0);
  },
  put(i, e, t) {
    return d(i).setFloat32(e, t, !0), e + 4;
  }
}, ei = {
  len: 8,
  get(i, e) {
    return d(i).getFloat64(e);
  },
  put(i, e, t) {
    return d(i).setFloat64(e, t), e + 8;
  }
}, ti = {
  len: 8,
  get(i, e) {
    return d(i).getFloat64(e, !0);
  },
  put(i, e, t) {
    return d(i).setFloat64(e, t, !0), e + 8;
  }
}, ii = {
  len: 10,
  get(i, e) {
    return Q(i, e, !1, 63, this.len);
  },
  put(i, e, t) {
    return ee(i, t, e, !1, 63, this.len), e + this.len;
  }
}, ri = {
  len: 10,
  get(i, e) {
    return Q(i, e, !0, 63, this.len);
  },
  put(i, e, t) {
    return ee(i, t, e, !0, 63, this.len), e + this.len;
  }
};
class ai {
  /**
   * @param len number of bytes to ignore
   */
  constructor(e) {
    this.len = e;
  }
  // ToDo: don't read, but skip data
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  get(e, t) {
  }
}
class Ze {
  constructor(e) {
    this.len = e;
  }
  get(e, t) {
    return e.subarray(t, t + this.len);
  }
}
class y {
  constructor(e, t) {
    this.len = e, this.encoding = t, this.textDecoder = new TextDecoder(t);
  }
  get(e, t) {
    return this.textDecoder.decode(e.subarray(t, t + this.len));
  }
}
class ni {
  constructor(e) {
    this.len = e, this.textDecoder = new TextDecoder("windows-1252");
  }
  get(e, t = 0) {
    return this.textDecoder.decode(e.subarray(t, t + this.len));
  }
}
const ea = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AnsiStringType: ni,
  Float16_BE: Zt,
  Float16_LE: Kt,
  Float32_BE: Jt,
  Float32_LE: Qt,
  Float64_BE: ei,
  Float64_LE: ti,
  Float80_BE: ii,
  Float80_LE: ri,
  INT16_BE: Gt,
  INT16_LE: jt,
  INT24_BE: Wt,
  INT24_LE: $t,
  INT32_BE: Ye,
  INT32_LE: qt,
  INT64_BE: Vt,
  INT64_LE: Ht,
  INT8: ue,
  IgnoreType: ai,
  StringType: y,
  UINT16_BE: O,
  UINT16_LE: S,
  UINT24_BE: He,
  UINT24_LE: qe,
  UINT32_BE: Y,
  UINT32_LE: w,
  UINT64_BE: Yt,
  UINT64_LE: Ve,
  UINT8: B,
  Uint8ArrayType: Ze
}, Symbol.toStringTag, { value: "Module" })), si = Object.prototype.toString, oi = "[object Uint8Array]", ci = "[object ArrayBuffer]";
function Ke(i, e, t) {
  return i ? i.constructor === e ? !0 : si.call(i) === t : !1;
}
function Je(i) {
  return Ke(i, Uint8Array, oi);
}
function li(i) {
  return Ke(i, ArrayBuffer, ci);
}
function ui(i) {
  return Je(i) || li(i);
}
function mi(i) {
  if (!Je(i))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof i}\``);
}
function pi(i) {
  if (!ui(i))
    throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof i}\``);
}
const j = {
  utf8: new globalThis.TextDecoder("utf8")
};
function Qe(i, e = "utf8") {
  return pi(i), j[e] ?? (j[e] = new globalThis.TextDecoder(e)), j[e].decode(i);
}
function et(i) {
  if (typeof i != "string")
    throw new TypeError(`Expected \`string\`, got \`${typeof i}\``);
}
const fi = new globalThis.TextEncoder();
function di(i) {
  return et(i), fi.encode(i);
}
const hi = Array.from({ length: 256 }, (i, e) => e.toString(16).padStart(2, "0"));
function ta(i) {
  mi(i);
  let e = "";
  for (let t = 0; t < i.length; t++)
    e += hi[i[t]];
  return e;
}
const Ce = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15
};
function ia(i) {
  if (et(i), i.length % 2 !== 0)
    throw new Error("Invalid Hex string length.");
  const e = i.length / 2, t = new Uint8Array(e);
  for (let r = 0; r < e; r++) {
    const a = Ce[i[r * 2]], n = Ce[i[r * 2 + 1]];
    if (a === void 0 || n === void 0)
      throw new Error(`Invalid Hex character encountered at position ${r * 2}`);
    t[r] = a << 4 | n;
  }
  return t;
}
function Ae(i) {
  const { byteLength: e } = i;
  if (e === 6)
    return i.getUint16(0) * 2 ** 32 + i.getUint32(2);
  if (e === 5)
    return i.getUint8(0) * 2 ** 32 + i.getUint32(1);
  if (e === 4)
    return i.getUint32(0);
  if (e === 3)
    return i.getUint8(0) * 2 ** 16 + i.getUint16(1);
  if (e === 2)
    return i.getUint16(0);
  if (e === 1)
    return i.getUint8(0);
}
function tt(i, e) {
  const t = i.length, r = e.length;
  if (r === 0 || r > t)
    return -1;
  const a = t - r;
  for (let n = 0; n <= a; n++) {
    let s = !0;
    for (let u = 0; u < r; u++)
      if (i[n + u] !== e[u]) {
        s = !1;
        break;
      }
    if (s)
      return n;
  }
  return -1;
}
function xi(i, e) {
  return tt(i, e) !== -1;
}
function gi(i) {
  return [...i].map((e) => e.charCodeAt(0));
}
function wi(i, e = 0) {
  const t = Number.parseInt(new y(6).get(i, 148).replace(/\0.*$/, "").trim(), 8);
  if (Number.isNaN(t))
    return !1;
  let r = 8 * 32;
  for (let a = e; a < e + 148; a++)
    r += i[a];
  for (let a = e + 156; a < e + 512; a++)
    r += i[a];
  return t === r;
}
const bi = {
  get: (i, e) => i[e + 3] & 127 | i[e + 2] << 7 | i[e + 1] << 14 | i[e] << 21,
  len: 4
}, Ti = [
  "jpg",
  "png",
  "apng",
  "gif",
  "webp",
  "flif",
  "xcf",
  "cr2",
  "cr3",
  "orf",
  "arw",
  "dng",
  "nef",
  "rw2",
  "raf",
  "tif",
  "bmp",
  "icns",
  "jxr",
  "psd",
  "indd",
  "zip",
  "tar",
  "rar",
  "gz",
  "bz2",
  "7z",
  "dmg",
  "mp4",
  "mid",
  "mkv",
  "webm",
  "mov",
  "avi",
  "mpg",
  "mp2",
  "mp3",
  "m4a",
  "oga",
  "ogg",
  "ogv",
  "opus",
  "flac",
  "wav",
  "spx",
  "amr",
  "pdf",
  "epub",
  "elf",
  "macho",
  "exe",
  "swf",
  "rtf",
  "wasm",
  "woff",
  "woff2",
  "eot",
  "ttf",
  "otf",
  "ico",
  "flv",
  "ps",
  "xz",
  "sqlite",
  "nes",
  "crx",
  "xpi",
  "cab",
  "deb",
  "ar",
  "rpm",
  "Z",
  "lz",
  "cfb",
  "mxf",
  "mts",
  "blend",
  "bpg",
  "docx",
  "pptx",
  "xlsx",
  "3gp",
  "3g2",
  "j2c",
  "jp2",
  "jpm",
  "jpx",
  "mj2",
  "aif",
  "qcp",
  "odt",
  "ods",
  "odp",
  "xml",
  "mobi",
  "heic",
  "cur",
  "ktx",
  "ape",
  "wv",
  "dcm",
  "ics",
  "glb",
  "pcap",
  "dsf",
  "lnk",
  "alias",
  "voc",
  "ac3",
  "m4v",
  "m4p",
  "m4b",
  "f4v",
  "f4p",
  "f4b",
  "f4a",
  "mie",
  "asf",
  "ogm",
  "ogx",
  "mpc",
  "arrow",
  "shp",
  "aac",
  "mp1",
  "it",
  "s3m",
  "xm",
  "ai",
  "skp",
  "avif",
  "eps",
  "lzh",
  "pgp",
  "asar",
  "stl",
  "chm",
  "3mf",
  "zst",
  "jxl",
  "vcf",
  "jls",
  "pst",
  "dwg",
  "parquet",
  "class",
  "arj",
  "cpio",
  "ace",
  "avro",
  "icc",
  "fbx",
  "vsdx",
  "vtt",
  "apk"
], yi = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/flif",
  "image/x-xcf",
  "image/x-canon-cr2",
  "image/x-canon-cr3",
  "image/tiff",
  "image/bmp",
  "image/vnd.ms-photo",
  "image/vnd.adobe.photoshop",
  "application/x-indesign",
  "application/epub+zip",
  "application/x-xpinstall",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-tar",
  "application/x-rar-compressed",
  "application/gzip",
  "application/x-bzip2",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-apache-arrow",
  "video/mp4",
  "audio/midi",
  "video/x-matroska",
  "video/webm",
  "video/quicktime",
  "video/vnd.avi",
  "audio/wav",
  "audio/qcelp",
  "audio/x-ms-asf",
  "video/x-ms-asf",
  "application/vnd.ms-asf",
  "video/mpeg",
  "video/3gpp",
  "audio/mpeg",
  "audio/mp4",
  // RFC 4337
  "video/ogg",
  "audio/ogg",
  "audio/ogg; codecs=opus",
  "application/ogg",
  "audio/x-flac",
  "audio/ape",
  "audio/wavpack",
  "audio/amr",
  "application/pdf",
  "application/x-elf",
  "application/x-mach-binary",
  "application/x-msdownload",
  "application/x-shockwave-flash",
  "application/rtf",
  "application/wasm",
  "font/woff",
  "font/woff2",
  "application/vnd.ms-fontobject",
  "font/ttf",
  "font/otf",
  "image/x-icon",
  "video/x-flv",
  "application/postscript",
  "application/eps",
  "application/x-xz",
  "application/x-sqlite3",
  "application/x-nintendo-nes-rom",
  "application/x-google-chrome-extension",
  "application/vnd.ms-cab-compressed",
  "application/x-deb",
  "application/x-unix-archive",
  "application/x-rpm",
  "application/x-compress",
  "application/x-lzip",
  "application/x-cfb",
  "application/x-mie",
  "application/mxf",
  "video/mp2t",
  "application/x-blender",
  "image/bpg",
  "image/j2c",
  "image/jp2",
  "image/jpx",
  "image/jpm",
  "image/mj2",
  "audio/aiff",
  "application/xml",
  "application/x-mobipocket-ebook",
  "image/heif",
  "image/heif-sequence",
  "image/heic",
  "image/heic-sequence",
  "image/icns",
  "image/ktx",
  "application/dicom",
  "audio/x-musepack",
  "text/calendar",
  "text/vcard",
  "text/vtt",
  "model/gltf-binary",
  "application/vnd.tcpdump.pcap",
  "audio/x-dsf",
  // Non-standard
  "application/x.ms.shortcut",
  // Invented by us
  "application/x.apple.alias",
  // Invented by us
  "audio/x-voc",
  "audio/vnd.dolby.dd-raw",
  "audio/x-m4a",
  "image/apng",
  "image/x-olympus-orf",
  "image/x-sony-arw",
  "image/x-adobe-dng",
  "image/x-nikon-nef",
  "image/x-panasonic-rw2",
  "image/x-fujifilm-raf",
  "video/x-m4v",
  "video/3gpp2",
  "application/x-esri-shape",
  "audio/aac",
  "audio/x-it",
  "audio/x-s3m",
  "audio/x-xm",
  "video/MP1S",
  "video/MP2P",
  "application/vnd.sketchup.skp",
  "image/avif",
  "application/x-lzh-compressed",
  "application/pgp-encrypted",
  "application/x-asar",
  "model/stl",
  "application/vnd.ms-htmlhelp",
  "model/3mf",
  "image/jxl",
  "application/zstd",
  "image/jls",
  "application/vnd.ms-outlook",
  "image/vnd.dwg",
  "application/x-parquet",
  "application/java-vm",
  "application/x-arj",
  "application/x-cpio",
  "application/x-ace-compressed",
  "application/avro",
  "application/vnd.iccprofile",
  "application/x.autodesk.fbx",
  // Invented by us
  "application/vnd.visio",
  "application/vnd.android.package-archive"
], Ee = 4100;
async function it(i) {
  return new ki().fromBuffer(i);
}
function v(i, e, t) {
  t = {
    offset: 0,
    ...t
  };
  for (const [r, a] of e.entries())
    if (t.mask) {
      if (a !== (t.mask[r] & i[r + t.offset]))
        return !1;
    } else if (a !== i[r + t.offset])
      return !1;
  return !0;
}
class ki {
  constructor(e) {
    this.detectors = e == null ? void 0 : e.customDetectors, this.tokenizerOptions = {
      abortSignal: e == null ? void 0 : e.signal
    }, this.fromTokenizer = this.fromTokenizer.bind(this), this.fromBuffer = this.fromBuffer.bind(this), this.parse = this.parse.bind(this);
  }
  async fromTokenizer(e) {
    const t = e.position;
    for (const r of this.detectors || []) {
      const a = await r(e);
      if (a)
        return a;
      if (t !== e.position)
        return;
    }
    return this.parse(e);
  }
  async fromBuffer(e) {
    if (!(e instanceof Uint8Array || e instanceof ArrayBuffer))
      throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
    const t = e instanceof Uint8Array ? e : new Uint8Array(e);
    if ((t == null ? void 0 : t.length) > 1)
      return this.fromTokenizer(Xt(t, this.tokenizerOptions));
  }
  async fromBlob(e) {
    return this.fromStream(e.stream());
  }
  async fromStream(e) {
    const t = await Ut(e, this.tokenizerOptions);
    try {
      return await this.fromTokenizer(t);
    } finally {
      await t.close();
    }
  }
  async toDetectionStream(e, t) {
    const { sampleSize: r = Ee } = t;
    let a, n;
    const s = e.getReader({ mode: "byob" });
    try {
      const { value: p, done: m } = await s.read(new Uint8Array(r));
      if (n = p, !m && p)
        try {
          a = await this.fromBuffer(p.slice(0, r));
        } catch (o) {
          if (!(o instanceof x))
            throw o;
          a = void 0;
        }
      n = p;
    } finally {
      s.releaseLock();
    }
    const u = new TransformStream({
      async start(p) {
        p.enqueue(n);
      },
      transform(p, m) {
        m.enqueue(p);
      }
    }), c = e.pipeThrough(u);
    return c.fileType = a, c;
  }
  check(e, t) {
    return v(this.buffer, e, t);
  }
  checkString(e, t) {
    return this.check(gi(e), t);
  }
  async parse(e) {
    if (this.buffer = new Uint8Array(Ee), e.fileInfo.size === void 0 && (e.fileInfo.size = Number.MAX_SAFE_INTEGER), this.tokenizer = e, await e.peekBuffer(this.buffer, { length: 12, mayBeLess: !0 }), this.check([66, 77]))
      return {
        ext: "bmp",
        mime: "image/bmp"
      };
    if (this.check([11, 119]))
      return {
        ext: "ac3",
        mime: "audio/vnd.dolby.dd-raw"
      };
    if (this.check([120, 1]))
      return {
        ext: "dmg",
        mime: "application/x-apple-diskimage"
      };
    if (this.check([77, 90]))
      return {
        ext: "exe",
        mime: "application/x-msdownload"
      };
    if (this.check([37, 33]))
      return await e.peekBuffer(this.buffer, { length: 24, mayBeLess: !0 }), this.checkString("PS-Adobe-", { offset: 2 }) && this.checkString(" EPSF-", { offset: 14 }) ? {
        ext: "eps",
        mime: "application/eps"
      } : {
        ext: "ps",
        mime: "application/postscript"
      };
    if (this.check([31, 160]) || this.check([31, 157]))
      return {
        ext: "Z",
        mime: "application/x-compress"
      };
    if (this.check([199, 113]))
      return {
        ext: "cpio",
        mime: "application/x-cpio"
      };
    if (this.check([96, 234]))
      return {
        ext: "arj",
        mime: "application/x-arj"
      };
    if (this.check([239, 187, 191]))
      return this.tokenizer.ignore(3), this.parse(e);
    if (this.check([71, 73, 70]))
      return {
        ext: "gif",
        mime: "image/gif"
      };
    if (this.check([73, 73, 188]))
      return {
        ext: "jxr",
        mime: "image/vnd.ms-photo"
      };
    if (this.check([31, 139, 8]))
      return {
        ext: "gz",
        mime: "application/gzip"
      };
    if (this.check([66, 90, 104]))
      return {
        ext: "bz2",
        mime: "application/x-bzip2"
      };
    if (this.checkString("ID3")) {
      await e.ignore(6);
      const t = await e.readToken(bi);
      return e.position + t > e.fileInfo.size ? {
        ext: "mp3",
        mime: "audio/mpeg"
      } : (await e.ignore(t), this.fromTokenizer(e));
    }
    if (this.checkString("MP+"))
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    if ((this.buffer[0] === 67 || this.buffer[0] === 70) && this.check([87, 83], { offset: 1 }))
      return {
        ext: "swf",
        mime: "application/x-shockwave-flash"
      };
    if (this.check([255, 216, 255]))
      return this.check([247], { offset: 3 }) ? {
        ext: "jls",
        mime: "image/jls"
      } : {
        ext: "jpg",
        mime: "image/jpeg"
      };
    if (this.check([79, 98, 106, 1]))
      return {
        ext: "avro",
        mime: "application/avro"
      };
    if (this.checkString("FLIF"))
      return {
        ext: "flif",
        mime: "image/flif"
      };
    if (this.checkString("8BPS"))
      return {
        ext: "psd",
        mime: "image/vnd.adobe.photoshop"
      };
    if (this.checkString("WEBP", { offset: 8 }))
      return {
        ext: "webp",
        mime: "image/webp"
      };
    if (this.checkString("MPCK"))
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    if (this.checkString("FORM"))
      return {
        ext: "aif",
        mime: "audio/aiff"
      };
    if (this.checkString("icns", { offset: 0 }))
      return {
        ext: "icns",
        mime: "image/icns"
      };
    if (this.check([80, 75, 3, 4])) {
      try {
        for (; e.position + 30 < e.fileInfo.size; ) {
          await e.readBuffer(this.buffer, { length: 30 });
          const t = new DataView(this.buffer.buffer), r = {
            compressedSize: t.getUint32(18, !0),
            uncompressedSize: t.getUint32(22, !0),
            filenameLength: t.getUint16(26, !0),
            extraFieldLength: t.getUint16(28, !0)
          };
          if (r.filename = await e.readToken(new y(r.filenameLength, "utf-8")), await e.ignore(r.extraFieldLength), /classes\d*\.dex/.test(r.filename))
            return {
              ext: "apk",
              mime: "application/vnd.android.package-archive"
            };
          if (r.filename === "META-INF/mozilla.rsa")
            return {
              ext: "xpi",
              mime: "application/x-xpinstall"
            };
          if (r.filename.endsWith(".rels") || r.filename.endsWith(".xml"))
            switch (r.filename.split("/")[0]) {
              case "_rels":
                break;
              case "word":
                return {
                  ext: "docx",
                  mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                };
              case "ppt":
                return {
                  ext: "pptx",
                  mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                };
              case "xl":
                return {
                  ext: "xlsx",
                  mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                };
              case "visio":
                return {
                  ext: "vsdx",
                  mime: "application/vnd.visio"
                };
              default:
                break;
            }
          if (r.filename.startsWith("xl/"))
            return {
              ext: "xlsx",
              mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };
          if (r.filename.startsWith("3D/") && r.filename.endsWith(".model"))
            return {
              ext: "3mf",
              mime: "model/3mf"
            };
          if (r.filename === "mimetype" && r.compressedSize === r.uncompressedSize) {
            let a = await e.readToken(new y(r.compressedSize, "utf-8"));
            switch (a = a.trim(), a) {
              case "application/epub+zip":
                return {
                  ext: "epub",
                  mime: "application/epub+zip"
                };
              case "application/vnd.oasis.opendocument.text":
                return {
                  ext: "odt",
                  mime: "application/vnd.oasis.opendocument.text"
                };
              case "application/vnd.oasis.opendocument.spreadsheet":
                return {
                  ext: "ods",
                  mime: "application/vnd.oasis.opendocument.spreadsheet"
                };
              case "application/vnd.oasis.opendocument.presentation":
                return {
                  ext: "odp",
                  mime: "application/vnd.oasis.opendocument.presentation"
                };
              default:
            }
          }
          if (r.compressedSize === 0) {
            let a = -1;
            for (; a < 0 && e.position < e.fileInfo.size; )
              await e.peekBuffer(this.buffer, { mayBeLess: !0 }), a = tt(this.buffer, new Uint8Array([80, 75, 3, 4])), await e.ignore(a >= 0 ? a : this.buffer.length);
          } else
            await e.ignore(r.compressedSize);
        }
      } catch (t) {
        if (!(t instanceof x))
          throw t;
      }
      return {
        ext: "zip",
        mime: "application/zip"
      };
    }
    if (this.checkString("OggS")) {
      await e.ignore(28);
      const t = new Uint8Array(8);
      return await e.readBuffer(t), v(t, [79, 112, 117, 115, 72, 101, 97, 100]) ? {
        ext: "opus",
        mime: "audio/ogg; codecs=opus"
      } : v(t, [128, 116, 104, 101, 111, 114, 97]) ? {
        ext: "ogv",
        mime: "video/ogg"
      } : v(t, [1, 118, 105, 100, 101, 111, 0]) ? {
        ext: "ogm",
        mime: "video/ogg"
      } : v(t, [127, 70, 76, 65, 67]) ? {
        ext: "oga",
        mime: "audio/ogg"
      } : v(t, [83, 112, 101, 101, 120, 32, 32]) ? {
        ext: "spx",
        mime: "audio/ogg"
      } : v(t, [1, 118, 111, 114, 98, 105, 115]) ? {
        ext: "ogg",
        mime: "audio/ogg"
      } : {
        ext: "ogx",
        mime: "application/ogg"
      };
    }
    if (this.check([80, 75]) && (this.buffer[2] === 3 || this.buffer[2] === 5 || this.buffer[2] === 7) && (this.buffer[3] === 4 || this.buffer[3] === 6 || this.buffer[3] === 8))
      return {
        ext: "zip",
        mime: "application/zip"
      };
    if (this.checkString("ftyp", { offset: 4 }) && this.buffer[8] & 96) {
      const t = new y(4, "latin1").get(this.buffer, 8).replace("\0", " ").trim();
      switch (t) {
        case "avif":
        case "avis":
          return { ext: "avif", mime: "image/avif" };
        case "mif1":
          return { ext: "heic", mime: "image/heif" };
        case "msf1":
          return { ext: "heic", mime: "image/heif-sequence" };
        case "heic":
        case "heix":
          return { ext: "heic", mime: "image/heic" };
        case "hevc":
        case "hevx":
          return { ext: "heic", mime: "image/heic-sequence" };
        case "qt":
          return { ext: "mov", mime: "video/quicktime" };
        case "M4V":
        case "M4VH":
        case "M4VP":
          return { ext: "m4v", mime: "video/x-m4v" };
        case "M4P":
          return { ext: "m4p", mime: "video/mp4" };
        case "M4B":
          return { ext: "m4b", mime: "audio/mp4" };
        case "M4A":
          return { ext: "m4a", mime: "audio/x-m4a" };
        case "F4V":
          return { ext: "f4v", mime: "video/mp4" };
        case "F4P":
          return { ext: "f4p", mime: "video/mp4" };
        case "F4A":
          return { ext: "f4a", mime: "audio/mp4" };
        case "F4B":
          return { ext: "f4b", mime: "audio/mp4" };
        case "crx":
          return { ext: "cr3", mime: "image/x-canon-cr3" };
        default:
          return t.startsWith("3g") ? t.startsWith("3g2") ? { ext: "3g2", mime: "video/3gpp2" } : { ext: "3gp", mime: "video/3gpp" } : { ext: "mp4", mime: "video/mp4" };
      }
    }
    if (this.checkString("MThd"))
      return {
        ext: "mid",
        mime: "audio/midi"
      };
    if (this.checkString("wOFF") && (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 })))
      return {
        ext: "woff",
        mime: "font/woff"
      };
    if (this.checkString("wOF2") && (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 })))
      return {
        ext: "woff2",
        mime: "font/woff2"
      };
    if (this.check([212, 195, 178, 161]) || this.check([161, 178, 195, 212]))
      return {
        ext: "pcap",
        mime: "application/vnd.tcpdump.pcap"
      };
    if (this.checkString("DSD "))
      return {
        ext: "dsf",
        mime: "audio/x-dsf"
        // Non-standard
      };
    if (this.checkString("LZIP"))
      return {
        ext: "lz",
        mime: "application/x-lzip"
      };
    if (this.checkString("fLaC"))
      return {
        ext: "flac",
        mime: "audio/x-flac"
      };
    if (this.check([66, 80, 71, 251]))
      return {
        ext: "bpg",
        mime: "image/bpg"
      };
    if (this.checkString("wvpk"))
      return {
        ext: "wv",
        mime: "audio/wavpack"
      };
    if (this.checkString("%PDF")) {
      try {
        await e.ignore(1350);
        const t = 10 * 1024 * 1024, r = new Uint8Array(Math.min(t, e.fileInfo.size));
        if (await e.readBuffer(r, { mayBeLess: !0 }), xi(r, new TextEncoder().encode("AIPrivateData")))
          return {
            ext: "ai",
            mime: "application/postscript"
          };
      } catch (t) {
        if (!(t instanceof x))
          throw t;
      }
      return {
        ext: "pdf",
        mime: "application/pdf"
      };
    }
    if (this.check([0, 97, 115, 109]))
      return {
        ext: "wasm",
        mime: "application/wasm"
      };
    if (this.check([73, 73])) {
      const t = await this.readTiffHeader(!1);
      if (t)
        return t;
    }
    if (this.check([77, 77])) {
      const t = await this.readTiffHeader(!0);
      if (t)
        return t;
    }
    if (this.checkString("MAC "))
      return {
        ext: "ape",
        mime: "audio/ape"
      };
    if (this.check([26, 69, 223, 163])) {
      async function t() {
        const u = await e.peekNumber(B);
        let c = 128, p = 0;
        for (; !(u & c) && c !== 0; )
          ++p, c >>= 1;
        const m = new Uint8Array(p + 1);
        return await e.readBuffer(m), m;
      }
      async function r() {
        const u = await t(), c = await t();
        c[0] ^= 128 >> c.length - 1;
        const p = Math.min(6, c.length), m = new DataView(u.buffer), o = new DataView(c.buffer, c.length - p, p);
        return {
          id: Ae(m),
          len: Ae(o)
        };
      }
      async function a(u) {
        for (; u > 0; ) {
          const c = await r();
          if (c.id === 17026)
            return (await e.readToken(new y(c.len))).replaceAll(/\00.*$/g, "");
          await e.ignore(c.len), --u;
        }
      }
      const n = await r();
      switch (await a(n.len)) {
        case "webm":
          return {
            ext: "webm",
            mime: "video/webm"
          };
        case "matroska":
          return {
            ext: "mkv",
            mime: "video/x-matroska"
          };
        default:
          return;
      }
    }
    if (this.check([82, 73, 70, 70])) {
      if (this.check([65, 86, 73], { offset: 8 }))
        return {
          ext: "avi",
          mime: "video/vnd.avi"
        };
      if (this.check([87, 65, 86, 69], { offset: 8 }))
        return {
          ext: "wav",
          mime: "audio/wav"
        };
      if (this.check([81, 76, 67, 77], { offset: 8 }))
        return {
          ext: "qcp",
          mime: "audio/qcelp"
        };
    }
    if (this.checkString("SQLi"))
      return {
        ext: "sqlite",
        mime: "application/x-sqlite3"
      };
    if (this.check([78, 69, 83, 26]))
      return {
        ext: "nes",
        mime: "application/x-nintendo-nes-rom"
      };
    if (this.checkString("Cr24"))
      return {
        ext: "crx",
        mime: "application/x-google-chrome-extension"
      };
    if (this.checkString("MSCF") || this.checkString("ISc("))
      return {
        ext: "cab",
        mime: "application/vnd.ms-cab-compressed"
      };
    if (this.check([237, 171, 238, 219]))
      return {
        ext: "rpm",
        mime: "application/x-rpm"
      };
    if (this.check([197, 208, 211, 198]))
      return {
        ext: "eps",
        mime: "application/eps"
      };
    if (this.check([40, 181, 47, 253]))
      return {
        ext: "zst",
        mime: "application/zstd"
      };
    if (this.check([127, 69, 76, 70]))
      return {
        ext: "elf",
        mime: "application/x-elf"
      };
    if (this.check([33, 66, 68, 78]))
      return {
        ext: "pst",
        mime: "application/vnd.ms-outlook"
      };
    if (this.checkString("PAR1"))
      return {
        ext: "parquet",
        mime: "application/x-parquet"
      };
    if (this.check([207, 250, 237, 254]))
      return {
        ext: "macho",
        mime: "application/x-mach-binary"
      };
    if (this.check([79, 84, 84, 79, 0]))
      return {
        ext: "otf",
        mime: "font/otf"
      };
    if (this.checkString("#!AMR"))
      return {
        ext: "amr",
        mime: "audio/amr"
      };
    if (this.checkString("{\\rtf"))
      return {
        ext: "rtf",
        mime: "application/rtf"
      };
    if (this.check([70, 76, 86, 1]))
      return {
        ext: "flv",
        mime: "video/x-flv"
      };
    if (this.checkString("IMPM"))
      return {
        ext: "it",
        mime: "audio/x-it"
      };
    if (this.checkString("-lh0-", { offset: 2 }) || this.checkString("-lh1-", { offset: 2 }) || this.checkString("-lh2-", { offset: 2 }) || this.checkString("-lh3-", { offset: 2 }) || this.checkString("-lh4-", { offset: 2 }) || this.checkString("-lh5-", { offset: 2 }) || this.checkString("-lh6-", { offset: 2 }) || this.checkString("-lh7-", { offset: 2 }) || this.checkString("-lzs-", { offset: 2 }) || this.checkString("-lz4-", { offset: 2 }) || this.checkString("-lz5-", { offset: 2 }) || this.checkString("-lhd-", { offset: 2 }))
      return {
        ext: "lzh",
        mime: "application/x-lzh-compressed"
      };
    if (this.check([0, 0, 1, 186])) {
      if (this.check([33], { offset: 4, mask: [241] }))
        return {
          ext: "mpg",
          // May also be .ps, .mpeg
          mime: "video/MP1S"
        };
      if (this.check([68], { offset: 4, mask: [196] }))
        return {
          ext: "mpg",
          // May also be .mpg, .m2p, .vob or .sub
          mime: "video/MP2P"
        };
    }
    if (this.checkString("ITSF"))
      return {
        ext: "chm",
        mime: "application/vnd.ms-htmlhelp"
      };
    if (this.check([202, 254, 186, 190]))
      return {
        ext: "class",
        mime: "application/java-vm"
      };
    if (this.check([253, 55, 122, 88, 90, 0]))
      return {
        ext: "xz",
        mime: "application/x-xz"
      };
    if (this.checkString("<?xml "))
      return {
        ext: "xml",
        mime: "application/xml"
      };
    if (this.check([55, 122, 188, 175, 39, 28]))
      return {
        ext: "7z",
        mime: "application/x-7z-compressed"
      };
    if (this.check([82, 97, 114, 33, 26, 7]) && (this.buffer[6] === 0 || this.buffer[6] === 1))
      return {
        ext: "rar",
        mime: "application/x-rar-compressed"
      };
    if (this.checkString("solid "))
      return {
        ext: "stl",
        mime: "model/stl"
      };
    if (this.checkString("AC")) {
      const t = new y(4, "latin1").get(this.buffer, 2);
      if (t.match("^d*") && t >= 1e3 && t <= 1050)
        return {
          ext: "dwg",
          mime: "image/vnd.dwg"
        };
    }
    if (this.checkString("070707"))
      return {
        ext: "cpio",
        mime: "application/x-cpio"
      };
    if (this.checkString("BLENDER"))
      return {
        ext: "blend",
        mime: "application/x-blender"
      };
    if (this.checkString("!<arch>"))
      return await e.ignore(8), await e.readToken(new y(13, "ascii")) === "debian-binary" ? {
        ext: "deb",
        mime: "application/x-deb"
      } : {
        ext: "ar",
        mime: "application/x-unix-archive"
      };
    if (this.checkString("WEBVTT") && // One of LF, CR, tab, space, or end of file must follow "WEBVTT" per the spec (see `fixture/fixture-vtt-*.vtt` for examples). Note that `\0` is technically the null character (there is no such thing as an EOF character). However, checking for `\0` gives us the same result as checking for the end of the stream.
    [`
`, "\r", "	", " ", "\0"].some((t) => this.checkString(t, { offset: 6 })))
      return {
        ext: "vtt",
        mime: "text/vtt"
      };
    if (this.check([137, 80, 78, 71, 13, 10, 26, 10])) {
      await e.ignore(8);
      async function t() {
        return {
          length: await e.readToken(Ye),
          type: await e.readToken(new y(4, "latin1"))
        };
      }
      do {
        const r = await t();
        if (r.length < 0)
          return;
        switch (r.type) {
          case "IDAT":
            return {
              ext: "png",
              mime: "image/png"
            };
          case "acTL":
            return {
              ext: "apng",
              mime: "image/apng"
            };
          default:
            await e.ignore(r.length + 4);
        }
      } while (e.position + 8 < e.fileInfo.size);
      return {
        ext: "png",
        mime: "image/png"
      };
    }
    if (this.check([65, 82, 82, 79, 87, 49, 0, 0]))
      return {
        ext: "arrow",
        mime: "application/x-apache-arrow"
      };
    if (this.check([103, 108, 84, 70, 2, 0, 0, 0]))
      return {
        ext: "glb",
        mime: "model/gltf-binary"
      };
    if (this.check([102, 114, 101, 101], { offset: 4 }) || this.check([109, 100, 97, 116], { offset: 4 }) || this.check([109, 111, 111, 118], { offset: 4 }) || this.check([119, 105, 100, 101], { offset: 4 }))
      return {
        ext: "mov",
        mime: "video/quicktime"
      };
    if (this.check([73, 73, 82, 79, 8, 0, 0, 0, 24]))
      return {
        ext: "orf",
        mime: "image/x-olympus-orf"
      };
    if (this.checkString("gimp xcf "))
      return {
        ext: "xcf",
        mime: "image/x-xcf"
      };
    if (this.check([73, 73, 85, 0, 24, 0, 0, 0, 136, 231, 116, 216]))
      return {
        ext: "rw2",
        mime: "image/x-panasonic-rw2"
      };
    if (this.check([48, 38, 178, 117, 142, 102, 207, 17, 166, 217])) {
      async function t() {
        const r = new Uint8Array(16);
        return await e.readBuffer(r), {
          id: r,
          size: Number(await e.readToken(Ve))
        };
      }
      for (await e.ignore(30); e.position + 24 < e.fileInfo.size; ) {
        const r = await t();
        let a = r.size - 24;
        if (v(r.id, [145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101])) {
          const n = new Uint8Array(16);
          if (a -= await e.readBuffer(n), v(n, [64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
            return {
              ext: "asf",
              mime: "audio/x-ms-asf"
            };
          if (v(n, [192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
            return {
              ext: "asf",
              mime: "video/x-ms-asf"
            };
          break;
        }
        await e.ignore(a);
      }
      return {
        ext: "asf",
        mime: "application/vnd.ms-asf"
      };
    }
    if (this.check([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10]))
      return {
        ext: "ktx",
        mime: "image/ktx"
      };
    if ((this.check([126, 16, 4]) || this.check([126, 24, 4])) && this.check([48, 77, 73, 69], { offset: 4 }))
      return {
        ext: "mie",
        mime: "application/x-mie"
      };
    if (this.check([39, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { offset: 2 }))
      return {
        ext: "shp",
        mime: "application/x-esri-shape"
      };
    if (this.check([255, 79, 255, 81]))
      return {
        ext: "j2c",
        mime: "image/j2c"
      };
    if (this.check([0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10]))
      switch (await e.ignore(20), await e.readToken(new y(4, "ascii"))) {
        case "jp2 ":
          return {
            ext: "jp2",
            mime: "image/jp2"
          };
        case "jpx ":
          return {
            ext: "jpx",
            mime: "image/jpx"
          };
        case "jpm ":
          return {
            ext: "jpm",
            mime: "image/jpm"
          };
        case "mjp2":
          return {
            ext: "mj2",
            mime: "image/mj2"
          };
        default:
          return;
      }
    if (this.check([255, 10]) || this.check([0, 0, 0, 12, 74, 88, 76, 32, 13, 10, 135, 10]))
      return {
        ext: "jxl",
        mime: "image/jxl"
      };
    if (this.check([254, 255]))
      return this.check([0, 60, 0, 63, 0, 120, 0, 109, 0, 108], { offset: 2 }) ? {
        ext: "xml",
        mime: "application/xml"
      } : void 0;
    if (this.check([0, 0, 1, 186]) || this.check([0, 0, 1, 179]))
      return {
        ext: "mpg",
        mime: "video/mpeg"
      };
    if (this.check([0, 1, 0, 0, 0]))
      return {
        ext: "ttf",
        mime: "font/ttf"
      };
    if (this.check([0, 0, 1, 0]))
      return {
        ext: "ico",
        mime: "image/x-icon"
      };
    if (this.check([0, 0, 2, 0]))
      return {
        ext: "cur",
        mime: "image/x-icon"
      };
    if (this.check([208, 207, 17, 224, 161, 177, 26, 225]))
      return {
        ext: "cfb",
        mime: "application/x-cfb"
      };
    if (await e.peekBuffer(this.buffer, { length: Math.min(256, e.fileInfo.size), mayBeLess: !0 }), this.check([97, 99, 115, 112], { offset: 36 }))
      return {
        ext: "icc",
        mime: "application/vnd.iccprofile"
      };
    if (this.checkString("**ACE", { offset: 7 }) && this.checkString("**", { offset: 12 }))
      return {
        ext: "ace",
        mime: "application/x-ace-compressed"
      };
    if (this.checkString("BEGIN:")) {
      if (this.checkString("VCARD", { offset: 6 }))
        return {
          ext: "vcf",
          mime: "text/vcard"
        };
      if (this.checkString("VCALENDAR", { offset: 6 }))
        return {
          ext: "ics",
          mime: "text/calendar"
        };
    }
    if (this.checkString("FUJIFILMCCD-RAW"))
      return {
        ext: "raf",
        mime: "image/x-fujifilm-raf"
      };
    if (this.checkString("Extended Module:"))
      return {
        ext: "xm",
        mime: "audio/x-xm"
      };
    if (this.checkString("Creative Voice File"))
      return {
        ext: "voc",
        mime: "audio/x-voc"
      };
    if (this.check([4, 0, 0, 0]) && this.buffer.length >= 16) {
      const t = new DataView(this.buffer.buffer).getUint32(12, !0);
      if (t > 12 && this.buffer.length >= t + 16)
        try {
          const r = new TextDecoder().decode(this.buffer.slice(16, t + 16));
          if (JSON.parse(r).files)
            return {
              ext: "asar",
              mime: "application/x-asar"
            };
        } catch {
        }
    }
    if (this.check([6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2]))
      return {
        ext: "mxf",
        mime: "application/mxf"
      };
    if (this.checkString("SCRM", { offset: 44 }))
      return {
        ext: "s3m",
        mime: "audio/x-s3m"
      };
    if (this.check([71]) && this.check([71], { offset: 188 }))
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    if (this.check([71], { offset: 4 }) && this.check([71], { offset: 196 }))
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    if (this.check([66, 79, 79, 75, 77, 79, 66, 73], { offset: 60 }))
      return {
        ext: "mobi",
        mime: "application/x-mobipocket-ebook"
      };
    if (this.check([68, 73, 67, 77], { offset: 128 }))
      return {
        ext: "dcm",
        mime: "application/dicom"
      };
    if (this.check([76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70]))
      return {
        ext: "lnk",
        mime: "application/x.ms.shortcut"
        // Invented by us
      };
    if (this.check([98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0]))
      return {
        ext: "alias",
        mime: "application/x.apple.alias"
        // Invented by us
      };
    if (this.checkString("Kaydara FBX Binary  \0"))
      return {
        ext: "fbx",
        mime: "application/x.autodesk.fbx"
        // Invented by us
      };
    if (this.check([76, 80], { offset: 34 }) && (this.check([0, 0, 1], { offset: 8 }) || this.check([1, 0, 2], { offset: 8 }) || this.check([2, 0, 2], { offset: 8 })))
      return {
        ext: "eot",
        mime: "application/vnd.ms-fontobject"
      };
    if (this.check([6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29]))
      return {
        ext: "indd",
        mime: "application/x-indesign"
      };
    if (await e.peekBuffer(this.buffer, { length: Math.min(512, e.fileInfo.size), mayBeLess: !0 }), wi(this.buffer))
      return {
        ext: "tar",
        mime: "application/x-tar"
      };
    if (this.check([255, 254]))
      return this.check([60, 0, 63, 0, 120, 0, 109, 0, 108, 0], { offset: 2 }) ? {
        ext: "xml",
        mime: "application/xml"
      } : this.check([255, 14, 83, 0, 107, 0, 101, 0, 116, 0, 99, 0, 104, 0, 85, 0, 112, 0, 32, 0, 77, 0, 111, 0, 100, 0, 101, 0, 108, 0], { offset: 2 }) ? {
        ext: "skp",
        mime: "application/vnd.sketchup.skp"
      } : void 0;
    if (this.checkString("-----BEGIN PGP MESSAGE-----"))
      return {
        ext: "pgp",
        mime: "application/pgp-encrypted"
      };
    if (this.buffer.length >= 2 && this.check([255, 224], { offset: 0, mask: [255, 224] })) {
      if (this.check([16], { offset: 1, mask: [22] }))
        return this.check([8], { offset: 1, mask: [8] }) ? {
          ext: "aac",
          mime: "audio/aac"
        } : {
          ext: "aac",
          mime: "audio/aac"
        };
      if (this.check([2], { offset: 1, mask: [6] }))
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      if (this.check([4], { offset: 1, mask: [6] }))
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      if (this.check([6], { offset: 1, mask: [6] }))
        return {
          ext: "mp1",
          mime: "audio/mpeg"
        };
    }
  }
  async readTiffTag(e) {
    const t = await this.tokenizer.readToken(e ? O : S);
    switch (this.tokenizer.ignore(10), t) {
      case 50341:
        return {
          ext: "arw",
          mime: "image/x-sony-arw"
        };
      case 50706:
        return {
          ext: "dng",
          mime: "image/x-adobe-dng"
        };
    }
  }
  async readTiffIFD(e) {
    const t = await this.tokenizer.readToken(e ? O : S);
    for (let r = 0; r < t; ++r) {
      const a = await this.readTiffTag(e);
      if (a)
        return a;
    }
  }
  async readTiffHeader(e) {
    const t = (e ? O : S).get(this.buffer, 2), r = (e ? Y : w).get(this.buffer, 4);
    if (t === 42) {
      if (r >= 6) {
        if (this.checkString("CR", { offset: 8 }))
          return {
            ext: "cr2",
            mime: "image/x-canon-cr2"
          };
        if (r >= 8 && (this.check([28, 0, 254, 0], { offset: 8 }) || this.check([31, 0, 11, 0], { offset: 8 })))
          return {
            ext: "nef",
            mime: "image/x-nikon-nef"
          };
      }
      return await this.tokenizer.ignore(r), await this.readTiffIFD(e) ?? {
        ext: "tif",
        mime: "image/tiff"
      };
    }
    if (t === 43)
      return {
        ext: "tif",
        mime: "image/tiff"
      };
  }
}
new Set(Ti);
new Set(yi);
var he = {};
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var Re = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g, Ii = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/, rt = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/, vi = /\\([\u000b\u0020-\u00ff])/g, Si = /([\\"])/g, at = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
he.format = Ci;
he.parse = Ai;
function Ci(i) {
  if (!i || typeof i != "object")
    throw new TypeError("argument obj is required");
  var e = i.parameters, t = i.type;
  if (!t || !at.test(t))
    throw new TypeError("invalid type");
  var r = t;
  if (e && typeof e == "object")
    for (var a, n = Object.keys(e).sort(), s = 0; s < n.length; s++) {
      if (a = n[s], !rt.test(a))
        throw new TypeError("invalid parameter name");
      r += "; " + a + "=" + Ri(e[a]);
    }
  return r;
}
function Ai(i) {
  if (!i)
    throw new TypeError("argument string is required");
  var e = typeof i == "object" ? Ei(i) : i;
  if (typeof e != "string")
    throw new TypeError("argument string is required to be a string");
  var t = e.indexOf(";"), r = t !== -1 ? e.slice(0, t).trim() : e.trim();
  if (!at.test(r))
    throw new TypeError("invalid media type");
  var a = new _i(r.toLowerCase());
  if (t !== -1) {
    var n, s, u;
    for (Re.lastIndex = t; s = Re.exec(e); ) {
      if (s.index !== t)
        throw new TypeError("invalid parameter format");
      t += s[0].length, n = s[1].toLowerCase(), u = s[2], u.charCodeAt(0) === 34 && (u = u.slice(1, -1), u.indexOf("\\") !== -1 && (u = u.replace(vi, "$1"))), a.parameters[n] = u;
    }
    if (t !== e.length)
      throw new TypeError("invalid parameter format");
  }
  return a;
}
function Ei(i) {
  var e;
  if (typeof i.getHeader == "function" ? e = i.getHeader("content-type") : typeof i.headers == "object" && (e = i.headers && i.headers["content-type"]), typeof e != "string")
    throw new TypeError("content-type header is missing from object");
  return e;
}
function Ri(i) {
  var e = String(i);
  if (rt.test(e))
    return e;
  if (e.length > 0 && !Ii.test(e))
    throw new TypeError("invalid parameter value");
  return '"' + e.replace(Si, "\\$1") + '"';
}
function _i(i) {
  this.parameters = /* @__PURE__ */ Object.create(null), this.type = i;
}
/*!
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
var Bi = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/, Mi = Fi;
function Fi(i) {
  if (!i)
    throw new TypeError("argument string is required");
  if (typeof i != "string")
    throw new TypeError("argument string is required to be a string");
  var e = Bi.exec(i.toLowerCase());
  if (!e)
    throw new TypeError("invalid media type");
  var t = e[1], r = e[2], a, n = r.lastIndexOf("+");
  return n !== -1 && (a = r.substr(n + 1), r = r.substr(0, n)), new Di(t, r, a);
}
function Di(i, e, t) {
  this.type = i, this.subtype = e, this.suffix = t;
}
var _e;
(function(i) {
  i[i.shot = 10] = "shot", i[i.scene = 20] = "scene", i[i.track = 30] = "track", i[i.part = 40] = "part", i[i.album = 50] = "album", i[i.edition = 60] = "edition", i[i.collection = 70] = "collection";
})(_e || (_e = {}));
var me;
(function(i) {
  i[i.video = 1] = "video", i[i.audio = 2] = "audio", i[i.complex = 3] = "complex", i[i.logo = 4] = "logo", i[i.subtitle = 17] = "subtitle", i[i.button = 18] = "button", i[i.control = 32] = "control";
})(me || (me = {}));
const L = (i) => class extends Error {
  constructor(t) {
    super(t), this.name = i;
  }
};
class Oi extends L("CouldNotDetermineFileTypeError") {
}
class zi extends L("UnsupportedFileTypeError") {
}
class Li extends L("UnexpectedFileContentError") {
  constructor(e, t) {
    super(t), this.fileType = e;
  }
  // Override toString to include file type information.
  toString() {
    return `${this.name} (FileType: ${this.fileType}): ${this.message}`;
  }
}
class xe extends L("FieldDecodingError") {
}
class nt extends L("InternalParserError") {
}
const Pi = (i) => class extends Li {
  constructor(e) {
    super(i, e);
  }
};
function D(i, e, t) {
  return (i[e] & 1 << t) !== 0;
}
function Be(i, e, t, r) {
  let a = e;
  if (r === "utf-16le") {
    for (; i[a] !== 0 || i[a + 1] !== 0; ) {
      if (a >= t)
        return t;
      a += 2;
    }
    return a;
  }
  for (; i[a] !== 0; ) {
    if (a >= t)
      return t;
    a++;
  }
  return a;
}
function Ni(i) {
  const e = i.indexOf("\0");
  return e === -1 ? i : i.substr(0, e);
}
function Ui(i) {
  const e = i.length;
  if (e & 1)
    throw new xe("Buffer length must be even");
  for (let t = 0; t < e; t += 2) {
    const r = i[t];
    i[t] = i[t + 1], i[t + 1] = r;
  }
  return i;
}
function pe(i, e) {
  if (i[0] === 255 && i[1] === 254)
    return pe(i.subarray(2), e);
  if (e === "utf-16le" && i[0] === 254 && i[1] === 255) {
    if (i.length & 1)
      throw new xe("Expected even number of octets for 16-bit unicode string");
    return pe(Ui(i), e);
  }
  return new y(i.length, e).get(i, 0);
}
function aa(i) {
  return i = i.replace(/^\x00+/g, ""), i = i.replace(/\x00+$/g, ""), i;
}
function st(i, e, t, r) {
  const a = e + ~~(t / 8), n = t % 8;
  let s = i[a];
  s &= 255 >> n;
  const u = 8 - n, c = r - u;
  return c < 0 ? s >>= 8 - n - r : c > 0 && (s <<= c, s |= st(i, e, t + u, c)), s;
}
function na(i, e, t) {
  return st(i, e, t, 1) === 1;
}
function Xi(i) {
  const e = [];
  for (let t = 0, r = i.length; t < r; t++) {
    const a = Number(i.charCodeAt(t)).toString(16);
    e.push(a.length === 1 ? `0${a}` : a);
  }
  return e.join(" ");
}
function Gi(i) {
  return 10 * Math.log10(i);
}
function ji(i) {
  return 10 ** (i / 10);
}
function $i(i) {
  const e = i.split(" ").map((t) => t.trim().toLowerCase());
  if (e.length >= 1) {
    const t = Number.parseFloat(e[0]);
    return e.length === 2 && e[1] === "db" ? {
      dB: t,
      ratio: ji(t)
    } : {
      dB: Gi(t),
      ratio: t
    };
  }
}
var Me;
(function(i) {
  i[i.Other = 0] = "Other", i[i["32x32 pixels 'file icon' (PNG only)"] = 1] = "32x32 pixels 'file icon' (PNG only)", i[i["Other file icon"] = 2] = "Other file icon", i[i["Cover (front)"] = 3] = "Cover (front)", i[i["Cover (back)"] = 4] = "Cover (back)", i[i["Leaflet page"] = 5] = "Leaflet page", i[i["Media (e.g. label side of CD)"] = 6] = "Media (e.g. label side of CD)", i[i["Lead artist/lead performer/soloist"] = 7] = "Lead artist/lead performer/soloist", i[i["Artist/performer"] = 8] = "Artist/performer", i[i.Conductor = 9] = "Conductor", i[i["Band/Orchestra"] = 10] = "Band/Orchestra", i[i.Composer = 11] = "Composer", i[i["Lyricist/text writer"] = 12] = "Lyricist/text writer", i[i["Recording Location"] = 13] = "Recording Location", i[i["During recording"] = 14] = "During recording", i[i["During performance"] = 15] = "During performance", i[i["Movie/video screen capture"] = 16] = "Movie/video screen capture", i[i["A bright coloured fish"] = 17] = "A bright coloured fish", i[i.Illustration = 18] = "Illustration", i[i["Band/artist logotype"] = 19] = "Band/artist logotype", i[i["Publisher/Studio logotype"] = 20] = "Publisher/Studio logotype";
})(Me || (Me = {}));
var V;
(function(i) {
  i[i.other = 0] = "other", i[i.lyrics = 1] = "lyrics", i[i.text = 2] = "text", i[i.movement_part = 3] = "movement_part", i[i.events = 4] = "events", i[i.chord = 5] = "chord", i[i.trivia_pop = 6] = "trivia_pop";
})(V || (V = {}));
var Z;
(function(i) {
  i[i.notSynchronized0 = 0] = "notSynchronized0", i[i.mpegFrameNumber = 1] = "mpegFrameNumber", i[i.milliseconds = 2] = "milliseconds";
})(Z || (Z = {}));
const Wi = {
  get: (i, e) => i[e + 3] & 127 | i[e + 2] << 7 | i[e + 1] << 14 | i[e] << 21,
  len: 4
}, sa = {
  len: 10,
  get: (i, e) => ({
    // ID3v2/file identifier   "ID3"
    fileIdentifier: new y(3, "ascii").get(i, e),
    // ID3v2 versionIndex
    version: {
      major: ue.get(i, e + 3),
      revision: ue.get(i, e + 4)
    },
    // ID3v2 flags
    flags: {
      // Unsynchronisation
      unsynchronisation: D(i, e + 5, 7),
      // Extended header
      isExtendedHeader: D(i, e + 5, 6),
      // Experimental indicator
      expIndicator: D(i, e + 5, 5),
      footer: D(i, e + 5, 4)
    },
    size: Wi.get(i, e + 6)
  })
}, oa = {
  len: 10,
  get: (i, e) => ({
    // Extended header size
    size: Y.get(i, e),
    // Extended Flags
    extendedFlags: O.get(i, e + 4),
    // Size of padding
    sizeOfPadding: Y.get(i, e + 6),
    // CRC data present
    crcDataPresent: D(i, e + 4, 31)
  })
}, qi = {
  len: 1,
  get: (i, e) => {
    switch (i[e]) {
      case 0:
        return { encoding: "latin1" };
      case 1:
        return { encoding: "utf-16le", bom: !0 };
      case 2:
        return { encoding: "utf-16le", bom: !1 };
      case 3:
        return { encoding: "utf8", bom: !1 };
      default:
        return { encoding: "utf8", bom: !1 };
    }
  }
}, Hi = {
  len: 4,
  get: (i, e) => ({
    encoding: qi.get(i, e),
    language: new y(3, "latin1").get(i, e + 1)
  })
}, ca = {
  len: 6,
  get: (i, e) => {
    const t = Hi.get(i, e);
    return {
      encoding: t.encoding,
      language: t.language,
      timeStampFormat: B.get(i, e + 4),
      contentType: B.get(i, e + 5)
    };
  }
}, K = {
  year: { multiple: !1 },
  track: { multiple: !1 },
  disk: { multiple: !1 },
  title: { multiple: !1 },
  artist: { multiple: !1 },
  artists: { multiple: !0, unique: !0 },
  albumartist: { multiple: !1 },
  album: { multiple: !1 },
  date: { multiple: !1 },
  originaldate: { multiple: !1 },
  originalyear: { multiple: !1 },
  releasedate: { multiple: !1 },
  comment: { multiple: !0, unique: !1 },
  genre: { multiple: !0, unique: !0 },
  picture: { multiple: !0, unique: !0 },
  composer: { multiple: !0, unique: !0 },
  lyrics: { multiple: !0, unique: !1 },
  albumsort: { multiple: !1, unique: !0 },
  titlesort: { multiple: !1, unique: !0 },
  work: { multiple: !1, unique: !0 },
  artistsort: { multiple: !1, unique: !0 },
  albumartistsort: { multiple: !1, unique: !0 },
  composersort: { multiple: !1, unique: !0 },
  lyricist: { multiple: !0, unique: !0 },
  writer: { multiple: !0, unique: !0 },
  conductor: { multiple: !0, unique: !0 },
  remixer: { multiple: !0, unique: !0 },
  arranger: { multiple: !0, unique: !0 },
  engineer: { multiple: !0, unique: !0 },
  producer: { multiple: !0, unique: !0 },
  technician: { multiple: !0, unique: !0 },
  djmixer: { multiple: !0, unique: !0 },
  mixer: { multiple: !0, unique: !0 },
  label: { multiple: !0, unique: !0 },
  grouping: { multiple: !1 },
  subtitle: { multiple: !0 },
  discsubtitle: { multiple: !1 },
  totaltracks: { multiple: !1 },
  totaldiscs: { multiple: !1 },
  compilation: { multiple: !1 },
  rating: { multiple: !0 },
  bpm: { multiple: !1 },
  mood: { multiple: !1 },
  media: { multiple: !1 },
  catalognumber: { multiple: !0, unique: !0 },
  tvShow: { multiple: !1 },
  tvShowSort: { multiple: !1 },
  tvSeason: { multiple: !1 },
  tvEpisode: { multiple: !1 },
  tvEpisodeId: { multiple: !1 },
  tvNetwork: { multiple: !1 },
  podcast: { multiple: !1 },
  podcasturl: { multiple: !1 },
  releasestatus: { multiple: !1 },
  releasetype: { multiple: !0 },
  releasecountry: { multiple: !1 },
  script: { multiple: !1 },
  language: { multiple: !1 },
  copyright: { multiple: !1 },
  license: { multiple: !1 },
  encodedby: { multiple: !1 },
  encodersettings: { multiple: !1 },
  gapless: { multiple: !1 },
  barcode: { multiple: !1 },
  isrc: { multiple: !0 },
  asin: { multiple: !1 },
  musicbrainz_recordingid: { multiple: !1 },
  musicbrainz_trackid: { multiple: !1 },
  musicbrainz_albumid: { multiple: !1 },
  musicbrainz_artistid: { multiple: !0 },
  musicbrainz_albumartistid: { multiple: !0 },
  musicbrainz_releasegroupid: { multiple: !1 },
  musicbrainz_workid: { multiple: !1 },
  musicbrainz_trmid: { multiple: !1 },
  musicbrainz_discid: { multiple: !1 },
  acoustid_id: { multiple: !1 },
  acoustid_fingerprint: { multiple: !1 },
  musicip_puid: { multiple: !1 },
  musicip_fingerprint: { multiple: !1 },
  website: { multiple: !1 },
  "performer:instrument": { multiple: !0, unique: !0 },
  averageLevel: { multiple: !1 },
  peakLevel: { multiple: !1 },
  notes: { multiple: !0, unique: !1 },
  key: { multiple: !1 },
  originalalbum: { multiple: !1 },
  originalartist: { multiple: !1 },
  discogs_artist_id: { multiple: !0, unique: !0 },
  discogs_release_id: { multiple: !1 },
  discogs_label_id: { multiple: !1 },
  discogs_master_release_id: { multiple: !1 },
  discogs_votes: { multiple: !1 },
  discogs_rating: { multiple: !1 },
  replaygain_track_peak: { multiple: !1 },
  replaygain_track_gain: { multiple: !1 },
  replaygain_album_peak: { multiple: !1 },
  replaygain_album_gain: { multiple: !1 },
  replaygain_track_minmax: { multiple: !1 },
  replaygain_album_minmax: { multiple: !1 },
  replaygain_undo: { multiple: !1 },
  description: { multiple: !0 },
  longDescription: { multiple: !1 },
  category: { multiple: !0 },
  hdVideo: { multiple: !1 },
  keywords: { multiple: !0 },
  movement: { multiple: !1 },
  movementIndex: { multiple: !1 },
  movementTotal: { multiple: !1 },
  podcastId: { multiple: !1 },
  showMovement: { multiple: !1 },
  stik: { multiple: !1 }
};
function Yi(i) {
  return K[i] && !K[i].multiple;
}
function Vi(i) {
  return !K[i].multiple || K[i].unique || !1;
}
class k {
  static toIntOrNull(e) {
    const t = Number.parseInt(e, 10);
    return Number.isNaN(t) ? null : t;
  }
  // TODO: a string of 1of1 would fail to be converted
  // converts 1/10 to no : 1, of : 10
  // or 1 to no : 1, of : 0
  static normalizeTrack(e) {
    const t = e.toString().split("/");
    return {
      no: Number.parseInt(t[0], 10) || null,
      of: Number.parseInt(t[1], 10) || null
    };
  }
  constructor(e, t) {
    this.tagTypes = e, this.tagMap = t;
  }
  /**
   * Process and set common tags
   * write common tags to
   * @param tag Native tag
   * @param warnings Register warnings
   * @return common name
   */
  mapGenericTag(e, t) {
    e = { id: e.id, value: e.value }, this.postMap(e, t);
    const r = this.getCommonName(e.id);
    return r ? { id: r, value: e.value } : null;
  }
  /**
   * Convert native tag key to common tag key
   * @param tag Native header tag
   * @return common tag name (alias)
   */
  getCommonName(e) {
    return this.tagMap[e];
  }
  /**
   * Handle post mapping exceptions / correction
   * @param tag Tag e.g. {"©alb", "Buena Vista Social Club")
   * @param warnings Used to register warnings
   */
  postMap(e, t) {
  }
}
k.maxRatingScore = 1;
const Zi = {
  title: "title",
  artist: "artist",
  album: "album",
  year: "year",
  comment: "comment",
  track: "track",
  genre: "genre"
};
class Ki extends k {
  constructor() {
    super(["ID3v1"], Zi);
  }
}
class P extends k {
  constructor(e, t) {
    const r = {};
    for (const a of Object.keys(t))
      r[a.toUpperCase()] = t[a];
    super(e, r);
  }
  /**
   * @tag  Native header tag
   * @return common tag name (alias)
   */
  getCommonName(e) {
    return this.tagMap[e.toUpperCase()];
  }
}
const Ji = {
  // id3v2.3
  TIT2: "title",
  TPE1: "artist",
  "TXXX:Artists": "artists",
  TPE2: "albumartist",
  TALB: "album",
  TDRV: "date",
  // [ 'date', 'year' ] ToDo: improve 'year' mapping
  /**
   * Original release year
   */
  TORY: "originalyear",
  TPOS: "disk",
  TCON: "genre",
  APIC: "picture",
  TCOM: "composer",
  USLT: "lyrics",
  TSOA: "albumsort",
  TSOT: "titlesort",
  TOAL: "originalalbum",
  TSOP: "artistsort",
  TSO2: "albumartistsort",
  TSOC: "composersort",
  TEXT: "lyricist",
  "TXXX:Writer": "writer",
  TPE3: "conductor",
  // 'IPLS:instrument': 'performer:instrument', // ToDo
  TPE4: "remixer",
  "IPLS:arranger": "arranger",
  "IPLS:engineer": "engineer",
  "IPLS:producer": "producer",
  "IPLS:DJ-mix": "djmixer",
  "IPLS:mix": "mixer",
  TPUB: "label",
  TIT1: "grouping",
  TIT3: "subtitle",
  TRCK: "track",
  TCMP: "compilation",
  POPM: "rating",
  TBPM: "bpm",
  TMED: "media",
  "TXXX:CATALOGNUMBER": "catalognumber",
  "TXXX:MusicBrainz Album Status": "releasestatus",
  "TXXX:MusicBrainz Album Type": "releasetype",
  /**
   * Release country as documented: https://picard.musicbrainz.org/docs/mappings/#cite_note-0
   */
  "TXXX:MusicBrainz Album Release Country": "releasecountry",
  /**
   * Release country as implemented // ToDo: report
   */
  "TXXX:RELEASECOUNTRY": "releasecountry",
  "TXXX:SCRIPT": "script",
  TLAN: "language",
  TCOP: "copyright",
  WCOP: "license",
  TENC: "encodedby",
  TSSE: "encodersettings",
  "TXXX:BARCODE": "barcode",
  "TXXX:ISRC": "isrc",
  TSRC: "isrc",
  "TXXX:ASIN": "asin",
  "TXXX:originalyear": "originalyear",
  "UFID:http://musicbrainz.org": "musicbrainz_recordingid",
  "TXXX:MusicBrainz Release Track Id": "musicbrainz_trackid",
  "TXXX:MusicBrainz Album Id": "musicbrainz_albumid",
  "TXXX:MusicBrainz Artist Id": "musicbrainz_artistid",
  "TXXX:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
  "TXXX:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
  "TXXX:MusicBrainz Work Id": "musicbrainz_workid",
  "TXXX:MusicBrainz TRM Id": "musicbrainz_trmid",
  "TXXX:MusicBrainz Disc Id": "musicbrainz_discid",
  "TXXX:ACOUSTID_ID": "acoustid_id",
  "TXXX:Acoustid Id": "acoustid_id",
  "TXXX:Acoustid Fingerprint": "acoustid_fingerprint",
  "TXXX:MusicIP PUID": "musicip_puid",
  "TXXX:MusicMagic Fingerprint": "musicip_fingerprint",
  WOAR: "website",
  // id3v2.4
  // ToDo: In same sequence as defined at http://id3.org/id3v2.4.0-frames
  TDRC: "date",
  // date YYYY-MM-DD
  TYER: "year",
  TDOR: "originaldate",
  // 'TMCL:instrument': 'performer:instrument',
  "TIPL:arranger": "arranger",
  "TIPL:engineer": "engineer",
  "TIPL:producer": "producer",
  "TIPL:DJ-mix": "djmixer",
  "TIPL:mix": "mixer",
  TMOO: "mood",
  // additional mappings:
  SYLT: "lyrics",
  TSST: "discsubtitle",
  TKEY: "key",
  COMM: "comment",
  TOPE: "originalartist",
  // Windows Media Player
  "PRIV:AverageLevel": "averageLevel",
  "PRIV:PeakLevel": "peakLevel",
  // Discogs
  "TXXX:DISCOGS_ARTIST_ID": "discogs_artist_id",
  "TXXX:DISCOGS_ARTISTS": "artists",
  "TXXX:DISCOGS_ARTIST_NAME": "artists",
  "TXXX:DISCOGS_ALBUM_ARTISTS": "albumartist",
  "TXXX:DISCOGS_CATALOG": "catalognumber",
  "TXXX:DISCOGS_COUNTRY": "releasecountry",
  "TXXX:DISCOGS_DATE": "originaldate",
  "TXXX:DISCOGS_LABEL": "label",
  "TXXX:DISCOGS_LABEL_ID": "discogs_label_id",
  "TXXX:DISCOGS_MASTER_RELEASE_ID": "discogs_master_release_id",
  "TXXX:DISCOGS_RATING": "discogs_rating",
  "TXXX:DISCOGS_RELEASED": "date",
  "TXXX:DISCOGS_RELEASE_ID": "discogs_release_id",
  "TXXX:DISCOGS_VOTES": "discogs_votes",
  "TXXX:CATALOGID": "catalognumber",
  "TXXX:STYLE": "genre",
  "TXXX:REPLAYGAIN_TRACK_PEAK": "replaygain_track_peak",
  "TXXX:REPLAYGAIN_TRACK_GAIN": "replaygain_track_gain",
  "TXXX:REPLAYGAIN_ALBUM_PEAK": "replaygain_album_peak",
  "TXXX:REPLAYGAIN_ALBUM_GAIN": "replaygain_album_gain",
  "TXXX:MP3GAIN_MINMAX": "replaygain_track_minmax",
  "TXXX:MP3GAIN_ALBUM_MINMAX": "replaygain_album_minmax",
  "TXXX:MP3GAIN_UNDO": "replaygain_undo",
  MVNM: "movement",
  MVIN: "movementIndex",
  PCST: "podcast",
  TCAT: "category",
  TDES: "description",
  TDRL: "releasedate",
  TGID: "podcastId",
  TKWD: "keywords",
  WFED: "podcasturl",
  GRP1: "grouping"
};
class ge extends P {
  static toRating(e) {
    return {
      source: e.email,
      rating: e.rating > 0 ? (e.rating - 1) / 254 * k.maxRatingScore : void 0
    };
  }
  constructor() {
    super(["ID3v2.3", "ID3v2.4"], Ji);
  }
  /**
   * Handle post mapping exceptions / correction
   * @param tag to post map
   * @param warnings Wil be used to register (collect) warnings
   */
  postMap(e, t) {
    switch (e.id) {
      case "UFID":
        {
          const r = e.value;
          r.owner_identifier === "http://musicbrainz.org" && (e.id += `:${r.owner_identifier}`, e.value = pe(r.identifier, "latin1"));
        }
        break;
      case "PRIV":
        {
          const r = e.value;
          switch (r.owner_identifier) {
            case "AverageLevel":
            case "PeakValue":
              e.id += `:${r.owner_identifier}`, e.value = r.data.length === 4 ? w.get(r.data, 0) : null, e.value === null && t.addWarning("Failed to parse PRIV:PeakValue");
              break;
            default:
              t.addWarning(`Unknown PRIV owner-identifier: ${r.data}`);
          }
        }
        break;
      case "POPM":
        e.value = ge.toRating(e.value);
        break;
    }
  }
}
const Qi = {
  Title: "title",
  Author: "artist",
  "WM/AlbumArtist": "albumartist",
  "WM/AlbumTitle": "album",
  "WM/Year": "date",
  // changed to 'year' to 'date' based on Picard mappings; ToDo: check me
  "WM/OriginalReleaseTime": "originaldate",
  "WM/OriginalReleaseYear": "originalyear",
  Description: "comment",
  "WM/TrackNumber": "track",
  "WM/PartOfSet": "disk",
  "WM/Genre": "genre",
  "WM/Composer": "composer",
  "WM/Lyrics": "lyrics",
  "WM/AlbumSortOrder": "albumsort",
  "WM/TitleSortOrder": "titlesort",
  "WM/ArtistSortOrder": "artistsort",
  "WM/AlbumArtistSortOrder": "albumartistsort",
  "WM/ComposerSortOrder": "composersort",
  "WM/Writer": "lyricist",
  "WM/Conductor": "conductor",
  "WM/ModifiedBy": "remixer",
  "WM/Engineer": "engineer",
  "WM/Producer": "producer",
  "WM/DJMixer": "djmixer",
  "WM/Mixer": "mixer",
  "WM/Publisher": "label",
  "WM/ContentGroupDescription": "grouping",
  "WM/SubTitle": "subtitle",
  "WM/SetSubTitle": "discsubtitle",
  // 'WM/PartOfSet': 'totaldiscs',
  "WM/IsCompilation": "compilation",
  "WM/SharedUserRating": "rating",
  "WM/BeatsPerMinute": "bpm",
  "WM/Mood": "mood",
  "WM/Media": "media",
  "WM/CatalogNo": "catalognumber",
  "MusicBrainz/Album Status": "releasestatus",
  "MusicBrainz/Album Type": "releasetype",
  "MusicBrainz/Album Release Country": "releasecountry",
  "WM/Script": "script",
  "WM/Language": "language",
  Copyright: "copyright",
  LICENSE: "license",
  "WM/EncodedBy": "encodedby",
  "WM/EncodingSettings": "encodersettings",
  "WM/Barcode": "barcode",
  "WM/ISRC": "isrc",
  "MusicBrainz/Track Id": "musicbrainz_recordingid",
  "MusicBrainz/Release Track Id": "musicbrainz_trackid",
  "MusicBrainz/Album Id": "musicbrainz_albumid",
  "MusicBrainz/Artist Id": "musicbrainz_artistid",
  "MusicBrainz/Album Artist Id": "musicbrainz_albumartistid",
  "MusicBrainz/Release Group Id": "musicbrainz_releasegroupid",
  "MusicBrainz/Work Id": "musicbrainz_workid",
  "MusicBrainz/TRM Id": "musicbrainz_trmid",
  "MusicBrainz/Disc Id": "musicbrainz_discid",
  "Acoustid/Id": "acoustid_id",
  "Acoustid/Fingerprint": "acoustid_fingerprint",
  "MusicIP/PUID": "musicip_puid",
  "WM/ARTISTS": "artists",
  "WM/InitialKey": "key",
  ASIN: "asin",
  "WM/Work": "work",
  "WM/AuthorURL": "website",
  "WM/Picture": "picture"
};
class we extends k {
  static toRating(e) {
    return {
      rating: Number.parseFloat(e + 1) / 5
    };
  }
  constructor() {
    super(["asf"], Qi);
  }
  postMap(e) {
    switch (e.id) {
      case "WM/SharedUserRating": {
        const t = e.id.split(":");
        e.value = we.toRating(e.value), e.id = t[0];
        break;
      }
    }
  }
}
const er = {
  TT2: "title",
  TP1: "artist",
  TP2: "albumartist",
  TAL: "album",
  TYE: "year",
  COM: "comment",
  TRK: "track",
  TPA: "disk",
  TCO: "genre",
  PIC: "picture",
  TCM: "composer",
  TOR: "originaldate",
  TOT: "originalalbum",
  TXT: "lyricist",
  TP3: "conductor",
  TPB: "label",
  TT1: "grouping",
  TT3: "subtitle",
  TLA: "language",
  TCR: "copyright",
  WCP: "license",
  TEN: "encodedby",
  TSS: "encodersettings",
  WAR: "website",
  PCS: "podcast",
  TCP: "compilation",
  TDR: "date",
  TS2: "albumartistsort",
  TSA: "albumsort",
  TSC: "composersort",
  TSP: "artistsort",
  TST: "titlesort",
  WFD: "podcasturl",
  TBP: "bpm"
};
class tr extends P {
  constructor() {
    super(["ID3v2.2"], er);
  }
}
const ir = {
  Title: "title",
  Artist: "artist",
  Artists: "artists",
  "Album Artist": "albumartist",
  Album: "album",
  Year: "date",
  Originalyear: "originalyear",
  Originaldate: "originaldate",
  Releasedate: "releasedate",
  Comment: "comment",
  Track: "track",
  Disc: "disk",
  DISCNUMBER: "disk",
  // ToDo: backwards compatibility', valid tag?
  Genre: "genre",
  "Cover Art (Front)": "picture",
  "Cover Art (Back)": "picture",
  Composer: "composer",
  Lyrics: "lyrics",
  ALBUMSORT: "albumsort",
  TITLESORT: "titlesort",
  WORK: "work",
  ARTISTSORT: "artistsort",
  ALBUMARTISTSORT: "albumartistsort",
  COMPOSERSORT: "composersort",
  Lyricist: "lyricist",
  Writer: "writer",
  Conductor: "conductor",
  // 'Performer=artist (instrument)': 'performer:instrument',
  MixArtist: "remixer",
  Arranger: "arranger",
  Engineer: "engineer",
  Producer: "producer",
  DJMixer: "djmixer",
  Mixer: "mixer",
  Label: "label",
  Grouping: "grouping",
  Subtitle: "subtitle",
  DiscSubtitle: "discsubtitle",
  Compilation: "compilation",
  BPM: "bpm",
  Mood: "mood",
  Media: "media",
  CatalogNumber: "catalognumber",
  MUSICBRAINZ_ALBUMSTATUS: "releasestatus",
  MUSICBRAINZ_ALBUMTYPE: "releasetype",
  RELEASECOUNTRY: "releasecountry",
  Script: "script",
  Language: "language",
  Copyright: "copyright",
  LICENSE: "license",
  EncodedBy: "encodedby",
  EncoderSettings: "encodersettings",
  Barcode: "barcode",
  ISRC: "isrc",
  ASIN: "asin",
  musicbrainz_trackid: "musicbrainz_recordingid",
  musicbrainz_releasetrackid: "musicbrainz_trackid",
  MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
  MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
  MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
  MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
  MUSICBRAINZ_WORKID: "musicbrainz_workid",
  MUSICBRAINZ_TRMID: "musicbrainz_trmid",
  MUSICBRAINZ_DISCID: "musicbrainz_discid",
  Acoustid_Id: "acoustid_id",
  ACOUSTID_FINGERPRINT: "acoustid_fingerprint",
  MUSICIP_PUID: "musicip_puid",
  Weblink: "website",
  REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
  REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
  MP3GAIN_MINMAX: "replaygain_track_minmax",
  MP3GAIN_UNDO: "replaygain_undo"
};
class rr extends P {
  constructor() {
    super(["APEv2"], ir);
  }
}
const ar = {
  "©nam": "title",
  "©ART": "artist",
  aART: "albumartist",
  /**
   * ToDo: Album artist seems to be stored here while Picard documentation says: aART
   */
  "----:com.apple.iTunes:Band": "albumartist",
  "©alb": "album",
  "©day": "date",
  "©cmt": "comment",
  "©com": "comment",
  trkn: "track",
  disk: "disk",
  "©gen": "genre",
  covr: "picture",
  "©wrt": "composer",
  "©lyr": "lyrics",
  soal: "albumsort",
  sonm: "titlesort",
  soar: "artistsort",
  soaa: "albumartistsort",
  soco: "composersort",
  "----:com.apple.iTunes:LYRICIST": "lyricist",
  "----:com.apple.iTunes:CONDUCTOR": "conductor",
  "----:com.apple.iTunes:REMIXER": "remixer",
  "----:com.apple.iTunes:ENGINEER": "engineer",
  "----:com.apple.iTunes:PRODUCER": "producer",
  "----:com.apple.iTunes:DJMIXER": "djmixer",
  "----:com.apple.iTunes:MIXER": "mixer",
  "----:com.apple.iTunes:LABEL": "label",
  "©grp": "grouping",
  "----:com.apple.iTunes:SUBTITLE": "subtitle",
  "----:com.apple.iTunes:DISCSUBTITLE": "discsubtitle",
  cpil: "compilation",
  tmpo: "bpm",
  "----:com.apple.iTunes:MOOD": "mood",
  "----:com.apple.iTunes:MEDIA": "media",
  "----:com.apple.iTunes:CATALOGNUMBER": "catalognumber",
  tvsh: "tvShow",
  tvsn: "tvSeason",
  tves: "tvEpisode",
  sosn: "tvShowSort",
  tven: "tvEpisodeId",
  tvnn: "tvNetwork",
  pcst: "podcast",
  purl: "podcasturl",
  "----:com.apple.iTunes:MusicBrainz Album Status": "releasestatus",
  "----:com.apple.iTunes:MusicBrainz Album Type": "releasetype",
  "----:com.apple.iTunes:MusicBrainz Album Release Country": "releasecountry",
  "----:com.apple.iTunes:SCRIPT": "script",
  "----:com.apple.iTunes:LANGUAGE": "language",
  cprt: "copyright",
  "©cpy": "copyright",
  "----:com.apple.iTunes:LICENSE": "license",
  "©too": "encodedby",
  pgap: "gapless",
  "----:com.apple.iTunes:BARCODE": "barcode",
  "----:com.apple.iTunes:ISRC": "isrc",
  "----:com.apple.iTunes:ASIN": "asin",
  "----:com.apple.iTunes:NOTES": "comment",
  "----:com.apple.iTunes:MusicBrainz Track Id": "musicbrainz_recordingid",
  "----:com.apple.iTunes:MusicBrainz Release Track Id": "musicbrainz_trackid",
  "----:com.apple.iTunes:MusicBrainz Album Id": "musicbrainz_albumid",
  "----:com.apple.iTunes:MusicBrainz Artist Id": "musicbrainz_artistid",
  "----:com.apple.iTunes:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
  "----:com.apple.iTunes:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
  "----:com.apple.iTunes:MusicBrainz Work Id": "musicbrainz_workid",
  "----:com.apple.iTunes:MusicBrainz TRM Id": "musicbrainz_trmid",
  "----:com.apple.iTunes:MusicBrainz Disc Id": "musicbrainz_discid",
  "----:com.apple.iTunes:Acoustid Id": "acoustid_id",
  "----:com.apple.iTunes:Acoustid Fingerprint": "acoustid_fingerprint",
  "----:com.apple.iTunes:MusicIP PUID": "musicip_puid",
  "----:com.apple.iTunes:fingerprint": "musicip_fingerprint",
  "----:com.apple.iTunes:replaygain_track_gain": "replaygain_track_gain",
  "----:com.apple.iTunes:replaygain_track_peak": "replaygain_track_peak",
  "----:com.apple.iTunes:replaygain_album_gain": "replaygain_album_gain",
  "----:com.apple.iTunes:replaygain_album_peak": "replaygain_album_peak",
  "----:com.apple.iTunes:replaygain_track_minmax": "replaygain_track_minmax",
  "----:com.apple.iTunes:replaygain_album_minmax": "replaygain_album_minmax",
  "----:com.apple.iTunes:replaygain_undo": "replaygain_undo",
  // Additional mappings:
  gnre: "genre",
  // ToDo: check mapping
  "----:com.apple.iTunes:ALBUMARTISTSORT": "albumartistsort",
  "----:com.apple.iTunes:ARTISTS": "artists",
  "----:com.apple.iTunes:ORIGINALDATE": "originaldate",
  "----:com.apple.iTunes:ORIGINALYEAR": "originalyear",
  "----:com.apple.iTunes:RELEASEDATE": "releasedate",
  // '----:com.apple.iTunes:PERFORMER': 'performer'
  desc: "description",
  ldes: "longDescription",
  "©mvn": "movement",
  "©mvi": "movementIndex",
  "©mvc": "movementTotal",
  "©wrk": "work",
  catg: "category",
  egid: "podcastId",
  hdvd: "hdVideo",
  keyw: "keywords",
  shwm: "showMovement",
  stik: "stik",
  rate: "rating"
}, nr = "iTunes";
class Fe extends P {
  constructor() {
    super([nr], ar);
  }
  postMap(e, t) {
    switch (e.id) {
      case "rate":
        e.value = {
          source: void 0,
          rating: Number.parseFloat(e.value) / 100
        };
        break;
    }
  }
}
const sr = {
  TITLE: "title",
  ARTIST: "artist",
  ARTISTS: "artists",
  ALBUMARTIST: "albumartist",
  "ALBUM ARTIST": "albumartist",
  ALBUM: "album",
  DATE: "date",
  ORIGINALDATE: "originaldate",
  ORIGINALYEAR: "originalyear",
  RELEASEDATE: "releasedate",
  COMMENT: "comment",
  TRACKNUMBER: "track",
  DISCNUMBER: "disk",
  GENRE: "genre",
  METADATA_BLOCK_PICTURE: "picture",
  COMPOSER: "composer",
  LYRICS: "lyrics",
  ALBUMSORT: "albumsort",
  TITLESORT: "titlesort",
  WORK: "work",
  ARTISTSORT: "artistsort",
  ALBUMARTISTSORT: "albumartistsort",
  COMPOSERSORT: "composersort",
  LYRICIST: "lyricist",
  WRITER: "writer",
  CONDUCTOR: "conductor",
  // 'PERFORMER=artist (instrument)': 'performer:instrument', // ToDo
  REMIXER: "remixer",
  ARRANGER: "arranger",
  ENGINEER: "engineer",
  PRODUCER: "producer",
  DJMIXER: "djmixer",
  MIXER: "mixer",
  LABEL: "label",
  GROUPING: "grouping",
  SUBTITLE: "subtitle",
  DISCSUBTITLE: "discsubtitle",
  TRACKTOTAL: "totaltracks",
  DISCTOTAL: "totaldiscs",
  COMPILATION: "compilation",
  RATING: "rating",
  BPM: "bpm",
  KEY: "key",
  MOOD: "mood",
  MEDIA: "media",
  CATALOGNUMBER: "catalognumber",
  RELEASESTATUS: "releasestatus",
  RELEASETYPE: "releasetype",
  RELEASECOUNTRY: "releasecountry",
  SCRIPT: "script",
  LANGUAGE: "language",
  COPYRIGHT: "copyright",
  LICENSE: "license",
  ENCODEDBY: "encodedby",
  ENCODERSETTINGS: "encodersettings",
  BARCODE: "barcode",
  ISRC: "isrc",
  ASIN: "asin",
  MUSICBRAINZ_TRACKID: "musicbrainz_recordingid",
  MUSICBRAINZ_RELEASETRACKID: "musicbrainz_trackid",
  MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
  MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
  MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
  MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
  MUSICBRAINZ_WORKID: "musicbrainz_workid",
  MUSICBRAINZ_TRMID: "musicbrainz_trmid",
  MUSICBRAINZ_DISCID: "musicbrainz_discid",
  ACOUSTID_ID: "acoustid_id",
  ACOUSTID_ID_FINGERPRINT: "acoustid_fingerprint",
  MUSICIP_PUID: "musicip_puid",
  // 'FINGERPRINT=MusicMagic Fingerprint {fingerprint}': 'musicip_fingerprint', // ToDo
  WEBSITE: "website",
  NOTES: "notes",
  TOTALTRACKS: "totaltracks",
  TOTALDISCS: "totaldiscs",
  // Discogs
  DISCOGS_ARTIST_ID: "discogs_artist_id",
  DISCOGS_ARTISTS: "artists",
  DISCOGS_ARTIST_NAME: "artists",
  DISCOGS_ALBUM_ARTISTS: "albumartist",
  DISCOGS_CATALOG: "catalognumber",
  DISCOGS_COUNTRY: "releasecountry",
  DISCOGS_DATE: "originaldate",
  DISCOGS_LABEL: "label",
  DISCOGS_LABEL_ID: "discogs_label_id",
  DISCOGS_MASTER_RELEASE_ID: "discogs_master_release_id",
  DISCOGS_RATING: "discogs_rating",
  DISCOGS_RELEASED: "date",
  DISCOGS_RELEASE_ID: "discogs_release_id",
  DISCOGS_VOTES: "discogs_votes",
  CATALOGID: "catalognumber",
  STYLE: "genre",
  //
  REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
  REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
  REPLAYGAIN_ALBUM_GAIN: "replaygain_album_gain",
  REPLAYGAIN_ALBUM_PEAK: "replaygain_album_peak",
  // To Sure if these (REPLAYGAIN_MINMAX, REPLAYGAIN_ALBUM_MINMAX & REPLAYGAIN_UNDO) are used for Vorbis:
  REPLAYGAIN_MINMAX: "replaygain_track_minmax",
  REPLAYGAIN_ALBUM_MINMAX: "replaygain_album_minmax",
  REPLAYGAIN_UNDO: "replaygain_undo"
};
class J extends k {
  static toRating(e, t, r) {
    return {
      source: e ? e.toLowerCase() : void 0,
      rating: Number.parseFloat(t) / r * k.maxRatingScore
    };
  }
  constructor() {
    super(["vorbis"], sr);
  }
  postMap(e) {
    if (e.id === "RATING")
      e.value = J.toRating(void 0, e.value, 100);
    else if (e.id.indexOf("RATING:") === 0) {
      const t = e.id.split(":");
      e.value = J.toRating(t[1], e.value, 1), e.id = t[0];
    }
  }
}
const or = {
  IART: "artist",
  // Artist
  ICRD: "date",
  // DateCreated
  INAM: "title",
  // Title
  TITL: "title",
  IPRD: "album",
  // Product
  ITRK: "track",
  IPRT: "track",
  // Additional tag for track index
  COMM: "comment",
  // Comments
  ICMT: "comment",
  // Country
  ICNT: "releasecountry",
  GNRE: "genre",
  // Genre
  IWRI: "writer",
  // WrittenBy
  RATE: "rating",
  YEAR: "year",
  ISFT: "encodedby",
  // Software
  CODE: "encodedby",
  // EncodedBy
  TURL: "website",
  // URL,
  IGNR: "genre",
  // Genre
  IENG: "engineer",
  // Engineer
  ITCH: "technician",
  // Technician
  IMED: "media",
  // Original Media
  IRPD: "album"
  // Product, where the file was intended for
};
class cr extends k {
  constructor() {
    super(["exif"], or);
  }
}
const lr = {
  "segment:title": "title",
  "album:ARTIST": "albumartist",
  "album:ARTISTSORT": "albumartistsort",
  "album:TITLE": "album",
  "album:DATE_RECORDED": "originaldate",
  "album:DATE_RELEASED": "releasedate",
  "album:PART_NUMBER": "disk",
  "album:TOTAL_PARTS": "totaltracks",
  "track:ARTIST": "artist",
  "track:ARTISTSORT": "artistsort",
  "track:TITLE": "title",
  "track:PART_NUMBER": "track",
  "track:MUSICBRAINZ_TRACKID": "musicbrainz_recordingid",
  "track:MUSICBRAINZ_ALBUMID": "musicbrainz_albumid",
  "track:MUSICBRAINZ_ARTISTID": "musicbrainz_artistid",
  "track:PUBLISHER": "label",
  "track:GENRE": "genre",
  "track:ENCODER": "encodedby",
  "track:ENCODER_OPTIONS": "encodersettings",
  "edition:TOTAL_PARTS": "totaldiscs",
  picture: "picture"
};
class ur extends P {
  constructor() {
    super(["matroska"], lr);
  }
}
const mr = {
  NAME: "title",
  AUTH: "artist",
  "(c) ": "copyright",
  ANNO: "comment"
};
class pr extends k {
  constructor() {
    super(["AIFF"], mr);
  }
}
class fr {
  constructor() {
    this.tagMappers = {}, [
      new Ki(),
      new tr(),
      new ge(),
      new Fe(),
      new Fe(),
      new J(),
      new rr(),
      new we(),
      new cr(),
      new ur(),
      new pr()
    ].forEach((e) => {
      this.registerTagMapper(e);
    });
  }
  /**
   * Convert native to generic (common) tags
   * @param tagType Originating tag format
   * @param tag     Native tag to map to a generic tag id
   * @param warnings
   * @return Generic tag result (output of this function)
   */
  mapTag(e, t, r) {
    if (this.tagMappers[e])
      return this.tagMappers[e].mapGenericTag(t, r);
    throw new nt(`No generic tag mapper defined for tag-format: ${e}`);
  }
  registerTagMapper(e) {
    for (const t of e.tagTypes)
      this.tagMappers[t] = e;
  }
}
function dr(i) {
  const e = i.split(`
`), t = [], r = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
  for (const a of e) {
    const n = a.match(r);
    if (n) {
      const s = Number.parseInt(n[1], 10), u = Number.parseInt(n[2], 10), c = Number.parseInt(n[3], 10), p = (s * 60 + u) * 1e3 + c * 10, m = a.replace(r, "").trim();
      t.push({ timestamp: p, text: m });
    }
  }
  return {
    contentType: V.lyrics,
    timeStampFormat: Z.milliseconds,
    syncText: t
  };
}
const E = z("music-metadata:collector"), hr = ["matroska", "APEv2", "vorbis", "ID3v2.4", "ID3v2.3", "ID3v2.2", "exif", "asf", "iTunes", "AIFF", "ID3v1"];
class xr {
  constructor(e) {
    this.opts = e, this.format = {
      tagTypes: [],
      trackInfo: []
    }, this.native = {}, this.common = {
      track: { no: null, of: null },
      disk: { no: null, of: null },
      movementIndex: { no: null, of: null }
    }, this.quality = {
      warnings: []
    }, this.commonOrigin = {}, this.originPriority = {}, this.tagMapper = new fr();
    let t = 1;
    for (const r of hr)
      this.originPriority[r] = t++;
    this.originPriority.artificial = 500, this.originPriority.id3v1 = 600;
  }
  /**
   * @returns {boolean} true if one or more tags have been found
   */
  hasAny() {
    return Object.keys(this.native).length > 0;
  }
  addStreamInfo(e) {
    E(`streamInfo: type=${e.type ? me[e.type] : "?"}, codec=${e.codecName}`), this.format.trackInfo.push(e);
  }
  setFormat(e, t) {
    var r;
    E(`format: ${e} = ${t}`), this.format[e] = t, (r = this.opts) != null && r.observer && this.opts.observer({ metadata: this, tag: { type: "format", id: e, value: t } });
  }
  async addTag(e, t, r) {
    E(`tag ${e}.${t} = ${r}`), this.native[e] || (this.format.tagTypes.push(e), this.native[e] = []), this.native[e].push({ id: t, value: r }), await this.toCommon(e, t, r);
  }
  addWarning(e) {
    this.quality.warnings.push({ message: e });
  }
  async postMap(e, t) {
    switch (t.id) {
      case "artist":
        if (this.commonOrigin.artist === this.originPriority[e])
          return this.postMap("artificial", { id: "artists", value: t.value });
        this.common.artists || this.setGenericTag("artificial", { id: "artists", value: t.value });
        break;
      case "artists":
        if ((!this.common.artist || this.commonOrigin.artist === this.originPriority.artificial) && (!this.common.artists || this.common.artists.indexOf(t.value) === -1)) {
          const r = (this.common.artists || []).concat([t.value]), n = { id: "artist", value: gr(r) };
          this.setGenericTag("artificial", n);
        }
        break;
      case "picture":
        return this.postFixPicture(t.value).then((r) => {
          r !== null && (t.value = r, this.setGenericTag(e, t));
        });
      case "totaltracks":
        this.common.track.of = k.toIntOrNull(t.value);
        return;
      case "totaldiscs":
        this.common.disk.of = k.toIntOrNull(t.value);
        return;
      case "movementTotal":
        this.common.movementIndex.of = k.toIntOrNull(t.value);
        return;
      case "track":
      case "disk":
      case "movementIndex": {
        const r = this.common[t.id].of;
        this.common[t.id] = k.normalizeTrack(t.value), this.common[t.id].of = r ?? this.common[t.id].of;
        return;
      }
      case "bpm":
      case "year":
      case "originalyear":
        t.value = Number.parseInt(t.value, 10);
        break;
      case "date": {
        const r = Number.parseInt(t.value.substr(0, 4), 10);
        Number.isNaN(r) || (this.common.year = r);
        break;
      }
      case "discogs_label_id":
      case "discogs_release_id":
      case "discogs_master_release_id":
      case "discogs_artist_id":
      case "discogs_votes":
        t.value = typeof t.value == "string" ? Number.parseInt(t.value, 10) : t.value;
        break;
      case "replaygain_track_gain":
      case "replaygain_track_peak":
      case "replaygain_album_gain":
      case "replaygain_album_peak":
        t.value = $i(t.value);
        break;
      case "replaygain_track_minmax":
        t.value = t.value.split(",").map((r) => Number.parseInt(r, 10));
        break;
      case "replaygain_undo": {
        const r = t.value.split(",").map((a) => Number.parseInt(a, 10));
        t.value = {
          leftChannel: r[0],
          rightChannel: r[1]
        };
        break;
      }
      case "gapless":
      case "compilation":
      case "podcast":
      case "showMovement":
        t.value = t.value === "1" || t.value === 1;
        break;
      case "isrc": {
        const r = this.common[t.id];
        if (r && r.indexOf(t.value) !== -1)
          return;
        break;
      }
      case "comment":
        typeof t.value == "string" && (t.value = { text: t.value }), t.value.descriptor === "iTunPGAP" && this.setGenericTag(e, { id: "gapless", value: t.value.text === "1" });
        break;
      case "lyrics":
        typeof t.value == "string" && (t.value = dr(t.value));
        break;
    }
    t.value !== null && this.setGenericTag(e, t);
  }
  /**
   * Convert native tags to common tags
   * @returns {IAudioMetadata} Native + common tags
   */
  toCommonMetadata() {
    return {
      format: this.format,
      native: this.native,
      quality: this.quality,
      common: this.common
    };
  }
  /**
   * Fix some common issues with picture object
   * @param picture Picture
   */
  async postFixPicture(e) {
    if (e.data && e.data.length > 0) {
      if (!e.format) {
        const t = await it(Uint8Array.from(e.data));
        if (t)
          e.format = t.mime;
        else
          return null;
      }
      switch (e.format = e.format.toLocaleLowerCase(), e.format) {
        case "image/jpg":
          e.format = "image/jpeg";
      }
      return e;
    }
    return this.addWarning("Empty picture tag found"), null;
  }
  /**
   * Convert native tag to common tags
   */
  async toCommon(e, t, r) {
    const a = { id: t, value: r }, n = this.tagMapper.mapTag(e, a, this);
    n && await this.postMap(e, n);
  }
  /**
   * Set generic tag
   */
  setGenericTag(e, t) {
    var n;
    E(`common.${t.id} = ${t.value}`);
    const r = this.commonOrigin[t.id] || 1e3, a = this.originPriority[e];
    if (Yi(t.id))
      if (a <= r)
        this.common[t.id] = t.value, this.commonOrigin[t.id] = a;
      else
        return E(`Ignore native tag (singleton): ${e}.${t.id} = ${t.value}`);
    else if (a === r)
      !Vi(t.id) || this.common[t.id].indexOf(t.value) === -1 ? this.common[t.id].push(t.value) : E(`Ignore duplicate value: ${e}.${t.id} = ${t.value}`);
    else if (a < r)
      this.common[t.id] = [t.value], this.commonOrigin[t.id] = a;
    else
      return E(`Ignore native tag (list): ${e}.${t.id} = ${t.value}`);
    (n = this.opts) != null && n.observer && this.opts.observer({ metadata: this, tag: { type: "common", id: t.id, value: t.value } });
  }
}
function gr(i) {
  return i.length > 2 ? `${i.slice(0, i.length - 1).join(", ")} & ${i[i.length - 1]}` : i.join(" & ");
}
const wr = {
  parserType: "mpeg",
  extensions: [".mp2", ".mp3", ".m2a", ".aac", "aacp"],
  async load(i, e, t) {
    return new (await import("./MpegParser-vs7LxqkY.js")).MpegParser(i, e, t);
  }
}, br = {
  parserType: "apev2",
  extensions: [".ape"],
  async load(i, e, t) {
    return new (await Promise.resolve().then(() => Or)).APEv2Parser(i, e, t);
  }
}, Tr = {
  parserType: "asf",
  extensions: [".asf"],
  async load(i, e, t) {
    return new (await import("./AsfParser-2_AdJ9tt.js")).AsfParser(i, e, t);
  }
}, yr = {
  parserType: "dsdiff",
  extensions: [".dff"],
  async load(i, e, t) {
    return new (await import("./DsdiffParser-CRsXAGDM.js")).DsdiffParser(i, e, t);
  }
}, kr = {
  parserType: "aiff",
  extensions: [".aif", "aiff", "aifc"],
  async load(i, e, t) {
    return new (await import("./AiffParser-BHTPHWed.js")).AIFFParser(i, e, t);
  }
}, Ir = {
  parserType: "dsf",
  extensions: [".dsf"],
  async load(i, e, t) {
    return new (await import("./DsfParser-Bc7ij-GO.js")).DsfParser(i, e, t);
  }
}, vr = {
  parserType: "flac",
  extensions: [".flac"],
  async load(i, e, t) {
    return new (await import("./FlacParser-BUAY5Sry.js")).FlacParser(i, e, t);
  }
}, Sr = {
  parserType: "matroska",
  extensions: [".mka", ".mkv", ".mk3d", ".mks", "webm"],
  async load(i, e, t) {
    return new (await import("./MatroskaParser-DB74JraU.js")).MatroskaParser(i, e, t);
  }
}, Cr = {
  parserType: "mp4",
  extensions: [".mp4", ".m4a", ".m4b", ".m4pa", "m4v", "m4r", "3gp"],
  async load(i, e, t) {
    return new (await import("./MP4Parser-BYJOBuaW.js")).MP4Parser(i, e, t);
  }
}, Ar = {
  parserType: "musepack",
  extensions: [".mpc"],
  async load(i, e, t) {
    return new (await import("./MusepackParser-Dr2f28fZ.js")).MusepackParser(i, e, t);
  }
}, Er = {
  parserType: "ogg",
  extensions: [".ogg", ".ogv", ".oga", ".ogm", ".ogx", ".opus", ".spx"],
  async load(i, e, t) {
    return new (await import("./OggParser-7V9N_-g4.js")).OggParser(i, e, t);
  }
}, Rr = {
  parserType: "wavpack",
  extensions: [".wv", ".wvp"],
  async load(i, e, t) {
    return new (await import("./WavPackParser-C9MygYn3.js")).WavPackParser(i, e, t);
  }
}, _r = {
  parserType: "riff",
  extensions: [".wav", "wave", ".bwf"],
  async load(i, e, t) {
    return new (await import("./WaveParser-BJ_4n3Wh.js")).WaveParser(i, e, t);
  }
}, _ = z("music-metadata:parser:factory");
function Br(i) {
  const e = he.parse(i), t = Mi(e.type);
  return {
    type: t.type,
    subtype: t.subtype,
    suffix: t.suffix,
    parameters: e.parameters
  };
}
class ot {
  constructor() {
    this.parsers = [], [
      vr,
      wr,
      br,
      Cr,
      Sr,
      _r,
      Er,
      Tr,
      kr,
      Rr,
      Ar,
      Ir,
      yr
    ].forEach((e) => this.registerParser(e));
  }
  registerParser(e) {
    this.parsers.push(e);
  }
  async parse(e, t, r) {
    if (e.supportsRandomAccess() ? (_("tokenizer supports random-access, scanning for appending headers"), await ft(e, r)) : _("tokenizer does not support random-access, cannot scan for appending headers"), !t) {
      const s = new Uint8Array(4100);
      if (e.fileInfo.mimeType && (t = this.findLoaderForType(De(e.fileInfo.mimeType))), !t && e.fileInfo.path && (t = this.findLoaderForExtension(e.fileInfo.path)), !t) {
        _("Guess parser on content..."), await e.peekBuffer(s, { mayBeLess: !0 });
        const u = await it(s);
        if (!u || !u.mime)
          throw new Oi("Failed to determine audio format");
        if (_(`Guessed file type is mime=${u.mime}, extension=${u.ext}`), t = this.findLoaderForType(De(u.mime)), !t)
          throw new zi(`Guessed MIME-type not supported: ${u.mime}`);
      }
    }
    _(`Loading ${t.parserType} parser...`);
    const a = new xr(r), n = await t.load(a, e, r ?? {});
    return _(`Parser ${t.parserType} loaded`), await n.parse(), a.toCommonMetadata();
  }
  /**
   * @param filePath - Path, filename or extension to audio file
   * @return Parser submodule name
   */
  findLoaderForExtension(e) {
    if (!e)
      return;
    const t = Mr(e).toLocaleLowerCase() || e;
    return this.parsers.find((r) => r.extensions.indexOf(t) !== -1);
  }
  findLoaderForType(e) {
    return e ? this.parsers.find((t) => t.parserType === e) : void 0;
  }
}
function Mr(i) {
  const e = i.lastIndexOf(".");
  return e === -1 ? "" : i.slice(e);
}
function De(i) {
  let e;
  if (!i)
    return;
  try {
    e = Br(i);
  } catch {
    _(`Invalid HTTP Content-Type header value: ${i}`);
    return;
  }
  const t = e.subtype.indexOf("x-") === 0 ? e.subtype.substring(2) : e.subtype;
  switch (e.type) {
    case "audio":
      switch (t) {
        case "mp3":
        case "mpeg":
          return "mpeg";
        case "aac":
        case "aacp":
          return "mpeg";
        case "flac":
          return "flac";
        case "ape":
        case "monkeys-audio":
          return "apev2";
        case "mp4":
        case "m4a":
          return "mp4";
        case "ogg":
        case "opus":
        case "speex":
          return "ogg";
        case "ms-wma":
        case "ms-wmv":
        case "ms-asf":
          return "asf";
        case "aiff":
        case "aif":
        case "aifc":
          return "aiff";
        case "vnd.wave":
        case "wav":
        case "wave":
          return "riff";
        case "wavpack":
          return "wavpack";
        case "musepack":
          return "musepack";
        case "matroska":
        case "webm":
          return "matroska";
        case "dsf":
          return "dsf";
        case "amr":
          return "amr";
      }
      break;
    case "video":
      switch (t) {
        case "ms-asf":
        case "ms-wmv":
          return "asf";
        case "m4v":
        case "mp4":
          return "mp4";
        case "ogg":
          return "ogg";
        case "matroska":
        case "webm":
          return "matroska";
      }
      break;
    case "application":
      switch (t) {
        case "vnd.ms-asf":
          return "asf";
        case "ogg":
          return "ogg";
      }
      break;
  }
}
class ct {
  /**
   * Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
   * @param {INativeMetadataCollector} metadata Output
   * @param {ITokenizer} tokenizer Input
   * @param {IOptions} options Parsing options
   */
  constructor(e, t, r) {
    this.metadata = e, this.tokenizer = t, this.options = r;
  }
}
const Fr = /^[\x21-\x7e©][\x20-\x7e\x00()]{3}/, lt = {
  len: 4,
  get: (i, e) => {
    const t = Qe(i.slice(e, e + lt.len), "latin1");
    if (!t.match(Fr))
      throw new xe(`FourCC contains invalid characters: ${Xi(t)} "${t}"`);
    return t;
  },
  put: (i, e, t) => {
    const r = di(t);
    if (r.length !== 4)
      throw new nt("Invalid length");
    return i.set(r, e), e + 4;
  }
};
var F;
(function(i) {
  i[i.text_utf8 = 0] = "text_utf8", i[i.binary = 1] = "binary", i[i.external_info = 2] = "external_info", i[i.reserved = 3] = "reserved";
})(F || (F = {}));
const Oe = {
  len: 52,
  get: (i, e) => ({
    // should equal 'MAC '
    ID: lt.get(i, e),
    // versionIndex number * 1000 (3.81 = 3810) (remember that 4-byte alignment causes this to take 4-bytes)
    version: w.get(i, e + 4) / 1e3,
    // the number of descriptor bytes (allows later expansion of this header)
    descriptorBytes: w.get(i, e + 8),
    // the number of header APE_HEADER bytes
    headerBytes: w.get(i, e + 12),
    // the number of header APE_HEADER bytes
    seekTableBytes: w.get(i, e + 16),
    // the number of header data bytes (from original file)
    headerDataBytes: w.get(i, e + 20),
    // the number of bytes of APE frame data
    apeFrameDataBytes: w.get(i, e + 24),
    // the high order number of APE frame data bytes
    apeFrameDataBytesHigh: w.get(i, e + 28),
    // the terminating data of the file (not including tag data)
    terminatingDataBytes: w.get(i, e + 32),
    // the MD5 hash of the file (see notes for usage... it's a little tricky)
    fileMD5: new Ze(16).get(i, e + 36)
  })
}, Dr = {
  len: 24,
  get: (i, e) => ({
    // the compression level (see defines I.E. COMPRESSION_LEVEL_FAST)
    compressionLevel: S.get(i, e),
    // any format flags (for future use)
    formatFlags: S.get(i, e + 2),
    // the number of audio blocks in one frame
    blocksPerFrame: w.get(i, e + 4),
    // the number of audio blocks in the final frame
    finalFrameBlocks: w.get(i, e + 8),
    // the total number of frames
    totalFrames: w.get(i, e + 12),
    // the bits per sample (typically 16)
    bitsPerSample: S.get(i, e + 16),
    // the number of channels (1 or 2)
    channel: S.get(i, e + 18),
    // the sample rate (typically 44100)
    sampleRate: w.get(i, e + 20)
  })
}, I = {
  len: 32,
  get: (i, e) => ({
    // should equal 'APETAGEX'
    ID: new y(8, "ascii").get(i, e),
    // equals CURRENT_APE_TAG_VERSION
    version: w.get(i, e + 8),
    // the complete size of the tag, including this footer (excludes header)
    size: w.get(i, e + 12),
    // the number of fields in the tag
    fields: w.get(i, e + 16),
    // reserved for later use (must be zero),
    flags: ut(w.get(i, e + 20))
  })
}, oe = {
  len: 8,
  get: (i, e) => ({
    // Length of assigned value in bytes
    size: w.get(i, e),
    // reserved for later use (must be zero),
    flags: ut(w.get(i, e + 4))
  })
};
function ut(i) {
  return {
    containsHeader: $(i, 31),
    containsFooter: $(i, 30),
    isHeader: $(i, 29),
    readOnly: $(i, 0),
    dataType: (i & 6) >> 1
  };
}
function $(i, e) {
  return (i & 1 << e) !== 0;
}
const R = z("music-metadata:parser:APEv2"), ze = "APEv2", Le = "APETAGEX";
class H extends Pi("APEv2") {
}
class C extends ct {
  constructor() {
    super(...arguments), this.ape = {};
  }
  static tryParseApeHeader(e, t, r) {
    return new C(e, t, r).tryParseApeHeader();
  }
  /**
   * Calculate the media file duration
   * @param ah ApeHeader
   * @return {number} duration in seconds
   */
  static calculateDuration(e) {
    let t = e.totalFrames > 1 ? e.blocksPerFrame * (e.totalFrames - 1) : 0;
    return t += e.finalFrameBlocks, t / e.sampleRate;
  }
  /**
   * Calculates the APEv1 / APEv2 first field offset
   * @param tokenizer
   * @param offset
   */
  static async findApeFooterOffset(e, t) {
    const r = new Uint8Array(I.len), a = e.position;
    await e.readBuffer(r, { position: t - I.len }), e.setPosition(a);
    const n = I.get(r, 0);
    if (n.ID === "APETAGEX")
      return n.flags.isHeader ? R(`APE Header found at offset=${t - I.len}`) : (R(`APE Footer found at offset=${t - I.len}`), t -= n.size), { footer: n, offset: t };
  }
  static parseTagFooter(e, t, r) {
    const a = I.get(t, t.length - I.len);
    if (a.ID !== Le)
      throw new H("Unexpected APEv2 Footer ID preamble value");
    return ce(t), new C(e, ce(t), r).parseTags(a);
  }
  /**
   * Parse APEv1 / APEv2 header if header signature found
   */
  async tryParseApeHeader() {
    if (this.tokenizer.fileInfo.size && this.tokenizer.fileInfo.size - this.tokenizer.position < I.len) {
      R("No APEv2 header found, end-of-file reached");
      return;
    }
    const e = await this.tokenizer.peekToken(I);
    if (e.ID === Le)
      return await this.tokenizer.ignore(I.len), this.parseTags(e);
    if (R(`APEv2 header not found at offset=${this.tokenizer.position}`), this.tokenizer.fileInfo.size) {
      const t = this.tokenizer.fileInfo.size - this.tokenizer.position, r = new Uint8Array(t);
      return await this.tokenizer.readBuffer(r), C.parseTagFooter(this.metadata, r, this.options);
    }
  }
  async parse() {
    const e = await this.tokenizer.readToken(Oe);
    if (e.ID !== "MAC ")
      throw new H("Unexpected descriptor ID");
    this.ape.descriptor = e;
    const t = e.descriptorBytes - Oe.len, r = await (t > 0 ? this.parseDescriptorExpansion(t) : this.parseHeader());
    return await this.tokenizer.ignore(r.forwardBytes), this.tryParseApeHeader();
  }
  async parseTags(e) {
    const t = new Uint8Array(256);
    let r = e.size - I.len;
    R(`Parse APE tags at offset=${this.tokenizer.position}, size=${r}`);
    for (let a = 0; a < e.fields; a++) {
      if (r < oe.len) {
        this.metadata.addWarning(`APEv2 Tag-header: ${e.fields - a} items remaining, but no more tag data to read.`);
        break;
      }
      const n = await this.tokenizer.readToken(oe);
      r -= oe.len + n.size, await this.tokenizer.peekBuffer(t, { length: Math.min(t.length, r) });
      let s = Be(t, 0, t.length);
      const u = await this.tokenizer.readToken(new y(s, "ascii"));
      switch (await this.tokenizer.ignore(1), r -= u.length + 1, n.flags.dataType) {
        case F.text_utf8: {
          const p = (await this.tokenizer.readToken(new y(n.size, "utf8"))).split(/\x00/g);
          await Promise.all(p.map((m) => this.metadata.addTag(ze, u, m)));
          break;
        }
        case F.binary:
          if (this.options.skipCovers)
            await this.tokenizer.ignore(n.size);
          else {
            const c = new Uint8Array(n.size);
            await this.tokenizer.readBuffer(c), s = Be(c, 0, c.length);
            const p = Qe(c.slice(0, s)), m = c.slice(s + 1);
            await this.metadata.addTag(ze, u, {
              description: p,
              data: m
            });
          }
          break;
        case F.external_info:
          R(`Ignore external info ${u}`), await this.tokenizer.ignore(n.size);
          break;
        case F.reserved:
          R(`Ignore external info ${u}`), this.metadata.addWarning(`APEv2 header declares a reserved datatype for "${u}"`), await this.tokenizer.ignore(n.size);
          break;
      }
    }
  }
  async parseDescriptorExpansion(e) {
    return await this.tokenizer.ignore(e), this.parseHeader();
  }
  async parseHeader() {
    const e = await this.tokenizer.readToken(Dr);
    if (this.metadata.setFormat("lossless", !0), this.metadata.setFormat("container", "Monkey's Audio"), this.metadata.setFormat("bitsPerSample", e.bitsPerSample), this.metadata.setFormat("sampleRate", e.sampleRate), this.metadata.setFormat("numberOfChannels", e.channel), this.metadata.setFormat("duration", C.calculateDuration(e)), !this.ape.descriptor)
      throw new H("Missing APE descriptor");
    return {
      forwardBytes: this.ape.descriptor.seekTableBytes + this.ape.descriptor.headerDataBytes + this.ape.descriptor.apeFrameDataBytes + this.ape.descriptor.terminatingDataBytes
    };
  }
}
const Or = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  APEv2Parser: C,
  ApeContentError: H
}, Symbol.toStringTag, { value: "Module" })), W = z("music-metadata:parser:ID3v1"), Pe = [
  "Blues",
  "Classic Rock",
  "Country",
  "Dance",
  "Disco",
  "Funk",
  "Grunge",
  "Hip-Hop",
  "Jazz",
  "Metal",
  "New Age",
  "Oldies",
  "Other",
  "Pop",
  "R&B",
  "Rap",
  "Reggae",
  "Rock",
  "Techno",
  "Industrial",
  "Alternative",
  "Ska",
  "Death Metal",
  "Pranks",
  "Soundtrack",
  "Euro-Techno",
  "Ambient",
  "Trip-Hop",
  "Vocal",
  "Jazz+Funk",
  "Fusion",
  "Trance",
  "Classical",
  "Instrumental",
  "Acid",
  "House",
  "Game",
  "Sound Clip",
  "Gospel",
  "Noise",
  "Alt. Rock",
  "Bass",
  "Soul",
  "Punk",
  "Space",
  "Meditative",
  "Instrumental Pop",
  "Instrumental Rock",
  "Ethnic",
  "Gothic",
  "Darkwave",
  "Techno-Industrial",
  "Electronic",
  "Pop-Folk",
  "Eurodance",
  "Dream",
  "Southern Rock",
  "Comedy",
  "Cult",
  "Gangsta Rap",
  "Top 40",
  "Christian Rap",
  "Pop/Funk",
  "Jungle",
  "Native American",
  "Cabaret",
  "New Wave",
  "Psychedelic",
  "Rave",
  "Showtunes",
  "Trailer",
  "Lo-Fi",
  "Tribal",
  "Acid Punk",
  "Acid Jazz",
  "Polka",
  "Retro",
  "Musical",
  "Rock & Roll",
  "Hard Rock",
  "Folk",
  "Folk/Rock",
  "National Folk",
  "Swing",
  "Fast-Fusion",
  "Bebob",
  "Latin",
  "Revival",
  "Celtic",
  "Bluegrass",
  "Avantgarde",
  "Gothic Rock",
  "Progressive Rock",
  "Psychedelic Rock",
  "Symphonic Rock",
  "Slow Rock",
  "Big Band",
  "Chorus",
  "Easy Listening",
  "Acoustic",
  "Humour",
  "Speech",
  "Chanson",
  "Opera",
  "Chamber Music",
  "Sonata",
  "Symphony",
  "Booty Bass",
  "Primus",
  "Porn Groove",
  "Satire",
  "Slow Jam",
  "Club",
  "Tango",
  "Samba",
  "Folklore",
  "Ballad",
  "Power Ballad",
  "Rhythmic Soul",
  "Freestyle",
  "Duet",
  "Punk Rock",
  "Drum Solo",
  "A Cappella",
  "Euro-House",
  "Dance Hall",
  "Goa",
  "Drum & Bass",
  "Club-House",
  "Hardcore",
  "Terror",
  "Indie",
  "BritPop",
  "Negerpunk",
  "Polsk Punk",
  "Beat",
  "Christian Gangsta Rap",
  "Heavy Metal",
  "Black Metal",
  "Crossover",
  "Contemporary Christian",
  "Christian Rock",
  "Merengue",
  "Salsa",
  "Thrash Metal",
  "Anime",
  "JPop",
  "Synthpop",
  "Abstract",
  "Art Rock",
  "Baroque",
  "Bhangra",
  "Big Beat",
  "Breakbeat",
  "Chillout",
  "Downtempo",
  "Dub",
  "EBM",
  "Eclectic",
  "Electro",
  "Electroclash",
  "Emo",
  "Experimental",
  "Garage",
  "Global",
  "IDM",
  "Illbient",
  "Industro-Goth",
  "Jam Band",
  "Krautrock",
  "Leftfield",
  "Lounge",
  "Math Rock",
  "New Romantic",
  "Nu-Breakz",
  "Post-Punk",
  "Post-Rock",
  "Psytrance",
  "Shoegaze",
  "Space Rock",
  "Trop Rock",
  "World Music",
  "Neoclassical",
  "Audiobook",
  "Audio Theatre",
  "Neue Deutsche Welle",
  "Podcast",
  "Indie Rock",
  "G-Funk",
  "Dubstep",
  "Garage Rock",
  "Psybient"
], q = {
  len: 128,
  /**
   * @param buf Buffer possibly holding the 128 bytes ID3v1.1 metadata header
   * @param off Offset in buffer in bytes
   * @returns ID3v1.1 header if first 3 bytes equals 'TAG', otherwise null is returned
   */
  get: (i, e) => {
    const t = new M(3).get(i, e);
    return t === "TAG" ? {
      header: t,
      title: new M(30).get(i, e + 3),
      artist: new M(30).get(i, e + 33),
      album: new M(30).get(i, e + 63),
      year: new M(4).get(i, e + 93),
      comment: new M(28).get(i, e + 97),
      // ID3v1.1 separator for track
      zeroByte: B.get(i, e + 127),
      // track: ID3v1.1 field added by Michael Mutschler
      track: B.get(i, e + 126),
      genre: B.get(i, e + 127)
    } : null;
  }
};
class M {
  constructor(e) {
    this.len = e, this.stringType = new y(e, "latin1");
  }
  get(e, t) {
    let r = this.stringType.get(e, t);
    return r = Ni(r), r = r.trim(), r.length > 0 ? r : void 0;
  }
}
class mt extends ct {
  constructor(e, t, r) {
    super(e, t, r), this.apeHeader = r.apeHeader;
  }
  static getGenre(e) {
    if (e < Pe.length)
      return Pe[e];
  }
  async parse() {
    if (!this.tokenizer.fileInfo.size) {
      W("Skip checking for ID3v1 because the file-size is unknown");
      return;
    }
    this.apeHeader && (this.tokenizer.ignore(this.apeHeader.offset - this.tokenizer.position), await new C(this.metadata, this.tokenizer, this.options).parseTags(this.apeHeader.footer));
    const e = this.tokenizer.fileInfo.size - q.len;
    if (this.tokenizer.position > e) {
      W("Already consumed the last 128 bytes");
      return;
    }
    const t = await this.tokenizer.readToken(q, e);
    if (t) {
      W("ID3v1 header found at: pos=%s", this.tokenizer.fileInfo.size - q.len);
      const r = ["title", "artist", "album", "comment", "track", "year"];
      for (const n of r)
        t[n] && t[n] !== "" && await this.addTag(n, t[n]);
      const a = mt.getGenre(t.genre);
      a && await this.addTag("genre", a);
    } else
      W("ID3v1 header not found at: pos=%s", this.tokenizer.fileInfo.size - q.len);
  }
  async addTag(e, t) {
    await this.metadata.addTag("ID3v1", e, t);
  }
}
async function zr(i) {
  if (i.fileInfo.size >= 128) {
    const e = new Uint8Array(3), t = i.position;
    return await i.readBuffer(e, { position: i.fileInfo.size - 128 }), i.setPosition(t), new TextDecoder("latin1").decode(e) === "TAG";
  }
  return !1;
}
const Lr = "LYRICS200";
async function Pr(i) {
  const e = i.fileInfo.size;
  if (e >= 143) {
    const t = new Uint8Array(15), r = i.position;
    await i.readBuffer(t, { position: e - 143 }), i.setPosition(r);
    const a = new TextDecoder("latin1").decode(t);
    if (a.slice(6) === Lr)
      return Number.parseInt(a.slice(0, 6), 10) + 15;
  }
  return 0;
}
async function Nr(i, e = {}) {
  const t = { mimeType: i.type, size: i.size };
  return i instanceof File && (t.path = i.name), pt(i.stream(), t, e);
}
async function pt(i, e, t = {}) {
  const r = At(i, { fileInfo: typeof e == "string" ? { mimeType: e } : e });
  try {
    return await te(r, t);
  } finally {
    await r.close();
  }
}
async function Ur(i, e, t = {}) {
  const r = ce(i, { fileInfo: typeof e == "string" ? { mimeType: e } : e });
  return te(r, t);
}
function te(i, e) {
  return new ot().parse(i, void 0, e);
}
function Xr(i) {
  const e = {};
  for (const { id: t, value: r } of i)
    e[t] || (e[t] = []), e[t].push(r);
  return e;
}
function Gr(i) {
  return i === void 0 ? 0 : 1 + Math.round(i * 4);
}
function jr(i) {
  return i ? i.reduce((e, t) => t.name && t.name.toLowerCase() in ["front", "cover", "cover (front)"] ? t : e) : null;
}
async function ft(i, e = {}) {
  let t = i.fileInfo.size;
  if (await zr(i)) {
    t -= 128;
    const r = await Pr(i);
    t -= r;
  }
  e.apeHeader = await C.findApeFooterOffset(i, t);
}
const Ne = z("music-metadata:parser");
async function $r(i, e, t = {}) {
  const r = await Et(i, { fileInfo: typeof e == "string" ? { mimeType: e } : e });
  return te(r, t);
}
async function Wr(i, e = {}) {
  Ne(`parseFile: ${i}`);
  const t = await Rt(i), r = new ot();
  try {
    const a = r.findLoaderForExtension(i);
    return a || Ne(" Parser could not be determined by file extension"), await r.parse(t, a, e);
  } finally {
    await t.close();
  }
}
const la = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get LyricsContentType() {
    return V;
  },
  get TimestampFormat() {
    return Z;
  },
  orderTags: Xr,
  parseBlob: Nr,
  parseBuffer: Ur,
  parseFile: Wr,
  parseFromTokenizer: te,
  parseStream: $r,
  parseWebStream: pt,
  ratingToStars: Gr,
  scanAppendingHeaders: ft,
  selectCover: jr
}, Symbol.toStringTag, { value: "Module" }));
export {
  Me as A,
  ct as B,
  Wt as C,
  Qe as D,
  x as E,
  lt as F,
  ea as G,
  Pe as H,
  Gt as I,
  C as J,
  sa as K,
  mt as L,
  Ni as M,
  qe as N,
  qi as O,
  Be as P,
  Hi as Q,
  ca as R,
  y as S,
  me as T,
  Y as U,
  oa as V,
  Wi as W,
  la as X,
  B as a,
  O as b,
  z as c,
  Ze as d,
  pe as e,
  w as f,
  st as g,
  ia as h,
  na as i,
  Ve as j,
  S as k,
  D as l,
  Pi as m,
  Vt as n,
  ce as o,
  Ht as p,
  qt as q,
  He as r,
  aa as s,
  ei as t,
  ta as u,
  Jt as v,
  Yt as w,
  _e as x,
  Ye as y,
  ue as z
};
