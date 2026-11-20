/* Braço com cordas em movimento (palhetada, bend, vibrato, slide) acompanhando o player do alphaTab */
const FX_KEY = 'appMusica.fx.v1';
const FXCFG = Object.assign({ on: true, color: true, tilt: true }, (() => { try{ return JSON.parse(localStorage.getItem(FX_KEY)) || {}; }catch(e){ return {}; } })());
const NOBOARD = (() => { try{ return localStorage.getItem('appMusica.noboard') === '1'; }catch(e){ return false; } })();
const FX_COL = ['#ff6bd6','#a779ff','#ff9437','#ffd84d','#ff5a5a','#2fe0d0'], FX_W = [.9,1.2,1.5,2,2.5,3.1];
const FX_WX = [36,100,164,228,292,356], FX_YS = [26,52,78,104,130,156], FX_END = 366;
const fxX = k => k < 0 ? 18 + (k + 1) * 50 : 68 + 64 * k;
function alphaNoteStr(n){   // índice da corda: 0 = 6ª (convenção do alphaTab conferida pela altura da nota)
  const c = [n.string - 1, 6 - n.string], m = c.find(i => i >= 0 && i < 6 && OPEN_STRING_MIDI[i] + n.fret === n.realValue);
  return m !== undefined ? m : c[0];
}
class DynBoard{
  constructor(el){
    this.el = el; this.start = 0; this.follow = false; this.ghosts = null; this.voices = []; this.raf = 0;
    el.innerHTML = '<div class="fxb"><svg viewBox="0 0 372 182" role="img" aria-label="Braço da guitarra com as notas tocadas"><g class="st"></g><g class="an"></g></svg></div><div class="fx-bar"></div>';
    this.box = el.querySelector('.fxb'); this.st = el.querySelector('.st'); this.an = el.querySelector('.an');
    let h = ''; for (let r = 0; r < 6; r++) h += '<path fill="none" stroke-linecap="round"/><path fill="none" stroke-linecap="round" style="display:none"/>';
    for (let r = 0; r < 6; r++) h += '<circle r="9" style="display:none"/>';
    this.an.innerHTML = h; const k = this.an.children;
    this.P = [0,1,2,3,4,5].map(r => k[2 * r]); this.G = [0,1,2,3,4,5].map(r => k[2 * r + 1]); this.D = [0,1,2,3,4,5].map(r => k[12 + r]);
    const bar = el.querySelector('.fx-bar');
    [['on', 'Efeitos'], ['color', 'Cor por corda'], ['tilt', '3D']].forEach(([key, label]) => {
      const b = document.createElement('button'); b.className = 'fx-chip'; b.textContent = label; b.setAttribute('aria-pressed', String(!!FXCFG[key]));
      b.addEventListener('click', () => { FXCFG[key] = !FXCFG[key]; try{ localStorage.setItem(FX_KEY, JSON.stringify(FXCFG)); }catch(e){} DynBoard.all.forEach(d => d.apply()); });
      bar.appendChild(b);
    });
    (DynBoard.all = DynBoard.all || []).push(this); this.draw(); this.clear(); this.apply();
  }
  apply(){ this.box.classList.toggle('tilt', !!FXCFG.tilt); this.el.querySelectorAll('.fx-chip').forEach((b, i) => b.setAttribute('aria-pressed', String(!!FXCFG[['on', 'color', 'tilt'][i]]))); }
  configure(o){ this.follow = !!o.follow; this.ghosts = o.ghosts || null; this.setStart(o.start || 0, true); }
  setStart(s, force){ if (s === this.start && !force) return; this.start = s; this.voices = []; this.draw(); this.clear(); }
  draw(){
    const s = this.start; let h = '<rect x="0" y="10" width="372" height="162" rx="10" fill="#0e0e11" stroke="#1f1f25"/>';
    FX_WX.forEach((x, i) => { const nut = s === 0 && i === 0; h += `<line x1="${x}" y1="16" x2="${x}" y2="166" stroke="${nut ? '#d9d3c3' : '#55555e'}" stroke-width="${nut ? 6 : 3}"/>` + (nut ? '' : `<line x1="${x - .8}" y1="16" x2="${x - .8}" y2="166" stroke="#b9b9c3" stroke-width="1"/>`); });
    for (let k = 0; k < 5; k++){ const f = s + 1 + k, x = fxX(k);
      if ([3,5,7,9,15,17].includes(f)) h += `<circle cx="${x}" cy="91" r="4.5" fill="#2b2b33"/>`;
      if (f === 12) h += `<circle cx="${x}" cy="65" r="4.5" fill="#2b2b33"/><circle cx="${x}" cy="117" r="4.5" fill="#2b2b33"/>`;
      h += `<text x="${x}" y="179" text-anchor="middle" font-size="11" fill="#9a968c" font-family="Inter,sans-serif">${f}</text>`; }
    if (s === 0) h += '<text x="18" y="179" text-anchor="middle" font-size="11" fill="#9a968c" font-family="Inter,sans-serif">0</text>';
    (this.ghosts || []).forEach(([si, f]) => { const k = f - s - 1; if (f > 0 && (k < 0 || k > 4)) return; if (f === 0 && s > 0) return; h += `<circle cx="${f === 0 ? 18 : fxX(k)}" cy="${FX_YS[5 - si]}" r="7" fill="#2a2a32" stroke="#4a4a55"/>`; });
    this.st.innerHTML = h;
  }
  rest(r){ const p = this.P[r]; p.setAttribute('d', `M6 ${FX_YS[r]}H${FX_END}`); p.setAttribute('stroke', r < 3 ? '#d6d6dc' : '#a8a8b2'); p.setAttribute('stroke-width', FX_W[r]); this.G[r].style.display = this.D[r].style.display = 'none'; }
  clear(){ this.voices = []; for (let r = 0; r < 6; r++) this.rest(r); }
  beat(beat, speed){
    if (NOBOARD) return;
    const tun = beat.voice.bar.staff.tuning;
    if (!tun || tun.length !== 6){ this.el.style.display = 'none'; return; }
    this.el.style.display = '';
    const notes = beat.notes.filter(n => n.fret >= 0), fr = notes.map(n => n.fret).filter(f => f > 0);
    if (this.follow && fr.length && (fr.some(f => f <= this.start || f > this.start + 5))) this.setStart(Math.max(0, Math.min(...fr) - 1));
    const tempo = beat.voice.bar.masterBar.tempo, d = (beat.playbackDuration / 960) * (60 / tempo) / (speed || 1), dur = isFinite(d) && d > 0 ? d : .5;
    notes.forEach(n => this.voiceFor(n, dur, beat));
    if (this.voices.length && !this.raf) this.raf = requestAnimationFrame(t => this.frame(t));
  }
  voiceFor(n, dur, beat){
    const M = (typeof alphaTab !== 'undefined' && alphaTab.model) || {}, SO = M.SlideOutType || { Shift: 1, Legato: 2, OutUp: 3, OutDown: 4 }, SI = M.SlideInType || { IntoFromBelow: 1, IntoFromAbove: 2 };
    const si = alphaNoteStr(n), r = 5 - si, k0 = n.fret === 0 ? -1 : n.fret - this.start - 1;
    const v = { r, k0, t0: performance.now(), dur: dur + .35, atk: (n.isHammerPullDestination || n.isSlurDestination) ? .5 : (n.isTieDestination ? .12 : 1), dead: !!n.isDead };
    if (n.bendPoints && n.bendPoints.length) v.bend = n.bendPoints.length > 1 ? n.bendPoints.map(p => [p.offset / 60 * dur, p.value]) : [[0, n.bendPoints[0].value], [dur, n.bendPoints[0].value]];
    const vb = Math.max(n.vibrato || 0, beat.vibrato || 0); if (vb){ v.vib = vb === 2 ? 7.5 : 3.5; v.vs = Math.min(.3, dur * .25); }
    const so = n.slideOutType, sn = n.slideInType;
    if ((so === SO.Shift || so === SO.Legato) && n.slideTarget){ v.k1 = n.slideTarget.fret - this.start - 1; v.slide = { t: dur * .5, d: Math.max(.08, dur * .45) }; }
    else if (so === SO.OutUp || so === SO.OutDown){ v.k1 = k0 + (so === SO.OutUp ? 1.6 : -1.6); v.slide = { t: dur * .55, d: dur * .45 }; }
    if (sn === SI.IntoFromBelow || sn === SI.IntoFromAbove){ v.k1 = k0; v.k0 = k0 + (sn === SI.IntoFromBelow ? -1.6 : 1.6); v.slide = { t: 0, d: Math.min(.18, dur * .4) }; }
    v.k0 = Math.max(-1, Math.min(4.6, v.k0)); if (v.k1 !== undefined) v.k1 = Math.max(-1, Math.min(4.6, v.k1));
    this.voices.push(v);
  }
  frame(now){
    this.raf = 0;
    const act = Array(6).fill(null); this.voices = this.voices.filter(v => (now - v.t0) / 1000 < v.dur); this.voices.forEach(v => act[v.r] = v);
    const fx = FXCFG.on;
    for (let r = 0; r < 6; r++){
      const v = act[r]; if (!v){ if (this.D[r].style.display !== 'none') this.rest(r); continue; }
      const ts = Math.max(0, (now - v.t0) / 1000), c = v.dead ? '#9a968c' : (FXCFG.color ? FX_COL[r] : '#ff9437'), dir = r <= 2 ? 1 : -1;
      const A = fx ? v.atk * 4.2 * Math.exp(-ts / (v.dur * .7)) : 0;
      let k = v.k0; if (v.slide){ const q = Math.min(1, Math.max(0, (ts - v.slide.t) / v.slide.d)); k = v.k0 + (v.k1 - v.k0) * q * q * (3 - 2 * q); }
      const xf = fxX(k), y0 = FX_YS[r]; let off = 0;
      if (fx && v.bend){ let px = v.bend[v.bend.length - 1][1]; for (let i = 0; i < v.bend.length; i++) if (ts <= v.bend[i][0]){ if (i === 0) px = v.bend[0][1]; else { const a = v.bend[i - 1], b = v.bend[i], q = (ts - a[0]) / ((b[0] - a[0]) || 1); px = a[1] + (b[1] - a[1]) * q; } break; } off += dir * px * 3.4; }
      if (fx && v.vib && ts > v.vs) off += dir * v.vib * Math.sin(2 * Math.PI * 6.3 * (ts - v.vs)) * Math.min(1, (ts - v.vs) / .25);
      let d = `M6 ${y0}L${xf.toFixed(1)} ${(y0 + off).toFixed(1)}`;
      for (let i = 1; i <= 26; i++){ const u = i / 26, x = xf + (FX_END - xf) * u;
        d += `L${x.toFixed(1)} ${(y0 + off * Math.pow(1 - u, .8) + A * (Math.sin(Math.PI * u) * Math.cos(2 * Math.PI * 8 * ts) + .3 * Math.sin(2 * Math.PI * u) * Math.cos(2 * Math.PI * 15 * ts))).toFixed(1)}`; }
      const p = this.P[r], g = this.G[r], dot = this.D[r];
      p.setAttribute('d', d); p.setAttribute('stroke', c); p.setAttribute('stroke-width', FX_W[r] + .9);
      g.setAttribute('d', d); g.setAttribute('stroke', c); g.setAttribute('stroke-width', 8); g.setAttribute('stroke-opacity', Math.max(.12, .5 * Math.exp(-ts / (v.dur * .9)))); g.style.display = '';
      dot.style.display = ''; dot.setAttribute('cx', xf.toFixed(1)); dot.setAttribute('cy', (y0 + off).toFixed(1)); dot.setAttribute('r', (9 + 3 * v.atk * Math.exp(-ts * 8)).toFixed(1)); dot.setAttribute('fill', c); dot.style.filter = `drop-shadow(0 0 6px ${c})`;
    }
    if (this.voices.length) this.raf = requestAnimationFrame(t => this.frame(t));
    else for (let r = 0; r < 6; r++) this.rest(r);
  }
}
