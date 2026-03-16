import { fish, skin } from './state.js';

export async function loadSkin(name) {
    const { meta: metaFromMain, imageDataUrl, bubblesDataUrl } = await window.api.getSkin(name);

    const loadFish = new Promise((resolve) => {
        if (!imageDataUrl) { skin.loaded = false; resolve(false); return; }
        skin.img.onload = () => {
            if (skin.cols > 0 && skin.rows > 0) {
                skin.frameW = Math.floor(skin.img.width / skin.cols);
                skin.frameH = Math.floor(skin.img.height / skin.rows);
            } else {
                skin.frameW = skin.img.width;
                skin.frameH = skin.img.height;
                skin.cols = 1;
                skin.rows = 1;
            }
            skin.loaded = true;
            resolve(true);
        };
        skin.img.onerror = () => { skin.loaded = false; resolve(false); };
        skin.img.src = imageDataUrl;
    });

    const loadBubbles = new Promise((resolve) => {
        if (bubblesDataUrl) {
            skin.bubblesImg = new Image();
            skin.bubblesImg.onload = () => {
                skin.bubblesLoaded = true;
                skin.bubbleFrameW = Math.floor(skin.bubblesImg.width / 5);
                skin.bubbleFrameH = Math.floor(skin.bubblesImg.height / 4);
                resolve(true);
            };
            skin.bubblesImg.onerror = () => { skin.bubblesLoaded = false; resolve(false); };
            skin.bubblesImg.src = bubblesDataUrl;
        } else {
            skin.bubblesLoaded = false;
            resolve(true);
        }
    });

    if (metaFromMain && Object.keys(metaFromMain).length) {
        skin.meta = metaFromMain;
        skin.cols = metaFromMain.cols || skin.cols;
        skin.rows = metaFromMain.rows || skin.rows;
        skin.animations = Object.assign(skin.animations, metaFromMain.animations || {});
        skin.animFPS = metaFromMain.fps || skin.animFPS;
        skin.drawOffsetX = (metaFromMain.drawOffset && metaFromMain.drawOffset.x) || 0;
        skin.drawOffsetY = (metaFromMain.drawOffset && metaFromMain.drawOffset.y) || 0;
        skin.frameInset = Math.max(0, metaFromMain.frameInset || 0);
    }

    return Promise.all([loadFish, loadBubbles]);
}

export function advanceAnimation(dt) {
    if (!skin.loaded) return;
    const anim = skin.animations[skin.currentAnim] || skin.animations.swim;
    if (anim.length <= 1) return; // single frame, no animation
    skin.animTimer += dt;
    const frameTime = 1 / skin.animFPS;
    if (skin.animTimer >= frameTime) {
        const steps = Math.floor(skin.animTimer / frameTime);
        skin.animTimer -= steps * frameTime;
        skin._animIndex = ((skin._animIndex || 0) + steps) % anim.length;
    }
}
