/**
 * CLASSROOM ARCADE - PODIUM & FULL ORDER REVEAL
 * Shuffles all active students and dramatically reveals the entire presentation order
 */

class PodiumEngine {
  constructor() {
    this.cardsGrid = document.getElementById('podiumCardsGrid');
    this.progressFill = document.getElementById('podiumProgressFill');
    this.progressText = document.getElementById('podiumProgressText');
    this.shuffledList = [];
    this.revealedCount = 0;
    this.isRevealing = false;
    this.revealTimer = null;

    this.init();
  }

  init() {
    this.resetGrid();
    if (window.Roster) {
      window.Roster.onChange(() => {
        if (!this.isRevealing) {
          this.resetGrid();
        }
      });
    }
  }

  resetGrid() {
    if (!this.cardsGrid) return;
    this.cardsGrid.innerHTML = '';
    const active = window.Roster.getActiveStudents();

    if (active.length === 0) {
      this.cardsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          출석 중인 학생이 없습니다. 명단 관리 탭에서 학생을 추가해주세요!
        </div>
      `;
      this.updateProgress(0, 0, '출석 인원 없음');
      return;
    }

    // Render placeholder cards (unrevealed mystery cards)
    active.forEach((_, idx) => {
      const card = this.createCardElement(idx + 1, '???', false);
      this.cardsGrid.appendChild(card);
    });

    this.updateProgress(0, active.length, `총 ${active.length}명 대기 중. [순서 섞고 공개 시작]을 누르세요!`);
  }

  createCardElement(rank, name, isFlipped = false) {
    const card = document.createElement('div');
    card.className = `podium-card rank-${rank} ${isFlipped ? 'flipped' : ''}`;
    card.dataset.rank = rank;

    card.innerHTML = `
      <div class="podium-card-inner">
        <div class="podium-card-front">
          <div class="mystery-rank-badge">#${rank}</div>
          <div class="mystery-icon">❓</div>
        </div>
        <div class="podium-card-back">
          <div class="revealed-rank">${rank}번째 발표</div>
          <div class="revealed-name">${name}</div>
        </div>
      </div>
    `;

    // Click to flip individually
    card.addEventListener('click', () => {
      if (!card.classList.contains('flipped') && this.shuffledList.length > 0) {
        this.flipCard(card, this.shuffledList[rank - 1]);
      }
    });

    return card;
  }

  shuffle() {
    if (this.isRevealing) return;

    const active = window.Roster.getActiveStudents();
    if (active.length === 0) {
      alert('추첨할 학생이 없습니다!');
      return;
    }

    // Fisher-Yates shuffle
    const list = [...active.map(s => s.name)];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    this.shuffledList = list;
    this.revealedCount = 0;
    this.isRevealing = true;

    // Reset visuals
    this.cardsGrid.innerHTML = '';
    list.forEach((name, idx) => {
      const card = this.createCardElement(idx + 1, name, false);
      this.cardsGrid.appendChild(card);
    });

    // Start sequential dramatic card flipping
    this.startDramaticReveal();
  }

  startDramaticReveal() {
    const total = this.shuffledList.length;
    let currentIdx = 0;

    if (window.Sound) {
      window.Sound.playDrumroll(Math.min(total * 0.4, 5));
    }

    const cards = this.cardsGrid.querySelectorAll('.podium-card');

    const revealNext = () => {
      if (currentIdx >= total) {
        this.isRevealing = false;
        this.onFinishAllReveal();
        return;
      }

      const card = cards[currentIdx];
      const name = this.shuffledList[currentIdx];
      this.flipCard(card, name);
      currentIdx++;

      // Progressively fast or rhythmic delays
      let delay = 350;
      if (currentIdx === total) delay = 600; // last dramatic one

      this.revealTimer = setTimeout(revealNext, delay);
    };

    revealNext();
  }

  flipCard(cardEl, name) {
    if (!cardEl || cardEl.classList.contains('flipped')) return;

    cardEl.classList.add('flipped');
    this.revealedCount++;

    if (window.Sound) {
      window.Sound.playCardFlip();
    }

    const rank = parseInt(cardEl.dataset.rank, 10);
    this.updateProgress(this.revealedCount, this.shuffledList.length, `${rank}번 발표자: [${name}] 공개 완료!`);
  }

  instantRevealAll() {
    if (this.shuffledList.length === 0) {
      // shuffle first if not yet done
      const active = window.Roster.getActiveStudents();
      if (active.length === 0) return;
      this.shuffledList = active.map(s => s.name).sort(() => Math.random() - 0.5);
    }

    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }

    const cards = this.cardsGrid.querySelectorAll('.podium-card');
    cards.forEach((card, idx) => {
      const name = this.shuffledList[idx];
      const backName = card.querySelector('.revealed-name');
      if (backName && name) backName.textContent = name;
      card.classList.add('flipped');
    });

    this.revealedCount = this.shuffledList.length;
    this.isRevealing = false;
    this.onFinishAllReveal();
  }

  onFinishAllReveal() {
    this.updateProgress(this.shuffledList.length, this.shuffledList.length, '🎉 모든 학생의 발표 순서가 확정되었습니다!');

    if (window.Sound) {
      window.Sound.playFanfare();
    }

    if (window.Confetti) {
      window.Confetti.celebrate(3000);
    }
  }

  updateProgress(current, total, text) {
    if (this.progressFill) {
      const pct = total > 0 ? (current / total) * 100 : 0;
      this.progressFill.style.width = `${pct}%`;
    }
    if (this.progressText) {
      this.progressText.textContent = text;
    }
  }

  copyOrderToClipboard() {
    if (!this.shuffledList || this.shuffledList.length === 0) {
      alert('먼저 순서 섞기를 실행해주세요!');
      return;
    }

    const lines = [
      '📋 [발표 순서 추첨 결과]',
      '--------------------------',
      ...this.shuffledList.map((name, idx) => `${idx + 1}번째: ${name}`),
      '--------------------------',
      `추첨 일시: ${new Date().toLocaleString()}`
    ];

    const resultText = lines.join('\n');
    navigator.clipboard.writeText(resultText).then(() => {
      alert('발표 순서가 클립보드에 복사되었습니다! 카톡이나 문서에 바로 붙여넣기(Ctrl+V) 하세요.');
    }).catch(err => {
      console.warn('Clipboard write error', err);
      prompt('발표 순서 텍스트:', resultText);
    });
  }
}

// Global Podium Instance
window.Podium = new PodiumEngine();
