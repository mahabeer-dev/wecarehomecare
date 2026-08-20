/* ============================================================
   Tasks — the generic work item, attachable to anything
   ============================================================ */

(function () {

  screen('tasks.list', {
    title: 'Task list', nav: 'tasks',
    crumb: '<b>Tasks</b>',
    render: function (S) {
      var rows = DATA.inAgency(DATA.TASKS, S.agency);
      if (!rows.length) return '<div class="page">' +
        '<div class="page-head"><span class="ph-txt"><h1>Tasks</h1>' +
        '<span class="sub">Nothing here yet</span></span></div>' +
        UI.emptyModule({title:'Nothing on the list',body:'Tasks can be created by hand, or raised automatically by an incident, a review finding or an expiring document.',icon:'check',actions:[{label:'Create a task',primary:true,icon:'plus',goto:'tasks.new'}]}) + '</div>';

      var od = rows.filter(function (t) { return t.status === 'Overdue'; }).length;

      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Tasks</h1>' +
        '<span class="sub">One-off and recurring · every task can hang off any record</span></span>' +
        '<span class="ph-actions">' + UI.btn('New task', { cls: 'btn--primary', icon: 'plus', goto: 'tasks.new' }) + '</span></div>';

      if (od) h += UI.banner('bad', od + ' tasks are overdue',
        'Overdue items are escalated to the manager automatically after 7 days.',
        UI.btn('See escalations', { cls: 'btn--sm', goto: 'tasks.escalated' }));

      h += '<div class="card"><div class="filters">' +
        '<span class="fchip on">All <span class="ct">' + rows.length + '</span></span>' +
        '<span class="fchip">Overdue <span class="ct">' + od + '</span></span>' +
        '<span class="fchip">Mine <span class="ct">4</span></span>' +
        '<span class="fchip">Recurring <span class="ct">1</span></span>' +
        '<span class="fchip">Completed <span class="ct">2</span></span>' +
        '</div><div class="tbl-wrap"><table class="tbl" style="min-width:900px"><thead><tr>' +
        '<th>Task</th><th>Attached to</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th>' +
        '</tr></thead><tbody>';

      rows.forEach(function (t) {
        h += '<tr data-row data-goto="tasks.detail">' +
          '<td><span class="nm">' + UI.esc(t.title) + '</span>' +
            (t.recurring ? ' ' + UI.badge('Repeats', 'info') : '') + '</td>' +
          '<td class="small muted">' + UI.esc(t.linked) + '</td>' +
          '<td class="small">' + UI.esc(t.owner) + '</td>' +
          '<td class="num small">' + UI.esc(t.due) + '</td>' +
          '<td>' + UI.badge(t.priority, t.priority === 'High' ? 'warn' : 'neutral') + '</td>' +
          '<td>' + UI.badge(t.status) + '</td>' +
        '</tr>';
      });

      return h + '</tbody></table></div></div></div>';
    }
  });

  screen('tasks.new', {
    title: 'New task', nav: 'tasks',
    crumb: 'Tasks <span>›</span> <b>New</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt"><h1>New task</h1>' +
        '<span class="sub">Attach it to a record so it shows up in the right place</span></span></div>' +

        '<div class="card"><div class="card-body"><div class="form-grid">' +
          UI.field('Title', { span: true, value: 'Lighting assessment in the hallway' }) +
          UI.field('Attach to', { type: 'select', value: 'Quality item · Repeat falls — Maria Lopez' }) +
          UI.field('Assign to', { type: 'select', value: 'Renee Alcott' }) +
          UI.field('Due date', { value: '14 May 2026' }) +
          UI.field('Priority', { type: 'select', value: 'Medium' }) +
          UI.field('Notes', { type: 'textarea', span: true,
            value: 'Check lux levels in the hallway and on the stairs. Quote for replacement fittings if below standard.' }) +
        '</div>' +

        '<div class="field"><label>Repeat</label><div class="radio-row">' +
          '<span class="radio-chip on">Just once</span>' +
          '<span class="radio-chip">Every month</span>' +
          '<span class="radio-chip">Every quarter</span>' +
          '<span class="radio-chip">Every year</span>' +
        '</div><span class="hint">A repeating task creates the next one automatically when this is completed.</span></div>' +

        '<div class="field"><label>Attachments</label>' +
        '<div style="border:2px dashed var(--border-strong);border-radius:8px;padding:18px;text-align:center;cursor:pointer" class="small muted">' +
        'Drop a file here, or click to browse</div></div>' +

        '</div><div class="card-foot">' + UI.btn('Cancel', { goto: 'tasks.list' }) + '<span class="spacer"></span>' +
        UI.btn('Create task', { cls: 'btn--primary', icon: 'check', goto: 'tasks.detail' }) + '</div></div>' +

        UI.banner('info', 'A task can attach to anything',
          'A client, a caregiver, an incident, a hospitalisation, a quality item or a review finding. ' +
          'That is why nothing has to be typed twice.') +
      '</div>';
    }
  });

  screen('tasks.detail', {
    title: 'Task detail', nav: 'tasks',
    crumb: 'Tasks <span>›</span> <b>Lighting assessment</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Task · created 30 April 2026</span>' +
        '<h1>Lighting assessment in the hallway</h1>' +
        '<span class="sub">Renee Alcott · due 14 May 2026</span></span>' +
        '<span class="ph-actions">' + UI.btn('Reassign', {}) +
        UI.btn('Mark complete', { cls: 'btn--primary', icon: 'check', goto: 'tasks.list' }) + '</span></div>';

      h += '<div class="grid grid-sb"><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Detail</h3><span class="spacer"></span>' +
        UI.badge('Not started') + '</div><div class="card-body">' +
        UI.kv([
          ['Attached to', '<span class="linkish" data-goto="qi.detail">Quality item · Repeat falls — Maria Lopez</span>'],
          ['Owner', 'Renee Alcott'],
          ['Due', '14 May 2026'],
          ['Priority', UI.badge('Medium', 'neutral')],
          ['Repeats', 'No'],
          ['Notes', 'Check lux levels in the hallway and on the stairs. Quote for replacement fittings if below standard.']
        ]) + '</div></div>';

      h += '<div class="card"><div class="card-head"><h3>History</h3></div><div class="card-body"><div class="tl">' +
        UI.tlItem('ok', 'Task created', '30 Apr · from the quality item') +
        UI.tlItem('',   'Reminder due', '7 May · 7 days before the due date') +
        UI.tlItem('',   'Due', '14 May') +
        UI.tlItem('',   'Escalation if untouched', '21 May · goes to the manager') +
      '</div></div></div>';

      h += '</div><div class="grid" style="gap:16px">';

      h += '<div class="card"><div class="card-head"><h3>Related</h3></div><div class="clist">' +
        '<div class="clist-row" data-goto="qi.detail"><span class="cl-n">Repeat falls</span>' +
          '<span class="cl-sp"></span><span class="small muted">quality item</span></div>' +
        '<div class="clist-row" data-goto="clients.profile"><span class="cl-n">Maria Lopez</span>' +
          '<span class="cl-sp"></span><span class="small muted">client</span></div>' +
        '<div class="clist-row" data-goto="inc.trigger"><span class="cl-n">Fall · 30 April</span>' +
          '<span class="cl-sp"></span><span class="small muted">incident</span></div>' +
      '</div></div>';

      h += '</div></div>';
      return h + '</div>';
    }
  });

  screen('tasks.escalated', {
    title: 'Overdue and escalated', nav: 'tasks',
    crumb: 'Tasks <span>›</span> <b>Escalated</b>',
    render: function () {
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt"><h1>Overdue and escalated</h1>' +
        '<span class="sub">Nothing is allowed to go quiet</span></span></div>';

      h += UI.banner('bad', '2 tasks have been escalated to the manager',
        'A task that stays untouched past its due date is raised automatically. The escalation is recorded in the audit trail.');

      h += '<div class="card"><div class="tbl-wrap"><table class="tbl" style="min-width:820px"><thead><tr>' +
        '<th>Task</th><th>Owner</th><th>Due</th><th>Days late</th><th>Escalated to</th>' +
        '</tr></thead><tbody>' +
        '<tr data-row data-goto="inc.detail"><td class="nm">Complete nurse follow-up visit — Maria Lopez</td>' +
        '<td class="small">Yvonne Pryce</td><td class="num small">10 Apr</td>' +
        '<td class="num"><b style="color:var(--r-600)">25</b></td><td class="small">Renee Alcott</td></tr>' +
        '<tr data-row data-goto="cg.detail"><td class="nm">Renew CPR certification — Marcus Odell</td>' +
        '<td class="small">Renee Alcott</td><td class="num small">27 Feb</td>' +
        '<td class="num"><b style="color:var(--r-600)">67</b></td><td class="small">Dawn Bostock</td></tr>' +
        '</tbody></table></div></div>';

      return h + '</div>';
    }
  });

})();
