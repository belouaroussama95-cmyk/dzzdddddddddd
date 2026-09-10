export interface OrdonnanceColorTheme {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bodyTextColor: string;
  badgeBg: string;
}

export const DEFAULT_ACCENT_COLOR = '#0c325c';
export const DEFAULT_BODY_COLOR = '#0f172a';

export const STORAGE_KEY_ACCENT = 'ordocare_rx_accent_color';
export const STORAGE_KEY_BODY = 'ordocare_rx_body_color';

export const ORDONNANCE_COLOR_THEMES: OrdonnanceColorTheme[] = [
  {
    id: 'medical-blue',
    name: 'Bleu Médical Officiel',
    description: 'Encre bleu marine officielle & texte ardoise sombre',
    accentColor: '#0c325c',
    bodyTextColor: '#0f172a',
    badgeBg: '#0c325c',
  },
  {
    id: 'monochrome-black',
    name: 'Noir Encre 100%',
    description: 'Noir pur haute lisibilité (idéal pour imprimantes N&B et photocopies)',
    accentColor: '#000000',
    bodyTextColor: '#000000',
    badgeBg: '#000000',
  },
  {
    id: 'deep-night',
    name: 'Bleu Nuit Profond',
    description: 'Bleu nuit royal soutenu et texte nuit contrasté',
    accentColor: '#1e3a8a',
    bodyTextColor: '#172554',
    badgeBg: '#1e3a8a',
  },
  {
    id: 'emerald-green',
    name: 'Vert Médical / Apothicaire',
    description: 'Vert émeraude pharmaceutique et texte forêt foncé',
    accentColor: '#065f46',
    bodyTextColor: '#064e3b',
    badgeBg: '#065f46',
  },
  {
    id: 'burgundy-wine',
    name: 'Bordeaux Clinique',
    description: 'Bordeaux profond distinctif et texte foncé',
    accentColor: '#7f1d1d',
    bodyTextColor: '#1c1917',
    badgeBg: '#7f1d1d',
  },
  {
    id: 'graphite-slate',
    name: 'Gris Anthracite & Graphite',
    description: 'Gris ardoise moderne et sobre',
    accentColor: '#334155',
    bodyTextColor: '#1e293b',
    badgeBg: '#334155',
  },
  {
    id: 'specialist-purple',
    name: 'Violet Spécialisé',
    description: 'Nuance prune / violet médical sobre et distinguée',
    accentColor: '#581c87',
    bodyTextColor: '#1e1b4b',
    badgeBg: '#581c87',
  },
  {
    id: 'sapphire-teal',
    name: 'Bleu Océan & Canard',
    description: 'Teinte canard / bleu sarcelle profond',
    accentColor: '#0f766e',
    bodyTextColor: '#134e4a',
    badgeBg: '#0f766e',
  },
];

export const POPULAR_ACCENT_SWATCHES = [
  { label: 'Bleu Médical', color: '#0c325c' },
  { label: 'Noir Pur', color: '#000000' },
  { label: 'Bleu Nuit', color: '#1e3a8a' },
  { label: 'Vert Médical', color: '#065f46' },
  { label: 'Bordeaux', color: '#7f1d1d' },
  { label: 'Gris Anthracite', color: '#334155' },
  { label: 'Violet Sombre', color: '#581c87' },
  { label: 'Bleu Canard', color: '#0f766e' },
];

export const POPULAR_BODY_SWATCHES = [
  { label: 'Ardoise Sombre', color: '#0f172a' },
  { label: 'Noir Pur 100%', color: '#000000' },
  { label: 'Gris Nuit', color: '#1e293b' },
  { label: 'Bleu Encre', color: '#172554' },
  { label: 'Vert Forêt', color: '#064e3b' },
  { label: 'Brun Profond', color: '#1c1917' },
];
