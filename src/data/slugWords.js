const WORD1 = [
  'golden', 'blazing', 'phantom', 'electric', 'fierce', 'swift', 'ultra',
  'neon', 'iron', 'thunder', 'crimson', 'cosmic', 'turbo', 'solar', 'titan',
  'rogue', 'stealth', 'chrome', 'shadow', 'rapid', 'flying', 'rocket',
  'atomic', 'savage', 'fearless', 'mighty', 'burning', 'flaming', 'cyber',
  'midnight', 'silver', 'rising', 'wild', 'bold', 'hyper', 'legendary',
  'futbol', 'soccer', 'pitch', 'derby', 'world', 'super', 'mega', 'pro',
];

const WORD2 = [
  'striker', 'keeper', 'wizard', 'maestro', 'titan', 'legend', 'eagle',
  'wolf', 'hawk', 'rocket', 'cannon', 'blade', 'flash', 'storm', 'fury',
  'vortex', 'phoenix', 'jaguar', 'falcon', 'cobra', 'panther', 'dragon',
  'warrior', 'champion', 'trophy', 'glory', 'goal', 'kick', 'header',
  'volley', 'dribbler', 'captain', 'forward', 'winger', 'ghost', 'bullet',
  'thunder', 'blitz', 'surge', 'lion', 'fox', 'cheetah', 'condor', 'god',
];

export function generateSlug() {
  const w1 = WORD1[Math.floor(Math.random() * WORD1.length)];
  const w2 = WORD2[Math.floor(Math.random() * WORD2.length)];
  return `${w1}-${w2}`;
}

export function generateSlugWithSuffix(existingSlugs) {
  let slug = generateSlug();
  let attempts = 0;
  while (existingSlugs.has(slug) && attempts < 20) {
    slug = generateSlug();
    attempts++;
  }
  if (existingSlugs.has(slug)) {
    slug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
  return slug;
}
