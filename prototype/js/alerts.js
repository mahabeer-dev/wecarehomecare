/* ============================================================
   ALERTS — what the dashboard shows.

   Everything here is derived from records actually in the store.
   Nothing is hardcoded: an empty system produces an empty list,
   which is the whole point.

   In the real product a nightly job would work these out from
   dates. Here the records carry their own status, which is the
   same shape of answer without inventing a clock.
   ============================================================ */

var ALERTS = (function () {

  var RANK = { Overdue: 0, Expired: 1, Missing: 2, 'Due soon': 3, Open: 4 };

  function compute(agency) {
    var out = [];

    /* --- tasks --- */
    DATA.inAgency(DATA.TASKS, agency).forEach(function (t) {
      if (t.status !== 'Overdue') return;
      out.push({ kind:'Overdue', what:t.title, who:t.linked + ' · ' + t.owner,
                 when:'due ' + t.due, goto:'tasks.list' });
    });

    /* --- incidents without a completed follow-up --- */
    DATA.inAgency(DATA.INCIDENTS, agency).forEach(function (i) {
      var st = DATA.incidentState(i);
      if (st.key === 'closed') return;
      if (st.key === 'done') return;          /* done, just not signed off yet */
      out.push({ kind: st.key === 'overdue' ? 'Overdue' : 'Open',
                 what: st.key === 'overdue' ? 'Follow-up visit not completed'
                                            : i.type + ' awaiting follow-up',
                 who: i.clientName + ' · ' + i.when.split(',')[0] + ' · ' + i.assigned,
                 when: st.key === 'overdue' ? st.days + ' days late' : 'due ' + i.due,
                 setVar:'incId', id: i.id, goto:'inc.detail' });
    });

    /* --- scheduled reviews --- */
    DATA.inAgency(DATA.OVERSIGHT, agency).forEach(function (o) {
      if (o.status !== 'Overdue' && o.status !== 'Due soon') return;
      out.push({ kind:o.status, what:o.type + (o.status === 'Overdue' ? ' not done' : ' due'),
                 who:o.clientName + ' · ' + o.who, when:'due ' + o.due,
                 goto: o.type === 'HRST' ? 'ov.hrst' : o.type === 'DDP review' ? 'ov.ddp' : 'ov.list' });
    });

    /* --- caregiver credentials --- */
    DATA.inAgency(DATA.CAREGIVERS, agency).forEach(function (g) {
      DATA.credsFor(g.id).forEach(function (c) {
        if (c.status !== 'expired' && c.status !== 'soon') return;   /* replaced ones are history */
        out.push({ kind: c.status === 'expired' ? 'Expired' : 'Due soon',
                   what: c.name + (c.status === 'expired' ? ' expired' : ' expiring'),
                   who: g.name + ' · caregiver', when: c.due,
                   setVar:'cgId', id: g.id, goto:'cg.detail' });
      });
    });

    /* --- client paperwork ---
       One line per document, not one per client. Ten documents outstanding
       is ten things somebody has to go and collect, and the dashboard is
       meant to be the list of those things. */
    DATA.inAgency(DATA.CLIENTS, agency).forEach(function (c) {
      DATA.docsFor(c.id).forEach(function (d) {
        if (d.required === false) return;
        var st = DATA.docState(d);
        if (st === 'On file') return;
        out.push({
          kind: st === 'Expired' ? 'Expired' : 'Missing',
          what: d.name + (st === 'Expired' ? ' has expired' : ' not on file'),
          who: c.name + ' · ' + (c.waiver || 'waiver') + ' paperwork',
          when: st === 'Expired' ? 'expired ' + d.expires
                                 : !d.renews ? 'one-off'
                                 : /^\d/.test(String(d.period)) ? 'renews every ' + d.period
                                 : String(d.period),
          setVar:'clientId', id: c.id, goto: 'clients.checklist'
        });
      });
    });

    /* --- agreements running out --- */
    DATA.inAgency(DATA.CLIENTS, agency).forEach(function (c) {
      if (!c.agreement || c.agreement.status !== 'Due soon') return;
      out.push({ kind:'Due soon', what:'Service agreement expires',
                 who:c.name, when:c.agreement.end,
                 setVar:'clientId', id:c.id, goto:'clients.agreement' });
    });

    /* --- budget --- */
    DATA.inAgency(DATA.AUTHS, agency).forEach(function (a) {
      var calc = DATA.authCalc(a);
      if (calc.pc < 75) return;
      out.push({ kind: calc.pc >= 100 ? 'Overdue' : 'Due soon',
                 what: calc.pc + '% of the authorisation used',
                 who: a.clientName + ' · ' + a.service,
                 when: DATA.money(calc.dollarsLeft) + ' left', goto:'budget.detail' });
    });

    /* --- hospital stays awaiting a nurse visit --- */
    DATA.inAgency(DATA.HOSPS, agency).forEach(function (hp) {
      if (hp.visitStatus !== 'Overdue') return;
      out.push({ kind:'Overdue', what:'Nurse visit after discharge not done',
                 who:hp.clientName + ' · ' + hp.kind + ' ' + hp.admitted.split(',')[0],
                 when:'due ' + hp.visitDue, goto:'hosp.visit' });
    });

    /* Overdue ranks 0, which is falsy — an "|| 9" fallback here sorted the
       most urgent things to the bottom, where the dashboard cut them off. */
    function rank(kind) { return RANK[kind] === undefined ? 9 : RANK[kind]; }
    out.sort(function (a, b) { return rank(a.kind) - rank(b.kind); });
    return out;
  }

  /* Recent completed work, for the "this week" panel. */
  /* What has actually happened, taken from the audit trail rather than from
     a handful of hand-picked categories. Anything the system did on its own
     is marked, because that is the part worth noticing. */
  function recent(agency) {
    var log = DATA.AUDIT || [];
    if (log.length) {
      return log.slice(0, 5).map(function (e) {
        var auto = e.who === 'System';
        return { state: auto ? 'bad' : 'ok',
                 what: e.what,
                 who: (auto ? 'The system' : e.who) + ' · ' + e.when };
      });
    }

    /* A demo dataset that carries history but no log still has something to show. */
    var out = [];
    DATA.inAgency(DATA.QI, agency).forEach(function (q) {
      if (!q.auto) return;
      out.push({ state:'bad', what:'Quality item opened automatically', who:q.clientName + ' · ' + q.opened });
    });
    DATA.inAgency(DATA.OVERSIGHT, agency).forEach(function (o) {
      if (o.status !== 'Completed') return;
      out.push({ state:'ok', what:o.type + ' reviewed', who:o.clientName + ' · ' + o.due + ' · ' + o.who });
    });
    return out.slice(0, 5);
  }

  /* Caregiver compliance counts. */
  function compliance(agency) {
    var list = DATA.inAgency(DATA.CAREGIVERS, agency);
    var out = { expired: 0, soon: 0, ok: 0, total: list.length };
    list.forEach(function (g) {
      var st = DATA.compliance(g.id).state;
      if (st === 'expired') out.expired++;
      else if (st === 'soon') out.soon++;
      else if (st === 'ok') out.ok++;
    });
    return out;
  }

  return { compute: compute, recent: recent, compliance: compliance };
})();
