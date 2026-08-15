/* ============================================================
   Authorisations & budget — the calculator with alarms
   ============================================================ */

(function () {

  function calcFor(S, a) {
    var used = (a.id === 'a1' && S.vars.a1used != null) ? S.vars.a1used : a.used;
    return DATA.authCalc(a, used);
  }

  screen('budget.list', {
    title: 'Authorisation list', nav: 'budget',
    crumb: '<b>Authorisations</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.AUTHS, S.agency);
      var alerts = rows.filter(function (a) { return calcFor(S, a).pc >= 75; }).length;

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Authorisations</h1>' +
        '<span class="sub">' + rows.length + ' active · utilisation recalculated whenever hours are entered</span></span>' +
        '<span class="ph-actions">' + UI.btn('Enter monthly hours', { icon: 'plus', goto: 'budget.usage' }) +
        UI.btn('New authorisation', { cls: 'btn--primary', icon: 'plus', goto: 'budget.setup' }) + '</span></div>';

      if (alerts) {
        h += UI.banner('warn', alerts + ' authorisation' + (alerts > 1 ? 's have' : ' has') + ' passed 75%',
          'At 100% the service is no longer funded. Warnings are also shown before an entry would exceed what is left.');
      }

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
        '<span class="fchip">Over 75% <span class="ct">' + alerts + '</span></span>' +
        '<span class="fchip">Expiring soon <span class="ct">1</span></span>' +
        '<span class="spacer"></span><span class="fchip">' + UI.icon('doc') + 'Export</span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:900px"><thead><tr>' +
        '<th>Client</th><th>Service</th><th>Period</th><th>Units used</th><th>Money left</th><th style="width:190px">Utilisation</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (a) {
        var c = calcFor(S, a);
        h += '<tr data-row data-goto="' + (a.id === 'a1' ? 'budget.detail' : 'budget.detail') + '">' +
          '<td><span class="nm">' + UI.esc(a.clientName) + '</span><br><span class="sub2 mono">' + UI.esc(a.number) + '</span></td>' +
          '<td class="small">' + UI.esc(a.service) + '</td>' +
          '<td class="num small">' + UI.esc(a.start) + '<br><span class="sub2">to ' + UI.esc(a.end) + '</span></td>' +
          '<td class="num mono">' + c.used.toLocaleString() + ' / ' + c.units.toLocaleString() + '</td>' +
          '<td class="num mono">' + DATA.money(c.dollarsLeft) + '</td>' +
          '<td><div class="meter-top" style="margin-bottom:4px"><span class="pc" style="font-size:13px">' + c.pc + '%</span></div>' +
            '<div class="meter-track" style="height:7px"><div class="meter-fill ' + (c.band === 'ok' ? '' : c.band) + '" style="width:' + Math.min(100, c.pc) + '%"></div></div></td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  screen('budget.setup', {
    title: 'New authorisation', nav: 'budget',
    crumb: 'Authorisations <span>›</span> <b>New</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>New authorisation</h1>' +
        '<span class="sub">Entered once. Everything after this is calculated.</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>What was approved</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Client', { type: 'select', value: 'Maria Lopez' }) +
          UI.field('Service', { type: 'select', value: 'Community Living Support' }) +
          UI.field('Authorisation number', { value: 'PA-GA-44118' }) +
          UI.field('Waiver', { type: 'select', value: 'NOW' }) +
          UI.field('Period starts', { value: '01 Jan 2026' }) +
          UI.field('Period ends', { value: '31 Dec 2026' }) +
          UI.field('Authorised units', { value: '2,000', hint: 'One unit = 15 minutes, so this is 500 hours' }) +
          UI.field('Rate per unit', { value: '$6.25', hint: 'Total value: $12,500.00' }) +
        '</div></div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'budget.list' }) + '<span class="spacer"></span>' +
        UI.btn('Save authorisation', { cls: 'btn--primary', icon: 'check', goto: 'budget.detail' }) + '</div></div>' +

        UI.banner('info', 'A client can hold several authorisations at once',
          'Maria also has a Respite authorisation at a different rate. Each one is tracked and alerted on separately.') +
      '</div>';
    }
  });

  screen('budget.usage', {
    title: 'Enter monthly hours', nav: 'budget',
    crumb: 'Authorisations <span>›</span> <b>Monthly entry</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>Enter hours used</h1>' +
        '<span class="sub">Once a month, for the month just gone. The system does the arithmetic.</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>April 2026 · Maria Lopez · Community Living Support</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Month', { type: 'select', value: 'April 2026' }) +
          UI.field('Hours delivered', { value: '96', hint: 'Entered as hours — converted to 384 units automatically' }) +
          UI.field('Entered by', { value: 'Renee Alcott' }) +
          UI.field('Date entered', { value: '05 May 2026' }) +
        '</div>' +
        UI.banner('info', 'This becomes a line in the ledger, not a running total',
          'Every monthly entry is kept separately and the totals are worked out from them. ' +
          'That way a correction never silently rewrites history.') +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'budget.detail' }) + '<span class="spacer"></span>' +
        UI.btn('Save entry', { cls: 'btn--primary', icon: 'check', goto: 'budget.alert75' }) + '</div></div>' +

        '<div class="card"><div class="card-head"><h3>Entries so far</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Month</th><th>Hours</th><th>Units</th><th>Value</th><th>Entered by</th></tr></thead><tbody>' +
        '<tr data-row><td class="nm">January 2026</td><td class="num mono">45</td><td class="num mono">180</td>' +
        '<td class="num mono">$1,125.00</td><td class="small">Renee Alcott · 3 Feb</td></tr>' +
        '<tr data-row><td class="nm">February 2026</td><td class="num mono">102</td><td class="num mono">408</td>' +
        '<td class="num mono">$2,550.00</td><td class="small">Renee Alcott · 4 Mar</td></tr>' +
        '<tr data-row><td class="nm">March 2026</td><td class="num mono">132</td><td class="num mono">528</td>' +
        '<td class="num mono">$3,300.00</td><td class="small">Renee Alcott · 2 Apr</td></tr>' +
        '</tbody></table></div></div>' +
      '</div>';
    }
  });

  function detail(S, opts) {
    opts = opts || {};
    var a = DATA.byId(DATA.AUTHS, 'a1');
    var c = calcFor(S, a);

    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m mono">' + UI.esc(a.number) + '</span>' +
      '<h1>' + UI.esc(a.clientName) + ' — ' + UI.esc(a.service) + '</h1>' +
      '<span class="sub">' + UI.esc(a.start) + ' to ' + UI.esc(a.end) + ' · ' +
      a.units.toLocaleString() + ' units at ' + DATA.money(a.rate) + ' each</span></span>' +
      '<span class="ph-actions">' + UI.btn('Enter hours', { icon: 'plus', goto: 'budget.usage' }) +
      UI.btn('Export', { icon: 'doc', goto: 'rep.export' }) + '</span></div>';

    if (opts.banner) h += opts.banner;

    h += '<div class="grid grid-4">' +
      UI.stat({ k: 'Units used',   v: c.used.toLocaleString(),  n: 'of ' + c.units.toLocaleString(), kind: c.band === 'ok' ? 'info' : c.band }) +
      UI.stat({ k: 'Hours left',   v: c.hoursLeft.toFixed(1),   n: 'of ' + c.hoursTotal.toFixed(0) }) +
      UI.stat({ k: 'Money left',   v: DATA.money(c.dollarsLeft),n: 'of ' + DATA.money(c.dollarsTotal) }) +
      UI.stat({ k: 'Utilised',     v: c.pc + '%',               n: c.pc >= 75 ? 'alert threshold passed' : 'under the 75% threshold', kind: c.band === 'ok' ? 'ok' : c.band }) +
    '</div>';

    h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

    h += '<div class="card"><div class="card-head"><h3>Utilisation</h3><span class="spacer"></span>' +
      '<span class="sub">alerts fire at 75%, 90% and 100%</span></div><div class="card-body">' +
      UI.meter(c.pc) +
      '<div class="row" style="gap:18px;margin-top:6px">' +
        legend('Used', 'var(--' + (c.pc >= 100 ? 'r-500' : c.pc >= 75 ? 'g-300' : 't-400') + ')', c.used.toLocaleString() + ' units') +
        legend('Remaining', 'var(--n-200)', c.left.toLocaleString() + ' units') +
        legend('Value used', 'transparent', DATA.money(c.dollarsUsed)) +
      '</div></div></div>';

    h += '<div class="card"><div class="card-head"><h3>Monthly ledger</h3>' +
      '<span class="spacer"></span><span class="sub">totals are derived from these lines</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Month</th><th>Hours</th><th>Units</th><th>Value</th><th>Running total</th></tr></thead><tbody>' +
      ledgerRows(c.used) +
      '</tbody></table></div></div>';

    h += '</div><div class="grid" style="gap:16px">';

    h += '<div class="card"><div class="card-head"><h3>Alerts</h3></div><div class="card-body" style="gap:9px">' +
      alertLine('75% utilised', c.pc >= 75, '1,500 units') +
      alertLine('90% utilised', c.pc >= 90, '1,800 units') +
      alertLine('100% — budget gone', c.pc >= 100, '2,000 units') +
      alertLine('Authorisation expiring', false, '30 days before 31 Dec') +
    '</div></div>';

    h += '<div class="card"><div class="card-head"><h3>Other authorisations</h3></div><div class="clist">' +
      '<div class="clist-row" data-goto="budget.list"><span style="display:flex;flex-direction:column">' +
      '<span class="cl-n">Respite</span><span class="cl-s">400 units · 24% used</span></span>' +
      '<span class="cl-sp"></span>' + UI.icon('arrow') + '</div></div></div>';

    h += '</div></div>';

    return h + '</div>';
  }

  function legend(label, colour, val) {
    return '<span class="row-tight"><span style="width:10px;height:10px;border-radius:3px;background:' + colour + ';border:1px solid var(--border)"></span>' +
      '<span class="small muted">' + label + '</span><b class="small mono">' + val + '</b></span>';
  }

  function alertLine(label, fired, at) {
    return '<div class="row">' +
      '<span style="width:9px;height:9px;border-radius:50%;background:' + (fired ? 'var(--g-300)' : 'var(--n-300)') + '"></span>' +
      '<span class="small' + (fired ? '' : ' muted') + '">' + label + '</span>' +
      '<span class="spacer"></span>' +
      (fired ? UI.badge('Fired', 'warn') : '<span class="small muted mono">' + at + '</span>') +
    '</div>';
  }

  function ledgerRows(used) {
    var base = [
      ['January 2026', 45, 180],
      ['February 2026', 102, 408],
      ['March 2026', 132, 528],
      ['April 2026', 96, 384]
    ];
    var run = 0, h = '';
    for (var i = 0; i < base.length; i++) {
      run += base[i][2];
      if (run > used) break;
      h += '<tr data-row><td class="nm">' + base[i][0] + '</td>' +
        '<td class="num mono">' + base[i][1] + '</td>' +
        '<td class="num mono">' + base[i][2] + '</td>' +
        '<td class="num mono">' + DATA.money(base[i][2] * 6.25) + '</td>' +
        '<td class="num mono"><b>' + run.toLocaleString() + '</b></td></tr>';
    }
    if (used > run) {
      var extra = used - run;
      h += '<tr data-row><td class="nm">May – ' + (used >= 1900 ? 'October' : 'August') + ' 2026</td>' +
        '<td class="num mono">' + (extra / 4).toFixed(0) + '</td>' +
        '<td class="num mono">' + extra.toLocaleString() + '</td>' +
        '<td class="num mono">' + DATA.money(extra * 6.25) + '</td>' +
        '<td class="num mono"><b>' + used.toLocaleString() + '</b></td></tr>';
    }
    return h;
  }

  screen('budget.detail', {
    title: 'Authorisation — early in the year', nav: 'budget',
    crumb: 'Authorisations <span>›</span> <b>Maria Lopez</b>',
    render: function (S) { return detail(S); }
  });

  screen('budget.alert75', {
    title: 'Authorisation — 75% alert', nav: 'budget',
    crumb: 'Authorisations <span>›</span> <b>Maria Lopez</b>',
    render: function (S) {
      var S2 = S; S2.vars.a1used = 1500;
      return detail(S2, {
        banner: UI.banner('warn', '75% of this authorisation has been used',
          'An email has gone to Renee Alcott and it now shows on the dashboard. ' +
          '125 hours remain for the rest of the year.')
      });
    }
  });

  screen('budget.block', {
    title: 'Over-authorisation warning', nav: 'budget',
    crumb: 'Authorisations <span>›</span> <b>Maria Lopez</b>',
    render: function (S) {
      S.vars.a1used = 1960;
      var a = DATA.byId(DATA.AUTHS, 'a1');
      var c = DATA.authCalc(a, 1960);

      var h = '<div class="page page--narrow">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m mono">PA-GA-44118</span>' +
        '<h1>Enter hours used</h1>' +
        '<span class="sub">November 2026 · Maria Lopez · Community Living Support</span></span></div>';

      h += '<div class="card"><div class="card-head"><h3>November 2026</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Month', { type: 'select', value: 'November 2026' }) +
          UI.field('Hours delivered', { value: '15', bad: true,
            err: 'That is 60 units. Only 40 units remain on this authorisation.' }) +
        '</div>' +

        '<div class="banner banner--bad" style="align-items:flex-start">' +
          UI.icon('warn', 'bi') +
          '<span class="bt"><b>This entry would exceed the authorisation</b>' +
          '<span>You entered <b>60 units</b> but only <b>40 units</b> are left — a shortfall of 20 units, ' +
          'worth ' + DATA.money(20 * 6.25) + '. Services beyond the authorisation will not be reimbursed.</span></span>' +
        '</div>' +

        UI.kv([
          ['Authorised', '<span class="mono">2,000 units</span>'],
          ['Already used', '<span class="mono">1,960 units</span>'],
          ['Remaining', '<span class="mono" style="color:var(--r-600);font-weight:700">40 units — ' + (40 / 4) + ' hours</span>'],
          ['You entered', '<span class="mono" style="color:var(--r-600);font-weight:700">60 units — 15 hours</span>']
        ]) +
      '</div>' +
      '<div class="card-foot">' + UI.btn('Change the hours', { goto: 'budget.detail' }) +
        '<span class="spacer"></span>' +
        UI.btn('Request more authorisation', { goto: 'tasks.new' }) +
        UI.btn('Save 10 hours instead', { cls: 'btn--primary', goto: 'budget.detail' }) +
      '</div></div>';

      h += UI.banner('info', 'Nothing has been saved',
        'The entry is stopped before it is written. This is the feature that prevents delivering care that will never be paid for.');

      return h + '</div>';
    }
  });

})();
