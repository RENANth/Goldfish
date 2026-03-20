/**
 * Corta a sprite sheet em células 2 colunas x 3 linhas,
 * recorta o padding transparente de cada célula e exporta PNGs individuais.
 * Uso: node scripts/slice-sprites.js
 */

const path = require("path");
const fs = require("fs");

const sharp = require("sharp");

const COLS = 2;
const ROWS = 3;
const SHEET_PATH = path.join(__dirname, "..", "skins", "default", "sheet.png");
const OUT_DIR = path.join(__dirname, "..", "skins", "default", "frames");

async function main() {
  if (!fs.existsSync(SHEET_PATH)) {
    console.error("Arquivo não encontrado:", SHEET_PATH);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sheetBuffer = fs.readFileSync(SHEET_PATH);
  const image = sharp(sheetBuffer);
  const meta = await image.metadata();
  const width = meta.width;
  const height = meta.height;

  const frameWidth = Math.floor(width / COLS);
  const frameHeight = Math.floor(height / ROWS);

  console.log(`Sprite sheet: ${width}x${height}`);
  console.log(
    `Células: ${COLS}x${ROWS} → ${frameWidth}x${frameHeight} por frame`,
  );
  console.log(`Exportando para: ${OUT_DIR}\n`);

  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const left = col * frameWidth;
    const top = row * frameHeight;
    const w = col < COLS - 1 ? frameWidth : width - left;
    const h = row < ROWS - 1 ? frameHeight : height - top;

    if (w < 1 || h < 1) {
      console.warn(`  frame-${i}: região inválida, pulando`);
      continue;
    }

    const outPath = path.join(OUT_DIR, `frame-${i}.png`);

    const extractOpts = {
      left: Math.floor(left),
      top: Math.floor(top),
      width: Math.min(Math.floor(w), width - Math.floor(left)),
      height: Math.min(Math.floor(h), height - Math.floor(top)),
    };

    const cellBuffer = await sharp(sheetBuffer)
      .extract(extractOpts)
      .png()
      .toBuffer();
    let outBuffer;
    try {
      outBuffer = await sharp(cellBuffer)
        .trim({ threshold: 1 })
        .png()
        .toBuffer();
    } catch (err) {
      outBuffer = cellBuffer;
    }
    const meta = await sharp(outBuffer).metadata();
    await sharp(outBuffer).toFile(outPath);
    console.log(`  frame-${i}.png → ${meta.width}x${meta.height}`);
  }

  console.log("\nConcluído. 6 PNGs em skins/default/frames/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
