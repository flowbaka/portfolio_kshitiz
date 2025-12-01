/* script.js — handles:
   - animated skill bars (IntersectionObserver)
   - contact form validation + localStorage + redirect
   - project card clicks (no <a>)
   - canvas drawing
   - image slider
   - dark/light theme toggle (persisted)
   - back-to-top button
   - mobile nav toggle
*/
document.addEventListener('DOMContentLoaded', () => {
  // year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ====== Mobile nav toggle ====== */
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('primary-nav');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('nav-open');
    });
    navList.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navList.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ====== Animated skill bars ====== */
  const fills = Array.from(document.querySelectorAll('.fill'));
  fills.forEach(f => {
    f.style.width = '0%';
    f.setAttribute('aria-valuenow', '0');
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const percent = parseInt(el.getAttribute('data-percent') || '0', 10);
          el.style.width = percent + '%';
          el.setAttribute('aria-valuenow', percent);
          if (percent >= 18) el.textContent = percent + '%';
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    fills.forEach(f => io.observe(f));
  } else {
    fills.forEach(f => {
      const p = parseInt(f.getAttribute('data-percent') || '0', 10);
      f.style.width = p + '%';
      f.setAttribute('aria-valuenow', p);
      if (p >= 18) f.textContent = p + '%';
    });
  }

  /* ====== Contact form: validate, store to localStorage, redirect ====== */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      // basic validation
      if (!name) { status.textContent = 'Please enter your name.'; form.name.focus(); return; }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) { status.textContent = 'Please enter a valid email.'; form.email.focus(); return; }
      if (!message) { status.textContent = 'Please enter a message.'; form.message.focus(); return; }

      const payload = { name, email, message, timestamp: Date.now() };
      try {
        localStorage.setItem('contact_form', JSON.stringify(payload));
        status.textContent = 'Saved. Redirecting to details page…';
        // small delay so user sees the message
        setTimeout(() => { window.location.href = 'form-details.html'; }, 500);
      } catch (err) {
        console.error(err);
        status.textContent = 'Unable to save form data locally.';
      }
    });
  }

  /* ====== Make project cards clickable (no <a>) ====== */
  document.querySelectorAll('.project[role="button"][data-url]').forEach(card => {
    card.addEventListener('click', () => {
      const url = card.dataset.url;
      if (url) window.location.href = url;
    });
    // keyboard accessibility
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        card.click();
      }
    });
  });

  /* ====== Canvas drawing (simple) ====== */
  const canvas = document.getElementById('demo-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    // responsive scaling for high-DPI
    function resizeCanvasToDisplaySize(canvas) {
      const ratio = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
        canvas.width = Math.round(w * ratio);
        canvas.height = Math.round(h * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
    }
    function draw() {
      resizeCanvasToDisplaySize(canvas);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // simple gradient background
      const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      grad.addColorStop(0, '#e9f5ff');
      grad.addColorStop(1, '#fff');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // draw some circles
      ctx.fillStyle = 'rgba(122,44,255,0.18)';
      for (let i=0;i<6;i++){
        ctx.beginPath();
        const x = 40 + i*60;
        const y = 50 + Math.sin(i + Date.now()/1500)*12;
        ctx.arc(x, y, 18, 0, Math.PI*2);
        ctx.fill();
      }
      // sample text
      ctx.fillStyle = '#333';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Canvas demo', 20, canvas.height - 20);
    }
    draw();
    window.addEventListener('resize', draw);
  }

  /* ====== Image slider ====== */
  const slidesEl = document.querySelector('.slides');
  const slideImgs = slidesEl ? slidesEl.querySelectorAll('img') : [];
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');
  let current = 0;
  function showSlide(index) {
    if (!slidesEl) return;
    current = (index + slideImgs.length) % slideImgs.length;
    slidesEl.style.transform = `translateX(-${current * 100}%)`;
  }
  if (prevBtn) prevBtn.addEventListener('click', () => showSlide(current-1));
  if (nextBtn) nextBtn.addEventListener('click', () => showSlide(current+1));
  // auto-play
  let sliderInterval = setInterval(() => showSlide(current+1), 5000);
  // pause on hover
  const slider = document.querySelector('.slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => clearInterval(sliderInterval));
    slider.addEventListener('mouseleave', () => sliderInterval = setInterval(() => showSlide(current+1), 5000));
  }
  showSlide(0);

  /* ====== Dark / Light Mode ====== */
  const themeToggle = document.getElementById('theme-toggle');
  function setTheme(dark) {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(dark));
      themeToggle.textContent = dark ? '☀️' : '🌙';
    }
    localStorage.setItem('site_theme_dark', dark ? '1' : '0');
  }
  // load preference
  const stored = localStorage.getItem('site_theme_dark');
  if (stored !== null) setTheme(stored === '1');
  else setTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(!isDark);
    });
  }

  /* ====== Back to top ====== */
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (!backToTop) return;
    if (window.scrollY > 400) backToTop.style.display = 'block';
    else backToTop.style.display = 'none';
  });
  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ====== small keyboard accessibility helpers ====== */
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      // close mobile nav
      if (navList && navList.classList.contains('nav-open')) {
        navList.classList.remove('nav-open');
        if (navToggle) navToggle.setAttribute('aria-expanded','false');
      }
    }
  });

});
