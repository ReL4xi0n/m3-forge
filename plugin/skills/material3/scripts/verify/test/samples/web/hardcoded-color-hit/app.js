const accent = '#ff0000'; // HIT
const label = document.querySelector('#add');
export function paint(el) {
  el.dataset.accent = accent;
  el.textContent = label ? 'ready' : 'missing';
}
