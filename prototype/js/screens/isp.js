/* ============================================================
   Monthly ISP goal progress — one typed percentage per month
   ============================================================ */

(function () {

  screen('isp.list', {
    title: 'ISP progress list', nav: 'isp',
    crumb: '<b>ISP progress</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Monthly goal progress</h1>' +
        '<span class="sub">The plans live in the EMR. Here we only track how each goal is going, month by month.</span></span>' +
        '<span class="ph-actions">' + UI.btn('Enter this month', { cls: 'btn--primary', icon: 'plus', goto: 'isp.entry' }) + '</span></div>';

      h += UI.banner('warn', 'May entries are due for 4 goals',
        'A reminder went out on 1 May. Anything still blank on the 7th appears on the dashboard as overdue.');

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">All goals <span class="ct">3</span></span>' +
        '<span class="fchip">Missing this month <span class="ct">1</span></span>' +
        '<span class="fchip">Progress dropped <span class="ct">1</span></span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:880px"><thead><tr>' +
        '<th>Client</th><th>Goal</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th><th>Trend</th>' +
        '</tr></thead><tbody>';

      DATA.ISP.forEach(function (g) {
        h += '<tr data-row data-goto="isp.detail"><td class="nm">' + UI.esc(g.clientName) + '</td>' +
          '<td class="small">' + UI.esc(g.goal) + '</td>';
        g.months.forEach(function (m) {
          h += '<td class="num mono">' + (m.pc == null
            ? '<span class="muted">—</span>'
            : (g.drop && m.m === 'May' ? '<b style="color:var(--r-600)">' + m.pc + '%</b>' : m.pc + '%')) + '</td>';
        });
        h += '<td>' + (g.drop ? UI.badge('Dropped', 'bad')
          : g.months[4].pc == null ? UI.badge('Missing', 'warn') : UI.badge('Improving', 'ok')) + '</td></tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  screen('isp.entry', {
    title: 'Enter monthly progress', nav: 'isp',
    crumb: 'ISP progress <span>›</span> <b>May 2026</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>May 2026 progress</h1>' +
        '<span class="sub">Maria Lopez · one entry per goal · typed by the reviewer</span></span></div>' +

        '<div class="card"><div class="card-head"><h3>Prepare a simple meal independently three times per week</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Progress this month', { value: '30', hint: 'A whole number from 0 to 100' }) +
          UI.field('Documented by', { type: 'select', value: 'Renee Alcott' }) +
          UI.field('Note', { type: 'textarea', span: true,
            value: 'Managed once in the month. Confidence dropped after the fall and the hospital stay; support worker now prompting more.' }) +
        '</div>' +
        UI.banner('warn', 'That is 35 points below April',
          'April was 65%. A drop this size raises an alert so a manager can look at why.') +
        '</div>' +
        '<div class="card-foot">' + UI.btn('Cancel', { goto: 'isp.list' }) + '<span class="spacer"></span>' +
        UI.btn('Save entry', { cls: 'btn--primary', icon: 'check', goto: 'isp.detail' }) + '</div></div>' +

        UI.banner('info', 'The number is typed, never calculated',
          'The system does not work this out from activity data. A person who knows the client decides it.') +
      '</div>';
    }
  });

  screen('isp.detail', {
    title: 'Goal trend — sharp drop', nav: 'isp',
    crumb: 'ISP progress <span>›</span> <b>Maria Lopez</b>',
    render: function () {
      var g = DATA.ISP[0];

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Maria Lopez · goal 1 of 2</span>' +
        '<h1>Prepare a simple meal independently</h1>' +
        '<span class="sub">Three times per week · reviewed monthly by Renee Alcott</span></span>' +
        '<span class="ph-actions">' + UI.emrLink('the full ISP') + '</span></div>';

      h += UI.banner('bad', 'Progress dropped 35 points in May',
        'From 65% in April to 30% in May. The drop lines up with the fall on 30 April and the hospital stay.',
        UI.btn('Open a quality item', { cls: 'btn--sm', goto: 'qi.detail' }));

      h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Month by month</h3>' +
        '<span class="spacer"></span><span class="sub">every month stored separately</span></div>' +
        '<div class="card-body">' + UI.bars(g.months) + '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>The entries</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Month</th><th>Progress</th><th>Change</th><th>Documented by</th><th>Note</th>' +
        '</tr></thead><tbody>' +
        mrow('January',  20, null, 'Getting used to the routine.') +
        mrow('February', 35, 15, 'Made a sandwich unaided twice.') +
        mrow('March',    50, 15, 'Now managing a hot meal with prompting.') +
        mrow('April',    65, 15, 'Best month so far — three meals in the last week.') +
        mrow('May',      30, -35, 'Confidence dropped after the fall and hospital stay.') +
        '</tbody></table></div></div>';

      h += '</div><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Other goal</h3></div><div class="card-body">' +
        '<b class="small">Attend a community activity once per week</b>' +
        UI.bars(DATA.ISP[1].months) +
        '<span class="small muted">Still improving — the drop is specific to the meal goal.</span>' +
      '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>Alert rules</h3></div><div class="card-body" style="gap:9px">' +
        '<div class="row"><span class="small">Entry missing for the month</span><span class="spacer"></span>' + UI.badge('On', 'ok') + '</div>' +
        '<div class="row"><span class="small">Drop of 20 points or more</span><span class="spacer"></span>' + UI.badge('On', 'ok') + '</div>' +
        '<div class="row"><span class="small">No progress for 3 months</span><span class="spacer"></span>' + UI.badge('On', 'ok') + '</div>' +
      '</div></div>';

      h += '</div></div>';
      return h + '</div>';
    }
  });

  function mrow(m, pc, chg, note) {
    return '<tr data-row><td class="nm">' + m + ' 2026</td>' +
      '<td class="num mono"><b>' + pc + '%</b></td>' +
      '<td class="num">' + (chg == null ? '<span class="muted">—</span>' :
        '<b style="color:var(--' + (chg < 0 ? 'r-600' : 'gr-600') + ')">' + (chg > 0 ? '+' : '') + chg + '</b>') + '</td>' +
      '<td class="small">Renee Alcott</td>' +
      '<td class="small muted">' + UI.esc(note) + '</td></tr>';
  }

})();
