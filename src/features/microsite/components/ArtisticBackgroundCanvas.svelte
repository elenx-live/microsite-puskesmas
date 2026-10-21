<!-- @component Latar kinetik artistik (canvas) — aurora, jaring partikel, bioluminescent, gelombang geometris, kilau keemasan. (Dependency template microsite; diluar daftar 22 file namun wajib agar template dapat dikompilasi.) -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { BackgroundAnimationType } from '../../../shared/types/index.js';

  let {
    type = 'aurora_flow',
    intensity = 'medium',
    interactive = true,
    className = '',
    themeMode = 'auto'
  }: {
    type?: BackgroundAnimationType;
    intensity?: 'subtle' | 'medium' | 'vibrant';
    interactive?: boolean;
    className?: string;
    themeMode?: 'light' | 'dark' | 'auto';
  } = $props();

  let canvasEl: HTMLCanvasElement | null = $state(null);
  let containerEl: HTMLDivElement | null = $state(null);

  onMount(() => {
    if (type === 'none') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasEl;
    const container = containerEl;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const mouse = { x: -1000, y: -1000, active: false, radius: 140 };

    let animationFrameId: number | null = null;
    let isVisible = true;
    let isTabActive = !document.hidden;
    let isRunning = false;
    let width = 0;
    let height = 0;
    let time = 0;
    let lastRenderTime = 0;
    const targetFpsInterval = 1000 / 30;

    const isDark =
      themeMode === 'dark' ||
      (themeMode === 'auto' &&
        (document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches));

    const opacityMult = intensity === 'subtle' ? 0.35 : intensity === 'vibrant' ? 0.9 : 0.6;

    interface Particle {
      x: number; y: number; vx: number; vy: number; size: number;
      color: string; alpha: number; baseAlpha: number; phase: number; pulseSpeed: number;
    }

    let particles: Particle[] = [];
    let waves: { frequency: number; amplitude: number; speed: number; yOffset: number; color: string }[] = [];

    const initElements = () => {
      particles = [];
      waves = [];

      if (type === 'particle_mesh' || type === 'bioluminescent') {
        const maxParticles = type === 'particle_mesh' ? 35 : 20;
        const count = Math.min(Math.max(Math.floor((width * height) / 30000), 12), maxParticles);
        const colorPalette = isDark
          ? ['#10B981', '#06B6D4', '#6366F1', '#34D399']
          : ['#059669', '#0891B2', '#4F46E5', '#10B981'];

        for (let i = 0; i < count; i++) {
          const alpha = (Math.random() * 0.35 + 0.15) * opacityMult;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: type === 'bioluminescent' ? Math.random() * 18 + 8 : Math.random() * 2.5 + 1,
            color: colorPalette[i % colorPalette.length],
            alpha,
            baseAlpha: alpha,
            phase: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.015 + 0.008
          });
        }
      }

      if (type === 'geometric_waves' || type === 'aurora_flow') {
        const waveCount = 3;
        const waveColors = isDark
          ? ['rgba(16, 185, 129, 0.20)', 'rgba(6, 182, 212, 0.15)', 'rgba(99, 102, 241, 0.12)']
          : ['rgba(16, 185, 129, 0.10)', 'rgba(14, 165, 233, 0.08)', 'rgba(99, 102, 241, 0.06)'];

        for (let i = 0; i < waveCount; i++) {
          waves.push({
            frequency: 0.0015 + i * 0.0008,
            amplitude: (height * 0.12 + i * 14) * (type === 'aurora_flow' ? 1.2 : 1.0),
            speed: 0.006 + i * 0.003,
            yOffset: height * (0.35 + i * 0.15),
            color: waveColors[i % waveColors.length]
          });
        }
      }
    };

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      const dpr = 1.0;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      initElements();
    };

    let lastMouseTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !container) return;
      const now = performance.now();
      if (now - lastMouseTime < 30) return;
      lastMouseTime = now;
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const drawAurora = () => {
      time += 0.008;

      const auroraGradient = ctx.createRadialGradient(
        width * 0.3 + Math.sin(time * 0.4) * 80,
        height * 0.4 + Math.cos(time * 0.3) * 60,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
      );

      if (isDark) {
        auroraGradient.addColorStop(0, `rgba(16, 185, 129, ${0.16 * opacityMult})`);
        auroraGradient.addColorStop(0.4, `rgba(6, 182, 212, ${0.10 * opacityMult})`);
        auroraGradient.addColorStop(0.8, `rgba(99, 102, 241, ${0.06 * opacityMult})`);
        auroraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        auroraGradient.addColorStop(0, `rgba(16, 185, 129, ${0.10 * opacityMult})`);
        auroraGradient.addColorStop(0.4, `rgba(14, 165, 233, ${0.06 * opacityMult})`);
        auroraGradient.addColorStop(0.8, `rgba(245, 158, 11, ${0.03 * opacityMult})`);
        auroraGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.fillStyle = auroraGradient;
      ctx.fillRect(0, 0, width, height);

      waves.forEach((wave, idx) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 18) {
          let mouseFactor = 0;
          if (mouse.active) {
            const dx = x - mouse.x;
            const dist = Math.abs(dx);
            if (dist < mouse.radius) {
              mouseFactor = Math.cos((dist / mouse.radius) * (Math.PI / 2)) * 25;
            }
          }

          const y =
            wave.yOffset +
            Math.sin(x * wave.frequency + time * wave.speed + idx) * wave.amplitude +
            Math.cos(x * wave.frequency * 0.5 + time * 0.01) * 15 -
            mouseFactor;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, wave.yOffset - wave.amplitude, 0, height);
        if (isDark) {
          grad.addColorStop(0, wave.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
          grad.addColorStop(0, wave.color);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
        }

        ctx.fillStyle = grad;
        ctx.fill();
      });
    };

    const drawParticleMesh = () => {
      time += 0.008;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 0) {
            const angle = Math.atan2(dy, dx);
            const force = (mouse.radius - dist) / mouse.radius;
            p.x += Math.cos(angle) * force * 1.5;
            p.y += Math.sin(angle) * force * 1.5;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 110;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.2 * opacityMult;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
      ctx.globalAlpha = 1;
    };

    const drawBioluminescent = () => {
      time += 0.01;

      particles.forEach((p) => {
        p.x += p.vx * 0.6;
        p.y += p.vy * 0.6;
        p.phase += p.pulseSpeed;

        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;

        const currentAlpha = p.baseAlpha * (0.6 + Math.sin(p.phase) * 0.35);
        const currentRadius = p.size * (0.85 + Math.sin(p.phase * 0.8) * 0.2);

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 2);
        glow.addColorStop(0, p.color);
        glow.addColorStop(0.5, p.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.globalAlpha = currentAlpha * 0.5;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = currentAlpha * 0.8;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawGeometricWaves = () => {
      time += 0.008;

      waves.forEach((wave, idx) => {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 12) {
          const y =
            wave.yOffset +
            Math.sin(x * wave.frequency + time * wave.speed + (idx * Math.PI) / 3) * wave.amplitude +
            Math.cos(x * 0.002 - time * 0.008) * 12;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5 * opacityMult;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };

    const drawGoldenRadiance = () => {
      time += 0.008;

      const sunCenter = { x: width * 0.85, y: height * 0.15 };
      const rays = 6;

      for (let i = 0; i < rays; i++) {
        const angle = (i * Math.PI) / (rays * 0.9) + Math.sin(time * 0.3 + i) * 0.06;
        const length = Math.max(width, height) * 1.1;

        const x1 = sunCenter.x;
        const y1 = sunCenter.y;
        const x2 = sunCenter.x - Math.cos(angle) * length;
        const y2 = sunCenter.y + Math.sin(angle) * length;

        const rayGrad = ctx.createLinearGradient(x1, y1, x2, y2);
        if (isDark) {
          rayGrad.addColorStop(0, `rgba(245, 158, 11, ${0.12 * opacityMult})`);
          rayGrad.addColorStop(0.5, `rgba(16, 185, 129, ${0.06 * opacityMult})`);
          rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
          rayGrad.addColorStop(0, `rgba(217, 119, 6, ${0.08 * opacityMult})`);
          rayGrad.addColorStop(0.6, `rgba(16, 185, 129, ${0.04 * opacityMult})`);
          rayGrad.addColorStop(1, 'rgba(255,255,255,0)');
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 - 40, y2);
        ctx.lineTo(x2 + 40, y2);
        ctx.closePath();
        ctx.fillStyle = rayGrad;
        ctx.fill();
      }
    };

    const render = (timestamp: number) => {
      if (!isVisible || !isTabActive) {
        isRunning = false;
        animationFrameId = null;
        return;
      }

      const elapsed = timestamp - lastRenderTime;
      if (elapsed > targetFpsInterval) {
        lastRenderTime = timestamp - (elapsed % targetFpsInterval);

        ctx.clearRect(0, 0, width, height);

        switch (type) {
          case 'aurora_flow':
          case 'subtle_glow':
            drawAurora();
            break;
          case 'particle_mesh':
            drawParticleMesh();
            break;
          case 'bioluminescent':
            drawBioluminescent();
            break;
          case 'geometric_waves':
            drawGeometricWaves();
            break;
          case 'golden_radiance':
            drawGoldenRadiance();
            break;
          default:
            drawAurora();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const startAnimation = () => {
      if (!isRunning && isVisible && isTabActive) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const stopAnimation = () => {
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (isTabActive && isVisible) startAnimation();
      else stopAnimation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => resize(), 100);
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && isTabActive) startAnimation();
        else stopAnimation();
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    resize();
    startAnimation();

    return () => {
      stopAnimation();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  });

  const shouldRender = type !== 'none';
</script>

{#if shouldRender}
  <div
    bind:this={containerEl}
    class={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
    aria-hidden="true"
  >
    <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/40 to-transparent pointer-events-none"></div>
  </div>
{/if}
