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
      '<h1>Clients</h1><span class="sub">' + rows.length + ' in ' + UI.esc(DATA.agencyShort(ag)) +
      ' · management records only, not medical charts</span></span>' +
      '<span class="ph-actions">' +
      UI.btn('Import from Excel', { icon: 'upload', goto: 'clients.import' }) +
      UI.btn('Add client', { cls: 'btn--primary', icon: 'plus', goto: 'clients.import' }) +
      '</span></div>';

    var incomplete = rows.filter(function (r) {
      var pw = DATA.paperwork(r.id);
      return pw.started && !pw.complete;
    }).length;
    var expiring = rows.filter(function (r) {
      return r.agreement && r.agreement.status === 'Due soon';
    }).length;
    var unsetUp = rows.filter(function (r) { return !r.waiver || !r.agreement; }).length;
    var inHospital = rows.filter(function (r) {
      return DATA.HOSPS.some(function (h) { return h.client === r.id && /^Open/.test(h.status || ''); });
    }).length;

    h += '<div class="card"><div class="filters">' +
      '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
      '<span class="fchip">Needs setting up <span class="ct">' + unsetUp + '</span></span>' +
      '<span class="fchip">Paperwork outstanding <span class="ct">' + incomplete + '</span></span>' +
      '<span class="fchip">Agreement expiring <span class="ct">' + expiring + '</span></span>' +
      '<span class="fchip">In hospital <span class="ct">' + inHospital + '</span></span>' +
      '<span class="spacer"></span>' +
      '<span class="fchip">' + UI.icon('search') + 'Search</span>' +
      '</div><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Client</th><th>Waiver</th><th>Programme</th><th>Agreement</th><th>Paperwork</th><th>Needs attention</th>' +
      '</tr></thead><tbody>';

    rows.forEach(function (c, i) {
      h += '<tr data-row data-do="client.open" data-id="' + UI.esc(c.id) + '" data-goto="clients.profile">' +
        '<td><span class="rowmain"><span class="ava-sm ' + (i % 3 === 1 ? 'c2' : i % 3 === 2 ? 'c3' : '') + '">' +
          UI.esc(UI.initials(c.name)) + '</span>' +
          '<span><span class="nm">' + UI.esc(c.name) + '</span><br><span class="sub2 mono">' + UI.esc(c.mrn) + '</span></span></span></td>' +
        '<td>' + (c.waiver ? UI.badge(c.waiver, 'plum') : '<span class="small muted">not set</span>') + '</td>' +
        '<td class="small">' + (c.program ? UI.esc(c.program) : '<span class="muted">—</span>') + '</td>' +
        '<td class="small">' + (c.agreement
            ? UI.badge(c.agreement.status) + '<br><span class="sub2">to ' + UI.esc(c.agreement.end) + '</span>'
            : '<span class="muted">none yet</span>') + '</td>' +
        '<td>' + paperworkCell(c) + '</td>' +
        '<td class="small">' + signalCells(c) + '</td>' +
      '</tr>';
    });

    return h + '</tbody></table></div></div></div>';
  }

  /* Paperwork state, worked out from the client's own document rows. */
  function paperworkCell(c) {
    var pw = DATA.paperwork(c.id);
    if (!pw.started) return '<span class="small muted">not started</span>';
    if (pw.complete) return UI.badge('Complete', 'ok');
    if (pw.expired)  return UI.badge(pw.onFile + ' of ' + pw.total + ' · expired', 'bad');
    return UI.badge(pw.onFile + ' of ' + pw.total + ' on file', pw.onFile ? 'warn' : 'neutral');
  }

  function signalCells(c) {
    var sig = DATA.signals(c);
    if (!sig.length) return '<span class="muted">—</span>';
    return sig.map(function (x) { return UI.badge(x.label, x.kind); }).join(' ');
  }

  screen('clients.list', {
    title: 'Client list', nav: 'clients',
    crumb: '<b>Clients</b>',
    render: list
  });

  /* ---------------- import ---------------- */

  function outcomeBadge(o) {
    return o === 'ok'        ? UI.badge('Will import', 'ok')
         : o === 'duplicate' ? UI.badge('Duplicate — skipped', 'warn')
         :                     UI.badge('Cannot import', 'bad');
  }

  function counts() {
    var rows = DATA.IMPORT_FILE.rows;
    return {
      total: rows.length,
      ok: rows.filter(function (r) { return r.outcome === 'ok'; }).length,
      dup: rows.filter(function (r) { return r.outcome === 'duplicate'; }).length,
      bad: rows.filter(function (r) { return r.outcome === 'error'; }).length
    };
  }

  screen('clients.import', {
    title: 'Import — choose a file', nav: 'clients',
    crumb: 'Clients <span>&rsaquo;</span> <b>Import</b>',
    render: function () {
      var f = DATA.IMPORT_FILE, c = counts();
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Import clients</h1>' +
        '<span class="sub">Bring in a whole caseload at once from a spreadsheet. ' +
        'Nothing is saved until you approve the preview.</span></span></div>' +

        '<div class="card"><div class="card-body">' +
          '<div style="border:2px dashed var(--border-strong);border-radius:11px;padding:34px 24px;' +
          'text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center">' +
            UI.icon('upload', 'ei') +
            '<b>Drop your Excel or CSV file here</b>' +
            '<span class="small muted">.xlsx and .csv accepted</span>' +
          '</div>' +

          '<button class="card card--click" data-goto="clients.import.errors" ' +
            'style="padding:16px;text-align:left">' +
            '<div class="row">' + UI.icon('doc') + '<b class="small">' + UI.esc(f.name) + '</b>' +
            '<span class="spacer"></span>' + UI.badge(c.total + ' rows', 'neutral') + '</div>' +
            '<span class="small muted" style="display:block;margin-top:6px">' +
              'A sample file with one of everything — ' + c.ok + ' good rows, ' +
              c.bad + ' that cannot be read and ' + c.dup + ' duplicate. Click to check it.' +
            '</span>' +
          '</button>' +

          '<div class="row" style="margin-top:2px">' + UI.icon('doc') +
            '<span class="small">Not sure of the format? ' +
            '<span class="linkish">Download the import template</span> — it has the required columns already.</span></div>' +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>Required columns</h3></div><div class="card-body">' +
          '<div class="row small" style="gap:6px">' +
          DATA.IMPORT_FILE.columns
            .map(function (col) { return '<span class="badge badge--neutral">' + col + '</span>'; }).join('') +
          '</div>' +
        '</div></div>' +
      '</div>';
    }
  });

  screen('clients.import.errors', {
    title: 'Import — checking the file', nav: 'clients',
    crumb: 'Clients <span>&rsaquo;</span> <b>Import</b>',
    render: function () {
      var f = DATA.IMPORT_FILE, c = counts();

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>What we found in the file</h1>' +
        '<span class="sub">' + UI.esc(f.name) + ' · ' + c.total + ' rows read · nothing saved yet</span>' +
        '</span></div>';

      h += '<div class="grid grid-3">' +
        UI.stat({ k:'Will import',  v:c.ok,  n:'rows are fine',        kind:'ok' }) +
        UI.stat({ k:'Cannot read',  v:c.bad, n:'fix and upload again', kind:'bad' }) +
        UI.stat({ k:'Duplicates',   v:c.dup, n:'already in this file', kind:'warn' }) +
      '</div>';

      h += '<div class="card"><div class="card-head"><h3>Every row</h3>' +
        '<span class="spacer"></span><span class="sub">in file order</span></div>' +
        '<div class="tbl-wrap"><table class="tbl" style="min-width:820px"><thead><tr>' +
        '<th>Row</th><th>Name</th><th>Date of birth</th><th>Medicaid ID</th><th>What happens</th><th>Why</th>' +
        '</tr></thead><tbody>';

      f.rows.forEach(function (r) {
        var bad = r.outcome !== 'ok';
        h += '<tr data-row' + (bad ? ' style="background:var(--n-25)"' : '') + '>' +
          '<td class="num mono">' + r.row + '</td>' +
          '<td class="nm">' + UI.esc(r.first + ' ' + r.last) + '</td>' +
          '<td class="num small' + (r.field === 'Date of birth' ? '' : '') + '">' +
            (r.field === 'Date of birth'
              ? '<span style="color:var(--r-600);font-weight:650">' + UI.esc(r.dob) + '</span>'
              : UI.esc(r.dob)) + '</td>' +
          '<td class="mono small">' + UI.esc(r.medicaid) + '</td>' +
          '<td>' + outcomeBadge(r.outcome) + '</td>' +
          '<td class="small muted">' + UI.esc(r.why || '—') + '</td>' +
        '</tr>';
      });

      h += '</tbody></table></div>' +
        '<div class="card-foot">' + UI.btn('Upload a different file', { goto: 'clients.import' }) +
        '<span class="spacer"></span>' +
        UI.btn('Continue with the ' + c.ok + ' good rows', { cls: 'btn--primary', goto: 'clients.import.preview' }) +
        '</div></div>';

      h += UI.banner('info', 'The two skipped rows are not lost',
        'Fix them in the spreadsheet and upload again, or add those two clients by hand afterwards. ' +
        'Nothing has been written yet either way.');

      return h + '</div>';
    }
  });

  screen('clients.import.preview', {
    title: 'Import — preview', nav: 'clients',
    crumb: 'Clients <span>&rsaquo;</span> <b>Import</b>',
    render: function () {
      var f = DATA.IMPORT_FILE, c = counts();
      var good = f.rows.filter(function (r) { return r.outcome === 'ok'; });

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Check before saving</h1>' +
        '<span class="sub">This is the last point at which nothing has been written.</span>' +
        '</span></div>';

      h += '<div class="card"><div class="card-head"><h3>About to be created</h3>' +
        '<span class="spacer"></span>' + UI.badge(c.ok + ' clients', 'ok') + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Row</th><th>Name</th><th>Date of birth</th><th>Medicaid ID</th><th>Phone</th>' +
        '</tr></thead><tbody>';

      good.forEach(function (r) {
        h += '<tr data-row><td class="num mono">' + r.row + '</td>' +
          '<td class="nm">' + UI.esc(r.first + ' ' + r.last) + '</td>' +
          '<td class="num small">' + UI.esc(r.dob) + '</td>' +
          '<td class="mono small">' + UI.esc(r.medicaid) + '</td>' +
          '<td class="small muted">' + UI.esc(r.phone) + '</td></tr>';
      });

      h += '</tbody></table></div><div class="card-foot">' +
        UI.btn('Back', { goto: 'clients.import.errors' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="import.clients" data-goto="clients.import.done">' +
          UI.icon('check') + 'Import these ' + c.ok + ' clients</button>' +
        '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>Being left out</h3>' +
        '<span class="spacer"></span>' + UI.badge((c.bad + c.dup) + ' rows', 'warn') + '</div>' +
        '<div class="clist">' +
        f.rows.filter(function (r) { return r.outcome !== 'ok'; }).map(function (r) {
          return '<div class="clist-row" style="cursor:default">' + outcomeBadge(r.outcome) +
            '<span style="display:flex;flex-direction:column;min-width:0">' +
            '<span class="cl-n">Row ' + r.row + ' · ' + UI.esc(r.first + ' ' + r.last) + '</span>' +
            '<span class="cl-s">' + UI.esc(r.field) + ': ' + UI.esc(r.value) + ' — ' + UI.esc(r.why) + '</span>' +
            '</span></div>';
        }).join('') + '</div></div>';

      return h + '</div>';
    }
  });

  screen('clients.import.done', {
    title: 'Import — done', nav: 'clients',
    crumb: 'Clients <span>&rsaquo;</span> <b>Import</b>',
    render: function (S) {
      var c = counts();
      var made = DATA.CLIENTS.length;

      return '<div class="page page--narrow">' +
        '<div class="card"><div class="card-body" style="align-items:center;text-align:center;padding:44px 24px;gap:14px">' +
        '<span style="width:56px;height:56px;border-radius:50%;background:var(--gr-50);color:var(--gr-500);display:grid;place-items:center">' +
        UI.icon('check', 'ei') + '</span>' +
        '<h1 style="margin:0;font-size:24px;font-weight:650">' + c.ok + ' clients imported</h1>' +
        '<p class="muted" style="max-width:48ch">' +
          (c.bad + c.dup) + ' rows were left out — ' + c.bad + ' that could not be read and ' +
          c.dup + ' duplicate. Each imported client now needs a programme, an agreement and an ' +
          'authorisation, which you set on their own page.' +
        '</p>' +
        '<div class="row" style="justify-content:center;margin-top:6px">' +
          UI.btn('Set the first one up', { cls: 'btn--primary', goto: 'clients.list' }) +
          UI.btn('Import another file', { goto: 'clients.import' }) +
        '</div>' +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>What each one has now</h3></div>' +
        '<div class="card-body"><div class="tl">' +
          UI.tlItem('ok', 'Their details', 'name, date of birth, Medicaid ID, phone and address') +
          UI.tlItem('now', 'No programme yet', 'assign one and their required documents start being tracked') +
          UI.tlItem('', 'No service agreement yet', 'record it and the renewal date gets watched') +
          UI.tlItem('', 'No authorisation yet', 'add one and the budget tracking starts') +
        '</div>' +
        '<span class="small muted">' + made + ' client' + (made === 1 ? '' : 's') +
        ' in the system now. Refresh the page — they are still there.</span>' +
        '</div></div>' +
      '</div>';
    }
  });

  /* ---------------- profile ---------------- */

  function profileHead(c) {
    return '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">' + UI.esc(c.mrn) + ' · ' + UI.esc(DATA.agencyShort(c.agency)) + '</span>' +
      '<h1>' + UI.esc(c.name) + '</h1>' +
      '<span class="sub">' + (c.waiver
          ? UI.esc(c.waiver) + ' waiver · ' + UI.esc(c.program)
          : 'No programme assigned yet') + ' · client since ' + UI.esc(c.since) + '</span>' +
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
      var c = DB.get('clients', S.vars.clientId) || DATA.CLIENTS[0];
      if (!c) return UI.noRecord('clients yet', 'Back to clients', 'clients.list');
      var mine = DATA.AUTHS.filter(function (x) { return x.client === c.id; });
      var a1 = mine[0] || null;
      var used = a1 ? (S.vars.a1used != null ? S.vars.a1used : a1.used) : 0;
      var calc = a1 ? DATA.authCalc(a1, used) : null;

      var h = '<div class="page">' + profileHead(c) + tabs('Overview');

      h += setupCard(c, mine);

      h += '<div class="grid grid-sb">';

      h += '<div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Management record</h3>' +
        '<span class="spacer"></span><span class="sub">not a medical chart</span></div><div class="card-body">' +
        UI.kv([
          ['Date of birth', UI.esc(c.dob)],
          ['Medicaid ID', '<span class="mono">' + UI.esc(c.mrn) + '</span>'],
          ['Phone', c.phone ? UI.esc(c.phone) : '<span class="muted">—</span>'],
          ['Address', c.address ? UI.esc(c.address) : '<span class="muted">—</span>'],
          ['Waiver / programme', c.waiver
              ? UI.esc(c.waiver) + ' · ' + UI.esc(c.program)
              : '<span class="muted">not assigned yet</span>'],
          ['Support coordinator', c.coord ? UI.esc(c.coord) : '<span class="muted">not assigned</span>'],
          ['Status', UI.badge(c.status)],
          ['Service agreement', c.agreement
              ? UI.badge(c.agreement.status) + ' <span class="small muted">' + UI.esc(c.agreement.start) +
                ' – ' + UI.esc(c.agreement.end) + '</span>'
              : '<span class="muted">none recorded</span>'],
          ['Clinical records', '<span class="muted small">held in the EMR — ' + UI.emrLink('chart') + '</span>']
        ]) + '</div></div>';

      var events = [];
      DATA.INCIDENTS.filter(function (x) { return x.client === c.id; }).forEach(function (x) {
        events.push({ s: x.status === 'Closed' ? 'ok' : 'bad', t: x.type, w: x.when + ' · ' + x.status });
      });
      DATA.HOSPS.filter(function (x) { return x.client === c.id; }).forEach(function (x) {
        events.push({ s: /^Open/.test(x.status || '') ? 'now' : 'ok', t: x.kind + ' — ' + x.hospital, w: x.admitted });
      });
      DATA.OVERSIGHT.filter(function (x) { return x.client === c.id && x.status === 'Completed'; })
        .forEach(function (x) { events.push({ s: 'ok', t: x.type + ' reviewed', w: x.due + ' · ' + x.who }); });

      h += '<div class="card"><div class="card-head"><h3>Recent activity</h3></div>';
      h += events.length
        ? '<div class="card-body"><div class="tl">' + events.slice(0, 7).map(function (e) {
            return UI.tlItem(e.s, UI.esc(e.t), UI.esc(e.w));
          }).join('') + '</div></div>'
        : '<div class="card-body"><div class="empty" style="padding:24px 16px">' +
          UI.icon('clock', 'ei') + '<b>Nothing has happened yet</b>' +
          '<span>Incidents, hospital stays and completed reviews appear here.</span></div></div>';
      h += '</div>';

      h += '</div>';

      h += '<div class="grid" style="gap:16px">';

      if (!a1) {
        h += '<div class="card"><div class="card-head"><h3>Budget</h3></div>' +
          '<div class="card-body"><div class="empty" style="padding:24px 16px">' +
          UI.icon('money', 'ei') + '<b>No authorisation yet</b>' +
          '<span>Add one and the units, money and alerts start being tracked.</span></div>' +
          UI.btn('Add an authorisation', { cls: 'btn--primary btn--block', icon: 'plus', goto: 'budget.setup' }) +
          '</div></div>';
      } else {
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
      }

      var sig = DATA.signals(c);
      h += '<div class="card"><div class="card-head"><h3>Needs attention</h3></div>';
      h += sig.length
        ? '<div class="clist">' + sig.map(function (x) {
            return '<div class="clist-row" data-goto="clients.checklist">' +
              UI.badge(x.label, x.kind) + '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div>';
          }).join('') + '</div>'
        : '<div class="card-body"><div class="empty" style="padding:22px 16px">' +
          UI.icon('check', 'ei') + '<b>Nothing outstanding</b></div></div>';
      h += '</div>';

      h += '</div></div>';

      return h + '</div>';
    }
  });

  /* What still has to be decided for this client, in order. */
  function setupCard(c, auths) {
    var steps = [
      { done: !!c.waiver,        label: 'Put them on a programme',
        sub: c.waiver ? c.waiver + ' · ' + c.program : 'decides which documents are required',
        goto: 'clients.programme' },
      { done: !!c.agreement,     label: 'Record the service agreement',
        sub: c.agreement ? c.agreement.start + ' to ' + c.agreement.end : 'the contract, and its end date',
        goto: 'clients.agreement' },
      { done: auths.length > 0,  label: 'Add an authorisation',
        sub: auths.length ? auths.length + ' on file' : 'then the budget tracking starts',
        goto: 'budget.setup' }
    ];
    var left = steps.filter(function (s) { return !s.done; }).length;
    if (!left) return '';

    var h = '<div class="card"><div class="card-head"><h3>Finish setting up ' + UI.esc(c.name.split(' ')[0]) + '</h3>' +
      '<span class="spacer"></span><span class="sub">' + (steps.length - left) + ' of ' + steps.length + ' done</span></div>' +
      '<div class="clist">';
    steps.forEach(function (st, i) {
      h += '<div class="clist-row"' + (st.done ? ' style="opacity:.55;cursor:default"' : ' data-goto="' + st.goto + '"') + '>' +
        '<span class="ava-sm ' + (st.done ? '' : 'c2') + '">' + (st.done ? '✓' : (i + 1)) + '</span>' +
        '<span style="display:flex;flex-direction:column;min-width:0">' +
          '<span class="cl-n">' + UI.esc(st.label) + '</span>' +
          '<span class="cl-s">' + UI.esc(st.sub) + '</span>' +
        '</span><span class="cl-sp"></span>' +
        (st.done ? UI.badge('Done', 'ok') : UI.badge('Next', 'plum') + UI.icon('arrow')) +
      '</div>';
    });
    return h + '</div><div class="card-foot"><span class="small muted">' +
      'The import brought in their details. These three are decisions, so they are made here.' +
      '</span></div></div>';
  }

  screen('clients.programme', {
    title: 'Assign a programme', nav: 'clients',
    crumb: 'Clients <span>&rsaquo;</span> <b>Programme</b>',
    render: function (S) {
      var c = DB.get('clients', S.vars.clientId) || DATA.CLIENTS[0];
      if (!c) return UI.noRecord('clients yet', 'Back to clients', 'clients.list');
      var progs = DATA.PROGRAMMES.filter(function (p) { return !p.agency || p.agency === c.agency; });

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + UI.esc(c.name) + '</span><h1>Which programme?</h1>' +
        '<span class="sub">This decides which documents are required for them, and the system ' +
        'starts chasing anything not on file.</span></span></div>';

      if (!progs.length) {
        h += UI.emptyModule({ icon:'doc', title:'No programmes set up',
          body:'Add a waiver programme before putting clients on one.',
          actions:[{ label:'Set up programmes', primary:true, goto:'setup.programmes' }] });
        return h + '</div>';
      }

      h += '<div class="card"><div class="card-body"><div class="form-grid">' +
        UI.field('Programme', { id:'c-prog', type:'select',
          value: (progs.filter(function (p) { return p.name === c.waiver; })[0] || progs[0]).id,
          options: progs.map(function (p) {
            return { value:p.id, label:p.name + ' — ' + (p.docs || []).length + ' required documents' };
          }) }) +
        UI.field('Service they receive', { id:'c-service', value: c.program || '',
          placeholder:'Community Living Support' }) +
        UI.field('Support coordinator', { id:'c-coord', value: c.coord || '',
          placeholder:'Who looks after this client' }) +
      '</div></div>' +
      '<div class="card-foot">' + UI.btn('Back', { goto:'clients.profile' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="client.programme" data-goto="clients.checklist">' +
        UI.icon('check') + 'Assign the programme</button></div></div>';

      h += UI.banner('info', 'This is what creates their document checklist',
        'Every document the programme requires appears against this client as not yet on file, ' +
        'and stays on the dashboard until it is.');

      return h + '</div>';
    }
  });

  screen('clients.agreement', {
    title: 'Record a service agreement', nav: 'clients',
    crumb: 'Clients <span>&rsaquo;</span> <b>Service agreement</b>',
    render: function (S) {
      var c = DB.get('clients', S.vars.clientId) || DATA.CLIENTS[0];
      if (!c) return UI.noRecord('clients yet', 'Back to clients', 'clients.list');

      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">' + UI.esc(c.name) + '</span><h1>Service agreement</h1>' +
        '<span class="sub">The contract between you and the client. The system watches its end date.</span>' +
        '</span></div>' +

        '<div class="card"><div class="card-body"><div class="form-grid">' +
          UI.field('Signed on', { id:'c-start', type:'date',
            value: c.agreement ? c.agreement.start : '' }) +
          UI.field('Runs until', { id:'c-end', type:'date',
            value: c.agreement ? c.agreement.end : '',
            hint:'You will be reminded 90, 60 and 30 days before' }) +
        '</div></div>' +
        '<div class="card-foot">' + UI.btn('Back', { goto:'clients.profile' }) + '<span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="client.agreement" data-goto="clients.profile">' +
          UI.icon('check') + 'Record the agreement</button></div></div>' +

        (c.agreement
          ? '<div class="card"><div class="card-head"><h3>Previous agreements</h3></div>' +
            '<div class="card-body"><span class="small muted">Renewing keeps the old one on file. ' +
            'Nothing in this system is overwritten.</span></div></div>'
          : '') +
      '</div>';
    }
  });

  screen('clients.checklist', {
    title: 'Waiver documents', nav: 'clients',
    crumb: 'Clients <span>&rsaquo;</span> <b>Waiver documents</b>',
    render: function (S) {
      var c = DB.get('clients', S.vars.clientId) || DATA.CLIENTS[0];
      if (!c) return UI.noRecord('clients yet', 'Back to clients', 'clients.list');
      var docs = DATA.docsFor(c.id);
      var pw = DATA.paperwork(c.id);
      var h = '<div class="page">' + profileHead(c) + tabs('Waiver documents');

      h += pw.complete
        ? UI.banner('ok', 'Everything required is on file',
            'Nothing about this paperwork is showing on the dashboard.')
        : UI.banner(pw.expired ? 'bad' : 'warn',
            pw.onFile + ' of ' + pw.total + ' required documents on file',
            (pw.missing ? pw.missing + ' still to collect. ' : '') +
            (pw.expired ? pw.expired + ' has expired and needs renewing. ' : '') +
            'This client keeps appearing on the dashboard until that is resolved.');

      h += '<div class="card"><div class="card-head"><h3>' + UI.esc(c.waiver) + ' — required documents</h3>' +
        '<span class="spacer"></span>' + UI.btn('Edit this checklist', { cls: 'btn--sm', goto: 'set.checklist' }) + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Document</th><th>Received</th><th>Expires</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>';

      docs.forEach(function (d) {
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
