/* ============================================================
   Incidents — recorded by hand, chased by the system.

   Nothing on these screens is written in advance. The list is the
   records that exist, where each one stands is worked out from
   whether a follow-up was recorded and whether it was closed, and
   the quality item opens itself when a client passes the threshold
   the Super Admin set.
   ============================================================ */

(function () {

  var TYPES = ['Fall', 'Medication error', 'Behavioural', 'Injury',
               'Allegation', 'Property damage', 'Missing person', 'Other'];

  var NOTIFY = ['Support coordinator', 'Family', 'DDP', 'State reporting line'];

  /* Who a follow-up can be given to: the people who hold a login. */
  function staff(S) {
    return DB.all('users').filter(function (u) {
      return u.status !== 'Suspended' && (!S.agency || !u.agency || u.agency === S.agency);
    });
  }

  function current(S) {
    return DB.get('incidents', S.vars.incId) || DATA.inAgency(DATA.INCIDENTS, S.agency)[0] || null;
  }

  /* ---------------- the list ---------------- */

  screen('inc.list', {
    title: 'Incident list', nav: 'incidents',
    crumb: '<b>Incidents</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.INCIDENTS, S.agency);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Incidents</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({ title:'No incidents recorded',
          body:'A good sign. When something happens — a fall, a medication error, an allegation — record it here and the follow-up is chased automatically.',
          icon:'warn', actions:[{ label:'Record an incident', primary:true, icon:'plus', goto:'inc.new' }] }) + '</div>';

      var groups = { all: rows, overdue: [], open: [], done: [], closed: [] };
      rows.forEach(function (r) { groups[DATA.incidentState(r).key].push(r); });

      var f = S.vars.incFilter || 'all';
      if (!groups[f]) f = 'all';
      var shown = groups[f];

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Incidents</h1>' +
        '<span class="sub">' + (rows.length - groups.closed.length) + ' still open · ' +
        groups.closed.length + ' closed</span></span>' +
        '<span class="ph-actions">' + UI.btn('Trends', { icon: 'chart', goto: 'qi.list' }) +
        UI.btn('Record an incident', { cls: 'btn--primary', icon: 'plus', goto: 'inc.new' }) + '</span></div>';

      /* The chase, taken from the oldest thing actually going unanswered. */
      if (groups.overdue.length) {
        var worst = groups.overdue.slice().sort(function (a, b) {
          return DATA.incidentState(b).days - DATA.incidentState(a).days;
        })[0];
        var wd = DATA.incidentState(worst).days;
        h += UI.banner('bad',
          groups.overdue.length === 1 ? 'One follow-up is ageing'
                                      : groups.overdue.length + ' follow-ups are ageing',
          UI.esc(worst.clientName) + ' · ' + worst.type.toLowerCase() + ' on ' +
          UI.esc(worst.when.split(',')[0]) + ' · assigned to ' + UI.esc(worst.assigned) +
          ' · <b>' + wd + ' day' + (wd === 1 ? '' : 's') + '</b> with no completed visit.',
          '<button class="btn btn--sm" data-do="inc.open" data-id="' + UI.esc(worst.id) +
          '" data-goto="inc.detail">Open</button>');
      }

      h += '<div class="card"><div class="filters">' +
        chip('All', 'all', groups.all.length, f) +
        chip('Follow-up overdue', 'overdue', groups.overdue.length, f) +
        chip('Awaiting follow-up', 'open', groups.open.length, f) +
        chip('Follow-up done', 'done', groups.done.length, f) +
        chip('Closed', 'closed', groups.closed.length, f) +
        '<span class="spacer"></span><span class="fchip" data-goto="rep.export">' +
        UI.icon('doc') + 'Export</span>' +
        '</div>';

      if (!shown.length) {
        h += '<div class="card-body"><div class="empty" style="padding:34px 18px">' +
          UI.icon('check', 'ei') + '<b>Nothing in this group</b>' +
          '<span class="small muted">Every incident sits somewhere else right now.</span>' +
          '</div></div></div></div>';
        return h;
      }

      h += '<div class="tbl-wrap"><table class="tbl" style="min-width:880px"><thead><tr>' +
        '<th>When</th><th>Client</th><th>Type</th><th>Where</th><th>Assigned</th><th>Status</th>' +
        '</tr></thead><tbody>';

      shown.slice().sort(function (a, b) {
        return String(UI.toISO(b.when)).localeCompare(String(UI.toISO(a.when)));
      }).forEach(function (r) {
        var st = DATA.incidentState(r);
        var tally = DATA.incidentTally(r.client, r.when);
        h += '<tr data-row data-do="inc.open" data-id="' + UI.esc(r.id) + '" data-goto="inc.detail">' +
          '<td class="num small nowrap">' + UI.esc(r.when) + '</td>' +
          '<td class="nm">' + UI.esc(r.clientName) + '</td>' +
          '<td>' + UI.badge(r.type, r.type === 'Fall' ? 'warn' : 'neutral') + '</td>' +
          '<td class="small muted">' + UI.esc(r.place || '—') + '</td>' +
          '<td class="small">' + UI.esc(r.assigned || '—') + '</td>' +
          '<td>' + UI.badge(st.label + (st.days ? ' · ' + st.days + 'd' : ''), st.tone) +
            (tally.over ? ' ' + UI.badge('QI opened', 'info') : '') + '</td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  function chip(label, key, n, active) {
    return '<span class="fchip' + (key === active ? ' on' : '') +
      '" data-do="inc.filter" data-filter="' + key + '">' + label +
      ' <span class="ct">' + n + '</span></span>';
  }

  /* ---------------- recording one ---------------- */

  screen('inc.new', {
    title: 'Record an incident', nav: 'incidents',
    crumb: 'Incidents <span>&rsaquo;</span> <b>New</b>',
    render: function (S) {
      var clients = DATA.inAgency(DATA.CLIENTS, S.agency);
      if (!clients.length) return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Record an incident</h1>' +
        '<span class="sub">Nobody to record it against yet</span></span></div>' +
        UI.emptyModule({ icon:'warn', title:'You need a client first',
          body:'An incident happens to somebody, so there has to be a record to attach it to.',
          actions:[{ label:'Go to clients', primary:true, goto:'clients.list' }] }) + '</div>';

      var picked = S.vars.incNotify || ['Support coordinator', 'Family'];

      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Record an incident</h1>' +
        '<span class="sub">Enter it once. Follow-up, quality and plan reviews all flow from here.</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>What happened</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Client', { id:'in-client', type:'select',
            options: clients.map(function (c) { return { value:c.id, label:c.name }; }) }) +
          UI.field('Type', { id:'in-type', type:'select', options: TYPES }) +
          UI.field('Date and time', { id:'in-when', type:'datetime', value:'' }) +
          UI.field('Where', { id:'in-place', value:'', placeholder:'Client home — kitchen' }) +
          UI.field('What happened', { id:'in-desc', type:'textarea', span:true, value:'' }) +
          UI.field('Immediate action taken', { id:'in-action', type:'textarea', span:true, value:'' }) +
        '</div></div>' +

        '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Who was told</h3></div>' +
        '<div class="card-body"><div class="row" style="gap:8px;flex-wrap:wrap">' +
          NOTIFY.map(function (n) {
            var on = picked.indexOf(n) >= 0;
            return '<span class="check' + (on ? ' on' : '') + '" data-do="inc.notify" data-who="' + UI.esc(n) + '">' +
              '<span class="bx">' + (on ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg>' : '') +
              '</span>' + UI.esc(n) + '</span>';
          }).join('') +
        '</div><span class="small muted">Tick everyone who was informed. It goes on the record as part of the account.</span></div>' +

        '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Follow-up</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Assign follow-up to', { id:'in-who', type:'select',
            options: staff(S).map(function (u) { return { value:u.name, label:u.name + ' · ' + u.title }; }) }) +
          UI.field('Due by', { id:'in-due', type:'date', value:'',
            hint:'Leave it and the system uses ' + ((DB.settings().thresholds || {}).incidentChaseDays || 7) + ' days after the incident' }) +
        '</div>' +
        UI.banner('info', 'The system will chase this',
          'If the follow-up is not completed by the due date it appears on the dashboard and keeps ageing until someone acts.') +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'inc.list' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="inc.add" data-goto="inc.detail">' +
        UI.icon('check') + 'Save incident</button></div></div>' +
      '</div>';
    }
  });

  /* ---------------- one incident ---------------- */

  function detailBody(S, opts) {
    opts = opts || {};
    var i = current(S);
    if (!i) return UI.noRecord('incidents recorded', 'Back to incidents', 'inc.list');

    var st = DATA.incidentState(i);
    var tally = DATA.incidentTally(i.client, i.when);
    var sameMonth = DATA.incidentsFor(i.client).filter(function (x) {
      return DATA.monthOf(x.when) === tally.month;
    }).sort(function (a, b) {
      return String(UI.toISO(a.when)).localeCompare(String(UI.toISO(b.when)));
    });

    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">Incident · ' + UI.esc(i.when) + '</span>' +
      '<h1>' + UI.esc(i.type) + ' — ' + UI.esc(i.clientName) + '</h1>' +
      '<span class="sub">' + UI.esc(i.place || 'Location not recorded') +
      ' · assigned to ' + UI.esc(i.assigned || 'nobody yet') + '</span></span>' +
      '<span class="ph-actions">' +
      '<button class="btn" data-do="client.open" data-id="' + UI.esc(i.client) + '" data-goto="clients.profile">Open client</button>' +
      (st.key === 'closed'
        ? '<button class="btn" data-do="inc.reopen">' + UI.icon('arrow') + 'Reopen</button>'
        : '<button class="btn btn--primary" data-do="inc.close" data-goto="inc.list">' +
          UI.icon('check') + 'Close incident</button>') +
      '</span></div>';

    if (opts.banner) h += opts.banner;
    else if (st.key === 'overdue') {
      h += UI.banner('bad', 'Follow-up is ' + st.days + ' day' + (st.days === 1 ? '' : 's') + ' late',
        'Assigned to ' + UI.esc(i.assigned || 'nobody') + ', due ' + UI.esc(i.due) +
        ', still not completed. This has been on the dashboard every day since.');
    } else if (st.key === 'closed') {
      h += UI.banner('ok', 'Closed on ' + UI.esc(i.closed.on),
        'Signed off by ' + UI.esc(i.closed.by) + '. The record stays readable — nothing is deleted.');
    }

    h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

    h += '<div class="card"><div class="card-head"><h3>What happened</h3><span class="spacer"></span>' +
      UI.badge(st.label, st.tone) + '</div><div class="card-body">' +
      UI.kv([
        ['Type', UI.badge(i.type, i.type === 'Fall' ? 'warn' : 'neutral')],
        ['When', UI.esc(i.when)],
        ['Where', UI.esc(i.place || '—')],
        ['Description', UI.esc(i.desc || '—')],
        ['Immediate action', UI.esc(i.immediate || '—')],
        ['Notified', (i.notified && i.notified.length) ? UI.esc(i.notified.join(', ')) : '<span class="muted">nobody recorded</span>']
      ]) + '</div></div>';

    /* Follow-up: a record, or the form to make one. */
    h += '<div class="card"><div class="card-head"><h3>Follow-up</h3><span class="spacer"></span>' +
      UI.badge(i.followUp ? 'Completed' : st.key === 'overdue' ? 'Overdue' : 'Outstanding',
               i.followUp ? 'ok' : st.key === 'overdue' ? 'bad' : 'warn') + '</div>';

    if (i.followUp) {
      h += '<div class="card-body">' + UI.kv([
        ['Assigned to', UI.esc(i.assigned || '—')],
        ['Due', UI.esc(i.due || '—')],
        ['Completed', UI.esc(i.followUp.on) + ' <span class="small muted">by ' + UI.esc(i.followUp.by) + '</span>'],
        ['What was found', UI.esc(i.followUp.note || '—')]
      ]) + '</div>';
    } else {
      h += '<div class="card-body"><div class="form-grid">' +
        UI.field('Assigned to', { id:'fu-who', type:'select', value: i.assigned,
          options: staff(S).map(function (u) { return { value:u.name, label:u.name + ' · ' + u.title }; }) }) +
        UI.field('Due by', { id:'fu-due', type:'date', value: i.due }) +
        UI.field('Completed on', { id:'fu-on', type:'date', value:'' }) +
        UI.field('What was found', { id:'fu-note', type:'textarea', span:true, value:'' }) +
        '</div>' +
        '<div class="row"><button class="btn" data-do="inc.reassign">' + UI.icon('people') + 'Save the assignment</button>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="inc.followup">' + UI.icon('check') + 'Record the visit</button></div>' +
        '</div>';
    }
    h += '</div>';

    h += '<div class="card"><div class="card-head"><h3>Attachments</h3></div><div class="card-body">' +
      '<div class="empty" style="padding:22px 16px">' + UI.icon('doc', 'ei') +
      '<b>Nothing attached</b><span class="small muted">Photographs, reports and statements would live on this record. ' +
      'There is no separate document module.</span></div></div></div>';

    h += '</div><div class="grid" style="gap:16px">';

    h += '<div class="card"><div class="card-head"><h3>What this triggered</h3></div><div class="card-body">' +
      '<div class="tl">' +
        UI.tlItem(i.followUp ? 'ok' : st.key === 'overdue' ? 'bad' : 'now',
          i.followUp ? 'Follow-up completed' : 'Follow-up outstanding',
          i.followUp ? UI.esc(i.followUp.on) + ' · ' + UI.esc(i.followUp.by)
                     : 'assigned to ' + UI.esc(i.assigned || 'nobody') + ', due ' + UI.esc(i.due || '—')) +
        UI.tlItem(i.type === 'Fall' ? 'now' : '', 'HRST review prompted',
          i.type === 'Fall' ? 'a fall may change the health risk score' : 'only falls and injuries prompt this') +
        UI.tlItem(tally.over ? 'ok' : '', 'Counts toward the monthly threshold',
          tally.count + ' in ' + UI.esc(tally.monthLabel) + ', the threshold is ' + tally.limit) +
      '</div></div></div>';

    h += '<div class="card"><div class="card-head"><h3>This client, ' + UI.esc(tally.monthLabel) + '</h3>' +
      '<span class="spacer"></span><span class="sub">' + tally.count + ' of ' + tally.limit + ' allowed</span></div>' +
      '<div class="clist">' +
      sameMonth.map(function (x) {
        var xs = DATA.incidentState(x);
        return '<div class="clist-row"' + (x.id === i.id ? ' style="background:var(--n-25)"'
                 : ' data-do="inc.open" data-id="' + UI.esc(x.id) + '" data-goto="inc.detail"') + '>' +
          UI.badge(x.type, x.type === 'Fall' ? 'warn' : 'neutral') +
          '<span class="cl-n">' + UI.esc(x.when.split(',')[0]) + '</span><span class="cl-sp"></span>' +
          '<span class="small muted">' + UI.esc(xs.label.toLowerCase()) + '</span></div>';
      }).join('') +
      '</div>' +
      (tally.over
        ? '<div class="card-foot"><span class="small">Over the threshold — a quality item was opened.</span>' +
          '<span class="spacer"></span>' + UI.btn('Open it', { cls:'btn--sm', goto:'qi.list' }) + '</div>'
        : '') +
      '</div>';

    h += '</div></div>';

    return h + '</div>';
  }

  screen('inc.detail', {
    title: 'Incident record', nav: 'incidents',
    crumb: 'Incidents <span>&rsaquo;</span> <b>Record</b>',
    render: function (S) { return detailBody(S); }
  });

  screen('inc.aged', {
    title: 'Incident — the chase', nav: 'incidents',
    crumb: 'Incidents <span>&rsaquo;</span> <b>Record</b>',
    render: function (S) {
      var days = (DB.settings().thresholds || {}).escalateAfterDays || 7;
      return detailBody(S, {
        banner: UI.banner('bad', 'Escalated to the manager',
          'Nobody actioned this within ' + days + ' days, so it was raised automatically. ' +
          'The system does not let an open follow-up go quiet.')
      });
    }
  });

  /* ---------------- the threshold firing ---------------- */

  screen('inc.trigger', {
    title: 'Threshold passed — QI opens', nav: 'incidents',
    crumb: 'Incidents <span>&rsaquo;</span> <b>Record</b>',
    render: function (S) {
      var i = current(S);
      if (!i) return UI.noRecord('incidents recorded', 'Back to incidents', 'inc.list');

      var tally = DATA.incidentTally(i.client, i.when);
      var sameMonth = DATA.incidentsFor(i.client).filter(function (x) {
        return DATA.monthOf(x.when) === tally.month;
      }).sort(function (a, b) {
        return String(UI.toISO(a.when)).localeCompare(String(UI.toISO(b.when)));
      });
      var qi = DB.all('qi').filter(function (q) {
        return q.client === i.client && q.month === tally.month;
      })[0];

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Incident · ' + UI.esc(i.when) + '</span>' +
        '<h1>' + UI.esc(i.type) + ' — ' + UI.esc(i.clientName) + '</h1>' +
        '<span class="sub">' + UI.esc(i.place || '—') + ' · incident ' + tally.count +
        ' this month</span></span></div>';

      if (tally.over) {
        h += '<div class="banner banner--warn" style="align-items:flex-start">' + UI.icon('star', 'bi') +
          '<span class="bt"><b>A quality item has been opened automatically</b>' +
          '<span>' + UI.esc(i.clientName.split(' ')[0]) + ' has now had <b>' + tally.count +
          ' incidents in ' + UI.esc(tally.monthLabel) + '</b>. The threshold is ' + tally.limit +
          ', so the system raised ' + (qi ? '<b>&ldquo;' + UI.esc(qi.title) + '&rdquo;</b>' : 'a quality item') +
          ' without anyone re-typing anything.</span></span>' +
          '<span class="ba">' + UI.btn('Open the quality item', { cls: 'btn--sm btn--primary', goto: 'qi.list' }) + '</span></div>';
      } else {
        h += UI.banner('ok', 'Under the threshold',
          tally.count + ' incident' + (tally.count === 1 ? '' : 's') + ' for ' + UI.esc(i.clientName) +
          ' in ' + UI.esc(tally.monthLabel) + '. A quality item opens itself above ' + tally.limit + '.');
      }

      h += '<div class="grid grid-2">';

      h += '<div class="card"><div class="card-head"><h3>' +
        (sameMonth.length === 1 ? 'The incident' : 'The ' + sameMonth.length + ' incidents') +
        '</h3></div><div class="clist">' +
        sameMonth.map(function (x, n) {
          var xs = DATA.incidentState(x);
          return '<div class="clist-row" data-do="inc.open" data-id="' + UI.esc(x.id) + '" data-goto="inc.detail">' +
            '<span class="ava-sm c3">' + (n + 1) + '</span>' +
            '<span style="display:flex;flex-direction:column;min-width:0">' +
            '<span class="cl-n">' + UI.esc(x.type) + (x.place ? ' — ' + UI.esc(x.place) : '') + '</span>' +
            '<span class="cl-s">' + UI.esc(x.when.split(',')[0]) + ' · ' + UI.esc(xs.label.toLowerCase()) + '</span></span>' +
            '<span class="cl-sp"></span>' + UI.badge(xs.label, xs.tone) + '</div>';
        }).join('') +
      '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>The rule</h3></div><div class="card-body">' +
        UI.kv([
          ['Rule', 'More than ' + tally.limit + ' incidents for one client in a calendar month'],
          ['Current threshold', '<span class="mono">' + tally.limit + '</span>'],
          ['This client, ' + UI.esc(tally.monthLabel),
            '<span class="mono"' + (tally.over ? ' style="color:var(--r-600);font-weight:700"' : '') + '>' +
            tally.count + '</span>'],
          ['Action taken', tally.over
            ? 'Quality item opened' + (qi ? ' and assigned to ' + UI.esc(qi.owner) : '')
            : 'None — still under the threshold'],
          ['Configurable', 'Yes — Super Admin can change the threshold']
        ]) +
        UI.btn('Change thresholds', { cls: 'btn--block', goto: 'set.thresholds' }) +
      '</div></div>';

      h += '</div>';

      return h + '</div>';
    }
  });

})();
