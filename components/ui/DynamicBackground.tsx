'use client';

import React, { useEffect, useRef } from 'react';

// Shared state for the singular background instance
const mouse = { x: -1000, y: -1000 };
const MOUSE_REPEL_RADIUS = 150;
const CONNECTION_DISTANCE = 150;

const colors = [
  '#4f46e5', // Indigo
  '#c026d3', // Fuchsia
  '#0891b2', // Cyan
  '#818cf8', // Lighter Indigo
];

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseX: number;
  baseY: number;

  constructor(cw: number, ch: number) {
    this.x = Math.random() * cw;
    this.y = Math.random() * ch;
    this.baseX = this.x;
    this.baseY = this.y;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.radius = Math.random() * 2 + 1.5;
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(cw: number, ch: number) {
    // Move
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges
    if (this.x < 0 || this.x > cw) this.vx *= -1;
    if (this.y < 0 || this.y > ch) this.vy *= -1;

    // Mouse Interaction (repel)
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < MOUSE_REPEL_RADIUS) {
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const maxDistance = MOUSE_REPEL_RADIUS;
      const force = (maxDistance - distance) / maxDistance;
      const directionX = forceDirectionX * force * 5;
      const directionY = forceDirectionY * force * 5;

      this.x -= directionX;
      this.y -= directionY;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

export function DynamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const PARTICLE_COUNT = 80;

    const init = () => {
      particles = [];
      const { innerWidth, innerHeight } = window;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      
      ctx.scale(dpr, dpr);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(innerWidth, innerHeight));
      }
    };

    const animate = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      ctx.clearRect(0, 0, cw, ch);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color;
            const opacity = 1 - (distance / CONNECTION_DISTANCE);
            ctx.globalAlpha = opacity * 0.4;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      ctx.globalAlpha = 1;

      // Update & draw particles
      particles.forEach((particle) => {
        particle.update(cw, ch);
        particle.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    init();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] min-h-screen bg-slate-50 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-slate-100/60 pointer-events-none" />
    </div>
  );
}
