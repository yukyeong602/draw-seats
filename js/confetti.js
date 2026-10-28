/**
 * CLASSROOM ARCADE - CONFETTI SYSTEM
 * 60FPS High Performance Canvas Confetti & Fireworks
 */

class ConfettiEngine {
  constructor(canvasId = 'confettiCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animId = null;
    this.colors = [
      '#00f2fe', '#4facfe', '#ff007f', '#ff5e62',
      '#ffbe0b', '#fb5607', '#00f5a0', '#ffffff', '#8a2be2'
    ];

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  burst(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 80) {
    if (!this.ctx) return;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 5;
      const size = Math.random() * 8 + 6;

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // upward bias
        size: size,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        gravity: 0.35,
        drag: 0.96
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  // Multi-burst celebratory sequence
  celebrate(durationMs = 2500) {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed > durationMs) {
        clearInterval(interval);
        return;
      }

      // Fire random fireworks from bottom corners and center
      const posX = Math.random() * window.innerWidth;
      const posY = Math.random() * (window.innerHeight * 0.6) + 100;
      this.burst(posX, posY, 45);
    }, 280);
  }

  loop() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.008;

      if (p.opacity <= 0 || p.y > this.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
    }
  }
}

// Global Confetti Instance
window.Confetti = new ConfettiEngine();
