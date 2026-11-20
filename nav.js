/* Barra de navegação inferior (todas as telas) */
(function(){
  const page = location.pathname.split('/').pop() || 'index.html';
  const items = [['index.html', 'Início', 'M4 11l8-7 8 7v9H4z'], ['modulo-cursos.html', 'Cursos', 'M4 5h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v13h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z'],
    ['modulo-acordes-escalas.html', 'Acordes', 'M5 4h14v16H5z M5 9h14 M5 14h14 M10 4v16 M15 4v16'], ['modulo-tab.html', 'Tab', 'M3 6h18 M3 10h18 M3 14h18 M3 18h18'], ['modulo-intervalos.html', 'Ouvido', 'M3 16c3-8 15-8 18 0']];
  const nav = document.createElement('nav'); nav.className = 'bnav'; nav.setAttribute('aria-label', 'Navegação principal');
  nav.innerHTML = items.map(([h, n, d]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg><span>${n}</span></a>`).join('');
  document.body.appendChild(nav); document.body.classList.add('has-bnav');
})();
