// fretboard.js — motor de diagramas de acorde e escala, com as 5 formas do sistema CAGED
// Dados de acordes extraídos e conferidos contra o Guia de Acordes (Vilmar Gusberti) —
// cada forma abaixo é o "template" na posição R=0 (a forma aberta correspondente à sua letra).

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Cordas 6ª (E grave) → 1ª (e agudo)
const OPEN_STRING_PC   = [4, 9, 2, 7, 11, 4];
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

// pc da "nota-nome" de cada forma (usada para calcular R = casa da pestana)
const SHAPE_ANCHOR_PC = { C:0, A:9, G:7, E:4, D:2 };
const SHAPE_ORDER = ['C','A','G','E','D'];

// null = corda a não tocar (abafada); número = traste relativo a R
const CHORD_SHAPES = {
  maior: {
    C: [null, 3, 2, 0, 1, 0],
    A: [null, 0, 2, 2, 2, 0],
    G: [3, 2, 0, 0, 0, 3],
    E: [0, 2, 2, 1, 0, 0],
    D: [null, null, 0, 2, 3, 2],
  },
  menor: {
    C: [null, 3, 1, 0, 1, null],
    A: [null, 0, 2, 2, 1, 0],
    G: [3, 1, 0, 0, 3, null],
    E: [0, 2, 2, 0, 0, 0],
    D: [null, null, 0, 2, 3, 1],
  },
  '7': {
    C: [null, 3, 2, 3, 1, 0],
    A: [null, 0, 2, 0, 2, 0],
    G: [null, null, 0, 0, 0, 1],
    E: [0, 2, 0, 1, 0, 0],
    D: [null, null, 0, 2, 1, 2],
  },
  m7: {
    C: [null, 3, 1, 3, 1, null],
    A: [null, 0, 2, 0, 1, 0],
    G: [null, null, 0, 0, -1, 1],
    E: [0, 2, 0, 0, 0, 0],
    D: [null, null, 0, 2, 1, 1],
  },
};

const CHORD_QUALITY_LABELS = { maior:'Maior', menor:'Menor', '7':'7 (dominante)', m7:'m7 (menor com 7ª menor)' };

const SCALE_TYPES = {
  'pentatonica-maior': { label:'Pentatônica maior', intervals:[0,2,4,7,9] },
  'pentatonica-menor': { label:'Pentatônica menor', intervals:[0,3,5,7,10] },
  'maior':             { label:'Maior (Jônio)',      intervals:[0,2,4,5,7,9,11] },
  'menor-natural':     { label:'Menor natural (Eólio)', intervals:[0,2,3,5,7,8,10] },
};

function noteNameFromPc(pc){
  return NOTE_NAMES[((pc % 12) + 12) % 12];
}

// shapeLetter: 'C'|'A'|'G'|'E'|'D'
function getChordFrets(rootPc, quality, shapeLetter){
  const anchorPc = SHAPE_ANCHOR_PC[shapeLetter];
  const R = (rootPc - anchorPc + 12) % 12;
  let frets = CHORD_SHAPES[quality][shapeLetter].map(t => t === null ? null : t + R);
  // se a forma não couber nessa posição (traste negativo), sobe uma oitava
  if (frets.some(f => f !== null && f < 0)){
    frets = frets.map(f => f === null ? null : f + 12);
  }
  return frets;
}

// ---------- Diagrama vertical de acorde (estilo "cartão", cordas 6→1 esquerda→direita) ----------
const CHORD_COL_GAP = 22;   // espaço horizontal entre cordas
const CHORD_ROW_GAP = 24;   // espaço vertical entre trastes
const CHORD_PAD = 14;       // margem interna do diagrama

function renderChordDiagram(container, frets, rootPc){
  container.innerHTML = '';

  const numeric = frets.filter(f => f !== null);
  const minFret = Math.min(...numeric);
  const maxFret = Math.max(...numeric);
  const openPosition = minFret <= 0;
  const windowStart = openPosition ? 0 : minFret;
  const windowSize = Math.max(4, maxFret - windowStart + 1);

  const gridW = CHORD_COL_GAP * 5;
  const gridH = CHORD_ROW_GAP * windowSize;

  const wrap = document.createElement('div');
  wrap.className = 'chord-diagram';
  wrap.style.width = (gridW + CHORD_PAD * 2) + 'px';

  if (!openPosition){
    const label = document.createElement('div');
    label.className = 'chord-fret-label';
    label.textContent = windowStart + 'ª casa';
    wrap.appendChild(label);
  }

  // marcadores X/O acima do diagrama, alinhados a cada corda
  const markerRow = document.createElement('div');
  markerRow.className = 'chord-string-markers';
  markerRow.style.width = (gridW + CHORD_PAD * 2) + 'px';
  frets.forEach((f, stringIdx) => {
    if (f === null || (openPosition && f === 0)){
      const m = document.createElement('span');
      m.className = 'chord-marker';
      m.textContent = f === null ? '×' : 'O';
      m.style.left = (CHORD_PAD + stringIdx * CHORD_COL_GAP) + 'px';
      markerRow.appendChild(m);
    }
  });
  wrap.appendChild(markerRow);

  // área do grid: posicionamento absoluto por coordenadas
  const grid = document.createElement('div');
  grid.className = 'chord-grid';
  grid.style.width = (gridW + CHORD_PAD * 2) + 'px';
  grid.style.height = (gridH + CHORD_PAD) + 'px';

  // 6 linhas verticais = 6 cordas
  for (let s = 0; s < 6; s++){
    const line = document.createElement('div');
    line.className = 'chord-string-line';
    line.style.left = (CHORD_PAD + s * CHORD_COL_GAP) + 'px';
    line.style.height = gridH + 'px';
    grid.appendChild(line);
  }
  // linhas horizontais = trastes (a primeira mais grossa se for posição aberta)
  for (let r = 0; r <= windowSize; r++){
    const line = document.createElement('div');
    line.className = 'chord-fret-line' + (r === 0 && openPosition ? ' nut' : '');
    line.style.top = r * CHORD_ROW_GAP + 'px';
    line.style.width = gridW + 'px';
    line.style.left = CHORD_PAD + 'px';
    grid.appendChild(line);
  }
  // bolinhas, centradas exatamente sobre a corda
  frets.forEach((f, stringIdx) => {
    if (f === null || (openPosition && f === 0)) return;
    const row = f - windowStart - (openPosition ? 1 : 0);
    const dot = document.createElement('span');
    const notePc = (OPEN_STRING_PC[stringIdx] + f) % 12;
    dot.className = 'chord-dot' + (notePc === rootPc ? ' root' : '');
    dot.style.left = (CHORD_PAD + stringIdx * CHORD_COL_GAP) + 'px';
    dot.style.top = (row * CHORD_ROW_GAP + CHORD_ROW_GAP / 2) + 'px';
    grid.appendChild(dot);
  });

  wrap.appendChild(grid);
  container.appendChild(wrap);
}

// ---------- Diagrama horizontal de escala (braço inteiro, estilo "cartão") ----------
function renderScalePattern(container, rootPc, intervals, numFrets = 12){
  container.innerHTML = '';
  const scalePcs = new Set(intervals.map(iv => (rootPc + iv) % 12));

  const wrap = document.createElement('div');
  wrap.className = 'scale-fretboard-wrap';

  const grid = document.createElement('div');
  grid.className = 'scale-grid';
  grid.style.gridTemplateColumns = `repeat(${numFrets + 1}, 32px)`;

  for (let displayRow = 0; displayRow < 6; displayRow++){
    const stringIdx = 5 - displayRow;
    for (let fret = 0; fret <= numFrets; fret++){
      const cell = document.createElement('div');
      cell.className = 'scale-cell' + (fret === 0 ? ' nut' : '');
      const pc = (OPEN_STRING_PC[stringIdx] + fret) % 12;
      if (scalePcs.has(pc)){
        const dot = document.createElement('span');
        const isRoot = pc === rootPc;
        dot.className = 'scale-dot' + (isRoot ? ' root' : '');
        dot.textContent = noteNameFromPc(pc);
        cell.appendChild(dot);
      }
      grid.appendChild(cell);
    }
  }

  wrap.appendChild(grid);

  const markers = document.createElement('div');
  markers.className = 'fret-markers';
  markers.style.gridTemplateColumns = `repeat(${numFrets + 1}, 32px)`;
  for (let fret = 0; fret <= numFrets; fret++){
    const m = document.createElement('span');
    if ([3,5,7,9].includes(fret)) m.textContent = '•';
    if (fret === 12) m.textContent = '••';
    markers.appendChild(m);
  }
  wrap.appendChild(markers);

  container.appendChild(wrap);
}
