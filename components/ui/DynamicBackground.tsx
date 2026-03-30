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

  update(cw: number, ch: number, scrollVelocityY: number = 0) {
    // Move
    this.x += this.vx;
    this.y += this.vy - scrollVelocityY; // Inverse particle motion to screen scroll

    // Infinite wrapping instead of bouncing to simulate a running video
    if (this.x < -this.radius) this.x = cw + this.radius;
    if (this.x > cw + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = ch + this.radius;
    if (this.y > ch + this.radius) this.y = -this.radius;

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
    let currentScrollVelocity = 0;

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

      // Update & draw particles using smooth scroll velocity
      particles.forEach((particle) => {
        particle.update(cw, ch, currentScrollVelocity * 0.4); // Apply 40% of scroll speed for parallax scaling
        particle.draw(ctx);
      });

      // Gradually dampen the velocity for smooth easing when scrolling stops
      currentScrollVelocity *= 0.95;

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

    let lastScrollY = 0;
    const scrollContainer = document.querySelector('main');
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollY = target.scrollTop;
      const deltaY = scrollY - lastScrollY;
      
      // Inject velocity into the animation loop based on user scroll speed
      currentScrollVelocity = deltaY;
      lastScrollY = scrollY;
    };

    init();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    if(scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      // Fallback for document scrolling
      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const deltaY = scrollY - lastScrollY;
        currentScrollVelocity = deltaY;
        lastScrollY = scrollY;
      }, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if(scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
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
