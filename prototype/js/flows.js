/* ============================================================
   FLOWS — scripted walkthroughs.
   Each step names itself, so the Next button teaches as it goes.
   ============================================================ */

FLOWS['dayone'] = {
  title: '● Day one — a brand new empty system',
  steps: [
    { screen: 'auth.login',        label: 'Dawn signs in for the very first time',
      role: 'superadmin', agency: 'ga', data: 'fresh', setupStep: 0 },
    { screen: 'setup.welcome',     label: 'What has to happen before it is useful' },
    { screen: 'setup.checklist',   label: 'Step 1 — name the two agencies' },
    { screen: 'setup.agencies',    label: 'Step 2 — invite Renee and Yvonne' },
    { screen: 'setup.team',        label: 'Step 3 — add the waiver programmes' },
    { screen: 'setup.programmes',  label: 'Step 4 — check the reminder timings' },
    { screen: 'set.reminders',     label: 'Look at the dashboard so far', setupStep: 4 },
    { screen: 'setup.dash',        label: 'Nothing to show yet — so import the clients' },
    { screen: 'clients.list',      label: 'Bring the caseload in from a spreadsheet' },
    { screen: 'clients.import',    label: 'Pick the file' },
    { screen: 'clients.import.preview', label: 'Check it before anything saves' },
    { screen: 'clients.import.done',    label: 'Now the caregivers', setupStep: 5 },
    { screen: 'cg.list',           label: 'Import them the same way' },
    { screen: 'cg.import',         label: 'Pick the staff file' },
    { screen: 'cg.import.check',   label: 'Check it before anything saves' },
    { screen: 'cg.import.done',    label: 'That was the last step', setupStep: 6 },
    { screen: 'setup.done',        label: 'The dashboard, now that it has dates to watch' },
    { screen: 'dash.home',         label: 'Finish' }
  ]
};

FLOWS['maria'] = {
  title: '★ Maria Lopez — one client, one year',
  steps: [
    { screen: 'auth.login',        label: 'Renee types the wrong password', role: 'admin', agency: 'ga',
      data: 'demo', patch: { a1used: null } },
    { screen: 'auth.error',        label: 'Try again with the right one' },
    { screen: 'auth.loading',      label: 'Land on the dashboard' },
    { screen: 'dash.home',         label: 'Open the client list' },
    { screen: 'clients.list',      label: 'Open Maria Lopez' },
    { screen: 'clients.profile',   label: 'Look at their waiver documents' },
    { screen: 'clients.checklist', label: 'Open their authorisation' },
    { screen: 'budget.detail',     label: 'Enter April’s hours' },
    { screen: 'budget.usage',      label: 'Watch the 75% alert fire',
      toast: { kind: 'warn', title: 'Saved', body: 'Utilisation recalculated.' } },
    { screen: 'budget.alert75',    label: 'Now — 3 April, Maria falls', patch: { a1used: 1500 } },
    { screen: 'inc.detail',        label: 'Nobody has done the follow-up' },
    { screen: 'inc.aged',          label: '12 April — a hospital admission' },
    { screen: 'hosp.detail',       label: 'The nurse visits after discharge' },
    { screen: 'hosp.visit',        label: 'Two plan reviews are created' },
    { screen: 'hosp.closed',       label: '30 April — a third incident' },
    { screen: 'inc.trigger',       label: 'A quality item opens by itself' },
    { screen: 'qi.detail',         label: 'May — goal progress drops' },
    { screen: 'isp.detail',        label: 'November — someone overspends' },
    { screen: 'budget.block',      label: 'Back to the dashboard' },
    { screen: 'dash.home',         label: 'Finish' }
  ]
};

FLOWS['access'] = {
  title: 'Who sees what — roles and agencies',
  steps: [
    { screen: 'auth.login',    label: 'Sign in as the owner', data: 'demo', role: 'superadmin', agency: 'ga' },
    { screen: 'auth.agency',   label: 'Pick an agency' },
    { screen: 'dash.home',     label: 'Switch to Mississippi', role: 'superadmin', agency: 'ga' },
    { screen: 'dash.home',     label: 'See a quiet day', agency: 'ms' },
    { screen: 'dash.empty',    label: 'Now sign in as office staff' },
    { screen: 'dash.home',     label: 'Notice the agency switcher is gone', role: 'admin', agency: 'ga' },
    { screen: 'clients.list',  label: 'Now sign in as a nurse' },
    { screen: 'dash.home',     label: 'Half the menu has disappeared', role: 'nurse', agency: 'ga' },
    { screen: 'auth.denied',   label: 'What happens if a nurse tries Settings' },
    { screen: 'set.users',     label: 'The full permission matrix', role: 'superadmin' },
    { screen: 'sys.audit',     label: 'Finish — everything is logged' }
  ]
};

FLOWS['import'] = {
  title: 'Bringing a caseload in from Excel',
  steps: [
    { screen: 'clients.list',           label: 'Start an import', data: 'demo', role: 'admin', agency: 'ga' },
    { screen: 'clients.import',         label: 'Upload the spreadsheet' },
    { screen: 'clients.import.errors',  label: 'Four rows have problems' },
    { screen: 'clients.import.preview', label: 'Check before anything is saved' },
    { screen: 'clients.import.done',    label: '38 clients created' },
    { screen: 'clients.list',           label: 'Finish' }
  ]
};

FLOWS['budget'] = {
  title: 'Budget — the calculator with alarms',
  steps: [
    { screen: 'budget.list',    label: 'Set up a new authorisation', data: 'demo', role: 'admin', agency: 'ga', patch: { a1used: null } },
    { screen: 'budget.setup',   label: 'Enter the units and the rate' },
    { screen: 'budget.detail',  label: 'A month later, enter the hours' },
    { screen: 'budget.usage',   label: 'The system recalculates' },
    { screen: 'budget.alert75', label: 'September — 75% alert fires', patch: { a1used: 1500 } },
    { screen: 'budget.block',   label: 'November — try to overspend' },
    { screen: 'rep.results',    label: 'See it across every client' },
    { screen: 'rep.export',     label: 'Export it' },
    { screen: 'rep.pdf',        label: 'Finish — the branded PDF' }
  ]
};

FLOWS['incident'] = {
  title: 'An incident, start to finish',
  steps: [
    { screen: 'inc.list',    label: 'Record what happened', data: 'demo', role: 'admin', agency: 'ga' },
    { screen: 'inc.new',     label: 'Assign the follow-up' },
    { screen: 'inc.detail',  label: 'Seven days pass with nothing done' },
    { screen: 'inc.aged',    label: 'It escalates to the manager' },
    { screen: 'tasks.escalated', label: 'A third incident that month' },
    { screen: 'inc.trigger', label: 'A quality item opens by itself' },
    { screen: 'qi.detail',   label: 'Work the corrective actions' },
    { screen: 'qi.outcome',  label: 'Finish — did the fix work?' }
  ]
};

FLOWS['hospital'] = {
  title: 'Hospital stay and the nurse visit',
  steps: [
    { screen: 'hosp.list',   label: 'Record the admission', data: 'demo', role: 'admin', agency: 'ga' },
    { screen: 'hosp.new',    label: 'Discharge — the visit becomes required' },
    { screen: 'hosp.detail', label: 'Now switch to the nurse' },
    { screen: 'dash.home',   label: 'The nurse list for today', role: 'nurse' },
    { screen: 'hosp.visit',  label: 'A new medication is found' },
    { screen: 'hosp.closed', label: 'Finish — the stay can close' }
  ]
};

FLOWS['caregivers'] = {
  title: 'Caregiver papers that expire',
  steps: [
    { screen: 'cg.import',       label: 'Check the file', data: 'demo', role: 'admin', agency: 'ga' },
    { screen: 'cg.import.check', label: 'Two import, one duplicate skipped' },
    { screen: 'cg.import.done',  label: 'Open one of them' },
    { screen: 'cg.list',         label: 'Give them a role' },
    { screen: 'cg.detail',       label: 'Add what they have to hold' },
    { screen: 'cg.role',         label: 'Their credentials, with dates' },
    { screen: 'cg.credential',   label: 'See everything expiring' },
    { screen: 'cg.expiry',       label: 'Finish' }
  ]
};

FLOWS['oversight'] = {
  title: 'Scheduled reviews',
  steps: [
    { screen: 'ov.list',   label: 'A supervisor visit', data: 'demo', role: 'admin', agency: 'ga' },
    { screen: 'ov.visit',  label: 'An annual reassessment' },
    { screen: 'ov.assess', label: 'HRST — brought forward by an incident' },
    { screen: 'ov.hrst',   label: 'The two plan reviews' },
    { screen: 'ov.plan',   label: 'The quarterly DDP review' },
    { screen: 'ov.ddp',    label: 'Finish' }
  ]
};

FLOWS['isp'] = {
  title: 'Monthly goal progress',
  steps: [
    { screen: 'isp.list',   label: 'Enter this month’s percentage', data: 'demo', role: 'admin', agency: 'ga' },
    { screen: 'isp.entry',  label: 'It is 35 points below last month' },
    { screen: 'isp.detail', label: 'Finish — the drop is flagged' }
  ]
};

FLOWS['tasks'] = {
  title: 'Tasks and escalation',
  steps: [
    { screen: 'tasks.list',      label: 'Create a task', data: 'demo', role: 'admin', agency: 'ga' },
    { screen: 'tasks.new',       label: 'Attach it to a quality item' },
    { screen: 'tasks.detail',    label: 'What happens if it is ignored' },
    { screen: 'tasks.escalated', label: 'Finish' }
  ]
};

FLOWS['reports'] = {
  title: 'Reports and exports',
  steps: [
    { screen: 'rep.builder', label: 'Run it', data: 'demo', role: 'admin', agency: 'ga', patch: { a1used: 1500 } },
    { screen: 'rep.results', label: 'Export it' },
    { screen: 'rep.export',  label: 'Preview the branded PDF' },
    { screen: 'rep.pdf',     label: 'Finish' }
  ]
};

FLOWS['settings'] = {
  title: 'What the client can change without us',
  steps: [
    { screen: 'set.users',      label: 'The agencies', data: 'demo', role: 'superadmin', agency: 'ga' },
    { screen: 'set.agencies',   label: 'Reminder timings' },
    { screen: 'set.reminders',  label: 'The automatic rules' },
    { screen: 'set.thresholds', label: 'The waiver checklists' },
    { screen: 'set.checklist',  label: 'Visit intervals' },
    { screen: 'set.intervals',  label: 'Finish' }
  ]
};

FLOWS['states'] = {
  title: 'Empty, loading and audit',
  steps: [
    { screen: 'sys.loading', label: 'An empty result', data: 'demo', role: 'admin', agency: 'ms' },
    { screen: 'sys.empty',   label: 'A quiet dashboard' },
    { screen: 'dash.empty',  label: 'The audit trail' },
    { screen: 'sys.audit',   label: 'Finish' }
  ]
};
