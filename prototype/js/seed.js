/* ============================================================
   SEED — a brand new installation.

   This is everything a fresh platform contains on the very first
   morning: one account, one agency to hang the first records on,
   and some sensible defaults. No clients, no staff, no history.
   Dawn creates all of that, and can rename or remove Georgia.

   It is pure data, no logic. It lives in a .js file rather than a
   .json one because opening the prototype straight from disk
   (file://) blocks fetch() of .json — a browser security rule, not
   a design choice. The contents are plain JSON.
   ============================================================ */

var SEED = {

  /* The only account that exists. Created when the platform is handed over. */
  users: [
    {
      id: 'u-owner',
      name: 'Dawn Bostock',
      initials: 'DB',
      email: 'dawn.bostock@wecarehomecare.com',
      role: 'superadmin',
      title: 'Owner',
      agency: null,
      status: 'Active',
      password: 'wechc-2026',   /* set at handover; changeable in the real product */
      createdBy: 'Handover',
      createdOn: 'Day one'
    }
  ],

  /* Georgia is set up at handover so the system is usable on the first
     morning. A second agency — Mississippi — is added the same way any
     other would be, and this one can be renamed or removed. */
  agencies: [
    {
      id: 'georgia',
      name: 'We Care Home Care — Georgia',
      short: 'Georgia',
      abbr: 'GA',
      state: 'Georgia',
      seeded: true
    }
  ],

  /* One worked example, so the shape of a programme is obvious.
     It belongs to Georgia, the agency that ships with the platform.
     Everything else — COMP, the Mississippi programme — the client adds. */
  programmes: [
    {
      id: 'p-now',
      name: 'NOW',
      fullName: 'New Options Waiver',
      agency: 'georgia',
      seeded: true,
      docs: [
        { name: 'Signed service agreement',      expires: true,  period: '12 months',        required: true },
        { name: 'Prior authorisation letter',    expires: true,  period: 'per authorisation', required: true },
        { name: 'Individual Service Plan (ISP)', expires: true,  period: '12 months',        required: true },
        { name: 'Physician order for services',  expires: true,  period: '12 months',        required: true },
        { name: 'Annual health assessment',      expires: true,  period: '12 months',        required: true },
        { name: 'Freedom of choice form',        expires: false, period: '—',                required: true },
        { name: 'Rights and responsibilities',   expires: false, period: '—',                required: true },
        { name: 'Emergency contact form',        expires: false, period: '—',                required: true },
        { name: 'Transportation consent',        expires: false, period: '—',                required: false }
      ]
    }
  ],
  clients:     [],
  clientDocs:  [],   /* one row per client per required document */
  caregivers:  [],
  creds:       [],   /* one row per caregiver per requirement */

  /* What every caregiver has to hold. Editable in Settings. */
  credentialTypes: [
    { name: "Driver's licence",  renews: '4 years'  },
    { name: 'CPR / First Aid',   renews: '2 years'  },
    { name: 'Annual training',   renews: '12 months' },
    { name: 'Background check',  renews: '4 years'  }
  ],
  auths:       [],
  usage:       [],
  incidents:   [],
  hosps:       [],
  qi:          [],
  isp:         [],
  oversight:   [],
  tasks:       [],
  audit:       [],

  /* Reminder rules ship with sensible defaults. Every one of them can be
     changed, added to or deleted by the client — no developer needed. */
  reminders: [
    { id:'r-cred',  what:'Caregiver credentials', advance:[60,30,14,7], overdue:'Immediately',   escalate:14, email:true },
    { id:'r-agree', what:'Service agreements',    advance:[90,60,30],   overdue:'Immediately',   escalate:7,  email:true },
    { id:'r-auth',  what:'Prior authorisations',  advance:[60,30,14],   overdue:'Immediately',   escalate:7,  email:true },
    { id:'r-sup',   what:'Supervisor visits',     advance:[14,7],       overdue:'Immediately',   escalate:7,  email:true },
    { id:'r-hrst',  what:'HRST annual review',    advance:[60,30],      overdue:'Immediately',   escalate:14, email:true },
    { id:'r-plan',  what:'Plan reviews',          advance:[30,14],      overdue:'Immediately',   escalate:14, email:false },
    { id:'r-isp',   what:'Monthly ISP entries',   advance:[5],          overdue:'On the 7th',    escalate:7,  email:true },
    { id:'r-task',  what:'Tasks',                 advance:[7],          overdue:'Immediately',   escalate:7,  email:true }
  ],

  /* Defaults that ship with the product. Changeable in Settings. */
  settings: {
    thresholds: {
      qiFromIncidents: 2,
      qiFromHospitalStays: 2,
      budgetAlerts: [75, 90, 100],
      ispDropPoints: 20,
      incidentChaseDays: 7,
      escalateAfterDays: 7,
      nurseVisitAfterDischarge: true
    },
    setupStep: 0
  }
};
