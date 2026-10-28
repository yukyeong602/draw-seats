/**
 * CLASSROOM ARCADE - GACHA CAPSULE MACHINE
 * Physics-based capsule dome simulation, interactive lever, and dramatic unboxing
 */

class GachaMachine {
  constructor() {
    this.canvas = document.getElementById('gachaDomeCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.crankHandle = document.getElementById('crankHandle');
    this.capsuleReady = document.getElementById('capsuleReady');
    this.isPulling = false;
    this.capsules = [];
    this.animId = null;

    this.colors = [
      { top: '#ff007f', bottom: '#ffffff' },
      { top: '#00f2fe', bottom: '#ffffff' },
      { top: '#ffbe0b', bottom: '#ffffff' },
      { top: '#00f5a0', bottom: '#ffffff' },
      { top: '#8a2be2', bottom: '#ffffff' },
      { top: '#fb5607', bottom: '#ffffff' }
    ];

    this.init();
  }

  init() {
    if (this.canvas) {
      this.populateDomeBalls();
      this.startPhysicsLoop();
    }

    if (window.Roster) {
      window.Roster.onChange(() => {
        if (!this.isPulling) {
          this.populateDomeBalls();
        }
      });
    }

    if (this.capsuleReady) {
      this.capsuleReady.addEventListener('click', () => {
        this.openChuteCapsule();
      });
    }
  }

  populateDomeBalls() {
    if (!this.canvas) return;
    const students = window.Roster.getEligibleStudents(true);
    const count = Math.max(12, Math.min(students.length, 36));

    this.capsules = [];
    const width = this.canvas.width;
    const height = this.canvas.height;

    for (let i = 0; i < count; i++) {
      const student = students[i % (students.length || 1)];
      const colorScheme = this.colors[i % this.colors.length];
      const radius = 22;

      this.capsules.push({
        x: Math.random() * (width - 120) + 60,
        y: Math.random() * (height - 100) + 60,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: radius,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        colorTop: colorScheme.top,
        colorBottom: colorScheme.bottom,
        studentName: student ? student.name : '학생'
      });
    }
  }

  agitateDome(intensity = 15) {
    if (!this.capsules) return;
    this.capsules.forEach(c => {
      c.vx += (Math.random() - 0.5) * intensity;
      c.vy -= Math.random() * intensity; // upward explosion
      c.vRot += (Math.random() - 0.5) * 0.3;
    });
  }

  startPhysicsLoop() {
    const loop = () => {
      this.updatePhysics();
      this.drawDome();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  updatePhysics() {
    if (!this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const gravity = 0.35;
    const friction = 0.98;

    for (let i = 0; i < this.capsules.length; i++) {
      const c = this.capsules[i];
      c.vy += gravity;
      c.vx *= friction;
      c.vy *= friction;
      c.rotation += c.vRot;
      c.vRot *= 0.97;

      c.x += c.vx;
      c.y += c.vy;

      // Bottom boundary
      if (c.y + c.radius > height - 10) {
        c.y = height - 10 - c.radius;
        c.vy = -c.vy * 0.65;
      }

      // Left boundary
      if (c.x - c.radius < 20) {
        c.x = 20 + c.radius;
        c.vx = -c.vx * 0.65;
      }

      // Right boundary
      if (c.x + c.radius > width - 20) {
        c.x = width - 20 - c.radius;
        c.vx = -c.vx * 0.65;
      }

      // Ball to Ball collision (simple impulse)
      for (let j = i + 1; j < this.capsules.length; j++) {
        const c2 = this.capsules[j];
        const dx = c2.x - c.x;
        const dy = c2.y - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = c.radius + c2.radius;

        if (dist < minDist && dist > 0) {
          const overlap = 0.5 * (minDist - dist);
          const nx = dx / dist;
          const ny = dy / dist;

          c.x -= nx * overlap;
          c.y -= ny * overlap;
          c2.x += nx * overlap;
          c2.y += ny * overlap;

          // Swap velocities along normal
          const kx = c.vx - c2.vx;
          const ky = c.vy - c2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;
          c.vx -= p * nx * 0.7;
          c.vy -= p * ny * 0.7;
          c2.vx += p * nx * 0.7;
          c2.vy += p * ny * 0.7;
        }
      }
    }
  }

  drawDome() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const c of this.capsules) {
      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate(c.rotation);

      // Top colored half
      this.ctx.beginPath();
      this.ctx.arc(0, 0, c.radius, Math.PI, 0, false);
      this.ctx.fillStyle = c.colorTop;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      this.ctx.stroke();

      // Bottom white/cream half
      this.ctx.beginPath();
      this.ctx.arc(0, 0, c.radius, 0, Math.PI, false);
      this.ctx.fillStyle = c.colorBottom;
      this.ctx.fill();
      this.ctx.stroke();

      // Middle seam belt
      this.ctx.beginPath();
      this.ctx.rect(-c.radius, -2, c.radius * 2, 4);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();

      // Glossy shine reflection
      this.ctx.beginPath();
      this.ctx.ellipse(-c.radius * 0.35, -c.radius * 0.35, c.radius * 0.35, c.radius * 0.2, -Math.PI / 4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  pullLever() {
    if (this.isPulling) return;

    const eligible = window.Roster.getEligibleStudents(true);
    if (eligible.length === 0) {
      alert('추첨 가능한 학생이 없습니다! 명단을 확인해주세요.');
      return;
    }

    this.isPulling = true;
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    this.pendingWinner = winner.name;

    // 1. Play mechanical lever crank sound & animation
    if (window.Sound) {
      window.Sound.playTick(400);
      setTimeout(() => window.Sound.playTick(600), 250);
      setTimeout(() => window.Sound.playTick(800), 500);
    }

    if (this.crankHandle) {
      this.crankHandle.classList.remove('rotating');
      void this.crankHandle.offsetWidth;
      this.crankHandle.classList.add('rotating');
    }

    // 2. Agitate capsules in dome
    this.agitateDome(22);
    setTimeout(() => this.agitateDome(18), 300);

    // 3. Capsule drops down into chute
    setTimeout(() => {
      this.dropCapsuleToChute();
    }, 750);
  }

  dropCapsuleToChute() {
    if (window.Sound) window.Sound.playPop();

    if (this.capsuleReady) {
      const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.capsuleReady.style.display = 'block';
      this.capsuleReady.style.background = `linear-gradient(180deg, ${randomColor.top} 50%, #ffffff 50%)`;
      this.capsuleReady.title = '클릭하여 캡슐 열기!';

      // Auto open after a short dramatic pause or let user click
      setTimeout(() => {
        if (this.isPulling) {
          this.openChuteCapsule();
        }
      }, 1000);
    }
  }

  openChuteCapsule() {
    if (!this.pendingWinner) return;

    const winnerName = this.pendingWinner;
    this.pendingWinner = null;
    this.isPulling = false;

    if (this.capsuleReady) {
      this.capsuleReady.style.display = 'none';
    }

    // Screen Shake & Audio & Confetti
    const stage = document.getElementById('appContainer');
    if (stage) {
      stage.classList.remove('screen-shake');
      void stage.offsetWidth;
      stage.classList.add('screen-shake');
    }

    if (window.Sound) {
      window.Sound.playPop();
      window.Sound.playFanfare();
    }

    if (window.Confetti) {
      window.Confetti.celebrate(3000);
    }

    // Mark picked
    const autoExclude = document.getElementById('autoExcludePicked')?.checked ?? true;
    if (autoExclude && window.Roster) {
      window.Roster.markPicked(winnerName, true);
    }

    // Add to Gacha opened grid log
    this.addOpenedLog(winnerName);

    // Show modal
    if (window.showWinnerModal) {
      window.showWinnerModal(winnerName, '🎁 캡슐 가챠 당첨자!');
    }
  }

  addOpenedLog(name) {
    const grid = document.getElementById('gachaOpenedGrid');
    if (!grid) return;

    const empty = grid.querySelector('.history-empty');
    if (empty) empty.remove();

    const pill = document.createElement('div');
    pill.className = 'capsule-pill';
    pill.innerHTML = `
      <span class="capsule-pill-icon">💊</span>
      <span class="capsule-pill-name">${name}</span>
    `;
    grid.prepend(pill);
  }
}

// Global Gacha Instance
window.Gacha = new GachaMachine();
