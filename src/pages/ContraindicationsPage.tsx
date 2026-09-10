import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Pill,
  Heart,
  Baby,
  Activity,
  AlertOctagon,
  Flame,
  ArrowRight,
  Plus,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';

interface ContraindicationItem {
  id: string;
  drugClass: string;
  genericNames: string[];
  brandNames: string[];
  absoluteContraindications: string[];
  relativeContraindications: string[];
  majorInteractions: string[];
  organRisks: {
    renal?: string;
    hepatic?: string;
    cardiac?: string;
    pregnancy?: string;
  };
  clinicalAdvice: string;
}

const CONTRAINDICATION_DATABASE: ContraindicationItem[] = [
  {
    id: 'ci-nsaids',
    drugClass: 'AINS (Anti-Inflammatoires Non Stéroïdiens)',
    genericNames: ['Ibuprofène', 'Kétoprofène', 'Diclofénac', 'Naproxène', 'Célécoxib'],
    brandNames: ['Advil', 'Bi-Profenid', 'Voltarène', 'Apranax', 'Celebrex'],
    absoluteContraindications: [
      'Grossesse à partir du 6ème mois (24 SA) - Risque de fermeture prématurée du canal artériel et insuffisance rénale foetale',
      'Ulcère gastro-duodénal évolutif ou antécédent d’hémorragie digestive sous AINS',
      'Insuffisance rénale sévère (ClCr < 30 mL/min)',
      'Insuffisance cardiaque sévère non contrôlée (NYHA III-IV)',
      'Insuffisance hépatocellulaire sévère',
      'Antécédent d’asthme ou allergie déclenché par AINS ou Aspirine (Syndrome de Widal)'
    ],
    relativeContraindications: [
      'Sujet âgé > 65 ans (surveillance fonction rénale et tolérance digestive)',
      'Infection bactérienne évolutive non couverte (risque de masquage des symptômes et fasciite nécrosante)',
      'Hypertension artérielle mal équilibrée',
      'Antécédent d’ulcère gastrique non compliqué'
    ],
    majorInteractions: [
      'AVK / AOD (Warfarine, Eliquis, Xarelto) : Risque hémorragique majeur',
      'Méthotrexate à forte dose : Risque d’aplasie médullaire par diminution de l’élimination rénale',
      'Lithium : Risque de surdosage toxique en lithium',
      'IEC / ARA II + Diurétiques : Trithérapie toxique ("Triple Whammy" - Risque d’insuffisance rénale aiguë)'
    ],
    organRisks: {
      renal: 'Diminution de la synthèse de prostaglandines vasodilatatrices rénales → Décompensation rénale aiguë',
      hepatic: 'Hépatite médicamenteuse rare mais possible (surveillance ALAT/ASAT)',
      cardiac: 'Rétention hydrosodée, élévation tensionnelle, risque thromboembolique artériel (surtout Coxibs et Diclofénac)',
      pregnancy: 'Formellement contre-indiqué dès 24 SA (même prise unique).'
    },
    clinicalAdvice: 'Prescrire la dose minimale efficace pour la durée la plus courte possible. Co-prescrire un IPP si patient > 65 ans ou facteurs de risque digestifs.'
  },
  {
    id: 'ci-acei-arb',
    drugClass: 'IEC & ARA II (Inhibiteurs du Système Rénine-Angiotensine)',
    genericNames: ['Ramipril', 'Périndopril', 'Énalapril', 'Losartan', 'Valsartan', 'Candésartan'],
    brandNames: ['Triatec', 'Coversyl', 'Renitec', 'Cozaar', 'Tareg', 'Kenzen'],
    absoluteContraindications: [
      'Grossesse (2e et 3e trimestres) : Fœtotoxicité rénale, oligohydramnios, mort fœtale',
      'Antécédent d’angio-œdème / Œdème de Quincke sous IEC ou héréditaire',
      'Sténose bilatérale des artères rénales (ou sténose sur rein unique)',
      'Hyperkaliémie sévère (> 5.5 mmol/L)',
      'Association IEC + ARA II (ou Aliskiren chez le diabétique)'
    ],
    relativeContraindications: [
      'Insuffisance rénale pré-rénale / Déshydratation aiguë',
      'Sténose aortique serrée ou cardiomyopathie obstructive',
      'Association avec épargnants de potassium (Spironolactone)'
    ],
    majorInteractions: [
      'Diurétiques épargneurs de K+ (Spironolactone) & sels de potassium : Hyperkaliémie menaçante',
      'AINS : Insuffisance rénale aiguë par baisse de la filtration glomérulaire',
      'Lithium : Diminution de l’excrétion du lithium avec toxicité'
    ],
    organRisks: {
      renal: 'Baisse de la pression de filtration glomérulaire par vasodilatation artériolaire efférente',
      cardiac: 'Hypotension de première dose, surveillance kaliémie',
      pregnancy: 'Tératogène et fœtotoxique : arrêt impératif dès le diagnostic de grossesse.'
    },
    clinicalAdvice: 'Contrôle ionogramme sanguin et créatininémie avant introduction puis à J7-J14. Tolérance d’une hausse de créatinine jusqu’à 25%.'
  },
  {
    id: 'ci-beta-blockers',
    drugClass: 'Bêta-bloquants',
    genericNames: ['Bisoprolol', 'Métoprolol', 'Aténolol', 'Nébivolol', 'Propranolol', 'Carvédilol'],
    brandNames: ['Cardensiel', 'Séloken', 'Ténormine', 'Temerit', 'Avlocardyl', 'Kredex'],
    absoluteContraindications: [
      'Asthme sévère et bronchopneumopathie chronique obstructive (BPCO) avec composante spastique',
      'Bloc auriculo-ventriculaire du 2e et 3e degré non appareillé',
      'Choc cardiogénique ou insuffisance cardiaque aiguë décompensée',
      'Bradycardie sinusale sévère (< 45-50 bpm)',
      'Maladie du sinus et bloc sino-auriculaire',
      'Angor de Prinzmetal (formes non cardiosélectives)',
      'Syndrome de Raynaud sévère et artériopathie oblitérante des membres inférieurs stade IV'
    ],
    relativeContraindications: [
      'Diabète traité par insuline (masquage des signes d’alarme de l’hypoglycémie sauf sueurs)',
      'Psoriasis (aggravation possible des lésions)',
      'Insuffisance rénale pour les formes à élimination rénale (Aténolol)'
    ],
    majorInteractions: [
      'Vérapamil & Diltiazem (Inhibiteurs calciques bradycardisants) : Risque d’arrêt cardiaque et choc',
      'Amiodarone : Bradycardie sévère et troubles de la conduction',
      'Fingolimod : Bradycardie extrême'
    ],
    organRisks: {
      cardiac: 'Bradycardie, ralentissement dromotrope AV, diminution de l’inotropisme',
      pregnancy: 'Peut entraîner une bradycardie, hypotension ou hypoglycémie fœtale/néonatale.'
    },
    clinicalAdvice: 'Ne jamais interrompre brutalement un traitement bêta-bloquant (risque de rebond hypertensif ou coronarien aigu).'
  },
  {
    id: 'ci-fluoroquinolones',
    drugClass: 'Fluoroquinolones',
    genericNames: ['Ciprofloxacine', 'Lévofloxacine', 'Ofloxacine', 'Moxifloxacine'],
    brandNames: ['Ciflox', 'Tavanic', 'Oflocet', 'Izilox'],
    absoluteContraindications: [
      'Antécédent de tendinite ou rupture tendineuse sous fluoroquinolones',
      'Grossesse et allaitement',
      'Enfant et adolescent en période de croissance (arthropathies des grosses articulations)',
      'Allergie ou hypersensibilité connue aux quinolones',
      'Déficit en G6PD (risque d’hémolyse aiguë)',
      'Allongement congénital ou acquis de l’intervalle QT (Moxifloxacine)'
    ],
    relativeContraindications: [
      'Sujet âgé > 65 ans sous corticothérapie concomitante (risque majeur de rupture du tendon d’Achille)',
      'Insuffisance rénale (nécessite une adaptation posologique stricte)',
      'Épilepsie ou seuil épileptogène abaissé (neurotoxicité)',
      'Myasthénie grave (aggravation de la faiblesse musculaire)'
    ],
    majorInteractions: [
      'Médicaments allongeant le QT (Amiodarone, Sotalol, Macrolides, Neuroleptiques) : Risque de Torsades de Pointes',
      'Corticoïdes oraux : Multiplication par 5 du risque de rupture tendineuse',
      'Antiacides (Aluminium, Magnésium, Fer, Calcium) : Chélation et inefficacité antibiotique'
    ],
    organRisks: {
      cardiac: 'Allongement du QT, risque de dissection aortique ou anévrisme aortique',
      renal: 'Néphrite interstitielle immuno-allergique',
      pregnancy: 'Toxicité ostéo-cartilagineuse fœtale prouvée.'
    },
    clinicalAdvice: 'Informer immédiatement le patient d’arrêter le traitement et de consulter en cas de douleur ou gonflement au tendon d’Achille.'
  },
  {
    id: 'ci-macrolides',
    drugClass: 'Macrolides',
    genericNames: ['Azithromycine', 'Clarithromycine', 'Érythromycine', 'Spiramycine'],
    brandNames: ['Zithromax', 'Naxy', 'Érythrocycline', 'Rovamycine'],
    absoluteContraindications: [
      'Association formelle avec alcaloïdes de l’ergot de seigle (Ergotamine, Dihydroergotamine) : Risque d’ergotisme et nécrose des extrémités',
      'Association avec dérivés de la Colchicine (Clarithromycine) : Risque de décès par toxicité colchicinique',
      'Allongement du QT documenté ou torsades de pointes',
      'Insuffisance hépatique sévère'
    ],
    relativeContraindications: [
      'Bradycardie < 50 bpm ou cardiopathie ischémique',
      'Hypokaliémie ou hypomagnésémie non corrigée'
    ],
    majorInteractions: [
      'Statines (Simvastatine, Atorvastatine) : Inhibition du CYP3A4 → Rhabdomyolyse aiguë sévère',
      'Colchicine : Toxicité neuromusculaire mortelle',
      'Anticoagulants oraux : Majoration de l’effet anticoagulant'
    ],
    organRisks: {
      cardiac: 'Allongement du QT et troubles du rythme ventriculaire',
      hepatic: 'Cholestase hépatique et ictère immuno-allergique'
    },
    clinicalAdvice: 'Toujours vérifier les interactions avec les statines et la colchicine avant toute prescription de Clarithromycine.'
  },
  {
    id: 'ci-metformin',
    drugClass: 'Biguanides (Metformine)',
    genericNames: ['Metformine'],
    brandNames: ['Glucophage', 'Stagid'],
    absoluteContraindications: [
      'Insuffisance rénale sévère avec débit de filtration glomérulaire (DFG) < 30 mL/min',
      'Acidose métabolique aiguë ou antécédent d’acidose lactique',
      'Insuffisance cardiaque décompensée ou choc cardiogénique',
      'Insuffisance respiratoire sévère (hypoxie tissulaire)',
      'Insuffisance hépatocellulaire sévère',
      'Alcoolisme aigu ou chronique',
      'Infection sévère ou sepsis (choc septique)'
    ],
    relativeContraindications: [
      'DFG compris entre 30 et 44 mL/min (adapter la dose à 1000 mg/j max, surveillance rapprochée)',
      'Sujet très âgé dénutri',
      'Déshydratation aiguë (diarrhée, vomissements)'
    ],
    majorInteractions: [
      'Produits de contraste iodés (scanner) : Suspendre la metformine 48h avant ou au moment de l’examen, et reprendre après 48h si fonction rénale stable',
      'Alcool à jeun : Risque accru d’acidose lactique',
      'Diurétiques de l’anse : Risque de déshydratation et insuffisance rénale aiguë'
    ],
    organRisks: {
      renal: 'Accumulation du produit en cas de baisse du DFG → Acidose lactique létale',
      hepatic: 'Baisse de la clairance hépatique du lactate'
    },
    clinicalAdvice: 'Arrêter impérativement la metformine en cas de fièvre élevée, déshydratation, chirurgie programmée ou injection de produit de contraste iodé.'
  },
  {
    id: 'ci-statins',
    drugClass: 'Statines (Inhibiteurs de l’HMG-CoA Réductase)',
    genericNames: ['Atorvastatine', 'Rosuvastatine', 'Simvastatine', 'Pravastatine'],
    brandNames: ['Tahor', 'Crestor', 'Zocor', 'Elisor'],
    absoluteContraindications: [
      'Hépatopathie évolutive ou élévation inexpliquée et persistante des transaminases (> 3x la limite normale)',
      'Grossesse et allaitement (effet tératogène potentiel sur le développement du SNC fœtal)',
      'Myopathie active ou antécédent de toxicité musculaire sous statine',
      'Association avec inhibiteurs puissants du CYP3A4 pour la Simvastatine'
    ],
    relativeContraindications: [
      'Insuffisance rénale sévère (adapter les doses)',
      'Consommation excessive d’alcool',
      'Hypothyroïdie non contrôlée (augmente le risque de rhabdomyolyse)',
      'Sujet âgé > 75 ans avec comorbidités'
    ],
    majorInteractions: [
      'Fibrates (surtout Gemfibrozil) : Risque massif de rhabdomyolyse',
      'Macrolides (Clarithromycine, Érythromycine) : Inhibition du métabolisme',
      'Antifongiques azolés (Itraconazole, Kétoconazole) : Majoration des concentrations plasmatiques',
      'Jus de pamplemousse à forte dose (> 1L/j)'
    ],
    organRisks: {
      hepatic: 'Élévation des transaminases hépatiques',
      pregnancy: 'Contre-indiqué chez la femme en âge de procréer sans contraception efficace.'
    },
    clinicalAdvice: 'Doser CPK en cas de douleurs musculaires inexpliquées. Arrêter le traitement si CPK > 5x la limite supérieure normale.'
  },
  {
    id: 'ci-corticosteroids',
    drugClass: 'Corticoïdes par voie générale',
    genericNames: ['Prednisone', 'Prednisolone', 'Méthylprednisolone', 'Dexaméthasone'],
    brandNames: ['Cortancyl', 'Solupred', 'Médrol', 'Soludécadron'],
    absoluteContraindications: [
      'Tout état infectieux non contrôlé (bactérien, fongique, parasitaire ou viral actif)',
      'Virose en évolution (notamment hépatites aiguës, herpès oculaire, varicelle)',
      'États psychotiques aigus non contrôlés par un traitement',
      'Vaccins vivants atténués (Fièvre jaune, ROR, Varicelle, BCG) lors de doses immunosuppressives'
    ],
    relativeContraindications: [
      'Ulcère gastro-duodénal évolutif',
      'Diabète mal équilibré (effet hyperglycémiant majeur)',
      'Hypertension artérielle sévère',
      'Ostéoporose sévère',
      'Glaucome ou cataracte'
    ],
    majorInteractions: [
      'AINS : Risque ulcérogène et hémorragique décuplé',
      'Hypokaliémiants (Diurétiques thiazidiques et de l’anse, Laxatifs stimulants) : Risque d’hypokaliémie sévère',
      'Médicaments allongeant le QT : Risque de torsades de pointes par hypokaliémie'
    ],
    organRisks: {
      cardiac: 'Rétention hydrosodée, poussée hypertensive',
      renal: 'Hypokaliémie par fuite rénale de potassium',
      pregnancy: 'Surveillance glycémique et tensionnelle maternelle.'
    },
    clinicalAdvice: 'Prescrire le matin pour respecter le rythme circadien du cortisol. Régime pauvre en sel et en sucres rapides si cure prolongée.'
  },
  {
    id: 'ci-anticoagulants',
    drugClass: 'Anticoagulants Oraux Directs (AOD) & AVK',
    genericNames: ['Apixaban', 'Rivaroxaban', 'Dabigatran', 'Warfarine', 'Acénocoumarol'],
    brandNames: ['Eliquis', 'Xarelto', 'Pradaxa', 'Coumadine', 'Sintrom'],
    absoluteContraindications: [
      'Saignement évolutif cliniquement significatif ou lésion organique susceptible de saigner',
      'Insuffisance hépatique sévère associée à une coagulopathie et à un risque de saignement cliniquement significatif',
      'Insuffisance rénale terminale (ClCr < 15 mL/min pour AOD)',
      'Porteurs de valves cardiaques mécaniques (les AOD sont formellement contre-indiqués, seuls les AVK sont autorisés)',
      'Grossesse et allaitement (effet tératogène majeur pour les AVK, passage placentaire pour les AOD)'
    ],
    relativeContraindications: [
      'Hypertension artérielle sévère non contrôlée (PAS > 180 mmHg ou PAD > 110 mmHg)',
      'Antécédent d’hémorragie intracrânienne non anévrismale récente',
      'Insuffisance rénale modérée à sévère (ClCr 15-29 mL/min : adaptation stricte de posologie)',
      'Poids extrême (< 50 kg ou > 120 kg : surveillance renforcée)'
    ],
    majorInteractions: [
      'AINS et Aspirine : Risque hémorragique digestif et intracrânien très accru',
      'Inhibiteurs puissants du CYP3A4 et de la P-glycoprotéine (Kétoconazole, Itraconazole, Ritonavir) : Surdosage toxique',
      'Inducteurs puissants enzymatiques (Rifampicine, Millepertuis, Carbamazépine) : Inefficacité thérapeutique et risque de thrombose'
    ],
    organRisks: {
      renal: 'Accumulation rénale du Dabigatran (80% d’élimination rénale) et risque d’hémorragie fatale',
      hepatic: 'Contre-indiqué en cas de cirrhose Child-Pugh B ou C',
      pregnancy: 'Tératogénicité avérée des AVK (chondrodysplasie fœtale punctata).'
    },
    clinicalAdvice: 'Contrôler la fonction rénale au moins 1 fois par an, et tous les 3-6 mois si ClCr < 60 mL/min ou chez le sujet âgé.'
  },
  {
    id: 'ci-antidepressants-ssri',
    drugClass: 'Antidépresseurs ISRS & IRSN',
    genericNames: ['Sertraline', 'Escitalopram', 'Fluoxétine', 'Paroxétine', 'Venlafaxine', 'Duloxétine'],
    brandNames: ['Zoloft', 'Seroplex', 'Prozac', 'Deroxat', 'Effexor', 'Cymbalta'],
    absoluteContraindications: [
      'Association avec les IMAO non sélectifs (Iproniazide) : Risque d’arrêt cardiaque par syndrome sérotoninergique mortel (respecter 14 jours de fenêtre)',
      'Allongement congénital ou acquis de l’intervalle QT (Escitalopram, Citalopram)',
      'Antécédent de virage maniaque ou trouble bipolaire non stabilisé par un thymorégulateur',
      'Glaucome à angle fermé non traité (IRSN : effet anticholinergique mydriatique)'
    ],
    relativeContraindications: [
      'Sujet âgé avec risque d’hyponatrémie par SIADH (Sécrétion Inappropriée d’Hormone Antidiurétique)',
      'Épilepsie instable ou antécédent de crises convulsives',
      'Ulcère digestif ou trouble de l’hémostase (inhibition du recaptage de sérotonine plaquettaire)'
    ],
    majorInteractions: [
      'Tramadol, Triptans, Fentanyl, Millepertuis : Syndrome sérotoninergique sévère (hyperthermie, myoclonies, agitation, confusion)',
      'Anticoagulants et AINS : Majoration du risque de saignement cutanéo-muqueux',
      'Médicaments torsadogènes : Risque de torsades de pointes'
    ],
    organRisks: {
      cardiac: 'Allongement de l’intervalle QTc doso-dépendant (Citalopram, Escitalopram), HTA pour la Venlafaxine à forte dose',
      pregnancy: 'Risque d’hypertension artérielle pulmonaire persistante du nouveau-né (HTAPN).'
    },
    clinicalAdvice: 'Surveillance rapprochée les premières semaines (risque de levée d’inhibition motrice avant l’amélioration de l’humeur avec passage à l’acte suicidaire). Ionogramme sanguin chez la personne âgée.'
  },
  {
    id: 'ci-ppi',
    drugClass: 'Inhibiteurs de la Pompe à Protons (IPP)',
    genericNames: ['Oméprazole', 'Ésoméprazole', 'Pantoprazole', 'Rabéprazole', 'Lansoprazole'],
    brandNames: ['Mopral', 'Inexium', 'Eupantol', 'Pariet', 'Ogast'],
    absoluteContraindications: [
      'Hypersensibilité avérée aux dérivés benzimidazolés',
      'Association avec Atazanavir ou Nelfinavir (diminution drastique des concentrations d’antirétroviraux)'
    ],
    relativeContraindications: [
      'Hypomagnésémie préexistante non corrigée',
      'Ostéoporose sévère fracturaire (au long cours : diminution de l’absorption calcique)',
      'Antécédent de néphrite interstitielle immuno-allergique aiguë sous IPP'
    ],
    majorInteractions: [
      'Clopidogrel (Plavix) : L’Oméprazole et l’Ésoméprazole inhibent le CYP2C19 et réduisent l’activation du Clopidogrel (préférer le Pantoprazole)',
      'Méthotrexate à haute dose : Diminution de l’élimination rénale du méthotrexate et toxicité sévère',
      'Médicaments à absorption pH-dépendante (Kétoconazole, Fer per os, Tyrosine kinase inhibiteurs)'
    ],
    organRisks: {
      renal: 'Néphrite interstitielle aiguë immuno-allergique (souvent sous-diagnostiquée)',
      hepatic: 'En cas d’insuffisance hépatique sévère, plafonner la dose à 20 mg/j'
    },
    clinicalAdvice: 'Réévaluer périodiquement la pertinence du traitement au long cours. Ne pas prolonger au-delà de 4-8 semaines sans indication formelle pour éviter les infections digestives à Clostridioides difficile.'
  },
  {
    id: 'ci-aminoglycosides',
    drugClass: 'Aminosides',
    genericNames: ['Gentamicine', 'Amikacine', 'Tobramycine'],
    brandNames: ['Gentalline', 'Amiklin', 'Nebcine'],
    absoluteContraindications: [
      'Myasthénie grave (aggravation du bloc neuromusculaire curarisant avec paralysie respiratoire)',
      'Allergie avérée aux aminosides',
      'Perforation tympanique (pour les formes auriculaires locales)'
    ],
    relativeContraindications: [
      'Insuffisance rénale pré-existante (nécessite une adaptation rigoureuse des intervalles posologiques)',
      'Hypoacousie ou troubles vestibulaires pré-existants',
      'Grossesse (ototoxicité fœtale et surdité congénitale possible)'
    ],
    majorInteractions: [
      'Diurétiques de l’anse (Furosémide IV) : Synergie ototoxique et néphrotoxique redoutable',
      'Autres néphrotoxiques (Cisplatine, Vancomycine, Amphotéricine B, Ciclosporine) : Risque élevé de nécrose tubulaire aiguë',
      'Curarisants : Potentialisation du blocage neuromusculaire'
    ],
    organRisks: {
      renal: 'Néphrotoxicité tubulaire dose-dépendante réversible si arrêt précoce',
      pregnancy: 'Risque de surdité cochléo-vestibulaire fœtale irréversible.'
    },
    clinicalAdvice: 'Privilégier l’administration en monodose journalière unique (pic élevé bactéricide et vallée résiduelle basse non toxique). Doser la concentration résiduelle avant la 2e ou 3e injection.'
  },
  {
    id: 'ci-calcium-channel-blockers',
    drugClass: 'Inhibiteurs Calciques',
    genericNames: ['Amlodipine', 'Félodipine', 'Lercanidipine', 'Vérapamil', 'Diltiazem'],
    brandNames: ['Amlor', 'Flodil', 'Loxen', 'Isoptine', 'Tildiem'],
    absoluteContraindications: [
      'Pour Vérapamil et Diltiazem : Insuffisance cardiaque avec altération de la fraction d’éjection ventriculaire gauche (FEVG < 40%) - Effet inotrope négatif prononcé',
      'Bloc auriculo-ventriculaire du 2e et 3e degré sans stimulateur cardiaque (Vérapamil, Diltiazem)',
      'Dysfonction sinusale et bradycardie sévère (< 50 bpm) pour les non-dihydropyridines',
      'Choc cardiogénique et hypotension artérielle sévère',
      'Sténose aortique serrée symptomatique (pour les dihydropyridines d’action rapide)'
    ],
    relativeContraindications: [
      'Insuffisance hépatique sévère (ralentissement métabolique)',
      'Reflux gastro-œsophagien sévère (relaxation du sphincter inférieur de l’œsophage)'
    ],
    majorInteractions: [
      'Bêta-bloquants + Vérapamil/Diltiazem IV : Risque majeur de bradycardie extrême, bloc AV complet et asystolie',
      'Statines (Simvastatine) + Vérapamil/Diltiazem : Augmentation du risque de rhabdomyolyse (doses de statines à plafonner)',
      'Inhibiteurs puissants du CYP3A4 : Majoration de l’hypotension'
    ],
    organRisks: {
      cardiac: 'Ralentissement de la conduction AV (Vérapamil/Diltiazem), œdèmes malléolaires par vasodilatation précapillaire (Amlodipine)'
    },
    clinicalAdvice: 'Les œdèmes des membres inférieurs sous Amlodipine sont d’origine hémodynamique et non hydrosodée : ils ne répondent pas aux diurétiques.'
  },
  {
    id: 'ci-benzodiazepines',
    drugClass: 'Benzodiazépines & Molécules Apparentées',
    genericNames: ['Diazépam', 'Lorazépam', 'Alprazolam', 'Oxazépam', 'Zolpidem', 'Zopiclone'],
    brandNames: ['Valium', 'Témesta', 'Xanax', 'Seresta', 'Stilnox', 'Imovane'],
    absoluteContraindications: [
      'Insuffisance respiratoire sévère décompensée (dépression respiratoire centrale)',
      'Syndrome d’apnées du sommeil non appareillé (SAOS)',
      'Myasthénie grave (aggravation de la faiblesse musculaire)',
      'Insuffisance hépatique sévère aiguë ou chronique (risque de précipitation d’une encéphalopathie hépatique)'
    ],
    relativeContraindications: [
      'Sujet âgé : Risque majeur de sédation résiduelle diurne, confusion, troubles mnésiques et chutes avec fractures',
      'Antécédent de dépendance médicamenteuse ou d’addiction alcoolique',
      'Femme enceinte (notamment au 3e trimestre : hypotonie, détresse respiratoire et syndrome de sevrage néonatal)'
    ],
    majorInteractions: [
      'Opioïdes (Morphine, Fentanyl, Oxycodone, Méthadone) : Risque létal de dépression respiratoire et arrêt respiratoire',
      'Alcool (éthanol) : Majoration sédative majeure imprévisible et amnésie antérograde',
      'Autres sédatifs et antihistaminiques H1 sédatifs : Somnolence diurne et baisse de vigilance'
    ],
    organRisks: {
      hepatic: 'En cas d’hépatopathie, préférer l’Oxazépam (élimination par glucuroconjugaison directe sans métabolites actifs)'
    },
    clinicalAdvice: 'Prescription limitée à 12 semaines pour les anxiolytiques et 4 semaines pour les hypnotiques. Toujours planifier un arrêt progressif par paliers pour prévenir le syndrome de sevrage.'
  }
];

export function ContraindicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Custom Contraindications state with persistence
  const [customItems, setCustomItems] = useState<ContraindicationItem[]>(() => {
    try {
      const saved = localStorage.getItem('ordocare_custom_contraindications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal State for adding a new contraindication
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDrugClass, setNewDrugClass] = useState('');
  const [newGenericNames, setNewGenericNames] = useState('');
  const [newBrandNames, setNewBrandNames] = useState('');
  const [newAbsoluteCI, setNewAbsoluteCI] = useState('');
  const [newRelativeCI, setNewRelativeCI] = useState('');
  const [newMajorInteractions, setNewMajorInteractions] = useState('');
  const [newRenalRisk, setNewRenalRisk] = useState('');
  const [newHepaticRisk, setNewHepaticRisk] = useState('');
  const [newCardiacRisk, setNewCardiacRisk] = useState('');
  const [newPregnancyRisk, setNewPregnancyRisk] = useState('');
  const [newClinicalAdvice, setNewClinicalAdvice] = useState('');

  const allItems = [...customItems, ...CONTRAINDICATION_DATABASE];

  const filteredItems = allItems.filter(item => {
    const matchesSearch =
      item.drugClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genericNames.some(n => n.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.brandNames.some(b => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.absoluteContraindications.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.relativeContraindications.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = selectedClass === 'all' || item.id === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleSaveCustomCI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugClass.trim()) return;

    const newItem: ContraindicationItem = {
      id: `custom-ci-${Date.now()}`,
      drugClass: newDrugClass.trim(),
      genericNames: newGenericNames
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      brandNames: newBrandNames
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      absoluteContraindications: newAbsoluteCI
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      relativeContraindications: newRelativeCI
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      majorInteractions: newMajorInteractions
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      organRisks: {
        renal: newRenalRisk.trim() || undefined,
        hepatic: newHepaticRisk.trim() || undefined,
        cardiac: newCardiacRisk.trim() || undefined,
        pregnancy: newPregnancyRisk.trim() || undefined
      },
      clinicalAdvice:
        newClinicalAdvice.trim() ||
        'Surveillance clinique et biologique rapprochée lors de l’instauration.'
    };

    const updated = [newItem, ...customItems];
    setCustomItems(updated);
    try {
      localStorage.setItem('ordocare_custom_contraindications', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save to localStorage', err);
    }

    // Reset form
    setNewDrugClass('');
    setNewGenericNames('');
    setNewBrandNames('');
    setNewAbsoluteCI('');
    setNewRelativeCI('');
    setNewMajorInteractions('');
    setNewRenalRisk('');
    setNewHepaticRisk('');
    setNewCardiacRisk('');
    setNewPregnancyRisk('');
    setNewClinicalAdvice('');
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomItem = (id: string) => {
    const updated = customItems.filter(item => item.id !== id);
    setCustomItems(updated);
    try {
      localStorage.setItem('ordocare_custom_contraindications', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save to localStorage', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0d2f3f] text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-rose-400/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              Sécurité Prescription & Iatrogénie
            </span>
            <span className="text-xs text-teal-200/80 font-medium">Référentiel Thérapeutique</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Contre-indications & Risques Médicamenteux
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Consultez et enrichissez les contre-indications absolues et relatives, interactions majeures, fœtotoxicité et seuils d’adaptation d'organes (rein, foie, cœur).
          </p>
        </div>

        {/* Add New Contraindication Action */}
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-[#0d2f3f] text-xs sm:text-sm font-bold shadow-lg shadow-teal-950/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Contre-indication</span>
          </button>
        </div>

        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-teal-500/10 rounded-full pointer-events-none" />
      </div>

      {/* Catalog View */}
      <div className="space-y-5">
        {/* Search & Class Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par molécule, marque ou pathologie..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 font-medium text-slate-800"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-teal-500"
            >
              <option value="all">Toutes les classes médicamenteuses ({allItems.length})</option>
              {allItems.map(c => (
                <option key={c.id} value={c.id}>
                  {c.drugClass}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">Aucune contre-indication trouvée pour cette recherche.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('all');
                }}
                className="mt-2 text-xs text-teal-600 font-bold hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredItems.map(item => {
              const isCustom = item.id.startsWith('custom-ci-');
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:border-teal-400/60 transition-all space-y-4"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Pill className="w-4 h-4 text-teal-600" />
                          <span>{item.drugClass}</span>
                        </h3>
                        {isCustom && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                            Ajout Personnalisé
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.genericNames.map((g, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60"
                          >
                            {g}
                          </span>
                        ))}
                        {item.brandNames.map((b, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isCustom && (
                      <button
                        onClick={() => handleDeleteCustomItem(item.id)}
                        className="self-start sm:self-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Supprimer cette contre-indication personnalisée"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Grid of Absolute & Relative */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    {/* Absolute Contraindications */}
                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold uppercase tracking-wider text-[11px]">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Contre-indications Absolues (Strictement Interdit)</span>
                      </div>
                      {item.absoluteContraindications.length > 0 ? (
                        <ul className="space-y-1.5 list-disc list-inside text-rose-950/90 font-medium">
                          {item.absoluteContraindications.map((ci, idx) => (
                            <li key={idx} className="leading-snug">{ci}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-400 italic">Aucune mentionnée.</p>
                      )}
                    </div>

                    {/* Relative & Major Interactions */}
                    <div className="space-y-4">
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold uppercase tracking-wider text-[11px]">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Précautions d'emploi & Contre-indications Relatives</span>
                        </div>
                        {item.relativeContraindications.length > 0 ? (
                          <ul className="space-y-1.5 list-disc list-inside text-amber-950/90 font-medium">
                            {item.relativeContraindications.map((ci, idx) => (
                              <li key={idx} className="leading-snug">{ci}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400 italic">Aucune mentionnée.</p>
                        )}
                      </div>

                      {item.majorInteractions.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-orange-600" />
                            Interactions Médicamenteuses Majeures
                          </span>
                          <ul className="space-y-1 text-slate-600 text-[11px]">
                            {item.majorInteractions.map((inter, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-orange-500 font-bold">•</span>
                                <span>{inter}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Organ Safety & Advice */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.organRisks.renal && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          Rein: {item.organRisks.renal.slice(0, 45)}...
                        </span>
                      )}
                      {item.organRisks.hepatic && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                          Foie: {item.organRisks.hepatic.slice(0, 45)}...
                        </span>
                      )}
                      {item.organRisks.cardiac && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-semibold border border-rose-200">
                          Cœur: {item.organRisks.cardiac.slice(0, 45)}...
                        </span>
                      )}
                      {item.organRisks.pregnancy && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold border border-rose-200">
                          Grossesse: {item.organRisks.pregnancy}
                        </span>
                      )}
                    </div>
                    {item.clinicalAdvice && (
                      <p className="text-slate-500 italic text-[11px]">
                        <strong>Règle clinique :</strong> {item.clinicalAdvice}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Ajouter une Contre-indication */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ajouter une Nouvelle Contre-indication
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enrichissez le référentiel thérapeutique de votre cabinet.
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

            <form onSubmit={handleSaveCustomCI} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Classe Médicamenteuse ou Molécule *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fluoroquinolones (Ciprofloxacine, Lévofloxacine)"
                  value={newDrugClass}
                  onChange={e => setNewDrugClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-hidden focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    DCI / Noms Génériques (séparés par virgules)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ciprofloxacine, Ofloxacine, Lévofloxacine"
                    value={newGenericNames}
                    onChange={e => setNewGenericNames(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Marques / Spécialités (séparées par virgules)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ciflox, Tavanic, Oflocet"
                    value={newBrandNames}
                    onChange={e => setNewBrandNames(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-rose-700 mb-1">
                  Contre-indications Absolues (une par ligne) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Antécédent de tendinopathie sous fluoroquinolones&#10;Grossesse et allaitement&#10;Enfant et adolescent en période de croissance"
                  value={newAbsoluteCI}
                  onChange={e => setNewAbsoluteCI(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/40 text-slate-900 focus:outline-hidden focus:border-rose-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-700 mb-1">
                  Contre-indications Relatives & Précautions (une par ligne)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sujet âgé sous corticothérapie (sur-risque de rupture tendineuse)&#10;Allongement de l'intervalle QTc"
                  value={newRelativeCI}
                  onChange={e => setNewRelativeCI(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50/40 text-slate-900 focus:outline-hidden focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Interactions Médicamenteuses Majeures (une par ligne)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Corticoïdes : Risque de rupture du tendon d'Achille&#10;Antiarythmiques de classe Ia et III : Risque de Torsades de Pointes"
                  value={newMajorInteractions}
                  onChange={e => setNewMajorInteractions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Risque Rénal / Adaptation
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Adaptation posologique selon le DFG"
                    value={newRenalRisk}
                    onChange={e => setNewRenalRisk(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Risque Grossesse / Allaitement
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Contre-indiqué (risque d'atteinte cartilagineuse)"
                    value={newPregnancyRisk}
                    onChange={e => setNewPregnancyRisk(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Conseil / Recommandation Clinique
                </label>
                <input
                  type="text"
                  placeholder="Ex: Arrêter immédiatement le traitement en cas de douleur ou gonflement tendineux."
                  value={newClinicalAdvice}
                  onChange={e => setNewClinicalAdvice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white"
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
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  Enregistrer la Contre-indication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
