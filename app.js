// PRISM · Dual Presence — standalone app.js
// 1. Language switcher
// 2. Leaflet Bali coverage map (animated SVG route overlay)
// 3. IntersectionObserver reveal
// 4. Counter-up animation
// 5. Stagger reveal for sections
// 6. Map SVG animated route

const LANG_KEY = 'prism_lang';
const supported = ['en','ru','id'];

function applyLang(lang){
  document.documentElement.setAttribute('lang', lang);
  const dict = (window.I18N && window.I18N[lang]) || {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (dict[k] !== undefined) el.textContent = dict[k];
  });
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  try { localStorage.setItem(LANG_KEY, lang); } catch(e){}
}

function initLang(){
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch(e){}
  const nav = (navigator.language || 'en').slice(0,2);
  const lang = supported.includes(saved) ? saved : (supported.includes(nav) ? nav : 'en');
  applyLang(lang);
  document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));
}

// ── MAP ──────────────────────────────────────────────────────────────────────
function initMap(){
  const el = document.getElementById('coverage-map');
  if (!el || !window.L) { if (!window.L) setTimeout(initMap, 400); return; }
  if (el.dataset.mapInit) return;
  el.dataset.mapInit = '1';
  const map = L.map('coverage-map', { zoomControl:false, attributionControl:false, scrollWheelZoom:false }).setView([-8.67, 115.12], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains:'abcd', maxZoom:20 }).addTo(map);

  const pts = [
    { p:[-8.748,115.167], n:'Ngurah Rai Airport',  c:'#e7cfa6' },
    { p:[-8.697,115.182], n:'Sunset Road 99s',      c:'#d3a85f' },
    { p:[-8.673,115.188], n:'Mal Bali Galeria',     c:'#c2924c' },
    { p:[-8.688,115.157], n:'Seminyak Square',      c:'#b8853f' },
    { p:[-8.615,115.105], n:'Munggu Gateway',       c:'#9ecf8a' },
    { p:[-8.547,115.003], n:'Nuanu · Tabanan',      c:'#7ce0a8' }
  ];

  // Animated pulsing markers
  pts.forEach((loc, i) => {
    const delay = i * 0.5;
    const icon = L.divIcon({
      html: `<div style="position:relative;width:18px;height:18px">
        <div style="position:absolute;inset:0;border-radius:50%;background:${loc.c};box-shadow:0 0 14px ${loc.c},0 0 28px ${loc.c}40;animation:px-pulse 2.4s ${delay}s ease-in-out infinite"></div>
        <div style="position:absolute;inset:-6px;border-radius:50%;border:1.5px solid ${loc.c};opacity:.5;animation:ripple 2.4s ${delay}s ease-out infinite"></div>
        <div style="position:absolute;inset:-12px;border-radius:50%;border:1px solid ${loc.c};opacity:.25;animation:ripple 2.4s ${delay + 0.4}s ease-out infinite"></div>
      </div>`,
      iconSize:[18,18],
      className:''
    });
    L.marker(loc.p, { icon }).addTo(map).bindPopup(`<span style="font-family:monospace;font-size:12px;color:#e7cfa6">${loc.n}</span>`);
  });

  // Static dashed polyline base
  const polyline = L.polyline(pts.map(l => l.p), { color:'#e7cfa6', weight:2, opacity:0.35, dashArray:'6 9' }).addTo(map);

  // Animated SVG route overlay (stroke-dashoffset traveling light)
  map.whenReady(() => {
    setTimeout(() => {
      const mapPane = map.getPanes().overlayPane;
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('style','position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:400');
      svg.setAttribute('class','leaflet-zoom-animated');

      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('fill','none');
      path.setAttribute('stroke','#7ce0a8');
      path.setAttribute('stroke-width','2.5');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('stroke-dasharray','12 200');
      path.setAttribute('opacity','0.9');
      path.style.filter = 'drop-shadow(0 0 6px #7ce0a8) drop-shadow(0 0 12px #7ce0a880)';

      // Animate the dash traveling along path
      const animEl = document.createElementNS('http://www.w3.org/2000/svg','animateMotion');
      // We'll use stroke-dashoffset approach instead
      path.style.animation = 'svgRouteTravel 7s linear infinite';

      svg.appendChild(path);
      mapPane.appendChild(svg);

      // Inject keyframe if not present
      if (!document.getElementById('map-anim-style')) {
        const st = document.createElement('style');
        st.id = 'map-anim-style';
        st.textContent = '@keyframes svgRouteTravel{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-800}} @keyframes ripple{0%{transform:scale(.3);opacity:.7}100%{transform:scale(3.2);opacity:0}}';
        document.head.appendChild(st);
      }

      function updatePath(){
        const coords = pts.map(loc => map.latLngToLayerPoint(L.latLng(loc.p)));
        let d = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
          d += ` L ${coords[i].x} ${coords[i].y}`;
        }
        path.setAttribute('d', d);
        // Compute total length for dasharray
        try {
          const len = path.getTotalLength();
          path.setAttribute('stroke-dasharray', `18 ${len}`);
          path.setAttribute('stroke-dashoffset', '0');
          path.style.animation = `svgRouteTravel 7s linear infinite`;
          // rewrite keyframe with correct len
          const st = document.getElementById('map-anim-style');
          if (st) st.textContent = `@keyframes svgRouteTravel{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-${len + 18}}} @keyframes ripple{0%{transform:scale(.3);opacity:.7}100%{transform:scale(3.2);opacity:0}}`;
        } catch(e){}
      }

      updatePath();
      map.on('moveend zoomend', updatePath);
    }, 300);
  });
}

// ── COUNTER-UP ────────────────────────────────────────────────────────────────
function initCounters(){
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.getAttribute('data-count'));
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1800;
      const start = performance.now();
      function tick(now){
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const val = target * ease;
        el.textContent = (val >= 1000 ? (val/1000).toFixed(1)+'K' : val % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = el.getAttribute('data-count-display') || el.textContent;
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => io.observe(el));
}

// ── STAGGER REVEAL ────────────────────────────────────────────────────────────
function initReveal(){
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  // Stagger children within stagger containers
  const staggerIo = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const children = entry.target.querySelectorAll('[data-stagger]');
      children.forEach((child, i) => {
        setTimeout(() => {
          child.style.opacity = '1';
          child.style.transform = 'none';
        }, i * 120);
      });
      staggerIo.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-stagger-parent]').forEach(el => staggerIo.observe(el));
}

// ── HERO TYPEWRITER word cycling (enhance existing wc animation) ──────────────
function initHeroGlow(){
  // Add subtle scan-line glow to hero section on mousemove
  const hero = document.querySelector('.hero-section, section:first-of-type, body > div:first-child');
  if (!hero) return;
  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    hero.style.setProperty('--mx', x + '%');
    hero.style.setProperty('--my', y + '%');
  });
}

// ── SECTION LABEL GLITCH ──────────────────────────────────────────────────────
function initGlitch(){
  document.querySelectorAll('[data-glitch]').forEach(el => {
    el.setAttribute('data-text', el.textContent);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLang();
  initMap();
  initReveal();
  initCounters();
  initHeroGlow();
  initGlitch();
});
