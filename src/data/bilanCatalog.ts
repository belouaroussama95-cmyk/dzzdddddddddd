import { BilanExamItem } from '../types';

export const BILAN_CATEGORIES = [
  'Hématologie',
  'Biochimie',
  'Ionogramme',
  'Bilan Lipidique',
  'Hémostase',
  'Endocrinologie / Hormones',
  'Infectieux / Sérologie',
  'Urines',
  'Imagerie / Radiologie'
] as const;

export const STANDARD_EXAMS_CATALOG: BilanExamItem[] = [
  // Hématologie
  {
    id: 'nfs',
    name: 'Numération Formule Sanguine (NFS / Hémogramme complet)',
    category: 'Hématologie',
    fastingRequired: false,
    sampleType: 'Sang veineux (Tube EDTA)'
  },
  {
    id: 'plaquettes',
    name: 'Numération des Plaquettes',
    category: 'Hématologie',
    fastingRequired: false,
    sampleType: 'Sang veineux (Tube EDTA)'
  },
  {
    id: 'vs',
    name: 'Vitesse de Sédimentation (VS 1ère et 2ème heure)',
    category: 'Hématologie',
    fastingRequired: false,
    sampleType: 'Sang veineux (Tube Citrate)'
  },
  {
    id: 'reticulocytes',
    name: 'Taux de Réticulocytes (avec formule)',
    category: 'Hématologie',
    fastingRequired: false,
    sampleType: 'Sang veineux (Tube EDTA)'
  },
  {
    id: 'frottis',
    name: 'Frottis de sang veineux (Cytologie hématologique)',
    category: 'Hématologie',
    fastingRequired: false,
    sampleType: 'Lame colorée MGG'
  },

  // Biochimie
  {
    id: 'glycemie',
    name: 'Glycémie veineuse à jeun',
    category: 'Biochimie',
    fastingRequired: true,
    sampleType: 'Fluorure / Sérum (À jeun strict 10-12h)'
  },
  {
    id: 'hba1c',
    name: 'Hémoglobine glyquée (HbA1c)',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sang total (Tube EDTA)'
  },
  {
    id: 'creatinine',
    name: 'Créatininémie + Estimation du DFG (CKD-EPI)',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'uree',
    name: 'Urée sanguine',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'acide_urique',
    name: 'Acide urique sérique (Uricémie)',
    category: 'Biochimie',
    fastingRequired: true,
    sampleType: 'Sérum'
  },
  {
    id: 'proteines_totales',
    name: 'Protéines totales & Albuminémie',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },

  // Ionogramme
  {
    id: 'iono_complet',
    name: 'Ionogramme sanguin (Sodium, Potassium, Chlore)',
    category: 'Ionogramme',
    fastingRequired: false,
    sampleType: 'Sérum (Tube sans anticoagulant)'
  },
  {
    id: 'calcium',
    name: 'Calcémie totale (avec Albuminémie)',
    category: 'Ionogramme',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'phosphore',
    name: 'Phosphorémie (Phosphore sérique)',
    category: 'Ionogramme',
    fastingRequired: true,
    sampleType: 'Sérum'
  },
  {
    id: 'magnesium',
    name: 'Magnésium sérique',
    category: 'Ionogramme',
    fastingRequired: false,
    sampleType: 'Sérum'
  },

  // Bilan Lipidique
  {
    id: 'bilan_lipidique_eal',
    name: 'Exploration d\'une Anomalie Lipidique (EAL : CT, HDL, LDL calculé, Triglycérides)',
    category: 'Bilan Lipidique',
    fastingRequired: true,
    sampleType: 'Sérum (À jeun impératif de 12 heures)'
  },
  {
    id: 'cholesterol_total',
    name: 'Cholestérol Total',
    category: 'Bilan Lipidique',
    fastingRequired: true,
    sampleType: 'Sérum'
  },
  {
    id: 'triglycerides',
    name: 'Triglycérides sériques',
    category: 'Bilan Lipidique',
    fastingRequired: true,
    sampleType: 'Sérum'
  },

  // Bilan Hépatique & Pancréatique
  {
    id: 'transaminases',
    name: 'Transaminases ASAT (TGO) et ALAT (TGP)',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'gamma_gt',
    name: 'Gamma-Glutamyl Transférase (Gamma-GT / GGT)',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'pal',
    name: 'Phosphatases Alcalines (PAL)',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'bilirubine',
    name: 'Bilirubine Totale, Conjuguée et Non-Conjuguée',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum à l’abri de la lumière'
  },
  {
    id: 'lipase',
    name: 'Lipasémie (Lipase sérique)',
    category: 'Biochimie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },

  // Hémostase
  {
    id: 'tp_inr',
    name: 'Taux de Prothrombine (TP) et INR',
    category: 'Hémostase',
    fastingRequired: false,
    sampleType: 'Plasma Citraté'
  },
  {
    id: 'tca',
    name: 'Temps de Céphaline Activée (TCA)',
    category: 'Hémostase',
    fastingRequired: false,
    sampleType: 'Plasma Citraté'
  },
  {
    id: 'fibrinogene',
    name: 'Fibrinogène plasmatique',
    category: 'Hémostase',
    fastingRequired: false,
    sampleType: 'Plasma Citraté'
  },
  {
    id: 'd_dimeres',
    name: 'D-Dimères (Test d\'exclusion thrombo-embolique)',
    category: 'Hémostase',
    fastingRequired: false,
    sampleType: 'Plasma Citraté'
  },

  // Hormonologie / Endocrinologie
  {
    id: 'tsh',
    name: 'TSH ultra-sensible (TSHus)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 't4l',
    name: 'Thyroxine libre (T4 libre / FT4)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'ferritine',
    name: 'Ferritine sérique (Bilan martial)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'fer_cst',
    name: 'Fer sérique et Coefficient de Saturation de la Transferrine (CST)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: true,
    sampleType: 'Sérum prélevé le matin'
  },
  {
    id: 'vit_d',
    name: '25-Hydroxyvitamine D (Vitamine D3 / 25-OH-D)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'vit_b12_b9',
    name: 'Vitamine B12 sérique et Folates (B9)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: true,
    sampleType: 'Sérum à jeun'
  },
  {
    id: 'psa',
    name: 'PSA Total sérique (Antigène spécifique de la prostate)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: false,
    sampleType: 'Sérum (Éviter examen rectal ou vélo < 48h)'
  },
  {
    id: 'bhcg',
    name: 'Bêta-HCG plasmatique quantitative (Grossesse)',
    category: 'Endocrinologie / Hormones',
    fastingRequired: false,
    sampleType: 'Sérum'
  },

  // Infectieux & Sérologies
  {
    id: 'crp',
    name: 'Protéine C-Réactive (CRP ultrasensible)',
    category: 'Infectieux / Sérologie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'pct',
    name: 'Procalcitonine (PCT)',
    category: 'Infectieux / Sérologie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'serologie_vih',
    name: 'Sérologie VIH 1 et 2 (Test Elisa combiné Ag p24 + Ac)',
    category: 'Infectieux / Sérologie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'serologie_vhb_vhc',
    name: 'Sérologies Hépatites B (Ag HBs, Ac anti-HBs) et Hépatite C (Ac anti-VHC)',
    category: 'Infectieux / Sérologie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'tpha_vdrl',
    name: 'Sérologie Syphilis (TPHA / VDRL)',
    category: 'Infectieux / Sérologie',
    fastingRequired: false,
    sampleType: 'Sérum'
  },
  {
    id: 'ecbu',
    name: 'Examen Cytobactériologique des Urines (ECBU) + Antibiogramme',
    category: 'Infectieux / Sérologie',
    fastingRequired: false,
    sampleType: 'Urine du matin au milieu du jet (Flacon stérile)'
  },

  // Urines
  {
    id: 'microalbuminurie',
    name: 'Rapport Albuminurie / Créatininurie (Microalbuminurie sur échantillon)',
    category: 'Urines',
    fastingRequired: false,
    sampleType: 'Urine du matin'
  },
  {
    id: 'proteinurie_24h',
    name: 'Protéinurie des 24 heures (avec volume diurèse)',
    category: 'Urines',
    fastingRequired: false,
    sampleType: 'Recueil des urines de 24h'
  },
  {
    id: 'bandelette_urinaire',
    name: 'Bandelette Urinaire (BU : Leucocytes, Nitrites, Sang, Protéines, Glucose)',
    category: 'Urines',
    fastingRequired: false,
    sampleType: 'Urine fraîche'
  },

  // Imagerie / Radiologie
  {
    id: 'radio_thorax',
    name: 'Radiographie Thoracique (Face et Profil debout)',
    category: 'Imagerie / Radiologie',
    fastingRequired: false,
    indication: 'Suspicion pneumopathie, bronchopneumonie ou contrôle pulmonaire'
  },
  {
    id: 'echo_abdomino_pelvienne',
    name: 'Échographie Abdomino-Pelvienne complète',
    category: 'Imagerie / Radiologie',
    fastingRequired: true,
    indication: 'À jeun de 6h, vessie pleine (boire 1L d’eau 1h avant)'
  },
  {
    id: 'echo_renale',
    name: 'Échographie Rénale, Vésicale et Prostatique',
    category: 'Imagerie / Radiologie',
    fastingRequired: false,
    indication: 'Vessie pleine'
  },
  {
    id: 'ecg',
    name: 'Électrocardiogramme de Repos (ECG 12 dérivations)',
    category: 'Imagerie / Radiologie',
    fastingRequired: false,
    indication: 'Bilan cardiaque systématique / palpitations / pré-opératoire'
  },
  {
    id: 'doppler_veineux',
    name: 'Écho-Doppler Veineux des Membres Inférieurs',
    category: 'Imagerie / Radiologie',
    fastingRequired: false,
    indication: 'Suspicion de thrombose veineuse profonde / insuffisance veineuse'
  }
];
