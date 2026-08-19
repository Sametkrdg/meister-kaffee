/**
 * icons.js — minimal inline SVG ikon seti (tek renk, stroke tabanlı).
 *
 * Harici ikon kütüphanesi yoktur; SVG'ler doğrudan HTML'e gömülür, ekstra
 * istek doğurmaz. Path verileri onaylı tasarımdan alınmıştır.
 */

const PATHS = {
  roaster: '<path d="M4 20h16M6 20V10a6 6 0 0112 0v10"/>',
  clock: '<path d="M12 3v6l4 4M4 12a8 8 0 1116 0 8 8 0 01-16 0z"/>',
  check: '<path d="M9 12l2 2 4-4M4 6h16v12H4z"/>',
  leaf: '<path d="M12 2C8 6 4 10 4 14a8 8 0 0016 0c0-4-4-8-8-12z"/>',
  mail: '<path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/>',
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2C9.5 21 3 14.5 3 6a2 2 0 012-2z"/>',
  pin: '<path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
};

/**
 * @param {string} name PATHS içindeki ikon adı
 * @param {{ size?: number, stroke?: number, className?: string }} [opts]
 * @returns {string} inline SVG (dekoratif — aria-hidden)
 */
export function icon(name, opts = {}) {
  const path = PATHS[name];
  if (!path) return '';

  const size = opts.size ?? 24;
  const stroke = opts.stroke ?? 1.5;
  const cls = opts.className ? ` class="${opts.className}"` : '';

  return (
    `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" ` +
    `stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`
  );
}

export const ICON_NAMES = Object.keys(PATHS);
