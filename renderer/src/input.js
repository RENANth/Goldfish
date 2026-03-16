import { fish, skin, globals, setInteractionTime } from './state.js';
import { spawnFood, spawnToy, createHeart } from './particles.js';
import { loadSkin } from './fish.js';
import { CONFIG } from './config.js';
import { playSound } from './audio.js';
import { speak } from './speech.js';

export function initInput() {
    window.addEventListener('dblclick', (e) => {
        spawnFood(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', () => setInteractionTime());
    window.addEventListener('mousedown', () => setInteractionTime());
    window.addEventListener('keydown', () => setInteractionTime());

    window.api.onContextMenuAction(async (action) => {
        if (action.startsWith('set-skin:')) {
            const skinName = action.split(':')[1];
            fish.skinName = skinName;
            await loadSkin(skinName);
            if (skin.loaded) skin.currentAnim = 'swim';
            return;
        }
        if (action.startsWith('set-personality:')) {
            const p = action.split(':')[1];
            if (p === 'aleatoria') {
                fish.personalityAuto = true;
            } else {
                fish.personalityAuto = false;
                if (p === 'calmo') fish.personality = CONFIG.PERSONALITIES.CALMO;
                if (p === 'travesso') fish.personality = CONFIG.PERSONALITIES.TRAVESSO;
                if (p === 'caotico') fish.personality = CONFIG.PERSONALITIES.CAOTICO;
            }
            return;
        }

        switch (action) {
            case 'feed':
                if (globals.canvas) spawnFood(globals.canvas.width / 2, 50);
                break;
            case 'spawn-toy':
                if (globals.canvas) spawnToy(globals.canvas);
                break;
            case 'sleep':
                globals.lastInteractionTime = performance.now() - 60001;
                break;
        }
    });

    window.api.onActiveWindowBounds((bounds) => {
        if (!globals.canvas) return;
        if (bounds.left <= 0 && bounds.top <= 0 && bounds.right >= globals.canvas.width && bounds.bottom >= globals.canvas.height) {
            globals.activeWindowRect = null;
            return;
        }
        if (bounds.right - bounds.left < 200 || bounds.bottom - bounds.top < 200) {
            globals.activeWindowRect = null;
            return;
        }
        globals.activeWindowRect = bounds;
    });

    window.addEventListener('mousedown', (e) => {
        const dx = e.clientX - fish.x;
        const dy = e.clientY - fish.y;
        const halfW = (skin.frameW * fish.scale) / 2;
        const halfH = (skin.frameH * fish.scale) / 2;
        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
            fish.isDragging = true;
        }
    });

    window.addEventListener('mouseup', () => {
        if (fish.isDragging) {
            fish.isDragging = false;
            if (skin.loaded) skin.currentAnim = 'swim';
        }
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dx = e.clientX - fish.x;
        const dy = e.clientY - fish.y;
        const halfW = (skin.frameW * fish.scale) / 2;
        const halfH = (skin.frameH * fish.scale) / 2;
        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
            if (skin.loaded && skin.animations.bite) skin.currentAnim = 'bite';
            fish.state = 'curioso';
        } else {
            if (skin.loaded && skin.currentAnim === 'bite') skin.currentAnim = 'swim';
        }
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (skin.loaded && skin.currentAnim === 'bite') skin.currentAnim = 'swim';
    });

    window.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (skin.loaded && skin.currentAnim === 'bite') skin.currentAnim = 'swim';
        const dx = e.clientX - fish.x;
        const dy = e.clientY - fish.y;
        const halfW = (skin.frameW * fish.scale) / 2;
        const halfH = (skin.frameH * fish.scale) / 2;
        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                playSound('eat');
                for (let i = 0; i < 5; i++) createHeart(fish.x, fish.y);
                fish.scaleX = 1.3;
                fish.scaleY = 0.7;
                for (const file of e.dataTransfer.files) {
                    const result = await window.api.trashItem(file.path);
                    if (result.ok) console.log('Comido!', file.name);
                    else console.error('Falhou ao comer:', result.reason);
                }
                speak("NHAM! GOSTOSO");
                if (skin.loaded && skin.animations.bite) { skin.currentAnim = 'bite'; skin._animIndex = 0; }
            }
        }
    });

    window.addEventListener('resize', async () => {
        const b = await window.api.getScreenBounds();
        if (globals.canvas) {
            globals.canvas.width = b.width;
            globals.canvas.height = b.height;
        }
    });
}
