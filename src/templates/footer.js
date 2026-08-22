export function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="footer">
    <p class="footer__copy">© ${year} MEISTER KAFFEE-RÖSTEREİ — TÜM HAKLARI SAKLIDIR</p>
    <p class="footer__links">
      <a href="/kvkk-aydinlatma-metni">KVKK AYDINLATMA METNİ</a>
      <a href="/cerez-politikasi">ÇEREZ POLİTİKASI</a>
    </p>
    <p class="footer__status">
      <span class="dot dot--online" aria-hidden="true"></span>SYSTEM ONLINE — EST. ARTISAN ROASTING
    </p>
  </footer>`;
}
