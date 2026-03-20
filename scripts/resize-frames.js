const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

(async () => {
  const framesDir = path.join(__dirname, "..", "skins", "default", "frames");
  const backupDir = path.join(path.dirname(framesDir), "frames-backup");
  await fs.mkdir(backupDir, { recursive: true });

  const files = await fs.readdir(framesDir);
  for (const file of files) {
    if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;
    const src = path.join(framesDir, file);
    const backup = path.join(backupDir, file);
    await fs.copyFile(src, backup);

    const img = sharp(src).ensureAlpha();
    const meta = await img.metadata();
    const { width, height } = meta;

    const raw = await img.raw().toBuffer();

    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = raw[idx + 3];
        if (a > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      console.log("Skipping (empty):", file);
      continue;
    }

    const pad = 2;
    const left = Math.max(0, minX - pad);
    const top = Math.max(0, minY - pad);
    const cropW = Math.min(width - left, maxX - left + pad + 1);
    const cropH = Math.min(height - top, maxY - top + pad + 1);

    const maxDim = 64; // tamanho máximo desejado (altere se quiser menor/maior)
    const scale = Math.min(1, maxDim / Math.max(cropW, cropH));
    const targetW = Math.max(1, Math.round(cropW * scale));
    const targetH = Math.max(1, Math.round(cropH * scale));

    const tmpOut = src + ".tmp.png";
    await sharp(src)
      .extract({ left, top, width: cropW, height: cropH })
      .resize(targetW, targetH, { fit: "contain" })
      .toFile(tmpOut);
    await fs.rename(tmpOut, src);

    console.log("Processed:", file, "->", `${targetW}x${targetH}`);
  }

  console.log("All frames processed. Backups in skins/default/frames-backup");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
