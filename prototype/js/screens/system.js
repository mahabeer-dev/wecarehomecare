/* ============================================================
   System — audit trail, empty state, loading skeleton
   ============================================================ */

(function () {

  screen('sys.audit', {
    title: 'Audit trail', nav: 'audit',
    crumb: '<b>Audit trail</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Audit trail</h1>' +
        '<span class="sub">Who created, changed, reviewed, approved, exported or completed anything — and when</span></span>' +
        '<span class="ph-actions">' + UI.btn('Export', { icon: 'doc', goto: 'rep.export' }) + '</span></div>';

      h += UI.banner('info', 'Nothing here can be edited or deleted',
        'Entries are written automatically on every change. The audit view itself respects role permissions.');

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">Everything</span><span class="fchip">By the system</span>' +
        '<span class="fchip">By a person</span><span class="fchip">Exports</span>' +
        '<span class="spacer"></span><span class="fchip">' + UI.icon('search') + 'Search</span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:880px"><thead><tr>' +
        '<th>When</th><th>Who</th><th>What happened</th><th>Why</th></tr></thead><tbody>';

      DATA.AUDIT.forEach(function (a) {
        h += '<tr data-row><td class="num small nowrap">' + UI.esc(a.when) + '</td>' +
          '<td>' + (a.who === 'System' ? UI.badge('System', 'info') : '<span class="small">' + UI.esc(a.who) + '</span>') + '</td>' +
          '<td class="nm">' + UI.esc(a.what) + '</td>' +
          '<td class="small muted">' + UI.esc(a.why) + '</td></tr>';
      });

      return h + '</tbody></table></div>' +
        '<div class="card-foot"><span class="small muted">Showing 8 of 4,412 entries for Georgia.</span></div></div></div>';
    }
  });

  screen('sys.empty', {
    title: 'Empty state', nav: 'clients',
    crumb: 'Clients <span>›</span> <b>No results</b>',
    render: function () {
      return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Clients</h1>' +
        '<span class="sub">Mississippi · filtered to “agreement expiring”</span></span></div>' +
        '<div class="card"><div class="filters">' +
        '<span class="fchip">All <span class="ct">3</span></span>' +
        '<span class="fchip on">Agreement expiring <span class="ct">0</span></span>' +
        '<span class="fchip">Documents incomplete <span class="ct">1</span></span>' +
        '</div><div class="card-body">' +
        UI.empty('Nothing matches that filter',
          'No Mississippi agreements expire in the next 90 days. Try a different filter, or clear it to see all 3 clients.') +
        '<div class="row" style="justify-content:center">' +
        UI.btn('Clear the filter', { cls: 'btn--primary', goto: 'clients.list' }) + '</div>' +
        '</div></div></div>';
    }
  });

  screen('sys.loading', {
    title: 'Loading state', nav: 'dash',
    crumb: '<b>Dashboard</b>',
    auto: true, autoMs: 1600,
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<div class="skel" style="height:14px;width:180px"></div>' +
        '<div class="skel" style="height:28px;width:280px;margin-top:8px"></div></span></div>';

      h += '<div class="grid grid-4">';
      for (var i = 0; i < 4; i++) h += '<div class="skel" style="height:96px;border-radius:11px"></div>';
      h += '</div>';

      h += '<div class="grid grid-sb"><div class="card"><div class="card-head">' +
        '<div class="skel" style="height:16px;width:180px"></div></div><div class="card-body">';
      for (var j = 0; j < 6; j++) h += '<div class="skel" style="height:42px"></div>';
      h += '</div></div><div class="card"><div class="card-body">';
      for (var k = 0; k < 4; k++) h += '<div class="skel" style="height:52px"></div>';
      h += '</div></div></div>';

      return h + '</div>';
    }
  });

})();
