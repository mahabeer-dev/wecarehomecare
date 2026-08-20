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
  var state = null;
  var storageWorks = true;

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

  function fresh() { return clone(SEED); }

  function boot() {
    state = readStore() || fresh();
    /* a stored copy from an older build may be missing newer collections */
    var blank = fresh();
    for (var k in blank) if (!(k in state)) state[k] = blank[k];
    writeStore();
    return state;
  }

  function startAgain() {
    state = fresh();
    writeStore();
  }

  function isFresh() {
    return !state.agencies.length && !state.clients.length && state.users.length === 1;
  }

  /* ---------------- demo data ---------------- */

  function loadDemo() {
    state.agencies   = [clone(DEMO.agencies.ga), clone(DEMO.agencies.ms)];
    state.programmes = [
      { id:'p-now',  name:'NOW',  agency:'ga', docs: clone(DEMO.checklist) },
      { id:'p-comp', name:'COMP', agency:'ga', docs: clone(DEMO.checklist) },
      { id:'p-idd',  name:'IDD Community Supports', agency:'ms', docs: [] }
    ];
    if (state.users.length === 1) {
      state.users.push(clone(DEMO.users.admin));
      state.users.push(clone(DEMO.users.nurse));
    }
    state.clients     = clone(DEMO.clients);
    state.caregivers  = clone(DEMO.caregivers);
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
    state.settings.setupStep = 7;
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
    log: log, stamp: stamp, persists: persists, stats: stats
  };
})();
