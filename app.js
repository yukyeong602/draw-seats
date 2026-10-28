/**
 * CLASSROOM ARCADE - MAIN APPLICATION CONTROLLER
 * Connects UI tabs, shortcuts, modals, roster UI, and audio/canvas modules
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const navTabs = document.querySelectorAll('.nav-tab');
  const gameViews = document.querySelectorAll('.game-view');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const activeCountDisplay = document.getElementById('activeCountDisplay');
  const totalStudentsCount = document.getElementById('totalStudentsCount');
  const presetSelect = document.getElementById('presetSelect');

  // Winner Modal Elements
  const winnerModal = document.getElementById('winnerModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const winnerModalName = document.getElementById('winnerModalName');
  const winnerModalSub = document.getElementById('winnerModalSub');
  const winnerModalConfirmBtn = document.getElementById('winnerModalConfirmBtn');

  // Current Active Tab
  let activeTabName = 'roulette';

  /* ==================== TAB NAVIGATION ==================== */
  function switchTab(tabName) {
    activeTabName = tabName;
    navTabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    gameViews.forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`view${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    if (window.Sound) {
      window.Sound.playPop();
    }

    // Trigger redraws if needed
    if (tabName === 'roulette' && window.Roulette) {
      window.Roulette.draw();
    } else if (tabName === 'gacha' && window.Gacha) {
      window.Gacha.populateDomeBalls();
    }
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  /* ==================== WINNER MODAL ==================== */
  window.showWinnerModal = function(name, subtext = '🎉 오늘의 발표 당첨자!') {
    if (winnerModalName) winnerModalName.textContent = name;
    if (winnerModalSub) winnerModalSub.textContent = subtext;

    const detail = document.getElementById('winnerModalDetail');
    if (detail) {
      detail.textContent = `당첨 시간: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (winnerModal) {
      winnerModal.classList.add('open');
      winnerModal.setAttribute('aria-hidden', 'false');
    }
  };

  function closeWinnerModal() {
    if (winnerModal) {
      winnerModal.classList.remove('open');
      winnerModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (winnerModalConfirmBtn) winnerModalConfirmBtn.addEventListener('click', closeWinnerModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeWinnerModal);

  /* ==================== AUDIO TOGGLE ==================== */
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (window.Sound) {
        const isMuted = window.Sound.toggleMute();
        soundToggleBtn.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
        soundToggleBtn.title = isMuted ? '효과음 켜기' : '효과음 끄기';
      }
    });
  }

  /* ==================== FULLSCREEN TOGGLE ==================== */
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /* ==================== KEYBOARD SHORTCUTS ==================== */
  window.addEventListener('keydown', (e) => {
    // If typing in an input or textarea, ignore shortcuts
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (winnerModal && winnerModal.classList.contains('open')) {
        closeWinnerModal();
        return;
      }

      if (activeTabName === 'roulette' && window.Roulette) {
        window.Roulette.spin();
      } else if (activeTabName === 'gacha' && window.Gacha) {
        window.Gacha.pullLever();
      } else if (activeTabName === 'podium' && window.Podium) {
        window.Podium.shuffle();
      }
    } else if (e.code === 'KeyF') {
      toggleFullscreen();
    } else if (e.code === 'KeyM') {
      if (soundToggleBtn) soundToggleBtn.click();
    } else if (e.code === 'Escape') {
      closeWinnerModal();
    }
  });

  /* ==================== ROULETTE CONTROLS ==================== */
  const rouletteSpinBtn = document.getElementById('rouletteSpinBtn');
  const directSpinBtn = document.getElementById('directSpinBtn');
  const resetHistoryBtn = document.getElementById('resetHistoryBtn');

  if (rouletteSpinBtn) {
    rouletteSpinBtn.addEventListener('click', () => {
      if (window.Roulette) window.Roulette.spin();
    });
  }

  if (directSpinBtn) {
    directSpinBtn.addEventListener('click', () => {
      if (window.Roulette) window.Roulette.spin();
    });
  }

  if (resetHistoryBtn) {
    resetHistoryBtn.addEventListener('click', () => {
      if (window.Roulette) window.Roulette.resetHistory();
    });
  }

  /* ==================== GACHA CONTROLS ==================== */
  const gachaPullBtn = document.getElementById('gachaPullBtn');
  const gachaShuffleBallsBtn = document.getElementById('gachaShuffleBallsBtn');
  const crankHandle = document.getElementById('crankHandle');

  if (gachaPullBtn) {
    gachaPullBtn.addEventListener('click', () => {
      if (window.Gacha) window.Gacha.pullLever();
    });
  }

  if (crankHandle) {
    crankHandle.addEventListener('click', () => {
      if (window.Gacha) window.Gacha.pullLever();
    });
  }

  if (gachaShuffleBallsBtn) {
    gachaShuffleBallsBtn.addEventListener('click', () => {
      if (window.Gacha) {
        window.Gacha.agitateDome(20);
        if (window.Sound) window.Sound.playPop();
      }
    });
  }

  /* ==================== PODIUM CONTROLS ==================== */
  const podiumShuffleBtn = document.getElementById('podiumShuffleBtn');
  const podiumInstantRevealBtn = document.getElementById('podiumInstantRevealBtn');
  const podiumCopyBtn = document.getElementById('podiumCopyBtn');

  if (podiumShuffleBtn) {
    podiumShuffleBtn.addEventListener('click', () => {
      if (window.Podium) window.Podium.shuffle();
    });
  }

  if (podiumInstantRevealBtn) {
    podiumInstantRevealBtn.addEventListener('click', () => {
      if (window.Podium) window.Podium.instantRevealAll();
    });
  }

  if (podiumCopyBtn) {
    podiumCopyBtn.addEventListener('click', () => {
      if (window.Podium) window.Podium.copyOrderToClipboard();
    });
  }

  /* ==================== ROSTER UI BINDINGS ==================== */
  const bulkInputArea = document.getElementById('bulkInputArea');
  const applyBulkRosterBtn = document.getElementById('applyBulkRosterBtn');
  const separateClassApplyBtn = document.getElementById('separateClassApplyBtn');
  const multiClassActionBox = document.getElementById('multiClassActionBox');
  const singleStudentInput = document.getElementById('singleStudentInput');
  const addSingleStudentBtn = document.getElementById('addSingleStudentBtn');
  const studentChipsContainer = document.getElementById('studentChipsContainer');
  const currentClassNameDisplay = document.getElementById('currentClassNameDisplay');
  const newPresetNameInput = document.getElementById('newPresetNameInput');
  const saveCurrentPresetBtn = document.getElementById('saveCurrentPresetBtn');
  const createNewClassBtn = document.getElementById('createNewClassBtn');
  const renamePresetBtn = document.getElementById('renamePresetBtn');
  const presetSavedList = document.getElementById('presetSavedList');
  const loadSampleStudentsBtn = document.getElementById('loadSampleStudentsBtn');
  const exportRosterBtn = document.getElementById('exportRosterBtn');
  const importRosterFileInput = document.getElementById('importRosterFileInput');
  const clearAllRosterBtn = document.getElementById('clearAllRosterBtn');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const resetPickedFlagsBtn = document.getElementById('resetPickedFlagsBtn');

  // Render Roster State
  function renderRosterUI() {
    if (!window.Roster) return;

    const students = window.Roster.students;
    const active = window.Roster.getActiveStudents();
    const currentName = window.Roster.getCurrentPresetName();

    // Active class title display
    if (currentClassNameDisplay) {
      currentClassNameDisplay.textContent = currentName;
    }

    // Summary counts
    if (activeCountDisplay) activeCountDisplay.textContent = active.length;
    if (totalStudentsCount) totalStudentsCount.textContent = students.length;

    // Student Chips List
    if (studentChipsContainer) {
      studentChipsContainer.innerHTML = '';
      if (students.length === 0) {
        studentChipsContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">
            [${currentName}]에 등록된 학생이 없습니다. 왼쪽에서 이름을 붙여넣거나 추가하세요.
          </div>
        `;
      } else {
        students.forEach((student, index) => {
          const chip = document.createElement('div');
          chip.className = `student-chip ${student.absent ? 'absent' : ''} ${student.picked ? 'picked' : ''}`;
          chip.title = student.absent ? '현재 결석(제외) 상태 - 클릭 시 출석' : '현재 출석 상태 - 클릭 시 결석(제외)';

          chip.innerHTML = `
            <span class="chip-name">${student.name}</span>
            <button class="chip-delete" title="학생 삭제" data-index="${index}">✕</button>
          `;

          // Toggle absent on chip click
          chip.addEventListener('click', (e) => {
            if (e.target.classList.contains('chip-delete')) return;
            window.Roster.toggleAbsent(index);
          });

          // Delete student
          const delBtn = chip.querySelector('.chip-delete');
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.Roster.removeStudent(index);
          });

          studentChipsContainer.appendChild(chip);
        });
      }
    }

    // Render Presets Dropdown & Chips
    renderPresetsUI();
  }

  function renderPresetsUI() {
    const presets = window.Roster.presets;
    const activeKey = window.Roster.currentPresetKey;

    // Header Select Dropdown
    if (presetSelect) {
      presetSelect.innerHTML = '';
      Object.keys(presets).forEach(key => {
        const p = presets[key];
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${p.name} (${p.students.length}명)`;
        if (key === activeKey) opt.selected = true;
        presetSelect.appendChild(opt);
      });
    }

    // Preset chips in Roster tab
    if (presetSavedList) {
      presetSavedList.innerHTML = '';
      Object.keys(presets).forEach(key => {
        const p = presets[key];
        const chip = document.createElement('div');
        chip.className = `preset-chip ${key === activeKey ? 'active' : ''}`;
        chip.innerHTML = `
          <span class="preset-name">${p.name} (${p.students.length}명)</span>
          ${Object.keys(presets).length > 1 ? `<button class="delete-preset-btn" title="학급 삭제" data-key="${key}">✕</button>` : ''}
        `;

        chip.addEventListener('click', (e) => {
          if (e.target.classList.contains('delete-preset-btn')) return;
          window.Roster.loadPreset(key);
          onPresetSwitched();
        });

        const delBtn = chip.querySelector('.delete-preset-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`'${p.name}' 학급을 삭제하시겠습니까?`)) {
              window.Roster.deletePreset(key);
              onPresetSwitched();
            }
          });
        }

        presetSavedList.appendChild(chip);
      });
    }
  }

  function onPresetSwitched() {
    // Reset roulette history DOM display for clean class separation
    const histList = document.getElementById('pickedHistoryList');
    if (histList) {
      histList.innerHTML = '<li class="history-empty">아직 추첨된 학생이 없습니다.</li>';
    }
    // Reset podium order
    if (window.Podium) {
      window.Podium.resetGrid();
    }
    // Repopulate gacha dome
    if (window.Gacha) {
      window.Gacha.populateDomeBalls();
    }
  }

  // Header preset change
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      window.Roster.loadPreset(e.target.value);
      onPresetSwitched();
    });
  }

  // Smart file reader with auto encoding detection (UTF-8 / EUC-KR / CP949)
  function readTextFileSmart(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      let text = '';
      try {
        // Try UTF-8 with fatal: true to throw on invalid byte sequences (ANSI/CP949)
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(buffer);
      } catch (err) {
        // Fallback to Korean Windows ANSI/EUC-KR/CP949
        try {
          const eucDecoder = new TextDecoder('euc-kr');
          text = eucDecoder.decode(buffer);
        } catch (err2) {
          text = new TextDecoder('utf-8').decode(buffer);
        }
      }
      callback(text);
    };
    reader.onerror = () => {
      alert('파일을 읽는 도중 오류가 발생했습니다.');
    };
    reader.readAsArrayBuffer(file);
  }

  // Live Preview for Bulk Input Area
  const bulkPreviewBar = document.getElementById('bulkPreviewBar');
  const previewCountTag = document.getElementById('previewCountTag');
  const previewNamesText = document.getElementById('previewNamesText');
  const textareaDropZone = document.getElementById('textareaDropZone');

  function updateBulkPreview() {
    if (!bulkInputArea || !bulkPreviewBar) return;
    const text = bulkInputArea.value;
    if (!text || !text.trim()) {
      bulkPreviewBar.style.display = 'none';
      bulkPreviewBar.classList.remove('multi-class');
      if (multiClassActionBox) multiClassActionBox.style.display = 'none';
      if (applyBulkRosterBtn) {
        applyBulkRosterBtn.textContent = '➕ 명단 일괄 적용하기';
        applyBulkRosterBtn.className = 'arcade-btn primary-glow full';
      }
      return;
    }

    const parsed = window.Roster ? window.Roster.parseRosterWithClasses(text) : { isMultiClass: false, classes: {}, students: [], totalStudents: 0 };

    if (parsed.isMultiClass) {
      const classNames = Object.keys(parsed.classes);
      bulkPreviewBar.style.display = 'flex';
      bulkPreviewBar.classList.add('multi-class');
      if (previewCountTag) previewCountTag.textContent = `다중 학급 감지 (${classNames.length}개 반)`;
      if (previewNamesText) {
        const details = classNames.map(c => `${c} (${parsed.classes[c].length}명)`).join(', ');
        previewNamesText.textContent = `총 ${parsed.totalStudents}명: ${details}`;
      }
      if (multiClassActionBox) multiClassActionBox.style.display = 'block';
      if (separateClassApplyBtn) {
        separateClassApplyBtn.textContent = `✨ 학급별로 분리하여 각각 저장 (${classNames.length}개 학급 자동 생성)`;
      }
      if (applyBulkRosterBtn) {
        applyBulkRosterBtn.textContent = '현재 학급에 전원 합쳐서 등록';
        applyBulkRosterBtn.className = 'arcade-btn secondary full';
      }
    } else {
      bulkPreviewBar.classList.remove('multi-class');
      if (multiClassActionBox) multiClassActionBox.style.display = 'none';
      if (applyBulkRosterBtn) {
        applyBulkRosterBtn.textContent = '➕ 명단 일괄 적용하기';
        applyBulkRosterBtn.className = 'arcade-btn primary-glow full';
      }

      if (parsed.totalStudents > 0) {
        bulkPreviewBar.style.display = 'flex';
        if (previewCountTag) previewCountTag.textContent = `${parsed.totalStudents}명 인식됨`;
        if (previewNamesText) {
          const previewStr = parsed.students.slice(0, 5).join(', ') + (parsed.totalStudents > 5 ? ` 외 ${parsed.totalStudents - 5}명` : '');
          previewNamesText.textContent = `(예: ${previewStr})`;
        }
      } else {
        bulkPreviewBar.style.display = 'none';
      }
    }
  }

  // Common file text handler with multi-class check
  function handleFileImportText(file, text) {
    if (bulkInputArea) {
      bulkInputArea.value = text;
      updateBulkPreview();
    }

    const parsed = window.Roster ? window.Roster.parseRosterWithClasses(text) : { isMultiClass: false, classes: {}, students: [], totalStudents: 0 };

    if (parsed.isMultiClass) {
      const classNames = Object.keys(parsed.classes);
      const summary = classNames.map(c => `${c} (${parsed.classes[c].length}명)`).join(', ');
      const shouldSplit = confirm(
        `'${file.name}' 파일에서 총 ${classNames.length}개 학급이 감지되었습니다!\n(${summary})\n\n` +
        `[확인] : 학급별로 분리하여 각각 자동 저장 (추천)\n` +
        `[취소] : 현재 선택된 학급('${window.Roster.getCurrentPresetName()}')에 전원 합쳐서 등록`
      );

      if (shouldSplit) {
        const count = window.Roster.importMultiClassPresets(parsed.classes);
        const details = classNames.map(c => `• ${c}: ${parsed.classes[c].length}명`).join('\n');
        alert(`🎉 총 ${count}개 학급 명단이 안전하게 분리되어 등록되었습니다!\n\n${details}\n\n상단 [📁 명단 선택]에서 학급을 전환하여 추첨하세요.`);
      } else {
        const allNames = [].concat(...Object.values(parsed.classes));
        window.Roster.students = allNames.map(name => ({ name, absent: false, picked: false }));
        window.Roster.notify();
        alert(`총 ${allNames.length}명의 학생이 '${window.Roster.getCurrentPresetName()}' 학급에 등록되었습니다.`);
      }
    } else {
      const count = window.Roster.importBulkText(text);
      if (count > 0) {
        const names = window.Roster.getActiveStudents().map(s => s.name);
        const preview = names.slice(0, 6).join(', ') + (names.length > 6 ? ` 외 ${names.length - 6}명` : '');
        alert(`'${file.name}' 파일에서 총 ${count}명의 학생 명단을 불러왔습니다!\n\n등록된 학생:\n${preview}`);
      } else {
        alert('파일을 읽었으나 학생 이름을 자동으로 구분하지 못했습니다.\n입력 상자 아래의 [⚡ 강제 등록] 버튼을 눌러보세요.');
      }
    }
  }

  if (bulkInputArea) {
    bulkInputArea.addEventListener('input', updateBulkPreview);
    bulkInputArea.addEventListener('paste', (e) => {
      // Check if file was copied directly into clipboard
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.name.match(/\.(txt|csv)$/i) || file.type.startsWith('text/')) {
          e.preventDefault();
          readTextFileSmart(file, (content) => {
            handleFileImportText(file, content);
          });
          return;
        }
      }
      setTimeout(updateBulkPreview, 50);
    });
  }

  // Drag and Drop on Textarea
  if (textareaDropZone && bulkInputArea) {
    ['dragenter', 'dragover'].forEach(eventName => {
      textareaDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        textareaDropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      textareaDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        textareaDropZone.classList.remove('dragover');
      });
    });

    textareaDropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        readTextFileSmart(file, (content) => {
          handleFileImportText(file, content);
        });
      }
    });
  }

  // Clipboard Paste Button
  const clipboardPasteBtn = document.getElementById('clipboardPasteBtn');
  const clearTextareaBtn = document.getElementById('clearTextareaBtn');
  const forceApplyRosterBtn = document.getElementById('forceApplyRosterBtn');

  if (clipboardPasteBtn && bulkInputArea) {
    clipboardPasteBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const clipText = await navigator.clipboard.readText();
          if (clipText && clipText.trim()) {
            bulkInputArea.value = clipText;
            updateBulkPreview();
          } else {
            alert('클립보드가 비어있습니다. 먼저 명단 텍스트를 복사(Ctrl+C)한 후 눌러주세요.');
          }
        } else {
          bulkInputArea.focus();
          alert('브라우저 권한으로 인해 자동 읽기가 제한되었습니다. 상자를 클릭하고 Ctrl+V 로 붙여넣어 주세요.');
        }
      } catch (err) {
        bulkInputArea.focus();
        alert('클립보드 읽기 오류가 발생했습니다. 상자에 직접 Ctrl+V 로 붙여넣어 주세요.');
      }
    });
  }

  if (clearTextareaBtn && bulkInputArea) {
    clearTextareaBtn.addEventListener('click', () => {
      bulkInputArea.value = '';
      updateBulkPreview();
    });
  }

  // Separate Classes Apply Button
  if (separateClassApplyBtn && bulkInputArea) {
    separateClassApplyBtn.addEventListener('click', () => {
      const text = bulkInputArea.value;
      if (!text || !text.trim()) return;

      const parsed = window.Roster.parseRosterWithClasses(text);
      if (!parsed.isMultiClass) return;

      const classNames = Object.keys(parsed.classes);
      const count = window.Roster.importMultiClassPresets(parsed.classes);

      const preview = classNames.map(c => `• ${c}: ${parsed.classes[c].length}명`).join('\n');
      alert(`🎉 총 ${count}개 학급 명단이 안전하게 분리되어 저장되었습니다!\n\n${preview}\n\n상단 [📁 명단 선택] 또는 학급 목록에서 원하는 반을 선택해 추첨하세요.`);
      bulkInputArea.value = '';
      updateBulkPreview();
      onPresetSwitched();
    });
  }

  // Force Apply Button (Bypasses any strict filters, adds everything line-by-line)
  if (forceApplyRosterBtn && bulkInputArea) {
    forceApplyRosterBtn.addEventListener('click', () => {
      const text = bulkInputArea.value;
      if (!text || !text.trim()) {
        alert('먼저 텍스트 상자에 명단을 입력해주세요.');
        return;
      }

      // Split strictly by line breaks or commas
      const rawTokens = text.split(/[\r\n,;]+/)
        .map(s => s.trim().replace(/^["'“”‘’]|["'“”‘’]$/g, ''))
        .filter(s => s.length > 0 && s.length <= 30 && !/^\d+$/.test(s));

      if (rawTokens.length === 0) {
        alert('추가할 수 있는 항목이 없습니다.');
        return;
      }

      window.Roster.students = rawTokens.map(name => ({
        name,
        absent: false,
        picked: false
      }));
      window.Roster.notify();

      alert(`총 ${rawTokens.length}명의 학생이 강제 등록되었습니다!`);
      bulkInputArea.value = '';
      updateBulkPreview();
    });
  }

  // Bulk Apply
  if (applyBulkRosterBtn && bulkInputArea) {
    applyBulkRosterBtn.addEventListener('click', () => {
      const text = bulkInputArea.value;
      if (!text || !text.trim()) {
        alert('명단 텍스트를 상자에 먼저 입력해주세요.');
        return;
      }

      const parsed = window.Roster.parseRosterWithClasses(text);

      if (parsed.isMultiClass) {
        const classNames = Object.keys(parsed.classes);
        const shouldSplit = confirm(
          `이 명단에는 ${classNames.length}개 학급(${classNames.join(', ')})이 포함되어 있습니다.\n\n` +
          `[확인] : 학급별로 분리하여 각각 저장 (추천)\n` +
          `[취소] : 현재 학급('${window.Roster.getCurrentPresetName()}')에 전원 합쳐서 등록`
        );

        if (shouldSplit) {
          const count = window.Roster.importMultiClassPresets(parsed.classes);
          const preview = classNames.map(c => `• ${c}: ${parsed.classes[c].length}명`).join('\n');
          alert(`🎉 총 ${count}개 학급 명단이 분리되어 저장되었습니다!\n\n${preview}`);
          bulkInputArea.value = '';
          updateBulkPreview();
          onPresetSwitched();
          return;
        } else {
          const allNames = [].concat(...Object.values(parsed.classes));
          window.Roster.students = allNames.map(name => ({ name, absent: false, picked: false }));
          window.Roster.notify();
          alert(`총 ${allNames.length}명의 학생이 '${window.Roster.getCurrentPresetName()}' 학급에 등록되었습니다.`);
          bulkInputArea.value = '';
          updateBulkPreview();
          return;
        }
      }

      if (parsed.totalStudents === 0) {
        alert('인식 가능한 학생 이름을 찾지 못했습니다.\n오른쪽의 [⚡ 강제 등록] 버튼을 눌러보세요.');
        return;
      }

      const count = window.Roster.importBulkText(text);
      if (count > 0) {
        const preview = parsed.students.slice(0, 6).join(', ') + (parsed.students.length > 6 ? ` 외 ${parsed.students.length - 6}명` : '');
        alert(`총 ${count}명의 학생이 '${window.Roster.getCurrentPresetName()}' 학급에 등록되었습니다!\n\n등록된 학생:\n${preview}`);
        bulkInputArea.value = '';
        updateBulkPreview();
      }
    });
  }

  // Single Add
  function handleSingleAdd() {
    if (!singleStudentInput) return;
    const name = singleStudentInput.value;
    if (window.Roster.addStudent(name)) {
      singleStudentInput.value = '';
      singleStudentInput.focus();
    }
  }

  if (addSingleStudentBtn) addSingleStudentBtn.addEventListener('click', handleSingleAdd);
  if (singleStudentInput) {
    singleStudentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSingleAdd();
    });
  }

  // Create New Class (Empty)
  if (createNewClassBtn) {
    createNewClassBtn.addEventListener('click', () => {
      const name = prompt('새로 추가할 학급(반) 이름을 입력하세요:\n(예: 1학년 2반, 3반, 방과후A반)', '');
      if (name && name.trim()) {
        window.Roster.createNewEmptyPreset(name.trim());
        onPresetSwitched();
        alert(`'${name.trim()}' 학급이 새로 추가되었습니다.\n이제 학생 이름을 추가하거나 명단을 붙여넣으세요!`);
      }
    });
  }

  // Rename Current Class
  if (renamePresetBtn) {
    renamePresetBtn.addEventListener('click', () => {
      const currentName = window.Roster.getCurrentPresetName();
      const newName = prompt(`'${currentName}' 학급의 새로운 이름을 입력하세요:`, currentName);
      if (newName && newName.trim() && newName.trim() !== currentName) {
        window.Roster.renameCurrentPreset(newName.trim());
        alert(`학급 이름이 '${newName.trim()}'(으)로 변경되었습니다!`);
      }
    });
  }

  // Save/Copy Current Preset
  if (saveCurrentPresetBtn && newPresetNameInput) {
    saveCurrentPresetBtn.addEventListener('click', () => {
      const name = newPresetNameInput.value.trim();
      if (!name) {
        alert('새 학급 이름을 입력해주세요 (예: 2학년 4반)');
        return;
      }
      window.Roster.savePreset(name);
      newPresetNameInput.value = '';
      alert(`현재 명단이 '${name}' 학급으로 저장되었습니다!`);
    });
  }

  // Sample Students
  if (loadSampleStudentsBtn) {
    loadSampleStudentsBtn.addEventListener('click', () => {
      if (confirm('현재 학급 명단을 샘플 명단으로 교체할까요?')) {
        window.Roster.loadSample();
      }
    });
  }

  // Export TXT
  if (exportRosterBtn) {
    exportRosterBtn.addEventListener('click', () => {
      window.Roster.exportTextFile();
    });
  }

  // Import TXT/CSV
  if (importRosterFileInput) {
    // Reset file value on click so re-uploading the same file works every time
    importRosterFileInput.addEventListener('click', function() {
      this.value = null;
    });

    importRosterFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      readTextFileSmart(file, (text) => {
        handleFileImportText(file, text);
        importRosterFileInput.value = '';
      });
    });
  }

  // Clear All
  if (clearAllRosterBtn) {
    clearAllRosterBtn.addEventListener('click', () => {
      if (confirm('명단 전체를 비우시겠습니까?')) {
        window.Roster.clearRoster();
      }
    });
  }

  // All Present
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      window.Roster.setAllPresent();
    });
  }

  // Reset Picked
  if (resetPickedFlagsBtn) {
    resetPickedFlagsBtn.addEventListener('click', () => {
      window.Roster.resetAllPicked();
    });
  }

  // Listen to Roster changes
  if (window.Roster) {
    window.Roster.onChange(() => {
      renderRosterUI();
    });
    // Initial Render
    renderRosterUI();
  }
});
