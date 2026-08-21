/* ============================================================
   App core — screen registry, router, step machine, demo chrome.
   Plain globals, no modules: this must run from file://
   ============================================================ */

var SCREENS = {};
var FLOWS = {};

function screen(id, def) { SCREENS[id] = def; }

var APP = (function () {

  var S = {
    role: 'admin',
    agency: 'ga',
    screen: 'auth.login',
    flow: null,
    step: 0,
    vars: {},
    overlay: false,
    toasts: []
  };

  var DEFAULTS = { role: 'admin', agency: null, screen: 'auth.login', flow: null, step: 0 };

  /* ---------------- state ---------------- */

  function state() { return S; }

  function user() {
    var signedIn = S.vars.loginAs && DB.get('users', S.vars.loginAs);
    if (signedIn) return signedIn;
    var byRole = DB.all('users').filter(function (u) { return u.role === S.role; })[0];
    return byRole || DB.all('users')[0] || { name: '—', initials: '—', role: S.role };
  }


  function agency() {
    var m = DATA.AGENCIES;
    return m[S.agency] || m[Object.keys(m)[0]] || { id: null, name: '—', short: '—', abbr: '—' };
  }

  function reset() {
    S.role = DEFAULTS.role;
    S.agency = DEFAULTS.agency || (DB.all('agencies')[0] || {}).id || null;
    S.screen = DEFAULTS.screen;
    S.flow = null;
    S.step = 0;
    S.vars = {};
    S.overlay = false;
    S.toasts = [];
    S.vars.setupStep = DB.setupStep();
    render();
  }

  /* Where you were last time, if the records still support it. */
  function restoreSession() {
    var sess = DB.session();
    if (!sess) return;
    if (sess.loginAs && !DB.get('users', sess.loginAs)) return;   /* that account is gone */

    if (sess.loginAs) S.vars.loginAs = sess.loginAs;
    if (sess.role) S.role = sess.role;
    if (sess.agency && DB.get('agencies', sess.agency)) S.agency = sess.agency;
    if (sess.screen && SCREENS[sess.screen] && !SCREENS[sess.screen].auto) S.screen = sess.screen;
    if (sess.clientId) S.vars.clientId = sess.clientId;
    if (sess.cgId) S.vars.cgId = sess.cgId;
    if (sess.incId) S.vars.incId = sess.incId;
  }

  /* Remembered on every render, so a refresh lands where you left off. A
     scripted flow is not remembered — that is a demo, not a place. */
  function rememberSession() {
    if (S.flow) return;
    if (String(S.screen).indexOf('auth.') === 0) return;
    DB.setSession({
      loginAs: S.vars.loginAs || null,
      role: S.role, agency: S.agency, screen: S.screen,
      clientId: S.vars.clientId || null,
      cgId: S.vars.cgId || null,
      incId: S.vars.incId || null
    });
  }

  /* Sign-in succeeded: become whoever was picked on the login screen. */
  function applyAccount() {
    var u = DB.get('users', S.vars.loginAs) || DB.all('users')[0];
    if (!u) return;
    S.vars.loginAs = u.id;
    S.role = u.role;
    S.agency = u.agency || (DB.all('agencies')[0] || {}).id || null;
  }


  /* ---------------- navigation ---------------- */

  function go(id, opts) {
    if (!SCREENS[id]) {
      toast('bad', 'Screen not built yet', id);
      return;
    }
    S.screen = id;
    if (!opts || !opts.keepFlow) {
      // leaving a flow by free navigation drops the script
      var f = S.flow && FLOWS[S.flow];
      if (f && f.steps[S.step] && f.steps[S.step].screen !== id) S.flow = null;
    }
    window.scrollTo(0, 0);
    render();
  }

  function startFlow(id, silent) {
    var f = FLOWS[id];
    if (!f) return;
    S.flow = id;
    S.step = 0;
    applyStep(f.steps[0]);
    if (!silent) toast('info', f.title, 'Use the Next button to walk through it.');
    window.scrollTo(0, 0);
    render();
  }

  function applyStep(st) {
    if (!st) return;
    if (st.role) S.role = st.role;
    if (st.agency) S.agency = st.agency;
    if (st.data === 'demo' && DB.isFresh()) DB.loadDemo();
    if (st.data === 'fresh') DB.startAgain();
    if (st.setupStep !== undefined) { DB.setupStep(st.setupStep); S.vars.setupStep = st.setupStep; }
    if (st.patch) for (var k in st.patch) S.vars[k] = st.patch[k];
    if (st.toast) toast(st.toast.kind || 'info', st.toast.title, st.toast.body);
    S.screen = st.screen;
  }

  function next() {
    var f = S.flow && FLOWS[S.flow];

    /* if the screen reacts to what was typed, honour that over the script */
    var def = SCREENS[S.screen];
    if (def && def.intercept) {
      var chosen = def.intercept(S, null);
      if (chosen === 'auth.loading') applyAccount();
      if (chosen && SCREENS[chosen]) {
        if (f && jumpFlowTo(chosen)) { window.scrollTo(0, 0); render(); return; }
        if (!f) { go(chosen); return; }
      }
    }

    /* free navigation — follow the forward chain */
    if (!f) {
      var fwd = forwardFrom(S.screen);
      if (fwd) go(fwd);
      return;
    }

    if (S.step >= f.steps.length - 1) {
      toast('ok', 'End of “' + f.title + '”', 'Pick another flow from the bar below.');
      return;
    }
    S.step += 1;
    applyStep(f.steps[S.step]);
    window.scrollTo(0, 0);
    render();
  }

  /* advance if in a flow, otherwise follow an explicit target */
  function advance(target) {
    if (S.flow) { next(); return; }
    if (target) go(target);
  }

  /* Move the running flow to the next step showing `screenId`, skipping any
     steps in between. Used when a screen decides its own destination — e.g.
     typing the right password skips the "wrong password" step. */
  function jumpFlowTo(screenId) {
    var f = S.flow && FLOWS[S.flow];
    if (!f) return false;
    for (var i = S.step + 1; i < f.steps.length; i++) {
      if (f.steps[i].screen === screenId) {
        S.step = i;
        applyStep(f.steps[i]);
        return true;
      }
    }
    return false;
  }

  function toast(kind, title, body) {
    S.toasts.push({ kind: kind, title: title, body: body || '', id: Math.random() });
    if (S.toasts.length > 3) S.toasts.shift();
    var mine = S.toasts[S.toasts.length - 1];
    setTimeout(function () {
      var i = S.toasts.indexOf(mine);
      if (i > -1) { S.toasts.splice(i, 1); paintToasts(); }
    }, 5200);
  }

  /* ---------------- rendering ---------------- */

  function currentDef() { return SCREENS[S.screen] || SCREENS['auth.login']; }

  var autoTimer = null;

  function render() {
    /* You cannot be signed in as a role that has no account — after a wipe,
       fall back to whoever actually exists. */
    var roles = {};
    DB.all('users').forEach(function (u) { roles[u.role] = true; });
    if (S.vars.loginAs && !DB.get('users', S.vars.loginAs)) S.vars.loginAs = null;
    if (!roles[S.role]) {
      S.role = DB.all('users').length ? DB.all('users')[0].role : 'superadmin';
      S.vars.loginAs = null;
    }
    if (S.agency && !DATA.AGENCIES[S.agency]) S.agency = (DB.all('agencies')[0] || {}).id || null;
    if (!S.agency && DB.all('agencies').length) S.agency = DB.all('agencies')[0].id;

    var def = currentDef();
    rememberSession();

    /* loading screens move on by themselves, like real ones */
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (def.auto) {
      var here = S.screen;
      autoTimer = setTimeout(function () {
        if (S.screen === here) next();
      }, def.autoMs || 1200);
    }
    var body = def.render ? def.render(S) : '<div class="page">Missing render()</div>';

    var html = '';
    if (def.chrome === false) {
      html = body;
    } else {
      html = '<div class="shell">' + sidebar(def) + '<div class="main">' + topbar(def) + body + '</div></div>';
    }

    document.getElementById('app').innerHTML = html;
    paintChrome();
    paintToasts();
    paintOverlay();
  }

  /* ---------------- sidebar ---------------- */

  var NAV = [
    { group: 'Oversight' },
    { id: 'dash',      label: 'Dashboard',       icon: 'dash',   screen: 'dash.home' },
    { id: 'tasks',     label: 'Tasks',           icon: 'check',  screen: 'tasks.list',   badge: 'tasksOverdue' },
    { id: 'calendar',  label: 'Calendar',        icon: 'cal',    screen: 'cal.mine' },
    { group: 'Records' },
    { id: 'clients',   label: 'Clients',         icon: 'people', screen: 'clients.list' },
    { id: 'caregivers',label: 'Caregivers',      icon: 'badge',  screen: 'cg.list',      badge: 'cgExpiring' },
    { group: 'Compliance' },
    { id: 'budget',    label: 'Authorisations',  icon: 'money',  screen: 'budget.list',  badge: 'budgetAlerts' },
    { id: 'incidents', label: 'Incidents',       icon: 'warn',   screen: 'inc.list',     badge: 'incOpen' },
    { id: 'hosp',      label: 'Hospitalisations',icon: 'hosp',   screen: 'hosp.list' },
    { id: 'qi',        label: 'Quality',         icon: 'star',   screen: 'qi.list' },
    { id: 'isp',       label: 'ISP progress',    icon: 'chart',  screen: 'isp.list' },
    { id: 'oversight', label: 'Reviews',         icon: 'shield', screen: 'ov.list',      badge: 'ovDue' },
    { group: 'Output' },
    { id: 'reports',   label: 'Reports',         icon: 'doc',    screen: 'rep.builder' },
    { id: 'audit',     label: 'Audit trail',     icon: 'lock',   screen: 'sys.audit',    roles: ['superadmin', 'admin'] },
    { id: 'settings',  label: 'Settings',        icon: 'cog',    screen: 'set.users',    roles: ['superadmin'] }
  ];

  /* matches the permission matrix on set.users */
  var NURSE_ALLOWED = ['dash', 'tasks', 'calendar', 'clients', 'incidents', 'hosp', 'oversight', 'isp', 'reports'];

  function counts() {
    /* Always scoped to the agency currently being viewed. A Super Admin
       switching in the header should see that agency's numbers, not both
       added together. */
    var ag = S.agency;
    var t = DATA.inAgency(DATA.TASKS, ag).filter(function (x) { return x.status === 'Overdue'; }).length;
    var cg = DATA.inAgency(DATA.CAREGIVERS, ag).filter(function (x) { return x.worst !== 'ok'; }).length;
    var inc = DATA.inAgency(DATA.INCIDENTS, ag).filter(function (x) { return x.status !== 'Closed'; }).length;
    var ov = DATA.inAgency(DATA.OVERSIGHT, ag).filter(function (x) { return x.status === 'Overdue' || x.status === 'Due soon'; }).length;
    var b = 0;
    DATA.inAgency(DATA.AUTHS, ag).forEach(function (a) {
      if (DATA.authCalc(a).pc >= 75) b++;
    });
    return { tasksOverdue: t, cgExpiring: cg, incOpen: inc, ovDue: ov, budgetAlerts: b };
  }

  function sidebar(def) {
    var c = counts();
    var u = user();
    var h = '<aside class="sidebar"><div class="brandmark">' +
      '<img src="assets/logo.svg" width="34" height="34" alt="">' +
      '<span class="bm-txt"><span class="bm-1">We Care Home Care</span>' +
      '<span class="bm-2">Operations</span></span></div>';

    for (var i = 0; i < NAV.length; i++) {
      var n = NAV[i];
      if (n.group) { h += '<div class="nav-label">' + n.group + '</div>'; continue; }
      if (n.roles && n.roles.indexOf(S.role) === -1) continue;
      var blocked = (S.role === 'nurse' && NURSE_ALLOWED.indexOf(n.id) === -1);
      var active = def.nav === n.id;
      var cnt = n.badge ? c[n.badge] : 0;
      h += '<button class="nav-item' + (active ? ' is-active' : '') + '"' +
           (blocked ? ' disabled title="Nurses do not have access to this area"' : ' data-goto="' + n.screen + '"') + '>' +
           UI.icon(n.icon) + '<span>' + n.label + '</span>' +
           (cnt ? '<span class="pill">' + cnt + '</span>' : '') +
           '</button>';
    }

    h += '<div class="nav-foot">' +
         '<span class="who">' + UI.esc(u.name) + '</span>' +
         '<span class="whorole">' + DATA.ROLE_LABEL[S.role] +
         (S.role === 'superadmin' ? ' · both agencies' : ' · ' + agency().short) + '</span>' +
         '<button class="nav-item" data-signout style="margin-top:8px;padding:6px 9px">' +
           UI.icon('reset') + '<span>Sign out</span>' +
         '</button></div>';

    return h + '</aside>';
  }

  function topbar(def) {
    var h = '<header class="topbar">';
    h += '<span class="crumb">' + (def.crumb || '<b>' + UI.esc(def.title || '') + '</b>') + '</span>';
    h += '<span class="topbar-spacer"></span>';

    if (S.role === 'superadmin' && Object.keys(DATA.AGENCIES).length > 1) {
      h += '<div class="agency-switch">' +
        '<button data-agency="ga" class="' + (S.agency === 'ga' ? 'on' : '') + '">Georgia</button>' +
        '<button data-agency="ms" class="' + (S.agency === 'ms' ? 'on' : '') + '">Mississippi</button>' +
      '</div>';
    }

    h += '<div class="searchbox">' + UI.icon('search') + 'Search clients, staff, records</div>';
    h += '<button class="btn btn--ghost btn--sm">' + UI.icon('bell') + '</button>';
    h += '<div class="avatar">' + UI.esc(user().initials) + '</div>';
    return h + '</header>';
  }

  /* ---------------- demo chrome ---------------- */

  function paintChrome() {
    var f = S.flow && FLOWS[S.flow];
    var nextLabel = '', atEnd = false;
    if (f) {
      if (S.step < f.steps.length - 1) nextLabel = 'Next: ' + f.steps[S.step + 1].label;
      else { nextLabel = 'End of this flow'; atEnd = true; }
    } else {
      var fwd = forwardFrom(S.screen);
      if (fwd) nextLabel = 'Next: ' + (SCREENS[fwd].title || fwd);
      else { nextLabel = 'Pick a flow to start'; atEnd = true; }
    }

    var opts = '<option value="">— free navigation —</option>';
    for (var k in FLOWS) {
      opts += '<option value="' + k + '"' + (S.flow === k ? ' selected' : '') + '>' + UI.esc(FLOWS[k].title) + '</option>';
    }

    var roleOpts = '';
    ['superadmin', 'admin', 'nurse'].forEach(function (r) {
      roleOpts += '<option value="' + r + '"' + (S.role === r ? ' selected' : '') + '>' + DATA.ROLE_LABEL[r] + '</option>';
    });

    var h =
      '<button class="chrome-btn" id="c-reset" title="Reset the prototype">' + UI.icon('reset') + '</button>' +
      '<span class="chrome-div"></span>' +
      '<select class="chrome-sel" id="c-role" title="Switch role">' + roleOpts + '</select>' +
      '<select class="chrome-sel" id="c-flow" title="Switch flow">' + opts + '</select>' +
      '<button class="chrome-btn" id="c-index" title="All screens">' + UI.icon('grid') + '</button>' +
      '<button class="chrome-btn" id="c-wipe" title="Wipe everything back to a brand new install — one account, nothing else">' +
        'Start again' + '</button>' +
      (DB.isFresh()
        ? '<button class="chrome-btn" id="c-demo" title="Fill it with a populated agency">Load demo data</button>'
        : '') +
      (f ? '<span class="chrome-step">' + (S.step + 1) + ' / ' + f.steps.length + '</span>' : '') +
      '<span class="chrome-div"></span>' +
      '<button class="chrome-btn chrome-btn--next" id="c-next"' + (atEnd ? ' disabled' : '') + '>' +
        '<span class="lbl">' + UI.esc(nextLabel) + '</span>' +
        '<span class="go">' + UI.icon('arrow') + '</span>' +
      '</button>';

    document.getElementById('chrome').innerHTML = h;
  }

  function paintToasts() {
    var h = '';
    for (var i = 0; i < S.toasts.length; i++) {
      var t = S.toasts[i];
      h += '<div class="toast ' + (t.kind === 'warn' ? 'warn' : t.kind === 'bad' ? 'bad' : '') + '">' +
        '<i class="tdot"></i><span><b>' + UI.esc(t.title) + '</b><span>' + UI.esc(t.body) + '</span></span></div>';
    }
    document.getElementById('toasts').innerHTML = h;
  }

  /* ---------------- screen index overlay ---------------- */

  var GROUPS = [
    { k: 'auth',    t: 'Sign in' },
    { k: 'setup',   t: 'Day one — setting up' },
    { k: 'dash',    t: 'Dashboard' },
    { k: 'clients', t: 'Clients' },
    { k: 'cg',      t: 'Caregivers' },
    { k: 'budget',  t: 'Authorisations & budget' },
    { k: 'tasks',   t: 'Tasks' },
    { k: 'inc',     t: 'Incidents' },
    { k: 'hosp',    t: 'Hospitalisations' },
    { k: 'qi',      t: 'Quality Improvement' },
    { k: 'isp',     t: 'ISP progress' },
    { k: 'ov',      t: 'Reviews & oversight' },
    { k: 'cal',     t: 'Calendar' },
    { k: 'rep',     t: 'Reports' },
    { k: 'set',     t: 'Settings' },
    { k: 'sys',     t: 'System' }
  ];

  function paintOverlay() {
    var el = document.getElementById('overlay');
    if (!S.overlay) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = 'block';

    var ids = Object.keys(SCREENS);
    var h = '<div class="ovl-inner"><div class="ovl-head"><h2>All screens</h2>' +
      '<span class="mono small" style="color:rgba(255,255,255,.5)">' + ids.length + ' built</span>' +
      '<button class="x" id="ovl-x">&times;</button></div>';

    GROUPS.forEach(function (g) {
      var mine = ids.filter(function (id) { return id.split('.')[0] === g.k; });
      if (!mine.length) return;
      h += '<div class="ovl-group"><h3>' + g.t + ' <span style="opacity:.6">· ' + mine.length + '</span></h3><div class="ovl-grid">';
      mine.forEach(function (id) {
        var d = SCREENS[id];
        h += '<button class="ovl-card' + (id === S.screen ? ' is-here' : '') + '" data-goto="' + id + '">' +
          '<span class="t">' + UI.esc(d.title || id) + '</span><span class="i">' + id + '</span></button>';
      });
      h += '</div></div>';
    });

    el.innerHTML = h + '</div>';
  }

  /* ---------------- where every screen goes next ----------------
     In free navigation, clicking anything unwired moves forward
     along this chain, so the prototype never dead-ends.          */

  var DEFAULT_NEXT = {
    'auth.login': 'auth.error',
    'auth.error': 'auth.loading',
    'auth.loading': 'dash.home',
    'auth.agency': 'dash.home',
    'auth.denied': 'dash.home',

    'setup.welcome': 'setup.checklist',
    'setup.checklist': 'setup.agencies',
    'setup.agencies': 'setup.team',
    'setup.team': 'setup.programmes',
    'setup.programmes': 'set.reminders',
    'setup.dash': 'setup.checklist',
    'setup.done': 'dash.home',

    'dash.home': 'clients.list',
    'dash.empty': 'dash.home',

    'clients.list': 'clients.profile',
    'clients.profile': 'clients.checklist',
    'clients.checklist': 'budget.detail',
    'clients.import': 'clients.import.errors',
    'clients.import.errors': 'clients.import.preview',
    'clients.import.preview': 'clients.import.done',
    'clients.import.done': 'clients.list',

    'cg.list': 'cg.detail',
    'cg.import': 'cg.import.check',
    'cg.import.check': 'cg.import.done',
    'cg.import.done': 'cg.list',
    'cg.role': 'cg.credential',
    'cg.detail': 'cg.credential',
    'cg.credential': 'cg.detail',
    'cg.expiry': 'cg.list',

    'budget.list': 'budget.detail',
    'budget.detail': 'budget.usage',
    'budget.usage': 'budget.alert75',
    'budget.alert75': 'budget.block',
    'budget.block': 'budget.list',
    'budget.setup': 'budget.detail',

    'tasks.list': 'tasks.detail',
    'tasks.detail': 'tasks.escalated',
    'tasks.escalated': 'tasks.list',
    'tasks.new': 'tasks.detail',

    'inc.list': 'inc.new',
    'inc.new': 'inc.detail',
    'inc.detail': 'inc.aged',
    'inc.aged': 'inc.trigger',
    'inc.trigger': 'qi.detail',

    'hosp.list': 'hosp.new',
    'hosp.new': 'hosp.detail',
    'hosp.detail': 'hosp.visit',
    'hosp.visit': 'hosp.closed',
    'hosp.closed': 'hosp.list',

    'qi.list': 'qi.detail',
    'qi.detail': 'qi.outcome',
    'qi.outcome': 'qi.list',

    'isp.list': 'isp.entry',
    'isp.entry': 'isp.detail',
    'isp.detail': 'isp.list',

    'ov.list': 'ov.visit',
    'ov.visit': 'ov.assess',
    'ov.assess': 'ov.hrst',
    'ov.hrst': 'ov.plan',
    'ov.plan': 'ov.ddp',
    'ov.ddp': 'ov.list',

    'cal.mine': 'cal.team',
    'cal.team': 'cal.mine',

    'rep.builder': 'rep.results',
    'rep.results': 'rep.export',
    'rep.export': 'rep.pdf',
    'rep.pdf': 'rep.builder',

    'set.users': 'set.agencies',
    'set.agencies': 'set.reminders',
    'set.reminders': 'set.thresholds',
    'set.thresholds': 'set.checklist',
    'set.checklist': 'set.intervals',
    'set.intervals': 'set.users',

    'sys.audit': 'dash.home',
    'sys.empty': 'clients.list',
    'sys.loading': 'dash.home'
  };

  function forwardFrom(id) {
    var d = DEFAULT_NEXT[id];
    return (d && SCREENS[d]) ? d : null;
  }

  /* ---------------- write actions ----------------
     Buttons carrying data-do="name" run one of these before
     navigating. This is where the prototype actually saves.  */

  /* Repeat hospital stays raise a quality item the same way repeat
     incidents do. One per client per month. */
  function openQIifOverStays(rec) {
    var tally = DATA.hospTally(rec.client, rec.admitted);
    if (!tally.over) return;

    var exists = DB.all('qi').some(function (q) {
      return q.client === rec.client && q.month === tally.month && q.from === 'hosps';
    });
    if (exists) return;

    var owner = (DB.all('users').filter(function (u) { return u.role === 'admin'; })[0] ||
                 DB.all('users')[0] || {}).name || '';

    DB.add('qi', {
      agency: rec.agency, client: rec.client, clientName: rec.clientName,
      month: tally.month, from: 'hosps',
      title: 'Repeat hospital stays — ' + rec.clientName,
      opened: DB.stamp().slice(0, 11),
      source: 'Auto — ' + tally.count + ' stays in ' + tally.monthLabel,
      owner: owner, due: '', status: 'Open', auto: true, plan: ''
    });
    DB.log('System', 'Opened a quality item for ' + rec.clientName,
      tally.count + ' hospital stays in ' + tally.monthLabel + ', threshold is ' + tally.limit);
    toast('warn', 'A quality item opened by itself',
      rec.clientName + ' has had ' + tally.count + ' hospital stays in ' + tally.monthLabel + '.');
  }

  /* A quality item opens itself once a client passes the monthly threshold.
     One per client per month — recording a fourth incident does not open a fourth item. */
  function openQIifOver(rec) {
    var tally = DATA.incidentTally(rec.client, rec.when);
    if (!tally.over) return;

    var exists = DB.all('qi').some(function (q) {
      return q.client === rec.client && q.month === tally.month && q.from === 'incidents';
    });
    if (exists) return;

    var owner = (DB.all('users').filter(function (u) { return u.role === 'admin'; })[0] ||
                 DB.all('users')[0] || {}).name || '';

    DB.add('qi', {
      agency: rec.agency, client: rec.client, clientName: rec.clientName,
      month: tally.month, from: 'incidents',
      title: 'Repeat incidents — ' + rec.clientName,
      opened: DB.stamp().slice(0, 11),
      source: 'Auto — ' + tally.count + ' incidents in ' + tally.monthLabel,
      owner: owner, due: '', status: 'Open', auto: true, plan: ''
    });
    DB.log('System', 'Opened a quality item for ' + rec.clientName,
      tally.count + ' incidents in ' + tally.monthLabel + ', threshold is ' + tally.limit);
    toast('warn', 'A quality item opened by itself',
      rec.clientName + ' has had ' + tally.count + ' incidents in ' + tally.monthLabel +
      '. The threshold is ' + tally.limit + '.');
  }

  /* Reads the reminder form, or returns null and complains. */
  function readRule() {
    function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
    var what = val('r-what');
    if (!what) { toast('bad', 'Say what it watches', 'For example: background checks.'); return null; }

    var advance = val('r-advance').split(',')
      .map(function (n) { return parseInt(String(n).trim(), 10); })
      .filter(function (n) { return !isNaN(n) && n >= 0; })
      .sort(function (a, b) { return b - a; });

    var esc = parseInt(val('r-escalate'), 10);
    return {
      what: what,
      advance: advance,
      overdue: val('r-overdue') || 'Immediately',
      escalate: isNaN(esc) ? 7 : esc,
      email: val('r-email') !== 'no'
    };
  }

  var ACTIONS = {
    /* Add one agency from what was typed into the form. */
    'agency.add': function (S) {
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
      var name  = val('ag-name');
      var short = val('ag-short') || name;
      var state = val('ag-state');
      if (!name) {
        toast('bad', 'Give the agency a name', 'The name is the only thing that is required.');
        return 'stay';
      }
      var abbr = (val('ag-abbr') || short.slice(0, 2)).toUpperCase();
      var id = short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('ag-' + DB.all('agencies').length);
      if (DB.get('agencies', id)) {
        toast('bad', 'That agency already exists', 'Pick a different short name.');
        return 'stay';
      }
      DB.add('agencies', { id: id, name: name, short: short, abbr: abbr, state: state });
      if (!S.agency) S.agency = id;
      /* the example programme that shipped has no agency until one exists */
      DB.all('programmes').forEach(function (p) {
        if (!p.agency) DB.update('programmes', p.id, { agency: id });
      });
      DB.log(user().name, 'Created agency "' + short + '"', 'Setup');
      toast('ok', short + ' created', 'Every record from now on belongs to one agency.');
      return 'stay';
    },

    'agency.remove': function (S, el) {
      var id = el.getAttribute('data-id');
      var a = DB.get('agencies', id);
      var holds = ['clients', 'caregivers', 'incidents', 'auths', 'hosps'].reduce(function (n, coll) {
        return n + DB.all(coll).filter(function (r) { return r.agency === id; }).length;
      }, 0);
      if (holds) {
        toast('bad', 'That agency has records',
          (a ? a.short : 'It') + ' holds ' + holds + ' record' + (holds === 1 ? '' : 's') +
          '. Move or remove those first — nothing is deleted behind your back.');
        return 'stay';
      }
      DB.remove('agencies', id);
      if (S.agency === id) S.agency = (DB.all('agencies')[0] || {}).id || null;
      DB.log(user().name, 'Removed agency "' + ((a && a.short) || id) + '"', 'Setup');
      return 'stay';
    },

    'setup.agencies': function (S) {
      if (!DB.all('agencies').length) {
        toast('bad', 'Add at least one agency first', 'Nothing can be recorded until one exists.');
        return 'stay';
      }
      if (DB.setupStep() < 1) { DB.setupStep(1); S.vars.setupStep = 1; }
      if (!S.agency) S.agency = DB.all('agencies')[0].id;
      toast('ok', DB.all('agencies').length + ' agenc' + (DB.all('agencies').length === 1 ? 'y' : 'ies') + ' saved',
        'You can add more later in Settings.');
    },
    'user.add': function (S) {
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
      var name = val('u-name'), email = val('u-email'), pass = val('u-pass');
      var role = val('u-role') || 'admin', agencyId = val('u-agency'), title = val('u-title');

      if (!name)  { toast('bad', 'Give them a name', 'A full name is required.'); return 'stay'; }
      if (!email) { toast('bad', 'Give them an email', 'It is what they sign in with.'); return 'stay'; }
      if (email.indexOf('@') < 0) { toast('bad', 'That email does not look right', 'It needs an @ in it.'); return 'stay'; }
      if (pass.length < 6) { toast('bad', 'Set a longer password', 'At least six characters.'); return 'stay'; }

      var taken = DB.all('users').some(function (u) {
        return (u.email || '').toLowerCase() === email.toLowerCase();
      });
      if (taken) { toast('bad', 'That email already has an account', 'Every account needs its own email.'); return 'stay'; }

      DB.add('users', {
        name: name, initials: UI.initials(name).toUpperCase(), email: email,
        role: role, title: title || DATA.ROLE_LABEL[role],
        agency: role === 'superadmin' ? null : (agencyId || (DB.all('agencies')[0] || {}).id || null),
        password: pass, status: 'Active'
      });
      DB.log(user().name, 'Created account for ' + name + ' (' + DATA.ROLE_LABEL[role] + ')', 'Setup');
      toast('ok', name + ' can now sign in', 'Tell them the password you just set.');
      return 'stay';
    },

    'user.remove': function (S, el) {
      var id = el.getAttribute('data-id');
      var u = DB.get('users', id);
      var admins = DB.all('users').filter(function (x) { return x.role === 'superadmin'; }).length;
      if (u && u.role === 'superadmin' && admins < 2) {
        toast('bad', 'You cannot remove the last Super Admin', 'Somebody has to be able to reach Settings.');
        return 'stay';
      }
      DB.remove('users', id);
      DB.log(user().name, 'Removed the account for ' + ((u && u.name) || id), 'Setup');
      return 'stay';
    },

    'setup.team': function (S) {
      if (DB.setupStep() < 2) { DB.setupStep(2); S.vars.setupStep = 2; }
      var n = DB.all('users').length - 1;
      toast('ok', n ? n + ' account' + (n === 1 ? '' : 's') + ' created' : 'Continuing on your own',
        n ? 'They can sign in with the passwords you set.' : 'You can add staff later in Settings.');
    },

    'prog.select': function (S, el) {
      S.vars.progId = el.getAttribute('data-id');
      return 'stay';
    },

    'prog.add': function (S) {
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
      var name = val('p-name');
      if (!name) { toast('bad', 'Give the programme a name', 'Whatever your staff call it.'); return 'stay'; }

      var exists = DB.all('programmes').some(function (p) {
        return p.name.toLowerCase() === name.toLowerCase();
      });
      if (exists) { toast('bad', 'That programme already exists', 'Pick a different name.'); return 'stay'; }

      var copyFrom = val('p-copy');
      var docs = [];
      if (copyFrom) {
        var src = DB.get('programmes', copyFrom);
        if (src) docs = JSON.parse(JSON.stringify(src.docs || []));
      }

      var p = DB.add('programmes', {
        name: name,
        fullName: val('p-full'),
        agency: val('p-agency') || (DB.all('agencies')[0] || {}).id || null,
        docs: docs
      });
      S.vars.progId = p.id;
      DB.log(user().name, 'Added programme "' + name + '"' +
        (docs.length ? ' with ' + docs.length + ' documents copied' : ''), 'Setup');
      toast('ok', name + ' added', docs.length
        ? docs.length + ' documents copied across. Edit the list below.'
        : 'Now list the documents it requires.');
      return 'stay';
    },

    'prog.remove': function (S, el) {
      var id = el.getAttribute('data-id');
      var p = DB.get('programmes', id);
      DB.remove('programmes', id);
      if (S.vars.progId === id) S.vars.progId = (DB.all('programmes')[0] || {}).id || null;
      DB.log(user().name, 'Removed programme "' + ((p && p.name) || id) + '"', 'Setup');
      return 'stay';
    },

    'doc.add': function (S, el) {
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
      var pid = el.getAttribute('data-id');
      var p = DB.get('programmes', pid);
      if (!p) return 'stay';

      var name = val('d-name');
      if (!name) { toast('bad', 'Name the document', 'What is it called on the paperwork?'); return 'stay'; }
      if ((p.docs || []).some(function (d) { return d.name.toLowerCase() === name.toLowerCase(); })) {
        toast('bad', 'That document is already listed', 'Each one only needs to appear once.');
        return 'stay';
      }

      var expires = val('d-expires') !== 'no';
      p.docs = p.docs || [];
      p.docs.push({
        name: name,
        expires: expires,
        period: expires ? (val('d-period') || '12 months') : '—',
        required: val('d-required') !== 'no'
      });
      DB.update('programmes', pid, { docs: p.docs });
      DB.log(user().name, 'Added "' + name + '" to ' + p.name, 'Setup');
      toast('ok', 'Added to ' + p.name, expires
        ? 'The system will chase its renewal date.'
        : 'Once it is on file it stays on file.');
      return 'stay';
    },

    'doc.remove': function (S, el) {
      var pid = el.getAttribute('data-id');
      var i = parseInt(el.getAttribute('data-i'), 10);
      var p = DB.get('programmes', pid);
      if (!p || !p.docs || isNaN(i)) return 'stay';
      var gone = p.docs.splice(i, 1)[0];
      DB.update('programmes', pid, { docs: p.docs });
      DB.log(user().name, 'Removed "' + ((gone && gone.name) || '?') + '" from ' + p.name, 'Setup');
      return 'stay';
    },

    'setup.programmes': function (S) {
      if (!DB.all('programmes').length) {
        toast('bad', 'Add at least one programme', 'Nothing can be checked without one.');
        return 'stay';
      }
      if (DB.setupStep() < 3) { DB.setupStep(3); S.vars.setupStep = 3; }
      var n = DB.all('programmes').length;
      toast('ok', n + ' programme' + (n === 1 ? '' : 's') + ' saved',
        'The system now knows which documents each one requires.');
    },

    'rem.edit':   function (S, el) { S.vars.remId = el.getAttribute('data-id'); return 'stay'; },
    'rem.cancel': function (S)     { S.vars.remId = null; return 'stay'; },

    'rem.email': function (S, el) {
      var r = DB.get('reminders', el.getAttribute('data-id'));
      if (!r) return 'stay';
      DB.update('reminders', r.id, { email: !r.email });
      DB.log(user().name, (r.email ? 'Turned off' : 'Turned on') + ' email for "' + r.what + '"', 'Settings');
      return 'stay';
    },

    /* Read the form. Shared by add and save. */
    'rem.add': function (S) {
      var f = readRule();
      if (!f) return 'stay';
      if (DB.all('reminders').some(function (r) { return r.what.toLowerCase() === f.what.toLowerCase(); })) {
        toast('bad', 'There is already a rule for that', 'Edit the existing one instead.');
        return 'stay';
      }
      DB.add('reminders', f);
      DB.log(user().name, 'Added reminder rule for "' + f.what + '"', 'Settings');
      toast('ok', 'Rule added', 'It runs from tonight.');
      return 'stay';
    },

    'rem.save': function (S, el) {
      var f = readRule();
      if (!f) return 'stay';
      DB.update('reminders', el.getAttribute('data-id'), f);
      S.vars.remId = null;
      DB.log(user().name, 'Changed the reminder rule for "' + f.what + '"', 'Settings');
      toast('ok', 'Saved', 'Takes effect on the next nightly run.');
      return 'stay';
    },

    'rem.remove': function (S, el) {
      var r = DB.get('reminders', el.getAttribute('data-id'));
      DB.remove('reminders', el.getAttribute('data-id'));
      if (S.vars.remId === (r && r.id)) S.vars.remId = null;
      DB.log(user().name, 'Deleted the reminder rule for "' + ((r && r.what) || '?') + '"', 'Settings');
      toast('warn', 'Rule deleted', 'Nothing will be chased for that any more.');
      return 'stay';
    },

    'setup.reminders': function (S) {
      if (DB.setupStep() < 4) { DB.setupStep(4); S.vars.setupStep = 4; }
      toast('ok', 'Reminder timings confirmed', 'Change them any time in Settings.');
    },

    /* Import only the rows the file check passed. A client arrives with
       their own details and nothing else — no programme, no agreement and
       no authorisation. Those are decisions, made per client afterwards. */
    'import.clients': function (S) {
      var good = DEMO.importFile.rows.filter(function (r) { return r.outcome === 'ok'; });
      var already = {};
      DB.all('clients').forEach(function (c) {
        if (c.mrn) already[c.mrn] = true;
        already[(c.name || '').toLowerCase()] = true;
      });

      var toAdd = [];
      good.forEach(function (r) {
        var name = (r.first + ' ' + r.last).toLowerCase();
        if (already[r.medicaid] || already[name]) return;
        already[r.medicaid] = true;
        already[name] = true;
        toAdd.push({
          id: 'c-' + r.medicaid.toLowerCase().replace(/[^a-z0-9]/g, ''),
          agency: S.agency || (DB.all('agencies')[0] || {}).id || null,
          name: r.first + ' ' + r.last,
          dob: r.dob,
          mrn: r.medicaid,
          phone: r.phone,
          address: r.address,
          status: 'Active',
          since: DB.stamp().slice(3, 11),
          waiver: null,
          program: null,
          coord: null,
          agreement: null
        });
      });

      if (!toAdd.length) {
        toast('info', 'Those clients are already here', 'Nothing was imported twice.');
        return;
      }

      DB.addMany('clients', toAdd);
      if (DB.setupStep() < 5) { DB.setupStep(5); S.vars.setupStep = 5; }
      DB.log(user().name, 'Imported ' + toAdd.length + ' clients from ' + DEMO.importFile.name,
        (DEMO.importFile.rows.length - good.length) + ' rows skipped');
      toast('ok', toAdd.length + ' clients imported',
        'Each one still needs a programme, an agreement and an authorisation.');
    },

    /* Open one client and remember which. */
    'client.open': function (S, el) {
      S.vars.clientId = el.getAttribute('data-id');
      return null;
    },

    /* Put a client on a programme. This is what creates their paperwork list. */
    'client.programme': function (S) {
      var c = DB.get('clients', S.vars.clientId) || DB.all('clients')[0];
      if (!c) return 'stay';
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var prog = DB.get('programmes', val('c-prog'));
      if (!prog) { toast('bad', 'Pick a programme', 'It decides which documents are required.'); return 'stay'; }

      DB.update('clients', c.id, {
        waiver: prog.name,
        program: val('c-service') || prog.fullName || prog.name,
        coord: val('c-coord') || user().name
      });

      /* their required documents, none of them on file yet */
      var existing = DB.all('clientDocs').filter(function (d) { return d.client !== c.id; });
      var rows = (prog.docs || []).map(function (d, n) {
        return { id: 'cd-' + c.id + '-' + n, client: c.id, name: d.name,
                 required: d.required !== false,
                 renews: d.expires !== false, period: d.period || '—',
                 received: '—', expires: '—' };
      });
      DB.setCollection('clientDocs', existing.concat(rows));

      DB.log(user().name, 'Put ' + c.name + ' on the ' + prog.name + ' programme',
        rows.length + ' required documents added');
      var need = rows.filter(function (r) { return r.required; }).length;
      toast('ok', c.name + ' is on ' + prog.name,
        need + ' required document' + (need === 1 ? '' : 's') +
        ' now showing on the dashboard, one line each, until they are filed.');
    },

    /* Record the signed service agreement. */
    'client.agreement': function (S) {
      var c = DB.get('clients', S.vars.clientId) || DB.all('clients')[0];
      if (!c) return 'stay';
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var start = UI.readDate('c-start'), end = UI.readDate('c-end');
      if (!start || !end) { toast('bad', 'Both dates are needed', 'The system watches the end date.'); return 'stay'; }
      if (UI.toISO(end) <= UI.toISO(start)) {
        toast('bad', 'The end date comes first', 'An agreement has to run forwards.'); return 'stay';
      }

      DB.update('clients', c.id, { agreement: { start: start, end: end, status: 'Current' } });
      DB.log(user().name, 'Recorded a service agreement for ' + c.name, start + ' to ' + end);
      toast('ok', 'Agreement recorded', 'You will be reminded before ' + end + '.');
    },

    /* Their details only. Role, agency and credentials come afterwards. */
    'import.caregivers': function (S) {
      var good = DEMO.caregiverFile.rows.filter(function (r) { return r.outcome === 'ok'; });
      var already = {};
      DB.all('caregivers').forEach(function (g) {
        if (g.email) already[g.email.toLowerCase()] = true;
        already[(g.name || '').toLowerCase()] = true;   /* a record may predate emails */
      });

      var toAdd = [];
      good.forEach(function (r) {
        var name = (r.first + ' ' + r.last).toLowerCase();
        if (already[r.email.toLowerCase()] || already[name]) return;
        already[r.email.toLowerCase()] = true;
        already[name] = true;
        toAdd.push({
          id: 'g-' + r.email.split('@')[0].replace(/[^a-z0-9]/g, ''),
          agency: null,
          name: r.first + ' ' + r.last,
          phone: r.phone,
          email: r.email,
          role: null,
          hired: null
        });
      });

      if (!toAdd.length) {
        toast('info', 'Those people are already here', 'Nothing was imported twice.');
        return;
      }

      DB.addMany('caregivers', toAdd);
      if (DB.setupStep() < 6) { DB.setupStep(6); S.vars.setupStep = 6; }
      DB.log(user().name, 'Imported ' + toAdd.length + ' caregivers from ' + DEMO.caregiverFile.name,
        (DEMO.caregiverFile.rows.length - good.length) + ' rows skipped');
      toast('ok', toAdd.length + ' caregivers imported',
        'Each one still needs a role and their credentials adding.');
    },

    'cg.open': function (S, el) { S.vars.cgId = el.getAttribute('data-id'); return null; },

    /* Give them a job and an agency. */
    'cg.role': function (S) {
      var g = DB.get('caregivers', S.vars.cgId) || DB.all('caregivers')[0];
      if (!g) return 'stay';
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var role = val('g-role');
      if (!role) { toast('bad', 'Pick a job title', 'It decides what they can be assigned to.'); return 'stay'; }

      DB.update('caregivers', g.id, {
        role: role,
        agency: val('g-agency') || (DB.all('agencies')[0] || {}).id || null,
        hired: UI.readDate('g-hired') || DB.stamp().slice(0, 11)
      });
      DB.log(user().name, 'Set ' + g.name + ' as ' + role, 'Staff setup');
      toast('ok', g.name + ' is set up as a ' + role.toLowerCase(),
        'Now add the licences and training they have to hold.');
    },

    /* Add one credential with its dates. */
    'cred.add': function (S) {
      var g = DB.get('caregivers', S.vars.cgId) || DB.all('caregivers')[0];
      if (!g) return 'stay';
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var name = val('cr-name');
      if (!name) { toast('bad', 'Name the requirement', 'For example: CPR / First Aid.'); return 'stay'; }
      if (DATA.credsFor(g.id).some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })) {
        toast('bad', 'That is already listed', 'Renew it instead of adding it twice.');
        return 'stay';
      }

      var status = val('cr-status') || 'ok';
      var done = UI.readDate('cr-done'), due = UI.readDate('cr-due');
      if (done && due && UI.toISO(due) <= UI.toISO(done)) {
        toast('bad', 'It would expire before it was earned', 'Check the two dates.'); return 'stay';
      }
      DB.add('creds', {
        caregiver: g.id, name: name,
        done: done || '—',
        due: due || '—',
        status: status
      });
      DB.log(user().name, 'Added "' + name + '" for ' + g.name, 'Staff setup');
      toast('ok', 'Added for ' + g.name.split(' ')[0],
        status === 'ok' ? 'You will be reminded before it expires.'
                        : 'It is already showing on the dashboard.');
      return 'stay';
    },

    'cred.remove': function (S, el) {
      var id = el.getAttribute('data-id');
      var c = DB.get('creds', id);
      DB.remove('creds', id);
      DB.log(user().name, 'Removed "' + ((c && c.name) || '?') + '"', 'Staff setup');
      return 'stay';
    },

    /* Renewing keeps the old record and adds a fresh one. */
    'cred.renew': function (S, el) {
      var c = DB.get('creds', el.getAttribute('data-id'));
      if (!c) return 'stay';
      DB.update('creds', c.id, { status: 'replaced', replacedOn: DB.stamp().slice(0, 11) });
      DB.add('creds', { caregiver: c.caregiver, name: c.name,
                        done: DB.stamp().slice(0, 11), due: '—', status: 'ok' });
      DB.log(user().name, 'Renewed "' + c.name + '"', 'The previous record was kept');
      toast('ok', c.name + ' renewed', 'The expired record is kept on file, not overwritten.');
      return 'stay';
    },

    /* ---------------- the automatic rules ---------------- */

    'th.toggle': function (S) {
      var t = DB.settings().thresholds || {};
      t.nurseVisitAfterDischarge = !t.nurseVisitAfterDischarge;
      DB.setSetting('thresholds', t);
      return 'stay';
    },

    'th.save': function (S) {
      function num(id, min, max) {
        var e = document.getElementById(id);
        var n = e ? parseFloat(String(e.value).replace(/[^0-9.]/g, '')) : NaN;
        if (isNaN(n) || n < min || n > max) return null;
        return n;
      }
      var t = DB.settings().thresholds || {};

      var inc   = num('th-inc', 1, 99),
          hosp  = num('th-hosp', 1, 99),
          b1    = num('th-b1', 1, 100),
          b2    = num('th-b2', 1, 100),
          b3    = num('th-b3', 1, 200),
          isp   = num('th-isp', 1, 100),
          chase = num('th-chase', 1, 365),
          esc   = num('th-esc', 1, 365),
          disch = num('th-disch', 1, 365);

      if ([inc, hosp, b1, b2, b3, isp, chase, esc, disch].some(function (v) { return v === null; })) {
        toast('bad', 'One of these is not a number', 'Every rule needs a figure the system can count to.');
        return 'stay';
      }
      if (!(b1 < b2 && b2 < b3)) {
        toast('bad', 'The budget alerts overlap', 'They have to rise: first, then second, then exhausted.');
        return 'stay';
      }

      t.qiFromIncidents = inc; t.qiFromHospitalStays = hosp;
      t.budgetAlerts = [b1, b2, b3];
      t.ispDropPoints = isp; t.incidentChaseDays = chase; t.escalateAfterDays = esc;
      t.dischargeVisitDays = disch;
      DB.setSetting('thresholds', t);

      DB.log(user().name, 'Changed the automatic rules',
        inc + ' incidents · ' + b1 + '/' + b2 + '/' + b3 + '% budget · chase after ' + chase + ' days');
      toast('ok', 'Rules saved', 'They apply from now on, to records already in the system as well.');
      return 'stay';
    },

    /* ---------------- hospital stays ---------------- */

    'hosp.open':   function (S, el) { S.vars.hospId = el.getAttribute('data-id'); return null; },
    'hosp.filter': function (S, el) { S.vars.hospFilter = el.getAttribute('data-filter'); return 'stay'; },

    'hosp.notify': function (S, el) {
      var who = el.getAttribute('data-who');
      var list = (S.vars.hospNotify || ['Support coordinator', 'Family']).slice();
      var at = list.indexOf(who);
      if (at >= 0) list.splice(at, 1); else list.push(who);
      S.vars.hospNotify = list;
      return 'stay';
    },

    'hosp.review': function (S, el) {
      var name = el.getAttribute('data-review');
      var list = (S.vars.hospReviews || []).slice();
      var at = list.indexOf(name);
      if (at >= 0) list.splice(at, 1); else list.push(name);
      S.vars.hospReviews = list;
      return 'stay';
    },

    'hosp.add': function (S) {
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var c = DB.get('clients', val('hp-client'));
      if (!c) { toast('bad', 'Pick a client', 'A stay happens to somebody.'); return 'stay'; }

      var when = UI.readDate('hp-when');
      if (!when) { toast('bad', 'When were they admitted?', 'Everything after this is dated from it.'); return 'stay'; }

      var rec = DB.add('hosps', {
        agency: c.agency, client: c.id, clientName: c.name,
        kind: val('hp-kind') || 'Admission',
        hospital: val('hp-where'),
        admitted: when,
        reason: val('hp-why'),
        notified: (S.vars.hospNotify || ['Support coordinator', 'Family']).slice(),
        discharged: null,
        visitRequired: (DB.settings().thresholds || {}).nurseVisitAfterDischarge !== false,
        visitDue: null,
        nurse: null
      });

      S.vars.hospId = rec.id;
      S.vars.hospNotify = null;
      S.vars.hospFilter = 'all';
      DB.log(user().name, 'Recorded a hospital stay for ' + c.name,
        (val('hp-kind') || 'Admission') + ' · ' + (val('hp-where') || 'hospital not named'));
      toast('ok', 'Stay recorded',
        'Record the discharge when they come home and the nurse visit is scheduled from that date.');

      openQIifOverStays(rec);
    },

    /* Discharge is what starts the clock on the follow-up visit. */
    'hosp.discharge': function (S) {
      var r = DB.get('hosps', S.vars.hospId);
      if (!r) return 'stay';

      var out = UI.readDate('hp-out');
      if (!out) { toast('bad', 'When did they come home?', 'The visit falls due from that date.'); return 'stay'; }
      if (UI.toISO(out) < UI.toISO(r.admitted)) {
        toast('bad', 'That is before they were admitted', 'Check the two dates.'); return 'stay';
      }

      var days = (DB.settings().thresholds || {}).dischargeVisitDays || 3;
      var due = UI.fromISO(new Date(Date.parse(UI.toISO(out)) + days * 86400000).toISOString().slice(0, 10));
      var nurse = (document.getElementById('hp-nurse') || {}).value || r.nurse ||
                  (DB.all('users').filter(function (u) { return u.role === 'nurse'; })[0] ||
                   DB.all('users')[0] || {}).name || '';

      DB.update('hosps', r.id, { discharged: out, visitDue: r.visitRequired ? due : null, nurse: nurse });
      DB.log(user().name, 'Recorded discharge for ' + r.clientName,
        r.visitRequired ? 'Nurse visit due ' + due + ' · ' + nurse : 'No nurse visit required');
      toast('ok', r.clientName.split(' ')[0] + ' is home',
        r.visitRequired ? 'The nurse visit is due ' + due + '. The stay stays open until it is done.'
                        : 'No nurse visit is required, so the stay can be closed.');
      return 'stay';
    },

    /* Waiving is allowed, but never silently. */
    'hosp.waive': function (S) {
      var r = DB.get('hosps', S.vars.hospId);
      if (!r) return 'stay';
      var why = (document.getElementById('hp-waive') || {}).value || '';
      why = String(why).trim();
      if (why.length < 5) {
        toast('bad', 'Waiving needs a reason', 'It goes on the audit trail, so it has to say something.');
        return 'stay';
      }
      DB.update('hosps', r.id, { visitWaived: { on: DB.stamp().slice(0, 11), by: user().name, reason: why } });
      DB.log(user().name, 'Waived the nurse visit for ' + r.clientName, why);
      toast('info', 'Nurse visit waived', 'The reason is on the record and in the audit trail.');
      return 'stay';
    },

    /* The visit, and the reviews it asks for, which become real tasks. */
    'hosp.visit.save': function (S) {
      var r = DB.get('hosps', S.vars.hospId);
      if (!r) return 'stay';
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var on = UI.readDate('hv-on');
      if (!on) { toast('bad', 'When was the visit?', 'That date is what stops the chase.'); return 'stay'; }
      if (UI.toISO(on) < UI.toISO(r.discharged)) {
        toast('bad', 'That is before they came home', 'A follow-up cannot happen first.'); return 'stay';
      }

      var by = val('hv-by') || r.nurse || user().name;
      var wanted = (S.vars.hospReviews || []).slice();

      DB.update('hosps', r.id, {
        visit: { on: on, by: by,
                 condition: val('hv-cond'),
                 instructions: val('hv-inst'),
                 meds: val('hv-meds'),
                 orders: val('hv-orders'),
                 reviews: wanted }
      });

      /* One task per review the nurse asked for, linked back to this stay. */
      var due = UI.fromISO(new Date(Date.parse(UI.toISO(on)) + 14 * 86400000).toISOString().slice(0, 10));
      wanted.forEach(function (name) {
        DB.add('tasks', {
          agency: r.agency,
          title: 'Review ' + name + ' after hospital discharge',
          linked: 'Hospitalisation · ' + r.clientName,
          linkedId: r.id,
          owner: by, due: due, status: 'Not started', priority: 'High', recurring: false
        });
      });

      S.vars.hospReviews = null;
      DB.log(user().name, 'Recorded the nurse visit for ' + r.clientName,
        on + (wanted.length ? ' · ' + wanted.length + ' review' + (wanted.length === 1 ? '' : 's') + ' raised' : ' · no reviews needed'));
      toast('ok', 'Visit recorded',
        wanted.length
          ? wanted.length + ' review task' + (wanted.length === 1 ? '' : 's') + ' created. The stay closes once they are done.'
          : 'No reviews were needed, so the stay can be closed.');
    },

    'hosp.close': function (S) {
      var r = DB.get('hosps', S.vars.hospId);
      if (!r) return 'stay';
      var st = DATA.hospState(r);

      if (st.key === 'in') {
        toast('bad', 'They are still in hospital', 'Record the discharge first.'); return 'stay';
      }
      if (st.key === 'visitDue' || st.key === 'visitLate') {
        toast('bad', 'The nurse visit has not happened',
          'Record it, or waive it with a reason. A stay is not closed just because somebody came home.');
        return 'stay';
      }
      if (st.key === 'reviews') {
        toast('bad', st.open + ' review' + (st.open === 1 ? '' : 's') + ' still outstanding',
          'The nurse asked for these. Complete them in Tasks first.');
        return 'stay';
      }

      DB.update('hosps', r.id, { closed: { on: DB.stamp().slice(0, 11), by: user().name } });
      DB.log(user().name, 'Closed the hospital stay for ' + r.clientName, 'Returned to service');
      toast('ok', r.clientName.split(' ')[0] + ' is back in service', 'The whole chain is on the record.');
    },

    'hosp.reopen': function (S) {
      var r = DB.get('hosps', S.vars.hospId);
      if (!r) return 'stay';
      DB.update('hosps', r.id, { closed: null });
      DB.log(user().name, 'Reopened the hospital stay for ' + r.clientName, 'Stay reopened');
      toast('info', 'Reopened', 'Closing it again needs nothing re-typed.');
      return 'stay';
    },

    /* ---------------- waiver documents ---------------- */

    'doc.file':   function (S, el) { S.vars.docId = el.getAttribute('data-id'); return 'stay'; },
    'doc.cancel': function (S) { S.vars.docId = null; return 'stay'; },

    'doc.save': function (S) {
      var d = DB.get('clientDocs', S.vars.docId);
      if (!d) return 'stay';

      var got = UI.readDate('dc-got');
      if (!got) { toast('bad', 'When did it come in?', 'That date is what the system files it under.'); return 'stay'; }

      var exp = d.renews ? UI.readDate('dc-exp') : '';
      if (exp && UI.toISO(exp) <= UI.toISO(got)) {
        toast('bad', 'It would expire before it arrived', 'Check the two dates.'); return 'stay';
      }

      DB.update('clientDocs', d.id, { received: got, expires: exp || '\u2014' });
      S.vars.docId = null;

      var c = DB.get('clients', d.client) || {};
      var pw = DATA.paperwork(d.client);
      DB.log(user().name, 'Filed "' + d.name + '" for ' + (c.name || 'a client'),
        'Received ' + got + (exp ? ', expires ' + exp : ''));

      if (DATA.docState(DB.get('clientDocs', d.id)) === 'Expired') {
        toast('warn', d.name + ' is already out of date',
          'It went on file, but that expiry has passed so it still shows on the dashboard.');
      } else if (pw.complete) {
        toast('ok', 'That was the last one',
          (c.name || 'This client') + ' has every required document on file. Nothing is showing on the dashboard.');
      } else {
        toast('ok', d.name + ' is on file',
          (pw.missing + pw.expired) + ' still outstanding for ' + (c.name || 'this client') + '.');
      }
      return 'stay';
    },

    'doc.unfile': function (S) {
      var d = DB.get('clientDocs', S.vars.docId);
      if (!d) return 'stay';
      DB.update('clientDocs', d.id, { received: '\u2014', expires: '\u2014' });
      S.vars.docId = null;
      DB.log(user().name, 'Took "' + d.name + '" back off file', 'Waiver paperwork');
      toast('info', d.name + ' is outstanding again', 'It is back on the dashboard.');
      return 'stay';
    },

    'alerts.all': function (S) { S.vars.allAlerts = !S.vars.allAlerts; return 'stay'; },

    /* A dashboard alert opens the record it is actually about. */
    'alert.go': function (S, el) {
      S.vars[el.getAttribute('data-var')] = el.getAttribute('data-id');
      return null;
    },

    /* ---------------- incidents ---------------- */

    'inc.open': function (S, el) { S.vars.incId = el.getAttribute('data-id'); return null; },

    'inc.filter': function (S, el) { S.vars.incFilter = el.getAttribute('data-filter'); return 'stay'; },

    /* The notify list is part of the form, so it lives in vars until saving. */
    'inc.notify': function (S, el) {
      var who = el.getAttribute('data-who');
      var list = (S.vars.incNotify || ['Support coordinator', 'Family']).slice();
      var at = list.indexOf(who);
      if (at >= 0) list.splice(at, 1); else list.push(who);
      S.vars.incNotify = list;
      return 'stay';
    },

    'inc.add': function (S) {
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var c = DB.get('clients', val('in-client'));
      if (!c) { toast('bad', 'Pick a client', 'An incident happens to somebody.'); return 'stay'; }

      var when = UI.readDate('in-when');
      if (!when) { toast('bad', 'When did it happen?', 'The date decides what gets chased and by when.'); return 'stay'; }

      var desc = val('in-desc');
      if (!desc) { toast('bad', 'Say what happened', 'This is the account somebody will read months from now.'); return 'stay'; }

      /* No due date given? Use the chase interval the Super Admin set. */
      var due = UI.readDate('in-due');
      if (!due) {
        var days = (DB.settings().thresholds || {}).incidentChaseDays || 7;
        var d = new Date(Date.parse(UI.toISO(when)) + days * 86400000);
        due = UI.fromISO(d.toISOString().slice(0, 10));
      }
      if (UI.toISO(due) < UI.toISO(when)) {
        toast('bad', 'The follow-up is due before it happened', 'Check the two dates.'); return 'stay';
      }

      var rec = DB.add('incidents', {
        agency: c.agency, client: c.id, clientName: c.name,
        type: val('in-type') || 'Other',
        when: when,
        place: val('in-place'),
        desc: desc,
        immediate: val('in-action'),
        notified: (S.vars.incNotify || ['Support coordinator', 'Family']).slice(),
        assigned: val('in-who') || (DB.all('users')[0] || {}).name || '',
        due: due
      });

      S.vars.incId = rec.id;
      S.vars.incNotify = null;
      S.vars.incFilter = 'all';
      DB.log(user().name, 'Recorded a ' + (val('in-type') || 'incident').toLowerCase() + ' for ' + c.name,
        'Follow-up due ' + due);
      toast('ok', 'Incident recorded',
        'The follow-up is due ' + due + '. It will be chased from the dashboard until it is done.');

      openQIifOver(rec);
    },

    /* Change who owns the follow-up, or when it is due, without completing it. */
    'inc.reassign': function (S) {
      var i = DB.get('incidents', S.vars.incId);
      if (!i) return 'stay';
      var who = (document.getElementById('fu-who') || {}).value || i.assigned;
      var due = UI.readDate('fu-due') || i.due;
      DB.update('incidents', i.id, { assigned: who, due: due });
      DB.log(user().name, 'Reassigned the follow-up for ' + i.clientName, who + ' · due ' + due);
      toast('ok', 'Follow-up reassigned', who + ' owns it now, due ' + due + '.');
      return 'stay';
    },

    /* Recording the visit is what makes it stop chasing. */
    'inc.followup': function (S) {
      var i = DB.get('incidents', S.vars.incId);
      if (!i) return 'stay';

      var on = UI.readDate('fu-on');
      if (!on) { toast('bad', 'When was the visit done?', 'That date is what stops the chase.'); return 'stay'; }
      if (UI.toISO(on) < UI.toISO(i.when)) {
        toast('bad', 'That is before the incident', 'A follow-up cannot happen first.'); return 'stay';
      }

      var note = (document.getElementById('fu-note') || {}).value || '';
      var who = (document.getElementById('fu-who') || {}).value || i.assigned;

      DB.update('incidents', i.id, {
        assigned: who,
        due: UI.readDate('fu-due') || i.due,
        followUp: { on: on, by: who, note: String(note).trim() }
      });
      DB.log(user().name, 'Recorded the follow-up visit for ' + i.clientName, on + ' · ' + who);
      toast('ok', 'Follow-up recorded', 'It has stopped chasing. You can close the incident when you are ready.');
      return 'stay';
    },

    'inc.close': function (S) {
      var i = DB.get('incidents', S.vars.incId);
      if (!i) return 'stay';
      if (!i.followUp) {
        toast('bad', 'The follow-up is not done', 'Record the visit first — that is the point of the chase.');
        return 'stay';
      }
      DB.update('incidents', i.id, { closed: { on: DB.stamp().slice(0, 11), by: user().name } });
      DB.log(user().name, 'Closed the ' + i.type.toLowerCase() + ' for ' + i.clientName, 'Incident closed');
      toast('ok', 'Incident closed', 'It stays on the record and still counts toward the monthly threshold.');
    },

    'inc.reopen': function (S) {
      var i = DB.get('incidents', S.vars.incId);
      if (!i) return 'stay';
      DB.update('incidents', i.id, { closed: null });
      DB.log(user().name, 'Reopened the ' + i.type.toLowerCase() + ' for ' + i.clientName, 'Incident reopened');
      toast('info', 'Reopened', 'Closing it again needs nothing re-typed.');
      return 'stay';
    },

    /* One authorisation, typed in. Nothing else is invented alongside it. */
    'auth.add': function (S) {
      function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }

      var c = DB.get('clients', val('au-client'));
      if (!c) { toast('bad', 'Pick a client', 'An authorisation belongs to one person.'); return 'stay'; }

      var units = parseFloat(val('au-units').replace(/[^0-9.]/g, ''));
      var rate  = parseFloat(val('au-rate').replace(/[^0-9.]/g, ''));
      if (!units || units <= 0) { toast('bad', 'How many units were approved?', 'One unit is 15 minutes.'); return 'stay'; }
      if (!rate || rate <= 0)   { toast('bad', 'What is the rate per unit?', 'In dollars, for example 6.25.'); return 'stay'; }

      var start = UI.readDate('au-start'), end = UI.readDate('au-end');
      if (!start || !end) { toast('bad', 'Both dates are needed', 'The system watches the end date.'); return 'stay'; }
      if (UI.toISO(end) <= UI.toISO(start)) {
        toast('bad', 'The end date comes first', 'An authorisation has to run forwards.'); return 'stay';
      }

      DB.add('auths', {
        client: c.id, clientName: c.name, agency: c.agency,
        service: val('au-service') || 'Community Living Support',
        number: val('au-no') || '—',
        waiver: val('au-waiver') || '',
        start: start, end: end,
        units: units, rate: rate, used: 0
      });

      DB.log(user().name, 'Added an authorisation for ' + c.name,
        units.toLocaleString() + ' units at ' + DATA.money(rate));
      toast('ok', 'Authorisation saved',
        'Nothing is used yet. Enter hours each month and the utilisation works itself out.');
    }
  };

  /* ---------------- click delegation ---------------- */

  var ADVANCERS = 'button, a, [role="button"], tr[data-row], .stat, .card--click, .clist-row, ' +
                  '.fchip, .radio-chip, .check, .emrlink, .linkish, .searchbox, .avatar';

  function onClick(e) {
    var t = e.target;
    if (!t.closest) return;

    /* --- demo chrome --- */
    var chromeBtn = t.closest('#c-reset, #c-next, #c-index, #c-wipe, #c-demo, #ovl-x');
    if (chromeBtn) {
      if (chromeBtn.id === 'c-reset') reset();
      else if (chromeBtn.id === 'c-next') next();
      else if (chromeBtn.id === 'c-index') { S.overlay = !S.overlay; paintOverlay(); }
      else if (chromeBtn.id === 'c-wipe') {
        DB.startAgain();
        S.flow = null; S.step = 0; S.vars = { loginAs: 'owner', setupStep: 0 };
        S.role = 'superadmin'; S.agency = (DB.all('agencies')[0] || {}).id || null;
        S.screen = 'auth.login';
        toast('info', 'Back to a brand new install',
          'One account and Georgia. Exactly what is handed over.');
        render();
      }
      else if (chromeBtn.id === 'c-demo') {
        DB.loadDemo();
        S.vars.setupStep = 6;
        S.agency = 'ga';
        S.screen = 'dash.home';
        toast('ok', 'Demo agency loaded', 'A populated system, for showing what it looks like in use.');
        render();
      }
      else if (chromeBtn.id === 'ovl-x') { S.overlay = false; paintOverlay(); }
      return;
    }

    /* --- screen index overlay: jump straight there --- */
    if (t.closest('#overlay')) {
      var ov = t.closest('[data-goto]');
      if (ov && ov.getAttribute('data-goto')) {
        S.overlay = false;
        S.flow = null;
        go(ov.getAttribute('data-goto'));
      }
      return;
    }

    /* --- typing fields do nothing --- */
    if (t.closest('[data-inert]')) return;

    /* --- a button that actually writes something --- */
    var doer = t.closest('[data-do]');
    if (doer) {
      var fn = ACTIONS[doer.getAttribute('data-do')];
      if (fn) {
        var result = fn(S, doer);
        if (result === 'stay') { render(); return; }   /* re-render, do not navigate */
      }
    }

    /* --- choosing which account to sign in as --- */
    var pick = t.closest('[data-login-as]');
    if (pick) {
      S.vars.loginAs = pick.getAttribute('data-login-as');
      render();
      return;
    }

    /* --- sign out --- */
    if (t.closest('[data-signout]')) {
      var who = S.vars.loginAs || 'admin';
      DB.clearSession();
      S.flow = null; S.step = 0; S.vars = { loginAs: who };
      S.screen = 'auth.login';
      toast('info', 'Signed out', 'Pick another account to sign in as.');
      window.scrollTo(0, 0);
      render();
      return;
    }

    /* --- agency switch --- */
    var ag = t.closest('[data-agency]');
    if (ag) {
      S.agency = ag.getAttribute('data-agency');
      toast('info', 'Switched to ' + agency().short, 'Only this agency’s records are visible now.');
      render();
      return;
    }

    /* --- sidebar and topbar always navigate directly, and leave any flow --- */
    if (t.closest('.sidebar') || t.closest('.topbar')) {
      var navEl = t.closest('[data-goto]');
      if (navEl && navEl.getAttribute('data-goto') && !navEl.hasAttribute('disabled')) {
        S.flow = null;
        go(navEl.getAttribute('data-goto'));
      }
      return;
    }

    /* --- anything clickable inside the page --- */
    var adv = t.closest(ADVANCERS);
    if (!adv || adv.hasAttribute('disabled')) return;

    /* a screen may decide its own destination from what was typed —
       this wins over the flow script, so the prototype reacts to real input */
    var def = SCREENS[S.screen];
    if (def && def.intercept) {
      var chosen = def.intercept(S, adv);
      if (chosen === 'auth.loading') applyAccount();
      if (chosen && SCREENS[chosen]) {
        if (S.flow && jumpFlowTo(chosen)) { window.scrollTo(0, 0); render(); }
        else { S.flow = null; go(chosen); }
        return;
      }
    }

    /* inside a scripted flow the script decides what comes next */
    if (S.flow) { next(); return; }

    /* free navigation: explicit destination first, then the forward chain.
       A link pointing at the screen you are already on falls through, so
       clicking the current tab still moves you somewhere. */
    var goEl = t.closest('[data-goto]');
    var dest = goEl && goEl.getAttribute('data-goto');
    if (dest && SCREENS[dest] && dest !== S.screen) { go(dest); return; }

    dest = forwardFrom(S.screen);
    if (dest) { go(dest); return; }

    toast('info', 'That is the end of this thread', 'Use the ▦ button below to jump to any screen.');
  }

  /* ---------------- boot ---------------- */

  function boot() {
    DB.boot();
    S.vars.setupStep = DB.setupStep();
    restoreSession();

    if (DB.wasResetOnBoot()) {
      setTimeout(function () {
        toast('info', 'Started fresh',
          'The stored data was from too old a build to bring forward, so it was replaced ' +
          'rather than half-converted.');
      }, 400);
    } else if (DB.migratedFrom() !== null) {
      setTimeout(function () {
        toast('ok', 'Your data was brought forward',
          'The prototype changed shape since you last opened it. Everything you had entered ' +
          'was kept — only Start again clears it.');
      }, 400);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('change', function (e) {
      if (e.target.id === 'c-flow') {
        var v = e.target.value;
        if (v) startFlow(v); else { S.flow = null; render(); }
      }
      if (e.target.id === 'c-role') {
        S.role = e.target.value;
        S.flow = null;
        var d = SCREENS[S.screen];
        if (d && d.nav && S.role === 'nurse' && NURSE_ALLOWED.indexOf(d.nav) === -1) S.screen = 'dash.home';
        toast('info', 'Now viewing as ' + DATA.ROLE_LABEL[S.role], 'The menu and dashboard change with the role.');
        render();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && S.overlay) { S.overlay = false; paintOverlay(); }
      if (e.key === 'ArrowRight' && S.flow && !e.target.closest('input,textarea')) next();
    });
    render();
  }

  return {
    state: state, user: user, agency: agency, go: go, next: next, advance: advance,
    startFlow: startFlow, reset: reset, toast: toast, render: render, boot: boot, counts: counts
  };
})();
