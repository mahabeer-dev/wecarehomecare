/* ============================================================
   DEMO DATASET — a populated agency, for showing the client what
   the system looks like once it is in use.

   Loaded only when someone asks for it ("Load demo data").
   A brand new install contains none of this — see seed.js.

   Every person, event and number here is invented.
   ============================================================ */

var DEMO = (function () {

  var AGENCIES = {
    ga: { id: 'ga', name: 'We Care Home Care — Georgia',     short: 'Georgia',     abbr: 'GA', waivers: ['NOW', 'COMP'] },
    ms: { id: 'ms', name: 'We Care Home Care — Mississippi',  short: 'Mississippi', abbr: 'MS', waivers: ['IDD Community Supports'] }
  };

  var USERS = {
    owner: { id: 'owner', name: 'Dawn Bostock',   initials: 'DB', role: 'superadmin', title: 'Owner',            agency: null },
    admin: { id: 'admin', name: 'Renee Alcott',   initials: 'RA', role: 'admin',      title: 'Office Manager',   agency: 'ga' },
    nurse: { id: 'nurse', name: 'Yvonne Pryce',   initials: 'YP', role: 'nurse',      title: 'Registered Nurse', agency: 'ga' }
  };

  /* ---------------- clients ---------------- */

  var CLIENTS = [
    { id:'c1', agency:'ga', name:'Maria Lopez',      dob:'14 Mar 1968', mrn:'GA-10482', waiver:'NOW',
      program:'Community Living Support', status:'Active', since:'Jan 2026', coord:'Renee Alcott',
      agreement:{ start:'01 Jan 2026', end:'31 Dec 2026', status:'Current' } },

    { id:'c2', agency:'ga', name:'Curtis Nabors',    dob:'02 Sep 1954', mrn:'GA-10233', waiver:'COMP',
      program:'Personal Support', status:'Active', since:'Aug 2024', coord:'Renee Alcott',
      agreement:{ start:'15 Aug 2025', end:'14 Aug 2026', status:'Current' } },

    { id:'c3', agency:'ga', name:'Adaeze Okafor',    dob:'23 Jun 1979', mrn:'GA-10871', waiver:'NOW',
      program:'Community Living Support', status:'Active', since:'Mar 2025', coord:'Renee Alcott',
      agreement:{ start:'01 Mar 2025', end:'28 Feb 2026', status:'Due soon' } },

    { id:'c4', agency:'ga', name:'Harold Bramlett',  dob:'11 Nov 1947', mrn:'GA-09920', waiver:'COMP',
      program:'Respite', status:'In hospital', since:'Feb 2023', coord:'Renee Alcott',
      agreement:{ start:'01 Jul 2025', end:'30 Jun 2026', status:'Current' } },

    { id:'c5', agency:'ga', name:'Sylvia Trent',     dob:'30 Jan 1962', mrn:'GA-10555', waiver:'NOW',
      program:'Community Living Support', status:'Active', since:'Sep 2025', coord:'Renee Alcott',
      agreement:{ start:'01 Sep 2025', end:'31 Aug 2026', status:'Current' } },

    { id:'c6', agency:'ms', name:'Jerome Sandifer',  dob:'19 Apr 1959', mrn:'MS-20114', waiver:'IDD Community Supports',
      program:'Home & Community Supports', status:'Active', since:'Jun 2024', coord:'Patrice Hollins',
      agreement:{ start:'01 Jun 2025', end:'31 May 2026', status:'Current' } },

    { id:'c7', agency:'ms', name:'Loretta Bynum',    dob:'07 Dec 1951', mrn:'MS-20387', waiver:'IDD Community Supports',
      program:'Respite', status:'Active', since:'Feb 2026', coord:'Patrice Hollins',
      agreement:{ start:'01 Feb 2026', end:'31 Jan 2027', status:'Current' } },

    { id:'c8', agency:'ms', name:'Vernon Ashby',     dob:'25 Aug 1966', mrn:'MS-20502', waiver:'IDD Community Supports',
      program:'Home & Community Supports', status:'Active', since:'Nov 2025', coord:'Patrice Hollins',
      agreement:{ start:'01 Nov 2025', end:'31 Oct 2026', status:'Current' } }
  ];

  /* ---------------- caregivers ---------------- */

  var CAREGIVERS = [
    { id:'g1', agency:'ga', name:'Tanya Fields',    role:'Direct Support Professional', hired:'06 Mar 2023', worst:'expired' },
    { id:'g2', agency:'ga', name:'Marcus Odell',    role:'Direct Support Professional', hired:'15 Jul 2024', worst:'soon' },
    { id:'g3', agency:'ga', name:'Priya Raghunath', role:'Direct Support Professional', hired:'13 Jan 2025', worst:'ok' },
    { id:'g4', agency:'ga', name:'Denise Holloway', role:'Home Health Aide',            hired:'19 Sep 2022', worst:'soon' },
    { id:'g5', agency:'ga', name:'Eli Whitcomb',    role:'Direct Support Professional', hired:'07 Apr 2025', worst:'ok' },
    { id:'g6', agency:'ga', name:'Yvonne Pryce',    role:'Registered Nurse',            hired:'11 Feb 2021', worst:'ok' },
    { id:'g7', agency:'ms', name:'Carla Benoit',    role:'Direct Support Professional', hired:'20 May 2024', worst:'expired' },
    { id:'g8', agency:'ms', name:'Roland Pace',     role:'Home Health Aide',            hired:'17 Oct 2023', worst:'ok' },
    { id:'g9', agency:'ms', name:'Shanice Dupree',  role:'Direct Support Professional', hired:'04 Aug 2025', worst:'soon' },
    { id:'g10',agency:'ms', name:'Otis Vandiver',   role:'Direct Support Professional', hired:'12 Dec 2022', worst:'ok' }
  ];

  var CREDENTIALS = {
    g1: [
      { name:"Driver's licence",   done:'12 Feb 2022', due:'12 Feb 2026', status:'expired' },
      { name:'CPR / First Aid',    done:'03 Mar 2024', due:'03 Mar 2026', status:'soon' },
      { name:'Annual training',    done:'18 Jan 2026', due:'18 Jan 2027', status:'ok' },
      { name:'Background check',   done:'02 Mar 2023', due:'02 Mar 2027', status:'ok' }
    ],
    g2: [
      { name:"Driver's licence",   done:'20 Jun 2023', due:'20 Jun 2027', status:'ok' },
      { name:'CPR / First Aid',    done:'27 Feb 2024', due:'27 Feb 2026', status:'soon' },
      { name:'Annual training',    done:'11 Jul 2025', due:'11 Jul 2026', status:'ok' },
      { name:'Background check',   done:'14 Jul 2024', due:'14 Jul 2028', status:'ok' }
    ],
    g4: [
      { name:"Driver's licence",   done:'05 May 2022', due:'05 May 2026', status:'ok' },
      { name:'CPR / First Aid',    done:'22 Feb 2024', due:'22 Feb 2026', status:'soon' },
      { name:'Annual training',    done:'30 Sep 2025', due:'30 Sep 2026', status:'ok' },
      { name:'Background check',   done:'19 Sep 2022', due:'19 Sep 2026', status:'ok' }
    ]
  };

  /* ---------------- authorisations & budget ---------------- */

  var AUTHS = [
    { id:'a1', client:'c1', clientName:'Maria Lopez', agency:'ga',
      service:'Community Living Support', number:'PA-GA-44118',
      start:'01 Jan 2026', end:'31 Dec 2026',
      units:2000, rate:6.25, used:180 },

    { id:'a2', client:'c1', clientName:'Maria Lopez', agency:'ga',
      service:'Respite', number:'PA-GA-44119',
      start:'01 Jan 2026', end:'31 Dec 2026',
      units:400, rate:5.80, used:96 },

    { id:'a3', client:'c2', clientName:'Curtis Nabors', agency:'ga',
      service:'Personal Support', number:'PA-GA-41007',
      start:'15 Aug 2025', end:'14 Aug 2026',
      units:1600, rate:6.05, used:1490 },

    { id:'a4', client:'c3', clientName:'Adaeze Okafor', agency:'ga',
      service:'Community Living Support', number:'PA-GA-42880',
      start:'01 Mar 2025', end:'28 Feb 2026',
      units:1800, rate:6.25, used:1746 },

    { id:'a5', client:'c5', clientName:'Sylvia Trent', agency:'ga',
      service:'Community Living Support', number:'PA-GA-43551',
      start:'01 Sep 2025', end:'31 Aug 2026',
      units:2400, rate:6.25, used:820 },

    { id:'a6', client:'c6', clientName:'Jerome Sandifer', agency:'ms',
      service:'Home & Community Supports', number:'PA-MS-70233',
      start:'01 Jun 2025', end:'31 May 2026',
      units:2080, rate:5.95, used:1102 }
  ];

  /* usage ledger — append only, totals derived */
  var USAGE = [
    { auth:'a1', month:'January 2026',  hours:45, units:180, by:'Renee Alcott', on:'03 Feb 2026' }
  ];

  /* ---------------- incidents ---------------- */

  /* Facts only. Where each one stands is worked out from whether a
     follow-up was recorded and whether it was closed — never stored here. */
  var INCIDENTS = [
    { id:'i1', agency:'ga', client:'c1', clientName:'Maria Lopez', type:'Fall',
      when:'03 Apr 2026, 14:20', place:'Client home — kitchen',
      desc:'Client lost balance while reaching for a cupboard. No visible injury. Vitals normal.',
      immediate:'Assisted to a chair, vitals taken, family contacted.',
      notified:['Support coordinator','Family'],
      assigned:'Yvonne Pryce', due:'10 Apr 2026' },

    { id:'i2', agency:'ga', client:'c1', clientName:'Maria Lopez', type:'Medication error',
      when:'19 Apr 2026, 08:05', place:'Client home',
      desc:'Morning dose administered 90 minutes late.',
      immediate:'Prescriber notified. No adverse effect observed.',
      notified:['Support coordinator'],
      assigned:'Yvonne Pryce', due:'26 Apr 2026' },

    { id:'i3', agency:'ga', client:'c1', clientName:'Maria Lopez', type:'Fall',
      when:'30 Apr 2026, 19:40', place:'Client home — hallway',
      desc:'Second fall this month. Client reported dizziness beforehand.',
      immediate:'Nurse called, GP appointment arranged.',
      notified:['Support coordinator','Family','DDP'],
      assigned:'Yvonne Pryce', due:'07 May 2026' },

    { id:'i4', agency:'ga', client:'c4', clientName:'Harold Bramlett', type:'Behavioural',
      when:'28 Mar 2026, 11:15', place:'Day programme',
      desc:'Verbal altercation with another participant.',
      immediate:'Separated, de-escalated, both parties calm within 10 minutes.',
      notified:['Support coordinator'],
      assigned:'Renee Alcott', due:'04 Apr 2026',
      followUp:{ on:'02 Apr 2026', by:'Renee Alcott', note:'Both participants seen. No repeat behaviour since.' },
      closed:{ on:'04 Apr 2026', by:'Renee Alcott' } },

    { id:'i5', agency:'ms', client:'c7', clientName:'Loretta Bynum', type:'Property damage',
      when:'12 Apr 2026, 16:00', place:'Client home',
      desc:'Kitchen window cracked during transfer.',
      immediate:'Area made safe, repair booked.',
      notified:['Family'],
      assigned:'Patrice Hollins', due:'19 Apr 2026',
      followUp:{ on:'17 Apr 2026', by:'Patrice Hollins', note:'Window replaced. Transfer route reviewed with staff.' },
      closed:{ on:'19 Apr 2026', by:'Patrice Hollins' } }
  ];

  /* ---------------- hospitalisations ---------------- */

  /* Facts only. Where a stay stands — in hospital, nurse visit due or
     overdue, reviews outstanding, closed — is worked out from which of
     those records exist. */
  var HOSPS = [
    { id:'h1', agency:'ga', client:'c1', clientName:'Maria Lopez',
      kind:'Admission', hospital:'Piedmont Athens Regional',
      admitted:'12 Apr 2026, 21:10', reason:'Dizziness and suspected dehydration',
      discharged:'16 Apr 2026, 11:30', notified:['Support coordinator','Family','DDP'],
      visitRequired:true, visitDue:'19 Apr 2026', nurse:'Yvonne Pryce',
      visit:{ on:'18 Apr 2026', by:'Yvonne Pryce',
              condition:'Stable, mobility reduced',
              instructions:'Yes, with client and family',
              meds:'New prescription started in hospital — a diuretic. Client reports light-headedness on standing.',
              orders:'Increase fluid intake. Review blood pressure at the next GP appointment.',
              reviews:['Healthcare Plan','Risk Mitigation Plan'] },
      closed:{ on:'23 Apr 2026', by:'Renee Alcott' } },

    { id:'h2', agency:'ga', client:'c4', clientName:'Harold Bramlett',
      kind:'Admission', hospital:'Emory Decatur',
      admitted:'09 Apr 2026, 03:40', reason:'Shortness of breath',
      discharged:null, notified:['Support coordinator','Family'],
      visitRequired:true, visitDue:null, nurse:'Yvonne Pryce' },

    { id:'h3', agency:'ga', client:'c5', clientName:'Sylvia Trent',
      kind:'ER visit', hospital:'Northside Forsyth',
      admitted:'02 Apr 2026, 18:55', reason:'Laceration to forearm',
      discharged:'02 Apr 2026, 23:20', notified:['Support coordinator'],
      visitRequired:true, visitDue:'09 Apr 2026', nurse:'Yvonne Pryce' }
  ];

  /* ---------------- quality improvement ---------------- */

  var QI = [
    { id:'q1', agency:'ga', client:'c1', clientName:'Maria Lopez',
      title:'Repeat falls — Maria Lopez',
      opened:'30 Apr 2026', source:'Auto — 3 incidents in one month',
      owner:'Renee Alcott', due:'21 May 2026', status:'Open', auto:true,
      plan:'Review mobility aids and lighting in the home. Request GP review of medication that may cause dizziness. Retrain support staff on transfer technique.' },

    { id:'q2', agency:'ga', client:null, clientName:'—',
      title:'Late medication administration — Georgia',
      opened:'22 Apr 2026', source:'Manual — pattern noticed by manager',
      owner:'Renee Alcott', due:'30 May 2026', status:'Monitoring', auto:false,
      plan:'Audit morning visit start times across all clients. Adjust rota where routes are too tight.' }
  ];

  /* ---------------- ISP goals ---------------- */

  var ISP = [
    { id:'p1', client:'c1', clientName:'Maria Lopez',
      goal:'Prepare a simple meal independently three times per week',
      months:[
        { m:'Jan', pc:20 }, { m:'Feb', pc:35 }, { m:'Mar', pc:50 },
        { m:'Apr', pc:65 }, { m:'May', pc:30 }
      ],
      lastBy:'Renee Alcott', drop:true },

    { id:'p2', client:'c1', clientName:'Maria Lopez',
      goal:'Attend a community activity once per week',
      months:[
        { m:'Jan', pc:40 }, { m:'Feb', pc:45 }, { m:'Mar', pc:55 },
        { m:'Apr', pc:60 }, { m:'May', pc:70 }
      ],
      lastBy:'Renee Alcott', drop:false },

    { id:'p3', client:'c2', clientName:'Curtis Nabors',
      goal:'Manage own morning medication with prompting',
      months:[
        { m:'Jan', pc:55 }, { m:'Feb', pc:60 }, { m:'Mar', pc:70 },
        { m:'Apr', pc:75 }, { m:'May', pc:null }
      ],
      lastBy:'Renee Alcott', drop:false }
  ];

  /* ---------------- oversight ---------------- */

  var OVERSIGHT = [
    { id:'o1', agency:'ga', client:'c5', clientName:'Sylvia Trent',  type:'HRST',               due:'02 Apr 2026', status:'Overdue',  who:'Yvonne Pryce', every:'Annual' },
    { id:'o2', agency:'ga', client:'c1', clientName:'Maria Lopez',   type:'HRST',               due:'24 Apr 2026', status:'Due soon', who:'Yvonne Pryce', every:'Incident-triggered' },
    { id:'o3', agency:'ga', client:'c1', clientName:'Maria Lopez',   type:'Supervisor visit',   due:'28 Apr 2026', status:'Due soon', who:'Renee Alcott', every:'62 days' },
    { id:'o4', agency:'ga', client:'c2', clientName:'Curtis Nabors', type:'Reassessment',       due:'11 May 2026', status:'Upcoming', who:'Yvonne Pryce', every:'Annual' },
    { id:'o5', agency:'ga', client:'c1', clientName:'Maria Lopez',   type:'Healthcare Plan',    due:'20 Apr 2026', status:'Completed',who:'Yvonne Pryce', every:'On change' },
    { id:'o6', agency:'ga', client:'c1', clientName:'Maria Lopez',   type:'Risk Mitigation',    due:'20 Apr 2026', status:'Completed',who:'Yvonne Pryce', every:'On change' },
    { id:'o7', agency:'ga', client:'c3', clientName:'Adaeze Okafor', type:'DDP review',         due:'30 Apr 2026', status:'Due soon', who:'External DDP', every:'Quarterly' },
    { id:'o8', agency:'ga', client:'c4', clientName:'Harold Bramlett',type:'Supervisor visit',  due:'15 Apr 2026', status:'Overdue',  who:'Renee Alcott', every:'30 days' },
    { id:'o9', agency:'ms', client:'c6', clientName:'Jerome Sandifer',type:'Reassessment',      due:'06 May 2026', status:'Upcoming', who:'Nurse (MS)',   every:'Annual' },
    { id:'o10',agency:'ms', client:'c7', clientName:'Loretta Bynum', type:'Supervisor visit',   due:'21 Apr 2026', status:'Due soon', who:'Patrice Hollins', every:'90 days' }
  ];

  /* ---------------- tasks ---------------- */

  var TASKS = [
    { id:'t1', agency:'ga', title:'Complete nurse follow-up visit — Maria Lopez', linked:'Incident · Fall, 3 Apr',
      owner:'Yvonne Pryce', due:'10 Apr 2026', status:'Overdue', priority:'High', recurring:false },
    { id:'t2', agency:'ga', title:'Review Healthcare Plan after hospital discharge', linked:'Hospitalisation · Maria Lopez',
      linkedId:'h1', owner:'Yvonne Pryce', due:'23 Apr 2026', status:'Completed', priority:'High', recurring:false },
    { id:'t3', agency:'ga', title:'Review Risk Mitigation Plan after hospital discharge', linked:'Hospitalisation · Maria Lopez',
      linkedId:'h1', owner:'Yvonne Pryce', due:'23 Apr 2026', status:'Completed', priority:'High', recurring:false },
    { id:'t4', agency:'ga', title:'Renew CPR certification — Marcus Odell', linked:'Caregiver · Marcus Odell',
      owner:'Renee Alcott', due:'27 Feb 2026', status:'Overdue', priority:'Medium', recurring:false },
    { id:'t5', agency:'ga', title:'Monthly ISP progress entry — all Georgia clients', linked:'Recurring',
      owner:'Renee Alcott', due:'05 May 2026', status:'In progress', priority:'Medium', recurring:true },
    { id:'t6', agency:'ga', title:'Chase renewed service agreement — Adaeze Okafor', linked:'Client · Adaeze Okafor',
      owner:'Renee Alcott', due:'20 Feb 2026', status:'Not started', priority:'High', recurring:false },
    { id:'t7', agency:'ga', title:'Corrective action — lighting assessment', linked:'QI · Repeat falls',
      owner:'Renee Alcott', due:'14 May 2026', status:'Not started', priority:'Medium', recurring:false },
    { id:'t8', agency:'ms', title:'Collect missing waiver documents — Loretta Bynum', linked:'Client · Loretta Bynum',
      owner:'Patrice Hollins', due:'25 Apr 2026', status:'In progress', priority:'High', recurring:false }
  ];

  /* ---------------- waiver checklist ---------------- */

  var CHECKLIST = [
    { name:'Signed service agreement',        received:'01 Jan 2026', expires:'31 Dec 2026', status:'On file' },
    { name:'Prior authorisation letter',      received:'28 Dec 2025', expires:'31 Dec 2026', status:'On file' },
    { name:'Individual Service Plan (ISP)',   received:'05 Jan 2026', expires:'04 Jan 2027', status:'On file' },
    { name:'Freedom of choice form',          received:'01 Jan 2026', expires:'—',           status:'On file' },
    { name:'Rights and responsibilities',     received:'01 Jan 2026', expires:'—',           status:'On file' },
    { name:'Physician order for services',    received:'—',           expires:'—',           status:'Missing' },
    { name:'Annual health assessment',        received:'12 Feb 2025', expires:'11 Feb 2026', status:'Expired' },
    { name:'Emergency contact form',          received:'01 Jan 2026', expires:'—',           status:'On file' },
    { name:'Transportation consent',          received:'—',           expires:'—',           status:'Not applicable' }
  ];

  /* ---------------- audit ---------------- */

  var AUDIT = [
    { when:'30 Apr 2026, 19:52', who:'System',        what:'Opened QI item “Repeat falls — Maria Lopez”', why:'3 incidents in one month (threshold 2)' },
    { when:'30 Apr 2026, 19:47', who:'Yvonne Pryce',  what:'Created incident · Fall · Maria Lopez',       why:'—' },
    { when:'23 Apr 2026, 10:14', who:'Yvonne Pryce',  what:'Completed task · Review Healthcare Plan',      why:'—' },
    { when:'18 Apr 2026, 15:02', who:'Yvonne Pryce',  what:'Recorded nurse follow-up visit · Maria Lopez', why:'—' },
    { when:'16 Apr 2026, 11:35', who:'Renee Alcott',  what:'Recorded discharge · Maria Lopez',             why:'—' },
    { when:'12 Apr 2026, 21:22', who:'Renee Alcott',  what:'Created hospitalisation · Maria Lopez',        why:'—' },
    { when:'03 Feb 2026, 09:40', who:'Renee Alcott',  what:'Entered usage · 45 hours · January 2026',      why:'Authorisation PA-GA-44118' },
    { when:'02 Jan 2026, 16:08', who:'Renee Alcott',  what:'Imported 38 clients from spreadsheet',         why:'Bulk import' }
  ];

  /* ---------------- the sample import file ----------------
     One small spreadsheet with one of each outcome, so every path
     through the importer is visible in a single pass. */

  var IMPORT_FILE = {
    name: 'caseload-sample.xlsx',
    /* Client details only. A programme, an agreement and an authorisation
       are decisions made per client afterwards, not columns in a file. */
    columns: ['First name', 'Last name', 'Date of birth', 'Medicaid ID', 'Phone', 'Address', 'EMR link'],
    rows: [
      { row: 2, first: 'Maria',  last: 'Lopez',  dob: '14/03/1968', medicaid: 'GA-10482',
        phone: '(706) 555-0142', address: '18 Pinehurst Way, Athens GA',
        outcome: 'ok' },

      { row: 3, first: 'Curtis', last: 'Nabors', dob: '02/09/1954', medicaid: 'GA-10233',
        phone: '(706) 555-0198', address: '4 Colbert Lane, Athens GA',
        outcome: 'ok' },

      { row: 4, first: 'Adaeze', last: 'Okafor', dob: '31/02/1970', medicaid: 'GA-10871',
        phone: '(770) 555-0110', address: '22 Marlow Street, Atlanta GA',
        outcome: 'error',
        field: 'Date of birth', value: '31/02/1970',
        why: 'There is no 31st of February' },

      { row: 5, first: 'Curtis', last: 'Nabors', dob: '02/09/1954', medicaid: 'GA-10233',
        phone: '(706) 555-0198', address: '4 Colbert Lane, Athens GA',
        outcome: 'duplicate',
        field: 'Medicaid ID', value: 'GA-10233',
        why: 'Same person as row 3' }
    ]
  };

  /* ---------------- the caregiver import file ----------------
     Their details only. Role, agency and every credential are set by an
     administrator afterwards, because they are decisions, not columns. */

  var CAREGIVER_FILE = {
    name: 'staff-sample.xlsx',
    columns: ['First name', 'Last name', 'Phone', 'Email'],
    rows: [
      { row: 2, first: 'Tanya',  last: 'Fields', phone: '(706) 555-0177',
        email: 'tanya.fields@wecarehomecare.com', outcome: 'ok' },

      { row: 3, first: 'Marcus', last: 'Odell',  phone: '(706) 555-0163',
        email: 'marcus.odell@wecarehomecare.com', outcome: 'ok' },

      { row: 4, first: 'Tanya',  last: 'Fields', phone: '(706) 555-0177',
        email: 'tanya.fields@wecarehomecare.com', outcome: 'duplicate',
        field: 'Email', value: 'tanya.fields@wecarehomecare.com',
        why: 'Same person as row 2' }
    ]
  };

  return {
    agencies: AGENCIES,
    users: {
      admin: { id:'u-admin', name:'Renee Alcott', initials:'RA', email:'renee.alcott@wecarehomecare.com',
               role:'admin', title:'Office Manager', agency:'ga', status:'Active', password:'wechc-2026' },
      nurse: { id:'u-nurse', name:'Yvonne Pryce', initials:'YP', email:'yvonne.pryce@wecarehomecare.com',
               role:'nurse', title:'Registered Nurse', agency:'ga', status:'Active', password:'wechc-2026' }
    },
    clients: CLIENTS, caregivers: CAREGIVERS, credentials: CREDENTIALS,
    auths: AUTHS, usage: USAGE, incidents: INCIDENTS, hosps: HOSPS,
    qi: QI, isp: ISP, oversight: OVERSIGHT, tasks: TASKS,
    checklist: CHECKLIST, audit: AUDIT,
    importFile: IMPORT_FILE,
    caregiverFile: CAREGIVER_FILE
  };
})();
