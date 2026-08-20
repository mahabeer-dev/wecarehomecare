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
        '<th>Person</th><th>Role</th><th>Agency</th><th>Email</th><th>Status</th></tr></thead><tbody>' +
        DATA.USERLIST.map(function (x) {
          var ag = x.agency ? (DATA.AGENCIES[x.agency] || {}).short || x.agency : 'Both';
          return u(x.name, x.title, DATA.ROLE_LABEL[x.role], ag, x.email, x.status);
        }).join('') +
        '</tbody></table></div>' +
        '<div class="card-foot"><span class="small muted">' + DATA.USERLIST.length +
        (DATA.USERLIST.length === 1 ? ' account. This is the only one that exists — you create the rest.'
                                    : ' accounts. Caregivers are never given accounts; they exist only as compliance records.') +
        '</span></div></div>';

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
    title = title || '';
    return '<tr data-row><td><span class="rowmain"><span class="ava-sm">' + UI.esc(UI.initials(name)) + '</span>' +
      '<span><span class="nm">' + UI.esc(name) + '</span><br><span class="sub2">' + UI.esc(title) + '</span></span></span></td>' +
      '<td>' + UI.badge(role, role === 'Super Admin' ? 'plum' : 'neutral') + '</td>' +
      '<td class="small">' + UI.esc(agency) + '</td><td class="small muted mono" style="font-size:11.5px">' + UI.esc(seen) + '</td>' +
      '<td>' + UI.badge(status || 'Active', status === 'Invited' ? 'warn' : 'ok') + '</td></tr>';
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

      var list = DATA.USERLIST && Object.keys(DATA.AGENCIES);
      if (!list.length) {
        h += UI.emptyModule({ icon:'people', title:'No agencies yet',
          body:'Create your first agency before anything else. Every record in the system belongs to exactly one.',
          actions:[{ label:'Set up your agencies', primary:true, icon:'plus', goto:'setup.agencies' }] });
        return h + '</div>';
      }
      h += '<div class="grid grid-2">' + list.map(function (id) {
        var a = DATA.AGENCIES[id];
        var progs = DATA.PROGRAMMES.filter(function (p) { return p.agency === id; })
                        .map(function (p) { return p.name; }).join(', ') || 'none yet';
        return ag(a.short, a.abbr,
          DATA.inAgency(DATA.CLIENTS, id).length + ' clients · ' +
          DATA.inAgency(DATA.CAREGIVERS, id).length + ' caregivers', progs);
      }).join('') + '</div>';

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
    crumb: '<b>Settings</b> <span>&rsaquo;</span> Reminders',
    render: function (S) {
      var rules = DB.all('reminders');
      var editing = DB.get('reminders', S.vars.remId) || null;

      var h = '<div class="page">' +
        head('Reminder timings', 'How far ahead the system warns you, and what happens when nobody acts') +
        tabs('Reminders');

      h += '<div class="card"><div class="card-head"><h3>Rules</h3>' +
        '<span class="spacer"></span><span class="sub">' + rules.length +
        ' rule' + (rules.length === 1 ? '' : 's') + '</span></div>';

      if (rules.length) {
        h += '<div class="tbl-wrap"><table class="tbl" style="min-width:900px"><thead><tr>' +
          '<th>What</th><th>Advance reminders</th><th>Overdue alert</th><th>Escalates after</th>' +
          '<th>Email</th><th></th></tr></thead><tbody>';
        rules.forEach(function (r) {
          var on = editing && r.id === editing.id;
          h += '<tr data-row' + (on ? ' style="background:var(--p-50)"' : '') + '>' +
            '<td class="nm">' + UI.esc(r.what) + '</td>' +
            '<td class="small mono">' + UI.esc((r.advance || []).join(', ')) +
              ((r.advance || []).length ? ' days before' : '—') + '</td>' +
            '<td class="small">' + UI.esc(r.overdue) + '</td>' +
            '<td class="small">' + UI.esc(r.escalate) + ' days</td>' +
            '<td><button class="btn btn--sm btn--ghost" data-do="rem.email" data-id="' + UI.esc(r.id) + '" ' +
              'style="padding:0">' + UI.badge(r.email ? 'On' : 'Off', r.email ? 'ok' : 'neutral') + '</button></td>' +
            '<td class="right nowrap">' +
              '<button class="btn btn--sm btn--ghost" data-do="rem.edit" data-id="' + UI.esc(r.id) + '">' +
                (on ? 'Editing' : 'Edit') + '</button>' +
              '<button class="btn btn--sm btn--ghost" data-do="rem.remove" data-id="' + UI.esc(r.id) + '">Remove</button>' +
            '</td></tr>';
        });
        h += '</tbody></table></div>';
      } else {
        h += '<div class="card-body"><div class="empty" style="padding:28px 18px">' +
          UI.icon('clock', 'ei') + '<b>No reminder rules</b>' +
          '<span>Without these the system will not warn you about anything. Add at least one.</span>' +
          '</div></div>';
      }
      h += '</div>';

      /* add or edit */
      h += '<div class="card"><div class="card-head"><h3>' +
        (editing ? 'Edit &ldquo;' + UI.esc(editing.what) + '&rdquo;' : 'Add a rule') + '</h3>' +
        '<span class="spacer"></span>' +
        (editing ? '<button class="btn btn--sm btn--ghost" data-do="rem.cancel">Cancel</button>' : '') +
        '</div><div class="card-body"><div class="form-grid">' +
          UI.field('What it watches', { id:'r-what', span:true,
            value: editing ? editing.what : '', placeholder:'Background checks' }) +
          UI.field('Warn this many days ahead', { id:'r-advance',
            value: editing ? (editing.advance || []).join(', ') : '',
            placeholder:'60, 30, 14, 7',
            hint:'Comma separated. One reminder goes out on each of those days.' }) +
          UI.field('When it goes overdue', { id:'r-overdue', type:'select',
            value: editing ? editing.overdue : 'Immediately',
            options:[{ value:'Immediately', label:'Immediately' },
                     { value:'Next morning', label:'Next morning' },
                     { value:'On the 7th', label:'On the 7th of the month' },
                     { value:'Never', label:'Do not alert' }] }) +
          UI.field('Escalate to a manager after', { id:'r-escalate',
            value: editing ? editing.escalate : '7', hint:'Days with nobody acting on it' }) +
          UI.field('Send an email as well', { id:'r-email', type:'select',
            value: editing ? (editing.email ? 'yes' : 'no') : 'yes',
            options:[{ value:'yes', label:'Yes — email whoever owns it' },
                     { value:'no',  label:'No — dashboard only' }],
            hint:'Emails never contain any client detail' }) +
        '</div>' +
        '<div class="row"><span class="spacer"></span>' +
          (editing
            ? '<button class="btn btn--primary" data-do="rem.save" data-id="' + UI.esc(editing.id) + '">' +
              UI.icon('check') + 'Save changes</button>'
            : '<button class="btn btn--primary" data-do="rem.add">' + UI.icon('plus') + 'Add this rule</button>') +
        '</div></div></div>';

      h += UI.banner('info', 'Changing these needs no developer',
        'They take effect on the next nightly run. This is the screen that decides how noisy ' +
        'or how quiet the system is, so it belongs to you rather than to us.');

      if (DB.setupStep() < 6) {
        h += '<div class="card"><div class="card-foot">' +
          UI.btn('Back', { goto: 'setup.programmes' }) + '<span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="setup.reminders" data-goto="dash.home">' +
          UI.icon('arrow') + 'These are fine — continue</button></div></div>';
      }

      return h + '</div>';
    }
  });

  screen('set.thresholds', {
    title: 'Automatic rules', nav: 'settings',
    crumb: '<b>Settings</b> <span>&rsaquo;</span> Thresholds',
    render: function () {
      var t = DB.settings().thresholds || {};
      var b = t.budgetAlerts || [75, 90, 100];

      var h = '<div class="page">' + head('Automatic rules', 'When the system acts without being asked') + tabs('Thresholds');

      h += '<div class="grid grid-2">' +
        rule('th-inc', 'Quality item from incidents', 'More than', t.qiFromIncidents,
             'incidents for one client in a calendar month') +
        rule('th-hosp', 'Quality item from hospital stays', 'More than', t.qiFromHospitalStays,
             'hospital stays for one client in a calendar month') +
        rule('th-b1', 'Budget alert — first', 'At', b[0], 'per cent of the authorisation used') +
        rule('th-b2', 'Budget alert — second', 'At', b[1], 'per cent of the authorisation used') +
        rule('th-b3', 'Budget alert — exhausted', 'At', b[2], 'per cent of the authorisation used') +
        rule('th-isp', 'ISP progress drop', 'A fall of', t.ispDropPoints, 'points or more from last month') +
        rule('th-chase', 'Incident follow-up chase', 'After', t.incidentChaseDays,
             'days is when a new follow-up falls due') +
        rule('th-esc', 'Escalate to a manager', 'After', t.escalateAfterDays,
             'days with nobody acting on it') +
      '</div>';

      h += '<div class="card"><div class="card-head"><h3>Nurse visit after a hospital stay</h3>' +
        '<span class="spacer"></span>' +
        '<span class="check' + (t.nurseVisitAfterDischarge ? ' on' : '') + '" data-do="th.toggle">' +
        '<span class="bx">' + (t.nurseVisitAfterDischarge
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'
          : '') + '</span>Required</span></div>' +
        '<div class="card-body"><span class="small muted">' +
        (t.nurseVisitAfterDischarge
          ? 'A hospital stay cannot be closed until a nurse visit is recorded.'
          : 'A hospital stay can be closed without a nurse visit being recorded.') +
        '</span></div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'set.reminders' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="th.save">' + UI.icon('check') + 'Save these rules</button>' +
        '</div></div>';

      h += UI.banner('info', 'These are the rules that make the system feel alive',
        'Every one of them is a number the office can change. None of them needs code, and they take effect immediately.');

      return h + '</div>';
    }
  });

  function rule(id, name, pre, val, post) {
    return '<div class="card"><div class="card-head"><h3 style="font-size:14px">' + name + '</h3>' +
      '<span class="spacer"></span>' + UI.badge('On', 'ok') + '</div>' +
      '<div class="card-body" style="gap:10px">' +
      '<div class="row" style="gap:8px"><span class="small muted">' + pre + '</span>' +
      '<input class="input" data-inert id="' + id + '" value="' + UI.esc(String(val == null ? '' : val)) + '" ' +
      'style="width:78px;text-align:center;font-weight:700;font-family:var(--mono)">' +
      '<span class="small muted" style="flex:1">' + post + '</span></div></div></div>';
  }

  screen('set.checklist', {
    title: 'Waiver checklist builder', nav: 'settings',
    crumb: '<b>Settings</b> <span>&rsaquo;</span> Waiver checklists',
    render: function (S) {
      var progs = DATA.PROGRAMMES;
      var sel = DB.get('programmes', S.vars.progId) || progs[0] || null;

      var h = '<div class="page">' +
        head('Waiver checklists', 'The required documents for each programme — edit when the rules change') +
        tabs('Waiver checklists');

      if (!progs.length) {
        h += UI.emptyModule({ icon:'doc', title:'No programmes set up',
          body:'Each waiver programme carries its own list of required documents. Add your first one to begin.',
          actions:[{ label:'Set up programmes', primary:true, goto:'setup.programmes' }] });
        return h + '</div>';
      }

      h += '<div class="card"><div class="filters">' +
        progs.map(function (p) {
          return '<span class="fchip' + (sel && p.id === sel.id ? ' on' : '') + '" ' +
                 'data-do="prog.select" data-id="' + UI.esc(p.id) + '">' +
                 UI.esc(p.name) + ' · ' + UI.esc(p.agency ? DATA.agencyShort(p.agency) : '—') + '</span>';
        }).join('') +
        '<span class="spacer"></span>' +
        UI.btn('Add a programme', { cls:'btn--sm', icon:'plus', goto:'setup.programmes' }) +
        '</div>';

      if (sel && (sel.docs || []).length) {
        h += '<div class="tbl-wrap"><table class="tbl" style="min-width:820px"><thead><tr>' +
          '<th>Required document</th><th>Has an expiry?</th><th>Renewal period</th><th>Required</th><th></th>' +
          '</tr></thead><tbody>';
        sel.docs.forEach(function (d, i) {
          h += '<tr data-row><td class="nm">' + UI.esc(d.name) + '</td>' +
            '<td class="small">' + (d.expires ? 'Yes' : 'No') + '</td>' +
            '<td class="small mono">' + UI.esc(d.period || '—') + '</td>' +
            '<td>' + (d.required ? UI.badge('Required', 'plum') : UI.badge('Optional', 'neutral')) + '</td>' +
            '<td class="right"><button class="btn btn--sm btn--ghost" data-do="doc.remove" ' +
              'data-id="' + UI.esc(sel.id) + '" data-i="' + i + '">Remove</button></td></tr>';
        });
        h += '</tbody></table></div>';
      } else {
        h += '<div class="card-body"><div class="empty" style="padding:26px 18px">' +
          UI.icon('doc', 'ei') + '<b>Nothing listed for ' + UI.esc(sel ? sel.name : '') + '</b>' +
          '<span>Add the documents this programme requires.</span></div></div>';
      }

      h += '<div class="card-foot">' +
        UI.btn('Add a document', { cls:'btn--sm', icon:'plus', goto:'setup.programmes' }) +
        '<span class="spacer"></span><span class="small muted">Changes apply to new clients immediately ' +
        'and flag existing files at the next nightly check.</span></div></div>';

      return h + '</div>';
    }
  });

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
