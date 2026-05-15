document.addEventListener('DOMContentLoaded', () => {
  const chars = document.querySelectorAll('.char');
  const cursor = document.getElementById('cursor');
  const glowBg = document.getElementById('glow-bg');

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const lerpedCursor = { x: mouse.x, y: mouse.y };
  let origins = [];
  let scatterActive = false;

  const states = Array.from(chars).map((_, i) => ({
    magX: 0, magY: 0,
    tgtX: 0, tgtY: 0,
    glow: 0, tgtGlow: 0,
    idlePhase: (i / chars.length) * Math.PI * 2,
  }));

  function measureOrigins() {
    gsap.set(chars, { x: 0, y: 0 });
    origins = Array.from(chars).map(char => {
      const r = char.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  }

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (!scatterActive && origins.length) {
      chars.forEach((_, i) => {
        const dx = mouse.x - origins[i].x;
        const dy = mouse.y - origins[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 220;

        if (dist < maxDist) {
          const pull = (1 - dist / maxDist) * 0.5;
          states[i].tgtX = dx * pull;
          states[i].tgtY = dy * pull;
          states[i].tgtGlow = 1 - dist / maxDist;
        } else {
          states[i].tgtX = 0;
          states[i].tgtY = 0;
          states[i].tgtGlow = 0;
        }
      });
    }
  });

  document.addEventListener('click', () => {
    if (scatterActive) return;
    scatterActive = true;

    const tl = gsap.timeline({
      onComplete: () => {
        scatterActive = false;
        states.forEach(s => { s.magX = 0; s.magY = 0; s.tgtX = 0; s.tgtY = 0; });
      }
    });

    chars.forEach((char, i) => {
      const angle = (i / chars.length) * Math.PI * 2 + (Math.random() - 0.5) * 1.5;
      const dist = 200 + Math.random() * 260;
      tl.to(char, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rotation: (Math.random() - 0.5) * 720,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
      }, 0);
    });

    tl.to(chars, {
      x: 0, y: 0, rotation: 0, opacity: 1,
      stagger: { amount: 0.4, from: 'center' },
      ease: 'elastic.out(1, 0.5)',
      duration: 1.6,
    }, '+=0.08');
  });

  // Cursor + glow — always running
  gsap.ticker.add(() => {
    lerpedCursor.x += (mouse.x - lerpedCursor.x) * 0.12;
    lerpedCursor.y += (mouse.y - lerpedCursor.y) * 0.12;
    gsap.set(cursor, { x: lerpedCursor.x, y: lerpedCursor.y });
    gsap.set(glowBg, { x: mouse.x, y: mouse.y });
  });

  // Magnetic + idle tick — starts after entry animation
  function magneticTick(time) {
    if (scatterActive) return;

    states.forEach((s, i) => {
      const char = chars[i];

      s.magX += (s.tgtX - s.magX) * 0.1;
      s.magY += (s.tgtY - s.magY) * 0.1;
      s.glow += (s.tgtGlow - s.glow) * 0.08;

      const idleY = Math.sin(time * 1.1 + s.idlePhase) * 7;

      gsap.set(char, { x: s.magX, y: s.magY + idleY });

      const g = s.glow;
      if (g > 0.01) {
        char.style.color = `rgb(${Math.round(244 + 11 * g)},${Math.round(140 + 72 * g)},${Math.round(6 + 38 * g)})`;
        char.style.textShadow = [
          `0 0 ${20 * g}px rgba(244,140,6,${0.95 * g})`,
          `0 0 ${55 * g}px rgba(244,140,6,${0.55 * g})`,
          `0 0 ${110 * g}px rgba(244,140,6,${0.28 * g})`,
        ].join(', ');
      } else {
        char.style.color = '';
        char.style.textShadow = '';
      }
    });
  }

  function startInteractivity() {
    measureOrigins();
    window.addEventListener('resize', measureOrigins);
    gsap.ticker.add(magneticTick);
  }

  // Entry animation
  gsap.set(chars, { opacity: 0, y: 70, scale: 0.7, rotation: -8 });
  gsap.to(chars, {
    opacity: 1, y: 0, scale: 1, rotation: 0,
    duration: 1.4,
    stagger: 0.09,
    ease: 'elastic.out(1, 0.55)',
    delay: 0.25,
    onComplete: startInteractivity,
  });

  // Touch: restore default cursor
  window.addEventListener('touchstart', () => {
    cursor.style.display = 'none';
    document.body.style.cursor = 'auto';
  }, { once: true });
});
