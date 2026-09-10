import React, { useState } from 'react';
import {
  AlertOctagon,
  Flame,
  PhoneCall,
  Activity,
  HeartPulse,
  Wind,
  Brain,
  ShieldAlert,
  Search,
  CheckSquare,
  Clock,
  Pill,
  ChevronRight,
  AlertTriangle,
  FileCheck2,
  Syringe,
  Timer,
  Plus,
  Trash2,
  ExternalLink,
  FolderOpen,
  X
} from 'lucide-react';

interface EmergencyProtocol {
  id: string;
  title: string;
  subtitle: string;
  category: 'cardio' | 'respiratory' | 'neuro' | 'allergy' | 'metabolic';
  urgencyLevel: 'Vital Immédiat' | 'Urgence Haute' | 'Urgence Relative';
  recognition: string[];
  immediateActions: string[];
  medications: {
    name: string;
    dose: string;
    route: string;
    instructions: string;
  }[];
  monitoring: string[];
  alertContact: string;
}

const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: 'choc-anaphylactique',
    title: 'Choc Anaphylactique & Angio-œdème',
    subtitle: 'Réaction allergique systémique aiguë menaçant le pronostic vital',
    category: 'allergy',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Signes cutanéo-muqueux : Urticaire géant, prurit palmo-plantaire, œdème des lèvres et de la glotte',
      'Signes respiratoires : Dyspnée laryngée (stridor), wheezing, polypnée, tirage',
      'Signes hémodynamiques : Hypotension artérielle brutale (PAS < 90 mmHg), tachycardie, pâleur, vertiges, collapsus'
    ],
    immediateActions: [
      '1. Arrêter immédiatement l’administration de l’allergène suspect',
      '2. Appel SAMU Algérie (3016) ou Protection Civile (14) sans attendre : préciser "Choc Anaphylactique"',
      '3. Allonger le patient jambes surélevées (position de Trendelenburg modifiée) sauf si détresse respiratoire prédominante (position assise)',
      '4. Oxygénothérapie au masque à haute concentration (10 à 15 L/min)',
      '5. Pose d’une voie veineuse de gros calibre (16G ou 18G) et remplissage cristalloïde rapide (NaCl 0.9% 500 à 1000 mL en 15-20 min)'
    ],
    medications: [
      {
        name: 'Adrénaline (Épinéphrine)',
        dose: 'Adulte : 0.5 mg (0.5 mL solution 1 mg/mL 1:1000) • Enfant : 0.01 mg/kg (max 0.3 mg)',
        route: 'IM stricte (face antéro-latérale de la cuisse)',
        instructions: 'Traitement de première ligne absolu. À répéter toutes les 5 à 15 minutes si pas d’amélioration.'
      },
      {
        name: 'Méthylprednisolone (Solumédrol)',
        dose: '1 à 2 mg/kg (ex: 80 à 120 mg)',
        route: 'IV ou IM',
        instructions: 'Prévient la réaction biphasique secondaire (délai d’action 4-6h).'
      },
      {
        name: 'Dexchlorphéniramine (Polaramine)',
        dose: '5 mg (1 ampoule)',
        route: 'IV lente ou IM',
        instructions: 'Antihistaminique H1 adjuvant, ne jamais utiliser seul en première intention.'
      },
      {
        name: 'Salbutamol en spray ou aérosol',
        dose: '5 mg en nébulisation avec O2 (ou 4 à 8 bouffées en chambre d’inhalation)',
        route: 'Inhalé',
        instructions: 'Si bronchospasme persistant associé.'
      }
    ],
    monitoring: [
      'PA, FC, SpO2 toutes les 3 minutes',
      'Surveillance minimale en milieu hospitalier de 12 à 24 heures (risque de rechute biphasique)'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Préciser "Arrêt cardiaque ou détresse respiratoire imminente"'
  },
  {
    id: 'sca-infarctus',
    title: 'Syndrome Coronaire Aigu (SCA / Infarctus)',
    subtitle: 'Douleur thoracique rétrosternale constrictive irradiante',
    category: 'cardio',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Douleur thoracique rétrosternale constrictive, en étau, irradiant vers la mâchoire gauche, le bras gauche ou le dos',
      'Durée > 20 minutes, résistante à la Trinitrine sublinguale',
      'Signes associés : Sueurs froides profuses, nausées, angoisse majeure, dyspnée',
      'Formes atypiques chez la femme, le diabétique et le sujet âgé : Épigastralgie isolée, malaise, essoufflement brutal'
    ],
    immediateActions: [
      '1. Mise au repos strict au lit, interdire tout effort physique',
      '2. Appel SAMU Algérie (3016) ou Protection Civile (14) immédiat pour envoi d’un SMUR avec ECG 12 dérivations',
      '3. Rassurer le patient, monitoring cardiotensionnel continu',
      '4. Oxygène uniquement si SpO2 < 90% (cible 92-96%)'
    ],
    medications: [
      {
        name: 'Aspirine (Acide acétylsalicylique)',
        dose: '250 à 300 mg',
        route: 'Per os à croquer ou IVD directe',
        instructions: 'Dose de charge immédiate en l’absence de contre-indication absolue connue.'
      },
      {
        name: 'Dérivé nitré (Natispray ou Risordan)',
        dose: '1 à 2 bouffées sublinguales (0.4 mg)',
        route: 'Sublingual',
        instructions: 'UNIQUEMENT si PAS > 90 mmHg et absence de prise récente d’inhibiteurs de la PDE5 (Viagra/Cialis).'
      },
      {
        name: 'Chlorhydrate de Morphine',
        dose: '2 à 3 mg IV titrée toutes les 5 à 10 min',
        route: 'IV lente titrée',
        instructions: 'Si douleur insoutenable résistante sous avis de la régulation médicale SMUR.'
      }
    ],
    monitoring: [
      'ECG 12 dérivations le plus précocement possible (objectif < 10 min)',
      'Avoir le défibrillateur (DAE) à portée immédiate de main (risque de fibrillation ventriculaire précoce)'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Déclenchement filière coronarographie d’urgence H24'
  },
  {
    id: 'aag-asthme',
    title: 'Asthme Aigu Grave (AAG)',
    subtitle: 'Crise d’asthme sévère avec critères de gravité immédiate',
    category: 'respiratory',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Impossibilité de parler (phrases hachées mot à mot), orthopnée stricte',
      'Fréquence respiratoire > 30/min ou bradypnée avec silence auscultatoire ("poumon silencieux" = épuisement extrême)',
      'Tachycardie > 120/min ou bradycardie pré-terminale',
      'SpO2 < 90% à l’air ambiant, cyanose, sueurs, agitation ou somnolence'
    ],
    immediateActions: [
      '1. Position assise ou demi-assise obligatoire (ne jamais allonger)',
      '2. Appel SAMU Algérie (3016) ou Protection Civile (14) sans délai',
      '3. Oxygénothérapie à fort débit (6 à 8 L/min) pour SpO2 93-95%',
      '4. Aérosolthérapie immédiate en continu'
    ],
    medications: [
      {
        name: 'Salbutamol (Ventoline)',
        dose: '5 mg par nébulisation continue avec O2 (6 L/min)',
        route: 'Aérosol nébulisé (ou 10 bouffées rapprochées)',
        instructions: 'Répéter toutes les 20 minutes pendant la première heure.'
      },
      {
        name: 'Ipratropium (Atrovent)',
        dose: '0.5 mg',
        route: 'Aérosol nébulisé associé au Salbutamol',
        instructions: 'Synergie anticholinergique majeure.'
      },
      {
        name: 'Méthylprednisolone (Solumédrol)',
        dose: '1 mg/kg (80 mg chez l’adulte)',
        route: 'IVD ou per os',
        instructions: 'Corticothérapie précoce indispensable pour lever l’inflammation bronchique.'
      }
    ],
    monitoring: [
      'Auscultation pulmonaire (recherche d’un silence auscultatoire)',
      'État de conscience (somnolence = épuisement et hypercapnie majeure)'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Transport médicalisé SMUR en soins intensifs respiratoires'
  },
  {
    id: 'oap-poumon',
    title: 'Œdème Aigu du Poumon Hémodynamique (OAP)',
    subtitle: 'Insuffisance ventriculaire gauche aiguë avec inondation alvéolaire',
    category: 'cardio',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Dyspnée brutale, angoissante, le plus souvent nocturne, orthopnée majeure',
      'Toux avec expectoration mousseuse rosée "saumonée" caractéristique',
      'Râles crépitants en "marée montante" auscultatoires bilatéraux',
      'HTA sévère fréquente, sueurs, cyanose, tirage respiratoire'
    ],
    immediateActions: [
      '1. Assis au bord du lit, jambes pendantes (diminution du retour veineux)',
      '2. Appel SAMU Algérie (3016) ou Protection Civile (14)',
      '3. Oxygénothérapie fort débit (6 à 10 L/min) pour SpO2 > 92%',
      '4. Si disponible : Ventilation non invasive (CPAP de Boussignac)'
    ],
    medications: [
      {
        name: 'Furosémide (Lasilix)',
        dose: '40 à 80 mg (1 à 2 ampoules)',
        route: 'IVD lente',
        instructions: 'Effet vasodilatateur précoce (< 5 min) avant même l’effet diurétique.'
      },
      {
        name: 'Dérivés nitrés (Dinitrate d’isosorbide / Risordan)',
        dose: 'Spray 1 à 2 bouffées sublinguales (ou IVSE sous SMUR)',
        route: 'Sublingual',
        instructions: 'Contre-indiqué si PAS < 100 mmHg.'
      }
    ],
    monitoring: [
      'Pression artérielle (risque de chute tensionnelle brutale)',
      'SpO2 et diurèse horaire'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14'
  },
  {
    id: 'hypoglycemie-severe',
    title: 'Hypoglycémie Sévère & Coma',
    subtitle: 'Glycémie capillaire < 0.50 g/L (2.8 mmol/L) avec troubles neuropsychiques',
    category: 'metabolic',
    urgencyLevel: 'Urgence Haute',
    recognition: [
      'Signes neurovégétatifs : Sueurs profuses froides, tremblements, palpitations, pâleur, faim douloureuse',
      'Signes neuroglycopéniques : Confusion, diplopie, troubles de l’élocution, agressivité, convulsions, coma agité avec babinski bilatéral'
    ],
    immediateActions: [
      '1. Contrôle immédiat de la glycémie capillaire (Dextro)',
      '2. Si patient conscient : 15 à 20 g de sucre rapide per os (3 morceaux de sucre ou 1 verre de jus)',
      '3. Si patient inconscient ou refuse : PLS, JAMAIS de boisson per os (risque de fausse route mortelle)'
    ],
    medications: [
      {
        name: 'Sérum Glucosé à 30% (G30%)',
        dose: '20 à 40 mL (2 à 3 ampoules de 10 mL ou 20 mL)',
        route: 'IVD stricte sur veine de bon calibre',
        instructions: 'Réveil spectaculaire en 2 à 3 minutes. Rincer la veine ensuite.'
      },
      {
        name: 'Glucagon (GlucaGen)',
        dose: '1 mg (1 flacon)',
        route: 'IM ou SC',
        instructions: 'Si aucun accès veineux n’est possible. Inefficace si jeûne prolongé ou éthylisme aigu (réserves de glycogène hépatique épuisées).'
      }
    ],
    monitoring: [
      'Recontrôler la glycémie capillaire à 15 minutes',
      'Si hypoglycémie sous sulfamides hypoglycémiants (Daonil, Amarel) : Hospitalisation impérative (durée d’action > 24-48h avec récidives)'
    ],
    alertContact: 'SAMU Algérie 3016 ou Protection Civile 14 si troubles de conscience prolongés ou coma'
  },
  {
    id: 'avc-accident-vasculaire',
    title: 'Accident Vasculaire Cérébral (AVC Ischémique / Hémorragique)',
    subtitle: 'Déficit neurologique focal brutal d’apparition soudaine',
    category: 'neuro',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'F - Face : Asymétrie faciale, déviation de la bouche à la demande de sourire',
      'A - Arms : Faiblesse ou paralysie d’un membre supérieur (manœuvre de Barré)',
      'S - Speech : Trouble de la parole, aphasie, propos incohérents, dysarthrie',
      'T - Time : Heure de début des symptômes précise (fenêtre de thrombolyse < 4h30)'
    ],
    immediateActions: [
      '1. APPEL SAMU ALGÉRIE (3016) OU PROTECTION CIVILE (14) IMMÉDIAT en annonçant : "AVC en fenêtre thérapeutique"',
      '2. Noter l’heure exacte de début des symptômes (ou heure du dernier contact normal)',
      '3. Patient allongé à plat dos, tête à 30° si vomissements',
      '4. À JEUN STRICT (zéro boisson, zéro aliment, zéro médicament)',
      '5. NE PAS FAIRE BAISSER LA TENSION ARTÉRIELLE (mécanisme de sauvetage de la pénombre ischémique, sauf si PAS > 220 mmHg)'
    ],
    medications: [
      {
        name: 'Aucun traitement antihypertenseur ou anticoagulant en pré-hospitalier',
        dose: 'Zéro médication avant imagerie',
        route: 'Aucune',
        instructions: 'Imagerie cérébrale (IRM ou Scanner) urgente impérative avant toute décision de thrombolyse ou thrombectomie mécanique.'
      }
    ],
    monitoring: [
      'Dextro immédiat pour éliminer une hypoglycémie simulant un AVC',
      'Score FAST / NIHSS répété'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Activation filière UNV d’urgence'
  },
  {
    id: 'etat-mal-epileptique',
    title: 'État de Mal Épileptique / Convulsions (> 5 min)',
    subtitle: 'Crise tonico-clonique généralisée prolongée ou répétée sans reprise de conscience',
    category: 'neuro',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Crise tonico-clonique généralisée durant plus de 5 minutes consécutives',
      'Ou succession de crises convulsives rapprochées sans reprise d’un état de conscience normal',
      'Mouvements convulsifs bilatéraux, révulsion oculaire, morsure latérale de langue, perte d’urine, encombrement bronchique'
    ],
    immediateActions: [
      '1. Protéger le patient des traumatismes (écarter les objets contondants, caler la tête), NE RIEN METTRE DANS LA BOUCHE',
      '2. Chronométrer la durée de la crise dès le début',
      '3. Appel SAMU Algérie (3016) ou Protection Civile (14) immédiat si durée > 5 minutes ou première crise convulsive inaugurale',
      '4. Mise en Position Latérale de Sécurité (PLS) dès l’arrêt des secousses convulsives',
      '5. Oxygénothérapie au masque à fort débit (10 à 15 L/min), aspiration des sécrétions bucco-pharyngées'
    ],
    medications: [
      {
        name: 'Clonazépam (Rivotril) ou Diazépam (Valium)',
        dose: 'Clonazépam 1 mg (1 ampoule) IVL ou Diazépam 10 mg (0.15 mg/kg)',
        route: 'IV lente (en 2 minutes) ou intra-rectal chez l’enfant (canule pédiatrique)',
        instructions: 'Traitement anti-convulsivant de première ligne. Si la crise persiste après 5 minutes, renouveler la même dose une seule fois.'
      },
      {
        name: 'Midazolam (Buccolam)',
        dose: '10 mg chez l’adulte (dose adaptée au poids chez l’enfant)',
        route: 'Voie jugale buccale (entre joue et gencive)',
        instructions: 'Excellente alternative si aucun accès veineux n’est disponible.'
      }
    ],
    monitoring: [
      'Contrôle immédiat de la glycémie capillaire (Dextro impératif pour éliminer un coma hypoglycémique convulsivant)',
      'Surveillance respiratoire stricte (risque de bradypnée et dépression respiratoire post-benzodiazépines)'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Préciser "État de mal convulsif > 5 min"'
  },
  {
    id: 'choc-septique',
    title: 'Choc Septique & Sepsis Sévère',
    subtitle: 'Dysfonction d’organe menaçant le pronostic vital causée par une infection systémique dérégulée',
    category: 'metabolic',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Score qSOFA ≥ 2 : Fréquence respiratoire ≥ 22/min, altération des fonctions supérieures (GCS < 15), Pression Artérielle Systolique ≤ 100 mmHg',
      'Température > 38.5°C ou au contraire hypothermie sévère < 36.0°C avec frissons intenses',
      'Signes d’hypoperfusion tissulaire : Marbrures cutanées (genoux, cuisses), oligurie (< 0.5 mL/kg/h), temps de recoloration cutanée (TRC) > 3 secondes, tachycardie > 100 bpm'
    ],
    immediateActions: [
      '1. Appel SAMU Algérie (3016) ou 14 sans attendre : Régulation pour admission directe en réanimation médicale',
      '2. Pose rapide de 2 voies veineuses périphériques de gros calibre (16G ou 18G)',
      '3. Remplissage vasculaire immédiat : Cristalloïdes isotoniques (Ringer Lactate ou NaCl 0.9%) 30 mL/kg en 30-60 minutes',
      '4. Oxygénothérapie pour maintenir une SpO2 > 94% (ou 88-92% si BPCO)',
      '5. Réaliser hémocultures si le matériel est disponible avant l’antibiothérapie (sans retarder celle-ci de plus de 45 min)'
    ],
    medications: [
      {
        name: 'Ceftriaxone (Rocéphine)',
        dose: '2 g en IV lente ou perfusion courte',
        route: 'IV directe lente ou perfusion 30 min',
        instructions: 'Antibiothérapie probabiliste à large spectre à administrer dans la première heure ("Golden Hour").'
      },
      {
        name: 'Paracétamol injectable (Perfalgan)',
        dose: '1 g en perfusion de 15 minutes',
        route: 'Perfusion IV',
        instructions: 'Si fièvre mal tolérée ou frissons intenses.'
      }
    ],
    monitoring: [
      'Surveillance continue : Pression Artérielle (PAM cible ≥ 65 mmHg), Fréquence Cardiaque, Fréquence Respiratoire, Diurèse',
      'Surveillance de l’extension des marbrures'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Prise en charge réanimatoire SMUR avec vasopresseurs'
  },
  {
    id: 'embolie-pulmonaire-grave',
    title: 'Embolie Pulmonaire Grave à Risque Élevé',
    subtitle: 'Occlusion brutale de l’arbre artériel pulmonaire avec instabilité hémodynamique',
    category: 'cardio',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Dyspnée brutale inexpliquée, polypnée > 24/min, sensation d’étouffement ou syncope inaugurale',
      'Douleur thoracique d’allure pleurale basithoracique unilatérale, augmentée à l’inspiration profonde et à la toux',
      'Tachycardie sinusale constante, signes de cœur pulmonaire aigu (turgescence jugulaire, reflux hépato-jugulaire)',
      'Choc hémodynamique : PAS < 90 mmHg ou chute tensionnelle > 40 mmHg pendant > 15 min'
    ],
    immediateActions: [
      '1. Repos strict au lit strict, interdire impérativement tout lever (risque d’arrêt cardiaque par désamorçage)',
      '2. Appel SAMU Algérie (3016) ou Protection Civile (14) immédiat en signalant l’état de choc hémodynamique',
      '3. Oxygénothérapie titrée au masque à fort débit pour SpO2 > 94%',
      '4. Voie veineuse périphérique avec remplissage très prudent (max 500 mL de cristalloïdes pour ne pas aggraver la défaillance ventriculaire droite)'
    ],
    medications: [
      {
        name: 'Héparine Non Fractionnée (HNF)',
        dose: 'Bolus IV initial de 5000 UI (ou 80 UI/kg)',
        route: 'IV directe',
        instructions: 'Anticoagulation précoce d’action immédiate sous avis médical SMUR avant la thrombolyse hospitalière.'
      },
      {
        name: 'Enoxaparine (Lovenox)',
        dose: '100 UI/kg (1 mg/kg) toutes les 12h en sous-cutané',
        route: 'Sous-cutanée',
        instructions: 'Uniquement si embolie à risque intermédiaire ou faible sans défaillance hémodynamique.'
      }
    ],
    monitoring: [
      'ECG 12 dérivations : Aspect S1Q3, tachycardie sinusale, bloc de branche droit aigu, ischémie antéro-septale',
      'Saturation pulsée en O2 et pression artérielle toutes les 5 minutes'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Indication urgente d’angioscanner thoracique'
  },
  {
    id: 'surdosage-opioides',
    title: 'Surdosage Aigu aux Opioïdes & Dépression Respiratoire',
    subtitle: 'Intoxication aiguë aux morphiniques, méthadone, fentanyl ou tramadol',
    category: 'metabolic',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Triade toxique classique : Dépression respiratoire majeure (bradypnée < 10-12/min ou apnée), Coma calme hypotonique, Myosis serré bilatéral en "têtes d’épingle"',
      'Cyanose labiale et unguéale, encombrement bronchique, bradycardie et hypotension artérielle'
    ],
    immediateActions: [
      '1. Libération immédiate des voies aériennes supérieures (subluxation de la mandibule, canule de Guedel)',
      '2. Ventilation manuelle au ballon insufflateur (BAVU) avec réservoir branché sur oxygène à 15 L/min',
      '3. Appel SAMU Algérie (3016) ou Protection Civile (14) sans tarder',
      '4. Administration sans attendre de l’antidote spécifique (Naloxone)'
    ],
    medications: [
      {
        name: 'Naloxone Chlorhydrate (Narcan)',
        dose: '0.4 mg à 0.8 mg (1 à 2 ampoules de 0.4 mg/mL)',
        route: 'IV lente titrée (0.1 à 0.2 mg toutes les 2-3 min) ou IM / Intranasale (spray Nyxoid 1.8 mg)',
        instructions: 'Titrer la dose par paliers successifs jusqu’au rétablissement d’une fréquence respiratoire efficace ≥ 12/min, sans provoquer de syndrome de sevrage brutal.'
      }
    ],
    monitoring: [
      'Surveillance respiratoire rapprochée pendant au moins 4 à 6 heures (la demi-vie de la naloxone [1-2h] est souvent plus courte que celle des opioïdes ingérés : risque de rechute apnéique secondaire)'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Hospitalisation en surveillance continue'
  },
  {
    id: 'hyperkaliemie-menacante',
    title: 'Hyperkaliémie Sévère Menaçante avec Anomalies ECG',
    subtitle: 'Potassium plasmatique > 6.0 - 6.5 mmol/L avec signes de gravité électrocardiographiques',
    category: 'cardio',
    urgencyLevel: 'Vital Immédiat',
    recognition: [
      'Signes ECG majeurs de toxicité myocardique : Ondes T pointues, amples et symétriques, disparition de l’onde P, élargissement progressif du complexe QRS, rythme idioventriculaire sinusoïdal pré-fibrillatoire',
      'Signes cliniques neuromusculaires : Faiblesse musculaire ascendante, paresthésies des extrémités et péribuccales, hyporéflexie ostéotendineuse, bradycardie extrême'
    ],
    immediateActions: [
      '1. Réalisation immédiate d’un ECG 12 dérivations dès la suspicion clinique ou biologique',
      '2. Appel SAMU Algérie (3016) ou Protection Civile (14) pour régulation médicale et envoi d’un SMUR réanimateur',
      '3. Pose d’une voie veineuse périphérique de sécurité, arrêt de tout apport potassique (perfusion, sel de potassium, IEC/ARA II, Spironolactone)',
      '4. Préparer le défibrillateur cardiaque à proximité immédiate'
    ],
    medications: [
      {
        name: 'Gluconate de Calcium à 10% (ou Chlorure de Calcium)',
        dose: '10 mL (1 ampoule de 1 g) IV lente en 3 à 5 minutes',
        route: 'IV directe lente sous contrôle du rythme cardiaque',
        instructions: 'Cardioprotecteur immédiat indispensable pour stabiliser la membrane myocardique (n’abaisse pas la kaliémie). Effet en 1-3 minutes. Contre-indiqué si patient sous digitaliques.'
      },
      {
        name: 'Insuline Rapide + Sérum Glucosé 30%',
        dose: '10 UI d’Insuline rapide ordinaire dans 250 mL de Glucosé 10% ou 50 mL de G30%',
        route: 'Perfusion IV en 20-30 minutes',
        instructions: 'Transfert du potassium extracellulaire vers le secteur intracellulaire. Début d’action en 15-30 min.'
      },
      {
        name: 'Salbutamol en nébulisation (Ventoline)',
        dose: '10 à 20 mg en aérosol continue avec O2 (6 L/min)',
        route: 'Nébulisation inhalée',
        instructions: 'Action synergique stimulatrice des récepteurs bêta-2 pour faire entrer le potassium dans les cellules.'
      }
    ],
    monitoring: [
      'Contrôle ECG continu (régression de l’élargissement du QRS)',
      'Contrôle de la glycémie capillaire pour éviter toute hypoglycémie induite par l’insuline'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Indication d’hémodialyse d’urgence'
  },
  {
    id: 'bradycardie-extreme',
    title: 'Bradycardie Sévère Symptomatique & Choc',
    subtitle: 'Fréquence cardiaque < 40 bpm avec signes de bas débit cérébral ou coronarien',
    category: 'cardio',
    urgencyLevel: 'Urgence Haute',
    recognition: [
      'Fréquence cardiaque < 40 bpm auscultée et documentée au pouls',
      'Signes d’hypoperfusion cérébrale : Lipothymie, vertiges, syncope (syndrome de Stokes-Adams), confusion',
      'Signes hémodynamiques : Pression artérielle systolique < 90 mmHg, sueurs, pâleur, marbrures, angor ou dyspnée d’insuffisance cardiaque'
    ],
    immediateActions: [
      '1. Patient allongé à plat dos, jambes surélevées à 45°',
      '2. Appel SAMU Algérie (3016) ou Protection Civile (14) en précisant le degré de tolérance hémodynamique et les antécédents cardiaques',
      '3. ECG 12 dérivations immédiat (recherche de BAV complet du 3e degré, dysfonction sinusale ou BAV 2 Mobitz II)',
      '4. Oxygénothérapie si SpO2 < 92%'
    ],
    medications: [
      {
        name: 'Sulfate d’Atropine injectable',
        dose: '0.5 mg à 1 mg en bolus IV direct',
        route: 'IVD rapide',
        instructions: 'À répéter toutes les 3 à 5 minutes si nécessaire (dose cumulée maximale 3 mg). Efficace surtout en cas d’hypertonie vagale ou de BAV nodal haut situé.'
      },
      {
        name: 'Isoprénaline (Isuprel)',
        dose: 'En perfusion continue titrée sous contrôle SMUR',
        route: 'Perfusion IVSE',
        instructions: 'Bêta-stimulant de référence si échec de l’atropine dans l’attente de la pose d’une sonde d’entraînement électrosystolique (stimulateur cardiaque).'
      }
    ],
    monitoring: [
      'Monitorage cardiotensionnel continu',
      'Préparation des palettes de stimulation externe du défibrillateur (Pacing externe)'
    ],
    alertContact: 'SAMU Algérie 3016 • Protection Civile 14 • Transfert en unité de soins intensifs cardiologiques (USIC)'
  }
];

export function EmergencyCatPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Protocols state with persistence
  const [customProtocols, setCustomProtocols] = useState<EmergencyProtocol[]>(() => {
    try {
      const saved = localStorage.getItem('ordocare_custom_cat_protocols');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allProtocols = [...customProtocols, ...EMERGENCY_PROTOCOLS];
  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyProtocol>(
    allProtocols[0] || EMERGENCY_PROTOCOLS[0]
  );

  // Modal State for adding new Emergency CAT Protocol
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<'cardio' | 'respiratory' | 'neuro' | 'allergy' | 'metabolic'>('cardio');
  const [newUrgencyLevel, setNewUrgencyLevel] = useState<'Vital Immédiat' | 'Urgence Haute' | 'Urgence Relative'>('Vital Immédiat');
  const [newAlertContact, setNewAlertContact] = useState('SAMU Algérie 3016 / Protection Civile 14');
  const [newRecognition, setNewRecognition] = useState('');
  const [newImmediateActions, setNewImmediateActions] = useState('');
  const [newMonitoring, setNewMonitoring] = useState('');
  const [newMedications, setNewMedications] = useState<
    { name: string; dose: string; route: string; instructions: string }[]
  >([
    { name: '', dose: '', route: 'IV lente', instructions: '' }
  ]);

  const handleAddMedRow = () => {
    setNewMedications([
      ...newMedications,
      { name: '', dose: '', route: 'IV lente', instructions: '' }
    ]);
  };

  const handleRemoveMedRow = (index: number) => {
    setNewMedications(newMedications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: string, value: string) => {
    const updated = [...newMedications];
    updated[index] = { ...updated[index], [field]: value };
    setNewMedications(updated);
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProtocol: EmergencyProtocol = {
      id: `custom-cat-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Protocole d’urgence personnalisé',
      category: newCategory,
      urgencyLevel: newUrgencyLevel,
      alertContact: newAlertContact.trim() || 'SAMU Algérie 3016 / Protection Civile 14',
      recognition: newRecognition
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      immediateActions: newImmediateActions
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      medications: newMedications.filter(m => m.name.trim()),
      monitoring: newMonitoring
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
    };

    const updated = [newProtocol, ...customProtocols];
    setCustomProtocols(updated);
    try {
      localStorage.setItem('ordocare_custom_cat_protocols', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save protocol', err);
    }

    setSelectedProtocol(newProtocol);
    // Reset form
    setNewTitle('');
    setNewSubtitle('');
    setNewCategory('cardio');
    setNewUrgencyLevel('Vital Immédiat');
    setNewAlertContact('SAMU Algérie 3016 / Protection Civile 14');
    setNewRecognition('');
    setNewImmediateActions('');
    setNewMonitoring('');
    setNewMedications([{ name: '', dose: '', route: 'IV lente', instructions: '' }]);
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomProtocol = (id: string) => {
    const updated = customProtocols.filter(p => p.id !== id);
    setCustomProtocols(updated);
    try {
      localStorage.setItem('ordocare_custom_cat_protocols', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save to localStorage', err);
    }
    if (selectedProtocol.id === id) {
      setSelectedProtocol(EMERGENCY_PROTOCOLS[0]);
    }
  };

  const filtered = allProtocols.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.immediateActions.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.medications.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#09222e] text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-900/40">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-rose-400" />
              Procédures d’Urgence Vitales (CAT)
            </span>
            <span className="text-xs text-teal-300 font-semibold">Conduite À Tenir Médicale</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>CAT Urgences & Protocoles Réanimation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Protocoles standardisés de prise en charge immédiate au cabinet : posologies précises d'urgence, gestes d'urgence, critères de transfert et régulation SAMU Algérie (3016) / Protection Civile (14).
          </p>
        </div>

        {/* Action Group: Drive Link + Add CAT Button + Emergency Call */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="https://drive.google.com/drive/folders/1s2HHVuBYG32TNv0Rz0SLOmnmcerYcZdp"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-300" />
            <span>Dossier Drive Protocoles</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-300/80" />
          </a>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-[#09222e] font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-teal-950/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une CAT</span>
          </button>

          <div className="bg-rose-500/10 border border-rose-400/30 p-2.5 px-3.5 rounded-2xl backdrop-blur-xs flex items-center gap-3 text-xs">
            <div className="w-10 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-md tracking-tight">
              3016
            </div>
            <div>
              <p className="font-bold text-rose-300 uppercase tracking-wider text-[9px]">Ligne SAMU Algérie</p>
              <p className="text-white font-extrabold text-xs">3016 • PC 14</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-rose-500/10 rounded-full pointer-events-none" />
      </div>

      {/* Google Drive Resources Notification Bar */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3 text-amber-950 font-medium">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-amber-900">
              Bibliothèque Externe & Fiches CAT Complémentaires (Google Drive)
            </p>
            <p className="text-amber-800/90 text-[11px] mt-0.5">
              Consultez l'ensemble des fiches réflexes, fiches de réanimation et algorithmes d'urgence archivés dans le dossier Drive dédié.
            </p>
          </div>
        </div>
        <a
          href="https://drive.google.com/drive/folders/1s2HHVuBYG32TNv0Rz0SLOmnmcerYcZdp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs transition-all shrink-0 self-start sm:self-auto shadow-sm"
        >
          <span>Ouvrir le dossier Drive</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Grid: Protocol Navigation + Protocol Interactive Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Protocol List & Filter */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher protocole d'urgence..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-semibold text-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                title="Ajouter une nouvelle CAT"
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: `Tous (${allProtocols.length})` },
                { id: 'allergy', label: 'Allergie / Choc' },
                { id: 'cardio', label: 'Cardiologique' },
                { id: 'respiratory', label: 'Respiratoire' },
                { id: 'metabolic', label: 'Métabolique' },
                { id: 'neuro', label: 'Neurologique' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Protocols */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <p className="text-xs font-semibold">Aucun protocole trouvé.</p>
              </div>
            ) : (
              filtered.map(item => {
                const isSelected = selectedProtocol.id === item.id;
                const isCustom = item.id.startsWith('custom-cat-');
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProtocol(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                          {item.urgencyLevel}
                        </span>
                        {isCustom && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800">
                            Ajouté
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isCustom && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteCustomProtocol(item.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer ce protocole"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-rose-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Clinical Action Sheet (CAT) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            {/* Sheet Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white tracking-wide">
                    {selectedProtocol.urgencyLevel}
                  </span>
                  {selectedProtocol.id.startsWith('custom-cat-') && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Protocole Personnalisé
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">ID: {selectedProtocol.id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedProtocol.title}</h2>
                <p className="text-xs text-slate-500">{selectedProtocol.subtitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                  {selectedProtocol.alertContact}
                </span>

                {selectedProtocol.id.startsWith('custom-cat-') && (
                  <button
                    onClick={() => handleDeleteCustomProtocol(selectedProtocol.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Supprimer cette CAT personnalisée"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Recognition / Diagnostic */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Signes d'Alerte & Critères de Gravité
              </h4>
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-1.5 text-amber-950 font-medium">
                {selectedProtocol.recognition.length > 0 ? (
                  selectedProtocol.recognition.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{rec}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Aucun critère particulier renseigné.</p>
                )}
              </div>
            </div>

            {/* Immediate Actions (CAT Sequence) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Conduite À Tenir Immédiate (Chronologie des Gestes)
              </h4>
              <div className="bg-teal-50/50 border border-teal-200/70 rounded-2xl p-4 text-xs space-y-2 text-teal-950">
                {selectedProtocol.immediateActions.length > 0 ? (
                  selectedProtocol.immediateActions.map((act, i) => (
                    <div key={i} className="flex items-start gap-2 font-medium leading-relaxed">
                      <span>{act}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Aucun geste renseigné.</p>
                )}
              </div>
            </div>

            {/* Emergency Medications Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Syringe className="w-4 h-4 text-rose-600" />
                Médicaments & Posologies d'Urgence Immédiates
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                {selectedProtocol.medications.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Médicament</th>
                        <th className="p-3">Posologie</th>
                        <th className="p-3">Voie</th>
                        <th className="p-3">Consignes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProtocol.medications.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-3 font-bold text-slate-900">{m.name}</td>
                          <td className="p-3 font-mono font-bold text-rose-700">{m.dose}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                              {m.route}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-slate-400 italic text-xs">Aucune médication spécifique requise.</p>
                )}
              </div>
            </div>

            {/* Monitoring & Transfer */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Surveillance Paramètres Vitaux
                </span>
                <p className="text-slate-500 text-xs">
                  {selectedProtocol.monitoring.length > 0
                    ? selectedProtocol.monitoring.join(' • ')
                    : 'Surveillance clinique standard'}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Imprimer la Fiche CAT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Ajouter une Conduite À Tenir (CAT) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Créer une Fiche Conduite À Tenir (CAT)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez un protocole d'urgence personnalisé pour votre cabinet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProtocol} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Titre du Protocole / Pathologie d'Urgence *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Poussée Hypertensive Aiguë / Crise Vaso-occlusive"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-hidden focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sous-titre / Définition clinique rapide
                </label>
                <input
                  type="text"
                  placeholder="Ex: Élévation tensionnelle sévère avec ou sans souffrance viscérale"
                  value={newSubtitle}
                  onChange={e => setNewSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="cardio">Cardiologique</option>
                    <option value="respiratory">Respiratoire</option>
                    <option value="neuro">Neurologique</option>
                    <option value="allergy">Allergie / Choc</option>
                    <option value="metabolic">Métabolique</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Niveau de Gravité
                  </label>
                  <select
                    value={newUrgencyLevel}
                    onChange={e => setNewUrgencyLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="Vital Immédiat">Vital Immédiat</option>
                    <option value="Urgence Haute">Urgence Haute</option>
                    <option value="Urgence Relative">Urgence Relative</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact d'Alerte
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SAMU Algérie 3016 ou 14"
                    value={newAlertContact}
                    onChange={e => setNewAlertContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-rose-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-700 mb-1">
                  Signes d'Alerte & Critères de Gravité (un par ligne)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Pression artérielle ≥ 180/110 mmHg&#10;Céphalées intenses, phosphènes, acouphènes&#10;Douleur thoracique ou dyspnée"
                  value={newRecognition}
                  onChange={e => setNewRecognition(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50/40 text-slate-900 focus:outline-hidden focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-teal-700 mb-1">
                  Conduite À Tenir Immédiate (Chronologie des gestes, un par ligne) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: 1. Repos au calme en position demi-assise pendant 15-20 min&#10;2. Contrôle de la PA aux deux bras&#10;3. Recherche de signes de défaillance d'organe (cœur, rein, cerveau)&#10;4. Appel SAMU Algérie (3016) ou Protection Civile (14) si signe de retentissement viscéral"
                  value={newImmediateActions}
                  onChange={e => setNewImmediateActions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50/40 text-slate-900 focus:outline-hidden focus:border-teal-400 focus:bg-white"
                />
              </div>

              {/* Dynamic Medications List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-rose-700">
                    Médicaments & Posologies d'Urgence
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter une ligne médicament
                  </button>
                </div>

                {newMedications.map((med, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Médicament #{idx + 1}</span>
                      {newMedications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedRow(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nom molécule (ex: Nicardipine)"
                        value={med.name}
                        onChange={e => handleMedChange(idx, 'name', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Posologie (ex: 10 mg / 10 mL)"
                        value={med.dose}
                        onChange={e => handleMedChange(idx, 'dose', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Voie (ex: IVSE / PO)"
                        value={med.route}
                        onChange={e => handleMedChange(idx, 'route', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Consignes particulières (ex: titration lente, surveillance tensionnelle)"
                      value={med.instructions}
                      onChange={e => handleMedChange(idx, 'instructions', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Paramètres de Surveillance & Suivi
                </label>
                <input
                  type="text"
                  placeholder="Ex: PA et FC toutes les 15 min, ECG, SpO2"
                  value={newMonitoring}
                  onChange={e => setNewMonitoring(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Enregistrer la CAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
