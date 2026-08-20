/* ============================================================
   Day one — the system exactly as the client receives it,
   with nothing in it, and the order things get set up.
   ============================================================ */

(function () {

  /* Which setup steps are done. Advanced by S.vars.setupStep. */
  var STEPS = [
    { id:'agencies',   label:'Name your agencies',        sub:'Georgia and Mississippi',              goto:'setup.agencies',   icon:'people' },
    { id:'team',       label:'Invite your team',          sub:'Who gets a login, and what they see',  goto:'setup.team',       icon:'badge' },
    { id:'programmes', label:'Add your waiver programmes',sub:'And the documents each one requires',  goto:'setup.programmes', icon:'doc' },
    { id:'reminders',  label:'Check the reminder timings',sub:'Defaults are sensible — change if not',goto:'set.reminders',    icon:'clock' },
    { id:'clients',    label:'Import your clients',       sub:'From a spreadsheet',                   goto:'clients.import',   icon:'upload' },
    { id:'staff',      label:'Import your caregivers',    sub:'With their licences and training',     goto:'cg.list',          icon:'shield' },
    { id:'auths',      label:'Add authorisations',        sub:'Then the budget tracking starts',      goto:'budget.setup',     icon:'money' }
  ];

  function done(S) { return Math.max(0, Math.min(STEPS.length, S.vars.setupStep || 0)); }

  /* ---------------- first sign-in ---------------- */

  screen('setup.welcome', {
    title: 'Day one — welcome', nav: 'dash',
    crumb: '<b>Welcome</b>',
    render: function (S) {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
          '<span class="eyebrow-m">First sign-in · nothing in the system yet</span>' +
          '<h1>Welcome, Dawn</h1>' +
          '<span class="sub">Your platform is live and completely empty. Here is what happens next.</span>' +
        '</span></div>' +

        '<div class="card"><div class="card-body" style="gap:16px">' +
          '<p style="margin:0">Setting up takes about an hour, and most of it is one spreadsheet. ' +
          'You do it in this order because each step needs the one before it.</p>' +

          '<div class="grid grid-3" style="gap:10px">' +
            miniCard('1', 'Tell it about you', 'Agencies, your team, and the waiver programmes you run') +
            miniCard('2', 'Bring your records in', 'Clients and caregivers, imported from a spreadsheet') +
            miniCard('3', 'Switch the watching on', 'Authorisations and dates — then it starts alerting you') +
          '</div>' +

          UI.banner('info', 'Nothing is lost if you stop halfway',
            'The setup list keeps your place. You can leave it and come back, and the system will keep reminding you what is still missing.') +
        '</div>' +
        '<div class="card-foot"><span class="spacer"></span>' +
          UI.btn('Start setting up', { cls: 'btn--primary btn--lg', icon: 'arrow', goto: 'setup.checklist' }) +
        '</div></div>' +
      '</div>';
    }
  });

  function miniCard(n, title, sub) {
    return '<div class="card" style="padding:15px;box-shadow:none">' +
      '<div class="row" style="gap:9px;margin-bottom:6px">' +
        '<span class="ava-sm ' + (n === '2' ? 'c2' : n === '3' ? 'c3' : '') + '">' + n + '</span>' +
        '<b class="small">' + UI.esc(title) + '</b>' +
      '</div><span class="small muted">' + UI.esc(sub) + '</span></div>';
  }

  /* ---------------- the setup hub ---------------- */

  screen('setup.checklist', {
    title: 'Getting started', nav: 'dash',
    crumb: '<b>Getting started</b>',
    render: function (S) {
      var d = done(S);
      var pc = Math.round((d / STEPS.length) * 100);

      var h = '<div class="page page--narrow">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Setup · ' + d + ' of ' + STEPS.length + ' done</span>' +
        '<h1>Getting started</h1>' +
        '<span class="sub">Work down the list. Each one unlocks the next.</span>' +
        '</span></div>';

      h += '<div class="card"><div class="card-body">' + UI.meter(pc, pc === 100 ? '' : '') +
        '<span class="small muted">' + (d === STEPS.length
          ? 'All done — the system is watching your dates now.'
          : STEPS.length - d + ' steps left. Roughly ' + ((STEPS.length - d) * 8) + ' minutes.') +
        '</span></div></div>';

      h += '<div class="card"><div class="clist">';
      STEPS.forEach(function (st, i) {
        var state = i < d ? 'done' : (i === d ? 'now' : 'later');
        h += '<div class="clist-row"' + (state === 'later' ? '' : ' data-goto="' + st.goto + '"') +
             (state === 'later' ? ' style="opacity:.45"' : '') + '>' +
          '<span class="ava-sm ' + (state === 'done' ? '' : state === 'now' ? 'c2' : 'c4') + '">' +
            (state === 'done' ? '✓' : (i + 1)) + '</span>' +
          '<span style="display:flex;flex-direction:column;min-width:0">' +
            '<span class="cl-n">' + UI.esc(st.label) + '</span>' +
            '<span class="cl-s">' + UI.esc(st.sub) + '</span>' +
          '</span><span class="cl-sp"></span>' +
          (state === 'done' ? UI.badge('Done', 'ok')
            : state === 'now' ? UI.badge('Next', 'plum') + UI.icon('arrow')
            : '<span class="small muted">waiting</span>') +
        '</div>';
      });
      h += '</div></div>';

      if (d < STEPS.length) {
        h += UI.banner('warn', 'Until this is finished, the dashboard has nothing to show you',
          'The system can only warn you about dates it knows about.');
      } else {
        h += UI.banner('ok', 'Setup complete',
          'From here the system watches every date for you and tells you what needs attention.');
      }

      return h + '</div>';
    }
  });

  /* ---------------- step 1 · agencies ---------------- */

  screen('setup.agencies', {
    title: 'Set up · agencies', nav: 'dash',
    crumb: 'Getting started <span>›</span> <b>Agencies</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Step 1 of 7</span><h1>Your agencies</h1>' +
        '<span class="sub">Every record in the system belongs to exactly one of these. They never mix.</span>' +
        '</span></div>' +

        '<div class="card"><div class="card-head"><h3>Agency one</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Name', { value: 'We Care Home Care — Georgia' }) +
          UI.field('Short name', { value: 'Georgia', hint: 'Shown in the header and on reports' }) +
          UI.field('State', { type: 'select', value: 'Georgia' }) +
          UI.field('Logo for PDF exports', { value: 'wechc-georgia.png' }) +
        '</div></div></div>' +

        '<div class="card"><div class="card-head"><h3>Agency two</h3></div><div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Name', { value: 'We Care Home Care — Mississippi' }) +
          UI.field('Short name', { value: 'Mississippi' }) +
          UI.field('State', { type: 'select', value: 'Mississippi' }) +
          UI.field('Logo for PDF exports', { value: 'wechc-mississippi.png' }) +
        '</div></div></div>' +

        UI.banner('info', 'You can add a third later without rebuilding anything',
          'Only you will ever see both at once. Everyone else is locked to the one they work for.') +

        '<div class="card"><div class="card-foot">' + UI.btn('Back', { goto: 'setup.checklist' }) +
        '<span class="spacer"></span>' +
        UI.btn('Save and continue', { cls: 'btn--primary', icon: 'arrow', goto: 'setup.team' }) +
        '</div></div></div>';
    }
  });

  /* ---------------- step 2 · team ---------------- */

  screen('setup.team', {
    title: 'Set up · your team', nav: 'dash',
    crumb: 'Getting started <span>›</span> <b>Your team</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Step 2 of 7</span><h1>Who gets a login</h1>' +
        '<span class="sub">Office and clinical staff only. Caregivers never get accounts.</span>' +
        '</span></div>' +

        '<div class="card"><div class="card-head"><h3>You</h3></div>' +
        '<div class="clist"><div class="clist-row">' +
          '<span class="ava-sm">DB</span>' +
          '<span style="display:flex;flex-direction:column"><span class="cl-n">Dawn Bostock</span>' +
          '<span class="cl-s">dawn.bostock@wecarehomecare.com</span></span>' +
          '<span class="cl-sp"></span>' + UI.badge('Super Admin', 'plum') +
        '</div></div></div>' +

        '<div class="card"><div class="card-head"><h3>Invite the others</h3>' +
        '<span class="spacer"></span>' + UI.btn('Add another', { cls: 'btn--sm', icon: 'plus' }) + '</div>' +
        '<div class="card-body">' +
        '<div class="form-grid">' +
          UI.field('Email', { value: 'renee.alcott@wecarehomecare.com' }) +
          UI.field('Role', { type: 'select', value: 'Admin staff' }) +
          UI.field('Agency', { type: 'select', value: 'Georgia' }) +
          UI.field('Job title', { value: 'Office Manager' }) +
        '</div>' +
        '<div class="form-grid" style="border-top:1px solid var(--border);padding-top:14px">' +
          UI.field('Email', { value: 'yvonne.pryce@wecarehomecare.com' }) +
          UI.field('Role', { type: 'select', value: 'Nurse' }) +
          UI.field('Agency', { type: 'select', value: 'Georgia' }) +
          UI.field('Job title', { value: 'Registered Nurse' }) +
        '</div>' +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>What each role can reach</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Role</th><th>Sees</th><th>Cannot reach</th></tr></thead><tbody>' +
        '<tr data-row><td class="nm">Super Admin</td><td class="small">Everything, both agencies</td><td class="small muted">—</td></tr>' +
        '<tr data-row><td class="nm">Admin staff</td><td class="small">Their own agency</td><td class="small muted">Settings, the other agency</td></tr>' +
        '<tr data-row><td class="nm">Nurse</td><td class="small">Their clients and their own visits</td><td class="small muted">Caregivers, money, quality, settings</td></tr>' +
        '</tbody></table></div></div>' +

        '<div class="card"><div class="card-foot">' + UI.btn('Back', { goto: 'setup.agencies' }) +
        '<span class="spacer"></span>' +
        UI.btn('Send the invitations', { cls: 'btn--primary', icon: 'arrow', goto: 'setup.programmes' }) +
        '</div></div></div>';
    }
  });

  /* ---------------- step 3 · programmes ---------------- */

  screen('setup.programmes', {
    title: 'Set up · waiver programmes', nav: 'dash',
    crumb: 'Getting started <span>›</span> <b>Programmes</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Step 3 of 7</span><h1>Your waiver programmes</h1>' +
        '<span class="sub">And the documents each one requires. This is the list you already keep on paper.</span>' +
        '</span></div>' +

        UI.banner('info', 'This is the one part only you can do',
          'Every programme has its own required paperwork, and the rules differ by state. Give the system your lists once and it will chase the missing documents forever.') +

        '<div class="card"><div class="card-head"><h3>Programmes</h3>' +
        '<span class="spacer"></span>' + UI.btn('Add a programme', { cls: 'btn--sm', icon: 'plus' }) + '</div>' +
        '<div class="clist">' +
          prog('NOW', 'Georgia', '9 documents') +
          prog('COMP', 'Georgia', '9 documents') +
          prog('IDD Community Supports', 'Mississippi', 'not set up yet') +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>NOW · required documents</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Document</th><th>Expires?</th><th>Renew every</th><th>Required</th></tr></thead><tbody>' +
        doc('Signed service agreement', 'Yes', '12 months') +
        doc('Prior authorisation letter', 'Yes', 'per authorisation') +
        doc('Individual Service Plan (ISP)', 'Yes', '12 months') +
        doc('Physician order for services', 'Yes', '12 months') +
        doc('Annual health assessment', 'Yes', '12 months') +
        doc('Freedom of choice form', 'No', '—') +
        doc('Rights and responsibilities', 'No', '—') +
        doc('Emergency contact form', 'No', '—') +
        '</tbody></table></div>' +
        '<div class="card-foot">' + UI.btn('Add a document', { cls: 'btn--sm', icon: 'plus' }) +
        '<span class="spacer"></span><span class="small muted">Change these any time — new rules, new list.</span></div></div>' +

        '<div class="card"><div class="card-foot">' + UI.btn('Back', { goto: 'setup.team' }) +
        '<span class="spacer"></span>' +
        UI.btn('Save and continue', { cls: 'btn--primary', icon: 'arrow', goto: 'set.reminders' }) +
        '</div></div></div>';
    }
  });

  function prog(name, state, docs) {
    return '<div class="clist-row"><span class="ava-sm ' + (state === 'Mississippi' ? 'c2' : '') + '">' +
      UI.esc(state.slice(0, 2).toUpperCase()) + '</span>' +
      '<span style="display:flex;flex-direction:column"><span class="cl-n">' + UI.esc(name) + '</span>' +
      '<span class="cl-s">' + UI.esc(state) + '</span></span><span class="cl-sp"></span>' +
      (docs.indexOf('not') === 0 ? UI.badge('Needs setting up', 'warn') : '<span class="small muted">' + docs + '</span>') +
      UI.icon('arrow') + '</div>';
  }

  function doc(name, exp, period) {
    return '<tr data-row><td class="nm">' + name + '</td><td class="small">' + exp + '</td>' +
      '<td class="small mono">' + period + '</td><td>' + UI.badge('Required', 'plum') + '</td></tr>';
  }

  /* ---------------- the empty dashboard ---------------- */

  screen('setup.dash', {
    title: 'Dashboard — day one', nav: 'dash',
    crumb: '<b>Dashboard</b>',
    render: function (S) {
      var d = done(S);
      var h = '<div class="page">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Georgia · your first day</span>' +
        '<h1>Good morning, Dawn</h1>' +
        '<span class="sub">Nothing to report yet — the system has no dates to watch.</span>' +
        '</span></div>';

      h += '<div class="grid grid-4">' +
        UI.stat({ k: 'Overdue tasks',  v: '—', n: 'no tasks yet' }) +
        UI.stat({ k: 'Budget alerts',  v: '—', n: 'no authorisations yet' }) +
        UI.stat({ k: 'Open incidents', v: '—', n: 'nothing recorded' }) +
        UI.stat({ k: 'Reviews due',    v: '—', n: 'no clients yet' }) +
      '</div>';

      h += UI.emptyModule({
        icon: 'plus',
        title: 'Your dashboard fills itself in',
        body: 'Once your clients, staff and authorisations are in, every date the system knows about shows up here on the day it needs attention.',
        actions: [{ label: 'Continue setting up · ' + d + ' of 7 done', primary: true, icon: 'arrow', goto: 'setup.checklist' }],
        note: 'Nothing here is typed twice. The dashboard is built entirely from records you have already entered.'
      });

      return h + '</div>';
    }
  });

  /* ---------------- setup finished ---------------- */

  screen('setup.done', {
    title: 'Setup complete', nav: 'dash',
    crumb: '<b>Getting started</b>',
    render: function () {
      return '<div class="page page--narrow">' +
        '<div class="card"><div class="card-body" style="align-items:center;text-align:center;padding:52px 24px;gap:14px">' +
        '<span style="width:60px;height:60px;border-radius:50%;background:var(--gr-50);color:var(--gr-500);display:grid;place-items:center">' +
        UI.icon('check', 'ei') + '</span>' +
        '<h1 style="margin:0;font-size:25px;font-weight:650">You are set up</h1>' +
        '<p class="muted" style="max-width:48ch">38 clients, 12 caregivers and their authorisations are in. ' +
        'From tomorrow morning the dashboard will start telling you what needs attention.</p>' +
        '<div class="row" style="justify-content:center;margin-top:6px">' +
          UI.btn('Go to the dashboard', { cls: 'btn--primary', icon: 'arrow', goto: 'dash.home' }) +
        '</div></div></div>' +

        '<div class="card"><div class="card-head"><h3>What happens from now on, without you asking</h3></div>' +
        '<div class="card-body"><div class="tl">' +
          UI.tlItem('ok', 'Every night it checks every date', 'agreements, authorisations, licences, reviews, training') +
          UI.tlItem('ok', 'Anything due soon appears on the dashboard', 'and an email goes to whoever owns it') +
          UI.tlItem('ok', 'Anything overdue turns red and starts chasing', 'and escalates to a manager if ignored') +
          UI.tlItem('ok', 'Patterns raise themselves', 'three incidents in a month opens a quality item on its own') +
          UI.tlItem('ok', 'Every change is written to the audit trail', 'who did what, and when') +
        '</div></div></div>' +
      '</div>';
    }
  });

})();
