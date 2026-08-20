/* ============================================================
   Clients — list, bulk import (with errors), profile, checklist
   ============================================================ */

(function () {

  function list(S) {
    var ag = S.role === 'superadmin' ? S.agency : S.agency;
    var rows = DATA.inAgency(DATA.CLIENTS, ag);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Clients</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({title:'No clients yet',body:'Bring your caseload in from a spreadsheet, or add the first client by hand. Everything else in the system hangs off a client.',icon:'people',actions:[{label:'Import from Excel',primary:true,icon:'upload',goto:'clients.import'},{label:'Add one by hand',icon:'plus',goto:'clients.import'}],note:'Most agencies import. It takes one file and about two minutes.'}) + '</div>';


    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<h1>Clients</h1><span class="sub">' + rows.length + ' in ' + UI.esc(DATA.AGENCIES[ag].short) +
      ' · management records only, not medical charts</span></span>' +
      '<span class="ph-actions">' +
      UI.btn('Import from Excel', { icon: 'upload', goto: 'clients.import' }) +
      UI.btn('Add client', { cls: 'btn--primary', icon: 'plus', goto: 'clients.import' }) +
      '</span></div>';

    h += '<div class="card"><div class="filters">' +
      '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
      '<span class="fchip">Documents incomplete <span class="ct">' + rows.filter(function (r) { return !r.docsComplete; }).length + '</span></span>' +
      '<span class="fchip">Agreement expiring <span class="ct">1</span></span>' +
      '<span class="fchip">In hospital <span class="ct">' + rows.filter(function (r) { return r.status === 'In hospital'; }).length + '</span></span>' +
      '<span class="spacer"></span>' +
      '<span class="fchip">' + UI.icon('search') + 'Search</span>' +
      '</div><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Client</th><th>Waiver</th><th>Programme</th><th>Agreement</th><th>File</th><th>Flags</th>' +
      '</tr></thead><tbody>';

    rows.forEach(function (c, i) {
      h += '<tr data-row data-goto="' + (c.id === 'c1' ? 'clients.profile' : 'clients.profile') + '">' +
        '<td><span class="rowmain"><span class="ava-sm ' + (i % 3 === 1 ? 'c2' : i % 3 === 2 ? 'c3' : '') + '">' +
          UI.esc(UI.initials(c.name)) + '</span>' +
          '<span><span class="nm">' + UI.esc(c.name) + '</span><br><span class="sub2 mono">' + UI.esc(c.mrn) + '</span></span></span></td>' +
        '<td>' + UI.badge(c.waiver, 'plum') + '</td>' +
        '<td class="small">' + UI.esc(c.program) + '</td>' +
        '<td class="small">' + UI.badge(c.agreement.status) + '<br><span class="sub2">to ' + UI.esc(c.agreement.end) + '</span></td>' +
        '<td>' + (c.docsComplete ? UI.badge('Complete', 'ok') : UI.badge('Incomplete', 'bad')) + '</td>' +
        '<td class="small">' + (c.flags.length ? c.flags.map(function (f) { return UI.badge(f, 'warn'); }).join(' ') : '<span class="muted">—</span>') + '</td>' +
      '</tr>';
    });

    return h + '</tbody></table></div></div></div>';
  }

  screen('clients.list', {
    title: 'Client list', nav: 'clients',
    crumb: '<b>Clients</b>',
    render: list
  });

  /* ---------------- import ---------------- */

  screen('clients.import', {
    title: 'Import — choose a file', nav: 'clients',
    crumb: 'Clients <span>›</span> <b>Import</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Import clients</h1>' +
        '<span class="sub">Bring in a whole caseload at once from a spreadsheet. Nothing saves until you approve the preview.</span></span></div>' +

        '<div class="card"><div class="card-body">' +
          '<div style="border:2px dashed var(--border-strong);border-radius:11px;padding:34px 24px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center">' +
            UI.icon('upload', 'ei') +
            '<b>Drop your Excel or CSV file here</b>' +
            '<span class="small muted">.xlsx and .csv accepted · pick one of the demo files below</span>' +
          '</div>' +

          '<div class="grid grid-2" style="gap:10px">' +
            '<button class="card card--click" data-goto="clients.import.preview" style="padding:16px;text-align:left">' +
              '<div class="row">' + UI.icon('doc') + '<b class="small">caseload-clean.xlsx</b></div>' +
              '<span class="small muted" style="display:block;margin-top:5px">38 rows, all valid — goes straight to the preview</span>' +
            '</button>' +
            '<button class="card card--click" data-goto="clients.import.errors" style="padding:16px;text-align:left">' +
              '<div class="row">' + UI.icon('doc') + '<b class="small">caseload-april.xlsx</b></div>' +
              '<span class="small muted" style="display:block;margin-top:5px">42 rows, 4 with problems — shows the validation</span>' +
            '</button>' +
          '</div>' +

          '<div class="row" style="margin-top:2px">' + UI.icon('doc') +
            '<span class="small">Not sure of the format? ' +
            '<span class="linkish">Download the import template</span> — it has the required columns already.</span></div>' +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>Required columns</h3></div><div class="card-body">' +
          '<div class="row small" style="gap:6px">' +
          ['First name','Last name','Date of birth','Medicaid ID','Waiver','Programme','Agreement start','Agreement end','EMR link']
            .map(function (c) { return '<span class="badge badge--neutral">' + c + '</span>'; }).join('') +
          '</div>' +
        '</div></div>' +
      '</div>';
    }
  });

  screen('clients.import.errors', {
    title: 'Import — problems found', nav: 'clients',
    crumb: 'Clients <span>›</span> <b>Import</b>',
    render: function () {
      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>We found some problems</h1>' +
        '<span class="sub">caseload-april.xlsx · 42 rows read</span></span></div>';

      h += UI.banner('bad', '4 rows cannot be imported',
        'Fix them in the spreadsheet and upload again, or import the 38 good rows now and add these by hand.');

      h += '<div class="card"><div class="card-head"><h3>Rows that need attention</h3>' +
        '<span class="spacer"></span>' + UI.badge('4 problems', 'bad') + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Row</th><th>Column</th><th>Value found</th><th>Problem</th>' +
        '</tr></thead><tbody>';

      DATA.IMPORT_ERRORS.forEach(function (e) {
        h += '<tr data-row><td class="num mono">' + e.row + '</td>' +
          '<td class="nm">' + UI.esc(e.field) + '</td>' +
          '<td class="mono small">' + UI.esc(e.value) + '</td>' +
          '<td><span style="color:var(--r-600);font-weight:600">' + UI.esc(e.msg) + '</span></td></tr>';
      });

      h += '</tbody></table></div>' +
        '<div class="card-foot">' + UI.btn('Upload a corrected file', { goto: 'clients.import' }) +
        '<span class="spacer"></span>' +
        UI.btn('Continue with the 38 good rows', { cls: 'btn--primary', goto: 'clients.import.preview' }) + '</div></div>';

      return h + '</div>';
    }
  });

  screen('clients.import.preview', {
    title: 'Import — preview', nav: 'clients',
    crumb: 'Clients <span>›</span> <b>Import</b>',
    render: function () {
      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Check before saving</h1>' +
        '<span class="sub">Nothing has been written to the system yet.</span></span></div>';

      h += '<div class="grid grid-3">' +
        UI.stat({ k: 'Will be created', v: '38', n: 'new clients',        kind: 'ok' }) +
        UI.stat({ k: 'Skipped',         v: '4',  n: 'rows with problems',  kind: 'bad' }) +
        UI.stat({ k: 'Possible duplicates', v: '1', n: 'flagged for review', kind: 'warn' }) +
      '</div>';

      h += '<div class="card"><div class="card-head"><h3>First rows</h3>' +
        '<span class="spacer"></span><span class="sub">showing 5 of 38</span></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Row</th><th>Name</th><th>Date of birth</th><th>Waiver</th><th></th>' +
        '</tr></thead><tbody>';

      DATA.IMPORT_ROWS.forEach(function (r) {
        h += '<tr data-row><td class="num mono">' + r.row + '</td>' +
          '<td class="nm">' + UI.esc(r.name) + '</td>' +
          '<td class="num">' + UI.esc(r.dob) + '</td>' +
          '<td>' + UI.badge(r.waiver, 'plum') + '</td>' +
          '<td>' + UI.badge('Ready', 'ok') + '</td></tr>';
      });

      h += '</tbody></table></div><div class="card-foot">' +
        UI.btn('Back', { goto: 'clients.import.errors' }) + '<span class="spacer"></span>' +
        UI.btn('Import 38 clients', { cls: 'btn--primary', icon: 'check', goto: 'clients.import.done' }) +
      '</div></div>';

      return h + '</div>';
    }
  });

  screen('clients.import.done', {
    title: 'Import — done', nav: 'clients',
    crumb: 'Clients <span>›</span> <b>Import</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="card"><div class="card-body" style="align-items:center;text-align:center;padding:48px 24px;gap:14px">' +
        '<span style="width:56px;height:56px;border-radius:50%;background:var(--gr-50);color:var(--gr-500);display:grid;place-items:center">' +
        UI.icon('check', 'ei') + '</span>' +
        '<h1 style="margin:0;font-size:24px;font-weight:650">38 clients imported</h1>' +
        '<p class="muted" style="max-width:46ch">Each one now has an empty waiver checklist and no authorisations yet. ' +
        'The dashboard will start flagging anything missing from tomorrow.</p>' +
        '<div class="row" style="justify-content:center;margin-top:6px">' +
          UI.btn('See the client list', { cls: 'btn--primary', goto: 'clients.list' }) +
          UI.btn('Add authorisations', { goto: 'budget.setup' }) +
        '</div>' +
        '</div></div></div>';
    }
  });

  /* ---------------- profile ---------------- */

  function profileHead(c) {
    return '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">' + UI.esc(c.mrn) + ' · ' + UI.esc(DATA.AGENCIES[c.agency].short) + '</span>' +
      '<h1>' + UI.esc(c.name) + '</h1>' +
      '<span class="sub">' + UI.esc(c.waiver) + ' waiver · ' + UI.esc(c.program) + ' · client since ' + UI.esc(c.since) + '</span>' +
      '</span><span class="ph-actions">' + UI.emrLink(c.name.split(' ')[0]) +
      UI.btn('New task', { icon: 'plus', goto: 'tasks.new' }) + '</span></div>';
  }

  function tabs(active) {
    var t = [['Overview','clients.profile'],['Waiver documents','clients.checklist'],
             ['Authorisations','budget.detail'],['Incidents','inc.list'],
             ['Hospitalisations','hosp.list'],['ISP progress','isp.detail'],['Reviews','ov.list']];
    return '<div class="filters" style="border-radius:11px;border:1px solid var(--border);background:var(--surface)">' +
      t.map(function (x) {
        return '<span class="fchip' + (x[0] === active ? ' on' : '') + '" data-goto="' + x[1] + '">' + x[0] + '</span>';
      }).join('') + '</div>';
  }

  screen('clients.profile', {
    title: 'Client profile — Maria Lopez', nav: 'clients',
    crumb: 'Clients <span>›</span> <b>Maria Lopez</b>',
    render: function (S) {
      var c = DATA.byId(DATA.CLIENTS, 'c1');
      var a1 = DATA.byId(DATA.AUTHS, 'a1');
      var used = S.vars.a1used != null ? S.vars.a1used : a1.used;
      var calc = DATA.authCalc(a1, used);

      var h = '<div class="page">' + profileHead(c) + tabs('Overview');

      h += UI.banner('warn', 'This file is not complete',
        'One required document is missing and one has expired. ' +
        '<span class="linkish" data-goto="clients.checklist">Open the waiver checklist</span>');

      h += '<div class="grid grid-sb">';

      h += '<div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Management record</h3>' +
        '<span class="spacer"></span><span class="sub">not a medical chart</span></div><div class="card-body">' +
        UI.kv([
          ['Date of birth', UI.esc(c.dob)],
          ['Medicaid ID', '<span class="mono">' + UI.esc(c.mrn) + '</span>'],
          ['Waiver / programme', UI.esc(c.waiver) + ' · ' + UI.esc(c.program)],
          ['Support coordinator', UI.esc(c.coord)],
          ['Status', UI.badge(c.status)],
          ['Service agreement', UI.badge(c.agreement.status) + ' <span class="small muted">' + c.agreement.start + ' – ' + c.agreement.end + '</span>'],
          ['Clinical records', '<span class="muted small">held in the EMR — ' + UI.emrLink('chart') + '</span>']
        ]) + '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>Recent activity</h3></div><div class="card-body"><div class="tl">' +
        UI.tlItem('bad', 'Third incident this month — fall in hallway', '30 Apr · quality item opened automatically') +
        UI.tlItem('ok',  'Risk Mitigation Plan reviewed', '23 Apr · Yvonne Pryce') +
        UI.tlItem('ok',  'Healthcare Plan reviewed', '23 Apr · Yvonne Pryce') +
        UI.tlItem('ok',  'Nurse follow-up visit completed', '18 Apr · new medication noted') +
        UI.tlItem('',    'Discharged from Piedmont Athens Regional', '16 Apr · 4-day stay') +
        UI.tlItem('',    'Admitted — dizziness and dehydration', '12 Apr') +
        UI.tlItem('bad', 'Fall in the kitchen', '3 Apr · follow-up still open') +
      '</div></div></div>';

      h += '</div>';

      h += '<div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Budget</h3><span class="spacer"></span>' +
        UI.badge(calc.pc >= 75 ? 'Alert' : 'Healthy', calc.pc >= 75 ? 'warn' : 'ok') + '</div>' +
        '<div class="card-body">' +
        '<div class="meter-top"><span class="muted small">Community Living Support</span><span class="pc">' + calc.pc + '%</span></div>' +
        UI.meter(calc.pc) +
        UI.kv([
          ['Units left', '<span class="mono">' + calc.left.toLocaleString() + ' of ' + calc.units.toLocaleString() + '</span>'],
          ['Hours left', '<span class="mono">' + calc.hoursLeft.toFixed(1) + '</span>'],
          ['Money left', '<span class="mono">' + DATA.money(calc.dollarsLeft) + '</span>']
        ]) +
        UI.btn('Open authorisation', { cls: 'btn--block', goto: 'budget.detail' }) +
        '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>Open items</h3></div><div class="clist">' +
        '<div class="clist-row" data-goto="inc.detail">' + UI.badge('Overdue') +
          '<span class="cl-n">Follow-up visit</span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="qi.detail">' + UI.badge('Open') +
          '<span class="cl-n">Quality item</span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="ov.hrst">' + UI.badge('Due soon') +
          '<span class="cl-n">HRST review</span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '<div class="clist-row" data-goto="isp.detail">' + UI.badge('Overdue') +
          '<span class="cl-n">May ISP entry</span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
      '</div></div>';

      h += '</div></div>';

      return h + '</div>';
    }
  });

  screen('clients.checklist', {
    title: 'Waiver documents', nav: 'clients',
    crumb: 'Clients <span>›</span> Maria Lopez <span>›</span> <b>Waiver documents</b>',
    render: function () {
      var c = DATA.byId(DATA.CLIENTS, 'c1');
      var h = '<div class="page">' + profileHead(c) + tabs('Waiver documents');

      h += UI.banner('bad', 'File incomplete — 1 missing, 1 expired',
        'This client will keep appearing on the dashboard until both are resolved.');

      h += '<div class="card"><div class="card-head"><h3>NOW waiver — required documents</h3>' +
        '<span class="spacer"></span>' + UI.btn('Edit this checklist', { cls: 'btn--sm', goto: 'set.checklist' }) + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Document</th><th>Received</th><th>Expires</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>';

      DATA.CHECKLIST.forEach(function (d) {
        h += '<tr data-row><td class="nm">' + UI.esc(d.name) + '</td>' +
          '<td class="num small">' + UI.esc(d.received) + '</td>' +
          '<td class="num small">' + UI.esc(d.expires) + '</td>' +
          '<td>' + UI.badge(d.status) + '</td>' +
          '<td class="right">' + (d.status === 'On file'
            ? '<span class="linkish small">View</span>'
            : '<span class="linkish small">Upload</span>') + '</td></tr>';
      });

      h += '</tbody></table></div>' +
        '<div class="card-foot"><span class="small muted">The list of required documents is set per waiver in Settings, so it can change when the rules change.</span></div>' +
        '</div>';

      return h + '</div>';
    }
  });

})();
