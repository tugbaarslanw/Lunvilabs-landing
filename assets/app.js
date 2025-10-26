// Smooth scroll for in-page anchors (#pricing, #solutions, etc.)
(function () {
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute('href');
    // ignore plain "#" or external links
    if (!href || href === '#' || href.startsWith('#') === false) return;

    const targetEl = document.querySelector(href);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();

// Mobile nav (hamburger menu)
(function () {
  const navToggle = document.getElementById('navToggle');
  const menu = document.getElementById('menu');
  if (!navToggle || !menu) return;

  navToggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open'); // <-- styles.css ile uyumlu
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

// Modal (Request upgrade form)
(function () {
  const modal        = document.getElementById('requestModal');
  const backdrop     = document.getElementById('requestBackdrop');
  const closeBtn     = document.getElementById('requestClose');
  const planInput    = document.getElementById('planInput');
  const subjectInput = document.getElementById('subjectInput');

  function openModal(plan){
    if (!modal || !backdrop) return;

    // plan değerini doldur
    if (planInput) planInput.value = plan || 'Pro';
    if (subjectInput) {
      subjectInput.value = `Lunvi Labs — Plan Upgrade Request (${planInput?.value || 'Pro'})`;
    }

    // modal + backdrop görünür olsun
    modal.classList.add('is-open');
    backdrop.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    backdrop.setAttribute('aria-hidden','false');

    // body scroll kilitle
    document.body.classList.add('no-scroll');

    // ilk inputa odakla
    const first = modal.querySelector('input[name="company"]');
    setTimeout(()=>first?.focus(),40);
  }

  function closeModal(){
    modal?.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden','true');
    backdrop?.setAttribute('aria-hidden','true');

    // scroll kilidini kaldır
    document.body.classList.remove('no-scroll');
  }

  // "Request upgrade" butonları modalı açsın
  document.querySelectorAll('.js-request').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      openModal(btn.getAttribute('data-plan'));
    });
  });

  // kapatma butonu / backdrop / ESC
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  window.addEventListener('keydown',(e)=>{
    if(e.key==='Escape') closeModal();
  });
})();

// Footer year
document.getElementById('y').textContent = new Date().getFullYear();

// FAQ toggle
document.querySelectorAll('.faq-item .faq-q').forEach(q=>{
  q.addEventListener('click',()=>q.parentElement.classList.toggle('open'));
});

// Success toast + GA4 form_submit (`?submitted=true`)
(function () {
  const url = new URL(location.href);
  if (url.searchParams.get('submitted') === 'true') {

    // GA4: form gönderimini işaretle (landing sonrası sayfa yüklenince)
    if (typeof window.gtag === 'function') {
      gtag('event', 'form_submit', {
        form_id: 'upgrade_request',
        method: 'web3forms',
        status: 'sent'
      });
    }

    // toast göster
    const t = document.getElementById('submit-toast');
    if (t) {
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 6000);
    }

    // URL'i temizle (gözükmesin)
    url.searchParams.delete('submitted');
    history.replaceState({}, '', url.pathname + url.hash);
  }
})();

// CTA click measurement
(function(){
  const send=(name,label)=>window.gtag&&gtag('event',name,{
    event_category:'cta',
    event_label:label
  });

  // pricing kartlarındaki butonlar, header CTA'lar, vs
  document.querySelectorAll('.js-request').forEach(a=>{
    a.addEventListener('click',()=>{
      send('cta_click','request_'+(a.getAttribute('data-plan')||'unknown'));
    });
  });

  document.querySelectorAll('a.btn-primary, a.btn-ghost').forEach(a=>{
    a.addEventListener('click',()=>{
      send('cta_click',a.textContent.trim());
    });
  });
})();

// Form UX: disable submit button briefly (çift tıklamayı engelle)
(function(){
  const forms=document.querySelectorAll('form[action*="web3forms"]');
  forms.forEach(f=>{
    f.addEventListener('submit',()=>{
      const btn=f.querySelector('button[type="submit"]');
      if(btn){
        btn.disabled=true;
        btn.textContent='Submitting...';
      }
      setTimeout(()=>{
        if(btn){
          btn.disabled=false;
          btn.textContent='Submit request';
        }
      },8000);
    });
  });
})();

// GA4: lead conversion (form submit anında generate_lead olayı)
(function(){
  const send = (name, params) => window.gtag && gtag('event', name, params || {});
  document.querySelectorAll('form[action*="web3forms"]').forEach(f => {
    f.addEventListener('submit', () => {
      const plan =
        document.getElementById('planInput')?.value ||
        f.querySelector('[name="plan"]')?.value ||
        (f.id === 'requestForm' ? 'Pro' : 'Inline');

      const where = (f.id === 'requestForm') ? 'modal' : 'inline';

      send('generate_lead', {
        plan,
        location: where
      });
    });
  });
})();

// Consent banner helper (consent mode v2)
(function(){
  var KEY='cmv2';

  function safeGet(k){
    try{
      var v=localStorage.getItem(k);
      if(v)return v;
    }catch(e){}
    var m=document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]+)'));
    return m&&m[1];
  }

  function safeSet(k,val){
    try{localStorage.setItem(k,val);}catch(e){}
    document.cookie=k+'='+val+'; Max-Age=31536000; Path=/; SameSite=Lax';
  }

  function updateConsent(state){
    var m=(state==='granted')?'granted':'denied';
    if(typeof window.gtag==='function'){
      gtag('consent','update',{
        ad_storage:m,
        analytics_storage:m
      });
    }
  }

  function destroy(el){
    if(el&&el.parentNode){
      try{el.parentNode.removeChild(el);}catch(_){}
    }
  }

  function wire(el){
    if(!el) return;
    var a=el.querySelector('#cm-accept'),
        d=el.querySelector('#cm-deny');
    function decide(s){
      safeSet(KEY,s);
      updateConsent(s);
      destroy(el);
    }
    if(a) a.addEventListener('click',e=>{
      e.preventDefault();decide('granted');
    });
    if(d) d.addEventListener('click',e=>{
      e.preventDefault();decide('denied');
    });

    // minimal inline styling fallback
    requestAnimationFrame(()=>{
      try{
        el.style.position='fixed';
        el.style.left='16px';
        el.style.bottom='16px';
        el.style.zIndex='1200';
        el.style.maxWidth='520px';
      }catch(_){}
    });
  }

  function findAny(root){
    return (root.querySelector && (root.querySelector('#consent-bar') || root.querySelector('#consent-bnr'))) || null;
  }

  var stored=safeGet(KEY);
  var existing=findAny(document);

  if(stored){
    updateConsent(stored);
    if(existing) destroy(existing);
  } else if(existing){
    wire(existing);
  }

  var mo=new MutationObserver(function(m){
    for(var i=0;i<m.length;i++){
      var nodes=m[i].addedNodes;
      for(var j=0;j<nodes.length;j++){
        var n=nodes[j];
        var el=(n.id==='consent-bar'||n.id==='consent-bnr')?n:findAny(n);
        if(el){
          if(safeGet(KEY)) destroy(el);
          else wire(el);
        }
      }
    }
  });

  try{
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }catch(_){}
})();

// GA4: Upgrade form gönderimini 'generate_lead' olarak ayrıca işaretle
(function () {
  const forms = document.querySelectorAll('form[action*="web3forms"]');
  forms.forEach(f => {
    f.addEventListener('submit', () => {
      try {
        const plan =
          document.getElementById('planInput')?.value ||
          f.querySelector('input[name="plan"]')?.value ||
          'Unknown';
        if (window.gtag) {
          gtag('event', 'generate_lead', {
            event_category: 'form',
            event_label: 'upgrade_request',
            plan: plan
          });
        }
      } catch (_) {}
    });
  });
})();

// GA4: form_submit (modal + inline) güvenli gönderim, redirect öncesi
(function () {
  const MID = 'G-3VQHGCGTPN'; // GA4 config ID
  const forms = Array.from(document.querySelectorAll('form[action*="web3forms"]'));

  function sendFormSubmit(evt) {
    const f = evt.currentTarget || evt.target;
    const plan = document.getElementById('planInput')?.value || undefined;

    // Bu event kaçmadan önce consent'i geçici olarak açmaya çalış
    try {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
        wait_for_update: 500
      });
    } catch (_) {}

    // form_submit event'i gönder
    try {
      gtag('event', 'form_submit', {
        send_to: MID,
        form_id: f.id || 'web3forms',
        method: 'web3forms',
        plan: plan,
        location: location.pathname + location.hash,
        transport_type: 'beacon',
        event_timeout: 1500,
        debug_mode: true,
        event_callback: function () {}
      });
    } catch (_) {}
  }

  forms.forEach((f) => {
    // Form submit anında
    f.addEventListener('submit', sendFormSubmit, { capture: true });

    // Her ihtimale karşı direkt buton tıklamasına da bağla
    const btn = f.querySelector('button[type="submit"], [type="submit"]');
    if (btn) {
      btn.addEventListener('click', sendFormSubmit, { capture: true });
    }
  });
})();
