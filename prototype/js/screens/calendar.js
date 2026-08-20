/* ============================================================
   Calendar — built from real due dates in the store.

   Nothing is scheduled by hand here. Every entry is a date some
   other record already carries: a review, a task, a nurse visit,
   a monthly progress entry. An empty system shows an empty month.
   ============================================================ */

(function () {

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* "28 Apr 2026" -> { day:28, mon:3, year:2026 }. Anything else -> null. */
  function parseDate(str) {
    if (!str || typeof str !== 'string') return null;
    var m = str.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
    if (!m) return null;
    var mon = MONTHS.indexOf(m[2].slice(0, 3));
    if (mon < 0) return null;
    return { day: parseInt(m[1], 10), mon: mon, year: parseInt(m[3], 10) };
  }

  /* Everything in the store that carries a date. */
  function events(agency) {
    var out = [];

    DATA.inAgency(DATA.OVERSIGHT, agency).forEach(function (o) {
      out.push({ date:o.due, title:o.type, sub:o.clientName + ' · ' + o.who,
                 tone: o.status === 'Overdue' ? 'bad' : o.status === 'Due soon' ? 'warn' : 'plum',
                 goto: o.type === 'HRST' ? 'ov.hrst' : o.type === 'DDP review' ? 'ov.ddp' : 'ov.list' });
    });

    DATA.inAgency(DATA.TASKS, agency).forEach(function (t) {
      out.push({ date:t.due, title:t.title, sub:t.owner,
                 tone: t.status === 'Overdue' ? 'bad' : t.status === 'Completed' ? 'ok' : 'info',
                 goto:'tasks.detail' });
    });

    DATA.inAgency(DATA.HOSPS, agency).forEach(function (hp) {
      if (!hp.visitDue || hp.visitDue === '—') return;
      out.push({ date:hp.visitDue, title:'Nurse follow-up visit', sub:hp.clientName + ' · ' + hp.nurse,
                 tone: hp.visitStatus === 'Overdue' ? 'bad' : 'warn', goto:'hosp.visit' });
    });

    DATA.inAgency(DATA.CLIENTS, agency).forEach(function (c) {
      if (!c.agreement || !c.agreement.end) return;
      out.push({ date:c.agreement.end, title:'Service agreement expires', sub:c.name,
                 tone: c.agreement.status === 'Due soon' ? 'warn' : 'neutral', goto:'clients.list' });
    });

    DATA.inAgency(DATA.AUTHS, agency).forEach(function (a) {
      out.push({ date:a.end, title:'Authorisation ends', sub:a.clientName + ' · ' + a.service,
                 tone:'neutral', goto:'budget.detail' });
    });

    return out.filter(function (e) { return !!parseDate(e.date); });
  }

  /* Which month to show: the one holding the most upcoming work. */
  function pickMonth(list) {
    if (!list.length) return { mon: 4, year: 2026 };
    var tally = {};
    list.forEach(function (e) {
      var d = parseDate(e.date);
      var k = d.year + '-' + d.mon;
      tally[k] = (tally[k] || 0) + 1;
    });
    var best = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; })[0];
    var parts = best.split('-');
    return { mon: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
  }

  function grid(list, view) {
    var byDay = {};
    list.forEach(function (e) {
      var d = parseDate(e.date);
      if (d.mon !== view.mon || d.year !== view.year) return;
      (byDay[d.day] = byDay[d.day] || []).push(e);
    });

    var days = new Date(view.year, view.mon + 1, 0).getDate();
    var first = new Date(view.year, view.mon, 1).getDay();
    var lead = (first + 6) % 7;               /* weeks start Monday */

    var h = '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px;' +
            'background:var(--border);border:1px solid var(--border);border-radius:0 0 11px 11px;overflow:hidden">';
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(function (d) {
      h += '<div style="background:var(--n-25);padding:8px 10px;font-family:var(--mono);font-size:9.5px;' +
           'letter-spacing:.12em;color:var(--text-mute);text-transform:uppercase">' + d + '</div>';
    });

    var cells = Math.ceil((lead + days) / 7) * 7;
    for (var i = 0; i < cells; i++) {
      var day = i - lead + 1;
      var inMonth = day >= 1 && day <= days;
      var evs = (inMonth && byDay[day]) || [];
      h += '<div class="card--click" data-goto="' + ((evs[0] && evs[0].goto) || '') + '" ' +
           'style="background:var(--surface);min-height:94px;padding:7px 8px;display:flex;' +
           'flex-direction:column;gap:4px;' + (inMonth ? '' : 'opacity:.3;') + 'cursor:pointer">' +
           '<span class="mono" style="font-size:11px;color:var(--text-mute)">' + (inMonth ? day : '') + '</span>';
      evs.slice(0, 3).forEach(function (e) {
        h += '<span class="badge badge--' + e.tone + '" style="font-size:10px;padding:2px 6px;' +
             'white-space:normal;text-align:left;line-height:1.25">' + UI.esc(e.title) + '</span>';
      });
      if (evs.length > 3) h += '<span class="small muted" style="font-size:10px">+' + (evs.length - 3) + ' more</span>';
      h += '</div>';
    }
    return h + '</div>';
  }

  function emptyMonth() {
    return '<div class="card-body"><div class="empty" style="padding:52px 24px">' +
      UI.icon('cal', 'ei') + '<b>Nothing scheduled</b>' +
      '<span style="max-width:42ch">The calendar fills itself from due dates already in the system — ' +
      'reviews, tasks, nurse visits, agreements and authorisations. Add some records and they appear here.</span>' +
      '</div></div>';
  }

  screen('cal.mine', {
    title: 'My calendar', nav: 'calendar',
    crumb: '<b>Calendar</b>',
    render: function (S) {
      var list = events(S.agency);
      var view = pickMonth(list);

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<h1>' + MONTHS[view.mon] + ' ' + view.year + '</h1>' +
        '<span class="sub">' + (list.length
          ? 'Every due date in the system, in one place'
          : 'Nothing has a date yet') + '</span></span>' +
        '<span class="ph-actions">' +
        '<span class="fchip on">Mine</span><span class="fchip" data-goto="cal.team">Team</span>' +
        UI.btn('New event', { cls:'btn--primary', icon:'plus', goto:'tasks.new' }) + '</span></div>';

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">Everything <span class="ct">' + list.length + '</span></span>' +
        '<span class="fchip">Reviews</span><span class="fchip">Tasks</span>' +
        '<span class="fchip">Nurse visits</span><span class="fchip">Expiry dates</span>' +
        '<span class="spacer"></span><span class="small muted">Pulled from records, not typed in here.</span>' +
        '</div>' + (list.length ? grid(list, view) : emptyMonth()) + '</div>';

      return h + '</div>';
    }
  });

  screen('cal.team', {
    title: 'Team calendar', nav: 'calendar',
    crumb: 'Calendar <span>&rsaquo;</span> <b>Team</b>',
    render: function (S) {
      var list = events(S.agency);
      var people = {};
      list.forEach(function (e) {
        var who = (e.sub || '').split(' · ').pop();
        if (!who) return;
        people[who] = people[who] || { total: 0, late: 0 };
        people[who].total++;
        if (e.tone === 'bad') people[who].late++;
      });
      var names = Object.keys(people);

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Team workload</h1>' +
        '<span class="sub">Who has what coming up, in ' + UI.esc(DATA.agencyShort(S.agency)) + '</span></span>' +
        '<span class="ph-actions">' +
        '<span class="fchip" data-goto="cal.mine">Mine</span><span class="fchip on">Team</span></span></div>';

      h += '<div class="card">';
      if (names.length) {
        h += '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
          '<th>Person</th><th>Dated items</th><th>Overdue</th></tr></thead><tbody>';
        names.sort(function (a, b) { return people[b].total - people[a].total; }).forEach(function (n) {
          h += '<tr data-row data-goto="cal.mine">' +
            '<td><span class="rowmain"><span class="ava-sm">' + UI.esc(UI.initials(n)) + '</span>' +
            '<span class="nm">' + UI.esc(n) + '</span></span></td>' +
            '<td class="num mono">' + people[n].total + '</td>' +
            '<td class="num">' + (people[n].late
              ? '<b style="color:var(--r-600)">' + people[n].late + '</b>'
              : '<span class="muted">0</span>') + '</td></tr>';
        });
        h += '</tbody></table></div>';
      } else {
        h += '<div class="card-body"><div class="empty" style="padding:48px 24px">' +
          UI.icon('people', 'ei') + '<b>Nobody has anything scheduled</b>' +
          '<span>Once records exist with owners and due dates, the split shows here.</span></div></div>';
      }
      h += '</div>';

      return h + '</div>';
    }
  });

})();
