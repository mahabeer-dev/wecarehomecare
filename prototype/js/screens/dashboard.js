/* ============================================================
   Dashboard — entirely derived from what is in the store.

   Before setup is finished it shows the remaining setup steps,
   because there is nothing else it could honestly show. After
   that, every panel is built from real records, and each one has
   its own empty state.
   ============================================================ */

(function () {

  var SETUP = [
    { n:1, label:'Name your agencies',         goto:'setup.agencies' },
    { n:2, label:'Invite your team',           goto:'setup.team' },
    { n:3, label:'Add your waiver programmes', goto:'setup.programmes' },
    { n:4, label:'Check the reminder timings', goto:'set.reminders' },
    { n:5, label:'Import your clients',        goto:'clients.import' },
    { n:6, label:'Import your caregivers',     goto:'cg.import' }
  ];

  function alertRow(a) {
    return '<div class="clist-row" data-goto="' + (a.goto || '') + '">' +
      UI.badge(a.kind) +
      '<span style="display:flex;flex-direction:column;min-width:0">' +
        '<span class="cl-n">' + UI.esc(a.what) + '</span>' +
        '<span class="cl-s">' + UI.esc(a.who) + '</span>' +
      '</span>' +
      '<span class="cl-sp"></span>' +
      '<span class="small muted nowrap">' + UI.esc(a.when) + '</span>' +
      UI.icon('arrow') +
    '</div>';
  }

  function panelEmpty(msg) {
    return '<div class="card-body"><div class="empty" style="padding:30px 18px">' +
      UI.icon('check', 'ei') + '<b>' + UI.esc(msg) + '</b></div></div>';
  }

  /* ---------------- the setup dashboard ---------------- */

  function setupDash(S) {
    var d = DB.setupStep();
    var left = SETUP.length - d;

    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">' + (Object.keys(DATA.AGENCIES).length ? UI.esc(DATA.agencyShort(S.agency)) + ' · ' : '') +
      'Setting up</span>' +
      '<h1>Good morning, ' + UI.esc((APP.user().name || '').split(' ')[0]) + '</h1>' +
      '<span class="sub">Nothing to report yet. The system can only warn you about dates it knows about.</span>' +
      '</span></div>';

    /* No counters while there is nothing to count. The list is the dashboard. */
    h += '<div class="card"><div class="card-head"><h3>Finish setting up</h3>' +
      '<span class="spacer"></span><span class="sub">' + d + ' of ' + SETUP.length + ' done</span></div>' +
      '<div class="card-body" style="padding-bottom:10px">' +
        UI.progress(Math.round((d / SETUP.length) * 100)) + '</div>' +
      '<div class="clist">';

    SETUP.forEach(function (st, i) {
      var state = i < d ? 'done' : (i === d ? 'now' : 'later');
      h += '<div class="clist-row"' + (state === 'later' ? ' style="opacity:.45"' : ' data-goto="' + st.goto + '"') + '>' +
        '<span class="ava-sm ' + (state === 'done' ? '' : state === 'now' ? 'c2' : 'c4') + '">' +
          (state === 'done' ? '✓' : st.n) + '</span>' +
        '<span class="cl-n">' + UI.esc(st.label) + '</span>' +
        '<span class="cl-sp"></span>' +
        (state === 'done' ? UI.badge('Done', 'ok')
          : state === 'now' ? UI.badge('Next', 'plum') + UI.icon('arrow')
          : '<span class="small muted">waiting</span>') +
      '</div>';
    });

    h += '</div><div class="card-foot"><span class="small muted">' +
      (left === 1 ? 'One step left.' : left + ' steps left.') +
      ' Once these are done the dashboard fills itself in.</span></div></div>';

    return h + '</div>';
  }

  /* ---------------- the working dashboard ---------------- */

  function adminDash(S) {
    if (DB.setupStep() < SETUP.length) return setupDash(S);

    var ag = S.role === 'superadmin' ? S.agency : S.agency;
    var agName = DATA.agencyShort(ag);
    var c = APP.counts();
    var alerts = ALERTS.compute(ag);
    var recent = ALERTS.recent(ag);
    var comp = ALERTS.compliance(ag);
    var qi = DATA.inAgency(DATA.QI, ag);
    var auths = DATA.inAgency(DATA.AUTHS, ag);

    var h = '<div class="page">';

    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">' + UI.esc(agName) + '</span>' +
      '<h1>Good morning, ' + UI.esc((APP.user().name || '').split(' ')[0]) + '</h1>' +
      '<span class="sub">' + (alerts.length
        ? 'Everything below needs attention. Click any line to open the record.'
        : 'Nothing needs attention today.') + '</span>' +
      '</span><span class="ph-actions">' +
      UI.btn('Export', { icon:'doc', goto:'rep.export' }) +
      UI.btn('New task', { cls:'btn--primary', icon:'plus', goto:'tasks.new' }) +
      '</span></div>';

    h += '<div class="grid grid-4">' +
      UI.stat({ k:'Overdue tasks',  v:c.tasksOverdue, n:c.tasksOverdue ? 'across the team' : 'all clear',
                kind:c.tasksOverdue ? 'bad' : 'ok', goto:'tasks.list' }) +
      UI.stat({ k:'Budget alerts',  v:c.budgetAlerts, n:c.budgetAlerts ? 'at or above 75%' : 'all under 75%',
                kind:c.budgetAlerts ? 'warn' : 'ok', goto:'budget.list' }) +
      UI.stat({ k:'Open incidents', v:c.incOpen, n:c.incOpen ? 'awaiting follow-up' : 'none open',
                kind:c.incOpen ? 'info' : 'ok', goto:'inc.list' }) +
      UI.stat({ k:'Reviews due',    v:c.ovDue, n:c.ovDue ? 'next 30 days' : 'nothing due',
                kind:c.ovDue ? 'warn' : 'ok', goto:'ov.list' }) +
    '</div>';

    h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

    /* needs attention */
    h += '<div class="card"><div class="card-head"><h3>Needs attention now</h3>' +
      '<span class="spacer"></span><span class="sub">' + alerts.length + ' item' + (alerts.length === 1 ? '' : 's') + '</span></div>';
    if (alerts.length) {
      h += '<div class="clist">' + alerts.slice(0, 10).map(alertRow).join('') + '</div>' +
        '<div class="card-foot"><span class="small muted">Filtered to ' + UI.esc(agName) + ' only.</span>' +
        '<span class="spacer"></span>' +
        (alerts.length > 10 ? UI.btn('See all ' + alerts.length, { cls:'btn--sm btn--ghost', goto:'tasks.list' }) : '') +
        '</div>';
    } else {
      h += panelEmpty('Nothing is due or overdue');
    }
    h += '</div>';

    /* budget */
    h += '<div class="card"><div class="card-head"><h3>Authorisation utilisation</h3>' +
      '<span class="spacer"></span>' + UI.btn('Open', { cls:'btn--sm', goto:'budget.list' }) + '</div>';
    if (auths.length) {
      h += '<div class="card-body">' + auths.slice(0, 3).map(function (a) {
        return budgetLine(a.clientName, a.service, DATA.authCalc(a));
      }).join('') + '</div>';
    } else {
      h += panelEmpty('No authorisations yet');
    }
    h += '</div>';

    h += '</div><div class="grid" style="gap:16px">';

    /* this week */
    h += '<div class="card"><div class="card-head"><h3>Recently</h3></div>';
    h += recent.length
      ? '<div class="card-body"><div class="tl">' + recent.map(function (r) {
          return UI.tlItem(r.state, UI.esc(r.what), UI.esc(r.who));
        }).join('') + '</div></div>'
      : panelEmpty('Nothing has happened yet');
    h += '</div>';

    /* quality */
    h += '<div class="card"><div class="card-head"><h3>Quality</h3><span class="spacer"></span>' +
      (qi.length ? UI.badge(qi.length + ' open', 'warn') : UI.badge('None open', 'ok')) + '</div>';
    h += qi.length
      ? '<div class="clist">' + qi.map(function (q) {
          return '<div class="clist-row" data-goto="qi.detail">' +
            '<span style="display:flex;flex-direction:column;min-width:0">' +
            '<span class="cl-n">' + UI.esc(q.title) + '</span>' +
            '<span class="cl-s">' + UI.esc(q.source) + '</span></span>' +
            '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>';
        }).join('') + '</div>'
      : panelEmpty('No quality items open');
    h += '</div>';

    /* caregiver compliance */
    h += '<div class="card"><div class="card-head"><h3>Caregiver compliance</h3>' +
      '<span class="spacer"></span>' + UI.btn('Open', { cls:'btn--sm', goto:'cg.list' }) + '</div>';
    h += comp.total
      ? '<div class="card-body" style="gap:10px">' +
          compLine('Expired', comp.expired, 'bad') +
          compLine('Expiring in 60 days', comp.soon, 'warn') +
          compLine('Current', comp.ok, 'ok') +
        '</div>'
      : panelEmpty('No caregivers yet');
    h += '</div>';

    h += '</div></div>';

    return h + '</div>';
  }

  function budgetLine(who, svc, c) {
    return '<div class="card--click" data-goto="budget.detail" style="display:flex;flex-direction:column;gap:7px;padding:11px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer">' +
      '<div class="meter-top"><b>' + UI.esc(who) + '</b>' +
      '<span class="muted small">' + UI.esc(svc) + '</span>' +
      '<span class="pc">' + c.pc + '%</span></div>' +
      UI.meter(c.pc) +
      '<div class="small muted">' + c.hoursLeft.toFixed(1) + ' hours left · ' + DATA.money(c.dollarsLeft) + ' remaining</div>' +
    '</div>';
  }

  function compLine(label, n, kind) {
    return '<div class="row"><span style="width:9px;height:9px;border-radius:50%;background:var(--' +
      (kind === 'bad' ? 'r-500' : kind === 'warn' ? 'g-300' : 'gr-500') + ')"></span>' +
      '<span class="small">' + label + '</span><span class="spacer"></span>' +
      '<b class="mono">' + n + '</b></div>';
  }

  /* ---------------- nurse ---------------- */

  function nurseDash(S) {
    if (DB.setupStep() < SETUP.length) return setupDash(S);

    var me = (APP.user() || {}).name;
    var mine = ALERTS.compute(S.agency).filter(function (a) {
      return a.goto === 'inc.detail' || a.goto === 'hosp.visit' ||
             a.goto === 'ov.hrst' || a.goto === 'ov.list';
    });

    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">' + UI.esc(DATA.agencyShort(S.agency)) + '</span>' +
      '<h1>Your visits, ' + UI.esc((me || '').split(' ')[0]) + '</h1>' +
      '<span class="sub">You see the clients you are assigned to. Admin areas are hidden for your role.</span>' +
      '</span></div>';

    var overdue = mine.filter(function (a) { return a.kind === 'Overdue'; }).length;
    var soon    = mine.filter(function (a) { return a.kind === 'Due soon'; }).length;

    h += '<div class="grid grid-3">' +
      UI.stat({ k:'Visits overdue',  v:overdue, n:overdue ? 'need doing today' : 'all clear',
                kind:overdue ? 'bad' : 'ok', goto:'hosp.list' }) +
      UI.stat({ k:'Due soon',        v:soon, n:'next 7 days', kind:soon ? 'warn' : 'ok', goto:'ov.list' }) +
      UI.stat({ k:'Clients',         v:DATA.inAgency(DATA.CLIENTS, S.agency).length, n:'in your agency', kind:'info', goto:'clients.list' }) +
    '</div>';

    h += '<div class="card"><div class="card-head"><h3>Your list today</h3>' +
      '<span class="spacer"></span><span class="sub">' + mine.length + ' item' + (mine.length === 1 ? '' : 's') + '</span></div>';
    h += mine.length ? '<div class="clist">' + mine.map(alertRow).join('') + '</div>'
                     : panelEmpty('Nothing assigned to you today');
    h += '</div>';

    h += '<div class="card"><div class="card-head"><h3>What you cannot see</h3>' +
      '<span class="spacer"></span>' + UI.badge('Role limited', 'neutral') + '</div><div class="card-body">' +
      UI.banner('info', 'Authorisations, caregiver records, quality, settings and the audit trail are hidden',
        'Nurses record clinical follow-up. Money, staffing and configuration belong to the office and the owner. ' +
        'Try the role switcher in the bar below to see the difference.') +
    '</div></div>';

    return h + '</div>';
  }

  screen('dash.home', {
    title: 'Dashboard', nav: 'dash',
    crumb: '<b>Dashboard</b>',
    render: function (S) { return S.role === 'nurse' ? nurseDash(S) : adminDash(S); }
  });

  screen('dash.empty', {
    title: 'Dashboard — nothing due', nav: 'dash',
    crumb: '<b>Dashboard</b>',
    render: function (S) {
      return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + UI.esc(DATA.agencyShort(S.agency)) + '</span>' +
        '<h1>Nothing needs attention</h1>' +
        '<span class="sub">This is what a good day looks like.</span></span></div>' +
        '<div class="grid grid-4">' +
          UI.stat({ k:'Overdue tasks', v:0, n:'all clear',      kind:'ok' }) +
          UI.stat({ k:'Budget alerts', v:0, n:'all under 75%',  kind:'ok' }) +
          UI.stat({ k:'Open incidents',v:0, n:'none open',      kind:'ok' }) +
          UI.stat({ k:'Reviews due',   v:0, n:'next 30 days',   kind:'ok' }) +
        '</div>' +
        '<div class="card">' +
        panelEmpty('Everything is up to date') +
        '</div></div>';
    }
  });

})();
