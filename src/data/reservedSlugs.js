// Slugs that conflict with app routes or reserved paths.
// Imported by both the frontend (ShareModal) and the save-bracket function.
//
// NOTE: homepage example slugs (blazing-striker, golden-wizard, etc.) are
// intentionally NOT listed here — they can be claimed by anyone, and existing
// ones are protected naturally by the 409 immutability check in save-bracket.js.
export const RESERVED_SLUGS = new Set([
  'new', 'about', 'faq', 'help', 'contact', 'admin', 'login',
  'signup', 'settings', 'profile', 'api', 'assets', 'static',
  'robots', 'sitemap', 'og', 'favicon',
]);
