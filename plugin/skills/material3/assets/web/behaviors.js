/* material3 skill asset: assets/web/behaviors.js
 * Material 3 web behaviors, dependency free, one global: M3. Needs tokens.css (motion tokens).
 *
 *   M3.motion(el, keyframes, 'spatial-fast', opts?)  WAAPI with the motion tokens: '<kind>-<speed>',
 *                                  kind spatial|effects, speed fast|default|slow, in either order
 *                                  (--md-sys-motion-spring-<speed>-<kind>-easing/-duration); or a duration
 *                                  step such as 'short4' with the standard easing. Returns the Animation;
 *                                  under prefers-reduced-motion nothing animates and the result is
 *                                  { finished: Promise } that is already resolved.
 *   M3.ripple(root)                a pressed ripple on pointerdown in buttons, icon buttons, FABs, chips,
 *                                  list items, menu items and anything with [data-m3-ripple]. No ripple
 *                                  under reduced motion. Returns a function that removes the listener.
 *   M3.dialog(el)                  { open(), close() } for a <dialog>: showModal(), focus moves into it
 *                                  (autofocus, else the first control), Tab stays inside, focus returns to
 *                                  the opener on close; enter and exit motion. Cancel (Escape) closes it
 *                                  with the exit motion.
 *   M3.menu(button, menu)          { open(), close(), toggle() }: sets data-open and aria-expanded,
 *                                  places the menu under the button (flipped to fit the viewport), arrow
 *                                  keys, Home, End, Escape (focus back to the button), Tab and an outside
 *                                  press close it.
 * Overlays are shown only by [open] (showModal()) or [data-open]; positioning and motion are here.
 */
(function (global) {
  'use strict';
  var doc = global.document;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var RIPPLE_HOSTS = '.m3-button,.m3-icon-button,.m3-fab,.m3-chip,.m3-list-item,.m3-menu-item,.m3-tab,[data-m3-ripple]';
  var ITEMS = '[role^=menuitem]:not([disabled]):not([aria-disabled=true])';

  function reduced() {
    return Boolean(global.matchMedia) && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function token(name) {
    return global.getComputedStyle(doc.documentElement).getPropertyValue('--md-sys-motion-' + name).trim();
  }

  // 'spatial-fast' | 'fast-effects' | 'short4' -> { easing, duration (ms) }
  function timing(kind) {
    var words = String(kind || 'spatial-default').split('-');
    var type = words.indexOf('effects') >= 0 ? 'effects' : words.indexOf('spatial') >= 0 ? 'spatial' : '';
    if (type) {
      var speed = ['fast', 'slow'].filter(function (w) { return words.indexOf(w) >= 0; })[0] || 'default';
      var base = 'spring-' + speed + '-' + type;
      return { easing: token(base + '-easing'), duration: parseFloat(token(base + '-duration')) };
    }
    return { easing: token('easing-standard'), duration: parseFloat(token('duration-' + kind)) };
  }

  function motion(el, keyframes, kind, opts) {
    if (reduced() || !el.animate) return { finished: Promise.resolve() };
    var t = timing(kind);
    return el.animate(keyframes, Object.assign({ easing: t.easing, duration: t.duration, fill: 'both' }, opts));
  }

  // Resolves when the animation has finished or been cancelled.
  function done(anim) {
    return anim.finished.then(function () {}, function () {});
  }

  function ripple(root) {
    function down(e) {
      if (reduced() || e.button) return;
      var host = e.target.closest && e.target.closest(RIPPLE_HOSTS);
      if (!host || !root.contains(host) || host.disabled || host.getAttribute('aria-disabled') === 'true') return;
      var box = host.getBoundingClientRect();
      var x = e.clientX - box.left;
      var y = e.clientY - box.top;
      var r = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));
      if (global.getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var clip = doc.createElement('span');
      clip.setAttribute('aria-hidden', 'true');
      clip.style.cssText = 'position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;z-index:0';
      var dot = doc.createElement('span');
      dot.style.cssText = 'position:absolute;border-radius:50%;background:currentColor;pointer-events:none;' +
        'left:' + (x - r) + 'px;top:' + (y - r) + 'px;width:' + 2 * r + 'px;height:' + 2 * r + 'px;' +
        'opacity:var(--md-sys-state-pressed-state-layer-opacity)';
      clip.appendChild(dot);
      host.appendChild(clip);
      var grow = motion(dot, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], 'spatial-default');
      var release = function () {
        doc.removeEventListener('pointerup', release, true);
        doc.removeEventListener('pointercancel', release, true);
        done(grow).then(function () {
          return done(motion(dot, [{ opacity: 'var(--md-sys-state-pressed-state-layer-opacity)' }, { opacity: 0 }], 'effects-default'));
        }).then(function () { clip.remove(); });
      };
      doc.addEventListener('pointerup', release, true);
      doc.addEventListener('pointercancel', release, true);
    }
    root.addEventListener('pointerdown', down);
    return function () { root.removeEventListener('pointerdown', down); };
  }

  function enter(el, from) {
    return motion(el, [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], 'spatial-default');
  }

  function leave(el, to) {
    return done(motion(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: to }], 'effects-fast'));
  }

  function dialog(el) {
    var opener = null;
    var closing = false;
    var isSheet = el.classList.contains('m3-bottom-sheet') || el.classList.contains('m3-navigation-drawer');
    var from = isSheet ? 'translateY(var(--md-sys-space-800))' : 'translateY(var(--md-sys-space-300))';

    function controls() {
      return Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null || n === doc.activeElement; });
    }
    function trap(e) {
      if (e.key !== 'Tab') return;
      var list = controls();
      if (!list.length) { e.preventDefault(); return; }
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && (doc.activeElement === first || doc.activeElement === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    function open() {
      if (el.open) return;
      opener = doc.activeElement;
      el.addEventListener('keydown', trap);
      if (el.showModal) el.showModal(); else el.setAttribute('open', '');
      (el.querySelector('[autofocus]') || controls()[0] || el).focus();
      enter(el, from);
      if (!reduced() && el.animate) {
        try { motion(el, [{ opacity: 0 }, { opacity: 1 }], 'effects-default', { pseudoElement: '::backdrop' }); } catch (err) { /* no ::backdrop animation */ }
      }
    }
    function close() {
      if (!el.open || closing) return Promise.resolve();
      closing = true;
      return leave(el, from).then(function () {
        el.getAnimations().forEach(function (a) { a.cancel(); });
        el.removeEventListener('keydown', trap);
        if (el.close) el.close(); else el.removeAttribute('open');
        closing = false;
        if (opener && opener.focus) opener.focus();
      });
    }
    // Escape: the browser cancels a modal dialog; run the exit motion first.
    el.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    return { open: open, close: close };
  }

  function menu(button, el) {
    function items() { return Array.prototype.slice.call(el.querySelectorAll(ITEMS)); }
    function isOpen() { return el.hasAttribute('data-open'); }
    function place() {
      var b = button.getBoundingClientRect();
      var w = doc.documentElement.clientWidth;
      var h = doc.documentElement.clientHeight;
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      var m = el.getBoundingClientRect();
      var left = Math.min(Math.max(b.left, 0), Math.max(w - m.width, 0));
      var top = b.bottom + m.height <= h || b.top < m.height ? b.bottom : b.top - m.height;
      el.style.left = left + 'px';
      el.style.top = Math.max(top, 0) + 'px';
    }
    function onKey(e) {
      var list = items();
      var i = list.indexOf(doc.activeElement);
      var next = { ArrowDown: list[(i + 1) % list.length], ArrowUp: list[(i < 1 ? list.length : i) - 1], Home: list[0], End: list[list.length - 1] }[e.key];
      if (next) { e.preventDefault(); next.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); button.focus(); }
      else if (e.key === 'Tab') close();
    }
    function onOutside(e) {
      if (!el.contains(e.target) && !button.contains(e.target)) close();
    }
    function open() {
      if (isOpen()) return;
      el.setAttribute('data-open', '');
      button.setAttribute('aria-expanded', 'true');
      place();
      enter(el, 'translateY(calc(-1 * var(--md-sys-space-100)))');
      doc.addEventListener('keydown', onKey);
      doc.addEventListener('pointerdown', onOutside, true);
      var first = items()[0];
      if (first) first.focus();
    }
    function close() {
      if (!isOpen()) return Promise.resolve();
      doc.removeEventListener('keydown', onKey);
      doc.removeEventListener('pointerdown', onOutside, true);
      button.setAttribute('aria-expanded', 'false');
      return leave(el, 'translateY(calc(-1 * var(--md-sys-space-100)))').then(function () {
        el.getAnimations().forEach(function (a) { a.cancel(); });
        el.removeAttribute('data-open');
      });
    }
    function toggle() { return isOpen() ? close() : open(); }
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', toggle);
    el.addEventListener('click', function (e) { if (e.target.closest(ITEMS)) { close(); button.focus(); } });
    return { open: open, close: close, toggle: toggle };
  }

  global.M3 = { motion: motion, ripple: ripple, dialog: dialog, menu: menu };
}(typeof window !== 'undefined' ? window : this));
