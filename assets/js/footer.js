// assets/js/footer.js
(function () {
  'use strict';

  const SEL = {
    year: '#year, #currentYear',
    phone: '#footer-phone',
    email: '#footer-email',
    address: '#footer-address',
    map: '#footer-map',
    newsletterForm: '#newsletterForm',
    newsletterEmail: '#newsletterEmail',
    quickLinks: '#footer-quick-links',
    socialsWrap: '#footer-socials'
  };

  const PATH = {
    contact: () => __getDataUrl('contact.json'),
    home: () => __getDataUrl('home.json')
  };

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  async function getJSON(url) {
    try {
      const u = new URL(url, document.baseURI);
      u.searchParams.set('v', Date.now().toString());
      const res = await fetch(u.toString(), { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function setYear() {
    qsa(SEL.year).forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  async function hydrateContact() {
    const c = await getJSON(PATH.contact());
    if (!c) return;

    const phone = (c.phone || '').trim();
    const email = (c.email || '').trim();
    const address = (c.address || '').trim();
    const map = (c.map_link || '').trim();
    const tel = phone ? `tel:${phone.replace(/\s+/g,'').replace(/^(\+)?/, '+')}` : null;

    const phoneEl = qs(SEL.phone);
    if (phoneEl && phone) { phoneEl.textContent = phone; if (tel) phoneEl.href = tel; }

    const emailEl = qs(SEL.email);
    if (emailEl && email) { emailEl.textContent = email; emailEl.href = `mailto:${email}`; }

    const addrEl = qs(SEL.address);
    if (addrEl && address) { addrEl.textContent = address; }

    const mapEl = qs(SEL.map);
    if (mapEl && map) { mapEl.href = map; }
  }

  async function hydrateQuickLinksAndSocials() {
    const home = await getJSON(PATH.home());
    if (!home) return;

    const linksWrap = qs(SEL.quickLinks);
    if (linksWrap && Array.isArray(home.quick_links)) {
      linksWrap.innerHTML = home.quick_links.map(l => `<a href="${__toAbs(l.href)}">${l.label}</a>`).join('');
    }

    const socials = home.socials || home.social_links || null;
    const socialsWrap = qs(SEL.socialsWrap);
    if (socialsWrap && socials) {
      const items = [];
      if (socials.instagram) items.push(`<a href="${socials.instagram}" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a>`);
      if (socials.youtube) items.push(`<a href="${socials.youtube}" target="_blank" rel="noopener" aria-label="YouTube">YouTube</a>`);
      if (socials.facebook) items.push(`<a href="${socials.facebook}" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a>`);
      socialsWrap.innerHTML = items.join(' ');
    }
  }

  function bindNewsletter() {
    const form = qs(SEL.newsletterForm);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (qs(SEL.newsletterEmail, form)?.value || '').trim();
      if (!email || !/.+@.+\..+/.test(email)) {
        showToast('Enter a valid email', 'error');
        return;
      }
      const endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        showToast('Subscribed locally (no endpoint set)', 'success');
        form.reset();
        return;
      }
      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        showToast('Subscribed successfully', 'success');
        form.reset();
      } catch (err) {
        showToast('Subscription failed', 'error');
      }
    });
  }

  async function init() {
    setYear();
    await hydrateContact();
    await hydrateQuickLinksAndSocials();
    // Prefix links within footer if loaded as partial
    const footerRoot = document.getElementById('footer-placeholder') || document;
    prefixInternalLinks(footerRoot);
  }

  window.Footer = { init };
})();
