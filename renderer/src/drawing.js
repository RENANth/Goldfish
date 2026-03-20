import { fish, skin, foods, toys, particles } from "./state.js";
import { updateSpeechPos, isSpeaking } from "./speech.js";

export function drawFrame(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (skin.transitionOpacity < 1) {
    skin.transitionOpacity = Math.min(1, skin.transitionOpacity + 0.08);
  }

  updateSpeechPos(
    fish.x,
    fish.y,
    skin.loaded ? (skin.frameH * fish.scale) / 2 + 15 : 40,
  );

  particles.forEach((p) => {
    if (p.type === "bubble") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "heart") {
      ctx.fillStyle = "#ff4b4b";
      ctx.font = `${p.r * 4}px Arial`;
      ctx.fillText("❤", p.x, p.y);
    } else if (p.type === "zzz") {
      const px = p.x + Math.sin(p.phase) * 5;
      ctx.fillStyle = `rgba(200, 200, 255, ${Math.min(1, p.ttl)})`;
      ctx.font = `bold ${p.size}px monospace`;
      ctx.fillText("z", px, p.y);
    }
  });

  toys.forEach((t) => {
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#ffcc00";
  ctx.shadowBlur = 4;
  ctx.shadowColor = "#ffcc00";
  foods.forEach((f) => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  drawFish(ctx, fish);
}

function drawFish(ctx, f) {
  ctx.save();

  ctx.globalAlpha = skin.transitionOpacity ?? 1;

  if (f.mood === "HAPPY") ctx.filter = "brightness(1.2) saturate(1.5)";
  if (f.mood === "DIZZY") ctx.filter = "hue-rotate(90deg) opacity(0.8)";
  if (f.mood === "HUNGRY") ctx.filter = "grayscale(0.5) contrast(0.8)";

  ctx.translate(f.x, f.y);
  ctx.translate(skin.drawOffsetX || 0, skin.drawOffsetY || 0);
  ctx.scale(f.scaleX, f.scaleY);

  if (f.isDragging) {
    const tilt = Math.max(-0.4, Math.min(0.4, f.vy * 0.005));
    ctx.rotate(tilt * f.dir);
  } else {
    ctx.rotate(f.rotation);
  }

  ctx.scale(f.dir, 1);
  ctx.scale(f.scale, f.scale);

  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  if (skin.loaded) {
    const anim = skin.animations[skin.currentAnim] || skin.animations.swim;
    const idx = anim[(skin._animIndex || 0) % anim.length];
    const inset = skin.frameInset || 0;
    const sw = skin.frameW - inset * 2;
    const sh = skin.frameH - inset * 2;
    const sx = (idx % skin.cols) * skin.frameW + inset;
    const sy = Math.floor(idx / skin.cols) * skin.frameH + inset;
    ctx.drawImage(skin.img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  } else {
    const size = 28;
    ctx.fillStyle = "#1ca3ec";
    roundRect(ctx, -size / 2, -size / 4, size * 0.8, size * 0.5, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size / 2, 0);
    ctx.lineTo(-size / 2 - 12, -10);
    ctx.lineTo(-size / 2 - 12, 10);
    ctx.closePath();
    ctx.fillStyle = "#0f7acb";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(size * 0.15, -6, 6, 6);
    ctx.fillStyle = "#000";
    ctx.fillRect(size * 0.17 + 1, -5 + 1, 3, 3);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
