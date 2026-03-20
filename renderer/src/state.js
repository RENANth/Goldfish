import { CONFIG } from "./config.js";

export const fish = {
  x: 0,
  y: 0,
  vx: 80,
  vy: 0,
  dir: 1,
  speedBase: 120,
  personality: CONFIG.PERSONALITIES.TRAVESSO,
  state: "ocioso",
  skinName: "goldfish",
  scale: 1.2,
  scaleX: 1.0,
  scaleY: 1.0,
  rotation: 0,
  isDragging: false,
  mood: "NORMAL",
  moodTimer: 0,
  hungerTimer: 0,
  idleTimer: 0,
  personalityAuto: true,
};

export const skin = {
  img: new Image(),
  loaded: false,
  cols: 8,
  rows: 2,
  frameW: 64,
  frameH: 64,
  animations: {
    swim: Array.from({ length: 8 }, (_, i) => i),
    bite: [8, 9, 10, 11, 12],
    turn: [13, 14, 15],
  },
  currentAnim: "swim",
  animTimer: 0,
  animFPS: 10,
};

export const foods = [];
export const toys = [];
export const particles = [];

export const globals = {
  lastInteractionTime: performance.now(),
  activeWindowRect: null,
  canvas: null,
  ctx: null,
  lastTime: performance.now(),
};

export function setInteractionTime() {
  globals.lastInteractionTime = performance.now();
}

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}
