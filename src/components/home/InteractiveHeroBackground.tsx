'use client';

import React, { useEffect, useRef, useCallback } from 'react';

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

const PALETTE = [
  { color: '#d946ef', glow: 'rgba(217, 70, 239, 0.45)' },
  { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.45)' },
  { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)' },
  { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },
];

export const InteractiveHeroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking — listen on the parent section, not on our div
    const section = canvas.closest('section');

    const onMouseMove = (e: MouseEvent) => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (section) {
      section.addEventListener('mousemove', onMouseMove);
      section.addEventListener('mouseleave', onMouseLeave);
    }

    // Particles
    const particleCount = Math.min(Math.floor((width * height) / 16000), 60);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const pColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        baseRadius: Math.random() * 1.4 + 1,
        color: pColor.color,
        glowColor: pColor.glow,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.025,
      });
    }

    const maxConnectDist = 120;
    const mouseConnectDist = 150;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.pulsePhase += p.pulseSpeed;
        const currentRadius = p.baseRadius + Math.sin(p.pulsePhase) * 0.5;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Mouse magnetic pull & laser thread
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseConnectDist && dist > 0) {
            const force = (1 - dist / mouseConnectDist) * 0.025;
            p.x += dx * force;
            p.y += dy * force;

            const alpha = (1 - dist / mouseConnectDist) * 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(217, 70, 239, ${alpha})`;
            ctx.lineWidth = 1;
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
            const alpha = (1 - dist / maxConnectDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (section) {
        section.removeEventListener('mousemove', onMouseMove);
        section.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};
