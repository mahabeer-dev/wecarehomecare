/* ============================================================
   Caregivers — compliance records only, never system users
   ============================================================ */

(function () {

  var WORST = { expired: 'Expired', soon: 'Due soon', ok: 'Current' };

  screen('cg.list', {
    title: 'Caregiver list', nav: 'caregivers',
    crumb: '<b>Caregivers</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.CAREGIVERS, S.agency);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Caregivers</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({title:'No staff records yet',body:'Add your caregivers so their licences, CPR and training can be tracked. None of them will get a login — these are compliance records only.',icon:'badge',actions:[{label:'Import from Excel',primary:true,icon:'upload',goto:'cg.list',doo:'import.caregivers'},{label:'Add one by hand',icon:'plus',goto:'cg.list',doo:'import.caregivers'}]}) + '</div>';

      var exp = rows.filter(function (r) { return r.worst === 'expired'; }).length;
      var soon = rows.filter(function (r) { return r.worst === 'soon'; }).length;

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Caregivers</h1>' +
        '<span class="sub">' + rows.length + ' in ' + UI.esc(DATA.agencyShort(S.agency)) +
        ' · compliance records, not user accounts</span></span>' +
        '<span class="ph-actions">' + UI.btn('Import from Excel', { icon: 'upload', goto: 'clients.import' }) +
        UI.btn('Add caregiver', { cls: 'btn--primary', icon: 'plus', goto: 'cg.detail' }) + '</span></div>';

      h += UI.banner('info', 'Nobody in this list can log in',
        'Caregivers exist here so their licences and training can be tracked. System accounts are for administration and nursing staff only.');

      h += '<div class="grid grid-3">' +
        UI.stat({ k: 'Expired', v: exp, n: 'act today', kind: 'bad', goto: 'cg.expiry' }) +
        UI.stat({ k: 'Expiring in 60 days', v: soon, n: 'reminders sent', kind: 'warn', goto: 'cg.expiry' }) +
        UI.stat({ k: 'All current', v: rows.length - exp - soon, n: 'nothing due', kind: 'ok' }) +
      '</div>';

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
        '<span class="fchip">Something expired <span class="ct">' + exp + '</span></span>' +
        '<span class="fchip">Expiring soon <span class="ct">' + soon + '</span></span>' +
        '<span class="spacer"></span><span class="fchip">' + UI.icon('doc') + 'Export</span>' +
        '</div><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Name</th><th>Role</th><th>Hired</th><th>Compliance</th><th>Account</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (g, i) {
        h += '<tr data-row data-goto="cg.detail">' +
          '<td><span class="rowmain"><span class="ava-sm ' + (i % 3 === 1 ? 'c2' : i % 3 === 2 ? 'c4' : '') + '">' +
            UI.esc(UI.initials(g.name)) + '</span><span class="nm">' + UI.esc(g.name) + '</span></span></td>' +
          '<td class="small">' + UI.esc(g.role) + '</td>' +
          '<td class="num small">' + UI.esc(g.hired) + '</td>' +
          '<td>' + UI.badge(WORST[g.worst]) + '</td>' +
          '<td>' + (g.role === 'Registered Nurse'
            ? UI.badge('Has a login', 'info')
            : '<span class="small muted">no login</span>') + '</td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  screen('cg.detail', {
    title: 'Caregiver — Tanya Fields', nav: 'caregivers',
    crumb: 'Caregivers <span>›</span> <b>Tanya Fields</b>',
    render: function () {
      var creds = DATA.CREDENTIALS.g1;

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Georgia · hired March 2023</span>' +
        '<h1>Tanya Fields</h1>' +
        '<span class="sub">Direct Support Professional · no system account</span></span>' +
        '<span class="ph-actions">' + UI.btn('Add a requirement', { icon: 'plus', goto: 'cg.renew' }) +
        UI.btn('Record a renewal', { cls: 'btn--primary', goto: 'cg.renew' }) + '</span></div>';

      h += UI.banner('bad', "Driver's licence expired on 12 February 2026",
        'This has been on the dashboard for 82 days. Reminders went out at 60, 30, 14 and 7 days before expiry.');

      h += '<div class="card"><div class="card-head"><h3>Requirements</h3>' +
        '<span class="spacer"></span><span class="sub">the list is configurable per agency</span></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Requirement</th><th>Completed</th><th>Expires</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>';

      creds.forEach(function (c) {
        h += '<tr data-row data-goto="cg.renew"><td class="nm">' + UI.esc(c.name) + '</td>' +
          '<td class="num small">' + UI.esc(c.done) + '</td>' +
          '<td class="num small">' + UI.esc(c.due) + '</td>' +
          '<td>' + UI.badge(WORST[c.status] || c.status) + '</td>' +
          '<td class="right"><span class="linkish small">Renew</span></td></tr>';
      });

      h += '</tbody></table></div></div>';

      h += '<div class="card"><div class="card-head"><h3>Previous versions</h3>' +
        '<span class="spacer"></span>' + UI.badge('Never deleted', 'info') + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Requirement</th><th>Completed</th><th>Expired</th><th>Replaced by</th></tr></thead><tbody>' +
        '<tr data-row><td class="nm">CPR / First Aid</td><td class="num small">01 Mar 2022</td>' +
        '<td class="num small">01 Mar 2024</td><td class="small">certificate dated 3 Mar 2024</td></tr>' +
        '<tr data-row><td class="nm">Annual training</td><td class="num small">14 Jan 2025</td>' +
        '<td class="num small">14 Jan 2026</td><td class="small">certificate dated 18 Jan 2026</td></tr>' +
        '</tbody></table></div>' +
        '<div class="card-foot"><span class="small muted">Renewing never overwrites. The old record stays readable for audit.</span></div></div>';

      return h + '</div>';
    }
  });

  screen('cg.renew', {
    title: 'Record a renewal', nav: 'caregivers',
    crumb: 'Caregivers <span>›</span> Tanya Fields <span>›</span> <b>Renew</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Record a renewal</h1>' +
        '<span class="sub">Tanya Fields · Driver\'s licence</span></span></div>' +

        '<div class="card"><div class="card-body"><div class="form-grid">' +
          UI.field('Requirement', { type: 'select', value: "Driver's licence" }) +
          UI.field('New completion date', { value: '05 May 2026' }) +
          UI.field('New expiry date', { value: '05 May 2030', hint: 'Renewal period for this requirement is 4 years' }) +
          UI.field('Reminder at', { type: 'select', value: '60, 30, 14 and 7 days before' }) +
          UI.field('Evidence', { span: true, value: 'licence-2026.pdf' }) +
        '</div>' +
        UI.banner('info', 'The expired record is kept',
          'The old licence stays on file, marked as replaced. Nothing in this system is overwritten.') +
        '</div><div class="card-foot">' + UI.btn('Cancel', { goto: 'cg.detail' }) + '<span class="spacer"></span>' +
        UI.btn('Save renewal', { cls: 'btn--primary', icon: 'check', goto: 'cg.detail' }) + '</div></div></div>';
    }
  });

  screen('cg.expiry', {
    title: 'Expiry report', nav: 'caregivers',
    crumb: 'Caregivers <span>›</span> <b>Expiry report</b>',
    render: function (S) {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>What expires when</h1>' +
        '<span class="sub">Everything due in the next 90 days, plus anything already expired</span></span>' +
        '<span class="ph-actions">' + UI.btn('Export to Excel', { icon: 'doc', goto: 'rep.export' }) + '</span></div>';

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">Next 90 days</span><span class="fchip">Expired only</span>' +
        '<span class="fchip">By requirement</span><span class="fchip">By caregiver</span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:800px"><thead><tr>' +
        '<th>Caregiver</th><th>Requirement</th><th>Expires</th><th>Days</th><th>Status</th></tr></thead><tbody>' +
        row('Tanya Fields', "Driver's licence", '12 Feb 2026', -82, 'Expired') +
        row('Marcus Odell', 'CPR / First Aid', '27 Feb 2026', -67, 'Expired') +
        row('Denise Holloway', 'CPR / First Aid', '22 Feb 2026', -72, 'Expired') +
        row('Tanya Fields', 'CPR / First Aid', '03 Mar 2026', -63, 'Expired') +
        row('Denise Holloway', "Driver's licence", '05 May 2026', 0, 'Due soon') +
        row('Marcus Odell', 'Annual training', '11 Jul 2026', 67, 'Due soon') +
        '</tbody></table></div></div>';

      return h + '</div>';
    }
  });

  function row(who, what, when, days, status) {
    return '<tr data-row data-goto="cg.detail"><td class="nm">' + UI.esc(who) + '</td>' +
      '<td class="small">' + UI.esc(what) + '</td>' +
      '<td class="num small">' + UI.esc(when) + '</td>' +
      '<td class="num"><b style="color:var(--' + (days < 0 ? 'r-600' : days < 30 ? 'g-600' : 'n-600') + ')">' +
        (days < 0 ? Math.abs(days) + ' late' : days === 0 ? 'today' : days + ' left') + '</b></td>' +
      '<td>' + UI.badge(status) + '</td></tr>';
  }

})();
