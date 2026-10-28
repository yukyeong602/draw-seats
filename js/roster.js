/**
 * CLASSROOM ARCADE - ROSTER MANAGER
 * Manages students, attendance/exclusion, multi-class presets, and storage
 */

class RosterManager {
  constructor() {
    this.students = [];
    this.presets = {};
    this.currentPresetKey = 'default';
    this.listeners = [];

    this.defaultList = [
      "김민준", "이서아", "박도윤", "정하은", "최지우", 
      "강시우", "조유진", "윤서진", "유한결", "서은우", 
      "임채원", "송민재", "황수아", "오승현", "신다은", 
      "백승우", "권예나", "장현우"
    ];

    this.loadFromStorage();
  }

  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notify() {
    this.saveToStorage();
    this.listeners.forEach(cb => cb(this));
  }

  loadFromStorage() {
    try {
      const savedPresets = localStorage.getItem('arcade_presets');
      if (savedPresets) {
        this.presets = JSON.parse(savedPresets);
      } else {
        this.presets = {
          'default': {
            name: '기본 3반 명단',
            students: this.defaultList.map(name => ({ name, absent: false, picked: false }))
          }
        };
      }

      const activeKey = localStorage.getItem('arcade_active_preset') || 'default';
      if (this.presets[activeKey]) {
        this.currentPresetKey = activeKey;
        this.students = JSON.parse(JSON.stringify(this.presets[activeKey].students || []));
      } else {
        const firstKey = Object.keys(this.presets)[0] || 'default';
        this.currentPresetKey = firstKey;
        this.students = this.presets[firstKey] ? JSON.parse(JSON.stringify(this.presets[firstKey].students || [])) : [];
      }
    } catch (e) {
      console.warn('Storage read error, using defaults', e);
      this.presets = {
        'default': {
          name: '기본 3반 명단',
          students: this.defaultList.map(name => ({ name, absent: false, picked: false }))
        }
      };
      this.currentPresetKey = 'default';
      this.students = JSON.parse(JSON.stringify(this.presets['default'].students));
    }
  }

  saveToStorage() {
    try {
      if (this.presets[this.currentPresetKey]) {
        // Deep copy so references are strictly isolated between presets
        this.presets[this.currentPresetKey].students = JSON.parse(JSON.stringify(this.students));
      }
      localStorage.setItem('arcade_presets', JSON.stringify(this.presets));
      localStorage.setItem('arcade_active_preset', this.currentPresetKey);
    } catch (e) {
      console.warn('Storage write error', e);
    }
  }

  getCurrentPresetName() {
    return (this.presets[this.currentPresetKey] && this.presets[this.currentPresetKey].name) || '기본 명단';
  }

  getActiveStudents() {
    // Only non-absent students available for draw
    return this.students.filter(s => !s.absent);
  }

  getEligibleStudents(excludePicked = true) {
    return this.students.filter(s => !s.absent && (!excludePicked || !s.picked));
  }

  addStudent(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    
    // Prevent direct duplicate names if already exists within this class
    const exists = this.students.some(s => s.name === trimmed);
    const finalName = exists ? `${trimmed} (${this.students.filter(s => s.name.startsWith(trimmed)).length + 1})` : trimmed;

    this.students.push({
      name: finalName,
      absent: false,
      picked: false
    });
    this.notify();
    return true;
  }

  removeStudent(index) {
    if (index >= 0 && index < this.students.length) {
      this.students.splice(index, 1);
      this.notify();
    }
  }

  toggleAbsent(index) {
    if (index >= 0 && index < this.students.length) {
      this.students[index].absent = !this.students[index].absent;
      this.notify();
    }
  }

  markPicked(studentName, picked = true) {
    const found = this.students.find(s => s.name === studentName);
    if (found) {
      found.picked = picked;
      this.notify();
    }
  }

  resetAllPicked() {
    this.students.forEach(s => s.picked = false);
    this.notify();
  }

  setAllPresent() {
    this.students.forEach(s => s.absent = false);
    this.notify();
  }

  clearRoster() {
    this.students = [];
    this.notify();
  }

  // Deduplicate names within a single list
  deduplicateNames(nameList) {
    const result = [];
    const counts = {};
    for (let raw of nameList) {
      const name = (raw || '').trim();
      if (!name) continue;
      if (counts[name]) {
        counts[name]++;
        result.push(`${name} (${counts[name]})`);
      } else {
        counts[name] = 1;
        result.push(name);
      }
    }
    return result;
  }

  // Detect and normalize a class string, e.g. "[1반]" -> "1반", "1-2" -> "1-2반", "1학년 2반" -> "1학년 2반"
  detectClassString(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.trim()
      .replace(/^[\=\-\#\*\_~]{2,}|\s*[\=\-\#\*\_~]{2,}$/g, '')
      .replace(/^[\[\<\(（【]\s*|\s*[\]\>\)）】]$/g, '')
      .trim();

    if (!s) return null;

    // Pattern 1: "1학년 2반", "1학년 2반 명단"
    const m1 = s.match(/^(\d+)\s*학년\s*(\d+)\s*반(?:\s*(?:명단|학생명단|출석부|목록))?$/);
    if (m1) return `${m1[1]}학년 ${m1[2]}반`;

    // Pattern 2: "1반", "12반", "3반 명단"
    const m2 = s.match(/^(\d+)\s*반(?:\s*(?:명단|학생명단|출석부|목록))?$/);
    if (m2) return `${m2[1]}반`;

    // Pattern 3: "1-2", "1-2반"
    const m3 = s.match(/^(\d+)\s*[-_]\s*(\d+)(?:\s*반)?$/);
    if (m3) return `${m3[1]}-${m3[2]}반`;

    // Pattern 4: "A반", "B반", "C반", "햇살반", "장미반"
    if (/^[A-Za-z가-힣]{1,6}\s*반$/.test(s) && !['일반', '후반', '전반', '절반'].includes(s)) {
      return s;
    }

    // Pattern 5: "1조", "2조", "A조", "B조", "1팀", "2팀", "청팀", "백팀", "홍팀"
    if (/^(\d+|[A-Za-z])\s*(?:조|팀)$/.test(s) || /^(?:청팀|백팀|홍팀)$/.test(s)) {
      return s;
    }

    return null;
  }

  // Detect if a single line is a class section header (e.g. "[1반]", "1반", "=== 2반 명단 ===")
  detectClassHeaderLine(line) {
    if (!line || typeof line !== 'string') return null;
    const trimmed = line.trim();
    if (trimmed.length > 35) return null; // headers are short
    return this.detectClassString(trimmed);
  }

  // Smart cleanup for an individual student name candidate
  cleanSingleName(str, ignoredWords = null) {
    if (!str) return '';
    let s = str.trim();

    // 1. Remove surrounding quotes
    s = s.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();

    // 2. Strip leading numbering: "1.", "1)", "01.", "1번", "1 - ", "[1]", "(1)" etc.
    s = s.replace(/^[\(\[]?\d+[\)\]\.\s\-\:\,\번\회\등]+\s*/, '');

    // 3. Strip leading bullet points: "-", "*", "•", "·", "★", etc.
    s = s.replace(/^[\-\*\•\·\★\▶\■\□\◆\◇\·\✔\✓\o\O\>]\s*/, '');

    // 4. Strip trailing parentheses or brackets: " (반장)", " [1조]", " (남)"
    s = s.replace(/\s*[\(\[\<（【].*?[\)\]\>）】]\s*$/, '').trim();

    // 5. Final quote check
    s = s.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();

    if (!s) return '';
    if (/^\d+$/.test(s)) return ''; // Pure numbers are not names
    if (ignoredWords && ignoredWords.has(s.toLowerCase())) return '';

    return s;
  }

  // Smart Multi-Class & Single Roster Parser
  // Returns: { isMultiClass: boolean, classes: { [className]: string[] }, students: string[], totalStudents: number }
  parseRosterWithClasses(text) {
    if (!text || typeof text !== 'string') {
      return { isMultiClass: false, classes: {}, students: [], totalStudents: 0 };
    }

    // Remove BOM
    const raw = text.replace(/^\uFEFF/, '').trim();
    if (!raw) {
      return { isMultiClass: false, classes: {}, students: [], totalStudents: 0 };
    }

    const ignoredWords = new Set([
      '번호', '순번', '순서', '학번', '이름', '성명', '학생명', '학생이름',
      '남', '여', '성별', '비고', '출석', '결석', '체크', '명단', '학년', '반', '학급',
      '출석번호', '이메일', '연락처', '전화번호', '생년월일', '조', '팀', '과목',
      'no', 'num', 'number', 'name', 'student', 'gender', 'remark', 'note', 'status', 'class'
    ]);

    const rawLines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // ==========================================================
    // Strategy 1: Tab-separated (Excel / TSV) or CSV Table
    // ==========================================================
    const hasTabs = rawLines.filter(l => l.includes('\t')).length >= 2;
    const hasCsv = !hasTabs && rawLines.filter(l => l.includes(',')).length >= 2;

    if (hasTabs || hasCsv) {
      const delimiter = hasTabs ? '\t' : ',';
      const splitRows = rawLines.map(l => l.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, '')));

      // Check for header row
      let headerRowIdx = -1;
      let colGrade = -1, colClass = -1, colName = -1;

      for (let i = 0; i < Math.min(splitRows.length, 3); i++) {
        const row = splitRows[i];
        row.forEach((cell, idx) => {
          const cLower = cell.toLowerCase();
          if (cLower === '학년') colGrade = idx;
          else if (cLower === '반' || cLower === '학급' || cLower === '반명' || cLower === 'class') colClass = idx;
          else if (cLower === '이름' || cLower === '성명' || cLower === '학생명' || cLower === '학생이름' || cLower === 'name') colName = idx;
        });
        if (colName !== -1 && (colClass !== -1 || colGrade !== -1)) {
          headerRowIdx = i;
          break;
        }
      }

      // If header row with Class column was found:
      if (headerRowIdx !== -1 && (colClass !== -1 || colGrade !== -1) && colName !== -1) {
        const classMap = {};
        let total = 0;

        for (let i = headerRowIdx + 1; i < splitRows.length; i++) {
          const row = splitRows[i];
          if (!row || row.length === 0) continue;

          let className = '';
          if (colGrade !== -1 && colClass !== -1 && row[colGrade] && row[colClass]) {
            const g = row[colGrade].replace(/[^0-9]/g, '');
            const c = row[colClass].replace(/[^0-9]/g, '') || row[colClass];
            className = `${g ? g + '학년 ' : ''}${c}${String(c).includes('반') ? '' : '반'}`;
          } else if (colClass !== -1 && row[colClass]) {
            const c = row[colClass];
            className = /^\d+$/.test(c) ? `${c}반` : (this.detectClassString(c) || c);
          }

          const rawName = row[colName];
          const studentName = this.cleanSingleName(rawName, ignoredWords);

          if (className && studentName && !ignoredWords.has(studentName.toLowerCase())) {
            if (!classMap[className]) classMap[className] = [];
            classMap[className].push(studentName);
            total++;
          }
        }

        if (Object.keys(classMap).length >= 2) {
          const resultClasses = {};
          for (let c in classMap) {
            resultClasses[c] = this.deduplicateNames(classMap[c]);
          }
          return { isMultiClass: true, classes: resultClasses, students: [], totalStudents: total };
        }
      }

      // If no explicit header, test if Col 0 is Class (e.g. "1반", "1-1", "1학년 1반")
      const inferredClasses = {};
      let inferredTotal = 0;

      for (let row of splitRows) {
        if (row.length < 2) continue;
        const cell0 = row[0];
        const classCandidate = this.detectClassString(cell0);
        if (classCandidate) {
          let nameFound = '';
          for (let j = 1; j < row.length; j++) {
            const cleaned = this.cleanSingleName(row[j], ignoredWords);
            if (cleaned && !/^\d+$/.test(cleaned) && !ignoredWords.has(cleaned.toLowerCase())) {
              nameFound = cleaned;
              break;
            }
          }
          if (nameFound) {
            if (!inferredClasses[classCandidate]) inferredClasses[classCandidate] = [];
            inferredClasses[classCandidate].push(nameFound);
            inferredTotal++;
          }
        }
      }

      if (Object.keys(inferredClasses).length >= 2) {
        const resultClasses = {};
        for (let c in inferredClasses) {
          resultClasses[c] = this.deduplicateNames(inferredClasses[c]);
        }
        return { isMultiClass: true, classes: resultClasses, students: [], totalStudents: inferredTotal };
      }
    }

    // ==========================================================
    // Strategy 2: Inline Class Colons (e.g. "1반: 홍길동, 김철수")
    // ==========================================================
    const colonClassMap = {};
    let colonMatchesCount = 0;
    let colonTotal = 0;

    for (let line of rawLines) {
      const colonMatch = line.match(/^([0-9가-힣A-Za-z\s\-_]+(?:반|학년\s*[0-9]+반|[0-9]+-[0-9]+|팀|조))\s*[:：]\s*(.+)$/);
      if (colonMatch) {
        const rawCName = colonMatch[1].trim();
        const detected = this.detectClassString(rawCName) || rawCName;
        const namesPart = colonMatch[2];
        const parsedNames = this.parseRosterText(namesPart);
        if (parsedNames.length > 0) {
          if (!colonClassMap[detected]) colonClassMap[detected] = [];
          colonClassMap[detected].push(...parsedNames);
          colonMatchesCount++;
          colonTotal += parsedNames.length;
        }
      }
    }

    if (colonMatchesCount >= 2 && Object.keys(colonClassMap).length >= 2) {
      const resultClasses = {};
      for (let c in colonClassMap) {
        resultClasses[c] = this.deduplicateNames(colonClassMap[c]);
      }
      return { isMultiClass: true, classes: resultClasses, students: [], totalStudents: colonTotal };
    }

    // ==========================================================
    // Strategy 3: Section Headers (e.g. "[1반]", "1반", "=== 2반 ===")
    // ==========================================================
    const sectionClassMap = {};
    let currentSectionClass = null;
    let headerCount = 0;
    let sectionTotal = 0;

    for (let line of rawLines) {
      const headerName = this.detectClassHeaderLine(line);
      if (headerName) {
        currentSectionClass = headerName;
        if (!sectionClassMap[currentSectionClass]) {
          sectionClassMap[currentSectionClass] = [];
          headerCount++;
        }
        continue;
      }

      if (currentSectionClass) {
        const namesInLine = this.parseRosterText(line);
        for (let n of namesInLine) {
          sectionClassMap[currentSectionClass].push(n);
          sectionTotal++;
        }
      }
    }

    if (headerCount >= 2 && Object.keys(sectionClassMap).length >= 2 && sectionTotal > 0) {
      const resultClasses = {};
      for (let c in sectionClassMap) {
        resultClasses[c] = this.deduplicateNames(sectionClassMap[c]);
      }
      return { isMultiClass: true, classes: resultClasses, students: [], totalStudents: sectionTotal };
    }

    // ==========================================================
    // Strategy 4: Line Prefix / Student ID (e.g. "1반 김민준", "10101 김민준", "1-1 김민준")
    // ==========================================================
    const prefixClassMap = {};
    let prefixCount = 0;
    let prefixTotal = 0;

    for (let line of rawLines) {
      // 5-digit student ID: e.g. 10105 김민준 -> 1학년 1반
      const id5Match = line.match(/^([1-6])([0-9]{2})([0-9]{2})\s+(.+)$/);
      if (id5Match) {
        const g = parseInt(id5Match[1], 10);
        const c = parseInt(id5Match[2], 10);
        const cName = `${g}학년 ${c}반`;
        const name = this.cleanSingleName(id5Match[4], ignoredWords);
        if (name) {
          if (!prefixClassMap[cName]) prefixClassMap[cName] = [];
          prefixClassMap[cName].push(name);
          prefixTotal++;
          prefixCount++;
          continue;
        }
      }

      // Pattern: "1반 김민준", "1학년 2반 김민준", "1-2 김민준"
      const prefixMatch = line.match(/^([\[\<\(（【]?\s*(?:\d+\s*학년\s*\d+\s*반|\d+\s*반|\d+\s*[-_]\s*\d+(?:\s*반)?|[A-Za-z가-힣]{1,5}반)\s*[\]\>\)）】]?)\s+(.+)$/);
      if (prefixMatch) {
        const cName = this.detectClassString(prefixMatch[1]);
        if (cName) {
          const namePart = prefixMatch[2];
          const name = this.cleanSingleName(namePart, ignoredWords);
          if (name && !ignoredWords.has(name.toLowerCase())) {
            if (!prefixClassMap[cName]) prefixClassMap[cName] = [];
            prefixClassMap[cName].push(name);
            prefixTotal++;
            prefixCount++;
            continue;
          }
        }
      }
    }

    if (Object.keys(prefixClassMap).length >= 2 && prefixCount >= 2) {
      const resultClasses = {};
      for (let c in prefixClassMap) {
        resultClasses[c] = this.deduplicateNames(prefixClassMap[c]);
      }
      return { isMultiClass: true, classes: resultClasses, students: [], totalStudents: prefixTotal };
    }

    // ==========================================================
    // Fallback: Single Class (standard behavior)
    // ==========================================================
    const singleNames = this.parseRosterText(raw);
    return {
      isMultiClass: false,
      classes: {},
      students: singleNames,
      totalStudents: singleNames.length
    };
  }

  // Robust Smart Parser: Universally handles any format with zero rejection
  parseRosterText(text) {
    if (!text || typeof text !== 'string') return [];

    // Remove BOM and carriage returns
    let raw = text.replace(/^\uFEFF/, '').trim();
    if (!raw) return [];

    // Common non-name words to ignore (table headers, statuses, categories)
    const ignoredWords = new Set([
      '번호', '순번', '순서', '학번', '이름', '성명', '학생명', '학생이름',
      '남', '여', '성별', '비고', '출석', '결석', '체크', '명단', '학년', '반', '학급',
      '출석번호', '이메일', '연락처', '전화번호', '생년월일', '조', '팀', '과목',
      'no', 'num', 'number', 'name', 'student', 'gender', 'remark', 'note', 'status', 'class'
    ]);

    // Pre-normalization: Turn numbers, tabs, commas, slashes, pipes into clean newlines
    // 1. Turn inline numbers (" 1. ", " 2번 ", " 3) ", " 4- ") into line breaks
    let normalized = raw.replace(/(?:^|\s)\d+[\.\)\번\:\,\-\]]\s*/g, '\n');
    // 2. Turn bracketed numbers (" [1] ", " (1) ") into line breaks
    normalized = normalized.replace(/(?:^|\s)[\(\[]\d+[\)\]]\s*/g, '\n');
    // 3. Turn common delimiters (commas, semicolons, tabs, pipes, slashes) into line breaks
    normalized = normalized.replace(/[,;/\t|]+/g, '\n');

    const lines = normalized.split(/\r?\n/);
    const candidates = [];

    for (let rawLine of lines) {
      let line = rawLine.trim();
      if (!line) continue;

      // Skip decorative lines: "=== 명단 ==="
      if (/^[\=\-\#\*\_~]{2,}/.test(line)) continue;

      // Strip quotes and leading bullets/numbers
      line = line.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();
      line = line.replace(/^[\(\[]?\d+[\)\]\.\s\-\:\,\번\회\등]*\s*/, '');
      line = line.replace(/^[\-\*\•\·\★\▶\■\□\◆\◇\·\✔\✓\o\O\>]\s*/, '');
      // Strip trailing brackets: "(반장)", "[1조]"
      line = line.replace(/\s*[\(\[\<（【].*?[\)\]\>）】]\s*$/, '').trim();

      if (!line) continue;
      if (/^\d+$/.test(line)) continue;
      if (ignoredWords.has(line.toLowerCase())) continue;

      // If line still contains multiple space-separated words (e.g. "김철수 이영희 박민수")
      const words = line.split(/\s+/).filter(Boolean);
      if (words.length > 1 && words.every(w => !ignoredWords.has(w.toLowerCase()) && !/^\d+$/.test(w))) {
        words.forEach(w => {
          const cw = w.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();
          if (cw && !ignoredWords.has(cw.toLowerCase()) && !/^\d+$/.test(cw)) {
            candidates.push(cw);
          }
        });
      } else {
        candidates.push(line);
      }
    }

    // Deduplication & final validation
    const result = [];
    const nameCounts = {};

    for (let name of candidates) {
      name = name.trim();
      if (!name || name.length > 25 || ignoredWords.has(name.toLowerCase())) continue;
      if (/^\d+$/.test(name)) continue;

      if (nameCounts[name]) {
        nameCounts[name]++;
        result.push(`${name} (${nameCounts[name]})`);
      } else {
        nameCounts[name] = 1;
        result.push(name);
      }
    }

    // GUARANTEED FALLBACK: If smart filter returned empty, take all non-empty raw lines!
    if (result.length === 0 && raw.length > 0) {
      const fallbackList = raw.split(/[\r\n,;/\t]+/)
        .map(s => s.trim().replace(/^["'“”‘’]|["'“”‘’]$/g, ''))
        .filter(s => s.length > 0 && s.length <= 30 && !/^\d+$/.test(s));
      return fallbackList;
    }

    return result;
  }

  // Preview parsed names or multi-class structure
  previewParsedNames(text) {
    return this.parseRosterWithClasses(text);
  }

  // Import multi-class presets: Creates or updates separate presets for each detected class
  importMultiClassPresets(classesMap) {
    const classNames = Object.keys(classesMap || {});
    if (classNames.length === 0) return 0;

    let firstKey = null;

    classNames.forEach((cName, idx) => {
      const studentNames = classesMap[cName] || [];
      const students = studentNames.map(name => ({
        name,
        absent: false,
        picked: false
      }));

      // Find if preset with exact name already exists
      let existingKey = Object.keys(this.presets).find(k => this.presets[k].name === cName);
      let key = existingKey || ('preset_' + Date.now() + '_' + idx);

      this.presets[key] = {
        name: cName,
        students: students
      };

      if (!firstKey) firstKey = key;
    });

    if (firstKey) {
      this.currentPresetKey = firstKey;
      this.students = JSON.parse(JSON.stringify(this.presets[firstKey].students));
    }

    this.notify();
    return classNames.length;
  }

  // Bulk import from text string (automatically handles both single and multi-class)
  importBulkText(text) {
    const parsed = this.parseRosterWithClasses(text);

    if (parsed.isMultiClass) {
      return this.importMultiClassPresets(parsed.classes);
    }

    const validNames = parsed.students;
    if (validNames.length === 0) return 0;

    this.students = validNames.map(name => ({
      name,
      absent: false,
      picked: false
    }));

    this.notify();
    return validNames.length;
  }

  // Presets management: Save current students to named preset
  savePreset(presetName) {
    if (!presetName || !presetName.trim()) return false;
    const trimmed = presetName.trim();

    // Check if preset with same name exists
    const existingKey = Object.keys(this.presets).find(k => this.presets[k].name === trimmed);
    const key = existingKey || ('preset_' + Date.now());

    this.presets[key] = {
      name: trimmed,
      students: JSON.parse(JSON.stringify(this.students))
    };
    this.currentPresetKey = key;
    this.students = JSON.parse(JSON.stringify(this.presets[key].students));
    this.notify();
    return key;
  }

  // Create a brand new empty preset ready for adding a new class from scratch
  createNewEmptyPreset(presetName) {
    const trimmed = (presetName || '').trim() || `새 학급 ${Object.keys(this.presets).length + 1}`;
    const key = 'preset_' + Date.now();

    this.presets[key] = {
      name: trimmed,
      students: []
    };
    this.currentPresetKey = key;
    this.students = [];
    this.notify();
    return key;
  }

  // Rename current active preset
  renameCurrentPreset(newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed || !this.presets[this.currentPresetKey]) return false;
    this.presets[this.currentPresetKey].name = trimmed;
    this.notify();
    return true;
  }

  // Duplicate current preset
  duplicateCurrentPreset(copyName) {
    const currentName = this.getCurrentPresetName();
    const targetName = (copyName || '').trim() || `${currentName} (사본)`;
    const key = 'preset_' + Date.now();
    this.presets[key] = {
      name: targetName,
      students: JSON.parse(JSON.stringify(this.students))
    };
    this.currentPresetKey = key;
    this.students = JSON.parse(JSON.stringify(this.presets[key].students));
    this.notify();
    return key;
  }

  loadPreset(key) {
    if (this.presets[key]) {
      // Save current active preset's students first
      if (this.presets[this.currentPresetKey]) {
        this.presets[this.currentPresetKey].students = JSON.parse(JSON.stringify(this.students));
      }
      this.currentPresetKey = key;
      this.students = JSON.parse(JSON.stringify(this.presets[key].students || []));
      this.notify();
      return true;
    }
    return false;
  }

  deletePreset(key) {
    const keys = Object.keys(this.presets);
    if (keys.length <= 1) {
      alert('마지막 학급 명단은 삭제할 수 없습니다.');
      return false;
    }
    if (this.presets[key]) {
      delete this.presets[key];
      if (this.currentPresetKey === key) {
        const remainingKeys = Object.keys(this.presets);
        this.currentPresetKey = remainingKeys[0];
        this.students = JSON.parse(JSON.stringify(this.presets[this.currentPresetKey].students || []));
      }
      this.notify();
      return true;
    }
    return false;
  }

  loadSample() {
    this.students = this.defaultList.map(name => ({
      name,
      absent: false,
      picked: false
    }));
    this.notify();
  }

  exportTextFile() {
    const className = this.getCurrentPresetName();
    const content = `# ${className} 명단\n` + this.students.map(s => s.name).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Global Roster Instance
window.Roster = new RosterManager();
