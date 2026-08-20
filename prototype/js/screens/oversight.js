/* ============================================================
   Reviews & oversight — five review types, one shared engine
   ============================================================ */

(function () {

  screen('ov.list', {
    title: 'Review schedule', nav: 'oversight',
    crumb: '<b>Reviews</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.OVERSIGHT, S.agency);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Reviews</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({title:'No reviews scheduled',body:'Supervisor visits, assessments, HRST, plan reviews and DDP inspections appear here once clients exist and their intervals are set.',icon:'shield',actions:[{label:'Set visit intervals',primary:true,goto:'set.intervals'}]}) + '</div>';

      var over = rows.filter(function (r) { return r.status === 'Overdue'; }).length;
      var soon = rows.filter(function (r) { return r.status === 'Due soon'; }).length;

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Reviews and oversight</h1>' +
        '<span class="sub">Supervisor visits, assessments, HRST, Risk Mitigation and Healthcare Plans, DDP reviews</span></span>' +
        '<span class="ph-actions">' + UI.btn('Export', { icon: 'doc', goto: 'rep.export' }) +
        UI.btn('Record a review', { cls: 'btn--primary', icon: 'plus', goto: 'ov.visit' }) + '</span></div>';

      h += '<div class="grid grid-4">' +
        UI.stat({ k: 'Overdue',   v: over, n: 'act today',     kind: 'bad' }) +
        UI.stat({ k: 'Due soon',  v: soon, n: 'next 30 days',  kind: 'warn' }) +
        UI.stat({ k: 'Upcoming',  v: rows.filter(function (r) { return r.status === 'Upcoming'; }).length, n: 'next 90 days', kind: 'info' }) +
        UI.stat({ k: 'Completed', v: rows.filter(function (r) { return r.status === 'Completed'; }).length, n: 'this month', kind: 'ok' }) +
      '</div>';

      h += UI.banner('info', 'All six review types behave identically',
        'Each has a due date, an owner, a reminder, an overdue alert and a history that is never overwritten. ' +
        'Only the interval and the form differ.');

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
        '<span class="fchip">Supervisor visits</span><span class="fchip">Assessments</span>' +
        '<span class="fchip">HRST</span><span class="fchip">Plans</span><span class="fchip">DDP</span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:860px"><thead><tr>' +
        '<th>Client</th><th>Review type</th><th>Interval</th><th>Due</th><th>Assigned</th><th>Status</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (r) {
        var dest = r.type === 'HRST' ? 'ov.hrst' :
                   r.type === 'DDP review' ? 'ov.ddp' :
                   r.type === 'Reassessment' ? 'ov.assess' :
                   r.type.indexOf('Plan') > -1 ? 'ov.plan' : 'ov.visit';
        h += '<tr data-row data-goto="' + dest + '">' +
          '<td class="nm">' + UI.esc(r.clientName) + '</td>' +
          '<td>' + UI.badge(r.type, 'plum') + '</td>' +
          '<td class="small muted">' + UI.esc(r.every) + '</td>' +
          '<td class="num small">' + UI.esc(r.due) + '</td>' +
          '<td class="small">' + UI.esc(r.who) + '</td>' +
          '<td>' + UI.badge(r.status) + '</td></tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  function reviewShell(title, sub, body, banner) {
    var h = '<div class="page">';
    h += '<div class="page-head"><span class="ph-txt">' +
      '<span class="eyebrow-m">Review · Maria Lopez</span><h1>' + title + '</h1>' +
      '<span class="sub">' + sub + '</span></span>' +
      '<span class="ph-actions">' + UI.btn('Open client', { goto: 'clients.profile' }) +
      UI.btn('Complete review', { cls: 'btn--primary', icon: 'check', goto: 'ov.list' }) + '</span></div>';
    if (banner) h += banner;
    return h + body + '</div>';
  }

  screen('ov.visit', {
    title: 'Supervisor visit', nav: 'oversight',
    crumb: 'Reviews <span>›</span> <b>Supervisor visit</b>',
    render: function () {
      var body = '<div class="grid grid-sb"><div class="card"><div class="card-head"><h3>The visit</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Visit type', { type: 'select', value: '62-day visit' }) +
          UI.field('Assigned supervisor', { type: 'select', value: 'Renee Alcott' }) +
          UI.field('Due date', { value: '28 Apr 2026' }) +
          UI.field('Visit completed on', { value: '27 Apr 2026' }) +
          UI.field('Findings', { type: 'textarea', span: true,
            value: 'Home clean and safe. Client engaged. Hallway lighting is dim — flagged for the falls quality item.' }) +
          UI.field('Follow-up required', { type: 'select', value: 'Yes — lighting assessment' }) +
        '</div>' +
        UI.banner('info', 'The next visit date is set automatically',
          'This is a 62-day interval, so the next one falls due 28 June 2026. Intervals are configurable per client.') +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>Interval</h3></div><div class="card-body">' +
        '<div class="radio-row">' +
          '<span class="radio-chip">30 days</span><span class="radio-chip on">62 days</span>' +
          '<span class="radio-chip">90 days</span><span class="radio-chip">122 days</span>' +
          '<span class="radio-chip">Custom</span>' +
        '</div>' +
        UI.kv([['Previous visit', '25 Feb 2026'], ['This visit', '27 Apr 2026'], ['Next due', '28 Jun 2026']]) +
        '</div></div></div>';

      return reviewShell('62-day supervisor visit', 'Maria Lopez · Renee Alcott · due 28 April 2026', body);
    }
  });

  screen('ov.assess', {
    title: 'Assessment / reassessment', nav: 'oversight',
    crumb: 'Reviews <span>›</span> <b>Reassessment</b>',
    render: function () {
      var body = '<div class="card"><div class="card-head"><h3>Annual reassessment</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Assessed by', { type: 'select', value: 'Yvonne Pryce · Registered Nurse' }) +
          UI.field('Assessment date', { value: '11 May 2026' }) +
          UI.field('Previous assessment', { value: '12 May 2025' }) +
          UI.field('Next due', { value: '11 May 2027', hint: 'Set automatically from the annual interval' }) +
          UI.field('Changes identified', { type: 'textarea', span: true,
            value: 'Mobility reduced since the April hospital stay. New medication may be contributing to light-headedness.' }) +
        '</div>' +
        '<div class="field"><label>Does this change anything?</label>' +
        '<div class="clist" style="border:1px solid var(--border);border-radius:8px">' +
          chkRow('HRST', 'health risk score may change', true) +
          chkRow('Risk Mitigation Plan', 'falls risk increased', true) +
          chkRow('Healthcare Plan', 'medication changed', true) +
        '</div><span class="hint">Each tick creates a task with an owner and a due date.</span></div>' +
        '</div></div>';

      return reviewShell('Annual reassessment', 'Curtis Nabors · Yvonne Pryce · due 11 May 2026', body);
    }
  });

  function chkRow(name, why, on) {
    return '<div class="clist-row"><span class="check' + (on ? ' on' : '') + '"><span class="bx">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M5 12.5 10 17.5 19 7"/></svg>' +
      '</span></span><span style="display:flex;flex-direction:column"><span class="cl-n">' + name + '</span>' +
      '<span class="cl-s">' + why + '</span></span><span class="cl-sp"></span>' +
      '<span class="small muted">' + (on ? 'creates a task' : 'no action') + '</span></div>';
  }

  screen('ov.hrst', {
    title: 'HRST review', nav: 'oversight',
    crumb: 'Reviews <span>›</span> <b>HRST</b>',
    render: function () {
      var body = '<div class="grid grid-sb"><div class="grid" style="gap:16px">' +
        '<div class="card"><div class="card-head"><h3>Health Risk Screening Tool</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Current HRST date', { value: '18 Jun 2025' }) +
          UI.field('Reviewed by', { type: 'select', value: 'Yvonne Pryce' }) +
          UI.field('Review due', { value: '24 Apr 2026' }) +
          UI.field('Was an update required?', { type: 'select', value: 'Yes' }) +
          UI.field('What changed', { type: 'textarea', span: true,
            value: 'Falls risk raised following three incidents in April and the hospital admission. Medication section updated for the new diuretic.' }) +
        '</div></div></div>' +

        '<div class="card"><div class="card-head"><h3>Previous versions</h3>' +
        '<span class="spacer"></span>' + UI.badge('Kept forever', 'info') + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Dated</th><th>Reviewed by</th><th>Reason</th></tr></thead><tbody>' +
        '<tr data-row><td class="num small">18 Jun 2025</td><td class="small">Yvonne Pryce</td><td class="small">Annual</td></tr>' +
        '<tr data-row><td class="num small">14 Jun 2024</td><td class="small">Yvonne Pryce</td><td class="small">Annual</td></tr>' +
        '<tr data-row><td class="num small">03 Feb 2024</td><td class="small">Yvonne Pryce</td><td class="small">Triggered by incident</td></tr>' +
        '</tbody></table></div></div></div>' +

        '<div class="card"><div class="card-head"><h3>Why this review exists</h3></div><div class="card-body">' +
        '<div class="tl">' +
          UI.tlItem('bad', 'Fall on 3 April', 'incident recorded') +
          UI.tlItem('bad', 'Hospital stay 12–16 April', 'dizziness and dehydration') +
          UI.tlItem('bad', 'Fall on 30 April', 'third incident that month') +
          UI.tlItem('now', 'HRST review prompted', 'the system asked, a nurse decided') +
        '</div>' +
        '<span class="small muted">HRST is reviewed every year as standard, and again whenever something significant happens.</span>' +
        '</div></div></div>';

      return reviewShell('HRST review', 'Maria Lopez · Yvonne Pryce · triggered by incidents',
        body, UI.banner('warn', 'This review was prompted by an incident, not the calendar',
          'The annual review is not due until June. Three incidents in April brought it forward.'));
    }
  });

  screen('ov.plan', {
    title: 'Plan review', nav: 'oversight',
    crumb: 'Reviews <span>›</span> <b>Plan review</b>',
    render: function () {
      var body = '<div class="grid grid-2">' +
        planCard('Risk Mitigation Plan', 'Reduces known risks — falls, choking, wandering', [
          ['Plan effective', '20 Apr 2026'],
          ['Last reviewed', '23 Apr 2026'],
          ['Reviewed by', 'Yvonne Pryce'],
          ['Next review', '23 Oct 2026'],
          ['Identified risks', 'Falls · light-headedness on standing · reduced mobility']
        ]) +
        planCard('Healthcare Plan', 'Medical needs and how staff should respond', [
          ['Plan effective', '20 Apr 2026'],
          ['Last reviewed', '23 Apr 2026'],
          ['Reviewed by', 'Yvonne Pryce'],
          ['Next review', '23 Oct 2026'],
          ['Recent change', 'New diuretic added after the April admission']
        ]) +
      '</div>';

      return reviewShell('Plan reviews', 'Maria Lopez · both completed 23 April 2026', body,
        UI.banner('ok', 'Both reviews were created by the nurse visit',
          'Neither was typed from scratch — ticking two boxes on the follow-up visit form created them, with owners and due dates.'));
    }
  });

  function planCard(title, sub, pairs) {
    return '<div class="card"><div class="card-head"><h3>' + title + '</h3>' +
      '<span class="spacer"></span>' + UI.badge('Completed') + '</div>' +
      '<div class="card-body"><span class="small muted">' + sub + '</span>' + UI.kv(pairs) +
      '<div class="row">' + UI.btn('View history', { cls: 'btn--sm' }) +
      UI.btn('Record a review', { cls: 'btn--sm btn--primary' }) + '</div></div></div>';
  }

  screen('ov.ddp', {
    title: 'DDP review', nav: 'oversight',
    crumb: 'Reviews <span>›</span> <b>DDP review</b>',
    render: function () {
      var body = '<div class="card"><div class="card-head"><h3>Quarterly DDP oversight review</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Client', { type: 'select', value: 'Adaeze Okafor' }) +
          UI.field('DDP', { type: 'select', value: 'External · Marcia Threadgill' }) +
          UI.field('Review due', { value: '30 Apr 2026' }) +
          UI.field('Frequency', { type: 'select', value: 'Quarterly' }) +
          UI.field('Findings', { type: 'textarea', span: true,
            value: 'Documentation broadly in order. Service agreement expires in 12 days and has not been started. Two monthly ISP entries were late.' }) +
          UI.field('Recommendations', { type: 'textarea', span: true,
            value: 'Begin the renewal now. Set a recurring monthly reminder for ISP entries.' }) +
        '</div>' +
        UI.banner('info', 'Findings become tasks without retyping',
          'Each recommendation below can be turned into a compliance task or a quality item in one click.') +
        '<div class="clist" style="border:1px solid var(--border);border-radius:8px">' +
          '<div class="clist-row"><span class="cl-n">Start the service agreement renewal</span>' +
          '<span class="cl-sp"></span>' + UI.btn('Make a task', { cls: 'btn--sm', goto: 'tasks.new' }) + '</div>' +
          '<div class="clist-row"><span class="cl-n">Recurring monthly ISP reminder</span>' +
          '<span class="cl-sp"></span>' + UI.btn('Make a task', { cls: 'btn--sm', goto: 'tasks.new' }) + '</div>' +
        '</div>' +
        '</div></div>';

      return reviewShell('DDP quarterly review', 'Adaeze Okafor · external DDP · due 30 April 2026', body);
    }
  });

})();
