const label = document.querySelector('#add');
const link = document.querySelector('a[href="#fade"]');
export function paint(el) {
  el.textContent = label && link ? 'ready' : 'missing';
}
