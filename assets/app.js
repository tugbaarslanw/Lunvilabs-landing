// ============================
// Mobile nav toggle
// ============================
(function () {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  if (!nav || !navToggle) return;

  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();


// ============================
// Modal (Request upgrade form)
// ============================
//
// Bu bölüm artık "event delegation" kullanıyor:
// Sayfada .js-request sınıfına sahip bir şeye tıklanırsa modal açılır.
// Böylece HTML içinde a / button / div ne olursa olsun çalışır.
//
(function () {
  const modal        = document.getElementById('requestModal');
  const backdrop     = document.getElementById('requestBackdrop');
  const closeBtn     = document.getElementById('requestClose');
  const planInput    = document.getElementById('planInput');
  const subjectInput = document.getElementById('subjectInput');

  function openModal(plan) {
    if (!modal || !backdrop) return;

    // Plan bilgisini inputlara yaz
    const planFinal = plan || 'Pro';
    if (planInput) planInput.value = planFinal;
    if (subjectInput) {
      subjectInput.value =
        `Lunvi Labs — Plan Upgrade Request (${planFinal})`;
    }

    // Modal aç
    modal.classList.add('open');
    backdrop.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    backdrop.setAttribute('aria-hidden','false');

    // İlk inputa fokus
    const first = modal.querySelector('input[name="company"]');
    setTimeout(()=>first && first.focus(),40);

    // Body scroll kilidi (arka plan kaymasın)
    document.documentElement.style.overflow='hidden';
  }

  function closeModal() {
    if (!modal || !backdrop) return;

    modal.classList.remove('open');
    backdrop.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    backdrop.setAttribute('aria-hidden','true');

    // Scroll kilidini geri aç
    document.documentElement.style.overflow='';
  }

  // 🔒 BURASI EN ÖNEMLİ KISIM:
  // .js-request'e tıklanınca modal aç.
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('.js-request');
    if (!trigger) return;

    // buton <a href="#"> ise sayfa yukarı zıplamasın
    e.preventDefault();

    const pickedPlan = trigger.getAttribute('data-plan') || 'Pro';
    openModal(pickedPlan);
  });

  // Modal kapatma
  closeBtn && closeBtn.addEventListener('click', closeModal);
  backdrop && backdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown',(e)=>{
    if(e.key === 'Escape') closeModal();
  });
})();


// ============================
// Footer yılı
// ============================
(function(){
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();


// ============================
// FAQ accordion toggle
// ============================
(function(){
  document.querySelectorAll('.faq-item .faq-q').forEach(q=>{
    q.addEventListener('click',()=>{
      q.parentElement.classList.toggle('open');
    });
  });
})();


// ============================
// Success toast + GA4 form_submit (?submitted=true)
// (redirect sonrası küçük teşekkür popup'ı)
// ============================
(function () {
  const url = new URL(location.href);

  if (url.searchParams.get('submitted') === 'true') {
    // GA4 işareti (form_submit)
    if (typeof window.gtag === 'function') {
      gtag('event', 'form_submit', {
        form_id: 'upgrade_request',
        method: 'web3forms',
        status: 'sent'
      });
    }

    // Toast göster
    const t = document.getElementById('submit-toast');
    if (t) {
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 6000);
    }

    // URL temizle (parametreyi kaldır)
    url.searchParams.delete('submitted');
    history.replaceState({}, '', url.pathname + url.hash);
  }
})();


// ============================
// CTA click measurement (GA4)
// ============================
(function(){
  const send = (name,label)=>{
    if (typeof window.gtag === 'function') {
      gtag('event', name, {
        event_category:'cta',
        event_label:label
      });
    }
  };

  // tüm .js-request butonları (Request upgrade vs)
  document.querySelectorAll('.js-request').forEach(a=>{
    a.addEventListener('click',()=>{
      send('cta_click','request_'+(a.getAttribute('data-plan')||'unknown'));
    });
  });

  // genel primary / ghost CTA'lar
  document.querySelectorAll('a.btn-primary, a.btn-ghost, button.btn-primary, button.btn-ghost')
    .forEach(a=>{
      a.addEventListener('click',()=>{
        const txt = (a.textContent || '').trim();
        send('cta_click', txt);
      });
    });
})();


// ============================
// Form UX: submit sonrası butonu kilitle
// ============================
(function(){
  const forms=document.querySelectorAll('form[action*="web3forms"]');
  forms.forEach(f=>{
    f.addEventListener('submit',()=>{
      const btn=f.querySelector('button[type="submit"], [type="submit"]');
      if(btn){
        btn.disabled=true;
        btn.textContent='Submitting...';
      }
      // 8 saniye sonra geri aç (fail durumu için fallback)
      setTimeout(()=>{
        if(btn){
          btn.disabled=false;
          btn.textContent='Submit request';
        }
      },8000);
    });
  });
})();


// ============================
// GA4 Lead Events / generate_lead
// (form gönderildiğinde plan bilgisini gönder)
// ============================
(function(){
  const send = (name, params) => {
    if (typeof window.gtag === 'function') {
      gtag('event', name, params || {});
    }
  };

  document.querySelectorAll('form[action*="web3forms"]').forEach(f => {
    f.addEventListener('submit', () => {
      const planVal =
        document.getElementById('planInput')?.value ||
        f.querySelector('[name="plan"]')?.value ||
        (f.id === 'requestForm' ? 'Pro' : 'Inline');

      const where = (f.id === 'requestForm') ? 'modal' : 'inline';

      // generate_lead
      send('generate_lead', {
        plan: planVal,
        location: where
      });
    }, {capture:true});
  });
})();


// ============================
// Consent banner helper
// (KVKK / GDPR consent mode v2 update)
// ============================
(function(){
  var KEY='cmv2';
  function safeGet(k){
    try{
      var v=localStorage.getItem(k);
      if(v) return v;
    }catch(e){}
    var m=document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]+)'));
    return m&&m[1];
  }
  function safeSet(k,val){
    try{ localStorage.setItem(k,val); }catch(e){}
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
      e.preventDefault();
      decide('granted');
    });
    if(d) d.addEventListener('click',e=>{
      e.preventDefault();
      decide('denied');
    });

    // konumu sabitle
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
    return (root.querySelector &&
      (root.querySelector('#consent-bar') ||
       root.querySelector('#consent-bnr'))) || null;
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


// ============================
// GA4 'form_submit' beacon ping (fail-safe)
// ============================
(function () {
  const MID = 'G-3VQHGCGTPN'; // GA4 Measurement ID
  const forms = Array.from(
    document.querySelectorAll('form[action*="web3forms"]')
  );

  function sendFormSubmit(evt) {
    const f = evt.currentTarget || evt.target;

    // Anlık olarak analytics_storage'ı "granted" yapıp event'i kaçırmamaya çalışıyoruz
    try {
      if (typeof gtag === 'function') {
        gtag('consent', 'update', {
          analytics_storage: 'granted',
          wait_for_update: 500
        });
      }
    } catch(_) {}

    try {
      if (typeof gtag === 'function') {
        gtag('event', 'form_submit', {
          send_to: MID,
          form_id: f.id || 'web3forms',
          method: 'web3forms',
          plan: document.getElementById('planInput')?.value || 'Unknown',
          location: location.pathname + location.hash,
          transport_type: 'beacon',
          event_timeout: 1500,
          debug_mode: true,
          event_callback: function () {}
        });
      }
    } catch(_) {}
  }

  forms.forEach((f) => {
    // submit anında
    f.addEventListener('submit', sendFormSubmit, { capture: true });

    // buton tıklandığında (bazı browser edge caseleri için)
    const btn = f.querySelector('button[type="submit"], [type="submit"]');
    if (btn) {
      btn.addEventListener('click', sendFormSubmit, { capture: true });
    }
  });
})();
