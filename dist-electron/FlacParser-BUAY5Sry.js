import { c as E, F as p, d as g, l as C, g as n, r as o, b as l, m as I } from "./index-D8luuwzV.js";
import { V as A, a as S, b as P } from "./VorbisParser-BFhU6xqP.js";
import { A as u } from "./AbstractID3Parser-CsfzmK6r.js";
const F = E("music-metadata:parser:FLAC");
class d extends I("FLAC") {
}
var s;
(function(e) {
  e[e.STREAMINFO = 0] = "STREAMINFO", e[e.PADDING = 1] = "PADDING", e[e.APPLICATION = 2] = "APPLICATION", e[e.SEEKTABLE = 3] = "SEEKTABLE", e[e.VORBIS_COMMENT = 4] = "VORBIS_COMMENT", e[e.CUESHEET = 5] = "CUESHEET", e[e.PICTURE = 6] = "PICTURE";
})(s || (s = {}));
class N extends u {
  constructor() {
    super(...arguments), this.vorbisParser = new A(this.metadata, this.options), this.padding = 0;
  }
  async postId3v2Parse() {
    if ((await this.tokenizer.readToken(p)).toString() !== "fLaC")
      throw new d("Invalid FLAC preamble");
    let a;
    do
      a = await this.tokenizer.readToken(w), await this.parseDataBlock(a);
    while (!a.lastBlock);
    if (this.tokenizer.fileInfo.size && this.metadata.format.duration) {
      const i = this.tokenizer.fileInfo.size - this.tokenizer.position;
      this.metadata.setFormat("bitrate", 8 * i / this.metadata.format.duration);
    }
  }
  async parseDataBlock(t) {
    switch (F(`blockHeader type=${t.type}, length=${t.length}`), t.type) {
      case s.STREAMINFO:
        return this.parseBlockStreamInfo(t.length);
      case s.PADDING:
        this.padding += t.length;
        break;
      case s.APPLICATION:
        break;
      case s.SEEKTABLE:
        break;
      case s.VORBIS_COMMENT:
        return this.parseComment(t.length);
      case s.CUESHEET:
        break;
      case s.PICTURE:
        await this.parsePicture(t.length);
        return;
      default:
        this.metadata.addWarning(`Unknown block type: ${t.type}`);
    }
    return this.tokenizer.ignore(t.length).then();
  }
  /**
   * Parse STREAMINFO
   */
  async parseBlockStreamInfo(t) {
    if (t !== c.len)
      throw new d("Unexpected block-stream-info length");
    const a = await this.tokenizer.readToken(c);
    this.metadata.setFormat("container", "FLAC"), this.metadata.setFormat("codec", "FLAC"), this.metadata.setFormat("lossless", !0), this.metadata.setFormat("numberOfChannels", a.channels), this.metadata.setFormat("bitsPerSample", a.bitsPerSample), this.metadata.setFormat("sampleRate", a.sampleRate), a.totalSamples > 0 && this.metadata.setFormat("duration", a.totalSamples / a.sampleRate);
  }
  /**
   * Parse VORBIS_COMMENT
   * Ref: https://www.xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-640004.2.3
   */
  async parseComment(t) {
    const a = await this.tokenizer.readToken(new g(t)), i = new P(a, 0);
    i.readStringUtf8();
    const m = i.readInt32(), h = new Array(m);
    for (let r = 0; r < m; r++)
      h[r] = i.parseUserComment();
    await Promise.all(h.map((r) => this.vorbisParser.addTag(r.key, r.value)));
  }
  async parsePicture(t) {
    if (this.options.skipCovers)
      return this.tokenizer.ignore(t);
    const a = await this.tokenizer.readToken(new S(t));
    this.vorbisParser.addTag("METADATA_BLOCK_PICTURE", a);
  }
}
const w = {
  len: 4,
  get: (e, t) => ({
    lastBlock: C(e, t, 7),
    type: n(e, t, 1, 7),
    length: o.get(e, t + 1)
  })
}, c = {
  len: 34,
  get: (e, t) => ({
    // The minimum block size (in samples) used in the stream.
    minimumBlockSize: l.get(e, t),
    // The maximum block size (in samples) used in the stream.
    // (Minimum blocksize == maximum blocksize) implies a fixed-blocksize stream.
    maximumBlockSize: l.get(e, t + 2) / 1e3,
    // The minimum frame size (in bytes) used in the stream.
    // May be 0 to imply the value is not known.
    minimumFrameSize: o.get(e, t + 4),
    // The maximum frame size (in bytes) used in the stream.
    // May be 0 to imply the value is not known.
    maximumFrameSize: o.get(e, t + 7),
    // Sample rate in Hz. Though 20 bits are available,
    // the maximum sample rate is limited by the structure of frame headers to 655350Hz.
    // Also, a value of 0 is invalid.
    sampleRate: o.get(e, t + 10) >> 4,
    // probably slower: sampleRate: common.getBitAllignedNumber(buf, off + 10, 0, 20),
    // (number of channels)-1. FLAC supports from 1 to 8 channels
    channels: n(e, t + 12, 4, 3) + 1,
    // bits per sample)-1.
    // FLAC supports from 4 to 32 bits per sample. Currently the reference encoder and decoders only support up to 24 bits per sample.
    bitsPerSample: n(e, t + 12, 7, 5) + 1,
    // Total samples in stream.
    // 'Samples' means inter-channel sample, i.e. one second of 44.1Khz audio will have 44100 samples regardless of the number of channels.
    // A value of zero here means the number of total samples is unknown.
    totalSamples: n(e, t + 13, 4, 36),
    // the MD5 hash of the file (see notes for usage... it's a littly tricky)
    fileMD5: new g(16).get(e, t + 18)
  })
};
export {
  N as FlacParser
};
