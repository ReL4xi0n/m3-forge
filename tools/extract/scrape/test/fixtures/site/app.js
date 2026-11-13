fetch('/_dsm/page.json').then(r => r.json()).then(d => { document.getElementById('from-json').textContent = d.text; });
fetch('/search.html?q=x').catch(() => {});
if (window.THIRD_PARTY) fetch(window.THIRD_PARTY + '/beacon').catch(() => {});
document.getElementById('exp').addEventListener('click', e => {
  e.target.setAttribute('aria-expanded', 'true');
  document.getElementById('more').hidden = false;
});
document.getElementById('t2').addEventListener('click', () => {
  document.getElementById('t1').setAttribute('aria-selected', 'false');
  document.getElementById('t2').setAttribute('aria-selected', 'true');
  fetch('/_dsm/tab2.json').then(r => r.json()).then(d => {
    document.getElementById('p1').hidden = true;
    const p2 = document.getElementById('p2');
    p2.textContent = d.text;
    p2.hidden = false;
  });
});
document.getElementById('t1').addEventListener('click', () => {
  document.getElementById('t1').setAttribute('aria-selected', 'true');
  document.getElementById('t2').setAttribute('aria-selected', 'false');
  document.getElementById('p1').hidden = false;
  document.getElementById('p2').hidden = true;
});
