/* ============================================================
   Hospitalisations — admission through nurse follow-up to close
   ============================================================ */

(function () {

  screen('hosp.list', {
    title: 'Hospitalisation list', nav: 'hosp',
    crumb: '<b>Hospitalisations</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.HOSPS, S.agency);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Hospitalisations</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({title:'Nobody in hospital',body:'When a client is admitted or visits the ER, record it here. The nurse follow-up visit after discharge is created for you.',icon:'hosp',actions:[{label:'Record an admission',primary:true,icon:'plus',goto:'hosp.new'}]}) + '</div>';


      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Hospitalisations</h1>' +
        '<span class="sub">Tracked from admission until the client is back in service</span></span>' +
        '<span class="ph-actions">' + UI.btn('Record an admission', { cls: 'btn--primary', icon: 'plus', goto: 'hosp.new' }) + '</span></div>';

      h += UI.banner('bad', 'One nurse visit is overdue',
        'Sylvia Trent came home from the ER on 2 April. The follow-up visit was due 9 April and has not happened.',
        UI.btn('Open', { cls: 'btn--sm', goto: 'hosp.visit' }));

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
        '<span class="fchip">Awaiting discharge <span class="ct">1</span></span>' +
        '<span class="fchip">Nurse visit due <span class="ct">1</span></span>' +
        '<span class="fchip">Closed <span class="ct">1</span></span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:920px"><thead><tr>' +
        '<th>Client</th><th>Type</th><th>Hospital</th><th>Admitted</th><th>Discharged</th><th>Nurse visit</th><th>Status</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (r) {
        h += '<tr data-row data-goto="hosp.detail">' +
          '<td class="nm">' + UI.esc(r.clientName) + '</td>' +
          '<td>' + UI.badge(r.kind, 'neutral') + '</td>' +
          '<td class="small">' + UI.esc(r.hospital) + '</td>' +
          '<td class="num small nowrap">' + UI.esc(r.admitted) + '</td>' +
          '<td class="num small nowrap">' + UI.esc(r.discharged) + '</td>' +
          '<td>' + UI.badge(r.visitStatus) + '</td>' +
          '<td class="small">' + UI.esc(r.status) + '</td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  screen('hosp.new', {
    title: 'Record an admission', nav: 'hosp',
    crumb: 'Hospitalisations <span>›</span> <b>New</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Record an admission</h1>' +
        '<span class="sub">Maria Lopez · 12 April 2026</span></span></div>' +
        '<div class="card"><div class="card-body"><div class="form-grid">' +
          UI.field('Client', { type: 'select', value: 'Maria Lopez' }) +
          UI.field('Type', { type: 'select', value: 'Admission' }) +
          UI.field('Hospital', { value: 'Piedmont Athens Regional' }) +
          UI.field('Date and time', { value: '12 Apr 2026, 21:10' }) +
          UI.field('Reason', { type: 'textarea', span: true, value: 'Dizziness and suspected dehydration.' }) +
        '</div>' +
        '<div class="field"><label>Required notifications made</label><div class="row" style="gap:8px">' +
          chk('Support coordinator', true) + chk('Family', true) + chk('DDP', true) + chk('State line', false) +
        '</div></div>' +
        UI.banner('info', 'A nurse follow-up visit will be required by default',
          'Standing policy: every client returning home from hospital gets a nurse visit. It can be waived, but only with a written reason.') +
        '</div><div class="card-foot">' + UI.btn('Cancel', { goto: 'hosp.list' }) + '<span class="spacer"></span>' +
        UI.btn('Save admission', { cls: 'btn--primary', icon: 'check', goto: 'hosp.detail' }) + '</div></div></div>';
    }
  });

  function chk(label, on) {
    return '<span class="check' + (on ? ' on' : '') + '"><span class="bx">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg>' +
      '</span>' + UI.esc(label) + '</span>';
  }

  screen('hosp.detail', {
    title: 'Hospitalisation — Maria Lopez', nav: 'hosp',
    crumb: 'Hospitalisations <span>›</span> <b>Maria Lopez</b>',
    render: function () {
      var r = DATA.byId(DATA.HOSPS, 'h1');

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Admission · 12–16 April 2026</span>' +
        '<h1>Maria Lopez — Piedmont Athens Regional</h1>' +
        '<span class="sub">Dizziness and suspected dehydration · 4-day stay</span></span>' +
        '<span class="ph-actions">' + UI.btn('Open client', { goto: 'clients.profile' }) + '</span></div>';

      h += UI.banner('warn', 'This stay cannot be closed yet',
        'The nurse follow-up visit and both plan reviews must be completed first. ' +
        'Until then Maria stays flagged as not yet returned to service.');

      h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>The stay</h3></div><div class="card-body">' +
        UI.kv([
          ['Hospital', UI.esc(r.hospital)],
          ['Admitted', UI.esc(r.admitted)],
          ['Reason', UI.esc(r.reason)],
          ['Discharged', UI.esc(r.discharged)],
          ['Notified', r.notified.join(', ')],
          ['Discharge documents', '<span class="badge badge--neutral">' + UI.icon('doc') + ' discharge-summary.pdf</span>']
        ]) + '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>What must happen before this closes</h3></div><div class="card-body">' +
        '<div class="tl">' +
          UI.tlItem('ok',  'Discharge recorded', '16 April · Renee Alcott') +
          UI.tlItem('now', 'Nurse follow-up visit', 'due 19 April · Yvonne Pryce') +
          UI.tlItem('',    'Healthcare Plan review if needed', 'created from what the nurse finds') +
          UI.tlItem('',    'Risk Mitigation Plan review if needed', 'created from what the nurse finds') +
          UI.tlItem('',    'Return to service', 'the stay closes here') +
        '</div>' +
        UI.btn('Record the nurse visit', { cls: 'btn--primary btn--block', goto: 'hosp.visit' }) +
      '</div></div>';

      h += '</div><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Nurse follow-up</h3><span class="spacer"></span>' +
        UI.badge('Due') + '</div><div class="card-body">' +
        UI.kv([
          ['Required', 'Yes — by default'],
          ['Assigned', 'Yvonne Pryce'],
          ['Due', '19 Apr 2026'],
          ['Status', UI.badge('Not yet done', 'warn')]
        ]) +
        '<span class="small muted">Marking it not required would need a written reason, recorded in the audit trail.</span>' +
      '</div></div>';

      h += '</div></div>';

      return h + '</div>';
    }
  });

  screen('hosp.visit', {
    title: 'Nurse follow-up visit', nav: 'hosp',
    crumb: 'Hospitalisations <span>›</span> Maria Lopez <span>›</span> <b>Nurse visit</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Post-discharge visit · 18 April 2026</span>' +
        '<h1>Nurse follow-up visit</h1>' +
        '<span class="sub">Maria Lopez · Yvonne Pryce · 2 days after discharge</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>What the nurse found</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Visit date', { value: '18 Apr 2026' }) +
          UI.field('Completed by', { type: 'select', value: 'Yvonne Pryce' }) +
          UI.field('Client status after discharge', { type: 'select', value: 'Stable, mobility reduced' }) +
          UI.field('Discharge instructions reviewed', { type: 'select', value: 'Yes, with client and family' }) +
          UI.field('Medication concerns', { type: 'textarea', span: true,
            value: 'New prescription started in hospital — a diuretic. Client reports light-headedness on standing.' }) +
          UI.field('New physician orders', { type: 'textarea', span: true,
            value: 'Increase fluid intake. Review blood pressure at the next GP appointment.' }) +
        '</div></div>' +

        '<div class="card-head" style="border-top:1px solid var(--border)"><h3>Does anything need reviewing?</h3></div>' +
        '<div class="card-body">' +
        '<div class="clist" style="border:1px solid var(--border);border-radius:8px">' +
          '<div class="clist-row"><span class="check on"><span class="bx"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg></span></span>' +
            '<span style="display:flex;flex-direction:column"><span class="cl-n">Healthcare Plan</span>' +
            '<span class="cl-s">new medication changes the plan</span></span><span class="cl-sp"></span>' +
            '<span class="small muted">creates a task</span></div>' +
          '<div class="clist-row"><span class="check on"><span class="bx"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg></span></span>' +
            '<span style="display:flex;flex-direction:column"><span class="cl-n">Risk Mitigation Plan</span>' +
            '<span class="cl-s">light-headedness raises the falls risk</span></span><span class="cl-sp"></span>' +
            '<span class="small muted">creates a task</span></div>' +
          '<div class="clist-row"><span class="check"><span class="bx"></span></span>' +
            '<span style="display:flex;flex-direction:column"><span class="cl-n">HRST</span>' +
            '<span class="cl-s">health risk screening tool</span></span><span class="cl-sp"></span>' +
            '<span class="small muted">not needed</span></div>' +
        '</div>' +
        UI.banner('info', 'Ticking a box creates the task — nothing is typed twice',
          'Each review becomes its own task with an owner and a due date, linked back to this visit.') +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Save as draft', {}) + '<span class="spacer"></span>' +
        UI.btn('Complete the visit', { cls: 'btn--primary', icon: 'check', goto: 'hosp.closed' }) + '</div></div>' +
      '</div>';
    }
  });

  screen('hosp.closed', {
    title: 'Hospitalisation closed', nav: 'hosp',
    crumb: 'Hospitalisations <span>›</span> <b>Maria Lopez</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Admission · 12–16 April 2026</span>' +
        '<h1>Maria Lopez — closed</h1>' +
        '<span class="sub">Back in service from 23 April</span></span></div>';

      h += UI.banner('ok', 'The whole chain is complete',
        'Nurse visit done, both plan reviews completed, client returned to service. ' +
        'Nothing in this sequence was entered more than once.');

      h += '<div class="grid grid-2">';

      h += '<div class="card"><div class="card-head"><h3>What happened, in order</h3></div><div class="card-body"><div class="tl">' +
        UI.tlItem('ok', 'Admission recorded', '12 Apr · Renee Alcott') +
        UI.tlItem('ok', 'Notifications made', '12 Apr · coordinator, family, DDP') +
        UI.tlItem('ok', 'Discharge recorded', '16 Apr · summary attached') +
        UI.tlItem('ok', 'Nurse follow-up visit', '18 Apr · Yvonne Pryce · new medication found') +
        UI.tlItem('ok', 'Healthcare Plan reviewed', '23 Apr · task created by the visit') +
        UI.tlItem('ok', 'Risk Mitigation Plan reviewed', '23 Apr · task created by the visit') +
        UI.tlItem('ok', 'Returned to service', '23 Apr · stay closed') +
      '</div></div></div>';

      h += '<div class="card"><div class="card-head"><h3>Created automatically</h3></div><div class="clist">' +
        '<div class="clist-row" data-goto="tasks.list">' + UI.badge('Completed') +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">Review Healthcare Plan</span>' +
          '<span class="cl-s">from the nurse visit · Yvonne Pryce</span></span>' +
          '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="tasks.list">' + UI.badge('Completed') +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">Review Risk Mitigation Plan</span>' +
          '<span class="cl-s">from the nurse visit · Yvonne Pryce</span></span>' +
          '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="sys.audit">' + UI.badge('Recorded', 'neutral') +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">7 audit entries</span>' +
          '<span class="cl-s">who did what, and when</span></span>' +
          '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
      '</div></div>';

      h += '</div>';
      return h + '</div>';
    }
  });

})();
