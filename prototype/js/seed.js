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
  programmes:  [],
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

  /* Defaults that ship with the product. Changeable in Settings. */
  settings: {
    reminders: {
      credentials:  [60, 30, 14, 7],
      agreements:   [90, 60, 30],
      authorisations: [60, 30, 14],
      supervisorVisits: [14, 7],
      hrst:         [60, 30],
      plans:        [30, 14],
      tasks:        [7]
    },
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
