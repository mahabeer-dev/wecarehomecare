/* ============================================================
   Sign in — including the wrong-password and loading states
   ============================================================ */

(function () {

  function art() {
    return '<div class="auth-art">' +
      '<img src="assets/logo.svg" width="46" height="46" alt="">' +
      '<h2>One place for everything that is due, late or running out.</h2>' +
      '<p>Compliance, quality, oversight, authorisations and reporting across both agencies — ' +
      'sitting alongside your EMR, not replacing it.</p>' +
      '<div class="bullets">' +
        '<div><i class="dot"></i><span>Tasks, reminders and overdue alerts in one dashboard</span></div>' +
        '<div><i class="dot"></i><span>NOW/COMP budget utilisation calculated for you</span></div>' +
        '<div><i class="dot"></i><span>Incidents, hospitalisations and quality tracked end to end</span></div>' +
        '<div><i class="dot"></i><span>Every change recorded in an audit trail</span></div>' +
      '</div>' +
    '</div>';
  }

  function form(inner) {
    return '<div class="auth">' + art() +
      '<div class="auth-form"><div class="inner">' + inner + '</div></div></div>';
  }

  var DEMO_PW = 'wechc-2026';

  function typedPassword() {
    var el = document.getElementById('pw');
    return el ? String(el.value || '').trim() : '';
  }

  var ACCOUNTS = [
    { key:'owner', email:'dawn.bostock@wecarehomecare.com',  name:'Dawn Bostock',  title:'Owner · sees both agencies',       role:'superadmin', agency:'ga', cls:'' },
    { key:'admin', email:'renee.alcott@wecarehomecare.com',  name:'Renee Alcott',  title:'Office Manager · Georgia only',    role:'admin',      agency:'ga', cls:'c2' },
    { key:'nurse', email:'yvonne.pryce@wecarehomecare.com',  name:'Yvonne Pryce',  title:'Registered Nurse · Georgia only',  role:'nurse',      agency:'ga', cls:'c3' }
  ];

  function accountFor(key) {
    for (var i = 0; i < ACCOUNTS.length; i++) if (ACCOUNTS[i].key === key) return ACCOUNTS[i];
    return ACCOUNTS[1];
  }

  /* exposed so the router can apply the chosen account on a successful sign-in */
  window.AUTH_ACCOUNTS = { list: ACCOUNTS, get: accountFor };

  function picker(S) {
    var sel = S.vars.loginAs || 'admin';
    var h = '<div class="field"><label>Sign in as</label>' +
            '<div style="display:flex;flex-direction:column;gap:6px">';
    ACCOUNTS.forEach(function (a) {
      var on = a.key === sel;
      h += '<button class="card" data-login-as="' + a.key + '" ' +
           'style="padding:10px 12px;text-align:left;cursor:pointer;' +
           (on ? 'border-color:var(--p-500);box-shadow:0 0 0 3px var(--p-100)' : '') + '">' +
           '<span class="row" style="gap:10px">' +
             '<span class="ava-sm ' + a.cls + '">' + UI.esc(UI.initials(a.name)) + '</span>' +
             '<span style="display:flex;flex-direction:column;min-width:0">' +
               '<b class="small">' + UI.esc(a.name) + '</b>' +
               '<span class="small muted">' + UI.esc(a.title) + '</span>' +
             '</span>' +
             '<span class="spacer"></span>' +
             (on ? UI.badge('Selected', 'plum') : '') +
           '</span></button>';
    });
    return h + '</div><span class="hint">Three real roles. Sign out from the sidebar to swap.</span></div>';
  }

  screen('auth.login', {
    title: 'Sign in',
    chrome: false,
    /* Read what was actually typed instead of always failing. */
    intercept: function (S) {
      var pw = typedPassword();
      if (pw === DEMO_PW) { S.vars.authErr = null; return 'auth.loading'; }
      S.vars.authErr = pw ? 'wrong' : 'empty';
      S.vars.authTried = pw;
      return 'auth.error';
    },
    render: function (S) {
      var a = accountFor(S.vars.loginAs || 'admin');
      return form(
        '<span class="eyebrow-m">We Care Home Care</span>' +
        '<h1 style="margin:0;font-size:26px;font-weight:650;letter-spacing:-.02em">Sign in</h1>' +
        '<p class="small muted" style="margin:0 0 4px">Administration and clinical staff only. ' +
        'Caregivers do not have accounts.</p>' +
        picker(S) +
        UI.field('Work email', { type: 'email', value: a.email }) +
        UI.field('Password', { type: 'password', id: 'pw', value: '', placeholder: 'Enter your password' }) +
        '<p class="small muted" style="margin:-6px 0 0">Demo password: <b class="mono">' + DEMO_PW + '</b></p>' +
        UI.btn('Sign in', { cls: 'btn--primary btn--lg btn--block', icon: 'arrow' }) +
        '<p class="small muted" style="margin:2px 0 0;text-align:center">Forgot your password?</p>'
      );
    }
  });

  screen('auth.error', {
    title: 'Wrong password',
    chrome: false,
    /* Second attempt always gets through — a prototype must never trap you. */
    intercept: function (S) { S.vars.authErr = null; return 'auth.loading'; },
    render: function (S) {
      var empty = S.vars.authErr === 'empty';
      var a = accountFor(S.vars.loginAs || 'admin');
      return form(
        '<span class="eyebrow-m">We Care Home Care</span>' +
        '<h1 style="margin:0;font-size:26px;font-weight:650;letter-spacing:-.02em">Sign in</h1>' +
        '<p class="small muted" style="margin:0 0 4px">Administration and clinical staff only. ' +
        'Caregivers do not have accounts.</p>' +
        picker(S) +
        UI.field('Work email', { type: 'email', value: a.email }) +
        UI.field('Password', {
          type: 'password', id: 'pw', bad: true,
          value: empty ? '' : (S.vars.authTried || 'wrongpass'),
          err: empty
            ? 'Enter your password to continue.'
            : 'That password is not correct. Two attempts remaining before the account locks.'
        }) +
        '<p class="small muted" style="margin:-6px 0 0">Demo password: <b class="mono">' + DEMO_PW + '</b></p>' +
        UI.btn('Sign in', { cls: 'btn--primary btn--lg btn--block', icon: 'arrow' }) +
        '<p class="small muted" style="margin:2px 0 0;text-align:center">Forgot your password?</p>'
      );
    }
  });

  screen('auth.loading', {
    title: 'Signing in',
    chrome: false,
    auto: true, autoMs: 1300,
    render: function () {
      return form(
        '<span class="eyebrow-m">We Care Home Care</span>' +
        '<h1 style="margin:0;font-size:26px;font-weight:650;letter-spacing:-.02em">Signing you in…</h1>' +
        '<div class="skel" style="height:44px"></div>' +
        '<div class="skel" style="height:44px"></div>' +
        '<div class="skel" style="height:46px;width:60%"></div>' +
        '<p class="small muted" style="margin:4px 0 0">Checking your role and agency access.</p>'
      );
    }
  });

  screen('auth.agency', {
    title: 'Choose an agency',
    chrome: false,
    render: function () {
      return form(
        '<span class="eyebrow-m">Super Admin</span>' +
        '<h1 style="margin:0;font-size:26px;font-weight:650;letter-spacing:-.02em">Which agency?</h1>' +
        '<p class="small muted" style="margin:0 0 6px">You are the only account that can see both. ' +
        'You can switch at any time from the header.</p>' +

        '<button class="card card--click" style="padding:16px 18px;text-align:left;border-radius:11px">' +
          '<div class="row"><span class="ava-sm">GA</span>' +
          '<span style="display:flex;flex-direction:column"><b>Georgia</b>' +
          '<span class="small muted">5 clients · NOW and COMP waivers</span></span>' +
          '<span class="spacer"></span>' + UI.icon('arrow') + '</div>' +
        '</button>' +

        '<button class="card card--click" style="padding:16px 18px;text-align:left;border-radius:11px">' +
          '<div class="row"><span class="ava-sm c2">MS</span>' +
          '<span style="display:flex;flex-direction:column"><b>Mississippi</b>' +
          '<span class="small muted">3 clients · IDD Community Supports</span></span>' +
          '<span class="spacer"></span>' + UI.icon('arrow') + '</div>' +
        '</button>' +

        '<p class="small muted" style="margin:4px 0 0">Staff other than you are locked to a single agency and never see the other one.</p>'
      );
    }
  });

  screen('auth.denied', {
    title: 'No access',
    chrome: false,
    render: function () {
      return form(
        '<span class="eyebrow-m" style="color:var(--r-500)">Access denied</span>' +
        '<h1 style="margin:0;font-size:26px;font-weight:650;letter-spacing:-.02em">You cannot open this area</h1>' +
        UI.banner('bad', 'Nurses do not have access to Settings',
          'Your role can see clients, incidents, hospitalisations, reviews and your own visits. ' +
          'Ask a Super Admin if you think this is wrong.') +
        UI.btn('Back to my dashboard', { cls: 'btn--primary btn--block', goto: 'dash.home' })
      );
    }
  });

})();
