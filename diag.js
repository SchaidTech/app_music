/* Diagnóstico de áudio/travamento. Ativar: abrir qualquer página com ?debug=1 (desativar: ?debug=0). */
(function(){
  const KEY = 'appMusica.debug', NOSW = 'appMusica.nosw', NOBOARD = 'appMusica.noboard';
  const get = (k) => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const set = (k, v) => { try{ v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); }catch(e){} };
  const q = new URLSearchParams(location.search);
  if (q.get('debug') === '1') set(KEY, '1');
  if (q.get('debug') === '0'){ set(KEY, null); set(NOSW, null); set(NOBOARD, null); }
  const on = get(KEY) === '1';
  window.Diag = { on, attach(){} };
  if (!on) return;

  const logs = [], t0 = performance.now(), ctxs = [], S = { pos: 0, beats: 0, lastBeat: 0, fps: 0, state: '-' };
  let box, stat, list;
  const log = (m) => { logs.push(((performance.now() - t0) / 1000).toFixed(2) + '  ' + m); if (logs.length > 80) logs.shift(); paint(); };
  function paint(){ if (list){ list.textContent = logs.join('\n'); list.scrollTop = list.scrollHeight; } }

  // captura AudioContext e Worker (só no modo debug)
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC){
    const W = function(...a){ const c = new AC(...a); ctxs.push(c); log('AudioContext criado: ' + c.state + ', ' + c.sampleRate + ' Hz'); c.addEventListener('statechange', () => log('AudioContext → ' + c.state)); return c; };
    W.prototype = AC.prototype; window.AudioContext = W;
  }
  const WK = window.Worker;
  if (WK){
    const W2 = function(u, o){ const w = new WK(u, o); log('Worker criado'); w.addEventListener('error', (e) => log('ERRO no Worker: ' + (e.message || '?'))); w.addEventListener('messageerror', () => log('Worker: messageerror')); return w; };
    W2.prototype = WK.prototype; window.Worker = W2;
  }
  window.addEventListener('error', (e) => log('ERRO JS: ' + e.message + ' (' + (e.filename || '').split('/').pop() + ':' + e.lineno + ')'));
  window.addEventListener('unhandledrejection', (e) => log('PROMISE rejeitada: ' + (e.reason && (e.reason.message || e.reason))));
  try{ new PerformanceObserver((l) => l.getEntries().forEach(en => { if (en.duration > 120) log('TRAVA da página: ' + Math.round(en.duration) + ' ms'); })).observe({ entryTypes: ['longtask'] }); }catch(e){ log('longtask indisponível'); }
  let fr = 0, ft = performance.now();
  (function tick(){ fr++; const n = performance.now(); if (n - ft >= 1000){ S.fps = Math.round(fr * 1000 / (n - ft)); fr = 0; ft = n; } requestAnimationFrame(tick); })();

  function ui(){
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:6px;right:6px;bottom:64px;z-index:99999;background:rgba(0,0,0,.92);color:#cfe;border:1px solid #ff9437;border-radius:8px;font:11px/1.35 ui-monospace,Consolas,monospace;padding:6px;max-width:560px';
    stat = document.createElement('div'); stat.style.cssText = 'color:#ffb366;margin-bottom:4px;white-space:pre-wrap';
    list = document.createElement('pre'); list.style.cssText = 'margin:0;max-height:26vh;overflow:auto;white-space:pre-wrap;color:#cfe';
    const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px';
    const btn = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'font:11px sans-serif;padding:4px 7px;border-radius:6px;border:1px solid #555;background:#222;color:#fff'; b.onclick = f; row.appendChild(b); return b; };
    btn('Testar som do navegador', () => { try{ const c = new AC(), o = c.createOscillator(), g = c.createGain(); g.gain.value = .15; o.connect(g); g.connect(c.destination); c.resume().then(() => { o.start(); o.stop(c.currentTime + .6); log('bip: contexto ' + c.state); }); }catch(e){ log('bip falhou: ' + e.message); } });
    btn('Cordas animadas: ' + (get(NOBOARD) === '1' ? 'DESLIGADAS' : 'ligadas'), () => { set(NOBOARD, get(NOBOARD) === '1' ? null : '1'); location.reload(); });
    btn('Cache offline: ' + (get(NOSW) === '1' ? 'DESLIGADO' : 'ligado'), async () => {
      if (get(NOSW) === '1'){ set(NOSW, null); } else { set(NOSW, '1'); }
      try{ const rs = await navigator.serviceWorker.getRegistrations(); for (const r of rs) await r.unregister(); const ks = await caches.keys(); for (const k of ks) await caches.delete(k); }catch(e){}
      location.reload();
    });
    btn('Copiar relatório', () => { const t = stat.textContent + '\n' + logs.join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => log('copiado'), () => log('não consegui copiar; tire print')); });
    btn('Fechar', () => box.remove());
    box.append(stat, list, row); document.body.appendChild(box);
    setInterval(() => {
      const c = ctxs[ctxs.length - 1];
      stat.textContent = 'alphaTab ' + ((window.alphaTab && alphaTab.VersionInfo && alphaTab.VersionInfo.version) || '?') +
        ' | SW: ' + (navigator.serviceWorker && navigator.serviceWorker.controller ? 'ativo' : 'não') +
        ' | cordas: ' + (get(NOBOARD) === '1' ? 'off' : 'on') + ' | fps: ' + S.fps +
        '\náudio: ' + (c ? c.state + ' t=' + c.currentTime.toFixed(2) + 's' : 'sem contexto') +
        ' | player: ' + S.state + ' pos=' + (S.pos / 1000).toFixed(2) + 's | beats: ' + S.beats;
    }, 300);
    paint();
  }
  if (document.body) ui(); else document.addEventListener('DOMContentLoaded', ui);

  window.Diag.attach = function(api, label){
    log('player criado: ' + label);
    const safe = (fn) => { try{ fn(); }catch(e){ log('attach falhou: ' + e.message); } };
    let lastPct = -1;
    safe(() => api.soundFontLoad.on((e) => { const p = e.total ? Math.floor(e.loaded / e.total * 25) * 4 : 0; if (p !== lastPct){ lastPct = p; log('soundfont ' + p + '% (' + Math.round(e.loaded / 1024) + ' KB)'); } }));
    safe(() => api.soundFontLoaded.on(() => log('soundfont carregado')));
    safe(() => api.playerReady.on(() => log('playerReady')));
    safe(() => api.error.on((e) => log('alphaTab ERRO: ' + (e && e.message || e))));
    safe(() => api.playerStateChanged.on((e) => { S.state = e.state === 1 ? 'tocando' : 'parado'; log('estado: ' + S.state + (e.stopped ? ' (stop)' : '')); }));
    safe(() => api.playedBeatChanged.on(() => { S.beats++; S.lastBeat = performance.now(); if (S.beats <= 10) log('beat #' + S.beats); }));
    safe(() => api.playerPositionChanged.on((e) => { S.pos = e.currentTime; }));
  };
})();
