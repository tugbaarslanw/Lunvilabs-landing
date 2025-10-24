// ===== Mobile nav =====
(function () {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  if (!nav || !navToggle) return;
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

// ===== Modal (Request form) =====
(function () {
  const modal = document.getElementById('requestModal');
  const backdrop = document.getElementById('requestBackdrop');
  const closeBtn = document.getElementById('requestClose');
  const planInput = document.getElementById('planInput');
  const subjectInput = document.getElementById('subjectInput');

  function openModal(plan) {
    if (!modal || !backdrop) return;
    if (planInput) planInput.value = plan || 'Pro';
    if (subjectInput) subjectInput.value = `Lunvi Labs — Plan Upgrade Request (${planInput?.value || 'Pro'})`;
    modal.classList.add('open');
    backdrop.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    const first = modal.querySelector('input[name="company"]');
    setTimeout(() => first?.focus(), 40);
    document.documentElement.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal || !backdrop) return;
    modal.classList.remove('open');
    backdrop.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }

  document.querySelectorAll('.js-request').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.getAttribute('data-plan'));
    });
  });
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();

// ===== Footer year =====
(function () {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();

// ===== FAQ toggle =====
(function () {
  document.querySelectorAll('.faq-item .faq-q').forEach(q => {
    q.addEventListener('click', () => q.parentElement.classList.toggle('open'));
  });
})();

// ===== Success toast (?submitted=true) =====
(function () {
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('submitted') === 'true') {
      const t = document.getElementById('submit-toast');
      if (t) {
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 6000);
      }
      url.searchParams.delete('submitted');
      history.replaceState({}, '', url.pathname + url.hash);
    }
  } catch (_) {}
})();

// ===== CTA click measurement (GA4) =====
(function () {
  const send = (name, label) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, { event_category: 'cta', event_label: label });
    }
  };
  document.querySelectorAll('.js-request').forEach(a =>
    a.addEventListener('click', () => send('cta_click', 'request_' + (a.getAttribute('data-plan') || 'unknown')))
  );
  document.querySelectorAll('a.btn-primary, a.btn-ghost').forEach(a =>
    a.addEventListener('click', () => send('cta_click', (a.textContent || '').trim()))
  );
})();

// ===== Form UX: disable submit briefly =====
(function () {
  const forms = document.querySelectorAll('form[action*="web3forms"]');
  forms.forEach(f => {
    f.addEventListener('submit', () => {
      const btn = f.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
      setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = 'Submit request'; } }, 8000);
    });
  });
})();

// ===== Consent banner neutralizer =====
(function () {
  var KEY = 'cmv2';
  function safeGet(k){ try { var v = localStorage.getItem(k); if (v) return v; } catch(e){} 
    var m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]+)')); return m && m[1]; }
  function safeSet(k,val){ try { localStorage.setItem(k,val); } catch(e){} 
    document.cookie = k + '=' + val + '; Max-Age=31536000; Path=/; SameSite=Lax'; }
  function updateConsent(state){ var m = (state === 'granted') ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') { window.gtag('consent','update',{ ad_storage:m, analytics_storage:m }); } }
  function destroy(el){ if (el && el.parentNode) { try { el.parentNode.removeChild(el); } catch(_){} } }
  function wire(el){
    if (!el) return; var a = el.querySelector('#cm-accept'), d = el.querySelector('#cm-deny');
    function decide(s){ safeSet(KEY,s); updateConsent(s); destroy(el); }
    if (a) a.addEventListener('click', e => { e.preventDefault(); decide('granted'); });
    if (d) d.addEventListener('click', e => { e.preventDefault(); decide('denied'); });
    requestAnimationFrame(() => { try {
      el.style.position='fixed'; el.style.left='16px'; el.style.bottom='16px';
      el.style.zIndex='1200'; el.style.maxWidth='520px';
    } catch(_){} });
  }
  function findAny(root){ return (root.querySelector && (root.querySelector('#consent-bar') || root.querySelector('#consent-bnr'))) || null; }
  var stored = safeGet(KEY); var existing = findAny(document);
  if (stored){ updateConsent(stored); if (existing) destroy(existing); }
  else if (existing){ wire(existing); }
  var mo = new MutationObserver(function(m){
    for (var i=0;i<m.length;i++){ var nodes = m[i].addedNodes;
      for (var j=0;j<nodes.length;j++){ var n = nodes[j];
        var el = (n.id === 'consent-bar' || n.id === 'consent-bnr') ? n : findAny(n);
        if (el){ if (safeGet(KEY)) destroy(el); else wire(el); }
      }
    }
  });
  try { mo.observe(document.documentElement, { childList:true, subtree:true }); } catch(_){}
})();
