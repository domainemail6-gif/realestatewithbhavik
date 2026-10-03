/* Real Estate with Bhavik: shared behaviour. No cookies, no storage, no network calls. */
(function () {
  document.documentElement.classList.add('js');

  /* Sticky header background once the page scrolls */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu: close on Escape or an outside tap */
  var menu = document.querySelector('.menu');
  if (menu) {
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu.removeAttribute('open'); });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) menu.removeAttribute('open'); });
  }

  /* Scroll reveal (skipped if reduced motion is preferred) */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* Enquiry forms.
     A form is a set of <fieldset data-step> blocks. On submit the answers are
     written into a WhatsApp message and WhatsApp is opened with it ready to
     send. Nothing is stored or transmitted by this site. */
  function fieldValue(field) {
    var checks = field.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    if (checks.length) {
      var out = [];
      for (var i = 0; i < checks.length; i++) out.push(checks[i].value);
      return out.join(', ');
    }
    var el = field.querySelector('input[type="text"], input[type="tel"], select, textarea');
    return el ? el.value.trim() : '';
  }

  function validPhone(v) {
    var d = v.replace(/\D/g, '');
    return d.length >= 10 && d.length <= 13;
  }

  function checkField(field) {
    var v = fieldValue(field);
    var ok = true;
    if (field.hasAttribute('data-required') && !v) ok = false;
    if (ok && field.hasAttribute('data-phone') && v && !validPhone(v)) ok = false;
    field.classList.toggle('invalid', !ok);
    return ok;
  }

  var forms = document.querySelectorAll('form.wizard');
  Array.prototype.forEach.call(forms, function (form) {
    var steps = form.querySelectorAll('fieldset[data-step]');
    var total = steps.length;
    var label = form.querySelector('.wizard-step-label');
    var bar = form.querySelector('.wizard-bar i');
    var back = form.querySelector('[data-back]');
    var next = form.querySelector('[data-next]');
    var done = document.getElementById(form.getAttribute('data-done'));
    var cur = 0;

    function show(n) {
      cur = n;
      Array.prototype.forEach.call(steps, function (s, idx) { s.classList.toggle('on', idx === n); });
      if (label) label.textContent = 'Step ' + (n + 1) + ' of ' + total;
      if (bar) bar.style.width = ((n + 1) / total * 100) + '%';
      if (back) back.hidden = n === 0;
      if (next) next.textContent = (n === total - 1) ? 'Send on WhatsApp' : 'Continue';
      var top = form.getBoundingClientRect().top + window.scrollY - 90;
      if (n > 0 || window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function stepOk(n) {
      var ok = true;
      Array.prototype.forEach.call(steps[n].querySelectorAll('.field'), function (f) { if (!checkField(f)) ok = false; });
      if (!ok) {
        var bad = steps[n].querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if (bad) bad.focus();
      }
      return ok;
    }

    function message() {
      var lines = [form.getAttribute('data-intro') || 'Hi Bhavik, I have an enquiry.', ''];
      Array.prototype.forEach.call(form.querySelectorAll('.field[data-label]'), function (f) {
        var v = fieldValue(f);
        if (v) lines.push(f.getAttribute('data-label') + ': ' + v);
      });
      return lines.join('\n');
    }

    function finish() {
      var url = 'https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(message());
      var link = document.getElementById(form.getAttribute('data-link'));
      if (link) link.href = url;
      form.hidden = true;
      if (done) { done.hidden = false; done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      window.open(url, '_blank', 'noopener');
    }

    if (next) next.addEventListener('click', function () {
      if (!stepOk(cur)) return;
      if (cur < total - 1) show(cur + 1); else finish();
    });
    if (back) back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    form.addEventListener('submit', function (e) { e.preventDefault(); if (stepOk(cur)) { if (cur < total - 1) show(cur + 1); else finish(); } });
    Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) {
      f.addEventListener('input', function () { if (f.classList.contains('invalid')) checkField(f); });
      f.addEventListener('change', function () { if (f.classList.contains('invalid')) checkField(f); });
    });

    show(0);
  });
})();
