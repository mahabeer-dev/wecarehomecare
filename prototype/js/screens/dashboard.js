/* ============================================================
   Dashboard — one screen that changes shape with the role
   ============================================================ */

(function () {

  function alertRow(kind, what, who, when, goTo) {
    return '<div class="clist-row" data-goto="' + (goTo || '') + '">' +
      UI.badge(kind) +
      '<span style="display:flex;flex-direction:column;min-width:0">' +
        '<span class="cl-n">' + what + '</span>' +
        '<span class="cl-s">' + who + '</span>' +
      '</span>' +
      '<span class="cl-sp"></span>' +
      '<span class="small muted nowrap">' + when + '</span>' +
      UI.icon('arrow') +
    '</div>';
  }

  function adminDash(S) {
    var ag = S.role === 'superadmin' ? null : S.agency;
    var agName = S.role === 'superadmin' ? DATA.agencyShort(S.agency) : APP.agency().short;
    var c = APP.counts();

    var auths = DATA.inAgency(DATA.AUTHS, ag || S.agency);

    var h = '<div class="page">';

    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">' + UI.esc(agName) + ' · Tuesday 5 May 2026</span>' +
      '<h1>Good morning, ' + UI.esc(APP.user().name.split(' ')[0]) + '</h1>' +
      '<span class="sub">Everything below needs attention today. Click any line to open the record.</span>' +
      '</span><span class="ph-actions">' +
      UI.btn('Export', { icon: 'doc', goto: 'rep.export' }) +
      UI.btn('New task', { cls: 'btn--primary', icon: 'plus', goto: 'tasks.new' }) +
      '</span></div>';

    /* stat row */
    h += '<div class="grid grid-4">' +
      UI.stat({ k: 'Overdue tasks',     v: c.tasksOverdue, n: 'across the team',      kind: 'bad',  goto: 'tasks.list' }) +
      UI.stat({ k: 'Budget alerts',     v: c.budgetAlerts, n: 'at or above 75%',      kind: 'warn', goto: 'budget.list' }) +
      UI.stat({ k: 'Open incidents',    v: c.incOpen,      n: 'awaiting follow-up',   kind: 'info', goto: 'inc.list' }) +
      UI.stat({ k: 'Reviews due',       v: c.ovDue,        n: 'next 30 days',         kind: 'warn', goto: 'ov.list' }) +
    '</div>';

    h += '<div class="grid grid-sb">';

    /* main column */
    h += '<div class="grid" style="gap:16px">';

    /* needs attention */
    h += '<div class="card"><div class="card-head"><h3>Needs attention now</h3>' +
      '<span class="spacer"></span><span class="sub">9 items</span></div>' +
      '<div class="clist">' +
        alertRow('Overdue', 'Nurse follow-up visit not completed', 'Maria Lopez · incident 3 Apr · Yvonne Pryce', '25 days late', 'inc.detail') +
        alertRow('Overdue', 'Supervisor visit missed', 'Harold Bramlett · every 30 days', '20 days late', 'ov.list') +
        alertRow('Overdue', 'HRST annual review not done', 'Sylvia Trent · Yvonne Pryce', '33 days late', 'ov.hrst') +
        alertRow('Overdue', 'CPR certification expired', 'Marcus Odell · caregiver', '9 weeks late', 'cg.detail') +
        alertRow('Expired', 'Annual health assessment', 'Maria Lopez · waiver document', 'expired 11 Feb', 'clients.checklist') +
        alertRow('Due soon', 'Service agreement expires', 'Adaeze Okafor', 'in 12 days', 'clients.list') +
        alertRow('Due soon', 'DDP quarterly review', 'Adaeze Okafor · external DDP', 'in 9 days', 'ov.ddp') +
        alertRow('Due soon', 'Nurse visit after discharge', 'Sylvia Trent · ER 2 Apr', 'overdue 26 days', 'hosp.detail') +
        alertRow('Missing', 'Physician order for services', 'Maria Lopez · waiver document', 'not on file', 'clients.checklist') +
      '</div>' +
      '<div class="card-foot"><span class="small muted">Filtered to ' + UI.esc(agName) + ' only.</span>' +
      '<span class="spacer"></span>' + UI.btn('See all alerts', { cls: 'btn--sm btn--ghost', goto: 'tasks.list' }) + '</div>' +
    '</div>';

    /* budget watch */
    h += '<div class="card"><div class="card-head"><h3>Authorisation utilisation</h3>' +
      '<span class="spacer"></span>' + UI.btn('Open', { cls: 'btn--sm', goto: 'budget.list' }) + '</div>' +
      '<div class="card-body">' +
        (auths.length
          ? auths.slice(0, 3).map(function (a) {
              var used = (a.id === 'a1' && S.vars.a1used != null) ? S.vars.a1used : a.used;
              return budgetLine(a.clientName, a.service, DATA.authCalc(a, used));
            }).join('')
          : '<span class="small muted">No authorisations yet.</span>') +
      '</div>' +
    '</div>';

    h += '</div>'; /* end main column */

    /* side column */
    h += '<div class="grid" style="gap:16px">';

    h += '<div class="card"><div class="card-head"><h3>This week</h3></div><div class="card-body">' +
      '<div class="tl">' +
        UI.tlItem('ok',  'Healthcare Plan reviewed', 'Maria Lopez · 23 Apr · Yvonne Pryce') +
        UI.tlItem('ok',  'Risk Mitigation Plan reviewed', 'Maria Lopez · 23 Apr · Yvonne Pryce') +
        UI.tlItem('bad', 'Third incident this month', 'Maria Lopez · 30 Apr · quality item opened') +
        UI.tlItem('now', 'Supervisor visit due', 'Maria Lopez · 28 Apr · Renee Alcott') +
        UI.tlItem('',    'Monthly ISP entries due', 'All Georgia clients · 5 May') +
      '</div></div></div>';

    h += '<div class="card"><div class="card-head"><h3>Quality</h3>' +
      '<span class="spacer"></span>' + UI.badge('2 open', 'warn') + '</div>' +
      '<div class="clist">' +
        '<div class="clist-row" data-goto="qi.detail">' +
          '<span style="display:flex;flex-direction:column;min-width:0">' +
          '<span class="cl-n">Repeat falls — Maria Lopez</span>' +
          '<span class="cl-s">Opened automatically · 3 incidents in April</span></span>' +
          '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="qi.list">' +
          '<span style="display:flex;flex-direction:column;min-width:0">' +
          '<span class="cl-n">Late medication administration</span>' +
          '<span class="cl-s">Manual · pattern noticed by manager</span></span>' +
          '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
      '</div></div>';

    h += '<div class="card"><div class="card-head"><h3>Caregiver compliance</h3>' +
      '<span class="spacer"></span>' + UI.btn('Open', { cls: 'btn--sm', goto: 'cg.list' }) + '</div>' +
      '<div class="card-body" style="gap:10px">' +
        compLine('Expired', 2, 'bad') +
        compLine('Expiring in 30 days', 3, 'warn') +
        compLine('Current', 5, 'ok') +
      '</div></div>';

    h += '</div></div>'; /* end side + grid-sb */

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

  function nurseDash() {
    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">Georgia · Tuesday 5 May 2026</span>' +
      '<h1>Your visits, Yvonne</h1>' +
      '<span class="sub">You see the clients you are assigned to. Admin areas are hidden for your role.</span>' +
      '</span></div>';

    h += '<div class="grid grid-3">' +
      UI.stat({ k: 'Visits overdue',   v: 2, n: 'need doing today', kind: 'bad',  goto: 'hosp.list' }) +
      UI.stat({ k: 'Visits due',       v: 3, n: 'next 7 days',      kind: 'warn', goto: 'ov.list' }) +
      UI.stat({ k: 'Reviews assigned', v: 4, n: 'HRST and plans',   kind: 'info', goto: 'ov.list' }) +
    '</div>';

    h += '<div class="card"><div class="card-head"><h3>Your list today</h3></div><div class="clist">' +
      alertRow('Overdue', 'Follow-up visit after fall', 'Maria Lopez · incident 3 Apr', '25 days late', 'inc.detail') +
      alertRow('Overdue', 'Nurse visit after ER discharge', 'Sylvia Trent · ER 2 Apr', '26 days late', 'hosp.visit') +
      alertRow('Due soon', 'HRST review triggered by incident', 'Maria Lopez', 'due 24 Apr', 'ov.hrst') +
      alertRow('Due soon', 'Annual reassessment', 'Curtis Nabors', 'due 11 May', 'ov.assess') +
      alertRow('Open', 'Awaiting discharge', 'Harold Bramlett · admitted 9 Apr', 'monitoring', 'hosp.detail') +
    '</div></div>';

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
    render: function (S) { return S.role === 'nurse' ? nurseDash() : adminDash(S); }
  });

  screen('dash.empty', {
    title: 'Dashboard — nothing due', nav: 'dash',
    crumb: '<b>Dashboard</b>',
    render: function () {
      return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Mississippi · Tuesday 5 May 2026</span>' +
        '<h1>Nothing needs attention</h1>' +
        '<span class="sub">This is what a good day looks like.</span></span></div>' +
        '<div class="grid grid-4">' +
          UI.stat({ k: 'Overdue tasks', v: 0, n: 'all clear',    kind: 'ok' }) +
          UI.stat({ k: 'Budget alerts', v: 0, n: 'all under 75%',kind: 'ok' }) +
          UI.stat({ k: 'Open incidents',v: 0, n: 'none open',    kind: 'ok' }) +
          UI.stat({ k: 'Reviews due',   v: 0, n: 'next 30 days', kind: 'ok' }) +
        '</div>' +
        '<div class="card"><div class="card-body">' +
        UI.empty('Everything is up to date', 'When something falls due, it appears here and an email goes to whoever owns it.') +
        '</div></div></div>';
    }
  });

})();
