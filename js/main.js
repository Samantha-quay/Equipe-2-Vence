// Menu mobile
const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
if (btn && nav) {
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
}

// Barre de progression de lecture
const bar = document.querySelector('.progress');
if (bar) {
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  };
  document.addEventListener('scroll', update, { passive: true });
  update();
}

// Apparition au défilement
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add('in'));
}

// ---------- Lecteur vidéo des reportages ----------
function toEmbed(u) {
  try {
    const url = new URL(u, location.href);
    const h = url.hostname.replace('www.', '');
    if (h === 'youtu.be') return 'https://www.youtube.com/embed/' + url.pathname.slice(1);
    if (h.endsWith('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return url.href;
      const id = url.searchParams.get('v');
      if (id) return 'https://www.youtube.com/embed/' + id;
      const m = url.pathname.match(/\/(shorts|live)\/([\w-]+)/);
      if (m) return 'https://www.youtube.com/embed/' + m[2];
    }
    if (h === 'vimeo.com') return 'https://player.vimeo.com/video/' + url.pathname.split('/').filter(Boolean).pop();
    if (h === 'player.vimeo.com') return url.href;
  } catch (e) { /* lien invalide : on retombe sur un fichier vidéo */ }
  return null;
}
document.querySelectorAll('.player[data-slug]').forEach((p) => {
  const src = (window.LIMIERS_VIDEOS || {})[p.dataset.slug];
  if (!src) return;
  p.classList.add('has-video');
  const embed = toEmbed(src);
  if (embed) {
    p.innerHTML = '<iframe src="' + embed + '" title="' + p.dataset.title.replace(/"/g, '&quot;') +
      '" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe>';
  } else {
    const v = document.createElement('video');
    v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.src = src;
    p.innerHTML = ''; p.appendChild(v);
  }
});

// ---------- Tableau d'enquête (page Reportages) ----------
const board = document.getElementById('board');
if (board) {
  const cases = [...board.querySelectorAll('.case')];
  const chips = [...document.querySelectorAll('.chip')];
  const count = document.getElementById('count');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-pressed', c === chip); });
    const f = chip.dataset.filter;
    let n = 0;
    cases.forEach((c) => {
      const show = f === 'Tous' || c.dataset.cat === f;
      if (show) n++;
      if (show) { c.hidden = false; requestAnimationFrame(() => c.classList.remove('is-out')); }
      else { c.classList.add('is-out'); setTimeout(() => { if (c.classList.contains('is-out')) c.hidden = true; }, reduce ? 0 : 280); }
    });
    board.dataset.count = n;
    board.classList.toggle('filtered', f !== 'Tous');
    count.textContent = n;
  }));

  // Loupe qui suit le curseur + légère inclinaison des cartes (souris uniquement)
  const lens = document.querySelector('.lens');
  if (lens && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    document.documentElement.classList.add('has-lens');
    board.addEventListener('pointermove', (e) => {
      lens.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      lens.classList.add('on');
      const c = e.target.closest('.case');
      lens.classList.toggle('big', !!c);
      if (c) {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 5).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((.5 - (e.clientY - r.top) / r.height) * 5).toFixed(2) + 'deg');
      }
    });
    board.addEventListener('pointerleave', () => lens.classList.remove('on', 'big'));
    cases.forEach((c) => c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }));
  }
}