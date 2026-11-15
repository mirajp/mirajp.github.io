export type IccProfileKind = "p3" | "srgb" | "other" | "none";

export interface JpegSegment {
  readonly marker: number;
  readonly start: number;
  readonly end: number;
}

export interface JpegMetadata {
  exif: boolean;
  xmp: boolean;
  iptc: boolean;
  comment: boolean;
  gps: boolean;
  gpsEmpty: boolean;
  camera: string;
  taken: string;
  orientation: number;
  icc: string;
  iccKind: IccProfileKind;
  extraImages: boolean;
  motion: boolean;
  blocks: number;
}

interface ParsedSegments {
  readonly segs: JpegSegment[];
  readonly sos: number;
}

function jpegSegments(buf: Uint8Array<ArrayBuffer>): ParsedSegments {
  const segs: JpegSegment[] = [];
  let p = 2;
  while (p + 4 <= buf.length) {
    if (buf[p] !== 0xff) {
      throw new Error("This JPEG file has a broken structure.");
    }
    const marker = buf[p + 1];
    if (marker === 0xff) {
      p++;
      continue;
    }
    if (marker === 0xda) {
      return { segs, sos: p };
    }
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      p += 2;
      continue;
    }
    const len = (buf[p + 2] << 8) | buf[p + 3];
    segs.push({ marker, start: p, end: p + 2 + len });
    p += 2 + len;
  }
  throw new Error("This JPEG file has no image data.");
}

function segmentId(buf: Uint8Array<ArrayBuffer>, seg: JpegSegment): string {
  let s = "";
  const end = Math.min(seg.end, seg.start + 4 + 36);
  for (let i = seg.start + 4; i < end; i++) {
    s += String.fromCharCode(buf[i]);
  }
  return s;
}

function tiffAccess(bytes: Uint8Array<ArrayBuffer>, tiff: number) {
  const le = bytes[tiff] === 0x49;
  const rd16 = (o: number): number =>
    le ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1];
  const rd32 = (o: number): number =>
    (le
      ? bytes[o] |
        (bytes[o + 1] << 8) |
        (bytes[o + 2] << 16) |
        (bytes[o + 3] << 24)
      : (bytes[o] << 24) |
        (bytes[o + 1] << 16) |
        (bytes[o + 2] << 8) |
        bytes[o + 3]) >>> 0;
  const wr16 = (o: number, v: number): void => {
    if (le) {
      bytes[o] = v & 255;
      bytes[o + 1] = (v >> 8) & 255;
    } else {
      bytes[o] = (v >> 8) & 255;
      bytes[o + 1] = v & 255;
    }
  };
  const wr32 = (o: number, v: number): void => {
    if (le) {
      wr16(o, v & 0xffff);
      wr16(o + 2, (v >>> 16) & 0xffff);
    } else {
      wr16(o, (v >>> 16) & 0xffff);
      wr16(o + 2, v & 0xffff);
    }
  };
  const walk = (
    ifdOffset: number,
    fn: (tag: number, type: number, count: number, entryOffset: number) => void,
  ): void => {
    const at = tiff + ifdOffset;
    if (!ifdOffset || at + 2 > bytes.length) return;
    const count = rd16(at);
    for (let i = 0; i < count; i++) {
      const e = at + 2 + 12 * i;
      if (e + 12 > bytes.length) return;
      fn(rd16(e), rd16(e + 2), rd32(e + 4), e);
    }
  };
  const ascii = (count: number, e: number): string => {
    const at = count <= 4 ? e + 8 : tiff + rd32(e + 8);
    let s = "";
    for (let i = 0; i < count && at + i < bytes.length; i++) {
      if (bytes[at + i] === 0) break;
      s += String.fromCharCode(bytes[at + i]);
    }
    return s.trim();
  };
  const setNumber = (type: number, e: number, value: number): void => {
    if (type === 3) wr16(e + 8, value);
    else if (type === 4) wr32(e + 8, value);
  };
  return { rd16, rd32, walk, ascii, setNumber, ifd0: rd32(tiff + 4) };
}

function patchExif(
  bytes: Uint8Array<ArrayBuffer>,
  width: number,
  height: number,
): void {
  try {
    const t = tiffAccess(bytes, 10);
    let exifIfd = 0;
    t.walk(t.ifd0, (tag, type, _count, e) => {
      if (tag === 0x0112) t.setNumber(type, e, 1);
      if (tag === 0x0100) t.setNumber(type, e, width);
      if (tag === 0x0101) t.setNumber(type, e, height);
      if (tag === 0x8769) exifIfd = t.rd32(e + 8);
    });
    t.walk(exifIfd, (tag, type, _count, e) => {
      if (tag === 0xa002) t.setNumber(type, e, width);
      if (tag === 0xa003) t.setNumber(type, e, height);
    });
  } catch {
    // Keep the original EXIF block untouched if parsing fails.
  }
}

/** Extracts EXIF, XMP, IPTC, ICC profile, and embedded stream flags from a JPEG buffer. */
export function readJpegMeta(buf: Uint8Array<ArrayBuffer>): JpegMetadata {
  const meta: JpegMetadata = {
    exif: false,
    xmp: false,
    iptc: false,
    comment: false,
    gps: false,
    gpsEmpty: false,
    camera: "",
    taken: "",
    orientation: 1,
    icc: "",
    iccKind: "none",
    extraImages: false,
    motion: false,
    blocks: 0,
  };
  const { segs } = jpegSegments(buf);
  const iccChunks: Uint8Array<ArrayBuffer>[] = [];

  for (const seg of segs) {
    const isApp = seg.marker >= 0xe0 && seg.marker <= 0xef;
    if (!isApp && seg.marker !== 0xfe) continue;
    const id = segmentId(buf, seg);

    if (seg.marker === 0xfe) {
      meta.comment = true;
      meta.blocks++;
      continue;
    }

    if (seg.marker === 0xe1 && id.startsWith("Exif")) {
      meta.exif = true;
      meta.blocks++;
      try {
        const bytes = buf.subarray(seg.start, seg.end);
        const t = tiffAccess(bytes, 10);
        let make = "";
        let model = "";
        let gpsIfd = 0;
        t.walk(t.ifd0, (tag, _type, count, e) => {
          if (tag === 0x010f) make = t.ascii(count, e);
          if (tag === 0x0110) model = t.ascii(count, e);
          if (tag === 0x0132) meta.taken = t.ascii(count, e);
          if (tag === 0x0112) meta.orientation = t.rd16(e + 8);
          if (tag === 0x8825) {
            meta.gps = true;
            gpsIfd = t.rd32(e + 8);
          }
        });
        meta.gpsEmpty = meta.gps;
        t.walk(gpsIfd, (tag, type, _count, e) => {
          if (tag === 2 && type === 5 && t.rd32(10 + t.rd32(e + 8) + 4) !== 0) {
            meta.gpsEmpty = false;
          }
        });
        meta.camera = model.startsWith(make)
          ? model
          : `${make} ${model}`.trim();
      } catch {
        // Leave summary fields empty if TIFF parsing fails.
      }
    } else if (seg.marker === 0xe1 && id.startsWith("http://ns.adobe.com/x")) {
      meta.xmp = true;
      meta.blocks++;
      let text = "";
      const end = Math.min(seg.end, seg.start + 60000);
      for (let i = seg.start; i < end; i++) {
        text += String.fromCharCode(buf[i]);
      }
      if (/MotionPhoto|MicroVideo/.test(text)) meta.motion = true;
      if (/hdrgm:|GainMap/.test(text)) meta.extraImages = true;
    } else if (seg.marker === 0xe2 && id.startsWith("ICC_PROFILE")) {
      iccChunks.push(buf.subarray(seg.start + 18, seg.end));
      meta.blocks++;
    } else if (seg.marker === 0xe2 && id.startsWith("MPF")) {
      meta.extraImages = true;
    } else if (seg.marker === 0xed) {
      meta.iptc = true;
      meta.blocks++;
    } else if (!(seg.marker === 0xee && id.startsWith("Adobe"))) {
      meta.blocks++;
    }
  }

  if (iccChunks.length > 0) {
    let text = "";
    for (const part of iccChunks) {
      for (let i = 0; i < part.length; i++) {
        if (part[i] >= 32 && part[i] < 127) {
          text += String.fromCharCode(part[i]);
        }
      }
    }
    if (/Display P3|P3 D65/i.test(text)) {
      meta.iccKind = "p3";
      meta.icc = "Display P3";
    } else if (/sRGB|IEC ?61966/i.test(text)) {
      meta.iccKind = "srgb";
      meta.icc = "sRGB";
    } else {
      meta.iccKind = "other";
      meta.icc = "Other profile";
    }
  }

  return meta;
}

/** Splices original APPn/COM metadata segments onto newly encoded JPEG scan data. */
export function spliceMetadata(
  orig: Uint8Array<ArrayBuffer>,
  enc: Uint8Array<ArrayBuffer>,
  width: number,
  height: number,
  keepIcc: boolean,
): Blob {
  const o = jpegSegments(orig);
  const e = jpegSegments(enc);
  const parts: BlobPart[] = [];
  const kept: Uint8Array<ArrayBuffer>[] = [];
  let hasApp0 = false;
  let hasExif = false;

  for (const seg of o.segs) {
    const isApp = seg.marker >= 0xe0 && seg.marker <= 0xef;
    if (!isApp && seg.marker !== 0xfe) continue;
    const id = segmentId(orig, seg);
    if (seg.marker === 0xe2 && id.startsWith("MPF")) continue;
    if (seg.marker === 0xee && id.startsWith("Adobe")) continue;
    if (seg.marker === 0xe2 && id.startsWith("ICC_PROFILE") && !keepIcc) {
      continue;
    }
    const bytes = orig.slice(seg.start, seg.end);
    if (seg.marker === 0xe1 && id.startsWith("Exif")) {
      patchExif(bytes, width, height);
      hasExif = true;
    }
    if (seg.marker === 0xe0) hasApp0 = true;
    kept.push(bytes);
  }

  parts.push(new Uint8Array([0xff, 0xd8]));
  const encoded: Uint8Array<ArrayBuffer>[] = [];
  for (const seg of e.segs) {
    const isApp = seg.marker >= 0xe0 && seg.marker <= 0xef;
    if (seg.marker === 0xe0 && !hasApp0 && !hasExif) {
      parts.push(enc.subarray(seg.start, seg.end));
    } else if (!isApp && seg.marker !== 0xfe) {
      encoded.push(enc.subarray(seg.start, seg.end));
    }
  }

  parts.push(...kept, ...encoded, enc.subarray(e.sos));
  return new Blob(parts, { type: "image/jpeg" });
}
