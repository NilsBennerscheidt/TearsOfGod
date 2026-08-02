/**
 * Reads intrinsic pixel dimensions from a PNG or JPEG buffer by parsing
 * just enough of the file's own header to find them — no `image-size` or
 * `sharp` dependency. Deliberate: a devDependency imported from a route
 * file would still ship in the production bundle (route handlers aren't
 * dev-only at the bundler level, only at runtime via adminGuard), and
 * `sharp` is a native binary pulled in just to read two integers per
 * upload. This covers everything the media library actually stores
 * (public/media/photos is JPEG/PNG today); add a format here if that
 * ever changes, rather than reaching for a dependency preemptively.
 */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readPngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  // IHDR is always the first chunk: 8-byte signature, 4-byte chunk
  // length, 4-byte "IHDR" tag, then 4-byte width + 4-byte height, both
  // big-endian.
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readJpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 3 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buf[offset + 1];
    // Markers with no payload: TEM (0x01) and the RSTn range (0xD0–0xD7).
    if (marker === 0x01 || (marker !== undefined && marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 /* EOI */ || marker === undefined) break;

    const segmentLength = buf.readUInt16BE(offset + 2);
    // SOFn markers (0xC0–0xCF) except DHT(0xC4)/JPG(0xC8)/DAC(0xCC) carry
    // the frame's dimensions: 2-byte length, 1-byte precision, then
    // 2-byte height, 2-byte width, both big-endian.
    const isFrameStart = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrameStart) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }

    offset += 2 + segmentLength;
  }

  return null;
}

export function readImageSize(buf: Buffer): { width: number; height: number } {
  const png = readPngSize(buf);
  if (png) return png;

  const jpeg = readJpegSize(buf);
  if (jpeg) return jpeg;

  throw new Error("Unsupported image format — only PNG and JPEG dimensions can be read.");
}
