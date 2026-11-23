/* Blocos de intervalos do curso: tabela, mapa de intervalos, intervalo por corda e tabela com resposta escondida.
   Depende de Acorde (acorde.js). Cordas do desenho: linha 0 = 1ª corda (mais fina) ... linha 5 = 6ª corda. */
const Intervalos = (() => {
  const OPEN_TOP = [64, 59, 55, 50, 45, 40], STR_NAME = ['E', 'B', 'G', 'D', 'A', 'E'];
  const LETRAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], NAT = [0, 2, 4, 5, 7, 9, 11];
  const RAIZES = [['C', 0, 0], ['C#', 0, 1], ['D', 1, 2], ['Eb', 2, 3], ['E', 2, 4], ['F', 3, 5], ['F#', 3, 6], ['G', 4, 7], ['Ab', 5, 8], ['A', 5, 9], ['Bb', 6, 10], ['B', 6, 11]];
  // [semitons, grau, rótulo curto, título]
  const IV = [[1, 2, '2m', '2m (b2)'], [2, 2, '2M', '2M (2)'], [3, 3, '3m', '3m (b3)'], [4, 3, '3M', '3M (3)'], [5, 4, '4J', '4J (4)'],
    [6, 4, '4A', '4Aum (#4)'], [6, 5, '5d', '5dim (b5)'], [7, 5, '5J', '5J (5)'], [8, 5, '5A', '5Aum (#5)'], [8, 6, '6m', '6m (b6)'],
    [9, 6, '6M', '6M (6)'], [10, 7, '7m', '7m (b7, 7)'], [11, 7, '7M', '7M (maj7, 7+)'], [12, 8, '8J', '8J (T)'],
    [13, 9, '9m', '9m (b9)'], [14, 9, '9M', '9M (9)'], [15, 10, '3m↑', '3m (b3), uma oitava acima'], [16, 10, '3M↑', '3M (3), uma oitava acima'],
    [17, 11, '11J', '11J (11)'], [18, 11, '11A', '11Aum (#11)']];
  const CURTO = { 0: 'T', 1: '2m', 2: '2M', 3: '3m', 4: '3M', 5: '4J', 6: '5d', 7: '5J', 8: '6m', 9: '6M', 10: '7m', 11: '7M' };
  const acid = (d) => d === 0 ? '' : d === 1 ? '#' : d === -1 ? 'b' : d === 2 ? '##' : d === -2 ? 'bb' : '';
  function nomeNota(raiz, grau, semis){          // grafia correta: letra pelo grau, acidente pela distância
    const [, letra, pc] = RAIZES[raiz], li = (letra + grau - 1) % 7, alvo = (pc + semis) % 12;
    let d = ((alvo - NAT[li]) % 12 + 12) % 12; if (d > 6) d -= 12;
    return LETRAS[li] + acid(d);
  }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  function par(m0, m1, harmonico){
    if (harmonico){ Acorde.nota(m0).catch(() => {}); Acorde.nota(m1).catch(() => {}); }
    else { Acorde.nota(m0).catch(() => {}); setTimeout(() => Acorde.nota(m1).catch(() => {}), 650); }
  }
  function chipsRaiz(cb, atual){
    const row = el('div', 'fm-ctr');
    RAIZES.forEach(([n], i) => { const b = el('button', 'chip', n); b.setAttribute('aria-pressed', String(i === atual)); b.addEventListener('click', () => { row.querySelectorAll('.chip').forEach((x, k) => x.setAttribute('aria-pressed', String(k === i))); cb(i); }); row.appendChild(b); });
    return row;
  }
  function svgBraco(nf, dots, opc){
    const sp = opc && opc.sp || 40, X = (f) => 34 + f * sp, Y = (r) => 24 + r * 28, W = X(nf) + sp / 2 + 14;
    let s = `<svg viewBox="0 0 ${W} 206" role="img" aria-label="Braço da guitarra">`;
    for (let k = 0; k <= nf; k++) s += `<line x1="${X(k) + sp / 2}" y1="${Y(0) - 8}" x2="${X(k) + sp / 2}" y2="${Y(5) + 8}" stroke="${k === 0 ? '#cfc8b8' : '#3a3a42'}" stroke-width="${k === 0 ? 4 : 1.5}"/>`;
    for (let r = 0; r < 6; r++) s += `<line x1="${X(0) + sp / 2}" y1="${Y(r)}" x2="${W - 10}" y2="${Y(r)}" stroke="#8c8c96" stroke-width="${1 + r * .35}"/><text x="8" y="${Y(r) + 4}" fill="#9a968c" font-size="11" font-family="Inter,sans-serif">${STR_NAME[r]}</text>`;
    for (let f = 0; f <= nf; f++) s += `<text x="${X(f)}" y="${Y(5) + 28}" text-anchor="middle" fill="#9a968c" font-size="11" font-family="Inter,sans-serif">${f}</text>`;
    [3, 5, 7, 9, 15].filter(f => f <= nf).forEach(f => { s += `<circle cx="${X(f)}" cy="${Y(5) + 15}" r="2.5" fill="#55555e"/>`; });
    dots.forEach(d => {
      const big = String(d.t).length > 2;
      s += `<g class="iv-dot" data-r="${d.r}" data-f="${d.f}" style="cursor:pointer"><circle cx="${X(d.f)}" cy="${Y(d.r)}" r="${big ? 12.5 : 11.5}" fill="${d.fill}" stroke="${d.stroke || d.fill}" stroke-width="1.5"/><text x="${X(d.f)}" y="${Y(d.r) + 4}" text-anchor="middle" font-size="${big ? 9 : 10.5}" font-weight="700" font-family="Inter,sans-serif" fill="${d.ink}">${d.t}</text></g>`;
    });
    return s + '</svg>';
  }
  const COR = { tonica: { fill: '#cfc8b8', ink: '#1b1b1b' }, nota: { fill: '#ff9437', ink: '#1b1105' }, vazio: { fill: '#0b0b0d', stroke: '#55555e', ink: '#55555e' } };

  // ---- tabela simples ----
  function tabela(b){
    const w = el('div', 'tbl-wrap'), t = el('table', 'tbl');
    t.innerHTML = '<thead><tr>' + b.head.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' + b.rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
    w.appendChild(t); return w;
  }

  // ---- mapa de intervalos em todo o braço (tônica escolhida) ----
  function mapa(b){
    const wrap = el('div', 'fretmap'); let raiz = b.root || 0, treino = !!b.hide; const rev = new Set();
    wrap.appendChild(chipsRaiz((i) => { raiz = i; rev.clear(); draw(); }, raiz));
    const c2 = el('div', 'fm-ctr'); const hb = el('button', 'chip', 'Treinar (esconder nomes)'); c2.appendChild(hb); wrap.appendChild(c2);
    const box = el('div', 'fm-box'), hint = el('div', 'fm-hint'); wrap.append(box, hint);
    hb.addEventListener('click', () => { treino = !treino; rev.clear(); draw(); });
    function draw(){
      hb.setAttribute('aria-pressed', String(treino));
      const pc0 = RAIZES[raiz][2], dots = [];
      for (let r = 0; r < 6; r++) for (let f = 0; f <= 12; f++){
        const semis = (OPEN_TOP[r] + f - pc0 + 120) % 12, key = r + '-' + f, vis = !treino || rev.has(key) || semis === 0;
        const cor = semis === 0 ? COR.tonica : vis ? COR.nota : COR.vazio;
        dots.push(Object.assign({ r, f, t: vis ? CURTO[semis] : '?' }, cor));
      }
      box.innerHTML = svgBraco(12, dots, { sp: 48 });
      box.querySelectorAll('.iv-dot').forEach(g => g.addEventListener('click', () => {
        const r = +g.dataset.r, f = +g.dataset.f, m = OPEN_TOP[r] + f, semis = (m - pc0 + 120) % 12, m0 = m - semis;
        par(m0, m, false); const key = r + '-' + f;
        if (treino){ rev.has(key) ? rev.delete(key) : rev.add(key); draw(); }
      }));
      hint.textContent = (treino ? 'Diga o intervalo de cada bolinha, depois toque nela para conferir. ' : '') + 'Ao tocar numa nota você ouve a tônica e depois o intervalo. Cinza = tônica (T).';
    }
    draw(); return wrap;
  }

  // ---- praticando um intervalo por vez, com a tônica numa corda ----
  function pratica(b){
    const wrap = el('div', 'fretmap'); let raiz = b.root || 0, corda = b.string || 6, sel = 3, harm = false;
    wrap.appendChild(chipsRaiz((i) => { raiz = i; draw(); }, raiz));
    const cs = el('div', 'fm-ctr'); wrap.appendChild(cs);
    [6, 5, 4, 3, 2].forEach(n => { const x = el('button', 'chip', `Tônica na ${n}ª corda`); x.dataset.s = n; cs.appendChild(x); });
    const hb = el('button', 'chip', 'Ouvir juntas (harmônico)'); cs.appendChild(hb);
    const ci = el('div', 'fm-ctr'); wrap.appendChild(ci);
    IV.forEach((v, i) => { const x = el('button', 'chip', v[2]); x.dataset.i = i; ci.appendChild(x); });
    const tit = el('div', 'iv-title'), box = el('div', 'fm-box'), hint = el('div', 'fm-hint'); wrap.append(tit, box, hint);
    cs.addEventListener('click', (e) => { const x = e.target.closest('[data-s]'); if (x){ corda = +x.dataset.s; draw(true); } else if (e.target === hb){ harm = !harm; draw(true); } });
    ci.addEventListener('click', (e) => { const x = e.target.closest('[data-i]'); if (x){ sel = +x.dataset.i; draw(true); } });
    function draw(som){
      cs.querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.s === corda)));
      hb.setAttribute('aria-pressed', String(harm));
      ci.querySelectorAll('[data-i]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.i === sel)));
      const r0 = corda - 1; // linha do desenho da corda da tônica (6ª corda = linha 5)
      const pc0 = RAIZES[raiz][2], f0 = ((pc0 - OPEN_TOP[r0]) % 12 + 12) % 12, m0 = OPEN_TOP[r0] + f0;
      const [semis, grau, , titulo] = IV[sel], m1 = m0 + semis, nm0 = RAIZES[raiz][0], nm1 = nomeNota(raiz, grau, semis);
      const dots = [Object.assign({ r: r0, f: f0, t: nm0 }, COR.tonica)];
      for (let r = 0; r < 6; r++) for (let f = 0; f <= 15; f++){
        if (OPEN_TOP[r] + f === m1) dots.push(Object.assign({ r, f, t: nm1 }, COR.nota));
      }
      box.innerHTML = svgBraco(15, dots, { sp: 40 });
      box.querySelectorAll('.iv-dot').forEach(g => g.addEventListener('click', () => par(m0, m1, harm)));
      tit.innerHTML = `Intervalo de <b>${titulo}</b> = ${nm0} – ${nm1}`;
      hint.textContent = 'Cinza = tônica. Laranja = onde está a nota do intervalo, em cada corda. Toque numa bolinha, ou no botão do intervalo, para ouvir. Experimente cantar o intervalo.';
      if (som) par(m0, m1, harm);
    }
    draw(false); return wrap;
  }

  // ---- tabela com resposta escondida (distância e intervalo entre notas naturais) ----
  function tabelaTreino(b){
    const wrap = el('div', 'fretmap'); let raiz = 0; const rev = new Set();
    const NAT_PC = [0, 2, 4, 5, 7, 9, 11], NOMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const Q = { 2: { 1: '2m', 2: '2M' }, 3: { 3: '3m', 4: '3M' }, 4: { 5: '4J', 6: '4A' }, 5: { 6: '5d', 7: '5J' }, 6: { 8: '6m', 9: '6M' }, 7: { 10: '7m', 11: '7M' } };
    const TONS = ['0', '½', '1', '1+½', '2', '2+½', '3', '3+½', '4', '4+½', '5', '5+½'];
    const ctr = el('div', 'fm-ctr');
    NOMES.forEach((n, i) => { const x = el('button', 'chip', n); x.setAttribute('aria-pressed', String(i === raiz)); x.addEventListener('click', () => { raiz = i; rev.clear(); draw(); ctr.querySelectorAll('.chip').forEach((y, k) => y.setAttribute('aria-pressed', String(k === i))); }); ctr.appendChild(x); });
    const tb = el('div', 'tbl-wrap'), ctr2 = el('div', 'fm-ctr'); const mostrar = el('button', 'chip', 'Mostrar tudo'), esconder = el('button', 'chip', 'Esconder tudo'); ctr2.append(mostrar, esconder);
    wrap.append(ctr, tb, ctr2);
    function draw(){
      let h = '<table class="tbl tbl-t"><thead><tr><th>Notas</th><th>Distância</th><th>Intervalo</th></tr></thead><tbody>';
      for (let k = 1; k <= 6; k++){
        const i2 = (raiz + k) % 7, p1 = NAT_PC[raiz], p2 = NAT_PC[i2], semis = (p2 - p1 + 12) % 12, ver = rev.has(k);
        h += `<tr data-k="${k}" style="cursor:pointer"><td><b>${NOMES[raiz]} – ${NOMES[i2]}</b></td><td>${ver ? TONS[semis] + (semis <= 2 ? ' tom' : ' tons') + ' · ' + semis + ' st' : '?'}</td><td>${ver ? Q[k + 1][semis] : '?'}</td></tr>`;
      }
      tb.innerHTML = h + '</tbody></table><div class="fm-hint">Descubra a distância (em tons e semitons) e o intervalo de cada par. Toque na linha para conferir e ouvir as duas notas, e toque de novo para esconder. Conte os semitons do grave para o agudo.</div>';
      tb.querySelectorAll('tr[data-k]').forEach(tr => tr.addEventListener('click', () => {
        const k = +tr.dataset.k; rev.has(k) ? rev.delete(k) : rev.add(k);
        const m0 = 48 + NAT_PC[raiz], m1 = m0 + ((NAT_PC[(raiz + k) % 7] - NAT_PC[raiz] + 12) % 12); if (rev.has(k)) par(m0, m1, false); draw();
      }));
    }
    mostrar.addEventListener('click', () => { for (let k = 1; k <= 6; k++) rev.add(k); draw(); });
    esconder.addEventListener('click', () => { rev.clear(); draw(); });
    draw(); return wrap;
  }

  // ---- treino: escreva as notas das tríades maiores e menores ----
  function triadeTreino(b){
    const wrap = el('div', 'fretmap');
    const MAIORES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    const MENORES = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'E#m', 'Gm', 'Cm', 'Fm', 'Bbm', 'Dm', 'Ebm', 'Abm', 'Dbm', 'Gbm'];
    let menor = !!b.minor; const rev = new Set();
    const ctr = el('div', 'fm-ctr'); const bM = el('button', 'chip', 'Tríades maiores (T, 3M, 5J)'), bm = el('button', 'chip', 'Tríades menores (T, 3m, 5J)'); ctr.append(bM, bm);
    const tb = el('div', 'tbl-wrap'), c2 = el('div', 'fm-ctr'); const mostrar = el('button', 'chip', 'Mostrar tudo'), esconder = el('button', 'chip', 'Esconder tudo'); c2.append(mostrar, esconder);
    wrap.append(ctr, tb, c2);
    function notas(nome){
      const m = /^([A-G])([#b]?)(m?)$/.exec(nome), li = LETRAS.indexOf(m[1]), pc = ((NAT[li] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)) % 12 + 12) % 12, tr = m[3] ? 3 : 4;
      const sp = (grau, semis) => { const l = (li + grau - 1) % 7, alvo = (pc + semis) % 12; let d = ((alvo - NAT[l]) % 12 + 12) % 12; if (d > 6) d -= 12; return LETRAS[l] + acid(d); };
      return { pc, nomes: [nome.replace(/m$/, ''), sp(3, tr), sp(5, 7)], tr };
    }
    function draw(){
      bM.setAttribute('aria-pressed', String(!menor)); bm.setAttribute('aria-pressed', String(menor));
      const lista = menor ? MENORES : MAIORES;
      let h = '<table class="tbl tbl-t"><thead><tr><th>Acorde</th><th>Notas (T – ' + (menor ? '3m' : '3M') + ' – 5J)</th></tr></thead><tbody>';
      lista.forEach((n, i) => { const k = (menor ? 'm' : 'M') + i, v = notas(n); h += `<tr data-k="${k}" data-i="${i}" style="cursor:pointer"><td><b>${n}</b></td><td>${rev.has(k) ? v.nomes.join(' – ') : '?'}</td></tr>`; });
      tb.innerHTML = h + '</tbody></table><div class="fm-hint">Escreva as notas de cada acorde (no papel ou de cabeça) e toque na linha para conferir e ouvir o arpejo. Toque de novo para esconder.</div>';
      tb.querySelectorAll('tr[data-k]').forEach(tr => tr.addEventListener('click', () => {
        const k = tr.dataset.k, v = notas(lista[+tr.dataset.i]);
        if (rev.has(k)) rev.delete(k); else { rev.add(k); const m0 = 48 + v.pc; [0, v.tr, 7].forEach((st, j) => setTimeout(() => Acorde.nota(m0 + st).catch(() => {}), j * 330)); }
        draw();
      }));
    }
    bM.addEventListener('click', () => { menor = false; rev.clear(); draw(); }); bm.addEventListener('click', () => { menor = true; rev.clear(); draw(); });
    mostrar.addEventListener('click', () => { (menor ? MENORES : MAIORES).forEach((_, i) => rev.add((menor ? 'm' : 'M') + i)); draw(); });
    esconder.addEventListener('click', () => { rev.clear(); draw(); });
    draw(); return wrap;
  }

  // ---- tabela com colunas escondidas (toque na linha para revelar) ----
  function tabelaReveal(b){
    const wrap = el('div', 'fretmap'); const rev = new Set(), ocultas = new Set(b.hide || []);
    const tb = el('div', 'tbl-wrap'), c2 = el('div', 'fm-ctr'); const mostrar = el('button', 'chip', 'Mostrar tudo'), esconder = el('button', 'chip', 'Esconder tudo'); c2.append(mostrar, esconder);
    wrap.append(tb, c2); if (b.hint){ const hn = el('div', 'fm-hint', b.hint); wrap.appendChild(hn); }
    function draw(){
      let h = '<table class="tbl tbl-t"><thead><tr>' + b.head.map(x => `<th>${x}</th>`).join('') + '</tr></thead><tbody>';
      b.rows.forEach((r, i) => { h += `<tr data-i="${i}" style="cursor:pointer">` + r.map((c, k) => `<td>${ocultas.has(k) && !rev.has(i) ? '?' : c}</td>`).join('') + '</tr>'; });
      tb.innerHTML = h + '</tbody></table>';
      tb.querySelectorAll('tr[data-i]').forEach(tr => tr.addEventListener('click', () => { const i = +tr.dataset.i; rev.has(i) ? rev.delete(i) : rev.add(i); draw(); }));
    }
    mostrar.addEventListener('click', () => { b.rows.forEach((_, i) => rev.add(i)); draw(); });
    esconder.addEventListener('click', () => { rev.clear(); draw(); });
    draw(); return wrap;
  }
  return { tabela, mapa, pratica, tabelaTreino, triadeTreino, tabelaReveal };
})();
