/* ============================================================
   Settings — the things the client must be able to change alone
   ============================================================ */

(function () {

  function tabs(active) {
    var t = [['Users & roles','set.users'],['Agencies','set.agencies'],['Reminders','set.reminders'],
             ['Thresholds','set.thresholds'],['Waiver checklists','set.checklist'],['Visit intervals','set.intervals']];
    return '<div class="filters" style="border-radius:11px;border:1px solid var(--border);background:var(--surface)">' +
      t.map(function (x) {
        return '<span class="fchip' + (x[0] === active ? ' on' : '') + '" data-goto="' + x[1] + '">' + x[0] + '</span>';
      }).join('') + '</div>';
  }

  function head(title, sub) {
    return '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">Settings · Super Admin only</span>' +
      '<h1>' + title + '</h1><span class="sub">' + sub + '</span></span></div>';
  }

  screen('set.users', {
    title: 'Users and roles', nav: 'settings',
    crumb: '<b>Settings</b> <span>›</span> Users',
    render: function () {
      var h = '<div class="page">' + head('Users and roles', 'Who can log in, and what they can see') + tabs('Users & roles');

      h += '<div class="card"><div class="card-head"><h3>Accounts</h3><span class="spacer"></span>' +
        UI.btn('Invite someone', { cls: 'btn--primary btn--sm', icon: 'plus' }) + '</div>' +
        '<div class="tbl-wrap"><table class="tbl" style="min-width:820px"><thead><tr>' +
        '<th>Person</th><th>Role</th><th>Agency</th><th>Last seen</th><th>Status</th></tr></thead><tbody>' +
        u('Dawn Bostock', 'Owner', 'Super Admin', 'Both', 'Today, 08:12', 'Active') +
        u('Renee Alcott', 'Office Manager', 'Admin staff', 'Georgia', 'Today, 07:55', 'Active') +
        u('Yvonne Pryce', 'Registered Nurse', 'Nurse', 'Georgia', 'Yesterday, 16:40', 'Active') +
        u('Patrice Hollins', 'Office Manager', 'Admin staff', 'Mississippi', 'Today, 09:02', 'Active') +
        u('Gene Marbury', 'Office Assistant', 'Admin staff', 'Mississippi', '12 Mar 2026', 'Suspended') +
        '</tbody></table></div>' +
        '<div class="card-foot"><span class="small muted">5 accounts. Caregivers are never given accounts — they exist only as compliance records.</span></div></div>';

      h += '<div class="card"><div class="card-head"><h3>What each role can do</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl" style="min-width:760px"><thead><tr>' +
        '<th>Area</th><th>Super Admin</th><th>Admin staff</th><th>Nurse</th></tr></thead><tbody>' +
        perm('Dashboard', 1, 1, 2) + perm('Clients', 1, 1, 2) + perm('Caregivers', 1, 1, 0) +
        perm('Authorisations and budget', 1, 1, 0) + perm('Incidents', 1, 1, 1) +
        perm('Hospitalisations and visits', 1, 1, 1) + perm('Quality', 1, 1, 0) +
        perm('Reviews and oversight', 1, 1, 1) + perm('Reports', 1, 1, 2) +
        perm('Audit trail', 1, 2, 0) + perm('Settings', 1, 0, 0) +
        perm('Both agencies at once', 1, 0, 0) +
        '</tbody></table></div></div>';

      return h + '</div>';
    }
  });

  function u(name, title, role, agency, seen, status) {
    return '<tr data-row><td><span class="rowmain"><span class="ava-sm">' + UI.esc(UI.initials(name)) + '</span>' +
      '<span><span class="nm">' + UI.esc(name) + '</span><br><span class="sub2">' + UI.esc(title) + '</span></span></span></td>' +
      '<td>' + UI.badge(role, role === 'Super Admin' ? 'plum' : 'neutral') + '</td>' +
      '<td class="small">' + UI.esc(agency) + '</td><td class="small muted">' + UI.esc(seen) + '</td>' +
      '<td>' + UI.badge(status === 'Active' ? 'Active' : 'Not applicable') + '</td></tr>';
  }

  function perm(area, a, b, c) {
    var m = ['<span class="muted">—</span>', '<span class="yes" style="color:var(--gr-600);font-weight:700">yes</span>',
             '<span style="color:var(--g-600);font-weight:700">limited</span>'];
    return '<tr data-row><td class="nm">' + area + '</td><td>' + m[a] + '</td><td>' + m[b] + '</td><td>' + m[c] + '</td></tr>';
  }

  screen('set.agencies', {
    title: 'Agencies', nav: 'settings',
    crumb: '<b>Settings</b> <span>›</span> Agencies',
    render: function () {
      var h = '<div class="page">' + head('Agencies', 'Adding a third one later must not need a rebuild') + tabs('Agencies');

      h += '<div class="grid grid-2">' +
        ag('Georgia', 'GA', '5 clients · 6 caregivers', 'NOW, COMP') +
        ag('Mississippi', 'MS', '3 clients · 4 caregivers', 'IDD Community Supports') +
      '</div>';

      h += '<div class="card"><div class="card-body" style="align-items:center;text-align:center;padding:32px;gap:10px">' +
        UI.icon('plus', 'ei') + '<b>Add another agency</b>' +
        '<span class="small muted" style="max-width:46ch">Every record in the system is stamped with its agency, ' +
        'so a third one can be added without touching anything that already exists.</span>' +
        UI.btn('Add an agency', { cls: 'btn--primary' }) + '</div></div>';

      return h + '</div>';
    }
  });

  function ag(name, abbr, counts, waivers) {
    return '<div class="card"><div class="card-head"><span class="ava-sm ' + (abbr === 'MS' ? 'c2' : '') + '">' + abbr + '</span>' +
      '<h3>' + name + '</h3><span class="spacer"></span>' + UI.badge('Active') + '</div><div class="card-body">' +
      UI.kv([['Records', counts], ['Waiver programmes', waivers], ['Branding', 'Own logo on PDF exports'],
             ['Data separation', 'Enforced on every query']]) +
      UI.btn('Edit', { cls: 'btn--sm' }) + '</div></div>';
  }

  screen('set.reminders', {
    title: 'Reminder timings', nav: 'settings',
    crumb: '<b>Settings</b> <span>›</span> Reminders',
    render: function () {
      var h = '<div class="page">' + head('Reminder timings', 'How far ahead the system warns you, per record type') + tabs('Reminders');

      h += '<div class="card"><div class="tbl-wrap"><table class="tbl" style="min-width:840px"><thead><tr>' +
        '<th>What</th><th>Advance reminders</th><th>Overdue alert</th><th>Escalates after</th><th>Email</th>' +
        '</tr></thead><tbody>' +
        rem('Caregiver credentials', '60, 30, 14, 7 days', 'Immediately', '14 days', true) +
        rem('Service agreements', '90, 60, 30 days', 'Immediately', '7 days', true) +
        rem('Prior authorisations', '60, 30, 14 days', 'Immediately', '7 days', true) +
        rem('Supervisor visits', '14, 7 days', 'Immediately', '7 days', true) +
        rem('HRST annual review', '60, 30 days', 'Immediately', '14 days', true) +
        rem('Plan reviews', '30, 14 days', 'Immediately', '14 days', false) +
        rem('Monthly ISP entries', '5 days before month end', 'On the 7th', '7 days', true) +
        rem('Tasks', '7 days', 'Immediately', '7 days', true) +
        '</tbody></table></div>' +
        '<div class="card-foot"><span class="small muted">Changing these takes effect on the next nightly run. No developer needed.</span></div></div>';

      return h + '</div>';
    }
  });

  function rem(what, adv, od, esc, email) {
    return '<tr data-row><td class="nm">' + what + '</td><td class="small mono">' + adv + '</td>' +
      '<td class="small">' + od + '</td><td class="small">' + esc + '</td>' +
      '<td>' + (email ? UI.badge('On', 'ok') : UI.badge('Off', 'neutral')) + '</td></tr>';
  }

  screen('set.thresholds', {
    title: 'Automatic rules', nav: 'settings',
    crumb: '<b>Settings</b> <span>›</span> Thresholds',
    render: function () {
      var h = '<div class="page">' + head('Automatic rules', 'When the system acts without being asked') + tabs('Thresholds');

      h += '<div class="grid grid-2">' +
        rule('Quality item from incidents', 'More than', '2', 'incidents for one client in a calendar month', true) +
        rule('Quality item from hospital stays', 'More than', '2', 'hospital stays for one client in a calendar month', true) +
        rule('Budget alert — first', 'At', '75%', 'of the authorisation used', true) +
        rule('Budget alert — second', 'At', '90%', 'of the authorisation used', true) +
        rule('Budget alert — exhausted', 'At', '100%', 'of the authorisation used', true) +
        rule('ISP progress drop', 'A fall of', '20', 'points or more from last month', true) +
        rule('Incident follow-up chase', 'After', '7', 'days with no completed visit', true) +
        rule('Nurse visit after discharge', 'Required for', 'every', 'client returning home from hospital', true) +
      '</div>';

      h += UI.banner('info', 'These are the rules that make the system feel alive',
        'Every one of them is a number the office can change. None of them needs code.');

      return h + '</div>';
    }
  });

  function rule(name, pre, val, post, on) {
    return '<div class="card card--click"><div class="card-head"><h3 style="font-size:14px">' + name + '</h3>' +
      '<span class="spacer"></span>' + UI.badge(on ? 'On' : 'Off', on ? 'ok' : 'neutral') + '</div>' +
      '<div class="card-body" style="gap:10px">' +
      '<div class="row" style="gap:8px"><span class="small muted">' + pre + '</span>' +
      '<span class="input" data-inert style="width:78px;text-align:center;font-weight:700;font-family:var(--mono)">' + val + '</span>' +
      '<span class="small muted" style="flex:1">' + post + '</span></div></div></div>';
  }

  screen('set.checklist', {
    title: 'Waiver checklist builder', nav: 'settings',
    crumb: '<b>Settings</b> <span>›</span> Waiver checklists',
    render: function () {
      var h = '<div class="page">' + head('Waiver checklists', 'The required documents for each programme — edit when the rules change') + tabs('Waiver checklists');

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">NOW · Georgia</span><span class="fchip">COMP · Georgia</span>' +
        '<span class="fchip">IDD Community Supports · Mississippi</span>' +
        '<span class="spacer"></span>' + UI.btn('Add a programme', { cls: 'btn--sm', icon: 'plus' }) +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:820px"><thead><tr>' +
        '<th>Required document</th><th>Has an expiry?</th><th>Renewal period</th><th>Required</th><th></th>' +
        '</tr></thead><tbody>' +
        cl('Signed service agreement', 'Yes', '12 months', true) +
        cl('Prior authorisation letter', 'Yes', 'Per authorisation', true) +
        cl('Individual Service Plan (ISP)', 'Yes', '12 months', true) +
        cl('Freedom of choice form', 'No', '—', true) +
        cl('Rights and responsibilities', 'No', '—', true) +
        cl('Physician order for services', 'Yes', '12 months', true) +
        cl('Annual health assessment', 'Yes', '12 months', true) +
        cl('Emergency contact form', 'No', '—', true) +
        cl('Transportation consent', 'No', '—', false) +
        '</tbody></table></div>' +
        '<div class="card-foot">' + UI.btn('Add a document', { cls: 'btn--sm', icon: 'plus' }) +
        '<span class="spacer"></span><span class="small muted">Changes apply to new clients immediately and flag existing files at the next nightly check.</span>' +
        '</div></div>';

      return h + '</div>';
    }
  });

  function cl(name, exp, period, req) {
    return '<tr data-row><td class="nm">' + name + '</td><td class="small">' + exp + '</td>' +
      '<td class="small mono">' + period + '</td>' +
      '<td>' + (req ? UI.badge('Required', 'plum') : UI.badge('Optional', 'neutral')) + '</td>' +
      '<td class="right"><span class="linkish small">Edit</span></td></tr>';
  }

  screen('set.intervals', {
    title: 'Visit intervals', nav: 'settings',
    crumb: '<b>Settings</b> <span>›</span> Visit intervals',
    render: function () {
      var h = '<div class="page">' + head('Visit and review intervals', 'How often each review type comes round') + tabs('Visit intervals');

      h += '<div class="card"><div class="tbl-wrap"><table class="tbl" style="min-width:780px"><thead><tr>' +
        '<th>Review type</th><th>Default interval</th><th>Can be set per client</th><th>Applies to</th>' +
        '</tr></thead><tbody>' +
        iv('Supervisor visit', '30 / 62 / 90 / 122 days', true, 'All clients') +
        iv('Nurse reassessment', 'Annual', true, 'All clients') +
        iv('HRST', 'Annual, plus on trigger', false, 'All clients') +
        iv('Risk Mitigation Plan review', '6 months', true, 'Clients with a plan') +
        iv('Healthcare Plan review', '6 months', true, 'Clients with a plan') +
        iv('DDP oversight review', 'Quarterly', true, 'Waiver clients') +
        iv('ISP progress entry', 'Monthly', false, 'Clients with goals') +
        '</tbody></table></div>' +
        '<div class="card-foot"><span class="small muted">Maria Lopez is on a 62-day supervisor interval. Harold Bramlett is on 30 days.</span></div></div>';

      return h + '</div>';
    }
  });

  function iv(name, def, per, who) {
    return '<tr data-row><td class="nm">' + name + '</td><td class="small mono">' + def + '</td>' +
      '<td>' + (per ? UI.badge('Yes', 'ok') : UI.badge('No', 'neutral')) + '</td>' +
      '<td class="small muted">' + who + '</td></tr>';
  }

})();
