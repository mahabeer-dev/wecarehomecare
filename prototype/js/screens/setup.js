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
    { id:'staff',      label:'Import your caregivers',    sub:'Their details — roles come after',      goto:'cg.import',        icon:'shield' },
    { id:'auths',      label:'Add authorisations',        sub:'Then the budget tracking starts',      goto:'budget.setup',     icon:'money' }
  ];

  function done() { return Math.max(0, Math.min(STEPS.length, DB.setupStep())); }

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
      var d = done();
      var pc = Math.round((d / STEPS.length) * 100);

      var h = '<div class="page page--narrow">';
      h += '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Setup · ' + d + ' of ' + STEPS.length + ' done</span>' +
        '<h1>Getting started</h1>' +
        '<span class="sub">Work down the list. Each one unlocks the next.</span>' +
        '</span></div>';

      h += '<div class="card"><div class="card-body">' + UI.progress(pc) +
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
    crumb: 'Getting started <span>&rsaquo;</span> <b>Agencies</b>',
    render: function (S) {
      var mine = DB.all('agencies');

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Step 1 of 7</span><h1>Your agencies</h1>' +
        '<span class="sub">Add one for each company you run. Every record in the system ' +
        'belongs to exactly one of them, and they never mix.</span>' +
        '</span></div>';

      /* what has been created so far */
      h += '<div class="card"><div class="card-head"><h3>Agencies you have added</h3>' +
        '<span class="spacer"></span>' +
        (mine.length ? UI.badge(mine.length + (mine.length === 1 ? ' agency' : ' agencies'), 'ok')
                     : UI.badge('None yet', 'warn')) + '</div>';

      if (mine.length) {
        h += '<div class="clist">';
        mine.forEach(function (a) {
          h += '<div class="clist-row" style="cursor:default">' +
            '<span class="ava-sm">' + UI.esc(a.abbr) + '</span>' +
            '<span style="display:flex;flex-direction:column;min-width:0">' +
              '<span class="cl-n">' + UI.esc(a.name) + '</span>' +
              '<span class="cl-s">' + UI.esc(a.short) + (a.state ? ' · ' + UI.esc(a.state) : '') + '</span>' +
            '</span><span class="cl-sp"></span>' +
            '<button class="btn btn--sm btn--ghost" data-do="agency.remove" data-id="' + UI.esc(a.id) + '">Remove</button>' +
          '</div>';
        });
        h += '</div>';
      } else {
        h += '<div class="card-body"><div class="empty" style="padding:26px 18px">' +
          UI.icon('people', 'ei') + '<b>Nothing added yet</b>' +
          '<span>Fill in the form below and press Add.</span></div></div>';
      }
      h += '</div>';

      /* the form */
      h += '<div class="card"><div class="card-head"><h3>Add an agency</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Full name', { id:'ag-name', span:true, value:'',
            placeholder:'We Care Home Care — Georgia',
            hint:'How it appears on reports and PDF exports' }) +
          UI.field('Short name', { id:'ag-short', value:'', placeholder:'Georgia',
            hint:'Shown in the header switcher' }) +
          UI.field('State', { id:'ag-state', value:'', placeholder:'Georgia' }) +
          UI.field('Initials', { id:'ag-abbr', value:'', placeholder:'GA',
            hint:'Two letters, used on the small badges' }) +
        '</div>' +
        '<div class="row"><span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="agency.add">' + UI.icon('plus') + 'Add this agency</button>' +
        '</div></div></div>';

      h += UI.banner('info', 'Add as many as you run',
        'Two to begin with is typical, but there is no limit and a new one can be added later ' +
        'without touching anything that already exists.');

      h += '<div class="card"><div class="card-foot">' +
        UI.btn('Back', { goto: 'dash.home' }) + '<span class="spacer"></span>' +
        (mine.length
          ? '<button class="btn btn--primary" data-do="setup.agencies" data-goto="setup.team">' +
            UI.icon('arrow') + 'Continue with ' + mine.length + ' agenc' + (mine.length === 1 ? 'y' : 'ies') + '</button>'
          : '<button class="btn" disabled>Add one first</button>') +
        '</div></div>';

      return h + '</div>';
    }
  });

  /* ---------------- step 2 · team ---------------- */

  screen('setup.team', {
    title: 'Set up · your team', nav: 'dash',
    crumb: 'Getting started <span>&rsaquo;</span> <b>Your team</b>',
    render: function (S) {
      var users = DB.all('users');
      var me = users.filter(function (u) { return u.role === 'superadmin'; })[0] || users[0];
      var others = users.filter(function (u) { return u !== me; });
      var agencies = DB.all('agencies');

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Step 2 of 7</span><h1>Who gets a login</h1>' +
        '<span class="sub">Office and clinical staff only. Caregivers never get accounts — ' +
        'they exist as compliance records instead.</span>' +
        '</span></div>';

      /* you */
      if (me) {
        h += '<div class="card"><div class="card-head"><h3>You</h3></div>' +
          '<div class="clist"><div class="clist-row" style="cursor:default">' +
            '<span class="ava-sm">' + UI.esc(UI.initials(me.name)) + '</span>' +
            '<span style="display:flex;flex-direction:column;min-width:0">' +
              '<span class="cl-n">' + UI.esc(me.name) + '</span>' +
              '<span class="cl-s">' + UI.esc(me.email) + '</span></span>' +
            '<span class="cl-sp"></span>' + UI.badge('Super Admin', 'plum') +
          '</div></div></div>';
      }

      /* everyone added so far */
      h += '<div class="card"><div class="card-head"><h3>Accounts you have created</h3>' +
        '<span class="spacer"></span>' +
        (others.length ? UI.badge(others.length + (others.length === 1 ? ' account' : ' accounts'), 'ok')
                       : UI.badge('None yet', 'warn')) + '</div>';

      if (others.length) {
        h += '<div class="clist">';
        others.forEach(function (u) {
          h += '<div class="clist-row" style="cursor:default">' +
            '<span class="ava-sm ' + (u.role === 'nurse' ? 'c3' : 'c2') + '">' +
              UI.esc(UI.initials(u.name)) + '</span>' +
            '<span style="display:flex;flex-direction:column;min-width:0">' +
              '<span class="cl-n">' + UI.esc(u.name) + '</span>' +
              '<span class="cl-s">' + UI.esc(u.email) +
                (u.title ? ' · ' + UI.esc(u.title) : '') + '</span>' +
            '</span><span class="cl-sp"></span>' +
            UI.badge(DATA.ROLE_LABEL[u.role] || u.role, u.role === 'nurse' ? 'info' : 'neutral') +
            '<span class="small muted nowrap" style="margin:0 8px">' +
              UI.esc(u.agency ? DATA.agencyShort(u.agency) : 'all') + '</span>' +
            '<button class="btn btn--sm btn--ghost" data-do="user.remove" data-id="' + UI.esc(u.id) + '">Remove</button>' +
          '</div>';
        });
        h += '</div>';
      } else {
        h += '<div class="card-body"><div class="empty" style="padding:26px 18px">' +
          UI.icon('badge', 'ei') + '<b>No other accounts yet</b>' +
          '<span>You are the only person who can sign in. Add your staff below.</span></div></div>';
      }
      h += '</div>';

      /* the form */
      h += '<div class="card"><div class="card-head"><h3>Add someone</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Full name', { id:'u-name', value:'', placeholder:'Renee Alcott' }) +
          UI.field('Work email', { id:'u-email', type:'email', value:'', placeholder:'renee.alcott@wecarehomecare.com' }) +
          UI.field('Role', { id:'u-role', type:'select', value:'admin', options:[
            { value:'admin', label:'Admin staff — their agency, no settings' },
            { value:'nurse', label:'Nurse — their clients and own visits' },
            { value:'superadmin', label:'Super Admin — everything, both agencies' }
          ]}) +
          UI.field('Agency', { id:'u-agency', type:'select',
            value: (agencies[0] || {}).id || '',
            options: agencies.length
              ? agencies.map(function (a) { return { value:a.id, label:a.short }; })
              : [{ value:'', label:'no agencies yet' }] }) +
          UI.field('Job title', { id:'u-title', value:'', placeholder:'Office Manager' }) +
          UI.field('Set their password', { id:'u-pass', value:'', placeholder:'at least 6 characters',
            hint:'You set it now and tell them. They can change it once they are in.' }) +
        '</div>' +
        '<div class="row"><span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="user.add">' + UI.icon('plus') + 'Create this account</button>' +
        '</div></div></div>';

      h += UI.banner('info', 'Add as many as you need',
        'There is no limit. Anyone you create here can sign in immediately with the password you set. ' +
        'The 150 caregivers do not appear on this screen at all.');

      /* what each role reaches */
      h += '<div class="card"><div class="card-head"><h3>What each role can reach</h3></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>Role</th><th>Sees</th><th>Cannot reach</th></tr></thead><tbody>' +
        '<tr data-row><td class="nm">Super Admin</td><td class="small">Everything, every agency</td>' +
        '<td class="small muted">—</td></tr>' +
        '<tr data-row><td class="nm">Admin staff</td><td class="small">Their own agency</td>' +
        '<td class="small muted">Settings, other agencies</td></tr>' +
        '<tr data-row><td class="nm">Nurse</td><td class="small">Their clients and their own visits</td>' +
        '<td class="small muted">Caregivers, money, quality, settings</td></tr>' +
        '</tbody></table></div></div>';

      h += '<div class="card"><div class="card-foot">' +
        UI.btn('Back', { goto: 'setup.agencies' }) + '<span class="spacer"></span>' +
        '<button class="btn btn--primary" data-do="setup.team" data-goto="setup.programmes">' +
          UI.icon('arrow') + (others.length ? 'Continue' : 'Continue on my own') + '</button>' +
        '</div></div>';

      return h + '</div>';
    }
  });

  /* ---------------- step 3 · programmes ---------------- */

  screen('setup.programmes', {
    title: 'Set up · waiver programmes', nav: 'dash',
    crumb: 'Getting started <span>&rsaquo;</span> <b>Programmes</b>',
    render: function (S) {
      var progs = DB.all('programmes');
      var agencies = DB.all('agencies');
      var sel = DB.get('programmes', S.vars.progId) || progs[0] || null;

      var h = '<div class="page page--narrow">' +
        '<div class="page-head"><span class="ph-txt">' +
        '<span class="eyebrow-m">Step 3 of 7</span><h1>Your waiver programmes</h1>' +
        '<span class="sub">And the documents each one requires. This is the list you already ' +
        'keep on paper — and the only part of setup nobody can do for you.</span>' +
        '</span></div>';

      h += UI.banner('info', 'One is filled in as an example',
        'NOW is here already so you can see the shape. Add the others yourself — COMP, and ' +
        'whatever Mississippi runs. Give the system your lists once and it chases the missing ' +
        'documents forever.');

      /* the programmes */
      h += '<div class="card"><div class="card-head"><h3>Programmes</h3>' +
        '<span class="spacer"></span>' +
        UI.badge(progs.length + (progs.length === 1 ? ' programme' : ' programmes'), progs.length > 1 ? 'ok' : 'warn') +
        '</div><div class="clist">';

      progs.forEach(function (p) {
        var on = sel && p.id === sel.id;
        h += '<div class="clist-row" data-do="prog.select" data-id="' + UI.esc(p.id) + '"' +
             (on ? ' style="background:var(--p-50)"' : '') + '>' +
          '<span class="ava-sm ' + (p.agency && agencies[1] && p.agency === agencies[1].id ? 'c2' : '') + '">' +
            UI.esc((p.agency ? DATA.agencyShort(p.agency) : '?').slice(0, 2).toUpperCase()) + '</span>' +
          '<span style="display:flex;flex-direction:column;min-width:0">' +
            '<span class="cl-n">' + UI.esc(p.name) + (p.seeded ? ' ' + UI.badge('Example', 'plum') : '') + '</span>' +
            '<span class="cl-s">' + UI.esc(p.fullName || '') +
              (p.agency ? (p.fullName ? ' · ' : '') + UI.esc(DATA.agencyShort(p.agency)) : '') + '</span>' +
          '</span><span class="cl-sp"></span>' +
          '<span class="small muted nowrap">' + (p.docs || []).length + ' document' +
            ((p.docs || []).length === 1 ? '' : 's') + '</span>' +
          (on ? UI.badge('Editing', 'info') : '') +
          '<button class="btn btn--sm btn--ghost" data-do="prog.remove" data-id="' + UI.esc(p.id) + '">Remove</button>' +
        '</div>';
      });

      if (!progs.length) {
        h += '<div class="card-body"><div class="empty" style="padding:24px 18px">' +
          UI.icon('doc', 'ei') + '<b>No programmes</b>' +
          '<span>Add the first one below.</span></div></div>';
      }
      h += '</div></div>';

      /* add a programme */
      h += '<div class="card"><div class="card-head"><h3>Add a programme</h3></div>' +
        '<div class="card-body"><div class="form-grid">' +
          UI.field('Short name', { id:'p-name', value:'', placeholder:'COMP',
            hint:'What your staff call it' }) +
          UI.field('Full name', { id:'p-full', value:'', placeholder:'Comprehensive Supports Waiver' }) +
          UI.field('Agency', { id:'p-agency', type:'select',
            value:(agencies[0] || {}).id || '',
            options: agencies.length
              ? agencies.map(function (a) { return { value:a.id, label:a.short }; })
              : [{ value:'', label:'no agencies yet' }] }) +
          UI.field('Start from', { id:'p-copy', type:'select', value:'',
            options: [{ value:'', label:'An empty list' }].concat(
              progs.map(function (p) { return { value:p.id, label:'A copy of ' + p.name }; })) ,
            hint:'Most programmes share a lot of paperwork' }) +
        '</div>' +
        '<div class="row"><span class="spacer"></span>' +
          '<button class="btn btn--primary" data-do="prog.add">' + UI.icon('plus') + 'Add this programme</button>' +
        '</div></div></div>';

      /* the selected programme's documents */
      if (sel) {
        h += '<div class="card"><div class="card-head"><h3>' + UI.esc(sel.name) + ' · required documents</h3>' +
          '<span class="spacer"></span><span class="sub">' + (sel.docs || []).length + ' listed</span></div>';

        if ((sel.docs || []).length) {
          h += '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
            '<th>Document</th><th>Expires?</th><th>Renew every</th><th>Required</th><th></th>' +
            '</tr></thead><tbody>';
          sel.docs.forEach(function (d, i) {
            h += '<tr data-row><td class="nm">' + UI.esc(d.name) + '</td>' +
              '<td class="small">' + (d.expires ? 'Yes' : 'No') + '</td>' +
              '<td class="small mono">' + UI.esc(d.period || '—') + '</td>' +
              '<td>' + (d.required ? UI.badge('Required', 'plum') : UI.badge('Optional', 'neutral')) + '</td>' +
              '<td class="right"><button class="btn btn--sm btn--ghost" data-do="doc.remove" ' +
                'data-id="' + UI.esc(sel.id) + '" data-i="' + i + '">Remove</button></td></tr>';
          });
          h += '</tbody></table></div>';
        } else {
          h += '<div class="card-body"><div class="empty" style="padding:22px 18px">' +
            UI.icon('doc', 'ei') + '<b>No documents listed yet</b>' +
            '<span>Add what this programme requires.</span></div></div>';
        }

        h += '<div class="card-body" style="border-top:1px solid var(--border)">' +
          '<div class="form-grid">' +
            UI.field('Document name', { id:'d-name', span:true, value:'',
              placeholder:'Behaviour support plan' }) +
            UI.field('Does it expire?', { id:'d-expires', type:'select', value:'yes',
              options:[{ value:'yes', label:'Yes — track a renewal date' },
                       { value:'no',  label:'No — once it is on file it stays' }] }) +
            UI.field('Renew every', { id:'d-period', value:'', placeholder:'12 months' }) +
            UI.field('Required?', { id:'d-required', type:'select', value:'yes',
              options:[{ value:'yes', label:'Required — flag the file if missing' },
                       { value:'no',  label:'Optional' }] }) +
          '</div>' +
          '<div class="row"><span class="spacer"></span>' +
            '<button class="btn btn--primary" data-do="doc.add" data-id="' + UI.esc(sel.id) + '">' +
            UI.icon('plus') + 'Add to ' + UI.esc(sel.name) + '</button>' +
          '</div></div></div>';
      }

      h += '<div class="card"><div class="card-foot">' +
        UI.btn('Back', { goto: 'setup.team' }) + '<span class="spacer"></span>' +
        (progs.length
          ? '<button class="btn btn--primary" data-do="setup.programmes" data-goto="set.reminders">' +
            UI.icon('arrow') + 'Continue with ' + progs.length + ' programme' + (progs.length === 1 ? '' : 's') + '</button>'
          : '<button class="btn" disabled>Add one first</button>') +
        '</div></div>';

      return h + '</div>';
    }
  });

  /* ---------------- the empty dashboard ---------------- */

  screen('setup.dash', {
    title: 'Dashboard — day one', nav: 'dash',
    crumb: '<b>Dashboard</b>',
    render: function (S) {
      var d = done();
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
