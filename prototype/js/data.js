/* ============================================================
   DATA — a thin read-only view over DB.

   Screens still say DATA.CLIENTS and DATA.inAgency(...) exactly as
   before, but every collection is now a getter reading whatever is
   actually in the store. Nothing is hardcoded here any more.
   ============================================================ */

var DATA = (function () {

  var ROLE_LABEL = { superadmin: 'Super Admin', admin: 'Admin staff', nurse: 'Nurse' };

  /* ---------------- helpers ---------------- */

  function money(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function authCalc(a, usedOverride) {
    var used = (usedOverride === undefined || usedOverride === null) ? a.used : usedOverride;
    var left = a.units - used;
    var pc = Math.round((used / a.units) * 1000) / 10;
    return {
      units: a.units,
      used: used,
      left: left,
      pc: pc,
      hoursTotal: a.units / 4,
      hoursUsed: used / 4,
      hoursLeft: left / 4,
      dollarsTotal: a.units * a.rate,
      dollarsUsed: used * a.rate,
      dollarsLeft: left * a.rate,
      band: pc >= 100 ? 'bad' : (pc >= 75 ? 'warn' : 'ok')
    };
  }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function inAgency(list, agency) {
    if (!list || !list.length) return [];
    if (!agency) return list.slice();
    var out = [];
    for (var i = 0; i < list.length; i++) if (list[i].agency === agency) out.push(list[i]);
    return out;
  }

  /* Agencies keyed by id, for the header switcher and lookups. */
  function agencyMap() {
    var m = {};
    DB.all('agencies').forEach(function (a) { m[a.id] = a; });
    return m;
  }

  /* One account per role, for the shell. */
  function usersByRole() {
    var m = {};
    DB.all('users').forEach(function (u) { if (!m[u.role]) m[u.role] = u; });
    return { owner: m.superadmin, admin: m.admin, nurse: m.nurse };
  }

  /* Never throws, even before any agency exists. */
  function agencyShort(id) {
    var a = agencyMap()[id];
    return (a && a.short) || '—';
  }

  var API = {
    ROLE_LABEL: ROLE_LABEL, agencyShort: agencyShort,
    money: money, authCalc: authCalc, byId: byId, inAgency: inAgency
  };

  /* Collections, read live from the store on every access. */
  var COLLECTIONS = {
    CLIENTS: 'clients', CAREGIVERS: 'caregivers', AUTHS: 'auths', USAGE: 'usage',
    INCIDENTS: 'incidents', HOSPS: 'hosps', QI: 'qi', ISP: 'isp',
    OVERSIGHT: 'oversight', TASKS: 'tasks', AUDIT: 'audit',
    PROGRAMMES: 'programmes', USERLIST: 'users'
  };

  Object.keys(COLLECTIONS).forEach(function (name) {
    Object.defineProperty(API, name, { get: function () { return DB.all(COLLECTIONS[name]); } });
  });

  Object.defineProperty(API, 'AGENCIES',    { get: agencyMap });
  Object.defineProperty(API, 'USERS',       { get: usersByRole });
  Object.defineProperty(API, 'CREDENTIALS', { get: function () { return DB.all('credentials') || {}; } });
  /* ---------------- derived client state ----------------
     A client record stores only what was imported. Everything a manager
     sees about them — paperwork state, budget pressure, recent incidents —
     is worked out from the records that actually exist. */

  function docsFor(clientId) {
    return DB.all('clientDocs').filter(function (d) { return d.client === clientId; });
  }

  function paperwork(clientId) {
    var docs = docsFor(clientId);
    var required = docs.filter(function (d) { return d.required !== false; });
    var onFile   = required.filter(function (d) { return d.status === 'On file'; }).length;
    var missing  = required.filter(function (d) { return d.status === 'Missing'; }).length;
    var expired  = required.filter(function (d) { return d.status === 'Expired'; }).length;
    return {
      total: required.length, onFile: onFile, missing: missing, expired: expired,
      started: docs.length > 0,
      complete: required.length > 0 && onFile === required.length
    };
  }

  /* Everything worth flagging on the client list, derived live. */
  function signals(c) {
    var out = [];

    DB.all('auths').filter(function (a) { return a.client === c.id; }).forEach(function (a) {
      var pc = authCalc(a).pc;
      if (pc >= 75) out.push({ label: 'Budget ' + pc + '%', kind: pc >= 100 ? 'bad' : 'warn' });
    });

    var open = DB.all('incidents').filter(function (i) {
      return i.client === c.id && i.status !== 'Closed';
    }).length;
    if (open) out.push({ label: open + (open === 1 ? ' open incident' : ' open incidents'), kind: 'warn' });

    if (DB.all('hosps').some(function (h) { return h.client === c.id && /^Open/.test(h.status || ''); })) {
      out.push({ label: 'In hospital', kind: 'info' });
    }

    if (c.agreement && c.agreement.status === 'Due soon') {
      out.push({ label: 'Agreement expiring', kind: 'warn' });
    }

    var pw = paperwork(c.id);
    if (pw.expired) out.push({ label: 'Document expired', kind: 'bad' });
    if (pw.missing) out.push({ label: pw.missing + ' document' + (pw.missing === 1 ? '' : 's') + ' missing', kind: 'bad' });

    return out;
  }

  API.docsFor = docsFor;
  API.paperwork = paperwork;
  API.signals = signals;

  /* Kept for the client checklist screen, which shows one client at a time. */
  Object.defineProperty(API, 'CHECKLIST', { get: function () {
    var first = DB.all('clients')[0];
    return first ? docsFor(first.id) : [];
  } });

  /* The sample spreadsheet is demo material, not a stored record. */
  Object.defineProperty(API, 'IMPORT_FILE', { get: function () { return DEMO.importFile; } });

  /* Emptiness is a real state now, not a toggle. */
  API.isEmpty  = function () { return DB.isFresh(); };
  API.setEmpty = function () {};

  return API;
})();
