/* ============================================================
   SEED — a brand new installation.

   This is everything a fresh platform contains on the very first
   morning: one account, and some sensible defaults. No agencies,
   no clients, no staff, no history. Dawn creates all of that.

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

  /* Nothing else exists yet. */
  agencies:    [],

  /* One worked example, so the shape of a programme is obvious.
     Its agency is filled in as soon as the first agency is created.
     Everything else — COMP, the Mississippi programme — the client adds. */
  programmes: [
    {
      id: 'p-now',
      name: 'NOW',
      fullName: 'New Options Waiver',
      agency: null,
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
  caregivers:  [],
  credentials: {},
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
