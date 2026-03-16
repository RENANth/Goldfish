// Renderer: controla animação do peixe, IA, frases e áudio
(async () => {
  const canvas = document.getElementById('stage');
  const speech = document.getElementById('speech');
  const ctx = canvas.getContext('2d');

  const bounds = await window.api.getScreenBounds();
  canvas.width = bounds.width;
  canvas.height = bounds.height;

  // Config — Otimizado para diversão e caos controlado
  const PHRASE_INTERVAL = 12000; // ms (mais frases!)
  const SOUND_INTERVAL = 18000; // ms (sons mais frequentes)
  const MOUSE_FLEE_DIST = 250;

  const PHRASES = [
    'SALVA ESSE CÓDIGO AGORA.',
    'EU SEI O QUE VOCÊ FEZ.',
    'COMPILA DIREITO.',
    'PARA DE PROCRASTINAR.',
    'VOCÊ NÃO BEBEU ÁGUA.',
    'TESTE UNITÁRIO > DEPURAÇÃO',
    'CLEAN CODE AGORA!',
    'GIT COMMIT -m "WIP"',
    'CTRL+Z VAI SALVAR',
    'CAFÉ NA VEIA 🐟',
    'REFATORE ISSO AÍ',
    'NAO MEXA NO MAIN',
    'STACK OVERFLOW <3',
    'DEBUGAR É ARTE',
    'BEBA ÁGUA! 💧',
    'ARRUMA ESSA POSTURA! 🪑',
    'RESPIRA FUNDO...',
    'DESCANSA OS OLHOS 👀'
  ];

  // Personalidades
  const PERSONALITIES = {
    CALMO: 'calmo',
    TRAVESSO: 'travesso',
    CAOTICO: 'caotico'
  };

  // Fish state
  const fish = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 80, // px/s (mais rápido)
    vy: 0,
    dir: 1, // 1 right, -1 left
    speedBase: 120, // B: aumentado de 80 para movimento mais dinâmico
    personality: PERSONALITIES.TRAVESSO,
    state: 'ocioso',
    skinName: 'goldfish',
    scale: 1.2, // E: escala do peixe (1.0 = tamanho original, 1.2 = 20% maior)
    scaleX: 1.0, // used for squash and stretch
    scaleY: 1.0,
    rotation: 0
  };

  // Sprite / skin support
  const skin = {
    img: new Image(),
    loaded: false,
    cols: 8,
    rows: 2,
    frameW: 64,
    frameH: 64,
    animations: {
      swim: Array.from({ length: 8 }, (_, i) => i),
      bite: [8, 9, 10, 11, 12],
      turn: [13, 14, 15]
    },
    currentAnim: 'swim',
    animTimer: 0,
    animFPS: 10
  };

  // Enhanced Sounds
  function playSound(type) {
    if (type === 'bounce') playBeep(200 + Math.random() * 100, 0.1, 0.04);
    if (type === 'eat') playBeep(1200 + Math.random() * 200, 0.08, 0.1);
    if (type === 'spawn') playBeep(600, 0.05, 0.02);
  }

  // Double-click to feed
  window.addEventListener('dblclick', (e) => {
    spawnFood(e.clientX, e.clientY);
  });

  const foods = [];
  function spawnFood(x, y) {
    playSound('spawn');
    foods.push({ x, y, r: 3, ttl: 15 });
  }

  // Toys
  const toys = [];
  function spawnToy() {
    playSound('spawn');
    toys.push({
      x: canvas.width / 2,
      y: 50,
      vx: rand(-200, 200),
      vy: 100,
      r: 15,
      bounciness: 0.8,
      color: `hsl(${rand(0, 360)}, 80%, 60%)`
    });
  }

  // Particles (bubbles, hearts, zzz)
  const particles = [];
  function createBubble(x, y) {
    particles.push({
      type: 'bubble',
      x: x + rand(-10, 10),
      y: y + rand(-10, 10),
      vx: rand(-10, 10),
      vy: rand(-30, -60),
      r: rand(1, 4),
      ttl: rand(1, 2)
    });
  }

  function createHeart(x, y) {
    particles.push({
      type: 'heart',
      x: x + rand(-15, 15),
      y: y + rand(-15, 15),
      vx: rand(-20, 20),
      vy: rand(-40, -80),
      r: rand(2, 5),
      ttl: rand(1, 1.5)
    });
  }

  function createZzz(x, y) {
    particles.push({
      type: 'zzz',
      x: x + rand(-10, 10),
      y: y - 20,
      vx: rand(-5, 5),
      vy: rand(-20, -40),
      size: rand(8, 14),
      ttl: rand(1.5, 3),
      phase: 0 // for wandering sideways
    });
  }

  // Carrega skin via processo principal (evita falha com file:// no Electron)
  async function loadSkin(name) {
    const { meta: metaFromMain, imageDataUrl, bubblesDataUrl } = await window.api.getSkin(name);

    // Load main fish image
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

    // Load bubbles image if available
    const loadBubbles = new Promise((resolve) => {
      if (bubblesDataUrl) {
        skin.bubblesImg = new Image();
        skin.bubblesImg.onload = () => {
          skin.bubblesLoaded = true;
          // Calculate grid for bubbles (assuming 5 Cols x 4 Rows based on visual)
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

  await loadSkin(fish.skinName);

  // apply display scale from skin meta if present
  if (skin.meta && skin.meta.displayScale) fish.scale = skin.meta.displayScale;

  // Timing
  let last = performance.now();

  // Helpers
  function rand(min, max) { return Math.random() * (max - min) + min }
  function pickPhrase() { return PHRASES[Math.floor(Math.random() * PHRASES.length)]; }

  // show speech bubble near fish
  function speak(text, ttl = 3000) {
    speech.textContent = text;
    speech.classList.remove('hidden');
    speech.active = true;

    // reset timeout
    if (speech.timeoutId) clearTimeout(speech.timeoutId);
    speech.timeoutId = setTimeout(() => {
      speech.classList.add('hidden');
      speech.active = false;
    }, ttl);
  }

  // Audio simple beep using WebAudio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq = 440, time = 0.12, gain = 0.08) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + time);
  }

  // Personality timers — C: muda a cada 1.5-4 min (mais caótico!)
  fish.personalityAuto = true;
  setInterval(() => {
    if (!fish.personalityAuto) return;
    const r = Math.random();
    if (r < 0.33) fish.personality = PERSONALITIES.CALMO;
    else if (r < 0.66) fish.personality = PERSONALITIES.TRAVESSO;
    else fish.personality = PERSONALITIES.CAOTICO;
  }, 1000 * 60 * rand(1.5, 4));

  // Periodic phrases — A: frequência otimizada por personalidade
  setInterval(() => {
    const freq = {
      [PERSONALITIES.CALMO]: 0.3,
      [PERSONALITIES.TRAVESSO]: 0.6,
      [PERSONALITIES.CAOTICO]: 0.95
    }[fish.personality] || 0.5;
    if (Math.random() < freq) speak(pickPhrase());
  }, PHRASE_INTERVAL);

  // Periodic sounds
  setInterval(() => {
    const freqMap = {
      [PERSONALITIES.CALMO]: 600,
      [PERSONALITIES.TRAVESSO]: 900,
      [PERSONALITIES.CAOTICO]: 1200
    }[fish.personality] || 800;
    if (Math.random() < 0.7) playBeep(freqMap, 0.12, 0.06);
  }, SOUND_INTERVAL);

  // Occasionally nudge cursor in CAOTICO — A: mais frequente (0.4 vs 0.25)
  setInterval(async () => {
    if (fish.personality === PERSONALITIES.CAOTICO && Math.random() < 0.4) {
      const dx = rand(-80, 80);
      const dy = rand(-50, 50);
      try { await window.api.robotMove(dx, dy, true); } catch (e) { }
    }
  }, 12000);

  // Animation helper for sprite (no-op if single frame)
  function advanceAnimation(dt) {
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

  // Input tracking for sleep mode
  let lastInteractionTime = performance.now();
  window.addEventListener('mousemove', () => lastInteractionTime = performance.now());
  window.addEventListener('mousedown', () => lastInteractionTime = performance.now());
  window.addEventListener('keydown', () => lastInteractionTime = performance.now());

  // IPC listeners from Context Menu
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
        if (p === 'calmo') fish.personality = PERSONALITIES.CALMO;
        if (p === 'travesso') fish.personality = PERSONALITIES.TRAVESSO;
        if (p === 'caotico') fish.personality = PERSONALITIES.CAOTICO;
      }
      return;
    }

    switch (action) {
      case 'feed':
        spawnFood(canvas.width / 2, 50);
        break;
      case 'spawn-toy':
        spawnToy();
        break;
      case 'sleep':
        // Force sleep
        lastInteractionTime = performance.now() - 60001;
        break;
    }
  });

  let activeWindowRect = null;
  window.api.onActiveWindowBounds((bounds) => {
    // If it's the fullscreen desktop or our own window, ignore it
    if (bounds.left <= 0 && bounds.top <= 0 && bounds.right >= canvas.width && bounds.bottom >= canvas.height) {
      activeWindowRect = null;
      return;
    }
    // Filter out very small popups/tooltips
    if (bounds.right - bounds.left < 200 || bounds.bottom - bounds.top < 200) {
      activeWindowRect = null;
      return;
    }
    activeWindowRect = bounds;
  });

  // Main animation loop
  function frame(now) {
    let dt = (now - last) / 1000;
    if (dt > 0.1) dt = 0.1; // Cap timestep to prevent physics explosion after lag
    last = now;

    const wobble = Math.sin(now / 1000) * 8;

    window.api.getCursorPos().then(pos => {
      const dx = pos.x - fish.x;
      const dy = pos.y - fish.y;
      const dist = Math.hypot(dx, dy);

      // Hit testing for drag & drop
      const halfW = (skin.frameW * fish.scale) / 2;
      const halfH = (skin.frameH * fish.scale) / 2;
      const isOverFish = Math.abs(dx) < halfW && Math.abs(dy) < halfH;

      // Update Electron mouse ignorance
      if (isOverFish || fish.isDragging) {
        window.api.setIgnoreMouse(false);
      } else {
        window.api.setIgnoreMouse(true);
      }

      if (fish.isDragging) {
        const targetX = pos.x;
        const targetY = pos.y;

        // Calculate velocity based on clean positions (pre-shake)
        // Store the previous position to avoid using the "shaken" one
        const prevX = fish.lastCleanX || fish.x;
        const prevY = fish.lastCleanY || fish.y;

        fish.vx = (targetX - prevX) / dt;
        fish.vy = (targetY - prevY) / dt;

        // Store clean position for next frame calculation
        fish.lastCleanX = targetX;
        fish.lastCleanY = targetY;

        // Apply visual shake only to the fish object for this frame
        fish.x = targetX + (Math.random() - 0.5) * 8;
        fish.y = targetY + (Math.random() - 0.5) * 8;

        fish.state = 'capturado';
        skin.animFPS = 25;

        if (skin.loaded && skin.animations.grabbed) {
          skin.currentAnim = 'grabbed';
        }
      } else {
        // Clear clean positions when not dragging
        delete fish.lastCleanX;
        delete fish.lastCleanY;

        // Sleep mode logic
        const timeSinceInteraction = now - lastInteractionTime;
        const isIdle = timeSinceInteraction > 60000; // 1 minute of global mouse idle

        if (isIdle) {
          fish.state = 'dormindo';
          fish.idleTimer = (fish.idleTimer || 0) + dt;

          if (fish.idleTimer > 2) {
            const targetY = canvas.height - (skin.frameH * fish.scale) / 2 + 10;
            const targetX = fish.x; // Stay where it is horizontally

            // Move smoothly to the bottom
            fish.vy += (targetY - fish.y) * 2 * dt;
            fish.vx *= 0.5; // slow down X

            if (Math.abs(fish.y - targetY) < 5) {
              fish.vy = 0;
              fish.y = targetY; // stick to bottom
              // spawn Z's
              if (Math.random() < 0.02) createZzz(fish.x, fish.y);
            }
          }
        } else {
          // Wake up from sleep
          if (fish.state === 'dormindo') {
            fish.state = 'ocioso';
            fish.idleTimer = 0;
            speak('BOM DIA...');
            fish.vy = -150; // little jump when waking up
          }
          fish.idleTimer = 0;
        }

        // Restore normal animation speed
        skin.animFPS = isIdle ? 2 : (skin.meta?.fps || 10);

        if (!isIdle) {
          if (fish.personality === PERSONALITIES.CALMO) {
            if (dist < 80 && Math.random() < 0.02) fish.state = 'curioso';
          } else if (fish.personality === PERSONALITIES.TRAVESSO) {
            if (dist < MOUSE_FLEE_DIST) {
              // B: fuga mais agressiva (800 vs 500)
              const fleeAcc = 800;
              fish.vx += (-dx / dist) * fleeAcc * dt;
              fish.vy += (-dy / dist) * fleeAcc * dt;
              fish.state = 'irritado';
            }
          } else if (fish.personality === PERSONALITIES.CAOTICO) {
            // B: perseguição mais agressiva
            if (dist < 800 && Math.random() < 0.8) {
              const pursueAcc = 320;
              fish.vx += (dx / dist) * pursueAcc * dt;
              fish.vy += (dy / dist) * pursueAcc * dt;
              fish.state = 'energético';
            }
            if (dist < 40 && Math.random() < 0.08) {
              speak('MORDIDA!');
              playBeep(1500, 0.08, 0.12);
              // trigger bite animation
              if (skin.loaded) { skin.currentAnim = 'bite'; skin._animIndex = 0; }
            }
          }

          // physics: natural damping
          fish.vx *= Math.pow(0.9, dt * 10);
          fish.vy *= Math.pow(0.9, dt * 10);

          // Update food and check consumption
          if (foods.length > 0 && !isIdle) {
            const nearestFood = foods[0]; // Simple: go for the first one
            const fdx = nearestFood.x - fish.x;
            const fdy = nearestFood.y - fish.y;
            const fdist = Math.hypot(fdx, fdy);

            if (fdist < 30) {
              foods.shift(); // Eat it!
              playSound('eat');
              for (let i = 0; i < 5; i++) createHeart(fish.x, fish.y);
              fish.mood = 'HAPPY';
              fish.moodTimer = 5;
              fish.hungerTimer = 45; // Reset hunger!
              speak(pickHappyPhrase());
              // force bite animation if loaded
              if (skin.loaded) { skin.currentAnim = 'bite'; skin._animIndex = 0; }
            } else {
              // Chase food
              const chaseAcc = 400;
              fish.vx += (fdx / fdist) * chaseAcc * dt;
              fish.vy += (fdy / fdist) * chaseAcc * dt;
            }
          }

          // speed cap — B: cap aumentado para movimento mais dinâmico
          let speedBase = fish.speedBase;
          const hour = new Date().getHours();
          const isNight = hour >= 22 || hour <= 6;
          if (isNight) speedBase *= 0.6; // slower at night

          const maxSpeed = speedBase + wobble + (fish.personality === PERSONALITIES.CAOTICO ? 100 : 20) + (foods.length > 0 ? 150 : 0);
          const s = Math.hypot(fish.vx, fish.vy);
          if (s > maxSpeed) { fish.vx = (fish.vx / s) * maxSpeed; fish.vy = (fish.vy / s) * maxSpeed; }

          // Normal swimming tilt (fish angles slightly up or down based on vertical velocity)
          const targetRotation = Math.max(-0.6, Math.min(0.6, (fish.vy * 0.003) * fish.dir));
          fish.rotation += (targetRotation - fish.rotation) * 10 * dt;

          // Restore scale smoothly from squish
          fish.scaleX += (1.0 - fish.scaleX) * 8 * dt;
          fish.scaleY += (1.0 - fish.scaleY) * 8 * dt;

          // bubble trail
          if (Math.random() < 0.1) createBubble(fish.x, fish.y);
          particles.forEach((p, i) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.ttl -= dt;
            if (p.ttl <= 0) particles.splice(i, 1);
          });

          // Food particles physics
          foods.forEach((f, i) => {
            f.y += 20 * dt; // Sinks slowly
            f.ttl -= dt;
            if (f.ttl <= 0) foods.splice(i, 1);
          });

          // Edge perching behaviour removed (handled by isIdle global sleep now)
          fish.x += fish.vx * dt;
          fish.y += fish.vy * dt;

          // bounds & bounce sounds with squish effect
          if (fish.x < 20) {
            fish.x = 20;
            if (Math.abs(fish.vx) > 50) {
              playSound('bounce');
              fish.scaleX = 0.6; // Squish inwards
              fish.scaleY = 1.3;
            }
            fish.vx = Math.abs(fish.vx) * 0.7;
          }
          if (fish.x > canvas.width - 20) {
            fish.x = canvas.width - 20;
            if (Math.abs(fish.vx) > 50) {
              playSound('bounce');
              fish.scaleX = 0.6;
              fish.scaleY = 1.3;
            }
            fish.vx = -Math.abs(fish.vx) * 0.7;
          }
          if (fish.y < 20) {
            fish.y = 20;
            if (Math.abs(fish.vy) > 50) {
              playSound('bounce');
              fish.scaleY = 0.6; // Squish flat
              fish.scaleX = 1.3;
            }
            fish.vy = Math.abs(fish.vy) * 0.7;
          }
          if (fish.y > canvas.height - 20) {
            fish.y = canvas.height - 20;
            if (Math.abs(fish.vy) > 50) {
              playSound('bounce');
              fish.scaleY = 0.6; // Squish flat
              fish.scaleX = 1.3;
            }
            fish.vy = -Math.abs(fish.vy) * 0.7;
          }

          // Window Interaction (AABB collision with activeWindowRect)
          if (!isIdle && activeWindowRect) {
            const hw = (skin.frameW * fish.scale) / 2;
            const hh = (skin.frameH * fish.scale) / 2;

            if (fish.x + hw > activeWindowRect.left &&
              fish.x - hw < activeWindowRect.right &&
              fish.y + hh > activeWindowRect.top &&
              fish.y - hh < activeWindowRect.bottom) {

              const distTop = Math.abs(fish.y + hh - activeWindowRect.top);
              const distBottom = Math.abs(fish.y - hh - activeWindowRect.bottom);
              const distLeft = Math.abs(fish.x + hw - activeWindowRect.left);
              const distRight = Math.abs(fish.x - hw - activeWindowRect.right);

              // Find valid escape routes that don't push the fish off-screen
              let validEscapes = [];
              if (activeWindowRect.top - hh >= 20) validEscapes.push({ dist: distTop, side: 'top', target: activeWindowRect.top - hh });
              if (activeWindowRect.bottom + hh <= canvas.height - 20) validEscapes.push({ dist: distBottom, side: 'bottom', target: activeWindowRect.bottom + hh });
              if (activeWindowRect.left - hw >= 20) validEscapes.push({ dist: distLeft, side: 'left', target: activeWindowRect.left - hw });
              if (activeWindowRect.right + hw <= canvas.width - 20) validEscapes.push({ dist: distRight, side: 'right', target: activeWindowRect.right + hw });

              if (validEscapes.length > 0) {
                validEscapes.sort((a, b) => a.dist - b.dist);
                const best = validEscapes[0];
                if (best.side === 'top') {
                  fish.y = best.target;
                  if (fish.vy > 0) {
                    fish.vy *= -0.5;
                    if (Math.abs(fish.vy) > 50) { playSound('bounce'); fish.scaleY = 0.6; fish.scaleX = 1.3; }
                  }
                } else if (best.side === 'bottom') {
                  fish.y = best.target;
                  if (fish.vy < 0) {
                    fish.vy *= -0.5;
                    if (Math.abs(fish.vy) > 50) { playSound('bounce'); fish.scaleY = 0.6; fish.scaleX = 1.3; }
                  }
                } else if (best.side === 'left') {
                  fish.x = best.target;
                  if (fish.vx > 0) {
                    fish.vx *= -0.5;
                    if (Math.abs(fish.vx) > 50) { playSound('bounce'); fish.scaleX = 0.6; fish.scaleY = 1.3; }
                  }
                } else if (best.side === 'right') {
                  fish.x = best.target;
                  if (fish.vx < 0) {
                    fish.vx *= -0.5;
                    if (Math.abs(fish.vx) > 50) { playSound('bounce'); fish.scaleX = 0.6; fish.scaleY = 1.3; }
                  }
                }
              }
            }
          }

          fish.dir = fish.vx >= 0 ? 1 : -1;

          // occasionally accelerate — B: mais agressivo (0.01 vs 0.005)
          if (!isIdle && Math.random() < 0.01) {
            const boost = rand(150, 300);
            fish.vx += fish.dir * boost * 0.8;
            fish.vy += rand(-60, 60);
          }

          // handle animations
          if (skin.loaded) {
            // if bite animation finished, return to swim
            const anim = skin.animations[skin.currentAnim] || skin.animations.swim;
            if (skin.currentAnim === 'bite') {
              // if at last frame, switch back
              if ((skin._animIndex || 0) >= anim.length - 1 && Math.random() < 0.5) skin.currentAnim = 'swim';
            }
            advanceAnimation(dt);
          }
        }
      } // <--- CLOSE THE ELSE BLOCK!

      // Drawing (always happens)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Keep speech bubble attached to fish
      if (speech.active) {
        speech.style.left = fish.x + 'px';
        speech.style.top = (fish.y - (skin.loaded ? (skin.frameH * fish.scale) / 2 + 15 : 40)) + 'px';
      }

      // Update mood timers
      if (fish.moodTimer > 0) {
        fish.moodTimer -= dt;
      } else {
        fish.mood = 'NORMAL';
      }

      // Check for DIZZY mood (high speed)
      if (Math.hypot(fish.vx, fish.vy) > 600) {
        fish.mood = 'DIZZY';
        fish.moodTimer = 2;
      }

      // draw particles (bubbles, hearts, zzz)
      particles.forEach(p => {
        if (p.type === 'bubble') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'heart') {
          ctx.fillStyle = '#ff4b4b';
          ctx.font = `${p.r * 4}px Arial`;
          ctx.fillText('❤', p.x, p.y);
        } else if (p.type === 'zzz') {
          p.phase += dt * 5;
          const px = p.x + Math.sin(p.phase) * 5;
          ctx.fillStyle = `rgba(200, 200, 255, ${Math.min(1, p.ttl)})`;
          ctx.font = `bold ${p.size}px monospace`;
          ctx.fillText('z', px, p.y);
        }
      });

      // Food particles physics
      foods.forEach((f, i) => {
        f.y += 20 * dt; // Sinks slowly
        f.ttl -= dt;
        if (f.ttl <= 0) foods.splice(i, 1);
      });

      // Toy physics & collision
      toys.forEach(t => {
        t.vy += 600 * dt; // Gravity
        t.x += t.vx * dt;
        t.y += t.vy * dt;

        t.vx *= Math.pow(0.99, dt * 10);

        // Floor bounce
        if (t.y > canvas.height - t.r) {
          t.y = canvas.height - t.r;
          t.vy *= -t.bounciness;
          t.vx *= 0.95; // Ground friction
        }
        // Walls
        if (t.x < t.r) { t.x = t.r; t.vx *= -t.bounciness; }
        if (t.x > canvas.width - t.r) { t.x = canvas.width - t.r; t.vx *= -t.bounciness; }

        // Fish collision
        if (!isIdle && !fish.isDragging) {
          const tdx = t.x - fish.x;
          const tdy = t.y - fish.y;
          // Protect tdist calculation from exactly zero
          const tdist = Math.hypot(tdx, tdy) || 0.001;

          const combinedR = t.r + (skin.frameW * (fish.scale || 1)) / 3;

          if (tdist < combinedR) {
            // Resolve overlap
            const overlap = combinedR - tdist;

            // Generate valid normal vectors even on exact overlap (px=0, py=0)
            const nx = tdist > 0.1 ? tdx / tdist : 0;
            const ny = tdist > 0.1 ? tdy / tdist : -1;

            t.x += nx * overlap;
            t.y += ny * overlap;

            // Bounce off fish (transfer velocity)
            const relVx = t.vx - (fish.vx || 0);
            const relVy = t.vy - (fish.vy || 0);
            const dot = relVx * nx + relVy * ny;

            if (dot < 0) {
              const impulse = -(1 + t.bounciness) * dot;
              t.vx += nx * impulse * 0.8;
              t.vy += ny * impulse * 0.8;
              // Push fish slightly back
              fish.vx -= nx * impulse * 0.2;
              fish.vy -= ny * impulse * 0.2;

              if (Math.random() < 0.2) speak('WEEEE!');
              fish.state = 'energético';
            }
          }
        }
      });

      // draw food

      // draw toys
      toys.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // shine highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // draw food (now over toys)
      ctx.fillStyle = '#ffcc00';
      foods.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        // additive glow for more visibility
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ffcc00';
      });
      ctx.shadowBlur = 0;

      drawFish(ctx, fish);
    });

    requestAnimationFrame(frame);
  }

  const HAPPY_PHRASES = ["NHAM NHAM!", "QUE DELÍCIA!", "TÔ FELIZ!", "OBRIGADO!", "❤"];
  function pickHappyPhrase() { return HAPPY_PHRASES[Math.floor(Math.random() * HAPPY_PHRASES.length)]; }

  function drawFish(ctx, f) {
    ctx.save();

    // Apply Mood Filters
    if (f.mood === 'HAPPY') ctx.filter = 'brightness(1.2) saturate(1.5)';
    if (f.mood === 'DIZZY') ctx.filter = 'hue-rotate(90deg) opacity(0.8)';
    if (f.mood === 'HUNGRY') ctx.filter = 'grayscale(0.5) contrast(0.8)';

    ctx.translate(f.x, f.y);
    // apply optional draw offset from skin meta
    ctx.translate(skin.drawOffsetX || 0, skin.drawOffsetY || 0);

    // Apply squish scales
    ctx.scale(f.scaleX, f.scaleY);

    // Tilt while dragging or swimming organically
    if (f.isDragging) {
      const tilt = Math.max(-0.4, Math.min(0.4, f.vy * 0.005));
      ctx.rotate(tilt * f.dir);
    } else {
      ctx.rotate(f.rotation);
    }

    ctx.scale(f.dir, 1);
    ctx.scale(f.scale, f.scale);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
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
      // fallback simple pixel-art style fish
      const size = 28;
      ctx.fillStyle = '#1ca3ec';
      roundRect(ctx, -size / 2, -size / 4, size * 0.8, size * 0.5, 6);
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(-size / 2, 0); ctx.lineTo(-size / 2 - 12, -10); ctx.lineTo(-size / 2 - 12, 10); ctx.closePath(); ctx.fillStyle = '#0f7acb'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(size * 0.15, -6, 6, 6); ctx.fillStyle = '#000'; ctx.fillRect(size * 0.17 + 1, -5 + 1, 3, 3);
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

  // Start loop
  requestAnimationFrame(frame);

  // Resize handler
  window.addEventListener('resize', async () => {
    const b = await window.api.getScreenBounds();
    canvas.width = b.width; canvas.height = b.height;
  });

  // Drag & Drop handlers
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

  // Drag and drop for Trash 
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dx = e.clientX - fish.x;
    const dy = e.clientY - fish.y;
    const halfW = (skin.frameW * fish.scale) / 2;
    const halfH = (skin.frameH * fish.scale) / 2;

    // Check if dragging over fish
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
          if (result.ok) {
            console.log('Comido!', file.name);
          } else {
            console.error('Falhou ao comer:', result.reason);
          }
        }
        speak("NHAM! GOSTOSO");
        if (skin.loaded && skin.animations.bite) { skin.currentAnim = 'bite'; skin._animIndex = 0; }
      }
    }
  });

})();
