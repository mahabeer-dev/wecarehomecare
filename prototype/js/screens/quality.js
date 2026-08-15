/* ============================================================
   Quality Improvement — patterns, corrective plans, outcomes
   ============================================================ */

(function () {

  screen('qi.list', {
    title: 'Quality list', nav: 'qi',
    crumb: '<b>Quality</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.QI, S.agency);

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Quality Improvement</h1>' +
        '<span class="sub">Patterns across many events — not single incidents</span></span>' +
        '<span class="ph-actions">' + UI.btn('Open a quality item', { cls: 'btn--primary', icon: 'plus', goto: 'qi.detail' }) + '</span></div>';

      h += '<div class="grid grid-3">' +
        UI.stat({ k: 'Open items', v: '2', n: 'one raised automatically', kind: 'warn' }) +
        UI.stat({ k: 'Actions overdue', v: '0', n: 'all on schedule', kind: 'ok' }) +
        UI.stat({ k: 'Closed this year', v: '5', n: '3 confirmed effective', kind: 'info' }) +
      '</div>';

      h += '<div class="card"><div class="card-head"><h3>Items</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl" style="min-width:880px"><thead><tr>' +
        '<th>Item</th><th>Client</th><th>Raised by</th><th>Owner</th><th>Due</th><th>Status</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (q) {
        h += '<tr data-row data-goto="qi.detail">' +
          '<td class="nm">' + UI.esc(q.title) + '</td>' +
          '<td class="small">' + UI.esc(q.clientName) + '</td>' +
          '<td>' + (q.auto ? UI.badge('Automatic', 'info') : UI.badge('Manual', 'neutral')) +
            '<br><span class="sub2">' + UI.esc(q.source) + '</span></td>' +
          '<td class="small">' + UI.esc(q.owner) + '</td>' +
          '<td class="num small">' + UI.esc(q.due) + '</td>' +
          '<td>' + UI.badge(q.status) + '</td>' +
        '</tr>';
      });

      h += '</tbody></table></div></div>';

      h += '<div class="card"><div class="card-head"><h3>What opens an item automatically</h3>' +
        '<span class="spacer"></span>' + UI.btn('Change', { cls: 'btn--sm', goto: 'set.thresholds' }) + '</div>' +
        '<div class="card-body"><div class="row" style="gap:10px">' +
        '<span class="badge badge--warn">More than 2 incidents for one client in a month</span>' +
        '<span class="badge badge--warn">More than 2 hospital stays for one client in a month</span>' +
        '</div><span class="small muted">Both thresholds are set by the Super Admin and can be changed at any time.</span>' +
        '</div></div>';

      return h + '</div>';
    }
  });

  screen('qi.detail', {
    title: 'Quality item — repeat falls', nav: 'qi',
    crumb: 'Quality <span>›</span> <b>Repeat falls — Maria Lopez</b>',
    render: function () {
      var q = DATA.byId(DATA.QI, 'q1');

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Opened 30 April 2026</span>' +
        '<h1>Repeat falls — Maria Lopez</h1>' +
        '<span class="sub">Owner ' + UI.esc(q.owner) + ' · review due ' + UI.esc(q.due) + '</span></span>' +
        '<span class="ph-actions">' + UI.btn('Open client', { goto: 'clients.profile' }) +
        UI.btn('Review outcome', { cls: 'btn--primary', goto: 'qi.outcome' }) + '</span></div>';

      h += UI.banner('info', 'This item was opened by the system, not by a person',
        'Three incidents were recorded for Maria in April and the threshold is two. ' +
        'The linked incidents were carried across automatically.');

      h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Corrective action plan</h3><span class="spacer"></span>' +
        UI.badge('Open') + '</div><div class="card-body">' +
        '<p style="margin:0">' + UI.esc(q.plan) + '</p>' +
        '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>' +
        '<tr data-row><td class="nm">Lighting assessment in the hallway</td><td class="small">Renee Alcott</td>' +
        '<td class="num small">14 May</td><td>' + UI.badge('Not started') + '</td></tr>' +
        '<tr data-row><td class="nm">GP review of the new diuretic</td><td class="small">Yvonne Pryce</td>' +
        '<td class="num small">12 May</td><td>' + UI.badge('In progress') + '</td></tr>' +
        '<tr data-row><td class="nm">Retrain support staff on transfers</td><td class="small">Renee Alcott</td>' +
        '<td class="num small">21 May</td><td>' + UI.badge('Not started') + '</td></tr>' +
        '</tbody></table></div>' +
        '<div class="card-foot">' + UI.btn('Add an action', { cls: 'btn--sm', icon: 'plus', goto: 'tasks.new' }) + '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>What fed into this</h3></div><div class="clist">' +
        '<div class="clist-row" data-goto="inc.detail">' + UI.badge('Fall', 'warn') +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">3 April · kitchen</span>' +
          '<span class="cl-s">no injury · follow-up still open</span></span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="inc.detail">' + UI.badge('Medication', 'neutral') +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">19 April · dose 90 min late</span>' +
          '<span class="cl-s">prescriber notified</span></span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="inc.trigger">' + UI.badge('Fall', 'warn') +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">30 April · hallway</span>' +
          '<span class="cl-s">dizziness reported beforehand</span></span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="hosp.closed">' + UI.badge('Hospital', 'info') +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">12–16 April</span>' +
          '<span class="cl-s">dizziness and dehydration · new medication started</span></span>' +
          '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
      '</div></div>';

      h += '</div><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Detail</h3></div><div class="card-body">' +
        UI.kv([
          ['Opened', UI.esc(q.opened)],
          ['Raised by', UI.badge('Automatic', 'info')],
          ['Rule', '3 incidents in April, threshold is 2'],
          ['Owner', UI.esc(q.owner)],
          ['Review due', UI.esc(q.due)],
          ['Status', UI.badge(q.status)]
        ]) + '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>Trend</h3></div><div class="card-body">' +
        UI.bars([{ m: 'Jan', pc: 0 }, { m: 'Feb', pc: 10 }, { m: 'Mar', pc: 10 }, { m: 'Apr', pc: 30 }]) +
        '<span class="small muted">Incidents per month for this client, scaled. April is the outlier that triggered the item.</span>' +
      '</div></div>';

      h += '</div></div>';
      return h + '</div>';
    }
  });

  screen('qi.outcome', {
    title: 'Quality — did it work?', nav: 'qi',
    crumb: 'Quality <span>›</span> <b>Outcome review</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Did the fix work?</h1>' +
        '<span class="sub">Repeat falls — Maria Lopez · reviewed 4 June 2026</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>Since the actions were completed</h3></div><div class="card-body">' +
        '<div class="grid grid-3">' +
          UI.stat({ k: 'Incidents in May', v: '1', n: 'down from 3', kind: 'ok' }) +
          UI.stat({ k: 'Falls in May',     v: '0', n: 'down from 2', kind: 'ok' }) +
          UI.stat({ k: 'Actions done',     v: '3/3', n: 'all completed', kind: 'ok' }) +
        '</div>' +
        UI.bars([{ m: 'Feb', pc: 10 }, { m: 'Mar', pc: 10 }, { m: 'Apr', pc: 30 }, { m: 'May', pc: 10 }]) +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>Your conclusion</h3></div><div class="card-body">' +
        '<div class="radio-row">' +
          '<span class="radio-chip on">The fix worked — close this</span>' +
          '<span class="radio-chip">Partly — keep monitoring</span>' +
          '<span class="radio-chip">No change — new plan needed</span>' +
        '</div>' +
        UI.field('Outcome note', { type: 'textarea', span: true,
          value: 'Hallway lighting replaced and the diuretic dose was reduced by the GP. No falls in May. Closing with a note to re-check in three months.' }) +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Keep it open', { goto: 'qi.detail' }) + '<span class="spacer"></span>' +
        UI.btn('Close the item', { cls: 'btn--primary', icon: 'check', goto: 'qi.list' }) + '</div></div>' +

        UI.banner('info', 'Closed items stay readable forever',
          'The item, its actions and this outcome note are kept in full for reporting and audit.') +
      '</div>';
    }
  });

})();
