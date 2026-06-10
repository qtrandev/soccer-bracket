// Slugs that conflict with app routes or reserved paths.
// Imported by both the frontend (ShareModal) and the save-bracket function.
export const RESERVED_SLUGS = new Set([
  'new', 'about', 'faq', 'help', 'contact', 'admin', 'login',
  'signup', 'settings', 'profile', 'api', 'assets', 'static',
]);
