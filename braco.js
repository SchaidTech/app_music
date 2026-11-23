/* Braço realista (SVG): janela de 5 casas. renderBraco(el,{start,pcs:Set,rootPc,names}) */
function scalePcs(root, iv){ return new Set(iv.map(i => (root + i) % 12)); }
function renderBraco(el, o){
  const lab = o.label || (o.names ? 'names' : 'none');
  const s = o.start || 0, wx = [36,100,164,228,292,356], ys = [26,52,78,104,130,156], top = 16, bot = 166;
  const id = 'bg' + Math.random().toString(36).slice(2, 7), cx = k => (wx[k] + wx[k + 1]) / 2, my = (ys[2] + ys[3]) / 2;
  let h = `<svg viewBox="0 0 372 182" style="width:100%;height:auto;display:block" role="img" aria-label="Braço da guitarra, casas ${s ? s + 1 : 0} a ${s + 5}"><defs><filter id="${id}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2"/></filter></defs><rect x="0" y="${top - 6}" width="372" height="${bot - top + 12}" rx="10" fill="#0e0e11" stroke="#1f1f25"/>`;
  wx.forEach((x, k) => { const nut = s === 0 && k === 0;
    h += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bot}" stroke="${nut ? '#d9d3c3' : '#55555e'}" stroke-width="${nut ? 6 : 3}"/>` + (nut ? '' : `<line x1="${x - .8}" y1="${top}" x2="${x - .8}" y2="${bot}" stroke="#b9b9c3" stroke-width="1"/>`); });
  for (let k = 0; k < 5; k++){ const f = s + 1 + k;
    if ([3,5,7,9,15,17].includes(f)) h += `<circle cx="${cx(k)}" cy="${my}" r="4.5" fill="#2b2b33"/>`;
    if (f === 12) h += `<circle cx="${cx(k)}" cy="${(ys[1] + ys[2]) / 2}" r="4.5" fill="#2b2b33"/><circle cx="${cx(k)}" cy="${(ys[3] + ys[4]) / 2}" r="4.5" fill="#2b2b33"/>`;
    h += `<text x="${cx(k)}" y="178" text-anchor="middle" font-size="11" fill="#9a968c" font-family="Inter,sans-serif">${f}</text>`; }
  ys.forEach((y, r) => { const w = [.9,1.2,1.5,2,2.5,3.1][r], c = r < 3 ? '#d6d6dc' : '#a8a8b2';
    h += `<line x1="6" y1="${y}" x2="366" y2="${y}" stroke="${c}" stroke-width="${w}"/><line x1="6" y1="${y - w / 4}" x2="366" y2="${y - w / 4}" stroke="#fff" stroke-opacity=".35" stroke-width=".6"/>`; });
  if (lab === 'fingers' && o.barre){ const k = o.barre.fret - s - 1, r1 = 5 - o.barre.to, r2 = 5 - o.barre.from; if (k >= 0 && k < 5) h += `<rect x="${cx(k) - 13}" y="${ys[r1] - 13}" width="26" height="${ys[r2] - ys[r1] + 26}" rx="13" fill="#ff9437" opacity=".3"/>`; }
  const has = (L, si, f) => L && L.some(n => n[0] === si && n[1] === f);
  for (let r = 0; r < 6; r++) for (let k = (s === 0 || o.frets || o.notes || o.ghosts) ? -1 : 0; k < 5; k++){
    const si = 5 - r, f = k < 0 ? 0 : s + 1 + k, pc = (OPEN_STRING_PC[si] + f) % 12;
    const lit = o.notes ? has(o.notes, si, f) : (o.frets ? o.frets[si] === f : o.pcs.has(pc));
    if (!lit && has(o.ghosts, si, f)){ h += `<circle cx="${k < 0 ? wx[0] - 18 : cx(k)}" cy="${ys[r]}" r="7" fill="#2a2a32" stroke="#4a4a55"/>`; continue; }
    if (!lit) continue;
    const x = k < 0 ? wx[0] - 18 : cx(k), y = ys[r], root = pc === o.rootPc, rad = lab !== 'none' ? 11 : 9;
    h += `<circle cx="${x}" cy="${y}" r="${rad + 2}" fill="#ff9437" opacity=".75" filter="url(#${id})"/><circle cx="${x}" cy="${y}" r="${rad}" fill="#ff9437"${root ? ' stroke="#fff4e0" stroke-width="2.4"' : ''}/>`;
    const tx = lab === 'names' ? NOTE_NAMES[pc] : (lab === 'fingers' && o.fingers && f > 0 ? o.fingers[si] : null);
    if (tx) h += `<text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1a0f00" font-family="Inter,sans-serif">${tx}</text>`; }
  if (o.frets) ys.forEach((y, r) => { if (o.frets[5 - r] === null) h += `<text x="${wx[0] - 18}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#9a968c" font-family="Inter,sans-serif">×</text>`; });
  if (s === 0 || o.frets || o.notes || o.ghosts) h += `<text x="${wx[0] - 18}" y="178" text-anchor="middle" font-size="11" fill="#9a968c" font-family="Inter,sans-serif">0</text>`;
  el.innerHTML = h + '</svg>';
}

/* Dedilhado: regra que reproduz os diagramas da apostila (pestana se 5+ notas e a casa mais baixa em 2+ cordas) */
function fingersFor(frets){
  const out = frets.map(() => null), fr = [];
  frets.forEach((f, si) => { if (f !== null && f > 0) fr.push([si, f]); });
  if (!fr.length) return { fingers: out, barre: null };
  const mn = Math.min(...fr.map(x => x[1])), low = fr.filter(x => x[1] === mn);
  let barre = null, rest = fr, prev = 0;
  if (fr.length >= 5 && low.length >= 2){ barre = { fret: mn, from: Math.min(...low.map(x => x[0])), to: Math.max(...low.map(x => x[0])) }; low.forEach(x => out[x[0]] = 1); rest = fr.filter(x => x[1] !== mn); prev = 1; }
  const groups = [...new Set(rest.map(x => x[1]))].sort((a, b) => a - b).map(f => rest.filter(x => x[1] === f).sort((a, b) => a[0] - b[0]));
  let ok = true, p = prev; const tmp = [];
  groups.forEach(g => { let st = Math.max(p + 1, 1 + g[0][1] - mn); if (st + g.length - 1 > 4) st = 5 - g.length; if (st <= p) ok = false; g.forEach((x, i) => tmp.push([x[0], st + i])); p = st + g.length - 1; });
  if (ok) tmp.forEach(x => out[x[0]] = x[1]);
  else { let n = prev + 1; groups.forEach(g => g.forEach(x => out[x[0]] = Math.min(n++, 4))); }
  return { fingers: out, barre };
}
function renderBracoAcorde(el, frets, rootPc, label){
  const lab = label === true ? 'names' : (label || 'none'), fr = frets.filter(f => f !== null && f > 0), mn = fr.length ? Math.min(...fr) : 1, mx = fr.length ? Math.max(...fr) : 1, d = fingersFor(frets);
  let start = Math.max(0, mn - 1); if (mx > start + 5) start = mx - 5;
  renderBraco(el, { start, frets, rootPc, label: lab, fingers: d.fingers, barre: d.barre });
}
/* Braço em pé (cursos): cordas 6ª..1ª da esquerda para a direita, janela de 4 a 5 casas */
const FUNC_NOMES = ['T', '2m', '2M', '3m', '3M', '4J', '5d', '5J', '5A', '6M', '7m', '7M'];
function renderBracoVertical(el, frets, rootPc, label, nomes){
  const _rel = new Set(frets.map((f, i) => f === null ? null : (OPEN_STRING_PC[i] + f - rootPc + 120) % 12).filter(x => x !== null)), dim7 = _rel.has(3) && _rel.has(6) && _rel.has(9) && !_rel.has(10) && !_rel.has(11);
  const fnome = d => { const k = ((d % 12) + 12) % 12; return (dim7 && k === 9) ? '7d' : FUNC_NOMES[k]; };
  const lab = label || 'fingers', d = fingersFor(frets), fr = frets.filter(f => f !== null && f > 0), mn = fr.length ? Math.min(...fr) : 1, mx = fr.length ? Math.max(...fr) : 1;
  let s = Math.max(0, mn - 1), cells = 4; if (mx - s > 4) cells = 5;
  const xs = [0,1,2,3,4,5].map(i => 28 + 22 * i), y0 = 30, ch = 32, H = y0 + ch * cells + 12, id = 'bv' + Math.random().toString(36).slice(2, 7), cy = k => y0 + ch * k + ch / 2;
  let h = `<svg viewBox="0 0 164 ${H}" style="width:100%;max-width:170px;height:auto;display:block;margin:0 auto" role="img" aria-label="Acorde: casas ${s + 1} a ${s + cells}"><defs><filter id="${id}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3"/></filter></defs><rect x="14" y="${y0}" width="136" height="${ch * cells}" rx="6" fill="#0e0e11" stroke="#1f1f25"/>`;
  for (let k = 0; k <= cells; k++){ const nut = s === 0 && k === 0, y = y0 + ch * k; h += `<line x1="14" y1="${y}" x2="150" y2="${y}" stroke="${nut ? '#d9d3c3' : '#55555e'}" stroke-width="${nut ? 6 : 3}"/>` + (nut ? '' : `<line x1="14" y1="${y - .8}" x2="150" y2="${y - .8}" stroke="#b9b9c3" stroke-width="1"/>`); }
  for (let k = 0; k < cells; k++){ const f = s + 1 + k;
    if ([3,5,7,9,15].includes(f)) h += `<circle cx="${(xs[2] + xs[3]) / 2}" cy="${cy(k)}" r="4" fill="#2b2b33"/>`;
    if (f === 12) h += `<circle cx="${(xs[1] + xs[2]) / 2}" cy="${cy(k)}" r="4" fill="#2b2b33"/><circle cx="${(xs[3] + xs[4]) / 2}" cy="${cy(k)}" r="4" fill="#2b2b33"/>`;
    h += `<text x="6" y="${cy(k) + 4}" text-anchor="middle" font-size="10" fill="#9a968c" font-family="Inter,sans-serif">${f}</text>`; }
  xs.forEach((x, i) => { const w = [3.1,2.5,2,1.5,1.2,.9][i]; h += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + ch * cells}" stroke="${i < 3 ? '#a8a8b2' : '#d6d6dc'}" stroke-width="${w}"/><line x1="${x - w / 4}" y1="${y0}" x2="${x - w / 4}" y2="${y0 + ch * cells}" stroke="#fff" stroke-opacity=".35" stroke-width=".6"/>`; });
  frets.forEach((f, i) => { if (f === null) h += `<text x="${xs[i]}" y="20" text-anchor="middle" font-size="15" font-weight="700" fill="#9a968c" font-family="Inter,sans-serif">×</text>`; else if (f === 0) h += lab === 'funcs' ? `<circle cx="${xs[i]}" cy="15" r="9.5" fill="#ff9437"${((OPEN_STRING_PC[i]) % 12) === rootPc ? ' stroke="#fff4e0" stroke-width="2"' : ''}/><text x="${xs[i]}" y="18.5" text-anchor="middle" font-size="9" font-weight="700" fill="#1a0f00" font-family="Inter,sans-serif">${fnome(OPEN_STRING_PC[i] - rootPc)}</text>` : `<circle cx="${xs[i]}" cy="15" r="5" fill="none" stroke="#eee7d8" stroke-width="1.6"/>`; });
  if (d.barre){ const k = d.barre.fret - s - 1; if (k >= 0 && k < cells) h += `<rect x="${xs[d.barre.from] - 12}" y="${cy(k) - 12}" width="${xs[d.barre.to] - xs[d.barre.from] + 24}" height="24" rx="12" fill="#ff9437" opacity=".3"/>`; }
  frets.forEach((f, i) => { if (!f) return; const k = f - s - 1, pc = (OPEN_STRING_PC[i] + f) % 12, root = pc === rootPc, x = xs[i], y = cy(k);
    h += `<circle cx="${x}" cy="${y}" r="13" fill="#ff9437" opacity=".75" filter="url(#${id})"/><circle cx="${x}" cy="${y}" r="11" fill="#ff9437"${root ? ' stroke="#fff4e0" stroke-width="2.4"' : ''}/>`;
    const tx = lab === 'names' ? ((nomes && nomes[i]) || NOTE_NAMES[pc]) : lab === 'funcs' ? fnome(pc - rootPc) : (lab === 'fingers' ? d.fingers[i] : null);
    if (tx) h += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="${(lab === 'funcs' || (lab === 'names' && String(tx).length > 1)) ? 9 : 11}" font-weight="700" fill="#1a0f00" font-family="Inter,sans-serif">${tx}</text>`; });
  el.innerHTML = h + '</svg>';
}
