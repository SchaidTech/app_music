const PROGRESS_KEY = 'appMusica.progress.v1';

function loadProgress(){
  try{
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { totalCorrect:0, totalRounds:0, bestStreakEver:0, lastPracticeDate:null, streakDays:0 };
    return JSON.parse(raw);
  }catch(e){
    return { totalCorrect:0, totalRounds:0, bestStreakEver:0, lastPracticeDate:null, streakDays:0 };
  }
}

function saveProgress(p){
  try{ localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }catch(e){}
}

function todayStr(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function daysBetween(a, b){
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

// Chamado pelos módulos a cada rodada respondida.
function recordPractice({ correct, sessionStreak }){
  const p = loadProgress();
  p.totalRounds += 1;
  if (correct) p.totalCorrect += 1;
  if (sessionStreak > p.bestStreakEver) p.bestStreakEver = sessionStreak;

  const today = todayStr();
  if (p.lastPracticeDate !== today){
    if (p.lastPracticeDate && daysBetween(p.lastPracticeDate, today) === 1){
      p.streakDays += 1;
    } else {
      p.streakDays = 1;
    }
    p.lastPracticeDate = today;
  }
  saveProgress(p);
  return p;
}
