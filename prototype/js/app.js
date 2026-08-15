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

  var DEFAULTS = { role: 'admin', agency: 'ga', screen: 'auth.login', flow: null, step: 0 };

  /* ---------------- state ---------------- */

  function state() { return S; }

  function user() {
    if (S.role === 'superadmin') return DATA.USERS.owner;
    if (S.role === 'nurse') return DATA.USERS.nurse;
    return DATA.USERS.admin;
  }

  function agency() { return DATA.AGENCIES[S.agency]; }

  function reset() {
    S.role = DEFAULTS.role;
    S.agency = DEFAULTS.agency;
    S.screen = DEFAULTS.screen;
    S.flow = null;
    S.step = 0;
    S.vars = {};
    S.overlay = false;
    S.toasts = [];
    render();
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
    var def = currentDef();

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
    var ag = S.role === 'superadmin' ? null : S.agency;
    var t = DATA.inAgency(DATA.TASKS, ag).filter(function (x) { return x.status === 'Overdue'; }).length;
    var cg = DATA.inAgency(DATA.CAREGIVERS, ag).filter(function (x) { return x.worst !== 'ok'; }).length;
    var inc = DATA.inAgency(DATA.INCIDENTS, ag).filter(function (x) { return x.status !== 'Closed'; }).length;
    var ov = DATA.inAgency(DATA.OVERSIGHT, ag).filter(function (x) { return x.status === 'Overdue' || x.status === 'Due soon'; }).length;
    var b = 0;
    DATA.inAgency(DATA.AUTHS, ag).forEach(function (a) {
      var used = (a.id === 'a1' && S.vars.a1used != null) ? S.vars.a1used : a.used;
      if (DATA.authCalc(a, used).pc >= 75) b++;
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

    h += '<div class="nav-foot"><span class="who">' + UI.esc(u.name) + '</span>' +
         '<span class="whorole">' + DATA.ROLE_LABEL[S.role] +
         (S.role === 'superadmin' ? ' · both agencies' : ' · ' + agency().short) + '</span></div>';

    return h + '</aside>';
  }

  function topbar(def) {
    var h = '<header class="topbar">';
    h += '<span class="crumb">' + (def.crumb || '<b>' + UI.esc(def.title || '') + '</b>') + '</span>';
    h += '<span class="topbar-spacer"></span>';

    if (S.role === 'superadmin') {
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
    'cg.detail': 'cg.renew',
    'cg.renew': 'cg.expiry',
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

  /* ---------------- click delegation ---------------- */

  var ADVANCERS = 'button, a, [role="button"], tr[data-row], .stat, .card--click, .clist-row, ' +
                  '.fchip, .radio-chip, .check, .emrlink, .linkish, .searchbox, .avatar';

  function onClick(e) {
    var t = e.target;
    if (!t.closest) return;

    /* --- demo chrome --- */
    var chromeBtn = t.closest('#c-reset, #c-next, #c-index, #ovl-x');
    if (chromeBtn) {
      if (chromeBtn.id === 'c-reset') reset();
      else if (chromeBtn.id === 'c-next') next();
      else if (chromeBtn.id === 'c-index') { S.overlay = !S.overlay; paintOverlay(); }
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
