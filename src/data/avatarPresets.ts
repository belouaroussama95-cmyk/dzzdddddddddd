// Predefined medical avatars with crisp, embedded SVG data URIs
export interface AvatarPreset {
  id: string;
  name: string;
  role: string;
  svgDataUri: string;
}

const createSvgUri = (svgString: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'doc-male-teal',
    name: 'Dr. Clinique (Bleu Médical)',
    role: 'Médecin Praticien',
    svgDataUri: createSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#0d9488" />
        <!-- Head -->
        <circle cx="50" cy="38" r="16" fill="#fde047" />
        <path d="M36 34 Q50 20 64 34 Q50 26 36 34" fill="#1e293b" />
        <!-- Face features -->
        <circle cx="45" cy="38" r="1.8" fill="#1e293b" />
        <circle cx="55" cy="38" r="1.8" fill="#1e293b" />
        <path d="M47 44 Q50 47 53 44" stroke="#b45309" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <!-- Coat / Body -->
        <path d="M22 84 C24 62 36 56 50 56 C64 56 76 62 78 84 Z" fill="#ffffff" />
        <path d="M42 56 L50 72 L58 56 Z" fill="#0d9488" />
        <path d="M48 64 L50 72 L52 64 Z" fill="#f8fafc" />
        <!-- Stethoscope -->
        <path d="M38 56 C38 68 44 74 48 76 C52 74 58 68 58 56" stroke="#334155" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <circle cx="48" cy="77" r="3" fill="#64748b" />
      </svg>
    `)
  },
  {
    id: 'doc-female-teal',
    name: 'Dre. Praticienne (Émeraude)',
    role: 'Médecin Généraliste',
    svgDataUri: createSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#059669" />
        <!-- Hair back -->
        <path d="M32 36 C30 52 34 60 38 64 M68 36 C70 52 66 60 62 64" stroke="#451a03" stroke-width="6" stroke-linecap="round" fill="none" />
        <!-- Head -->
        <circle cx="50" cy="38" r="15" fill="#fed7aa" />
        <path d="M34 35 C36 22 64 22 66 35 C60 28 40 28 34 35" fill="#451a03" />
        <!-- Eyes & Smile -->
        <circle cx="45" cy="38" r="1.8" fill="#1e293b" />
        <circle cx="55" cy="38" r="1.8" fill="#1e293b" />
        <path d="M46 44 Q50 48 54 44" stroke="#c2410c" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <!-- White Coat -->
        <path d="M22 84 C24 62 36 56 50 56 C64 56 76 62 78 84 Z" fill="#ffffff" />
        <path d="M43 56 L50 70 L57 56 Z" fill="#059669" />
        <!-- Stethoscope -->
        <path d="M38 56 C38 68 44 74 48 76 C52 74 58 68 58 56" stroke="#0f172a" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <circle cx="48" cy="77" r="3" fill="#cbd5e1" />
      </svg>
    `)
  },
  {
    id: 'doc-surgeon',
    name: 'Chirurgien (Tenue de Bloc)',
    role: 'Chirurgien / Urgentiste',
    svgDataUri: createSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#0284c7" />
        <!-- Head -->
        <circle cx="50" cy="38" r="16" fill="#fed7aa" />
        <!-- Surgical Cap -->
        <path d="M32 36 C32 20 68 20 68 36 Z" fill="#0369a1" />
        <!-- Mask -->
        <path d="M36 41 C36 49 64 49 64 41 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1" />
        <path d="M36 43 L32 40 M64 43 L68 40" stroke="#94a3b8" stroke-width="1.5" />
        <!-- Eyes -->
        <circle cx="44" cy="35" r="1.8" fill="#0f172a" />
        <circle cx="56" cy="35" r="1.8" fill="#0f172a" />
        <!-- Scrubs -->
        <path d="M22 84 C24 62 36 56 50 56 C64 56 76 62 78 84 Z" fill="#0369a1" />
        <path d="M43 56 L50 67 L57 56 Z" fill="#fed7aa" />
      </svg>
    `)
  },
  {
    id: 'doc-senior',
    name: 'Professeur / Praticien Consultant',
    role: 'Chef de Service / Spécialiste',
    svgDataUri: createSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#0f172a" />
        <!-- Head -->
        <circle cx="50" cy="38" r="16" fill="#fde047" />
        <path d="M34 32 C38 22 62 22 66 32" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" fill="none" />
        <!-- Glasses -->
        <circle cx="44" cy="37" r="4" fill="none" stroke="#334155" stroke-width="1.8" />
        <circle cx="56" cy="37" r="4" fill="none" stroke="#334155" stroke-width="1.8" />
        <line x1="48" y1="37" x2="52" y2="37" stroke="#334155" stroke-width="1.8" />
        <circle cx="44" cy="37" r="1.5" fill="#0f172a" />
        <circle cx="56" cy="37" r="1.5" fill="#0f172a" />
        <!-- Smile -->
        <path d="M46 45 Q50 48 54 45" stroke="#b45309" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <!-- Coat & Tie -->
        <path d="M22 84 C24 62 36 56 50 56 C64 56 76 62 78 84 Z" fill="#f8fafc" />
        <path d="M44 56 L50 70 L56 56 Z" fill="#0284c7" />
        <path d="M48 60 L50 76 L52 60 Z" fill="#e11d48" />
      </svg>
    `)
  },
  {
    id: 'doc-minimal-caduceus',
    name: 'Emblème Médical Caducée',
    role: 'Symbole Ordre des Médecins',
    svgDataUri: createSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#115e59" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="4 3" />
        <!-- Staff of Asclepius -->
        <line x1="50" y1="20" x2="50" y2="80" stroke="#f0fdfa" stroke-width="4" stroke-linecap="round" />
        <circle cx="50" cy="18" r="3.5" fill="#f0fdfa" />
        <!-- Snake winding -->
        <path d="M45 72 Q56 66 50 56 Q42 46 52 38 Q58 32 48 24" fill="none" stroke="#2dd4bf" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="48" cy="24" r="2.5" fill="#ffffff" />
      </svg>
    `)
  },
  {
    id: 'doc-pediatric',
    name: 'Dre. Pédiatre / Écoute Douce',
    role: 'Pédiatrie & Santé Maternelle',
    svgDataUri: createSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#f59e0b" />
        <!-- Head -->
        <circle cx="50" cy="38" r="16" fill="#fed7aa" />
        <!-- Hair -->
        <path d="M33 34 C33 18 67 18 67 34 C64 25 36 25 33 34" fill="#312e81" />
        <!-- Eyes & Warm smile -->
        <circle cx="44" cy="38" r="2" fill="#1e1b4b" />
        <circle cx="56" cy="38" r="2" fill="#1e1b4b" />
        <path d="M45 44 Q50 49 55 44" stroke="#c2410c" stroke-width="1.8" fill="none" stroke-linecap="round" />
        <!-- Coat -->
        <path d="M22 84 C24 62 36 56 50 56 C64 56 76 62 78 84 Z" fill="#ffffff" />
        <path d="M43 56 L50 69 L57 56 Z" fill="#ec4899" />
        <!-- Pediatric Stethoscope (Pink) -->
        <path d="M38 56 C38 68 44 74 48 76 C52 74 58 68 58 56" stroke="#ec4899" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <circle cx="48" cy="77" r="3" fill="#f43f5e" />
      </svg>
    `)
  }
];
