import { fish, skin, foods, toys, particles, globals, rand } from './state.js';
import { playSound } from './audio.js';
import { speak, pickHappyPhrase } from './speech.js';
import { createBubble, createHeart, createZzz } from './particles.js';
import { CONFIG } from './config.js';
import { advanceAnimation } from './fish.js';

export async function updatePhysics(dt, now) {
    if (!globals.canvas) return;
    const canvas = globals.canvas;
    const wobble = Math.sin(now / 1000) * 8;

    const pos = await window.api.getCursorPos();
    const dx = pos.x - fish.x;
    const dy = pos.y - fish.y;
    const dist = Math.hypot(dx, dy);

    const halfW = (skin.frameW * fish.scale) / 2;
    const halfH = (skin.frameH * fish.scale) / 2;
    const isOverFish = Math.abs(dx) < halfW && Math.abs(dy) < halfH;

    if (isOverFish || fish.isDragging) {
        window.api.setIgnoreMouse(false);
    } else {
        window.api.setIgnoreMouse(true);
    }

    if (fish.isDragging) {
        const targetX = pos.x;
        const targetY = pos.y;

        const prevX = fish.lastCleanX || fish.x;
        const prevY = fish.lastCleanY || fish.y;

        fish.vx = (targetX - prevX) / dt;
        fish.vy = (targetY - prevY) / dt;

        fish.lastCleanX = targetX;
        fish.lastCleanY = targetY;

        fish.x = targetX + (Math.random() - 0.5) * 8;
        fish.y = targetY + (Math.random() - 0.5) * 8;

        fish.state = 'capturado';
        skin.animFPS = 25;

        if (skin.loaded && skin.animations.grabbed) {
            skin.currentAnim = 'grabbed';
        }
    } else {
        delete fish.lastCleanX;
        delete fish.lastCleanY;

        const timeSinceInteraction = now - globals.lastInteractionTime;
        const isIdle = timeSinceInteraction > 60000;

        if (isIdle) {
            fish.state = 'dormindo';
            fish.idleTimer = (fish.idleTimer || 0) + dt;

            if (fish.idleTimer > 2) {
                const targetY = canvas.height - (skin.frameH * fish.scale) / 2 + 10;

                fish.vy += (targetY - fish.y) * 2 * dt;
                fish.vx *= 0.5;

                if (Math.abs(fish.y - targetY) < 5) {
                    fish.vy = 0;
                    fish.y = targetY;
                    if (Math.random() < 0.02) createZzz(fish.x, fish.y);
                }
            }
        } else {
            if (fish.state === 'dormindo') {
                fish.state = 'ocioso';
                fish.idleTimer = 0;
                speak('BOM DIA...');
                fish.vy = -150;
            }
            fish.idleTimer = 0;
        }

        skin.animFPS = isIdle ? 2 : (skin.meta?.fps || 10);

        if (!isIdle) {
            if (fish.personality === CONFIG.PERSONALITIES.CALMO) {
                if (dist < 80 && Math.random() < 0.02) fish.state = 'curioso';
            } else if (fish.personality === CONFIG.PERSONALITIES.TRAVESSO) {
                if (dist < CONFIG.MOUSE_FLEE_DIST) {
                    const fleeAcc = 800;
                    fish.vx += (-dx / dist) * fleeAcc * dt;
                    fish.vy += (-dy / dist) * fleeAcc * dt;
                    fish.state = 'irritado';
                }
            } else if (fish.personality === CONFIG.PERSONALITIES.CAOTICO) {
                if (dist < 800 && Math.random() < 0.8) {
                    const pursueAcc = 320;
                    fish.vx += (dx / dist) * pursueAcc * dt;
                    fish.vy += (dy / dist) * pursueAcc * dt;
                    fish.state = 'energético';
                }
                if (dist < 40 && Math.random() < 0.08) {
                    speak('MORDIDA!');
                    playSound('bounce'); // Reuse bounce sound with pitch for bite
                    if (skin.loaded && skin.animations.bite) { skin.currentAnim = 'bite'; skin._animIndex = 0; }
                }
            }

            fish.vx *= Math.pow(0.9, dt * 10);
            fish.vy *= Math.pow(0.9, dt * 10);

            if (foods.length > 0 && !isIdle) {
                const nearestFood = foods[0];
                const fdx = nearestFood.x - fish.x;
                const fdy = nearestFood.y - fish.y;
                const fdist = Math.hypot(fdx, fdy);

                if (fdist < 30) {
                    foods.shift();
                    playSound('eat');
                    for (let i = 0; i < 5; i++) createHeart(fish.x, fish.y);
                    fish.mood = 'HAPPY';
                    fish.moodTimer = 5;
                    fish.hungerTimer = 45;
                    speak(pickHappyPhrase());
                    if (skin.loaded && skin.animations.bite) { skin.currentAnim = 'bite'; skin._animIndex = 0; }
                } else {
                    const chaseAcc = 400;
                    fish.vx += (fdx / fdist) * chaseAcc * dt;
                    fish.vy += (fdy / fdist) * chaseAcc * dt;
                }
            }

            let speedBase = fish.speedBase;
            const hour = new Date().getHours();
            const isNight = hour >= 22 || hour <= 6;
            if (isNight) speedBase *= 0.6;

            const maxSpeed = speedBase + wobble + (fish.personality === 'caotico' ? 100 : 20) + (foods.length > 0 ? 150 : 0);
            const s = Math.hypot(fish.vx, fish.vy);
            if (s > maxSpeed) { fish.vx = (fish.vx / s) * maxSpeed; fish.vy = (fish.vy / s) * maxSpeed; }

            const targetRotation = Math.max(-0.6, Math.min(0.6, (fish.vy * 0.003) * fish.dir));
            fish.rotation += (targetRotation - fish.rotation) * 10 * dt;

            fish.scaleX += (1.0 - fish.scaleX) * 8 * dt;
            fish.scaleY += (1.0 - fish.scaleY) * 8 * dt;

            if (Math.random() < 0.1) createBubble(fish.x, fish.y);
            particles.forEach((p, i) => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.ttl -= dt;
                if (p.ttl <= 0) particles.splice(i, 1);
                if (p.type === 'zzz') p.phase += dt * 5;
            });

            foods.forEach((f, i) => {
                f.y += 20 * dt;
                f.ttl -= dt;
                if (f.ttl <= 0) foods.splice(i, 1);
            });

            fish.x += fish.vx * dt;
            fish.y += fish.vy * dt;

            if (fish.x < 20) {
                fish.x = 20;
                if (Math.abs(fish.vx) > 50) { playSound('bounce'); fish.scaleX = 0.6; fish.scaleY = 1.3; }
                fish.vx = Math.abs(fish.vx) * 0.7;
            }
            if (fish.x > canvas.width - 20) {
                fish.x = canvas.width - 20;
                if (Math.abs(fish.vx) > 50) { playSound('bounce'); fish.scaleX = 0.6; fish.scaleY = 1.3; }
                fish.vx = -Math.abs(fish.vx) * 0.7;
            }
            if (fish.y < 20) {
                fish.y = 20;
                if (Math.abs(fish.vy) > 50) { playSound('bounce'); fish.scaleY = 0.6; fish.scaleX = 1.3; }
                fish.vy = Math.abs(fish.vy) * 0.7;
            }
            if (fish.y > canvas.height - 20) {
                fish.y = canvas.height - 20;
                if (Math.abs(fish.vy) > 50) { playSound('bounce'); fish.scaleY = 0.6; fish.scaleX = 1.3; }
                fish.vy = -Math.abs(fish.vy) * 0.7;
            }

            if (!isIdle && globals.activeWindowRect) {
                const aw = globals.activeWindowRect;
                if (fish.x + halfW > aw.left && fish.x - halfW < aw.right &&
                    fish.y + halfH > aw.top && fish.y - halfH < aw.bottom) {

                    const distTop = Math.abs(fish.y + halfH - aw.top);
                    const distBottom = Math.abs(fish.y - halfH - aw.bottom);
                    const distLeft = Math.abs(fish.x + halfW - aw.left);
                    const distRight = Math.abs(fish.x - halfW - aw.right);

                    let validEscapes = [];
                    if (aw.top - halfH >= 20) validEscapes.push({ dist: distTop, side: 'top', target: aw.top - halfH });
                    if (aw.bottom + halfH <= canvas.height - 20) validEscapes.push({ dist: distBottom, side: 'bottom', target: aw.bottom + halfH });
                    if (aw.left - halfW >= 20) validEscapes.push({ dist: distLeft, side: 'left', target: aw.left - halfW });
                    if (aw.right + halfW <= canvas.width - 20) validEscapes.push({ dist: distRight, side: 'right', target: aw.right + halfW });

                    if (validEscapes.length > 0) {
                        validEscapes.sort((a, b) => a.dist - b.dist);
                        const best = validEscapes[0];
                        if (best.side === 'top') {
                            fish.y = best.target;
                            if (fish.vy > 0) { fish.vy *= -0.5; if (Math.abs(fish.vy) > 50) { playSound('bounce'); fish.scaleY = 0.6; fish.scaleX = 1.3; } }
                        } else if (best.side === 'bottom') {
                            fish.y = best.target;
                            if (fish.vy < 0) { fish.vy *= -0.5; if (Math.abs(fish.vy) > 50) { playSound('bounce'); fish.scaleY = 0.6; fish.scaleX = 1.3; } }
                        } else if (best.side === 'left') {
                            fish.x = best.target;
                            if (fish.vx > 0) { fish.vx *= -0.5; if (Math.abs(fish.vx) > 50) { playSound('bounce'); fish.scaleX = 0.6; fish.scaleY = 1.3; } }
                        } else if (best.side === 'right') {
                            fish.x = best.target;
                            if (fish.vx < 0) { fish.vx *= -0.5; if (Math.abs(fish.vx) > 50) { playSound('bounce'); fish.scaleX = 0.6; fish.scaleY = 1.3; } }
                        }
                    }
                }
            }

            fish.dir = fish.vx >= 0 ? 1 : -1;

            if (!isIdle && Math.random() < 0.01) {
                const boost = rand(150, 300);
                fish.vx += fish.dir * boost * 0.8;
                fish.vy += rand(-60, 60);
            }

            if (skin.loaded) {
                const anim = skin.animations[skin.currentAnim] || [];
                if (skin.currentAnim === 'bite') {
                    if ((skin._animIndex || 0) >= anim.length - 1 && Math.random() < 0.5) skin.currentAnim = 'swim';
                }
                advanceAnimation(dt);
            }
        }
    }

    if (fish.moodTimer > 0) {
        fish.moodTimer -= dt;
    } else {
        fish.mood = 'NORMAL';
    }

    if (Math.hypot(fish.vx, fish.vy) > 600) {
        fish.mood = 'DIZZY';
        fish.moodTimer = 2;
    }

    toys.forEach(t => {
        t.vy += 600 * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;

        t.vx *= Math.pow(0.99, dt * 10);

        if (t.y > canvas.height - t.r) {
            t.y = canvas.height - t.r;
            t.vy *= -t.bounciness;
            t.vx *= 0.95;
        }
        if (t.x < t.r) { t.x = t.r; t.vx *= -t.bounciness; }
        if (t.x > canvas.width - t.r) { t.x = canvas.width - t.r; t.vx *= -t.bounciness; }

        if (!fish.isDragging && fish.state !== 'dormindo') {
            const tdx = t.x - fish.x;
            const tdy = t.y - fish.y;
            const tdist = Math.hypot(tdx, tdy) || 0.001;
            const combinedR = t.r + (skin.frameW * (fish.scale || 1)) / 3;

            if (tdist < combinedR) {
                const overlap = combinedR - tdist;
                const nx = tdist > 0.1 ? tdx / tdist : 0;
                const ny = tdist > 0.1 ? tdy / tdist : -1;

                t.x += nx * overlap;
                t.y += ny * overlap;

                const relVx = t.vx - (fish.vx || 0);
                const relVy = t.vy - (fish.vy || 0);
                const dot = relVx * nx + relVy * ny;

                if (dot < 0) {
                    const impulse = -(1 + t.bounciness) * dot;
                    t.vx += nx * impulse * 0.8;
                    t.vy += ny * impulse * 0.8;
                    fish.vx -= nx * impulse * 0.2;
                    fish.vy -= ny * impulse * 0.2;

                    if (Math.random() < 0.2) speak('WEEEE!');
                    fish.state = 'energético';
                }
            }
        }
    });

}
