/* ============================================================
   Reports — builder, results, export, branded PDF preview
   ============================================================ */

(function () {

  screen('rep.builder', {
    title: 'Report builder', nav: 'reports',
    crumb: '<b>Reports</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Reports</h1>' +
        '<span class="sub">Every module reports. Filter it, look at it, then export.</span></span></div>';

      h += '<div class="grid grid-sb"><div class="card"><div class="card-head"><h3>Build a report</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('What', { type: 'select', value: 'Budget utilisation' }) +
          UI.field('Agency', { type: 'select', value: 'Georgia' }) +
          UI.field('From', { type:'date', value: '01 Jan 2026' }) +
          UI.field('To', { type:'date', value: '05 May 2026' }) +
          UI.field('Client', { type: 'select', value: 'All clients' }) +
          UI.field('Status', { type: 'select', value: 'All' }) +
        '</div>' +
        '<div class="field"><label>Include</label><div class="row" style="gap:8px">' +
          ck('Utilisation percentages', true) + ck('Money remaining', true) +
          ck('Monthly ledger lines', true) + ck('Alerts fired', false) +
        '</div></div>' +
        '</div><div class="card-foot">' + UI.btn('Clear', {}) + '<span class="spacer"></span>' +
        UI.btn('Run report', { cls: 'btn--primary', icon: 'arrow', goto: 'rep.results' }) + '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>Saved reports</h3></div><div class="clist">' +
        sr('Budget utilisation — monthly', 'runs on the 1st') +
        sr('Caregiver credential expiry', 'runs weekly') +
        sr('Incidents by type and client', 'ad hoc') +
        sr('Overdue reviews', 'runs Mondays') +
        sr('Client file completeness', 'ad hoc') +
        '</div></div>';

      h += '</div>';

      h += '<div class="card"><div class="card-head"><h3>What can be reported on</h3></div><div class="card-body">' +
        '<div class="row" style="gap:7px">' +
        ['Tasks and compliance','Incidents','Hospitalisations','Nurse follow-up','Quality Improvement',
         'Budget utilisation','Authorisations','Service agreements','Waiver documentation',
         'Monthly ISP progress','DDP oversight','Clinical oversight','Clients','Caregivers','Credential expiry']
          .map(function (x) { return '<span class="badge badge--neutral">' + x + '</span>'; }).join('') +
        '</div></div></div>';

      return h + '</div>';
    }
  });

  function ck(label, on) {
    return '<span class="check' + (on ? ' on' : '') + '"><span class="bx">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg>' +
      '</span>' + UI.esc(label) + '</span>';
  }

  function sr(name, when) {
    return '<div class="clist-row" data-goto="rep.results">' + UI.icon('doc') +
      '<span style="display:flex;flex-direction:column"><span class="cl-n">' + UI.esc(name) + '</span>' +
      '<span class="cl-s">' + UI.esc(when) + '</span></span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>';
  }

  screen('rep.results', {
    title: 'Report results', nav: 'reports',
    crumb: 'Reports <span>›</span> <b>Budget utilisation</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.AUTHS, S.agency);

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Georgia · 1 Jan – 5 May 2026</span>' +
        '<h1>Budget utilisation</h1>' +
        '<span class="sub">' + rows.length + ' authorisations</span></span>' +
        '<span class="ph-actions">' + UI.btn('Change filters', { goto: 'rep.builder' }) +
        UI.btn('Export', { cls: 'btn--primary', icon: 'doc', goto: 'rep.export' }) + '</span></div>';

      h += '<div class="grid grid-4">' +
        UI.stat({ k: 'Total authorised', v: '$62,100', n: 'across 5 authorisations' }) +
        UI.stat({ k: 'Used to date',     v: '$34,760', n: '56% of the total', kind: 'info' }) +
        UI.stat({ k: 'Remaining',        v: '$27,340', n: 'to 31 Dec', kind: 'ok' }) +
        UI.stat({ k: 'Over 75%',         v: '3', n: 'need watching', kind: 'warn' }) +
      '</div>';

      h += '<div class="card"><div class="card-head"><h3>Detail</h3><span class="spacer"></span>' +
        '<span class="sub">sorted by utilisation</span></div>' +
        '<div class="tbl-wrap"><table class="tbl" style="min-width:960px"><thead><tr>' +
        '<th>Client</th><th>Service</th><th>Authorised</th><th>Used</th><th>Remaining</th><th>Value left</th><th>%</th>' +
        '</tr></thead><tbody>';

      rows.map(function (a) {
        var used = (a.id === 'a1' && S.vars.a1used != null) ? S.vars.a1used : a.used;
        return { a: a, c: DATA.authCalc(a, used) };
      }).sort(function (x, y) { return y.c.pc - x.c.pc; }).forEach(function (r) {
        h += '<tr data-row data-goto="budget.detail"><td class="nm">' + UI.esc(r.a.clientName) + '</td>' +
          '<td class="small">' + UI.esc(r.a.service) + '</td>' +
          '<td class="num mono">' + r.c.units.toLocaleString() + '</td>' +
          '<td class="num mono">' + r.c.used.toLocaleString() + '</td>' +
          '<td class="num mono">' + r.c.left.toLocaleString() + '</td>' +
          '<td class="num mono">' + DATA.money(r.c.dollarsLeft) + '</td>' +
          '<td class="num"><b style="color:var(--' + (r.c.pc >= 90 ? 'r-600' : r.c.pc >= 75 ? 'g-600' : 'gr-600') + ')">' +
            r.c.pc + '%</b></td></tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  screen('rep.export', {
    title: 'Export', nav: 'reports',
    crumb: 'Reports <span>›</span> <b>Export</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Export this report</h1>' +
        '<span class="sub">Budget utilisation · Georgia · 1 Jan – 5 May 2026</span></span></div>' +

        '<div class="grid grid-3">' +
          fmt('Excel', '.xlsx', 'Clean columns, ready to sort and pivot', true) +
          fmt('CSV', '.csv', 'Plain text for other systems', false) +
          fmt('PDF', '.pdf', 'Branded, ready to send or file', false) +
        '</div>' +

        '<div class="card"><div class="card-head"><h3>Options</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('File name', { value: 'budget-utilisation-georgia-2026-05-05' }) +
          UI.field('Agency branding', { type: 'select', value: 'We Care Home Care — Georgia' }) +
        '</div>' +
        '<div class="row" style="gap:8px">' +
          ck('Include the filter summary', true) + ck('Include page numbers', true) +
          ck('One sheet per client', false) +
        '</div></div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'rep.results' }) + '<span class="spacer"></span>' +
        UI.btn('Preview the PDF', { goto: 'rep.pdf' }) +
        UI.btn('Download', { cls: 'btn--primary', icon: 'down', goto: 'rep.results' }) + '</div></div>' +
      '</div>';
    }
  });

  function fmt(name, ext, sub, on) {
    return '<button class="card card--click" style="padding:18px;text-align:left;' +
      (on ? 'border-color:var(--p-500);box-shadow:0 0 0 3px var(--p-100)' : '') + '">' +
      '<div class="row">' + UI.icon('doc') + '<b>' + name + '</b>' +
      '<span class="spacer"></span><span class="mono small muted">' + ext + '</span></div>' +
      '<span class="small muted" style="margin-top:6px;display:block">' + sub + '</span></button>';
  }

  screen('rep.pdf', {
    title: 'Branded PDF preview', nav: 'reports',
    crumb: 'Reports <span>›</span> Export <span>›</span> <b>PDF preview</b>',
    render: function () {
      var h = '<div class="page page--narrow">';
      h += '<div class="page-head"><span class="ph-txt"><h1>PDF preview</h1>' +
        '<span class="sub">This is what gets filed or sent to the state</span></span>' +
        '<span class="ph-actions">' + UI.btn('Back', { goto: 'rep.export' }) +
        UI.btn('Download PDF', { cls: 'btn--primary', icon: 'down', goto: 'rep.results' }) + '</span></div>';

      h += '<div class="card"><div class="card-body" style="background:var(--n-100);padding:24px">' +
        '<div style="background:#fff;padding:34px 38px;box-shadow:var(--sh-2);max-width:640px;margin:0 auto;font-size:12px">' +

        '<div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid var(--p-500);padding-bottom:14px">' +
          '<img src="assets/logo.svg" width="42" height="42" alt="">' +
          '<div><div style="font-family:var(--serif);font-size:17px;font-weight:600">We Care Home Care</div>' +
          '<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--t-600);font-family:var(--mono)">Georgia</div></div>' +
          '<div style="margin-left:auto;text-align:right;font-size:10px;color:var(--text-mute)">' +
          'Generated 5 May 2026<br>Renee Alcott</div>' +
        '</div>' +

        '<h2 style="font-family:var(--serif);font-size:20px;margin:18px 0 4px;font-weight:600">Budget utilisation</h2>' +
        '<div style="font-size:11px;color:var(--text-mute);margin-bottom:16px">1 January – 5 May 2026 · all clients · all services</div>' +

        '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<thead><tr style="background:var(--p-50)">' +
        '<th style="text-align:left;padding:6px 8px;border-bottom:1.5px solid var(--p-200)">Client</th>' +
        '<th style="text-align:left;padding:6px 8px;border-bottom:1.5px solid var(--p-200)">Service</th>' +
        '<th style="text-align:right;padding:6px 8px;border-bottom:1.5px solid var(--p-200)">Used</th>' +
        '<th style="text-align:right;padding:6px 8px;border-bottom:1.5px solid var(--p-200)">Left</th>' +
        '<th style="text-align:right;padding:6px 8px;border-bottom:1.5px solid var(--p-200)">%</th></tr></thead><tbody>' +
        pdfRow('Adaeze Okafor', 'Community Living Support', '1,746', '54', '97%') +
        pdfRow('Curtis Nabors', 'Personal Support', '1,490', '110', '93%') +
        pdfRow('Maria Lopez', 'Community Living Support', '1,500', '500', '75%') +
        pdfRow('Jerome Sandifer', 'Home &amp; Community Supports', '1,102', '978', '53%') +
        pdfRow('Sylvia Trent', 'Community Living Support', '820', '1,580', '34%') +
        '</tbody></table>' +

        '<div style="margin-top:22px;padding-top:10px;border-top:1px solid var(--border);display:flex;font-size:9.5px;color:var(--text-mute)">' +
          '<span>We Care Home Care — Georgia · confidential</span>' +
          '<span style="margin-left:auto">Page 1 of 2</span>' +
        '</div>' +

        '</div></div></div>';

      return h + '</div>';
    }
  });

  function pdfRow(a, b, c, d, e) {
    return '<tr><td style="padding:6px 8px;border-bottom:1px solid var(--n-100)">' + a + '</td>' +
      '<td style="padding:6px 8px;border-bottom:1px solid var(--n-100)">' + b + '</td>' +
      '<td style="padding:6px 8px;text-align:right;border-bottom:1px solid var(--n-100)">' + c + '</td>' +
      '<td style="padding:6px 8px;text-align:right;border-bottom:1px solid var(--n-100)">' + d + '</td>' +
      '<td style="padding:6px 8px;text-align:right;border-bottom:1px solid var(--n-100)"><b>' + e + '</b></td></tr>';
  }

})();
