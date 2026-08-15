/* ============================================================
   Calendar — per user, plus a team view
   ============================================================ */

(function () {

  var EVENTS = {
    4:  [['Supervisor visit', 'Harold Bramlett', 'bad']],
    5:  [['Monthly ISP entries due', 'All Georgia clients', 'warn']],
    7:  [['Reminder · lighting task', 'Renee Alcott', 'info']],
    11: [['Annual reassessment', 'Curtis Nabors', 'plum']],
    12: [['GP review', 'Maria Lopez', 'info']],
    14: [['Lighting assessment due', 'Renee Alcott', 'warn']],
    18: [['Team meeting', '09:30 · all staff', 'neutral']],
    21: [['QI review due', 'Repeat falls', 'warn']],
    26: [['DDP quarterly review', 'Adaeze Okafor', 'plum']],
    28: [['Supervisor visit', 'Maria Lopez', 'plum']]
  };

  function grid() {
    var h = '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:0 0 11px 11px;overflow:hidden">';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (d) {
      h += '<div style="background:var(--n-25);padding:8px 10px;font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--text-mute);text-transform:uppercase">' + d + '</div>';
    });
    for (var i = 0; i < 35; i++) {
      var day = i - 3;
      var inMonth = day >= 1 && day <= 31;
      var evs = EVENTS[day] || [];
      h += '<div style="background:var(--surface);min-height:96px;padding:7px 8px;display:flex;flex-direction:column;gap:4px;' +
        (inMonth ? '' : 'opacity:.35;') + 'cursor:pointer" class="card--click">' +
        '<span class="mono" style="font-size:11px;color:' + (day === 5 ? 'var(--p-700);font-weight:700' : 'var(--text-mute)') + '">' +
        (inMonth ? day : '') + '</span>';
      evs.forEach(function (e) {
        h += '<span class="badge badge--' + e[2] + '" style="font-size:10px;padding:2px 6px;white-space:normal;text-align:left;line-height:1.25">' +
          UI.esc(e[0]) + '</span>';
      });
      h += '</div>';
    }
    return h + '</div>';
  }

  screen('cal.mine', {
    title: 'My calendar', nav: 'calendar',
    crumb: '<b>Calendar</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>May 2026</h1>' +
        '<span class="sub">Your reminders, visits and meetings in one place</span></span>' +
        '<span class="ph-actions">' +
        '<span class="fchip on">Mine</span><span class="fchip" data-goto="cal.team">Team</span>' +
        UI.btn('New event', { cls: 'btn--primary', icon: 'plus' }) + '</span></div>';

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">Everything</span><span class="fchip">Visits</span>' +
        '<span class="fchip">Reviews</span><span class="fchip">Task due dates</span>' +
        '<span class="fchip">Meetings</span>' +
        '<span class="spacer"></span><span class="small muted">Due dates from every module appear here automatically.</span>' +
        '</div>' + grid() + '</div>';

      return h + '</div>';
    }
  });

  screen('cal.team', {
    title: 'Team calendar', nav: 'calendar',
    crumb: 'Calendar <span>›</span> <b>Team</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Team · May 2026</h1>' +
        '<span class="sub">Who is doing what, across Georgia</span></span>' +
        '<span class="ph-actions">' +
        '<span class="fchip" data-goto="cal.mine">Mine</span><span class="fchip on">Team</span></span></div>';

      h += '<div class="card"><div class="tbl-wrap"><table class="tbl" style="min-width:880px"><thead><tr>' +
        '<th>Person</th><th>This week</th><th>Next week</th><th>Overdue</th></tr></thead><tbody>' +
        trow('Renee Alcott', 'Office Manager', 4, 3, 1) +
        trow('Yvonne Pryce', 'Registered Nurse', 5, 2, 2) +
        trow('Dawn Bostock', 'Owner', 1, 1, 0) +
        '</tbody></table></div></div>';

      h += '<div class="card"><div class="card-head"><h3>Unassigned work</h3></div><div class="clist">' +
        '<div class="clist-row" data-goto="tasks.list">' + UI.badge('Needs an owner', 'warn') +
        '<span class="cl-n">DDP review follow-up · Adaeze Okafor</span><span class="cl-sp"></span>' + UI.icon('arrow') + '</div>' +
        '</div></div>';

      return h + '</div>';
    }
  });

  function trow(name, role, wk, nx, od) {
    return '<tr data-row data-goto="cal.mine"><td><span class="rowmain"><span class="ava-sm">' +
      UI.esc(UI.initials(name)) + '</span><span><span class="nm">' + UI.esc(name) + '</span><br>' +
      '<span class="sub2">' + UI.esc(role) + '</span></span></span></td>' +
      '<td class="num mono">' + wk + '</td><td class="num mono">' + nx + '</td>' +
      '<td class="num">' + (od ? '<b style="color:var(--r-600)">' + od + '</b>' : '<span class="muted">0</span>') + '</td></tr>';
  }

})();
