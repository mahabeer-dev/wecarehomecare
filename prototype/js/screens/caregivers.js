/* ============================================================
   Caregivers — compliance records only, never system users.

   The import brings their details. Role, agency and every
   credential are set by an administrator afterwards.
   ============================================================ */

(function () {

  var LABEL = { expired: 'Expired', soon: 'Due soon', ok: 'Current', none: 'Nothing added', replaced: 'Replaced' };

  function stateBadge(st) {
    return st === 'expired' ? UI.badge('Expired', 'bad')
         : st === 'soon'    ? UI.badge('Due soon', 'warn')
         : st === 'ok'      ? UI.badge('Current', 'ok')
         :                    '<span class="small muted">nothing added</span>';
  }

  function counts() {
    var f = DATA.CAREGIVER_FILE.rows;
    return {
      total: f.length,
      ok:  f.filter(function (r) { return r.outcome === 'ok'; }).length,
      dup: f.filter(function (r) { return r.outcome === 'duplicate'; }).length
    };
  }

  /* ---------------- list ---------------- */

  screen('cg.list', {
    title: 'Caregiver list', nav: 'caregivers',
    crumb: '<b>Caregivers</b>',
    render: function (S) {
      var rows = DATA.CAREGIVERS.filter(function (g) {
        return !g.agency || !S.agency || g.agency === S.agency;
      });

      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Caregivers</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({
          icon: 'badge', title: 'No staff records yet',
          body: 'Bring your people in from a spreadsheet. None of them will get a login — ' +
                'these are compliance records so their licences and training can be tracked.',
          actions: [{ label: 'Import from Excel', primary: true, icon: 'upload', goto: 'cg.import' }],
          note: 'Their role and credentials are set here afterwards, not read from the file.'
        }) + '</div>';

      var needSetup = rows.filter(function (g) { return !g.role || !DATA.credsFor(g.id).length; }).length;
      var expired = rows.filter(function (g) { return DATA.compliance(g.id).state === 'expired'; }).length;
      var soon    = rows.filter(function (g) { return DATA.compliance(g.id).state === 'soon'; }).length;

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Caregivers</h1>' +
        '<span class="sub">' + rows.length + ' in ' + UI.esc(DATA.agencyShort(S.agency)) +
        ' · compliance records, not user accounts</span></span>' +
        '<span class="ph-actions">' + UI.btn('Import from Excel', { icon: 'upload', goto: 'cg.import' }) +
        UI.btn('Add someone', { cls: 'btn--primary', icon: 'plus', goto: 'cg.import' }) + '</span></div>';

      if (needSetup) {
        h += UI.banner('warn', needSetup + (needSetup === 1 ? ' person still needs' : ' people still need') + ' setting up',
          'A caregiver with no role or no credentials on file is not being checked for anything.');
      }

      h += '<div class="grid grid-3">' +
        UI.stat({ k:'Expired',            v:expired, n:expired ? 'act today' : 'none', kind: expired ? 'bad' : 'ok', goto:'cg.expiry' }) +
        UI.stat({ k:'Expiring in 60 days',v:soon,    n:'reminders sent',  kind: soon ? 'warn' : 'ok', goto:'cg.expiry' }) +
        UI.stat({ k:'Needs setting up',   v:needSetup, n:'no role or nothing on file', kind: needSetup ? 'warn' : 'ok' }) +
      '</div>';

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
        '<span class="fchip">Needs setting up <span class="ct">' + needSetup + '</span></span>' +
        '<span class="fchip">Something expired <span class="ct">' + expired + '</span></span>' +
        '<span class="fchip">Expiring soon <span class="ct">' + soon + '</span></span>' +
        '<span class="spacer"></span><span class="fchip">' + UI.icon('doc') + 'Export</span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:820px"><thead><tr>' +
        '<th>Name</th><th>Role</th><th>Agency</th><th>Credentials</th><th>Compliance</th><th>Account</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (g, i) {
        var comp = DATA.compliance(g.id);
        h += '<tr data-row data-do="cg.open" data-id="' + UI.esc(g.id) + '" data-goto="cg.detail">' +
          '<td><span class="rowmain"><span class="ava-sm ' + (i % 3 === 1 ? 'c2' : i % 3 === 2 ? 'c4' : '') + '">' +
            UI.esc(UI.initials(g.name)) + '</span>' +
            '<span><span class="nm">' + UI.esc(g.name) + '</span><br>' +
            '<span class="sub2">' + UI.esc(g.email || '—') + '</span></span></span></td>' +
          '<td class="small">' + (g.role ? UI.esc(g.role) : '<span class="muted">not set</span>') + '</td>' +
          '<td class="small">' + (g.agency ? UI.esc(DATA.agencyShort(g.agency)) : '<span class="muted">—</span>') + '</td>' +
          '<td class="num small">' + (comp.total ? comp.total + ' tracked' : '<span class="muted">none yet</span>') + '</td>' +
          '<td>' + stateBadge(comp.state) + '</td>' +
          '<td><span class="small muted">no login</span></td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  /* ---------------- import ---------------- */

  screen('cg.import', {
    title: 'Import staff — choose a file', nav: 'caregivers',
    crumb: 'Caregivers <span>&rsaquo;</span> <b>Import</b>',
    render: function () {
      var f = DATA.CAREGIVER_FILE, c = counts();
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Import caregivers</h1>' +
        '<span class="sub">Their details only. Roles and credentials are set here afterwards, ' +
        'not read from the file.</span></span></div>' +

        '<div class="card"><div class="card-body">' +
          '<div style="border:2px dashed var(--border-strong);border-radius:11px;padding:34px 24px;' +
          'text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center">' +
            UI.icon('upload', 'ei') +
            '<b>Drop your Excel or CSV file here</b>' +
            '<span class="small muted">.xlsx and .csv accepted</span>' +
          '</div>' +

          '<button class="card card--click" data-goto="cg.import.check" style="padding:16px;text-align:left">' +
            '<div class="row">' + UI.icon('doc') + '<b class="small">' + UI.esc(f.name) + '</b>' +
            '<span class="spacer"></span>' + UI.badge(c.total + ' rows', 'neutral') + '</div>' +
            '<span class="small muted" style="display:block;margin-top:6px">' +
              c.ok + ' good rows and ' + c.dup + ' duplicate. Click to check it.</span>' +
          '</button>' +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>Columns in the file</h3></div><div class="card-body">' +
          '<div class="row small" style="gap:6px">' +
          f.columns.map(function (col) { return '<span class="badge badge--neutral">' + col + '</span>'; }).join('') +
          '</div>' +
          '<span class="small muted">Role, agency, hire date and every licence or training record are ' +
          'deliberately not in here. An administrator sets those once the person exists.</span>' +
        '</div></div>' +
      '</div>';
    }
  });

  screen('cg.import.check', {
    title: 'Import staff — checking the file', nav: 'caregivers',
    crumb: 'Caregivers <span>&rsaquo;</span> <b>Import</b>',
    render: function () {
      var f = DATA.CAREGIVER_FILE, c = counts();

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>What we found in the file</h1>' +
        '<span class="sub">' + UI.esc(f.name) + ' · ' + c.total + ' rows read · nothing saved yet</span>' +
        '</span></div>';

      h += '<div class="grid grid-2">' +
        UI.stat({ k:'Will import', v:c.ok,  n:'rows are fine',        kind:'ok' }) +
        UI.stat({ k:'Duplicates',  v:c.dup, n:'already in this file', kind:'warn' }) +
      '</div>';

      h += '<div class="card"><div class="card-head"><h3>Every row</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl" style="min-width:760px"><thead><tr>' +
        '<th>Row</th><th>Name</th><th>Phone</th><th>Email</th><th>What happens</th><th>Why</th>' +
        '</tr></thead><tbody>';

      f.rows.forEach(function (r) {
        h += '<tr data-row' + (r.outcome !== 'ok' ? ' style="background:var(--n-25)"' : '') + '>' +
          '<td class="num mono">' + r.row + '</td>' +
          '<td class="nm">' + UI.esc(r.first + ' ' + r.last) + '</td>' +
          '<td class="small">' + UI.esc(r.phone) + '</td>' +
          '<td class="small muted">' + UI.esc(r.email) + '</td>' +
          '<td>' + (r.outcome === 'ok' ? UI.badge('Will import', 'ok') : UI.badge('Duplicate — skipped', 'warn')) + '</td>' +
          '<td class="small muted">' + UI.esc(r.why || '—') + '</td></tr>';
      });

      h += '</tbody></table></div><div class="card-foot">' +
        UI.btn('Upload a different file', { goto: 'cg.import' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="import.caregivers" data-goto="cg.import.done">' +
        UI.icon('check') + 'Import the ' + c.ok + ' good rows</button></div></div>';

      return h + '</div>';
    }
  });

  screen('cg.import.done', {
    title: 'Import staff — done', nav: 'caregivers',
    crumb: 'Caregivers <span>&rsaquo;</span> <b>Import</b>',
    render: function () {
      var c = counts();
      return '<div class="page page--narrow">' +
        '<div class="card"><div class="card-body" style="align-items:center;text-align:center;padding:44px 24px;gap:14px">' +
        '<span style="width:56px;height:56px;border-radius:50%;background:var(--gr-50);color:var(--gr-500);display:grid;place-items:center">' +
        UI.icon('check', 'ei') + '</span>' +
        '<h1 style="margin:0;font-size:24px;font-weight:650">' + c.ok + ' caregivers imported</h1>' +
        '<p class="muted" style="max-width:46ch">' + c.dup + ' duplicate row was skipped. ' +
        'Each person now needs a role and their credentials adding, which you do on their own page.</p>' +
        '<div class="row" style="justify-content:center;margin-top:6px">' +
          UI.btn('Set the first one up', { cls: 'btn--primary', goto: 'cg.list' }) +
        '</div></div></div>' +

        '<div class="card"><div class="card-head"><h3>What still has to be done</h3></div>' +
        '<div class="card-body"><div class="tl">' +
          UI.tlItem('ok',  'Their details', 'name, phone and email') +
          UI.tlItem('now', 'No role yet', 'set it and they can be assigned to clients') +
          UI.tlItem('',    'No credentials tracked yet', 'add their licence, CPR and training with dates') +
          UI.tlItem('',    'Nothing being chased yet', 'reminders start once dates exist') +
        '</div>' +
        '<span class="small muted">Nobody in this list gets a login, whatever their role.</span>' +
        '</div></div></div>';
    }
  });

  /* ---------------- one caregiver ---------------- */

  function setupCard(g) {
    var creds = DATA.credsFor(g.id);
    var steps = [
      { done: !!g.role, label: 'Give them a role and an agency',
        sub: g.role ? g.role + ' · ' + (g.agency ? DATA.agencyShort(g.agency) : '—') : 'what they do, and where',
        goto: 'cg.role' },
      { done: creds.length > 0, label: 'Add what they have to hold',
        sub: creds.length ? creds.length + ' tracked' : 'licence, CPR, training, background check',
        goto: 'cg.credential' }
    ];
    var left = steps.filter(function (s) { return !s.done; }).length;
    if (!left) return '';

    var h = '<div class="card"><div class="card-head"><h3>Finish setting up ' + UI.esc(g.name.split(' ')[0]) + '</h3>' +
      '<span class="spacer"></span><span class="sub">' + (steps.length - left) + ' of ' + steps.length + ' done</span></div>' +
      '<div class="clist">';
    steps.forEach(function (st, i) {
      h += '<div class="clist-row"' + (st.done ? ' style="opacity:.55;cursor:default"' : ' data-goto="' + st.goto + '"') + '>' +
        '<span class="ava-sm ' + (st.done ? '' : 'c2') + '">' + (st.done ? '✓' : (i + 1)) + '</span>' +
        '<span style="display:flex;flex-direction:column;min-width:0">' +
          '<span class="cl-n">' + UI.esc(st.label) + '</span>' +
          '<span class="cl-s">' + UI.esc(st.sub) + '</span></span>' +
        '<span class="cl-sp"></span>' +
        (st.done ? UI.badge('Done', 'ok') : UI.badge('Next', 'plum') + UI.icon('arrow')) +
      '</div>';
    });
    return h + '</div><div class="card-foot"><span class="small muted">' +
      'The import brought in their details. These are decisions, so they are made here.</span></div></div>';
  }

  screen('cg.detail', {
    title: 'Caregiver record', nav: 'caregivers',
    crumb: 'Caregivers <span>&rsaquo;</span> <b>Record</b>',
    render: function (S) {
      var g = DB.get('caregivers', S.vars.cgId) || DATA.CAREGIVERS[0];
      if (!g) return UI.noRecord('caregivers yet', 'Back to caregivers', 'cg.list');

      var live = DATA.credsFor(g.id).filter(function (c) { return c.status !== 'replaced'; });
      var past = DATA.credsFor(g.id).filter(function (c) { return c.status === 'replaced'; });
      var comp = DATA.compliance(g.id);

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + (g.agency ? UI.esc(DATA.agencyShort(g.agency)) : 'No agency') +
        (g.hired ? ' · hired ' + UI.esc(g.hired) : '') + '</span>' +
        '<h1>' + UI.esc(g.name) + '</h1>' +
        '<span class="sub">' + (g.role ? UI.esc(g.role) : 'No role set') + ' · no system account</span>' +
        '</span><span class="ph-actions">' +
        UI.btn('Add a requirement', { icon: 'plus', goto: 'cg.credential' }) + '</span></div>';

      h += setupCard(g);

      if (comp.expired) {
        h += UI.banner('bad', comp.expired + (comp.expired === 1 ? ' requirement has' : ' requirements have') + ' expired',
          'This shows on the dashboard every day until it is renewed.');
      }

      h += '<div class="card"><div class="card-head"><h3>What they have to hold</h3>' +
        '<span class="spacer"></span><span class="sub">' + live.length + ' tracked</span></div>';

      if (live.length) {
        h += '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
          '<th>Requirement</th><th>Completed</th><th>Expires</th><th>Status</th><th></th>' +
          '</tr></thead><tbody>';
        live.forEach(function (c) {
          h += '<tr data-row><td class="nm">' + UI.esc(c.name) + '</td>' +
            '<td class="num small">' + UI.esc(c.done) + '</td>' +
            '<td class="num small">' + UI.esc(c.due) + '</td>' +
            '<td>' + stateBadge(c.status) + '</td>' +
            '<td class="right nowrap">' +
              '<button class="btn btn--sm btn--ghost" data-do="cred.renew" data-id="' + UI.esc(c.id) + '">Renew</button>' +
              '<button class="btn btn--sm btn--ghost" data-do="cred.remove" data-id="' + UI.esc(c.id) + '">Remove</button>' +
            '</td></tr>';
        });
        h += '</tbody></table></div>';
      } else {
        h += '<div class="card-body"><div class="empty" style="padding:26px 18px">' +
          UI.icon('shield', 'ei') + '<b>Nothing being tracked</b>' +
          '<span>Add their licence, CPR and training so the dates get watched.</span></div></div>';
      }
      h += '</div>';

      if (past.length) {
        h += '<div class="card"><div class="card-head"><h3>Previous versions</h3>' +
          '<span class="spacer"></span>' + UI.badge('Never deleted', 'info') + '</div>' +
          '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
          '<th>Requirement</th><th>Completed</th><th>Replaced on</th></tr></thead><tbody>' +
          past.map(function (c) {
            return '<tr data-row><td class="nm">' + UI.esc(c.name) + '</td>' +
              '<td class="num small">' + UI.esc(c.done) + '</td>' +
              '<td class="num small">' + UI.esc(c.replacedOn || '—') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="card-foot"><span class="small muted">Renewing never overwrites. ' +
          'The old record stays readable for audit.</span></div></div>';
      }

      return h + '</div>';
    }
  });

  screen('cg.role', {
    title: 'Set a role', nav: 'caregivers',
    crumb: 'Caregivers <span>&rsaquo;</span> <b>Role</b>',
    render: function (S) {
      var g = DB.get('caregivers', S.vars.cgId) || DATA.CAREGIVERS[0];
      if (!g) return UI.noRecord('caregivers yet', 'Back to caregivers', 'cg.list');
      var agencies = DB.all('agencies');

      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + UI.esc(g.name) + '</span><h1>What do they do?</h1>' +
        '<span class="sub">Their role decides what they can be assigned to. It does not give them a login.</span>' +
        '</span></div>' +

        '<div class="card"><div class="card-body"><div class="form-grid">' +
          UI.field('Role', { id:'g-role', type:'select', value: g.role || 'Direct Support Professional',
            options:['Direct Support Professional','Home Health Aide','Registered Nurse',
                     'Licensed Practical Nurse','Behaviour Technician','Support Coordinator'] }) +
          UI.field('Agency', { id:'g-agency', type:'select', value: g.agency || (agencies[0] || {}).id || '',
            options: agencies.length
              ? agencies.map(function (a) { return { value:a.id, label:a.short }; })
              : [{ value:'', label:'no agencies yet' }] }) +
          UI.field('Hired on', { id:'g-hired', value: g.hired || '', placeholder:'Mar 2023' }) +
        '</div>' +
        UI.banner('info', 'Nurses are the exception, and only in one direction',
          'A nurse listed here is a compliance record like everyone else. If they also need to write ' +
          'follow-up visits, give them an account separately in Settings.') +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Back', { goto:'cg.detail' }) + '<span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="cg.role" data-goto="cg.credential">' +
          UI.icon('check') + 'Save and add their credentials</button></div></div></div>';
    }
  });

  screen('cg.credential', {
    title: 'Add a requirement', nav: 'caregivers',
    crumb: 'Caregivers <span>&rsaquo;</span> <b>Requirement</b>',
    render: function (S) {
      var g = DB.get('caregivers', S.vars.cgId) || DATA.CAREGIVERS[0];
      if (!g) return UI.noRecord('caregivers yet', 'Back to caregivers', 'cg.list');
      var mine = DATA.credsFor(g.id).filter(function (c) { return c.status !== 'replaced'; });
      var types = DATA.CREDENTIAL_TYPES;

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + UI.esc(g.name) + '</span><h1>What do they have to hold?</h1>' +
        '<span class="sub">Add each licence, certificate or training with the date it expires. ' +
        'The system chases them from then on.</span></span></div>';

      h += '<div class="card"><div class="card-head"><h3>Already tracked</h3>' +
        '<span class="spacer"></span>' +
        (mine.length ? UI.badge(mine.length + ' tracked', 'ok') : UI.badge('None yet', 'warn')) + '</div>';
      h += mine.length
        ? '<div class="clist">' + mine.map(function (c) {
            return '<div class="clist-row" style="cursor:default">' + stateBadge(c.status) +
              '<span style="display:flex;flex-direction:column;min-width:0">' +
              '<span class="cl-n">' + UI.esc(c.name) + '</span>' +
              '<span class="cl-s">expires ' + UI.esc(c.due) + '</span></span>' +
              '<span class="cl-sp"></span>' +
              '<button class="btn btn--sm btn--ghost" data-do="cred.remove" data-id="' + UI.esc(c.id) + '">Remove</button>' +
            '</div>';
          }).join('') + '</div>'
        : '<div class="card-body"><div class="empty" style="padding:22px 16px">' +
          UI.icon('shield', 'ei') + '<b>Nothing yet</b></div></div>';
      h += '</div>';

      h += '<div class="card"><div class="card-head"><h3>Add one</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Requirement', { id:'cr-name', type:'select',
            value: (types[0] || {}).name || '',
            options: types.map(function (t) { return { value:t.name, label:t.name + ' — renews every ' + t.renews }; }) }) +
          UI.field('Completed on', { id:'cr-done', value:'', placeholder:'12 Feb 2024' }) +
          UI.field('Expires on', { id:'cr-due', value:'', placeholder:'12 Feb 2026',
            hint:'Reminders go out 60, 30, 14 and 7 days before' }) +
          UI.field('Where it stands', { id:'cr-status', type:'select', value:'ok',
            options:[{ value:'ok', label:'Current' },
                     { value:'soon', label:'Expiring soon' },
                     { value:'expired', label:'Already expired' }] }) +
        '</div>' +
        '<div class="row"><span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="cred.add">' + UI.icon('plus') + 'Add this requirement</button>' +
        '</div></div></div>';

      h += '<div class="card"><div class="card-foot">' +
        UI.btn('Back to the list', { goto:'cg.list' }) + '<span class="spacer"></span>' +
        UI.btn('Done with ' + UI.esc(g.name.split(' ')[0]), { cls:'btn--primary', goto:'cg.detail' }) +
        '</div></div>';

      return h + '</div>';
    }
  });

  /* ---------------- expiry report ---------------- */

  screen('cg.expiry', {
    title: 'Expiry report', nav: 'caregivers',
    crumb: 'Caregivers <span>&rsaquo;</span> <b>Expiry report</b>',
    render: function (S) {
      var rows = [];
      DATA.CAREGIVERS.filter(function (g) { return !g.agency || !S.agency || g.agency === S.agency; })
        .forEach(function (g) {
          DATA.credsFor(g.id).filter(function (c) { return c.status !== 'replaced'; })
            .forEach(function (c) { rows.push({ g: g, c: c }); });
        });

      var order = { expired: 0, soon: 1, ok: 2 };
      rows.sort(function (a, b) { return (order[a.c.status] || 3) - (order[b.c.status] || 3); });

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>What expires when</h1>' +
        '<span class="sub">Everything being tracked, soonest first</span></span>' +
        '<span class="ph-actions">' + UI.btn('Export to Excel', { icon:'doc', goto:'rep.export' }) + '</span></div>';

      h += '<div class="card">';
      if (rows.length) {
        h += '<div class="tbl-wrap"><table class="tbl" style="min-width:760px"><thead><tr>' +
          '<th>Caregiver</th><th>Requirement</th><th>Completed</th><th>Expires</th><th>Status</th>' +
          '</tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr data-row data-do="cg.open" data-id="' + UI.esc(r.g.id) + '" data-goto="cg.detail">' +
              '<td class="nm">' + UI.esc(r.g.name) + '</td>' +
              '<td class="small">' + UI.esc(r.c.name) + '</td>' +
              '<td class="num small">' + UI.esc(r.c.done) + '</td>' +
              '<td class="num small">' + UI.esc(r.c.due) + '</td>' +
              '<td>' + stateBadge(r.c.status) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      } else {
        h += '<div class="card-body"><div class="empty" style="padding:44px 24px">' +
          UI.icon('shield', 'ei') + '<b>Nothing is being tracked yet</b>' +
          '<span>Add credentials against your staff and their dates appear here.</span></div></div>';
      }
      h += '</div>';

      return h + '</div>';
    }
  });

})();
