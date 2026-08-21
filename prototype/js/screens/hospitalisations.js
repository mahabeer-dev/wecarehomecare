/* ============================================================
   Hospitalisations — admission, discharge, nurse visit, close.

   A stay is a chain, and the system will not let you skip a link:
   it cannot be closed until the nurse visit has happened and any
   reviews that visit asked for are done. Where a stay stands is
   worked out from which of those records exist.
   ============================================================ */

(function () {

  var KINDS = ['Admission', 'ER visit', 'Observation stay', 'Planned procedure'];
  var NOTIFY = ['Support coordinator', 'Family', 'DDP', 'State reporting line'];
  var REVIEWS = [
    { name: 'Healthcare Plan',       why: 'medication or condition changed' },
    { name: 'Risk Mitigation Plan',  why: 'the risks at home have changed' },
    { name: 'HRST',                  why: 'the health risk score may have moved' },
    { name: 'ISP',                   why: 'the goals may no longer be realistic' }
  ];

  function staff(S) {
    return DB.all('users').filter(function (u) {
      return u.status !== 'Suspended' && (!S.agency || !u.agency || u.agency === S.agency);
    });
  }

  function current(S) {
    return DB.get('hosps', S.vars.hospId) || DATA.inAgency(DATA.HOSPS, S.agency)[0] || null;
  }

  /* ---------------- the list ---------------- */

  screen('hosp.list', {
    title: 'Hospitalisation list', nav: 'hosp',
    crumb: '<b>Hospitalisations</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.HOSPS, S.agency);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Hospitalisations</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({ title:'Nobody in hospital',
          body:'When a client is admitted or visits the ER, record it here. The nurse follow-up visit after discharge is created for you.',
          icon:'hosp', actions:[{ label:'Record an admission', primary:true, icon:'plus', goto:'hosp.new' }] }) + '</div>';

      var groups = { all: rows, in: [], visitDue: [], visitLate: [], reviews: [], ready: [], closed: [] };
      rows.forEach(function (r) { groups[DATA.hospState(r).key].push(r); });

      var f = S.vars.hospFilter || 'all';
      if (!groups[f]) f = 'all';
      var shown = groups[f];

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Hospitalisations</h1>' +
        '<span class="sub">' + (rows.length - groups.closed.length) + ' open · ' +
        groups.closed.length + ' closed · tracked until the client is back in service</span></span>' +
        '<span class="ph-actions">' + UI.btn('Record an admission', { cls: 'btn--primary', icon: 'plus', goto: 'hosp.new' }) + '</span></div>';

      if (groups.visitLate.length) {
        var worst = groups.visitLate.slice().sort(function (a, b) {
          return DATA.hospState(b).days - DATA.hospState(a).days;
        })[0];
        var wd = DATA.hospState(worst).days;
        h += UI.banner('bad',
          groups.visitLate.length === 1 ? 'One nurse visit is overdue'
                                        : groups.visitLate.length + ' nurse visits are overdue',
          UI.esc(worst.clientName) + ' came home from ' + UI.esc(worst.hospital) + ' on ' +
          UI.esc(String(worst.discharged).split(',')[0]) + '. The visit was due ' + UI.esc(worst.visitDue) +
          ' and is <b>' + wd + ' day' + (wd === 1 ? '' : 's') + '</b> late.',
          '<button class="btn btn--sm" data-do="hosp.open" data-id="' + UI.esc(worst.id) +
          '" data-goto="hosp.detail">Open</button>');
      }

      h += '<div class="card"><div class="filters">' +
        chip('All', 'all', groups.all.length, f) +
        chip('In hospital', 'in', groups.in.length, f) +
        chip('Nurse visit overdue', 'visitLate', groups.visitLate.length, f) +
        chip('Nurse visit due', 'visitDue', groups.visitDue.length, f) +
        chip('Reviews outstanding', 'reviews', groups.reviews.length, f) +
        chip('Ready to close', 'ready', groups.ready.length, f) +
        chip('Closed', 'closed', groups.closed.length, f) +
        '</div>';

      if (!shown.length) {
        h += '<div class="card-body"><div class="empty" style="padding:34px 18px">' +
          UI.icon('check', 'ei') + '<b>Nothing in this group</b>' +
          '<span class="small muted">Every stay sits somewhere else right now.</span>' +
          '</div></div></div></div>';
        return h;
      }

      h += '<div class="tbl-wrap"><table class="tbl" style="min-width:940px"><thead><tr>' +
        '<th>Client</th><th>Type</th><th>Hospital</th><th>Admitted</th><th>Discharged</th><th>Nurse visit</th><th>Status</th>' +
        '</tr></thead><tbody>';

      shown.slice().sort(function (a, b) {
        return String(UI.toISO(b.admitted)).localeCompare(String(UI.toISO(a.admitted)));
      }).forEach(function (r) {
        var st = DATA.hospState(r);
        h += '<tr data-row data-do="hosp.open" data-id="' + UI.esc(r.id) + '" data-goto="hosp.detail">' +
          '<td class="nm">' + UI.esc(r.clientName) + '</td>' +
          '<td>' + UI.badge(r.kind, 'neutral') + '</td>' +
          '<td class="small">' + UI.esc(r.hospital || '—') + '</td>' +
          '<td class="num small nowrap">' + UI.esc(r.admitted) + '</td>' +
          '<td class="num small nowrap">' + UI.esc(r.discharged || '—') + '</td>' +
          '<td>' + visitBadge(r) + '</td>' +
          '<td>' + UI.badge(st.label + (st.days ? ' · ' + st.days + 'd' : ''), st.tone) + '</td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  function chip(label, key, n, active) {
    return '<span class="fchip' + (key === active ? ' on' : '') +
      '" data-do="hosp.filter" data-filter="' + key + '">' + label +
      ' <span class="ct">' + n + '</span></span>';
  }

  function visitBadge(r) {
    if (r.visit) return UI.badge('Completed', 'ok');
    if (r.visitWaived) return UI.badge('Waived', 'neutral');
    if (!r.discharged) return UI.badge('Not yet due', 'neutral');
    var st = DATA.hospState(r);
    return st.key === 'visitLate' ? UI.badge('Overdue', 'bad') : UI.badge('Due', 'warn');
  }

  /* ---------------- recording one ---------------- */

  screen('hosp.new', {
    title: 'Record an admission', nav: 'hosp',
    crumb: 'Hospitalisations <span>&rsaquo;</span> <b>New</b>',
    render: function (S) {
      var clients = DATA.inAgency(DATA.CLIENTS, S.agency);
      if (!clients.length) return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Record an admission</h1>' +
        '<span class="sub">Nobody to record it against yet</span></span></div>' +
        UI.emptyModule({ icon:'hosp', title:'You need a client first',
          body:'A hospital stay happens to somebody, so there has to be a record to attach it to.',
          actions:[{ label:'Go to clients', primary:true, goto:'clients.list' }] }) + '</div>';

      var picked = S.vars.hospNotify || ['Support coordinator', 'Family'];
      var policy = (DB.settings().thresholds || {}).nurseVisitAfterDischarge !== false;

      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Record an admission</h1>' +
        '<span class="sub">Record it as it happens. The discharge and the nurse visit come after.</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>The stay</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Client', { id:'hp-client', type:'select',
            options: clients.map(function (c) { return { value:c.id, label:c.name }; }) }) +
          UI.field('Type', { id:'hp-kind', type:'select', options: KINDS }) +
          UI.field('Hospital', { id:'hp-where', value:'', placeholder:'Piedmont Athens Regional' }) +
          UI.field('Date and time', { id:'hp-when', type:'datetime', value:'' }) +
          UI.field('Reason', { id:'hp-why', type:'textarea', span:true, value:'' }) +
        '</div></div>' +

        '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Who was told</h3></div>' +
        '<div class="card-body"><div class="row" style="gap:8px;flex-wrap:wrap">' +
          NOTIFY.map(function (n) {
            var on = picked.indexOf(n) >= 0;
            return '<span class="check' + (on ? ' on' : '') + '" data-do="hosp.notify" data-who="' + UI.esc(n) + '">' +
              '<span class="bx">' + (on ? tick() : '') + '</span>' + UI.esc(n) + '</span>';
          }).join('') +
        '</div></div>' +

        '<div class="card-body">' +
        UI.banner(policy ? 'info' : 'warn',
          policy ? 'A nurse follow-up visit will be required' : 'Nurse visits are not required by policy',
          policy
            ? 'Standing policy: every client returning home from hospital gets a nurse visit. It can be waived on the record, but only with a written reason.'
            : 'The rule is switched off in Settings, so no visit will be asked for after discharge.') +
        '</div>' +

        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'hosp.list' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="hosp.add" data-goto="hosp.detail">' +
        UI.icon('check') + 'Save admission</button></div></div>' +
      '</div>';
    }
  });

  function tick() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg>';
  }

  /* ---------------- one stay ---------------- */

  screen('hosp.detail', {
    title: 'Hospital stay', nav: 'hosp',
    crumb: 'Hospitalisations <span>&rsaquo;</span> <b>Record</b>',
    render: function (S) {
      var r = current(S);
      if (!r) return UI.noRecord('hospital stays recorded', 'Back to hospitalisations', 'hosp.list');

      var st = DATA.hospState(r);
      var reviews = DATA.hospReviews(r.id);
      var openReviews = reviews.filter(function (t) { return t.status !== 'Completed'; });
      var tally = DATA.hospTally(r.client, r.admitted);

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + UI.esc(r.kind) + ' · ' + UI.esc(String(r.admitted).split(',')[0]) +
        (r.discharged ? ' to ' + UI.esc(String(r.discharged).split(',')[0]) : '') + '</span>' +
        '<h1>' + UI.esc(r.clientName) + ' — ' + UI.esc(r.hospital || 'hospital not recorded') + '</h1>' +
        '<span class="sub">' + UI.esc(r.reason || 'No reason recorded') + '</span></span>' +
        '<span class="ph-actions">' +
        '<button class="btn" data-do="client.open" data-id="' + UI.esc(r.client) + '" data-goto="clients.profile">Open client</button>' +
        (st.key === 'closed'
          ? '<button class="btn" data-do="hosp.reopen">' + UI.icon('arrow') + 'Reopen</button>'
          : '<button class="btn btn--primary" data-do="hosp.close" data-goto="hosp.closed">' +
            UI.icon('check') + 'Close the stay</button>') +
        '</span></div>';

      if (st.key === 'closed') {
        h += UI.banner('ok', 'Closed on ' + UI.esc(r.closed.on),
          'Back in service, signed off by ' + UI.esc(r.closed.by) + '. The record stays readable.');
      } else if (st.key === 'in') {
        h += UI.banner('info', UI.esc(r.clientName.split(' ')[0]) + ' is still in hospital',
          'Record the discharge below and the nurse follow-up visit is scheduled from that date.');
      } else if (st.key === 'visitLate') {
        h += UI.banner('bad', 'Nurse visit is ' + st.days + ' day' + (st.days === 1 ? '' : 's') + ' late',
          'Due ' + UI.esc(r.visitDue) + ', assigned to ' + UI.esc(r.nurse || 'nobody') +
          '. This stay cannot be closed until the visit is recorded.');
      } else if (st.key === 'visitDue') {
        h += UI.banner('warn', 'This stay cannot be closed yet',
          'The nurse follow-up visit is due ' + UI.esc(r.visitDue) + '. Until it is recorded, ' +
          UI.esc(r.clientName.split(' ')[0]) + ' stays flagged as not yet returned to service.');
      } else if (st.key === 'reviews') {
        h += UI.banner('warn', openReviews.length + ' review' + (openReviews.length === 1 ? '' : 's') + ' still outstanding',
          'The nurse visit asked for these. The stay closes once they are done.');
      } else {
        h += UI.banner('ok', 'Everything in the chain is done',
          'Nurse visit recorded and every review it asked for is complete. The stay can be closed.');
      }

      h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>The stay</h3><span class="spacer"></span>' +
        UI.badge(st.label, st.tone) + '</div><div class="card-body">' +
        UI.kv([
          ['Hospital', UI.esc(r.hospital || '—')],
          ['Type', UI.badge(r.kind, 'neutral')],
          ['Admitted', UI.esc(r.admitted)],
          ['Reason', UI.esc(r.reason || '—')],
          ['Discharged', r.discharged ? UI.esc(r.discharged) : '<span class="muted">still in hospital</span>'],
          ['Notified', (r.notified && r.notified.length) ? UI.esc(r.notified.join(', ')) : '<span class="muted">nobody recorded</span>']
        ]) + '</div>';

      if (!r.discharged) {
        h += '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Record the discharge</h3></div>' +
          '<div class="card-body"><div class="form-grid">' +
          UI.field('Discharged on', { id:'hp-out', type:'datetime', value:'' }) +
          UI.field('Nurse for the follow-up', { id:'hp-nurse', type:'select', value: r.nurse,
            options: staff(S).map(function (u) { return { value:u.name, label:u.name + ' · ' + u.title }; }) }) +
          '</div>' +
          '<span class="small muted">The visit falls due ' +
          ((DB.settings().thresholds || {}).dischargeVisitDays || 3) +
          ' days after discharge. You can change that date afterwards.</span>' +
          '</div>' +
          '<div class="card-foot"><span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="hosp.discharge">' + UI.icon('check') + 'Record discharge</button></div>';
      }
      h += '</div>';

      h += '<div class="card"><div class="card-head"><h3>What must happen before this closes</h3></div>' +
        '<div class="card-body"><div class="tl">' +
        UI.tlItem('ok', 'Admission recorded', UI.esc(String(r.admitted).split(',')[0]) +
          ((r.notified && r.notified.length) ? ' · ' + UI.esc(r.notified.join(', ')) : '')) +
        UI.tlItem(r.discharged ? 'ok' : 'now', 'Discharge recorded',
          r.discharged ? UI.esc(r.discharged) : 'still in hospital') +
        UI.tlItem(r.visit ? 'ok' : r.visitWaived ? 'ok' : r.discharged ? (st.key === 'visitLate' ? 'bad' : 'now') : '',
          'Nurse follow-up visit',
          r.visit ? UI.esc(r.visit.on) + ' · ' + UI.esc(r.visit.by)
                  : r.visitWaived ? 'waived — ' + UI.esc(r.visitWaived.reason)
                  : r.discharged ? 'due ' + UI.esc(r.visitDue) + ' · ' + UI.esc(r.nurse || '—')
                  : 'scheduled once discharge is recorded') +
        reviews.map(function (t) {
          return UI.tlItem(t.status === 'Completed' ? 'ok' : 'now', t.title.replace(/ after hospital discharge$/, ''),
            t.status === 'Completed' ? 'done · ' + UI.esc(t.owner) : 'due ' + UI.esc(t.due) + ' · ' + UI.esc(t.owner));
        }).join('') +
        UI.tlItem(r.closed ? 'ok' : '', 'Returned to service',
          r.closed ? UI.esc(r.closed.on) + ' · ' + UI.esc(r.closed.by) : 'the stay closes here') +
        '</div>' +
        (r.discharged && !r.visit && !r.visitWaived
          ? UI.btn('Record the nurse visit', { cls: 'btn--primary btn--block', goto: 'hosp.visit' })
          : '') +
        '</div></div>';

      h += '</div><div class="grid" style="gap:16px">';

      /* the nurse visit panel */
      h += '<div class="card"><div class="card-head"><h3>Nurse follow-up</h3><span class="spacer"></span>' +
        visitBadge(r) + '</div><div class="card-body">';

      if (r.visit) {
        h += UI.kv([
          ['Completed', UI.esc(r.visit.on) + ' <span class="small muted">by ' + UI.esc(r.visit.by) + '</span>'],
          ['Condition', UI.esc(r.visit.condition || '—')],
          ['Instructions reviewed', UI.esc(r.visit.instructions || '—')],
          ['Medication', UI.esc(r.visit.meds || '—')],
          ['New orders', UI.esc(r.visit.orders || '—')]
        ]);
      } else if (r.visitWaived) {
        h += UI.kv([
          ['Required', 'No — waived'],
          ['Waived on', UI.esc(r.visitWaived.on) + ' <span class="small muted">by ' + UI.esc(r.visitWaived.by) + '</span>'],
          ['Reason', UI.esc(r.visitWaived.reason)]
        ]) + '<span class="small muted">The reason is on the audit trail. Waiving is not the same as forgetting.</span>';
      } else if (!r.discharged) {
        h += '<span class="small muted">Scheduled once the discharge is recorded.</span>';
      } else {
        h += UI.kv([
          ['Required', 'Yes — by default'],
          ['Assigned', UI.esc(r.nurse || '—')],
          ['Due', UI.esc(r.visitDue || '—')]
        ]) +
        '<div class="form-grid">' +
          UI.field('Or waive it, with a reason', { id:'hp-waive', span:true, value:'',
            placeholder:'Seen by their own GP the same week' }) +
        '</div>' +
        '<div class="row"><span class="spacer"></span>' +
        '<button class="btn btn--sm" data-do="hosp.waive">Waive the visit</button></div>' +
        '<span class="small muted">Waiving needs a written reason, recorded in the audit trail.</span>';
      }
      h += '</div></div>';

      if (tally.over) {
        h += '<div class="card"><div class="card-head"><h3>A pattern</h3><span class="spacer"></span>' +
          UI.badge('Over threshold', 'warn') + '</div><div class="card-body">' +
          '<span class="small">' + UI.esc(r.clientName.split(' ')[0]) + ' has had <b>' + tally.count +
          ' stays in ' + UI.esc(tally.monthLabel) + '</b>. The threshold is ' + tally.limit +
          ', so a quality item was opened.</span>' +
          UI.btn('Open quality', { cls:'btn--block', goto:'qi.list' }) +
          '</div></div>';
      }

      h += '</div></div>';
      return h + '</div>';
    }
  });

  /* ---------------- the nurse visit ---------------- */

  screen('hosp.visit', {
    title: 'Nurse follow-up visit', nav: 'hosp',
    crumb: 'Hospitalisations <span>&rsaquo;</span> <b>Nurse visit</b>',
    render: function (S) {
      var r = current(S);
      if (!r) return UI.noRecord('hospital stays recorded', 'Back to hospitalisations', 'hosp.list');

      if (!r.discharged) return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Nurse follow-up visit</h1>' +
        '<span class="sub">' + UI.esc(r.clientName) + '</span></span></div>' +
        UI.emptyModule({ icon:'hosp', title:'Not home yet',
          body:UI.esc(r.clientName.split(' ')[0]) + ' is still in hospital. The follow-up visit is scheduled once the discharge is recorded.',
          actions:[{ label:'Back to the stay', primary:true, goto:'hosp.detail' }] }) + '</div>';

      if (r.visit) return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Nurse follow-up visit</h1>' +
        '<span class="sub">' + UI.esc(r.clientName) + ' · already recorded</span></span></div>' +
        UI.emptyModule({ icon:'check', title:'This visit is done',
          body:'Recorded ' + UI.esc(r.visit.on) + ' by ' + UI.esc(r.visit.by) + '. The findings are on the stay.',
          actions:[{ label:'Back to the stay', primary:true, goto:'hosp.detail' }] }) + '</div>';

      var picked = S.vars.hospReviews || [];

      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Post-discharge visit · due ' + UI.esc(r.visitDue || '—') + '</span>' +
        '<h1>Nurse follow-up visit</h1>' +
        '<span class="sub">' + UI.esc(r.clientName) + ' · home since ' +
        UI.esc(String(r.discharged).split(',')[0]) + '</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>What the nurse found</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Visit date', { id:'hv-on', type:'date', value:'' }) +
          UI.field('Completed by', { id:'hv-by', type:'select', value: r.nurse,
            options: staff(S).map(function (u) { return { value:u.name, label:u.name + ' · ' + u.title }; }) }) +
          UI.field('Client condition', { id:'hv-cond', type:'select',
            options:['Stable', 'Stable, mobility reduced', 'Improving', 'Deteriorating', 'Readmitted'] }) +
          UI.field('Discharge instructions reviewed', { id:'hv-inst', type:'select',
            options:['Yes, with client and family', 'Yes, with client only', 'No — none provided', 'No — could not be reviewed'] }) +
          UI.field('Medication concerns', { id:'hv-meds', type:'textarea', span:true, value:'' }) +
          UI.field('New physician orders', { id:'hv-orders', type:'textarea', span:true, value:'' }) +
        '</div></div>' +

        '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Does anything need reviewing?</h3></div>' +
        '<div class="card-body">' +
        '<div class="clist" style="border:1px solid var(--border);border-radius:8px">' +
          REVIEWS.map(function (rv) {
            var on = picked.indexOf(rv.name) >= 0;
            return '<div class="clist-row" data-do="hosp.review" data-review="' + UI.esc(rv.name) + '">' +
              '<span class="check' + (on ? ' on' : '') + '"><span class="bx">' + (on ? tick() : '') + '</span></span>' +
              '<span style="display:flex;flex-direction:column;min-width:0">' +
              '<span class="cl-n">' + UI.esc(rv.name) + '</span>' +
              '<span class="cl-s">' + UI.esc(rv.why) + '</span></span><span class="cl-sp"></span>' +
              '<span class="small muted">' + (on ? 'creates a task' : 'not needed') + '</span></div>';
          }).join('') +
        '</div>' +
        UI.banner('info', 'Ticking a box creates the task — nothing is typed twice',
          'Each review becomes its own task with an owner and a due date, linked back to this stay. ' +
          'The stay stays open until they are done.') +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'hosp.detail' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="hosp.visit.save" data-goto="hosp.detail">' +
        UI.icon('check') + 'Complete the visit</button></div></div>' +
      '</div>';
    }
  });

  /* ---------------- the closed stay ---------------- */

  screen('hosp.closed', {
    title: 'Hospital stay — closed', nav: 'hosp',
    crumb: 'Hospitalisations <span>&rsaquo;</span> <b>Record</b>',
    render: function (S) {
      var r = current(S);
      if (!r) return UI.noRecord('hospital stays recorded', 'Back to hospitalisations', 'hosp.list');

      var st = DATA.hospState(r);
      var reviews = DATA.hospReviews(r.id);

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + UI.esc(r.kind) + ' · ' + UI.esc(String(r.admitted).split(',')[0]) +
        (r.discharged ? ' to ' + UI.esc(String(r.discharged).split(',')[0]) : '') + '</span>' +
        '<h1>' + UI.esc(r.clientName) + (r.closed ? ' — closed' : '') + '</h1>' +
        '<span class="sub">' + (r.closed ? 'Back in service from ' + UI.esc(r.closed.on)
                                         : 'This stay is still open') + '</span></span>' +
        '<span class="ph-actions">' +
        '<button class="btn" data-do="hosp.open" data-id="' + UI.esc(r.id) + '" data-goto="hosp.detail">Open the record</button>' +
        '</span></div>';

      h += r.closed
        ? UI.banner('ok', 'The whole chain is complete',
            'Nurse visit done, every review it asked for completed, client returned to service. ' +
            'Nothing in this sequence was entered more than once.')
        : UI.banner('warn', 'Not closed yet', UI.esc(st.label) + '. The stay closes once the chain is finished.');

      h += '<div class="grid grid-2">';

      h += '<div class="card"><div class="card-head"><h3>What happened, in order</h3></div><div class="card-body"><div class="tl">' +
        UI.tlItem('ok', 'Admission recorded', UI.esc(r.admitted)) +
        ((r.notified && r.notified.length)
          ? UI.tlItem('ok', 'Notifications made', UI.esc(r.notified.join(', '))) : '') +
        (r.discharged ? UI.tlItem('ok', 'Discharge recorded', UI.esc(r.discharged)) : '') +
        (r.visit ? UI.tlItem('ok', 'Nurse follow-up visit',
            UI.esc(r.visit.on) + ' · ' + UI.esc(r.visit.by) +
            (r.visit.condition ? ' · ' + UI.esc(r.visit.condition) : '')) : '') +
        (r.visitWaived ? UI.tlItem('ok', 'Nurse visit waived', UI.esc(r.visitWaived.reason)) : '') +
        reviews.map(function (t) {
          return UI.tlItem(t.status === 'Completed' ? 'ok' : 'now',
            t.title.replace(/ after hospital discharge$/, ''),
            (t.status === 'Completed' ? 'completed · ' : 'due ' + UI.esc(t.due) + ' · ') + UI.esc(t.owner));
        }).join('') +
        (r.closed ? UI.tlItem('ok', 'Returned to service',
          UI.esc(r.closed.on) + ' · ' + UI.esc(r.closed.by)) : '') +
      '</div></div></div>';

      h += '<div class="card"><div class="card-head"><h3>Created by the visit</h3></div>';
      h += reviews.length
        ? '<div class="clist">' + reviews.map(function (t) {
            return '<div class="clist-row" data-goto="tasks.list">' +
              UI.badge(t.status, t.status === 'Completed' ? 'ok' : 'warn') +
              '<span style="display:flex;flex-direction:column;min-width:0">' +
              '<span class="cl-n">' + UI.esc(t.title) + '</span>' +
              '<span class="cl-s">from the nurse visit · ' + UI.esc(t.owner) + '</span></span>' +
              '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>';
          }).join('') + '</div>'
        : '<div class="card-body"><div class="empty" style="padding:26px 16px">' + UI.icon('check', 'ei') +
          '<b>No reviews were needed</b><span class="small muted">The nurse found nothing that changed a plan.</span>' +
          '</div></div>';
      h += '</div>';

      h += '</div>';
      return h + '</div>';
    }
  });

})();
