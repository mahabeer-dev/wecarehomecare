/* ============================================================
   Incidents — lifecycle, ageing chase, automatic QI trigger
   ============================================================ */

(function () {

  screen('inc.list', {
    title: 'Incident list', nav: 'incidents',
    crumb: '<b>Incidents</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.INCIDENTS, S.agency);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Incidents</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({title:'No incidents recorded',body:'A good sign. When something happens — a fall, a medication error, an allegation — record it here and the follow-up is chased automatically.',icon:'warn',actions:[{label:'Record an incident',primary:true,icon:'plus',goto:'inc.new'}]}) + '</div>';

      var open = rows.filter(function (r) { return r.status !== 'Closed'; }).length;

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Incidents</h1>' +
        '<span class="sub">' + open + ' open · ' + (rows.length - open) + ' closed this year</span></span>' +
        '<span class="ph-actions">' + UI.btn('Trends', { icon: 'chart', goto: 'qi.list' }) +
        UI.btn('Record an incident', { cls: 'btn--primary', icon: 'plus', goto: 'inc.new' }) + '</span></div>';

      h += UI.banner('warn', 'One follow-up is ageing',
        'Maria Lopez · fall on 3 April · assigned to Yvonne Pryce · <b>25 days</b> with no completed visit.',
        UI.btn('Open', { cls: 'btn--sm', goto: 'inc.detail' }));

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">Open <span class="ct">' + open + '</span></span>' +
        '<span class="fchip">Closed <span class="ct">' + (rows.length - open) + '</span></span>' +
        '<span class="fchip">Falls <span class="ct">2</span></span>' +
        '<span class="fchip">Medication <span class="ct">1</span></span>' +
        '<span class="spacer"></span><span class="fchip">' + UI.icon('doc') + 'Export</span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:860px"><thead><tr>' +
        '<th>When</th><th>Client</th><th>Type</th><th>Where</th><th>Assigned</th><th>Status</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (r) {
        h += '<tr data-row data-goto="inc.detail">' +
          '<td class="num small nowrap">' + UI.esc(r.when) + '</td>' +
          '<td class="nm">' + UI.esc(r.clientName) + '</td>' +
          '<td>' + UI.badge(r.type, r.type === 'Fall' ? 'warn' : 'neutral') + '</td>' +
          '<td class="small muted">' + UI.esc(r.place) + '</td>' +
          '<td class="small">' + UI.esc(r.assigned) + '</td>' +
          '<td>' + UI.badge(r.status) + (r.triggeredQI ? ' ' + UI.badge('QI opened', 'info') : '') + '</td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  screen('inc.new', {
    title: 'Record an incident', nav: 'incidents',
    crumb: 'Incidents <span>›</span> <b>New</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Record an incident</h1>' +
        '<span class="sub">Enter it once. Follow-up, quality and plan reviews all flow from here.</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>What happened</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Client', { type: 'select', value: 'Maria Lopez' }) +
          UI.field('Type', { type: 'select', value: 'Fall' }) +
          UI.field('Date and time', { type:'datetime', value: '03 Apr 2026, 14:20' }) +
          UI.field('Where', { value: 'Client home — kitchen' }) +
          UI.field('What happened', { type: 'textarea', span: true,
            value: 'Client lost balance while reaching for a cupboard. No visible injury. Vitals normal.' }) +
          UI.field('Immediate action taken', { type: 'textarea', span: true,
            value: 'Assisted to a chair, vitals taken, family contacted.' }) +
        '</div></div>' +

        '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Who was told</h3></div>' +
        '<div class="card-body"><div class="row" style="gap:8px">' +
          '<span class="check on"><span class="bx"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg></span>Support coordinator</span>' +
          '<span class="check on"><span class="bx"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg></span>Family</span>' +
          '<span class="check"><span class="bx"></span>DDP</span>' +
          '<span class="check"><span class="bx"></span>State reporting line</span>' +
        '</div></div>' +

        '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Follow-up</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Assign follow-up to', { type: 'select', value: 'Yvonne Pryce · Registered Nurse' }) +
          UI.field('Due by', { type:'date', value: '10 Apr 2026', hint: '7 days after the incident' }) +
        '</div>' +
        UI.banner('info', 'The system will chase this',
          'If the follow-up is not completed by the due date it appears on the dashboard and keeps ageing until someone acts.') +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'inc.list' }) + '<span class="spacer"></span>' +
        UI.btn('Save incident', { cls: 'btn--primary', icon: 'check', goto: 'inc.detail' }) + '</div></div>' +
      '</div>';
    }
  });

  function detailBody(S, opts) {
    opts = opts || {};
    var i = DATA.byId(DATA.INCIDENTS, opts.id || 'i1') || DATA.INCIDENTS[0];
    if (!i) return UI.noRecord('incidents recorded', 'Back to incidents', 'inc.list');

    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">Incident · ' + UI.esc(i.when) + '</span>' +
      '<h1>' + UI.esc(i.type) + ' — ' + UI.esc(i.clientName) + '</h1>' +
      '<span class="sub">' + UI.esc(i.place) + ' · assigned to ' + UI.esc(i.assigned) + '</span></span>' +
      '<span class="ph-actions">' + UI.btn('Open client', { goto: 'clients.profile' }) +
      UI.btn('Close incident', { cls: 'btn--primary', icon: 'check', goto: 'inc.list' }) + '</span></div>';

    if (opts.banner) h += opts.banner;

    h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

    h += '<div class="card"><div class="card-head"><h3>What happened</h3><span class="spacer"></span>' +
      UI.badge(i.status) + '</div><div class="card-body">' +
      UI.kv([
        ['Type', UI.badge(i.type, 'warn')],
        ['When', UI.esc(i.when)],
        ['Where', UI.esc(i.place)],
        ['Description', UI.esc(i.desc)],
        ['Immediate action', UI.esc(i.immediate)],
        ['Notified', 'Support coordinator, family']
      ]) + '</div></div>';

    h += '<div class="card"><div class="card-head"><h3>Follow-up</h3><span class="spacer"></span>' +
      (opts.done ? UI.badge('Completed') : UI.badge('Overdue')) + '</div><div class="card-body">' +
      UI.kv([
        ['Assigned to', UI.esc(i.assigned)],
        ['Due', UI.esc(i.due)],
        ['Status', opts.done ? UI.badge('Completed') + ' <span class="small muted">18 Apr</span>'
                             : '<span style="color:var(--r-600);font-weight:650">' + i.ageDays + ' days late</span>']
      ]) +
      (opts.done ? '' : '<div class="row">' + UI.btn('Record the visit', { cls: 'btn--primary', goto: 'hosp.visit' }) +
        UI.btn('Reassign', {}) + '</div>') +
      '</div></div>';

    h += '<div class="card"><div class="card-head"><h3>Attachments</h3></div><div class="card-body">' +
      '<div class="row"><span class="badge badge--neutral">' + UI.icon('doc') + ' incident-report-0403.pdf</span>' +
      '<span class="badge badge--neutral">' + UI.icon('doc') + ' vitals-0403.jpg</span></div>' +
      '<span class="small muted">Files live on this record. There is no separate document module.</span>' +
      '</div></div>';

    h += '</div><div class="grid" style="gap:16px">';

    h += '<div class="card"><div class="card-head"><h3>What this triggered</h3></div><div class="card-body">' +
      '<div class="tl">' +
        UI.tlItem(opts.done ? 'ok' : 'bad', 'Follow-up task created', 'assigned to Yvonne Pryce, due 10 Apr') +
        UI.tlItem(opts.qi ? 'ok' : '', 'HRST review prompted', 'a fall may change the health risk score') +
        UI.tlItem(opts.qi ? 'ok' : '', 'Counts toward the monthly threshold', '3 incidents in a month opens a quality item') +
      '</div></div></div>';

    h += '<div class="card"><div class="card-head"><h3>This client, this month</h3></div><div class="clist">' +
      '<div class="clist-row" data-goto="inc.detail">' + UI.badge('Fall', 'warn') +
        '<span class="cl-n">3 April</span><span class="cl-sp"></span><span class="small muted">follow-up open</span></div>' +
      '<div class="clist-row" data-goto="inc.detail">' + UI.badge('Medication', 'neutral') +
        '<span class="cl-n">19 April</span><span class="cl-sp"></span><span class="small muted">investigating</span></div>' +
      '<div class="clist-row" data-goto="inc.trigger">' + UI.badge('Fall', 'warn') +
        '<span class="cl-n">30 April</span><span class="cl-sp"></span><span class="small muted">third this month</span></div>' +
    '</div></div>';

    h += '</div></div>';

    return h + '</div>';
  }

  screen('inc.detail', {
    title: 'Incident — follow-up overdue', nav: 'incidents',
    crumb: 'Incidents <span>›</span> <b>Fall · Maria Lopez</b>',
    render: function (S) {
      return detailBody(S, {
        banner: UI.banner('bad', 'Follow-up is 25 days late',
          'Assigned to Yvonne Pryce on 3 April, due 10 April, still not completed. ' +
          'This has been on the dashboard every day since.')
      });
    }
  });

  screen('inc.aged', {
    title: 'Incident — the chase', nav: 'incidents',
    crumb: 'Incidents <span>›</span> <b>Fall · Maria Lopez</b>',
    render: function (S) {
      return detailBody(S, {
        banner: UI.banner('bad', 'Escalated to the manager',
          'Nobody actioned this within 7 days, so it was raised to Renee Alcott automatically. ' +
          'The system does not let an open follow-up go quiet.')
      });
    }
  });

  screen('inc.trigger', {
    title: 'Third incident — QI opens', nav: 'incidents',
    crumb: 'Incidents <span>›</span> <b>Fall · Maria Lopez</b>',
    render: function (S) {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Incident · 30 Apr 2026, 19:40</span>' +
        '<h1>Fall — Maria Lopez</h1>' +
        '<span class="sub">Client home — hallway · third incident this month</span></span></div>';

      h += '<div class="banner banner--warn" style="align-items:flex-start">' + UI.icon('star', 'bi') +
        '<span class="bt"><b>A quality item has been opened automatically</b>' +
        '<span>Maria has now had <b>3 incidents in April</b>. The threshold is 2, so the system raised ' +
        '<b>“Repeat falls — Maria Lopez”</b> without anyone re-typing anything.</span></span>' +
        '<span class="ba">' + UI.btn('Open the quality item', { cls: 'btn--sm btn--primary', goto: 'qi.detail' }) + '</span></div>';

      h += '<div class="grid grid-2">';

      h += '<div class="card"><div class="card-head"><h3>The three incidents</h3></div><div class="clist">' +
        '<div class="clist-row" data-goto="inc.detail"><span class="ava-sm c3">1</span>' +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">Fall in the kitchen</span>' +
          '<span class="cl-s">3 April · follow-up still open</span></span>' +
          '<span class="cl-sp"></span>' + UI.badge('Open') + '</div>' +
        '<div class="clist-row" data-goto="inc.detail"><span class="ava-sm c3">2</span>' +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">Medication given late</span>' +
          '<span class="cl-s">19 April · under investigation</span></span>' +
          '<span class="cl-sp"></span>' + UI.badge('Open') + '</div>' +
        '<div class="clist-row"><span class="ava-sm c3">3</span>' +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">Fall in the hallway</span>' +
          '<span class="cl-s">30 April · dizziness reported beforehand</span></span>' +
          '<span class="cl-sp"></span>' + UI.badge('Open') + '</div>' +
      '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>The rule that fired</h3></div><div class="card-body">' +
        UI.kv([
          ['Rule', 'More than 2 incidents for one client in a calendar month'],
          ['Current threshold', '<span class="mono">2</span>'],
          ['This client, April', '<span class="mono" style="color:var(--r-600);font-weight:700">3</span>'],
          ['Action taken', 'Quality item opened and assigned to Renee Alcott'],
          ['Configurable', 'Yes — Super Admin can change the threshold']
        ]) +
        UI.btn('Change thresholds', { cls: 'btn--block', goto: 'set.thresholds' }) +
      '</div></div>';

      h += '</div>';

      return h + '</div>';
    }
  });

})();
