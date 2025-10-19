// Enhanced nav: smooth-scroll + selective section visibility
(function(){
  try {
    console.debug && console.debug('[f-ren] init main script');
    var header = document.querySelector('.header');
  var mission = document.querySelector('.mission');
  var rhetor = document.getElementById('rhetor');
  var deal = document.getElementById('deal');
  var contact = document.getElementById('contact');
  var about = document.getElementById('about');

  function setVisibility(showId){
    var showTop = !showId || showId === 'top';
    // header & mission visible only for 'top'
    if (header) {
      header.style.display = showTop ? '' : 'none';
      header.setAttribute('aria-hidden', showTop ? 'false' : 'true');
    }
    if (mission) {
      mission.style.display = showTop ? '' : 'none';
      mission.setAttribute('aria-hidden', showTop ? 'false' : 'true');
    }
    // rhetor visible only for 'rhetor'
    if (rhetor) {
      rhetor.style.display = (showId === 'rhetor') ? 'block' : 'none';
      rhetor.setAttribute('aria-hidden', (showId === 'rhetor') ? 'false' : 'true');
    }
    // deal visible only for 'deal'
    if (deal) {
      deal.style.display = (showId === 'deal') ? '' : 'none';
      deal.setAttribute('aria-hidden', (showId === 'deal') ? 'false' : 'true');
    }
    // contact visible only for 'contact'
    if (contact) {
      contact.style.display = (showId === 'contact') ? '' : 'none';
      contact.setAttribute('aria-hidden', (showId === 'contact') ? 'false' : 'true');
    }
    // about visible only for 'about'
    if (about) {
      about.style.display = (showId === 'about') ? 'block' : 'none';
      about.setAttribute('aria-hidden', (showId === 'about') ? 'false' : 'true');
    }
  }

  function handleClick(e){
    // Resolve the anchor element reliably whether this was called as an
    // event listener (e.currentTarget), programmatically with `call(this, e)`
    // or via the delegated handler (where e.currentTarget may be the document).
    var link = null;
    if (e && e.currentTarget && typeof e.currentTarget.getAttribute === 'function') {
      link = e.currentTarget;
    } else if (this && typeof this.getAttribute === 'function') {
      link = this;
    } else if (e && e.target && e.target.closest) {
      link = e.target.closest('a[href^="#"]');
    }
    if (!link) { console.debug && console.debug('[f-ren] handleClick: no anchor element found', e, this); return; }
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    var targetId = href.slice(1) || 'top';
    var target = document.getElementById(targetId) || document.body;
    e.preventDefault();
    // Toggle visibility first so target has layout when we scroll
    setVisibility(targetId);
    var top = target.getBoundingClientRect().top + window.pageYOffset - 0;
    window.scrollTo({ top: top, behavior: 'smooth' });
    // After scrolling, move focus to the target for accessibility
    setTimeout(function(){
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }, 400);
    // Update URL hash without adding history entry
    try{
      var newUrl = window.location.pathname + window.location.search + (targetId === 'top' ? '' : '#'+targetId);
      history.replaceState(null, '', newUrl);
    }catch(e){/* ignore */}
  }

  var navLinks = document.querySelectorAll('a[href^="#"]');
  Array.prototype.forEach.call(navLinks, function(a){ a.addEventListener('click', handleClick); });
  console.debug && console.debug('[f-ren] attached hash handlers to anchors:', navLinks.length);

  // delegated fallback: catch clicks that might not have been bound
  document.addEventListener('click', function(ev){
    try {
      var t = ev.target;
      while (t && t !== document) {
        if (t.tagName === 'A' && t.getAttribute('href') && t.getAttribute('href').charAt(0) === '#') {
          console.debug && console.debug('[f-ren] delegated catch for anchor click', t.getAttribute('href'));
          // Allow existing handler to run first; then handle it
          ev.preventDefault();
          handleClick.call(t, ev);
          return;
        }
        t = t.parentNode;
      }
    } catch (err) { console.error && console.error('[f-ren] delegated handler error', err); }
  }, true);

  // On initial load, show header+mission by default unless hash indicates otherwise
  document.addEventListener('DOMContentLoaded', function(){
    var initial = (window.location.hash && window.location.hash.length>1) ? window.location.hash.slice(1) : 'top';
    setVisibility(initial);
    if (initial !== 'top'){
      var initialTarget = document.getElementById(initial);
      if (initialTarget) {
        initialTarget.scrollIntoView();
        if (!initialTarget.hasAttribute('tabindex')) initialTarget.setAttribute('tabindex','-1');
        initialTarget.focus({ preventScroll: true });
      }
    }
  });
  } catch (err) {
    console.error && console.error('[f-ren] error in main script', err);
    throw err;
  }
})();

/* Rhetor carousel: small, dependency-free slider */
(function(){
  try {
    console.debug && console.debug('[f-ren] init rhetor carousel');
    var carousel = document.querySelector('.rhetor-carousel');
    if (!carousel) { console.debug && console.debug('[f-ren] no carousel found'); return; }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.rhetor-slide'));
    if (!slides.length) { console.debug && console.debug('[f-ren] no slides found'); return; }
    console.debug && console.debug('[f-ren] carousel slides found:', slides.length);

  var current = 0;

  // Create controls
  var prevBtn = document.createElement('button'); prevBtn.className = 'rhetor-prev'; prevBtn.setAttribute('aria-label','Previous slide'); prevBtn.textContent = '‹';
  var nextBtn = document.createElement('button'); nextBtn.className = 'rhetor-next'; nextBtn.setAttribute('aria-label','Next slide'); nextBtn.textContent = '›';
  carousel.appendChild(prevBtn); carousel.appendChild(nextBtn);

  // Indicators
  var indicatorWrap = document.createElement('div'); indicatorWrap.className = 'rhetor-indicators';
  slides.forEach(function(_, i){
    var b = document.createElement('button'); b.className = 'rhetor-indicator'; b.setAttribute('aria-label','Show slide '+(i+1)); b.dataset.index = i; indicatorWrap.appendChild(b);
  });
  carousel.appendChild(indicatorWrap);

  // Ensure carousel has a stable height (take from first slide)
  try {
    var firstSlide = slides[0];
    var img = firstSlide.querySelector('img');
    function setHeightFromFirst(){
      try{
        var rect = firstSlide.getBoundingClientRect();
        if (rect && rect.height > 0) carousel.style.minHeight = Math.round(rect.height) + 'px';
      }catch(e){}
    }
    if (img && !img.complete) {
      img.addEventListener('load', setHeightFromFirst);
      // fallback in case load event doesn't fire quickly
      setTimeout(setHeightFromFirst, 250);
    } else {
      setHeightFromFirst();
    }
  } catch (e) {/* ignore */}

  // Create a temporary loader overlay while carousel images load
  var loader = document.createElement('div'); loader.className = 'rhetor-loader';
  loader.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
  carousel.appendChild(loader);
  // Hide loader when all images have loaded or after 1s fallback
  var imgs = carousel.querySelectorAll('img');
  var remaining = imgs.length;
  function hideLoader(){ if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }
  if (remaining === 0) hideLoader();
  Array.prototype.forEach.call(imgs, function(i){
    if (i.complete) { remaining--; }
    else { i.addEventListener('load', function(){ remaining--; if (remaining<=0) hideLoader(); }); }
  });
  setTimeout(hideLoader, 1000);

  function showSlide(n){
    n = (n + slides.length) % slides.length;
    slides.forEach(function(s, i){ s.classList.toggle('active', i===n); s.setAttribute('aria-hidden', (i===n)?'false':'true'); });
    var inds = indicatorWrap.querySelectorAll('.rhetor-indicator');
    Array.prototype.forEach.call(inds, function(b, i){ b.classList.toggle('active', i===n); });
    current = n;
    console.debug && console.debug('[f-ren] showSlide', n);
  }

  function next(){ showSlide(current+1); }
  function prev(){ showSlide(current-1); }

  // Start
  showSlide(0);

  // Events
  nextBtn.addEventListener('click', function(){ next(); });
  prevBtn.addEventListener('click', function(){ prev(); });
  indicatorWrap.addEventListener('click', function(e){
    var b = e.target; if (!b || !b.classList.contains('rhetor-indicator')) return; showSlide(Number(b.dataset.index));
  });

  // Keyboard support
  carousel.setAttribute('tabindex','0');
  carousel.addEventListener('keydown', function(e){ if (e.key === 'ArrowLeft') { prev(); } else if (e.key === 'ArrowRight') { next(); } });
  console.debug && console.debug('[f-ren] rhetor carousel initialized');
  } catch (err) {
    console.error && console.error('[f-ren] error initializing carousel', err);
  }
})();
