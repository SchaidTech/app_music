/* Som dos acordes e notas dos cursos (usa Tone.js + violao.js). Cordas: índice 0 = 6ª corda. */
const Acorde = (() => {
  const OPEN = [40, 45, 50, 55, 59, 64];
  let voz = null, pronto = null;
  function init(){
    if (!pronto) pronto = (async () => { await Tone.start(); voz = Violao.create(); })();
    return pronto;
  }
  const nome = (m) => Tone.Frequency(m, 'midi').toNote();
  // toca um acorde "rasgueado" da grave para a aguda
  async function play(frets, opc){
    const o = Object.assign({ strum: 0.03, volume: 1 }, opc || {});
    await init();
    const t0 = Tone.now() + 0.03;
    let k = 0;
    frets.forEach((f, i) => { if (f == null) return; voz.triggerAttackRelease(nome(OPEN[i] + f), '2n', t0 + k * o.strum); k++; });
  }
  async function nota(midi){ await init(); voz.triggerAttackRelease(nome(midi), '2n', Tone.now() + 0.02); }
  return { play, nota, init, OPEN };
})();
