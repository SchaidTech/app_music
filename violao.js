/* Timbre de violão (corda dedilhada) para Acordes & Escalas e Intervalos.
   Síntese Karplus-Strong (Tone.PluckSynth) + filtros de "corpo" + reverb curto. Mesma interface do PolySynth. */
const Violao = {
  create(){
    const N = 10, voices = [];
    const lp = new Tone.Filter(3800, 'lowpass');
    const corpo = new Tone.Filter({ type: 'peaking', frequency: 210, Q: 1.1, gain: 5 });
    const brilho = new Tone.Filter({ type: 'peaking', frequency: 2400, Q: 0.8, gain: -2 });
    const ganho = new Tone.Gain(2.2);
    const reverb = new Tone.Reverb({ decay: 1.4, wet: 0.16 });
    lp.chain(corpo, brilho, ganho, reverb, Tone.Destination);
    for (let i = 0; i < N; i++) voices.push(new Tone.PluckSynth({ attackNoise: 1.4, dampening: 3200, resonance: 0.975 }).connect(lp));
    let k = 0;
    return { triggerAttackRelease(note, _dur, time){ voices[k++ % N].triggerAttack(note, time); } };
  }
};
