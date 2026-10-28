/**
 * CLASSROOM ARCADE - ROULETTE ENGINE
 * Physics-based canvas wheel with dynamic slice sizing, audio ticks, and climax finish
 */

class RouletteWheel {
  constructor(canvasId = 'rouletteCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.pointerEl = document.getElementById('roulettePointer');

    this.currentRotation = 0; // in radians
    this.isSpinning = false;
    this.items = []; // array of strings (student names)
    this.lastTickIndex = -1;

    // Palette for slices
    this.colors = [
      '#ff007f', '#00f2fe', '#8a2be2', '#ffbe0b',
      '#00f5a0', '#fb5607', '#4facfe', '#ff5e62',
      '#7928ca', '#00b4d8', '#f72585', '#7209b7'
    ];

    this.init();
  }

  init() {
    this.syncFromRoster();
    if (window.Roster) {
      window.Roster.onChange(() => {
        if (!this.isSpinning) {
          this.syncFromRoster();
        }
      });
    }
  }

  syncFromRoster() {
    const autoExclude = document.getElementById('autoExcludePicked')?.checked ?? true;
    const eligible = window.Roster.getEligibleStudents(autoExclude);
    this.items = eligible.map(s => s.name);
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 20;

    this.ctx.clearRect(0, 0, width, height);

    if (this.items.length === 0) {
      // Empty state
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#181e3a';
      this.ctx.fill();
      this.ctx.strokeStyle = '#323d6b';
      this.ctx.lineWidth = 8;
      this.ctx.stroke();

      this.ctx.fillStyle = '#8e9bb8';
      this.ctx.font = 'bold 22px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('추첨할 학생이 없습니다!', centerX, centerY - 15);
      this.ctx.font = '16px Noto Sans KR, sans-serif';
      this.ctx.fillText('(명단 관리 탭에서 학생을 확인하세요)', centerX, centerY + 20);
      this.ctx.restore();
      return;
    }

    const sliceAngle = (Math.PI * 2) / this.items.length;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.currentRotation);

    // Draw slices
    for (let i = 0; i < this.items.length; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = this.colors[i % this.colors.length];

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, startAngle, endAngle);
      this.ctx.closePath();

      this.ctx.fillStyle = color;
      this.ctx.fill();

      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgba(10, 14, 26, 0.4)';
      this.ctx.stroke();

      // Draw text
      this.ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      this.ctx.rotate(midAngle);
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';

      // Text styling
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillStyle = '#ffffff';

      // Dynamic font size depending on student count
      let fontSize = 22;
      if (this.items.length > 20) fontSize = 16;
      else if (this.items.length > 30) fontSize = 13;
      else if (this.items.length > 40) fontSize = 11;

      this.ctx.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`;
      
      const displayName = this.items[i].length > 8 ? this.items[i].slice(0, 7) + '..' : this.items[i];
      this.ctx.fillText(displayName, radius - 30, 0);
      this.ctx.restore();
    }

    // Outer decorative neon ring
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.lineWidth = 8;
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();

    this.ctx.restore();
  }

  spin(durationMs = 6500) {
    if (this.isSpinning) return;
    this.syncFromRoster();

    if (this.items.length === 0) {
      alert('추첨 가능한 학생이 없습니다! 명단을 확인해주세요.');
      return;
    }

    this.isSpinning = true;
    const spinDuration = parseInt(document.getElementById('spinDurationSelect')?.value || durationMs, 10);
    
    // Choose winner in advance for precise targeting or physics ending
    const winnerIndex = Math.floor(Math.random() * this.items.length);
    const winnerName = this.items[winnerIndex];

    const sliceAngle = (Math.PI * 2) / this.items.length;
    // Pointer is at Top (angle = 3 * PI / 2 or -PI / 2)
    // Wheel rotates clockwise by totalAngle.
    // At rest, (currentRotation + sliceMid) % (2 * PI) aligns with 3 * PI / 2.
    const targetSliceMid = winnerIndex * sliceAngle + sliceAngle / 2;
    const targetRestAngle = (3 * Math.PI / 2 - targetSliceMid) % (Math.PI * 2);

    const minRotations = 7 + Math.floor(Math.random() * 4); // 7 to 10 full turns
    let finalRotation = minRotations * Math.PI * 2 + targetRestAngle;
    while (finalRotation < this.currentRotation + minRotations * Math.PI * 2) {
      finalRotation += Math.PI * 2;
    }

    const startRotation = this.currentRotation;
    const deltaRotation = finalRotation - startRotation;
    const startTime = performance.now();

    // Sound drumroll starter
    if (window.Sound) {
      window.Sound.playDrumroll(Math.min(spinDuration / 1000, 3.5));
    }

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Custom exponential easeOut for exciting suspenseful slowdown
      const ease = 1 - Math.pow(1 - progress, 4.5);
      this.currentRotation = startRotation + deltaRotation * ease;

      // Pointer tick detection
      const currentRelativeAngle = (3 * Math.PI / 2 - (this.currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const currentSegment = Math.floor(currentRelativeAngle / sliceAngle);

      if (currentSegment !== this.lastTickIndex) {
        this.lastTickIndex = currentSegment;
        if (window.Sound) {
          // Pitch changes as it slows down
          const pitch = 700 + (1 - progress) * 400;
          window.Sound.playTick(pitch);
        }
        if (this.pointerEl) {
          this.pointerEl.classList.remove('wobble');
          void this.pointerEl.offsetWidth; // trigger reflow
          this.pointerEl.classList.add('wobble');
        }
      }

      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.onFinishSpin(winnerName);
      }
    };

    requestAnimationFrame(animate);
  }

  onFinishSpin(winnerName) {
    // Screen Shake
    const stage = document.getElementById('appContainer');
    if (stage) {
      stage.classList.remove('screen-shake');
      void stage.offsetWidth;
      stage.classList.add('screen-shake');
    }

    // Audio & Confetti
    if (window.Sound) window.Sound.playFanfare();
    if (window.Confetti) window.Confetti.celebrate(3000);

    // Auto exclude
    const autoExclude = document.getElementById('autoExcludePicked')?.checked ?? true;
    if (autoExclude && window.Roster) {
      window.Roster.markPicked(winnerName, true);
    }

    // Add to history list
    this.addHistory(winnerName);

    // Open dramatic modal
    if (window.showWinnerModal) {
      window.showWinnerModal(winnerName, '🎡 룰렛 발표 당첨자!');
    }
  }

  addHistory(name) {
    const list = document.getElementById('pickedHistoryList');
    if (!list) return;

    const empty = list.querySelector('.history-empty');
    if (empty) empty.remove();

    const count = list.children.length + 1;
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <span class="rank-badge">${count}번째</span>
      <span class="student-name">${name}</span>
      <span class="time-stamp">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
    `;
    list.prepend(li);
  }

  resetHistory() {
    const list = document.getElementById('pickedHistoryList');
    if (list) {
      list.innerHTML = '<li class="history-empty">아직 추첨된 학생이 없습니다.</li>';
    }
  }
}

// Global Roulette Instance
window.Roulette = new RouletteWheel();
