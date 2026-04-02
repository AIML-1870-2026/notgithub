/* ════════════════════════════════════════════════════════
   config.js — App-wide constants and drug class definitions
   ════════════════════════════════════════════════════════ */

export const CONFIG = {
  FDA_BASE: 'https://api.fda.gov',

  ADVERSE_LIMIT:    10,
  RECALL_LIMIT:     100,
  AUTOCOMPLETE_LIMIT: 8,
  DEBOUNCE_MS:      280,
  MIN_SEARCH_CHARS: 2,

  /* Chart.js / D3 color palette (mirrors CSS custom properties) */
  COLORS: {
    accent:        '#007AFF',
    accentDim:     'rgba(0, 122, 255, 0.15)',
    accentMid:     'rgba(0, 122, 255, 0.55)',
    drugA:         '#007AFF',
    drugADim:      'rgba(0, 122, 255, 0.15)',
    drugB:         '#FF9500',
    drugBDim:      'rgba(255, 149, 0, 0.15)',
    recallI:       '#FF3B30',
    recallIBg:     'rgba(255, 59, 48,  0.10)',
    recallII:      '#FF9500',
    recallIIBg:    'rgba(255, 149, 0,  0.10)',
    recallIII:     '#34C759',
    recallIIIBg:   'rgba(52, 199, 89,  0.10)',
    textPrimary:   '#1D1D1F',
    textSecondary: '#6E6E73',
    textTertiary:  '#AEAEB2',
    border:        'rgba(0,0,0,0.08)',
    gridLine:      'rgba(0,0,0,0.05)',
  },

  /* Drug classes: key → { label, pharmClass EPC string, representative drugs } */
  DRUG_CLASSES: {
    ssri: {
      label: 'SSRIs',
      pharmClass: 'Selective Serotonin Reuptake Inhibitor [EPC]',
      drugs: ['FLUOXETINE', 'SERTRALINE', 'PAROXETINE', 'ESCITALOPRAM', 'CITALOPRAM'],
    },
    statin: {
      label: 'Statins',
      pharmClass: 'HMG-CoA Reductase Inhibitor [EPC]',
      drugs: ['ATORVASTATIN', 'SIMVASTATIN', 'ROSUVASTATIN', 'PRAVASTATIN', 'LOVASTATIN'],
    },
    ace: {
      label: 'ACE Inhibitors',
      pharmClass: 'Angiotensin-Converting Enzyme Inhibitor [EPC]',
      drugs: ['LISINOPRIL', 'ENALAPRIL', 'RAMIPRIL', 'CAPTOPRIL', 'BENAZEPRIL'],
    },
    nsaid: {
      label: 'NSAIDs',
      pharmClass: 'Nonsteroidal Anti-inflammatory Drug [EPC]',
      drugs: ['IBUPROFEN', 'NAPROXEN', 'CELECOXIB', 'DICLOFENAC', 'MELOXICAM'],
    },
    betablocker: {
      label: 'Beta Blockers',
      pharmClass: 'beta-Adrenergic Blocker [EPC]',
      drugs: ['METOPROLOL', 'ATENOLOL', 'CARVEDILOL', 'PROPRANOLOL', 'BISOPROLOL'],
    },
  },

  /* Help modal content keyed by data-help attribute values */
  HELP_CONTENT: {
    faers: {
      icon: '📊',
      title: 'About FAERS Data',
      body: `<p>The <strong>FDA Adverse Event Reporting System (FAERS)</strong> is a voluntary database of adverse event reports submitted by healthcare professionals, patients, and manufacturers.</p>
             <p>The presence of a report does not prove a drug caused the event — it only means the event occurred while the patient was taking the drug. Report counts are not adjusted for how widely a drug is prescribed.</p>`,
    },
    'adverse-events': {
      icon: '⚕️',
      title: 'What Are Adverse Events?',
      body: `<p>An <strong>adverse event</strong> is any undesirable experience associated with the use of a medicine in a patient. These may range from mild side effects to serious medical conditions.</p>
             <p>Reports are coded using <strong>MedDRA</strong> (Medical Dictionary for Regulatory Activities) terminology, which is a standardized international medical vocabulary.</p>`,
    },
    recalls: {
      icon: '🔔',
      title: 'Drug Recalls',
      body: `<p>A <strong>drug recall</strong> is a voluntary or FDA-directed action to remove a defective or potentially harmful product from the market.</p>
             <p>Recalls can occur due to contamination, incorrect strength, labeling errors, or manufacturing issues. Not all recalls involve direct safety risks to consumers.</p>`,
    },
    'recall-classes': {
      icon: '🏷️',
      title: 'Recall Classification',
      body: `<p><strong style="color:#FF3B30">Class I:</strong> Dangerous or defective products that could cause serious health problems or death.</p>
             <p><strong style="color:#FF9500">Class II:</strong> Products that may cause temporary health problems, or pose a slight threat of a serious nature.</p>
             <p><strong style="color:#34C759">Class III:</strong> Products unlikely to cause adverse health reactions, but that violate FDA labeling or manufacturing regulations.</p>`,
    },
    warnings: {
      icon: '⚠️',
      title: 'Label Warnings',
      body: `<p>FDA-approved drug labels contain warnings about serious adverse reactions and potential safety hazards.</p>
             <p>The most serious is the <strong>Boxed Warning</strong> (also called "Black Box Warning"), indicating a significant risk of serious or life-threatening adverse effects that requires prominent labeling.</p>`,
    },
  },
};
