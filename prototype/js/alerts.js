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
      if (i.status === 'Closed') return;
      var late = i.status === 'Follow-up overdue';
      out.push({ kind: late ? 'Overdue' : 'Open',
                 what: late ? 'Follow-up visit not completed' : i.type + ' under investigation',
                 who: i.clientName + ' · ' + i.when.split(',')[0] + ' · ' + i.assigned,
                 when: late ? i.ageDays + ' days late' : 'due ' + i.due,
                 goto:'inc.detail' });
    });

    /* --- scheduled reviews --- */
    DATA.inAgency(DATA.OVERSIGHT, agency).forEach(function (o) {
      if (o.status !== 'Overdue' && o.status !== 'Due soon') return;
      out.push({ kind:o.status, what:o.type + (o.status === 'Overdue' ? ' not done' : ' due'),
                 who:o.clientName + ' · ' + o.who, when:'due ' + o.due,
                 goto: o.type === 'HRST' ? 'ov.hrst' : o.type === 'DDP review' ? 'ov.ddp' : 'ov.list' });
    });

    /* --- caregiver credentials --- */
    var creds = DATA.CREDENTIALS || {};
    DATA.inAgency(DATA.CAREGIVERS, agency).forEach(function (g) {
      (creds[g.id] || []).forEach(function (c) {
        if (c.status !== 'expired' && c.status !== 'soon') return;
        out.push({ kind: c.status === 'expired' ? 'Expired' : 'Due soon',
                   what: c.name + (c.status === 'expired' ? ' expired' : ' expiring'),
                   who: g.name + ' · caregiver', when: c.due, goto:'cg.detail' });
      });
    });

    /* --- client paperwork --- */
    DATA.inAgency(DATA.CLIENTS, agency).forEach(function (c) {
      var pw = DATA.paperwork(c.id);
      if (!pw.started || pw.complete) return;
      if (pw.expired) out.push({ kind:'Expired', what:'A required document has expired',
                                 who:c.name + ' · waiver paperwork', when:'renew it', goto:'clients.checklist' });
      if (pw.missing) out.push({ kind:'Missing',
                                 what: pw.missing + ' required document' + (pw.missing === 1 ? '' : 's') + ' not on file',
                                 who:c.name + ' · waiver paperwork',
                                 when: pw.onFile + ' of ' + pw.total + ' filed', goto:'clients.checklist' });
    });

    /* --- agreements running out --- */
    DATA.inAgency(DATA.CLIENTS, agency).forEach(function (c) {
      if (!c.agreement || c.agreement.status !== 'Due soon') return;
      out.push({ kind:'Due soon', what:'Service agreement expires',
                 who:c.name, when:c.agreement.end, goto:'clients.list' });
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

    out.sort(function (a, b) { return (RANK[a.kind] || 9) - (RANK[b.kind] || 9); });
    return out;
  }

  /* Recent completed work, for the "this week" panel. */
  function recent(agency) {
    var out = [];
    DATA.inAgency(DATA.OVERSIGHT, agency).forEach(function (o) {
      if (o.status !== 'Completed') return;
      out.push({ state:'ok', what:o.type + ' reviewed', who:o.clientName + ' · ' + o.due + ' · ' + o.who });
    });
    DATA.inAgency(DATA.QI, agency).forEach(function (q) {
      if (!q.auto) return;
      out.push({ state:'bad', what:'Quality item opened automatically', who:q.clientName + ' · ' + q.opened });
    });
    DATA.inAgency(DATA.OVERSIGHT, agency).forEach(function (o) {
      if (o.status !== 'Due soon') return;
      out.push({ state:'now', what:o.type + ' due', who:o.clientName + ' · ' + o.due + ' · ' + o.who });
    });
    return out.slice(0, 5);
  }

  /* Caregiver compliance counts. */
  function compliance(agency) {
    var list = DATA.inAgency(DATA.CAREGIVERS, agency);
    return {
      expired: list.filter(function (g) { return g.worst === 'expired'; }).length,
      soon:    list.filter(function (g) { return g.worst === 'soon'; }).length,
      ok:      list.filter(function (g) { return g.worst === 'ok'; }).length,
      total:   list.length
    };
  }

  return { compute: compute, recent: recent, compliance: compliance };
})();
