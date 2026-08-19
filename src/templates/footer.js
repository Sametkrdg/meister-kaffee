export function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="footer">
    <p class="footer__copy">© ${year} Meister Kaffee-Rösterei. Tüm hakları saklıdır.</p>
    <p class="footer__tag">EST. ARTISAN ROASTING</p>
  </footer>`;
}
