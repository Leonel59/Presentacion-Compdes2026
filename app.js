(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.getElementById('slide-counter');
  const progress = document.getElementById('progress');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const fsBtn = document.getElementById('fs-btn');
  let index = 0;

  const clamp = (value) => Math.max(0, Math.min(slides.length - 1, value));

  const goTo = (next) => {
    index = clamp(next);
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
    history.replaceState(null, '', `#slide-${index + 1}`);
  };

  const fromHash = () => {
    const match = location.hash.match(/slide-(\d+)/i);
    if (!match) return 0;
    return clamp(Number(match[1]) - 1);
  };

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  const isMobile = () =>
    window.matchMedia('(max-width: 980px)').matches ||
    ('ontouchstart' in window && window.innerWidth < 1100);

  const setImmersive = (on) => {
    document.body.classList.toggle('is-immersive', on);
    fsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    fsBtn.title = on ? 'Salir de modo presentación' : 'Pantalla completa / modo presentación';
  };

  const enterFullscreen = async () => {
    const root = document.documentElement;
    try {
      if (root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI: 'hide' });
        return true;
      }
      if (root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
        return true;
      }
    } catch (_) {
      /* fallback below */
    }
    return false;
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }
      if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (_) {
      /* ignore */
    }
  };

  fsBtn.addEventListener('click', async () => {
    if (isMobile()) {
      const next = !document.body.classList.contains('is-immersive');
      setImmersive(next);
      if (next) {
        await enterFullscreen();
        // Intento suave de ocultar barra del navegador
        window.scrollTo(0, 1);
      } else {
        await exitFullscreen();
      }
      return;
    }

    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const ok = await enterFullscreen();
        if (!ok) setImmersive(true);
      } else {
        await exitFullscreen();
        setImmersive(false);
      }
    } catch (_) {
      setImmersive(!document.body.classList.contains('is-immersive'));
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && !isMobile()) {
      setImmersive(false);
    }
  });
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && !isMobile()) {
      setImmersive(false);
    }
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(key)) {
      event.preventDefault();
      goTo(index + 1);
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(key)) {
      event.preventDefault();
      goTo(index - 1);
    } else if (key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (key === 'End') {
      event.preventDefault();
      goTo(slides.length - 1);
    } else if (key.toLowerCase() === 'f') {
      fsBtn.click();
    }
  });

  let touchX = null;
  window.addEventListener(
    'touchstart',
    (event) => {
      touchX = event.changedTouches[0].screenX;
    },
    { passive: true }
  );
  window.addEventListener(
    'touchend',
    (event) => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].screenX - touchX;
      if (Math.abs(dx) > 56) {
        goTo(dx < 0 ? index + 1 : index - 1);
      }
      touchX = null;
    },
    { passive: true }
  );

  /* Network constellation — same spirit as /portafolio */
  const canvas = document.getElementById('network-canvas');
  const ctx = canvas.getContext('2d');
  const mouse = { x: -9999, y: -9999 };
  const config = {
    count: 90,
    maxDist: 150,
    mouseRadius: 180,
    speed: 0.4,
    colors: [
      'rgba(147,197,253,',
      'rgba(96,165,250,',
      'rgba(59,130,246,',
      'rgba(103,232,249,',
      'rgba(34,211,238,',
      'rgba(255,255,255,'
    ]
  };
  let particles = [];
  let tick = 0;

  const buildParticle = (width, height) => {
    const radius = 1 + Math.random() * 1.5;
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const baseAlpha = 0.35 + Math.random() * 0.55;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * config.speed,
      vy: (Math.random() - 0.5) * config.speed,
      radius,
      color,
      baseAlpha,
      alpha: baseAlpha,
      pulseSpeed: 0.008 + Math.random() * 0.012,
      pulseOffset: Math.random() * Math.PI * 2
    };
  };

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const areaScale = Math.min(1.1, Math.max(0.55, (width * height) / (1920 * 1080)));
    const count = Math.round(config.count * areaScale);
    if (particles.length !== count) {
      particles = Array.from({ length: count }, () => buildParticle(width, height));
    }
  };

  const draw = () => {
    tick += 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.maxDist) {
          const alpha = (1 - dist / config.maxDist) * 0.35;
          const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          gradient.addColorStop(0, `${a.color}${alpha})`);
          gradient.addColorStop(1, `${b.color}${alpha})`);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = (1 - dist / config.maxDist) * 1.2;
          ctx.stroke();
        }
      }

      const p = particles[i];
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const md = Math.sqrt(mdx * mdx + mdy * mdy);
      const maxMouse = config.mouseRadius * 1.2;
      if (md < maxMouse) {
        const alpha = (1 - md / maxMouse) * 0.55;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(147,197,253,${alpha})`;
        ctx.lineWidth = (1 - md / maxMouse) * 1.5;
        ctx.stroke();
      }
    }

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.001 && dist < config.mouseRadius) {
        const force = (config.mouseRadius - dist) / config.mouseRadius;
        p.x += (dx / dist) * force * 1.8;
        p.y += (dy / dist) * force * 1.8;
      }
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
      p.alpha = p.baseAlpha + Math.sin(tick * p.pulseSpeed + p.pulseOffset) * 0.18;

      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.5);
      halo.addColorStop(0, `${p.color}${p.alpha})`);
      halo.addColorStop(1, `${p.color}0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${Math.min(1, p.alpha + 0.3)})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  };

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  resizeCanvas();
  draw();
  goTo(fromHash());
})();
