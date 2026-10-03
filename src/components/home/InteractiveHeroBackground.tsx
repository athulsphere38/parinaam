'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

const PALETTE = [
  { color: '#d946ef', glow: 'rgba(217, 70, 239, 0.45)' }, // Fuchsia / Magenta
  { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },  // Electric Purple
  { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.45)' },  // Cyber Cyan
  { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)' }, // Warm Amber
  { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },  // Neon Pink
];

export const InteractiveHeroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const shockwavesRef = useRef<Shockwave[]>([]);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate responsive particle count
    const particleCount = Math.min(Math.floor((width * height) / 14000), 75);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const pColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        baseRadius: Math.random() * 1.5 + 1.2,
        color: pColor.color,
        glowColor: pColor.glow,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const maxConnectDist = 125;
      const mouseConnectDist = 160;

      // Update & Draw Shockwaves
      shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.opacity > 0.02);
      for (const sw of shockwavesRef.current) {
        sw.radius += (sw.maxRadius - sw.radius) * 0.12;
        sw.opacity *= 0.92;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(217, 70, 239, ${sw.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, Math.max(0, sw.radius - 8), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${sw.opacity * 0.6})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic pulse
        p.pulsePhase += p.pulseSpeed;
        const currentRadius = p.baseRadius + Math.sin(p.pulsePhase) * 0.6;

        // Position drift
        p.x += p.vx;
        p.y += p.vy;

        // Screen boundary wrap
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Mouse interactive physics
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseConnectDist && dist > 0) {
            // Gentle magnetic pull
            const force = (1 - dist / mouseConnectDist) * 0.035;
            p.x += dx * force;
            p.y += dy * force;

            // Draw glowing laser thread to cursor
            const alpha = (1 - dist / mouseConnectDist) * 0.45;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(217, 70, 239, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Cyan inner highlight on beam
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Particle-to-particle connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const alpha = (1 - dist / maxConnectDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Draw particle node
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }

      // Draw faint interactive cursor ring on canvas
      if (mouse.active) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 24, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Track mouse coordinates across the hero section
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y, active: true };

    // Gentle parallax translation for background orbs
    const normalizedX = (x / rect.width - 0.5) * 35;
    const normalizedY = (y / rect.height - 0.5) * 35;
    setParallax({ x: normalizedX, y: normalizedY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
    setParallax({ x: 0, y: 0 });
  }, []);

  // Trigger shockwave on click
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    shockwavesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: 180,
      opacity: 0.9,
    });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="absolute inset-0 overflow-hidden pointer-events-auto"
      style={{ zIndex: 1 }}
    >
      {/* Dynamic Parallax Mood Indigo Aurora Glows */}
      <div
        className="absolute top-1/4 left-1/4 w-[750px] h-[450px] bg-fuchsia-600/15 rounded-full blur-[150px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${-parallax.x * 1.2}px, ${-parallax.y * 1.2}px, 0)`,
        }}
      />
      <div
        className="absolute top-1/3 right-4 w-[650px] h-[550px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${parallax.x * 1.5}px, ${parallax.y * 1.5}px, 0)`,
        }}
      />
      <div
        className="absolute bottom-10 left-10 w-[420px] h-[420px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${parallax.x * 0.8}px, ${-parallax.y * 0.8}px, 0)`,
        }}
      />

      {/* Cyber Telemetry Micro Elements */}
      <div className="absolute top-28 left-6 hidden xl:flex flex-col gap-1 pointer-events-none opacity-25 select-none font-mono text-[9px] text-fuchsia-400 tracking-widest">
        <span>[SYS.STATUS: OPERATIONAL]</span>
        <span>[OCT 11-12 · AMARAVATI]</span>
        <span>[16.5062° N · 80.6480° E]</span>
      </div>

      <div className="absolute top-28 right-8 hidden xl:flex flex-col items-end gap-1 pointer-events-none opacity-25 select-none font-mono text-[9px] text-purple-400 tracking-widest">
        <span>[NODE_ID: PARINAAM_2026]</span>
        <span>[SIGNAL: LOCKED // 60FPS]</span>
        <span>[QUANTUM_GRID: ONLINE]</span>
      </div>

      {/* Corner Cyber Reticles */}
      <div className="absolute top-24 left-8 pointer-events-none opacity-20 hidden md:block">
        <span className="block w-4 h-4 border-t-2 border-l-2 border-fuchsia-500" />
      </div>
      <div className="absolute top-24 right-8 pointer-events-none opacity-20 hidden md:block">
        <span className="block w-4 h-4 border-t-2 border-r-2 border-fuchsia-500" />
      </div>

      {/* Canvas for Live Interactive Particles & Connections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
