/* escalas.js — diagramas de escalas no braço (horizontal, como o músico vê o instrumento), com som.
   Cordas: índice 0 = 6ª corda ... 5 = 1ª corda. A 1ª corda aparece em cima, as casas iniciais à esquerda. */
const Escala = (() => {
  const OPEN = [40, 45, 50, 55, 59, 64], STR_NAME = ['E', 'A', 'D', 'G', 'B', 'E'];
  const INLAY1 = [3, 5, 7, 9, 15, 17, 19, 21], INLAY2 = [12, 24];
  let ativa = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function notasDo(b){
    const f0 = b.range ? b.range[0] : 0, f1 = b.range ? b.range[1] : 17;
    const cordas = (b.strings || [0, 1, 2, 3, 4, 5]).slice().sort((x, y) => y - x);   // de cima (1ª) para baixo (6ª)
    const pcs = new Set(b.pcs || []), out = [];
    if (b.pos){
      b.pos.forEach(([s, f]) => { if (cordas.includes(s) && f >= f0 && f <= f1) out.push({ s, f }); });
    } else {
      cordas.forEach(s => { for (let f = f0; f <= f1; f++) if (pcs.has((OPEN[s] + f) % 12)) out.push({ s, f }); });
    }
    out.forEach(n => { n.midi = OPEN[n.s] + n.f; n.pc = n.midi % 12; });
    return { f0, f1, cordas, notas: out };
  }

  function svgDe(b, modo, g){
    const { f0, f1, cordas, notas } = g, n = cordas.length;
    const W = 46, ROW = 30, padL = 34, aberta = f0 === 0, openW = aberta ? 30 : 0, fMin = Math.max(1, f0);
    const nfr = f1 - fMin + 1, x0 = padL + openW, wTot = x0 + nfr * W + 10;
    const Y = (i) => 20 + i * ROW, yTop = Y(0) - 13, yBot = Y(n - 1) + 13, hTot = yBot + 30;
    const X = (f) => f === 0 ? x0 - 17 : x0 + (f - fMin + 0.5) * W;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wTot} ${hTot}" width="${wTot}" height="${hTot}" role="img" aria-label="${esc(b.title || 'Diagrama de escala no braço')}" font-family="Inter,'Segoe UI',Arial,sans-serif">`;
    // casas
    for (let k = 0; k <= nfr; k++){
      const nut = k === 0 && f0 <= 1;
      s += `<line x1="${x0 + k * W}" y1="${yTop}" x2="${x0 + k * W}" y2="${yBot}" stroke="${nut ? '#cfc8b8' : '#3a3a42'}" stroke-width="${nut ? 5 : 1.6}"/>`;
    }
    // marcações do braço
    const ym = (Y(0) + Y(n - 1)) / 2 + (n === 1 ? 16 : 0);
    for (let f = fMin; f <= f1; f++){
      if (INLAY1.includes(f)) s += `<circle cx="${X(f)}" cy="${ym}" r="3.4" fill="#2c2c34"/>`;
      if (INLAY2.includes(f)){ const d = n === 1 ? 0 : ROW * 0.9; s += `<circle cx="${X(f)}" cy="${ym - d}" r="3.4" fill="#2c2c34"/><circle cx="${X(f)}" cy="${ym + (n === 1 ? 10 : d)}" r="3.4" fill="#2c2c34"/>`; }
    }
    // cordas e nomes das cordas
    cordas.forEach((st, i) => {
      s += `<line x1="${x0 - (aberta ? 0 : 0)}" y1="${Y(i)}" x2="${x0 + nfr * W}" y2="${Y(i)}" stroke="#8c8c96" stroke-width="${1 + (st === 0 ? 5 : st === 1 ? 4 : st === 2 ? 3 : st === 3 ? 2 : st === 4 ? 1 : 0) * .28}"/>`;
      s += `<text x="${b.strnum ? 6 : 10}" y="${Y(i) + 4}" font-size="${b.strnum ? 11 : 11}" fill="#9a968c">${b.strnum ? (6 - st) + 'ª' : STR_NAME[st]}</text>`;
    });
    // numeração das casas
    for (let f = fMin; f <= f1; f++) s += `<text x="${X(f)}" y="${yBot + 20}" text-anchor="middle" font-size="10.5" fill="${INLAY1.includes(f) || INLAY2.includes(f) ? '#cfc8b8' : '#77777f'}">${f}</text>`;
    // notas
    notas.forEach(nt => {
      const i = cordas.indexOf(nt.s), tonica = nt.pc === b.root || (b.dest && b.dest.includes(nt.pc)), t2 = b.root2 != null && nt.pc === b.root2;
      const txt = modo === 'degs' ? (b.degs || {})[nt.pc] : (b.names || {})[nt.pc];
      const t = txt == null ? '' : String(txt), fs = t.length > 3 ? 8 : t.length > 1 ? 9.5 : 12;
      if (b.blue != null && nt.pc === b.blue){
        const x = X(nt.f), y = Y(i), k = nt.f === 0 ? 9.5 : 11.2;
        s += `<g class="es-n es-blue" data-s="${nt.s}" data-f="${nt.f}" tabindex="0"><rect x="${x - k}" y="${y - k}" width="${2 * k}" height="${2 * k}" rx="4" fill="#2faa5a" stroke="#bff0cf" stroke-width="1.5"/><text x="${x}" y="${y + 3.4}" text-anchor="middle" font-size="${String(txt).length > 1 ? 9.5 : 12}" font-weight="700" fill="#04180b">${esc(txt == null ? '' : txt)}</text></g>`;
        return;
      }
      s += `<g class="es-n" data-s="${nt.s}" data-f="${nt.f}" tabindex="0"><circle cx="${X(nt.f)}" cy="${Y(i)}" r="${nt.f === 0 ? 11 : 12.8}" fill="${tonica ? '#ff9437' : t2 ? '#6ea8ff' : '#eee7d8'}" stroke="${tonica ? '#ffd7ae' : t2 ? '#cfe0ff' : '#17171b'}" stroke-width="1.5"/><text x="${X(nt.f)}" y="${Y(i) + fs * .36}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#17110a">${esc(t)}</text></g>`;
    });
    return { html: s + '</svg>', wTot };
  }

  function build(b){
    const g = notasDo(b);
    const wrap = document.createElement('div'); wrap.className = 'escala';
    if (b.title){ const t = document.createElement('div'); t.className = 'es-title'; t.textContent = b.title; wrap.appendChild(t); }
    const box = document.createElement('div'); box.className = 'es-scroll'; wrap.appendChild(box);
    const ctr = document.createElement('div'); ctr.className = 'cs-ctr es-ctr';
    const temGraus = !!(b.degs && Object.keys(b.degs).length);
    ctr.innerHTML = `<button class="chip es-play" style="border-color:var(--orange);color:var(--orange)">▶ Tocar escala</button>
      <span class="cs-bpm"><button class="chip es-m" aria-label="Diminuir BPM">−</button><b class="es-v"></b><button class="chip es-p" aria-label="Aumentar BPM">+</button> BPM</span>
      <button class="chip es-loop" aria-pressed="false">Repetir</button>${temGraus ? '<button class="chip es-rot"></button>' : ''}`;
    wrap.appendChild(ctr);
    let modo = b.label || 'names', bpm = b.tempo || 80, loop = false, on = false, timer = null, k = 0, seq = [];
    const play = ctr.querySelector('.es-play'), vEl = ctr.querySelector('.es-v'), loopB = ctr.querySelector('.es-loop'), rotB = ctr.querySelector('.es-rot');
    const ordem = g.notas.slice().sort((a, c) => a.midi - c.midi || a.s - c.s).filter((n, i, arr) => i === 0 || n.midi !== arr[i - 1].midi);
    seq = ordem.concat(ordem.slice(0, -1).reverse());
    const node = (s, f) => box.querySelector(`.es-n[data-s="${s}"][data-f="${f}"]`);
    function desenha(){
      const r = svgDe(b, modo, g); box.innerHTML = r.html;
      const svg = box.querySelector('svg'); if (r.wTot <= 390) svg.style.maxWidth = r.wTot + 'px'; else svg.style.maxWidth = 'none';
      if (r.wTot <= 390){ svg.setAttribute('width', '100%'); svg.removeAttribute('height'); }
      box.querySelectorAll('.es-n').forEach(el => {
        const go = () => { const s = +el.dataset.s, f = +el.dataset.f; Acorde.nota(OPEN[s] + f, 0.9).catch(() => {}); pulso(el); };
        el.addEventListener('click', go);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
      });
      if (rotB) rotB.textContent = 'Rótulo: ' + (modo === 'degs' ? 'graus' : 'notas');
    }
    function pulso(el){ el.classList.remove('pulse'); void el.getBoundingClientRect(); el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 420); }
    function stop(){ on = false; clearTimeout(timer); box.querySelectorAll('.es-n.on').forEach(e => e.classList.remove('on')); play.textContent = '▶ Tocar escala'; if (ativa === stop) ativa = null; }
    function step(){
      if (!on) return;
      box.querySelectorAll('.es-n.on').forEach(e => e.classList.remove('on'));
      const nt = seq[k], el = node(nt.s, nt.f); if (el){ el.classList.add('on'); }
      Acorde.nota(nt.midi, Math.min(1.2, 60 / bpm * 1.4)).catch(() => {});
      timer = setTimeout(() => { k++; if (k >= seq.length){ if (!loop){ stop(); return; } k = 0; } step(); }, 60000 / bpm);
    }
    play.addEventListener('click', () => { if (on){ stop(); return; } if (ativa) ativa(); if (!seq.length) return; on = true; k = 0; ativa = stop; play.textContent = '■ Parar'; step(); });
    const showBpm = () => { vEl.textContent = bpm; }; showBpm();
    ctr.querySelector('.es-m').addEventListener('click', () => { bpm = Math.max(40, bpm - 5); showBpm(); });
    ctr.querySelector('.es-p').addEventListener('click', () => { bpm = Math.min(200, bpm + 5); showBpm(); });
    loopB.addEventListener('click', () => { loop = !loop; loopB.setAttribute('aria-pressed', String(loop)); });
    if (rotB) rotB.addEventListener('click', () => { modo = modo === 'degs' ? 'names' : 'degs'; desenha(); });
    desenha();
    return wrap;
  }
  return { build, stopAll: () => { if (ativa) ativa(); } };
})();
