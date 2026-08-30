const sharp = require("sharp");
const path = require("path");

const SIZE = 128;
const CHANNELS = 3;
const buffer = Buffer.alloc(SIZE * SIZE * CHANNELS);

for (let i = 0; i < SIZE * SIZE; i++) {
  const value = Math.max(0, Math.min(255, Math.round(128 + (Math.random() - 0.5) * 76)));
  const offset = i * CHANNELS;
  buffer[offset] = value;
  buffer[offset + 1] = value;
  buffer[offset + 2] = value;
}

sharp(buffer, { raw: { width: SIZE, height: SIZE, channels: CHANNELS } })
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(__dirname, "..", "public", "grain.png"))
  .then((info) => console.log("grain.png written,", info.size, "bytes"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
