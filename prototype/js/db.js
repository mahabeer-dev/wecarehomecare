/* ============================================================
   DB — the prototype's data store.

   Everything the user creates is written to the browser's own
   localStorage and survives a refresh, a close and a reopen.
   There is no server and no backend database.

   Fresh install  → seeded from SEED (one account, nothing else)
   "Load demo data" → merges the populated DEMO agency in
   "Start again"    → wipes back to SEED

   localStorage is used rather than IndexedDB because it is
   synchronous, which keeps every screen a plain function that
   returns a string, and 5MB is far more than this needs.
   ============================================================ */

var DB = (function () {

  var KEY = 'wechc.prototype.v1';

  /* The shape of the data has a version. When it moves, what is already
     stored is brought forward step by step — never thrown away. Somebody
     who has spent an hour setting the system up should lose that only when
     they ask to, by pressing Start again. */
  var SCHEMA = 8;

  var state = null;
  var storageWorks = true;
  var wasReset = false;
  var migrated = null;

  /* ---------------- storage ---------------- */

  function readStore() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      storageWorks = false;   // private browsing, or a locked-down file:// origin
      return null;
    }
  }

  function writeStore() {
    if (!storageWorks) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      storageWorks = false;
    }
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------------- lifecycle ---------------- */

  function fresh() {
    var f = clone(SEED);
    f.schema = SCHEMA;
    return f;
  }

  /* One step per version. Each takes a store at version n and returns it at
     n+1. They run in order, so a store from any earlier build catches up. */
  var MIGRATIONS = {

    /* Authorisations stopped being a setup step, so setup finishes at six. */
    3: function (st) {
      if (st.settings && st.settings.setupStep > 6) st.settings.setupStep = 6;
      return st;
    },

    /* The demo became a snapshot of one particular day. Nothing to change in
       a real store — a demo store gets its anchor from loadDemo(). */
    4: function (st) { return st; },

    /* Georgia began shipping with the platform. A store that never had an
       agency gets it; one that already has agencies is left alone. */
    5: function (st) {
      if (!st.agencies || !st.agencies.length) {
        st.agencies = clone(SEED.agencies);
        (st.programmes || []).forEach(function (p) {
          if (!p.agency) p.agency = st.agencies[0].id;
        });
      }
      return st;
    },

    /* Waiver documents stopped carrying a written status and started
       carrying the dates the status is worked out from. */
    6: function (st) {
      (st.clientDocs || []).forEach(function (d, n) {
        if (!d.id) d.id = 'cd-' + (d.client || 'x') + '-' + n;
        if (d.renews === undefined) d.renews = !!(d.expires && d.expires !== '\u2014');
        if (d.period === undefined) d.period = '\u2014';
        if (d.status === 'Missing') { d.received = '\u2014'; d.expires = '\u2014'; }
        delete d.status;
      });
      return st;
    },

    /* Incidents stopped carrying a written status too. An old record that
       said Closed becomes one that was closed, with a follow-up to match. */
    7: function (st) {
      (st.incidents || []).forEach(function (i, n) {
        if (!i.id) i.id = 'i-' + n;
        if (i.notified === undefined) i.notified = [];
        if (i.status === 'Closed' && !i.closed) {
          i.closed = { on: i.due || '\u2014', by: i.assigned || 'System' };
          if (!i.followUp) i.followUp = { on: i.due || '\u2014', by: i.assigned || 'System', note: '' };
        }
        delete i.status;
        delete i.ageDays;
        delete i.triggeredQI;
      });
      return st;
    }
  };

  function migrate(st) {
    var from = st.schema || 0;
    if (from >= SCHEMA) return st;
    for (var v = from; v < SCHEMA; v++) {
      var step = MIGRATIONS[v];
      if (step) st = step(st);
    }
    st.schema = SCHEMA;
    migrated = from;
    return st;
  }

  function boot() {
    var stored = readStore();

    /* A store older than the migration chain cannot be brought forward
       honestly, so that one is replaced rather than half-converted. */
    if (stored && (stored.schema || 0) < 3) { stored = null; wasReset = true; }

    if (stored) {
      try { stored = migrate(stored); }
      catch (e) { stored = null; wasReset = true; migrated = null; }
    }

    state = stored || fresh();
    /* fill in anything a newer build added */
    var blank = fresh();
    for (var k in blank) if (!(k in state)) state[k] = blank[k];
    state.schema = SCHEMA;

    /* Every row a screen can act on needs an id to act on it by. Rows written
       before a collection had ids would otherwise render buttons that quietly
       do nothing. */
    ['clientDocs', 'creds', 'auths', 'incidents', 'qi'].forEach(function (coll) {
      (state[coll] || []).forEach(function (r, n) {
        if (!r.id) r.id = coll.charAt(0) + '-' + n + '-' + (r.client || r.caregiver || 'x');
      });
    });

    writeStore();
    return state;
  }

  /* True only when a store was too old to bring forward and had to be replaced. */
  function wasResetOnBoot() { return wasReset; }

  /* The version a store was brought forward from, or null if it was already current. */
  function migratedFrom() { return migrated; }

  function startAgain() {
    state = fresh();
    clearSession();
    writeStore();
  }

  /* ---------------- the session ----------------
     Who is signed in and what they were looking at, kept apart from the
     records so that clearing one never clears the other. A refresh puts
     you back where you were; Start again is what forgets you. */

  var SKEY = KEY + '.session';

  function session() {
    try {
      var raw = window.localStorage.getItem(SKEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setSession(o) {
    if (!storageWorks) return;
    try { window.localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {}
  }

  function clearSession() {
    try { window.localStorage.removeItem(SKEY); } catch (e) {}
  }

  /* An untouched install. Georgia ships with the platform, so its presence
     is not evidence that anybody has done anything yet — an agency the user
     added is. */
  function isFresh() {
    return !state.clients.length &&
           !state.caregivers.length &&
           state.users.length === 1 &&
           state.agencies.every(function (a) { return a.seeded; });
  }

  /* ---------------- demo data ---------------- */

  function loadDemo() {
    state.agencies   = [clone(DEMO.agencies.ga), clone(DEMO.agencies.ms)];
    var nowDocs = clone(fresh().programmes[0].docs);
    state.programmes = [
      { id:'p-now',  name:'NOW',  fullName:'New Options Waiver',            agency:'ga', docs: nowDocs },
      { id:'p-comp', name:'COMP', fullName:'Comprehensive Supports Waiver', agency:'ga', docs: clone(nowDocs) },
      { id:'p-idd',  name:'IDD Community Supports',                          agency:'ms', docs: clone(nowDocs).slice(0, 6) }
    ];
    if (state.users.length === 1) {
      state.users.push(clone(DEMO.users.admin));
      state.users.push(clone(DEMO.users.nurse));
    }
    state.clients     = clone(DEMO.clients);
    state.clientDocs  = [];
    var template = clone(fresh().programmes[0].docs);
    state.clients.forEach(function (c, ci) {
      template.forEach(function (d, di) {
        /* the first client has a gap and an expiry, everyone else is in order.
           No status is written down — the dates alone decide it. */
        var gap = (ci === 0 && d.name === 'Physician order for services') ||
                  (ci === 2 && di > 6);
        var stale = (ci === 0 && d.name === 'Annual health assessment');
        state.clientDocs.push({
          id: 'cd-' + c.id + '-' + di,
          client: c.id, name: d.name, required: d.required !== false,
          renews: !!d.expires, period: d.period || '—',
          received: gap ? '—' : '01 Jan 2026',
          expires: d.expires ? (gap ? '—' : stale ? '11 Feb 2026' : '31 Dec 2026') : '—'
        });
      });
    });
    state.caregivers  = clone(DEMO.caregivers);
    state.creds = [];
    var CRED = clone(DEMO.credentials || {});
    state.caregivers.forEach(function (g) {
      (CRED[g.id] || [
        { name:"Driver's licence", done:'20 Jun 2023', due:'20 Jun 2027', status:'ok' },
        { name:'CPR / First Aid',  done:'11 Mar 2025', due:'11 Mar 2027', status:'ok' },
        { name:'Annual training',  done:'02 Feb 2026', due:'02 Feb 2027', status:'ok' },
        { name:'Background check', done:'14 Jul 2024', due:'14 Jul 2028', status:'ok' }
      ]).forEach(function (c) {
        state.creds.push({ id: 'cr-' + g.id + '-' + c.name.replace(/[^a-z]/gi, '').toLowerCase(),
                           caregiver: g.id, name: c.name, done: c.done, due: c.due, status: c.status });
      });
    });
    state.credentials = clone(DEMO.credentials);
    state.auths       = clone(DEMO.auths);
    state.usage       = clone(DEMO.usage);
    state.incidents   = clone(DEMO.incidents);
    state.hosps       = clone(DEMO.hosps);
    state.qi          = clone(DEMO.qi);
    state.isp         = clone(DEMO.isp);
    state.oversight   = clone(DEMO.oversight);
    state.tasks       = clone(DEMO.tasks);
    state.audit       = clone(DEMO.audit);
    state.settings.setupStep = 6;
    /* The demo is a system frozen on one day. Dates are read against this
       rather than the real clock, so the story reads the same in any year. */
    state.settings.today = '2026-05-05';
    writeStore();
  }

  /* ---------------- reading and writing ---------------- */

  function all(coll) {
    var v = state[coll];
    if (v === undefined || v === null) return [];
    return v;                      /* credentials is an object, not a list */
  }

  function get(coll, id) {
    var list = all(coll);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function add(coll, rec, note) {
    if (!state[coll]) state[coll] = [];
    if (!rec.id) rec.id = coll.charAt(0) + '-' + (state[coll].length + 1) + '-' + Math.floor(Math.random() * 1e6);
    state[coll].push(rec);
    if (note) log(note.who, note.what, note.why);
    writeStore();
    return rec;
  }

  function addMany(coll, recs, note) {
    recs.forEach(function (r) { add(coll, r); });
    if (note) log(note.who, note.what, note.why);
    writeStore();
    return recs;
  }

  function update(coll, id, patch) {
    var rec = get(coll, id);
    if (!rec) return null;
    for (var k in patch) rec[k] = patch[k];
    writeStore();
    return rec;
  }

  function setCollection(coll, value) {
    state[coll] = value;
    writeStore();
    return value;
  }

  function remove(coll, id) {
    state[coll] = all(coll).filter(function (r) { return r.id !== id; });
    writeStore();
  }

  /* ---------------- settings ---------------- */

  function settings() { return state.settings; }

  function setSetting(path, value) {
    var parts = path.split('.'), o = state.settings;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]] = o[parts[i]] || {};
    o[parts[parts.length - 1]] = value;
    writeStore();
  }

  function setupStep(n) {
    if (n !== undefined) { state.settings.setupStep = n; writeStore(); }
    return state.settings.setupStep || 0;
  }

  /* ---------------- audit ---------------- */

  function log(who, what, why) {
    state.audit.unshift({ when: stamp(), who: who || 'System', what: what, why: why || '—' });
    if (state.audit.length > 300) state.audit.pop();
    writeStore();
  }

  function stamp() {
    var d = new Date();
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return pad(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() +
           ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /* ---------------- diagnostics ---------------- */

  function persists() { return storageWorks; }

  function stats() {
    var out = {};
    ['users','agencies','programmes','clients','caregivers','auths','incidents',
     'hosps','qi','oversight','tasks','audit'].forEach(function (k) { out[k] = all(k).length; });
    return out;
  }

  return {
    boot: boot, startAgain: startAgain, isFresh: isFresh, loadDemo: loadDemo,
    all: all, get: get, add: add, addMany: addMany, update: update, remove: remove,
    setCollection: setCollection,
    settings: settings, setSetting: setSetting, setupStep: setupStep,
    wasResetOnBoot: wasResetOnBoot, migratedFrom: migratedFrom,
    session: session, setSession: setSession, clearSession: clearSession,
    log: log, stamp: stamp, persists: persists, stats: stats
  };
})();
