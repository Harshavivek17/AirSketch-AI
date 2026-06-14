import { Particle, Point } from '@/types';

const MAX_PARTICLES = 200;

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];

  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push(this.createEmptyParticle());
    }
  }

  private createEmptyParticle(): Particle {
    return {
      x: 0, y: 0,
      vx: 0, vy: 0,
      life: 0, maxLife: 0,
      size: 0, color: '#00FFFF',
      opacity: 0,
    };
  }

  private getParticle(): Particle | null {
    return this.pool.pop() || null;
  }

  private returnParticle(p: Particle): void {
    if (this.pool.length < MAX_PARTICLES) {
      this.pool.push(p);
    }
  }

  emit(point: Point, color: string, count: number = 3): void {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;

      p.x = point.x;
      p.y = point.y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 0.5; // slight upward bias
      p.life = 1;
      p.maxLife = 30 + Math.random() * 40;
      p.size = 1 + Math.random() * 3;
      p.color = color;
      p.opacity = 0.8 + Math.random() * 0.2;

      this.particles.push(p);
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03; // gravity
      p.vx *= 0.98; // friction
      p.life++;
      p.opacity = Math.max(0, 1 - p.life / p.maxLife);
      p.size *= 0.97;

      if (p.life >= p.maxLife || p.opacity <= 0 || p.size < 0.1) {
        this.returnParticle(p);
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.opacity;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear(): void {
    for (const p of this.particles) {
      this.returnParticle(p);
    }
    this.particles = [];
  }

  get count(): number {
    return this.particles.length;
  }
}
