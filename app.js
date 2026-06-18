// PRISM · Dual Presence — standalone app.js
// 1. Language switcher
// 2. Leaflet Bali coverage map
// 3. IntersectionObserver reveal

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

function initMap(){
  const el = document.getElementById('coverage-map');
  if (!el || !window.L) { if (!window.L) setTimeout(initMap, 400); return; }
  if (el.dataset.mapInit) return;
  el.dataset.mapInit = '1';
  const map = L.map('coverage-map', { zoomControl:false, attributionControl:false, scrollWheelZoom:false }).setView([-8.67, 115.12], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains:'abcd', maxZoom:20 }).addTo(map);
  const pts = [
    { p:[-8.748,115.167], n:'Ngurah Rai Airport', c:'#e7cfa6' },
    { p:[-8.697,115.182], n:'Sunset Road 99s',    c:'#d3a85f' },
    { p:[-8.673,115.188], n:'Mal Bali Galeria',   c:'#c2924c' },
    { p:[-8.688,115.157], n:'Seminyak Square',    c:'#b8853f' },
    { p:[-8.615,115.105], n:'Munggu Gateway',     c:'#9ecf8a' },
    { p:[-8.547,115.003], n:'Nuanu · Tabanan',    c:'#7ce0a8' }
  ];
  pts.forEach(loc => {
    const icon = L.divIcon({ html:`<div style="width:13px;height:13px;border-radius:50%;background:${loc.c};box-shadow:0 0 12px ${loc.c};border:2px solid rgba(255,255,255,0.35);"></div>`, iconSize:[13,13], className:'' });
    L.marker(loc.p, { icon }).addTo(map).bindPopup(`<span style="font-family:monospace;font-size:12px;color:#e7cfa6;">${loc.n}</span>`);
  });
  L.polyline(pts.map(l => l.p), { color:'#e7cfa6', weight:2, opacity:0.65, dashArray:'6 9' }).addTo(map);
}

function initReveal(){
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => { initLang(); initMap(); initReveal(); });
