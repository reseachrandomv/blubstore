(async () => {
  const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rich = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');   // *word* -> blue italic
  const get = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- currency ---------- */
  const CURRENCIES = {
    USD: {field:'priceUSD', fmt: n => '$' + n.toLocaleString('en-US', {maximumFractionDigits:2})},
    INR: {field:'priceINR', fmt: n => '₹' + n.toLocaleString('en-IN', {maximumFractionDigits:2})},
    MVR: {field:'priceMVR', fmt: n => 'MVR ' + n.toLocaleString('en-US', {maximumFractionDigits:2})}
  };
  const CUR_KEY = 'blub_currency';
  let cur = 'USD';
  try { const c = localStorage.getItem(CUR_KEY); if (CURRENCIES[c]) cur = c; } catch(e) {}
  const priceOf = p => Number(p[CURRENCIES[cur].field]) || 0;
  const money = n => CURRENCIES[cur].fmt(n);

  /* ---------- images: .png -> assets/<name>.svg -> placeholder ---------- */
  const imgPath = p => String(p || '').replace(/^\/+/, '');       // CMS may write "/assets/…"
  window.blubImgFallback = img => {
    const tried = +(img.dataset.tries || 0); img.dataset.tries = tried + 1;
    const base = (img.getAttribute('src') || '').split('/').pop().replace(/\.[a-z0-9]+$/i, '');
    if (tried === 0 && !/^assets\/[^/]+\.svg$/.test(img.getAttribute('src'))) img.src = `assets/${base}.svg`;
    else if (tried <= 1) img.src = 'assets/placeholder.svg';
    else img.onerror = null;
  };
  const imgTag = (src, alt, extra='') => `<img src="${esc(imgPath(src))}" alt="${esc(alt)}" onerror="blubImgFallback(this)" ${extra}>`;

  /* ---------- load content ---------- */
  let PRODUCTS = [], SITE = {};
  try {
    const [pr, si] = await Promise.all([fetch('content/products.json', {cache:'no-cache'}), fetch('content/site.json', {cache:'no-cache'})]);
    PRODUCTS = (await pr.json()).filter(p => p && p.id && p.name);
    SITE = await si.json();
  } catch (e) {
    $('#grid').innerHTML = '<p class="muted load-msg">Products could not be loaded. (Open the site through a web server, not as a local file.)</p>';
    console.error(e);
  }
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const soldOut = p => p.inStock === false || /sold\s*out/i.test(p.badge || '');

  /* ---------- site text ---------- */
  $$('[data-site]').forEach(el => { const v = get(SITE, el.dataset.site); if (v) el.textContent = v; });
  $$('[data-site-rich]').forEach(el => { const v = get(SITE, el.dataset.siteRich); if (v) el.innerHTML = rich(v); });
  const paras = get(SITE, 'about.paragraphs');
  if (Array.isArray(paras) && paras.length) $('.about-text').innerHTML = paras.map(t => `<p>${esc(t)}</p>`).join('');
  const specs = get(SITE, 'story.specs') || [];
  $('.specs').innerHTML = specs.slice(0, 4).map((s, i) =>
    `<div class="spec s${i+1}"><span class="num">0${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('');
  const flagship = byId[get(SITE, 'story.productId')] || PRODUCTS.find(p => /flagship/i.test(p.badge || '')) || PRODUCTS[0];

  // story image: use the photo if it loads, otherwise keep the SVG jacket + podium + ribbons
  const storyImg = imgPath(get(SITE, 'story.image'));
  const stage = $('.stage');
  if (flagship) $('.hero-item').alt = flagship.name;
  const photoReady = new Promise(res => {
    if (!storyImg) return res(false);
    const probe = new Image();
    probe.onload = () => { $('.hero-item').src = storyImg; stage.classList.add('has-photo'); res(true); };
    probe.onerror = () => res(false);
    probe.src = storyImg;
  });

  /* ---------- grid ---------- */
  function renderGrid() {
    if (!PRODUCTS.length) return;
    $('#grid').innerHTML = PRODUCTS.map(p => {
      const so = soldOut(p), badge = so ? 'Sold out' : p.badge;
      return `<article class="card${so ? ' sold' : ''}" data-name="${esc((p.name + ' ' + (p.description||'')).toLowerCase())}">
        <div class="card-img">${badge ? `<span class="tag${so ? ' tag-so' : ''}">${esc(badge)}</span>` : ''}${imgTag(p.image, p.name, 'loading="lazy" width="400" height="400"')}</div>
        <div class="card-body"><h3>${esc(p.name)}</h3><p class="meta">${esc(p.description)}</p>
          <div class="card-foot"><p class="price">${money(priceOf(p))}<small>example price · ${cur}</small></p>
          <button class="pill pill-line add" data-id="${esc(p.id)}" ${so ? 'disabled aria-disabled="true"' : ''}>${so ? 'Sold out' : 'Add to bag'}</button></div></div>
      </article>`; }).join('');
    applySearch();
  }
  function renderStoryEnd() {
    if (!flagship) return;
    $('.story-name').textContent = 'The ' + flagship.name;
    $('.story-price').textContent = money(priceOf(flagship));
    const b = $('.story-add'); b.dataset.id = flagship.id;
    b.disabled = soldOut(flagship); b.textContent = soldOut(flagship) ? 'Sold out' : 'Add to bag';
  }

  /* ---------- cart ---------- */
  const KEY = 'blub_cart';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e) { cart = {}; }
  const prune = () => Object.keys(cart).forEach(id => { if (!byId[id] || soldOut(byId[id]) || !(cart[id] > 0)) delete cart[id]; });
  if (PRODUCTS.length) prune();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch(e) {} };
  const lines = () => Object.entries(cart).filter(([id]) => byId[id]).map(([id, q]) => ({...byId[id], qty:q, unit:priceOf(byId[id]), sub:priceOf(byId[id])*q}));
  const total = () => lines().reduce((a, l) => a + l.sub, 0);
  const count = () => lines().reduce((a, l) => a + l.qty, 0);

  function renderCart() {
    const ls = lines();
    $('.cart-count').textContent = count();
    $('.cart-lines').innerHTML = ls.map(l => `
      <li class="cart-line">${imgTag(l.image, '')}
        <div><h4>${esc(l.name)}</h4><p class="lp">${money(l.unit)} each</p>
          <div class="qty"><button data-dec="${esc(l.id)}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-inc="${esc(l.id)}" aria-label="Increase">+</button></div></div>
        <div style="text-align:right"><strong>${money(l.sub)}</strong><br><button class="rm" data-rm="${esc(l.id)}">Remove</button></div></li>`).join('');
    $('.cart-empty').style.display = ls.length ? 'none' : 'block';
    $('.cart-total').textContent = money(total());
    $('.go-checkout').disabled = !ls.length;
    if (!$('#checkout').hidden) renderSummary();
  }
  function renderAll() {
    $$('.cur button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cur === cur));
    $$('.cur-name').forEach(e => e.textContent = cur);
    renderGrid(); renderStoryEnd(); renderCart();
  }
  function setCurrency(c) { if (!CURRENCIES[c]) return; cur = c; try { localStorage.setItem(CUR_KEY, c); } catch(e) {} renderAll(); }
  function add(id) {
    const p = byId[id]; if (!p || soldOut(p)) return;
    cart[id] = (cart[id] || 0) + 1; save(); renderCart();
    const c = $('.cart-count'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    toast(`${p.name} added to your bag`);
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.dataset.cur) setCurrency(t.dataset.cur);
    if (t.matches('.add') && !t.disabled) { add(t.dataset.id); t.classList.add('added'); t.textContent = 'Added ✓'; setTimeout(() => { t.classList.remove('added'); t.textContent = 'Add to bag'; }, 1400); }
    if (t.dataset.inc) { cart[t.dataset.inc]++; save(); renderCart(); }
    if (t.dataset.dec) { if (--cart[t.dataset.dec] <= 0) delete cart[t.dataset.dec]; save(); renderCart(); }
    if (t.dataset.rm) { delete cart[t.dataset.rm]; save(); renderCart(); }
    if (t.matches('.cart-btn')) openDrawer();
    if (t.matches('.close-drawer')) closeDrawer();
    if (t.matches('.go-checkout') || t.matches('.open-checkout')) { e.preventDefault(); closeDrawer(); openCheckout(); }
    if (t.matches('.close-modal')) closeCheckout();
  });
  const overlay = $('.overlay'), drawer = $('.drawer');
  function openDrawer(){ overlay.hidden = false; drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); }
  function closeDrawer(){ overlay.hidden = true; drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); }
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeCheckout(); } });
  addEventListener('storage', e => {
    if (e.key === KEY) { try { cart = JSON.parse(e.newValue) || {}; } catch(_) { cart = {}; } renderCart(); }
    if (e.key === CUR_KEY && CURRENCIES[e.newValue]) { cur = e.newValue; renderAll(); }
  });

  /* ---------- checkout ---------- */
  const modal = $('#checkout'), form = $('.co-form');
  function renderSummary() {
    const ls = lines();
    $('.co-summary').innerHTML = ls.length
      ? ls.map(l => `<div><span>${l.qty} × ${esc(l.name)}</span><span>${money(l.sub)}</span></div>`).join('') + `<div class="t"><span>Total (${cur})</span><span>${money(total())}</span></div>`
      : '<em>Your bag is empty — add something first.</em>';
  }
  function openCheckout(){ renderSummary(); modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeCheckout(){ modal.hidden = true; document.body.style.overflow = ''; }
  modal.addEventListener('click', e => { if (e.target === modal) closeCheckout(); });
  function fillOrderFields() {
    const ls = lines();
    form.elements['Order items'].value = ls.map(l => `${l.qty} x ${l.name} [${l.id}] @ ${money(l.unit)} = ${money(l.sub)}`).join(' | ');
    form.elements['Item count'].value = count();
    form.elements['Currency'].value = cur;
    form.elements['Order total'].value = `${money(total())} (${cur})`;
    if (/^https?:/.test(location.protocol)) form.elements['_next'].value = new URL('thank-you.html', location.href).href;
  }
  window.blubDebugFillOrder = fillOrderFields;   // used by screenshot script to inspect fields (never submits)
  form.addEventListener('submit', e => {
    const err = $('.co-err');
    if (!lines().length) { e.preventDefault(); err.textContent = 'Your bag is empty.'; return; }
    if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
    fillOrderFields(); err.textContent = '';
    form.querySelector('[type=submit]').textContent = 'Sending…';
  });

  /* ---------- header / search / menu / newsletter ---------- */
  const hdr = $('.hdr');
  addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 10), {passive:true});
  const burger = $('.burger'), links = $('.links');
  burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });
  const sb = $('.search-bar'), si = $('input', sb);
  $('.search-btn').addEventListener('click', () => { sb.hidden = !sb.hidden; if (!sb.hidden) si.focus(); });
  function applySearch() {
    const q = si.value.trim().toLowerCase(); let n = 0;
    $$('.card').forEach(c => { const m = !q || c.dataset.name.includes(q); c.style.display = m ? '' : 'none'; n += m; });
    $('.no-results').hidden = n > 0 || !PRODUCTS.length;
  }
  si.addEventListener('input', applySearch);
  si.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('shop').scrollIntoView({behavior:'smooth'}); });
  $('.news-form').addEventListener('submit', e => {
    e.preventDefault(); const i = $('input', e.target), m = $('.news-msg');
    if (!i.checkValidity() || !i.value) { m.textContent = 'Please enter a valid email.'; return; }
    m.textContent = 'Thanks — you’re on the list. 💙'; i.value = '';
  });
  let tt; function toast(msg){ const t = $('.toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800); }
  renderAll();

  /* ---------- scroll story ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduce) { document.documentElement.classList.add('no-anim'); return; }
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('.hero .eyebrow, .hero .display, .hero .lede, .hero .cta-row', {y:40, opacity:0, duration:1, stagger:.12, ease:'power3.out'});
  await Promise.race([photoReady, new Promise(r => setTimeout(r, 2500))]);   // decide photo vs SVG before building the timeline
  const photo = stage.classList.contains('has-photo');
  gsap.to(photo ? '.frame' : '.hero-item', {y:-12, duration:2.4, yoyo:true, repeat:-1, ease:'sine.inOut'});

  const mm = gsap.matchMedia();
  mm.add({desktop:'(min-width: 861px)', mobile:'(max-width: 860px)'}, ctx => {
    const desk = ctx.conditions.desktop;
    gsap.set('.product-wrap, .ribbons', {xPercent:-50, yPercent:-50, x:0, y:0});
    gsap.set('.story-end', {xPercent:-50, x:0, y:20});
    gsap.set('.spec', {opacity:0});
    const tl = gsap.timeline({ defaults:{ease:'power2.out'},
      scrollTrigger:{ trigger:'.story', start:'top top', end:'+=320%', pin:'.stage', scrub:1, anticipatePin:1 }});
    tl.fromTo('.product-wrap', {scale:.82, rotate:photo ? -2 : -6}, {scale:1, rotate:0, duration:1}, 0)
      .fromTo('.ribbons', {rotate:-8, scale:.9, opacity:.5}, {rotate:6, scale:1.12, opacity:1, duration:6, ease:'none'}, 0)
      .fromTo('.bg-word', {xPercent:-8}, {xPercent:8, duration:6, ease:'none'}, 0)
      .fromTo('.progress span', {scaleX:0}, {scaleX:1, duration:6, ease:'none'}, 0);
    $$('.spec').forEach((s, i) => {
      tl.fromTo(s, {opacity:0, x:desk ? (i % 2 ? 60 : -60) : 0, y:desk ? 20 : 40}, {opacity:1, x:0, y:0, duration:.6}, .6 + i);
      if (!desk) tl.to(s, {opacity:0, y:-30, duration:.4}, 1.3 + i);
    });
    const tilt = photo ? 1.5 : 4;
    tl.to('.product-wrap', {rotate:tilt, scale:1.06, duration:1}, 1)
      .to('.product-wrap', {rotate:-tilt*.75, x:desk ? -20 : 0, duration:1}, 2)
      .to('.hero-item', {scale:photo ? 1.9 : (desk ? 2.1 : 1.8), transformOrigin:photo ? '50% 42%' : '40% 45%', duration:1}, 3)   // fabric close-up
      .to('.podium', {opacity:0, y:40, duration:.6}, 3)
      .to('.hero-item', {scale:1, duration:1}, 4.2)
      .to('.podium', {opacity:1, y:0, duration:.6}, 4.4)
      .to('.product-wrap', {rotate:0, x:0, scale:photo ? (desk ? .8 : .85) : (desk ? .9 : .85), y:photo ? (desk ? -80 : -40) : (desk ? -30 : -20), duration:1}, 4.4);
    if (desk) tl.to('.spec', {opacity:0, y:-20, stagger:.05, duration:.5}, 4.5);
    tl.to('.story-end', {opacity:1, y:0, duration:.6}, 5.1).to({}, {duration:.4});
  });
  gsap.utils.toArray('.card').forEach((c, i) => gsap.from(c, {y:50, opacity:0, duration:.8, ease:'power3.out', delay:(i % 4) * .08, scrollTrigger:{trigger:c, start:'top 92%'}}));
  gsap.from('.about-card', {y:60, opacity:0, duration:1, scrollTrigger:{trigger:'.about', start:'top 85%'}});
  ScrollTrigger.refresh();
})();
