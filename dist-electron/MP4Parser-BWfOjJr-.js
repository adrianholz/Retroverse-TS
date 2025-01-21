import { c as initDebug, m as makeUnexpectedFileContentError, U as UINT32_BE, S as StringType, F as FourCcToken, a as UINT8, r as UINT24_BE, b as UINT16_BE, d as Uint8ArrayType, I as INT16_BE, y as INT32_BE, z as INT8, C as INT24_BE, w as UINT64_BE, B as BasicParser, T as TrackType, u as uint8ArrayToHex, D as uint8ArrayToString, G as Token, H as Genres } from "./index-BNevSUcy.js";
const debug$2 = initDebug("music-metadata:parser:MP4:atom");
class Mp4ContentError extends makeUnexpectedFileContentError("MP4") {
}
const Header = {
  len: 8,
  get: (buf, off) => {
    const length = UINT32_BE.get(buf, off);
    if (length < 0)
      throw new Mp4ContentError("Invalid atom header length");
    return {
      length: BigInt(length),
      name: new StringType(4, "latin1").get(buf, off + 4)
    };
  },
  put: (buf, off, hdr) => {
    UINT32_BE.put(buf, off, Number(hdr.length));
    return FourCcToken.put(buf, off + 4, hdr.name);
  }
};
const ExtendedSize = UINT64_BE;
const ftyp = {
  len: 4,
  get: (buf, off) => {
    return {
      type: new StringType(4, "ascii").get(buf, off)
    };
  }
};
class FixedLengthAtom {
  /**
   *
   * @param {number} len Length as specified in the size field
   * @param {number} expLen Total length of sum of specified fields in the standard
   * @param atomId Atom ID
   */
  constructor(len, expLen, atomId) {
    this.len = len;
    if (len < expLen) {
      throw new Mp4ContentError(`Atom ${atomId} expected to be ${expLen}, but specifies ${len} bytes long.`);
    }
    if (len > expLen) {
      debug$2(`Warning: atom ${atomId} expected to be ${expLen}, but was actually ${len} bytes long.`);
    }
  }
}
const SecondsSinceMacEpoch = {
  len: 4,
  get: (buf, off) => {
    const secondsSinceUnixEpoch = UINT32_BE.get(buf, off) - 2082844800;
    return new Date(secondsSinceUnixEpoch * 1e3);
  }
};
class MdhdAtom extends FixedLengthAtom {
  constructor(len) {
    super(len, 24, "mdhd");
    this.len = len;
  }
  get(buf, off) {
    return {
      version: UINT8.get(buf, off + 0),
      flags: UINT24_BE.get(buf, off + 1),
      creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
      modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
      timeScale: UINT32_BE.get(buf, off + 12),
      duration: UINT32_BE.get(buf, off + 16),
      language: UINT16_BE.get(buf, off + 20),
      quality: UINT16_BE.get(buf, off + 22)
    };
  }
}
class MvhdAtom extends FixedLengthAtom {
  constructor(len) {
    super(len, 100, "mvhd");
    this.len = len;
  }
  get(buf, off) {
    return {
      version: UINT8.get(buf, off),
      flags: UINT24_BE.get(buf, off + 1),
      creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
      modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
      timeScale: UINT32_BE.get(buf, off + 12),
      duration: UINT32_BE.get(buf, off + 16),
      preferredRate: UINT32_BE.get(buf, off + 20),
      preferredVolume: UINT16_BE.get(buf, off + 24),
      // ignore reserver: 10 bytes
      // ignore matrix structure: 36 bytes
      previewTime: UINT32_BE.get(buf, off + 72),
      previewDuration: UINT32_BE.get(buf, off + 76),
      posterTime: UINT32_BE.get(buf, off + 80),
      selectionTime: UINT32_BE.get(buf, off + 84),
      selectionDuration: UINT32_BE.get(buf, off + 88),
      currentTime: UINT32_BE.get(buf, off + 92),
      nextTrackID: UINT32_BE.get(buf, off + 96)
    };
  }
}
class DataAtom {
  constructor(len) {
    this.len = len;
  }
  get(buf, off) {
    return {
      type: {
        set: UINT8.get(buf, off + 0),
        type: UINT24_BE.get(buf, off + 1)
      },
      locale: UINT24_BE.get(buf, off + 4),
      value: new Uint8ArrayType(this.len - 8).get(buf, off + 8)
    };
  }
}
class NameAtom {
  constructor(len) {
    this.len = len;
  }
  get(buf, off) {
    return {
      version: UINT8.get(buf, off),
      flags: UINT24_BE.get(buf, off + 1),
      name: new StringType(this.len - 4, "utf-8").get(buf, off + 4)
    };
  }
}
class TrackHeaderAtom {
  constructor(len) {
    this.len = len;
  }
  get(buf, off) {
    return {
      version: UINT8.get(buf, off),
      flags: UINT24_BE.get(buf, off + 1),
      creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
      modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
      trackId: UINT32_BE.get(buf, off + 12),
      // reserved 4 bytes
      duration: UINT32_BE.get(buf, off + 20),
      layer: UINT16_BE.get(buf, off + 24),
      alternateGroup: UINT16_BE.get(buf, off + 26),
      volume: UINT16_BE.get(buf, off + 28)
      // ToDo: fixed point
      // ToDo: add remaining fields
    };
  }
}
const stsdHeader = {
  len: 8,
  get: (buf, off) => {
    return {
      version: UINT8.get(buf, off),
      flags: UINT24_BE.get(buf, off + 1),
      numberOfEntries: UINT32_BE.get(buf, off + 4)
    };
  }
};
class SampleDescriptionTable {
  constructor(len) {
    this.len = len;
  }
  get(buf, off) {
    return {
      dataFormat: FourCcToken.get(buf, off),
      dataReferenceIndex: UINT16_BE.get(buf, off + 10),
      description: new Uint8ArrayType(this.len - 12).get(buf, off + 12)
    };
  }
}
class StsdAtom {
  constructor(len) {
    this.len = len;
  }
  get(buf, off) {
    const header = stsdHeader.get(buf, off);
    off += stsdHeader.len;
    const table = [];
    for (let n = 0; n < header.numberOfEntries; ++n) {
      const size = UINT32_BE.get(buf, off);
      off += UINT32_BE.len;
      table.push(new SampleDescriptionTable(size).get(buf, off));
      off += size;
    }
    return {
      header,
      table
    };
  }
}
const SoundSampleDescriptionVersion = {
  len: 8,
  get(buf, off) {
    return {
      version: INT16_BE.get(buf, off),
      revision: INT16_BE.get(buf, off + 2),
      vendor: INT32_BE.get(buf, off + 4)
    };
  }
};
const SoundSampleDescriptionV0 = {
  len: 12,
  get(buf, off) {
    return {
      numAudioChannels: INT16_BE.get(buf, off + 0),
      sampleSize: INT16_BE.get(buf, off + 2),
      compressionId: INT16_BE.get(buf, off + 4),
      packetSize: INT16_BE.get(buf, off + 6),
      sampleRate: UINT16_BE.get(buf, off + 8) + UINT16_BE.get(buf, off + 10) / 1e4
    };
  }
};
class SimpleTableAtom {
  constructor(len, token) {
    this.len = len;
    this.token = token;
  }
  get(buf, off) {
    const nrOfEntries = INT32_BE.get(buf, off + 4);
    return {
      version: INT8.get(buf, off + 0),
      flags: INT24_BE.get(buf, off + 1),
      numberOfEntries: nrOfEntries,
      entries: readTokenTable(buf, this.token, off + 8, this.len - 8, nrOfEntries)
    };
  }
}
const TimeToSampleToken = {
  len: 8,
  get(buf, off) {
    return {
      count: INT32_BE.get(buf, off + 0),
      duration: INT32_BE.get(buf, off + 4)
    };
  }
};
class SttsAtom extends SimpleTableAtom {
  constructor(len) {
    super(len, TimeToSampleToken);
    this.len = len;
  }
}
const SampleToChunkToken = {
  len: 12,
  get(buf, off) {
    return {
      firstChunk: INT32_BE.get(buf, off),
      samplesPerChunk: INT32_BE.get(buf, off + 4),
      sampleDescriptionId: INT32_BE.get(buf, off + 8)
    };
  }
};
class StscAtom extends SimpleTableAtom {
  constructor(len) {
    super(len, SampleToChunkToken);
    this.len = len;
  }
}
class StszAtom {
  constructor(len) {
    this.len = len;
  }
  get(buf, off) {
    const nrOfEntries = INT32_BE.get(buf, off + 8);
    return {
      version: INT8.get(buf, off),
      flags: INT24_BE.get(buf, off + 1),
      sampleSize: INT32_BE.get(buf, off + 4),
      numberOfEntries: nrOfEntries,
      entries: readTokenTable(buf, INT32_BE, off + 12, this.len - 12, nrOfEntries)
    };
  }
}
class StcoAtom extends SimpleTableAtom {
  constructor(len) {
    super(len, INT32_BE);
    this.len = len;
  }
}
class ChapterText {
  constructor(len) {
    this.len = len;
  }
  get(buf, off) {
    const titleLen = INT16_BE.get(buf, off + 0);
    const str = new StringType(titleLen, "utf-8");
    return str.get(buf, off + 2);
  }
}
function readTokenTable(buf, token, off, remainingLen, numberOfEntries) {
  debug$2(`remainingLen=${remainingLen}, numberOfEntries=${numberOfEntries} * token-len=${token.len}`);
  if (remainingLen === 0)
    return [];
  if (remainingLen !== numberOfEntries * token.len)
    throw new Mp4ContentError("mismatch number-of-entries with remaining atom-length");
  const entries = [];
  for (let n = 0; n < numberOfEntries; ++n) {
    entries.push(token.get(buf, off));
    off += token.len;
  }
  return entries;
}
const debug$1 = initDebug("music-metadata:parser:MP4:Atom");
class Atom {
  static async readAtom(tokenizer, dataHandler, parent, remaining) {
    const offset = tokenizer.position;
    debug$1(`Reading next token on offset=${offset}...`);
    const header = await tokenizer.readToken(Header);
    const extended = header.length === 1n;
    if (extended) {
      header.length = await tokenizer.readToken(ExtendedSize);
    }
    const atomBean = new Atom(header, extended, parent);
    const payloadLength = atomBean.getPayloadLength(remaining);
    debug$1(`parse atom name=${atomBean.atomPath}, extended=${atomBean.extended}, offset=${offset}, len=${atomBean.header.length}`);
    await atomBean.readData(tokenizer, dataHandler, payloadLength);
    return atomBean;
  }
  constructor(header, extended, parent) {
    this.header = header;
    this.extended = extended;
    this.parent = parent;
    this.children = [];
    this.atomPath = (this.parent ? `${this.parent.atomPath}.` : "") + this.header.name;
  }
  getHeaderLength() {
    return this.extended ? 16 : 8;
  }
  getPayloadLength(remaining) {
    return (this.header.length === 0n ? remaining : Number(this.header.length)) - this.getHeaderLength();
  }
  async readAtoms(tokenizer, dataHandler, size) {
    while (size > 0) {
      const atomBean = await Atom.readAtom(tokenizer, dataHandler, this, size);
      this.children.push(atomBean);
      size -= atomBean.header.length === 0n ? size : Number(atomBean.header.length);
    }
  }
  async readData(tokenizer, dataHandler, remaining) {
    switch (this.header.name) {
      case "moov":
      case "udta":
      case "trak":
      case "mdia":
      case "minf":
      case "stbl":
      case "<id>":
      case "ilst":
      case "tref":
        return this.readAtoms(tokenizer, dataHandler, this.getPayloadLength(remaining));
      case "meta": {
        const peekHeader = await tokenizer.peekToken(Header);
        const paddingLength = peekHeader.name === "hdlr" ? 0 : 4;
        await tokenizer.ignore(paddingLength);
        return this.readAtoms(tokenizer, dataHandler, this.getPayloadLength(remaining) - paddingLength);
      }
      default:
        return dataHandler(this, remaining);
    }
  }
}
const debug = initDebug("music-metadata:parser:MP4");
const tagFormat = "iTunes";
const encoderDict = {
  raw: {
    lossy: false,
    format: "raw"
  },
  MAC3: {
    lossy: true,
    format: "MACE 3:1"
  },
  MAC6: {
    lossy: true,
    format: "MACE 6:1"
  },
  ima4: {
    lossy: true,
    format: "IMA 4:1"
  },
  ulaw: {
    lossy: true,
    format: "uLaw 2:1"
  },
  alaw: {
    lossy: true,
    format: "uLaw 2:1"
  },
  Qclp: {
    lossy: true,
    format: "QUALCOMM PureVoice"
  },
  ".mp3": {
    lossy: true,
    format: "MPEG-1 layer 3"
  },
  alac: {
    lossy: false,
    format: "ALAC"
  },
  "ac-3": {
    lossy: true,
    format: "AC-3"
  },
  mp4a: {
    lossy: true,
    format: "MPEG-4/AAC"
  },
  mp4s: {
    lossy: true,
    format: "MP4S"
  },
  // Closed Captioning Media, https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-SW87
  c608: {
    lossy: true,
    format: "CEA-608"
  },
  c708: {
    lossy: true,
    format: "CEA-708"
  }
};
function distinct(value, index, self) {
  return self.indexOf(value) === index;
}
class MP4Parser extends BasicParser {
  constructor() {
    super(...arguments);
    this.tracks = [];
    this.atomParsers = {
      /**
       * Parse movie header (mvhd) atom
       * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-56313
       */
      mvhd: async (len) => {
        const mvhd = await this.tokenizer.readToken(new MvhdAtom(len));
        this.metadata.setFormat("creationTime", mvhd.creationTime);
        this.metadata.setFormat("modificationTime", mvhd.modificationTime);
      },
      /**
       * Parse media header (mdhd) atom
       * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25615
       */
      mdhd: async (len) => {
        const mdhd_data = await this.tokenizer.readToken(new MdhdAtom(len));
        const td = this.getTrackDescription();
        td.creationTime = mdhd_data.creationTime;
        td.modificationTime = mdhd_data.modificationTime;
        td.timeScale = mdhd_data.timeScale;
        td.duration = mdhd_data.duration;
      },
      chap: async (len) => {
        const td = this.getTrackDescription();
        const trackIds = [];
        while (len >= UINT32_BE.len) {
          trackIds.push(await this.tokenizer.readNumber(UINT32_BE));
          len -= UINT32_BE.len;
        }
        td.chapterList = trackIds;
      },
      tkhd: async (len) => {
        const track = await this.tokenizer.readToken(new TrackHeaderAtom(len));
        this.tracks.push(track);
      },
      /**
       * Parse mdat atom.
       * Will scan for chapters
       */
      mdat: async (len) => {
        this.audioLengthInBytes = len;
        this.calculateBitRate();
        if (this.options.includeChapters) {
          const trackWithChapters = this.tracks.filter((track) => track.chapterList);
          if (trackWithChapters.length === 1) {
            const chapterTrackIds = trackWithChapters[0].chapterList;
            const chapterTracks = this.tracks.filter((track) => chapterTrackIds.indexOf(track.trackId) !== -1);
            if (chapterTracks.length === 1) {
              return this.parseChapterTrack(chapterTracks[0], trackWithChapters[0], len);
            }
          }
        }
        await this.tokenizer.ignore(len);
      },
      ftyp: async (len) => {
        const types = [];
        while (len > 0) {
          const ftype = await this.tokenizer.readToken(ftyp);
          len -= ftyp.len;
          const value = ftype.type.replace(/\W/g, "");
          if (value.length > 0) {
            types.push(value);
          }
        }
        debug(`ftyp: ${types.join("/")}`);
        const x = types.filter(distinct).join("/");
        this.metadata.setFormat("container", x);
      },
      /**
       * Parse sample description atom
       */
      stsd: async (len) => {
        const stsd = await this.tokenizer.readToken(new StsdAtom(len));
        const trackDescription = this.getTrackDescription();
        trackDescription.soundSampleDescription = stsd.table.map((dfEntry) => this.parseSoundSampleDescription(dfEntry));
      },
      /**
       * sample-to-Chunk Atoms
       */
      stsc: async (len) => {
        const stsc = await this.tokenizer.readToken(new StscAtom(len));
        this.getTrackDescription().sampleToChunkTable = stsc.entries;
      },
      /**
       * time-to-sample table
       */
      stts: async (len) => {
        const stts = await this.tokenizer.readToken(new SttsAtom(len));
        this.getTrackDescription().timeToSampleTable = stts.entries;
      },
      /**
       * Parse sample-sizes atom ('stsz')
       */
      stsz: async (len) => {
        const stsz = await this.tokenizer.readToken(new StszAtom(len));
        const td = this.getTrackDescription();
        td.sampleSize = stsz.sampleSize;
        td.sampleSizeTable = stsz.entries;
      },
      /**
       * Parse chunk-offset atom ('stco')
       */
      stco: async (len) => {
        const stco = await this.tokenizer.readToken(new StcoAtom(len));
        this.getTrackDescription().chunkOffsetTable = stco.entries;
      },
      date: async (len) => {
        const date = await this.tokenizer.readToken(new StringType(len, "utf-8"));
        await this.addTag("date", date);
      }
    };
  }
  static read_BE_Integer(array, signed) {
    const integerType = (signed ? "INT" : "UINT") + array.length * 8 + (array.length > 1 ? "_BE" : "");
    const token = Token[integerType];
    if (!token) {
      throw new Mp4ContentError(`Token for integer type not found: "${integerType}"`);
    }
    return Number(token.get(array, 0));
  }
  async parse() {
    this.tracks = [];
    let remainingFileSize = this.tokenizer.fileInfo.size || 0;
    while (!this.tokenizer.fileInfo.size || remainingFileSize > 0) {
      try {
        const token = await this.tokenizer.peekToken(Header);
        if (token.name === "\0\0\0\0") {
          const errMsg = `Error at offset=${this.tokenizer.position}: box.id=0`;
          debug(errMsg);
          this.addWarning(errMsg);
          break;
        }
      } catch (error) {
        if (error instanceof Error) {
          const errMsg = `Error at offset=${this.tokenizer.position}: ${error.message}`;
          debug(errMsg);
          this.addWarning(errMsg);
        } else
          throw error;
        break;
      }
      const rootAtom = await Atom.readAtom(this.tokenizer, (atom, remaining) => this.handleAtom(atom, remaining), null, remainingFileSize);
      remainingFileSize -= rootAtom.header.length === BigInt(0) ? remainingFileSize : Number(rootAtom.header.length);
    }
    const formatList = [];
    this.tracks.forEach((track) => {
      const trackFormats = [];
      track.soundSampleDescription.forEach((ssd) => {
        const streamInfo = {};
        const encoderInfo = encoderDict[ssd.dataFormat];
        if (encoderInfo) {
          trackFormats.push(encoderInfo.format);
          streamInfo.codecName = encoderInfo.format;
        } else {
          streamInfo.codecName = `<${ssd.dataFormat}>`;
        }
        if (ssd.description) {
          const { description } = ssd;
          if (description.sampleRate > 0) {
            streamInfo.type = TrackType.audio;
            streamInfo.audio = {
              samplingFrequency: description.sampleRate,
              bitDepth: description.sampleSize,
              channels: description.numAudioChannels
            };
          }
        }
        this.metadata.addStreamInfo(streamInfo);
      });
      if (trackFormats.length >= 1) {
        formatList.push(trackFormats.join("/"));
      }
    });
    if (formatList.length > 0) {
      this.metadata.setFormat("codec", formatList.filter(distinct).join("+"));
    }
    const audioTracks = this.tracks.filter((track) => {
      return track.soundSampleDescription.length >= 1 && track.soundSampleDescription[0].description && track.soundSampleDescription[0].description.numAudioChannels > 0;
    });
    if (audioTracks.length >= 1) {
      const audioTrack = audioTracks[0];
      if (audioTrack.timeScale > 0) {
        const duration = audioTrack.duration / audioTrack.timeScale;
        this.metadata.setFormat("duration", duration);
      }
      const ssd = audioTrack.soundSampleDescription[0];
      if (ssd.description) {
        this.metadata.setFormat("sampleRate", ssd.description.sampleRate);
        this.metadata.setFormat("bitsPerSample", ssd.description.sampleSize);
        this.metadata.setFormat("numberOfChannels", ssd.description.numAudioChannels);
        if (audioTrack.timeScale === 0 && audioTrack.timeToSampleTable.length > 0) {
          const totalSampleSize = audioTrack.timeToSampleTable.map((ttstEntry) => ttstEntry.count * ttstEntry.duration).reduce((total, sampleSize) => total + sampleSize);
          const duration = totalSampleSize / ssd.description.sampleRate;
          this.metadata.setFormat("duration", duration);
        }
      }
      const encoderInfo = encoderDict[ssd.dataFormat];
      if (encoderInfo) {
        this.metadata.setFormat("lossless", !encoderInfo.lossy);
      }
      this.calculateBitRate();
    }
  }
  async handleAtom(atom, remaining) {
    if (atom.parent) {
      switch (atom.parent.header.name) {
        case "ilst":
        case "<id>":
          return this.parseMetadataItemData(atom);
      }
    }
    if (this.atomParsers[atom.header.name]) {
      return this.atomParsers[atom.header.name](remaining);
    }
    debug(`No parser for atom path=${atom.atomPath}, payload-len=${remaining}, ignoring atom`);
    await this.tokenizer.ignore(remaining);
  }
  getTrackDescription() {
    return this.tracks[this.tracks.length - 1];
  }
  calculateBitRate() {
    if (this.audioLengthInBytes && this.metadata.format.duration) {
      this.metadata.setFormat("bitrate", 8 * this.audioLengthInBytes / this.metadata.format.duration);
    }
  }
  async addTag(id, value) {
    await this.metadata.addTag(tagFormat, id, value);
  }
  addWarning(message) {
    debug(`Warning: ${message}`);
    this.metadata.addWarning(message);
  }
  /**
   * Parse data of Meta-item-list-atom (item of 'ilst' atom)
   * @param metaAtom
   * Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW8
   */
  parseMetadataItemData(metaAtom) {
    let tagKey = metaAtom.header.name;
    return metaAtom.readAtoms(this.tokenizer, async (child, remaining) => {
      const payLoadLength = child.getPayloadLength(remaining);
      switch (child.header.name) {
        case "data":
          return this.parseValueAtom(tagKey, child);
        case "name":
        case "mean":
        case "rate": {
          const name = await this.tokenizer.readToken(new NameAtom(payLoadLength));
          tagKey += `:${name.name}`;
          break;
        }
        default: {
          const uint8Array = await this.tokenizer.readToken(new Uint8ArrayType(payLoadLength));
          this.addWarning(`Unsupported meta-item: ${tagKey}[${child.header.name}] => value=${uint8ArrayToHex(uint8Array)} ascii=${uint8ArrayToString(uint8Array, "ascii")}`);
        }
      }
    }, metaAtom.getPayloadLength(0));
  }
  async parseValueAtom(tagKey, metaAtom) {
    const dataAtom = await this.tokenizer.readToken(new DataAtom(Number(metaAtom.header.length) - Header.len));
    if (dataAtom.type.set !== 0) {
      throw new Mp4ContentError(`Unsupported type-set != 0: ${dataAtom.type.set}`);
    }
    switch (dataAtom.type.type) {
      case 0:
        switch (tagKey) {
          case "trkn":
          case "disk": {
            const num = UINT8.get(dataAtom.value, 3);
            const of = UINT8.get(dataAtom.value, 5);
            await this.addTag(tagKey, `${num}/${of}`);
            break;
          }
          case "gnre": {
            const genreInt = UINT8.get(dataAtom.value, 1);
            const genreStr = Genres[genreInt - 1];
            await this.addTag(tagKey, genreStr);
            break;
          }
          case "rate": {
            const rate = new TextDecoder("ascii").decode(dataAtom.value);
            await this.addTag(tagKey, rate);
            break;
          }
          default:
            debug(`unknown proprietary value type for: ${metaAtom.atomPath}`);
        }
        break;
      case 1:
      case 18:
        await this.addTag(tagKey, new TextDecoder("utf-8").decode(dataAtom.value));
        break;
      case 13:
        if (this.options.skipCovers)
          break;
        await this.addTag(tagKey, {
          format: "image/jpeg",
          data: Uint8Array.from(dataAtom.value)
        });
        break;
      case 14:
        if (this.options.skipCovers)
          break;
        await this.addTag(tagKey, {
          format: "image/png",
          data: Uint8Array.from(dataAtom.value)
        });
        break;
      case 21:
        await this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, true));
        break;
      case 22:
        await this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, false));
        break;
      case 65:
        await this.addTag(tagKey, UINT8.get(dataAtom.value, 0));
        break;
      case 66:
        await this.addTag(tagKey, UINT16_BE.get(dataAtom.value, 0));
        break;
      case 67:
        await this.addTag(tagKey, UINT32_BE.get(dataAtom.value, 0));
        break;
      default:
        this.addWarning(`atom key=${tagKey}, has unknown well-known-type (data-type): ${dataAtom.type.type}`);
    }
  }
  /**
   * @param sampleDescription
   * Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-128916
   */
  parseSoundSampleDescription(sampleDescription) {
    const ssd = {
      dataFormat: sampleDescription.dataFormat,
      dataReferenceIndex: sampleDescription.dataReferenceIndex
    };
    let offset = 0;
    const version = SoundSampleDescriptionVersion.get(sampleDescription.description, offset);
    offset += SoundSampleDescriptionVersion.len;
    if (version.version === 0 || version.version === 1) {
      ssd.description = SoundSampleDescriptionV0.get(sampleDescription.description, offset);
    } else {
      debug(`Warning: sound-sample-description ${version} not implemented`);
    }
    return ssd;
  }
  async parseChapterTrack(chapterTrack, track, len) {
    if (!chapterTrack.sampleSize) {
      if (chapterTrack.chunkOffsetTable.length !== chapterTrack.sampleSizeTable.length)
        throw new Error("Expected equal chunk-offset-table & sample-size-table length.");
    }
    const chapters = [];
    for (let i = 0; i < chapterTrack.chunkOffsetTable.length && len > 0; ++i) {
      const chunkOffset = chapterTrack.chunkOffsetTable[i];
      const nextChunkLen = chunkOffset - this.tokenizer.position;
      const sampleSize = chapterTrack.sampleSize > 0 ? chapterTrack.sampleSize : chapterTrack.sampleSizeTable[i];
      len -= nextChunkLen + sampleSize;
      if (len < 0)
        throw new Mp4ContentError("Chapter chunk exceeding token length");
      await this.tokenizer.ignore(nextChunkLen);
      const title = await this.tokenizer.readToken(new ChapterText(sampleSize));
      debug(`Chapter ${i + 1}: ${title}`);
      const chapter = {
        title,
        sampleOffset: this.findSampleOffset(track, this.tokenizer.position)
      };
      debug(`Chapter title=${chapter.title}, offset=${chapter.sampleOffset}/${this.tracks[0].duration}`);
      chapters.push(chapter);
    }
    this.metadata.setFormat("chapters", chapters);
    await this.tokenizer.ignore(len);
  }
  findSampleOffset(track, chapterOffset) {
    let totalDuration = 0;
    track.timeToSampleTable.forEach((e) => {
      totalDuration += e.count * e.duration;
    });
    debug(`Total duration=${totalDuration}`);
    let chunkIndex = 0;
    while (chunkIndex < track.chunkOffsetTable.length && track.chunkOffsetTable[chunkIndex] < chapterOffset) {
      ++chunkIndex;
    }
    return this.getChunkDuration(chunkIndex + 1, track);
  }
  getChunkDuration(chunkId, track) {
    let ttsi = 0;
    let ttsc = track.timeToSampleTable[ttsi].count;
    let ttsd = track.timeToSampleTable[ttsi].duration;
    let curChunkId = 1;
    let samplesPerChunk = this.getSamplesPerChunk(curChunkId, track.sampleToChunkTable);
    let totalDuration = 0;
    while (curChunkId < chunkId) {
      const nrOfSamples = Math.min(ttsc, samplesPerChunk);
      totalDuration += nrOfSamples * ttsd;
      ttsc -= nrOfSamples;
      samplesPerChunk -= nrOfSamples;
      if (samplesPerChunk === 0) {
        ++curChunkId;
        samplesPerChunk = this.getSamplesPerChunk(curChunkId, track.sampleToChunkTable);
      } else {
        ++ttsi;
        ttsc = track.timeToSampleTable[ttsi].count;
        ttsd = track.timeToSampleTable[ttsi].duration;
      }
    }
    return totalDuration;
  }
  getSamplesPerChunk(chunkId, stcTable) {
    for (let i = 0; i < stcTable.length - 1; ++i) {
      if (chunkId >= stcTable[i].firstChunk && chunkId < stcTable[i + 1].firstChunk) {
        return stcTable[i].samplesPerChunk;
      }
    }
    return stcTable[stcTable.length - 1].samplesPerChunk;
  }
}
export {
  MP4Parser
};
