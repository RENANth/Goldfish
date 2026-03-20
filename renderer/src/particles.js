import { particles, foods, toys, rand } from "./state.js";
import { playSound } from "./audio.js";

export function spawnFood(x, y) {
  playSound("spawn");
  foods.push({ x, y, r: 3, ttl: 15 });
}

export function spawnToy(canvas) {
  playSound("spawn");
  toys.push({
    x: canvas.width / 2,
    y: 50,
    vx: rand(-200, 200),
    vy: 100,
    r: 15,
    bounciness: 0.8,
    color: `hsl(${rand(0, 360)}, 80%, 60%)`,
  });
}

export function createBubble(x, y) {
  particles.push({
    type: "bubble",
    x: x + rand(-10, 10),
    y: y + rand(-10, 10),
    vx: rand(-10, 10),
    vy: rand(-30, -60),
    r: rand(1, 4),
    ttl: rand(1, 2),
  });
}

export function createHeart(x, y) {
  particles.push({
    type: "heart",
    x: x + rand(-15, 15),
    y: y + rand(-15, 15),
    vx: rand(-20, 20),
    vy: rand(-40, -80),
    r: rand(2, 5),
    ttl: rand(1, 1.5),
  });
}

export function createZzz(x, y) {
  particles.push({
    type: "zzz",
    x: x + rand(-10, 10),
    y: y - 20,
    vx: rand(-5, 5),
    vy: rand(-20, -40),
    size: rand(8, 14),
    ttl: rand(1.5, 3),
    phase: 0,
  });
}
