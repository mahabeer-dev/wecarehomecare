/* ============================================================
   UI helpers — icons and small render primitives.
   Every function returns an HTML string.
   ============================================================ */

var UI = (function () {

  var P = {
    dash:   'M3 10.5 12 3l9 7.5M5.5 9v11h13V9',
    people: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
    badge:  'M12 3 4.5 6.2v5c0 4.4 3.1 8.5 7.5 9.8 4.4-1.3 7.5-5.4 7.5-9.8v-5L12 3Z',
    check:  'M4.5 12.5 9.5 17.5 19.5 7',
    money:  'M12 3v18M16.5 7.2c-.8-1-2.4-1.7-4.5-1.7-2.7 0-4.3 1.2-4.3 3s1.4 2.6 4.3 3.2c3 .6 4.6 1.4 4.6 3.4s-1.9 3.1-4.6 3.1c-2.3 0-4-.8-4.8-1.9',
    warn:   'M12 3.8 2.6 20h18.8L12 3.8ZM12 10v4.2M12 17.1v.1',
    hosp:   'M4 20V9l8-5 8 5v11M9.5 20v-5h5v5M12 8v4M10 10h4',
    star:   'M12 3.6l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 17l-5.2 2.9 1-5.9L3.5 9.8l5.9-.8L12 3.6Z',
    chart:  'M4 19h16M7 16V9.5M11.5 16V5M16 16v-7',
    cal:    'M4.5 6.5h15v14h-15zM4.5 10.5h15M9 4v3M15 4v3',
    file:   'M6 3h8l4 4v14H6zM14 3v4h4',
    cog:    'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z M19.2 12a7.2 7.2 0 0 0-.1-1.1l2-1.5-2-3.4-2.3.9a7.2 7.2 0 0 0-1.9-1.1L14.5 3h-4l-.4 2.5a7.2 7.2 0 0 0-1.9 1.1l-2.3-.9-2 3.4 2 1.5a7.2 7.2 0 0 0 0 2.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.2.8 1.9 1.1l.4 2.5h4l.4-2.5c.7-.3 1.3-.6 1.9-1.1l2.3.9 2-3.4-2-1.5c.1-.4.1-.7.1-1.1Z',
    clock:  'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5.2l3.4 2',
    list:   'M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01',
    shield: 'M12 3.2 5 6v5.4c0 4 2.9 7.7 7 8.8 4.1-1.1 7-4.8 7-8.8V6l-7-2.8Z',
    plus:   'M12 5v14M5 12h14',
    arrow:  'M5 12h13M12.5 6l6 6-6 6',
    down:   'M12 5v13M6 12.5l6 6 6-6',
    up:     'M12 19V6M6 11.5l6-6 6 6',
    ext:    'M14 4h6v6M20 4l-9 9M18 13.5V20H4V6h6.5',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM16.2 16.2 21 21',
    bell:   'M18 16V11a6 6 0 1 0-12 0v5l-1.6 2.4h15.2L18 16ZM10 20.5a2.2 2.2 0 0 0 4 0',
    x:      'M6 6l12 12M18 6 6 18',
    reset:  'M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 4.5V10h5.5',
    grid:   'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
    flow:   'M6 5.5h12M6 12h12M6 18.5h12M3 5.5h.01M3 12h.01M3 18.5h.01',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v3.5h16V16',
    doc:    'M7 3h7l4 4v14H7zM14 3v4h4M10 12h6M10 16h6',
    lock:   'M6.5 10.5h11v9h-11zM9 10.5V7.5a3 3 0 0 1 6 0v3'
  };

  function icon(name, cls) {
    var d = P[name] || P.list;
    /* .ico is always present so an icon can never render unbounded, whatever
       container it lands in. Variants like .ei only change the size. */
    var klass = 'ico' + (cls && cls !== 'ico' ? ' ' + cls : '');
    return '<svg class="' + klass + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           '<path d="' + d + '"/></svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    var p = String(name).trim().split(/\s+/);
    return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
  }

  /* status -> badge class + label */
  var STATUS_MAP = {
    'On file': 'ok', 'Current': 'ok', 'Completed': 'ok', 'Closed': 'ok', 'Active': 'ok', 'ok': 'ok',
    'Due soon': 'warn', 'soon': 'warn', 'In progress': 'warn', 'Monitoring': 'warn', 'Upcoming': 'neutral',
    'Overdue': 'bad', 'Expired': 'bad', 'expired': 'bad', 'Missing': 'bad', 'Follow-up overdue': 'bad',
    'Open': 'info', 'Under investigation': 'info', 'Not started': 'neutral',
    'Not applicable': 'neutral', 'Not yet due': 'neutral', 'In hospital': 'info', '—': 'neutral'
  };

  function badge(text, forceKind) {
    var kind = forceKind || STATUS_MAP[text] || 'neutral';
    return '<span class="badge badge--' + kind + '"><i class="bd"></i>' + esc(text) + '</span>';
  }

  function stat(o) {
    return '<button class="stat ' + (o.kind ? 'is-' + o.kind : '') + '" data-goto="' + esc(o.goto || '') + '">' +
      '<span class="k">' + esc(o.k) + '</span>' +
      '<span class="v">' + esc(o.v) + '</span>' +
      '<span class="n">' + esc(o.n || '') + '</span>' +
    '</button>';
  }

  function meter(pc, band) {
    var b = band || (pc >= 100 ? 'bad' : pc >= 75 ? 'warn' : '');
    var w = Math.min(100, pc);
    return '<div class="meter">' +
      '<div class="meter-track"><div class="meter-fill ' + b + '" style="width:' + w + '%"></div></div>' +
      '<div class="meter-marks">' +
        '<span class="meter-mark" style="left:75%">75%</span>' +
        '<span class="meter-mark" style="left:90%">90%</span>' +
        '<span class="meter-mark" style="left:100%">100%</span>' +
      '</div>' +
    '</div>';
  }

  /* A plain bar. The budget meter has 75/90/100 marks on it, which mean
     nothing outside a budget. */
  function progress(pc) {
    return '<div class="meter"><div class="meter-track">' +
      '<div class="meter-fill" style="width:' + Math.max(0, Math.min(100, pc)) + '%"></div>' +
      '</div></div>';
  }

  function banner(kind, title, body, actions) {
    return '<div class="banner banner--' + kind + '">' +
      icon(kind === 'ok' ? 'check' : kind === 'info' ? 'bell' : 'warn', 'bi') +
      '<span class="bt"><b>' + esc(title) + '</b>' + (body ? '<span>' + body + '</span>' : '') + '</span>' +
      (actions ? '<span class="ba">' + actions + '</span>' : '') +
    '</div>';
  }

  function btn(label, o) {
    o = o || {};
    return '<button class="btn ' + (o.cls || '') + '"' +
      (o.goto ? ' data-goto="' + esc(o.goto) + '"' : '') + '>' +
      (o.icon ? icon(o.icon) : '') + esc(label) +
    '</button>';
  }

  function field(label, o) {
    o = o || {};
    var inner;
    var id = o.id ? ' id="' + esc(o.id) + '"' : '';
    if (o.type === 'select' && o.options) {
      inner = '<select class="select" data-inert' + id + '>' +
        o.options.map(function (op) {
          var v = (op && op.value !== undefined) ? op.value : op;
          var l = (op && op.label !== undefined) ? op.label : op;
          return '<option value="' + esc(v) + '"' + (v === o.value ? ' selected' : '') + '>' + esc(l) + '</option>';
        }).join('') + '</select>';
    } else if (o.type === 'select') {
      inner = '<div class="select" data-inert' + id + '>' + esc(o.value) + '</div>';
    } else if (o.type === 'textarea') {
      inner = '<textarea class="textarea" data-inert' + id + '>' + esc(o.value || '') + '</textarea>';
    } else {
      inner = '<input class="input" data-inert' + id + ' type="' + (o.type || 'text') + '" value="' + esc(o.value || '') + '"' +
              (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>';
    }
    return '<div class="field' + (o.bad ? ' is-bad' : '') + (o.span ? ' span2' : '') + '">' +
      '<label>' + esc(label) + '</label>' + inner +
      (o.err ? '<span class="field-err">' + icon('warn') + esc(o.err) + '</span>' : '') +
      (o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '') +
    '</div>';
  }

  function kv(pairs) {
    var h = '<dl class="kv">';
    for (var i = 0; i < pairs.length; i++) {
      h += '<dt>' + esc(pairs[i][0]) + '</dt><dd>' + pairs[i][1] + '</dd>';
    }
    return h + '</dl>';
  }

  function tlItem(state, title, sub) {
    return '<div class="tl-item"><div class="tl-dot ' + state + '">' +
      (state === 'ok' ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>' : '') +
      '</div><div class="tl-body"><b>' + title + '</b><span>' + sub + '</span></div></div>';
  }

  function bars(months) {
    var max = 100, h = '<div class="bars">';
    for (var i = 0; i < months.length; i++) {
      var m = months[i];
      if (m.pc === null || m.pc === undefined) {
        h += '<div class="bar-col"><div class="bar-v skel" style="height:8%"></div><span class="bar-x">' + esc(m.m) + '</span></div>';
        continue;
      }
      var prev = i > 0 ? months[i - 1].pc : null;
      var bad = prev !== null && prev !== undefined && m.pc <= prev - 20;
      h += '<div class="bar-col">' +
        '<div class="bar-v ' + (bad ? 'bad' : '') + '" style="height:' + Math.max(3, (m.pc / max) * 100) + '%">' +
          '<span class="lab">' + m.pc + '%</span>' +
        '</div><span class="bar-x">' + esc(m.m) + '</span></div>';
    }
    return h + '</div>';
  }

  function empty(title, sub) {
    return '<div class="empty">' + icon('check', 'ei') + '<b>' + esc(title) + '</b><span>' + esc(sub || '') + '</span></div>';
  }

  /* A whole page saying "there is nothing here yet, here is how to start". */
  function emptyModule(o) {
    var acts = (o.actions || []).map(function (a) {
      return '<button class="btn ' + (a.primary ? 'btn--primary' : '') + '"' +
             (a.goto ? ' data-goto="' + esc(a.goto) + '"' : '') +
             (a.doo ? ' data-do="' + esc(a.doo) + '"' : '') + '>' +
             (a.icon ? icon(a.icon) : '') + esc(a.label) + '</button>';
    }).join('');
    return '<div class="card"><div class="card-body" style="padding:0">' +
      '<div class="empty" style="padding:64px 24px">' +
        icon(o.icon || 'plus', 'ei') +
        '<b style="font-size:17px">' + esc(o.title) + '</b>' +
        '<span style="max-width:44ch">' + esc(o.body) + '</span>' +
        (acts ? '<div class="row" style="justify-content:center;margin-top:12px">' + acts + '</div>' : '') +
        (o.note ? '<span class="small muted" style="margin-top:10px;max-width:46ch">' + esc(o.note) + '</span>' : '') +
      '</div></div></div>';
  }

  /* Shown when a detail screen is opened for something that does not exist. */
  function noRecord(what, backLabel, backTo) {
    return '<div class="page page--narrow">' +
      emptyModule({
        icon: 'search',
        title: 'Nothing here yet',
        body: 'There are no ' + what + ' in the system. Once some exist, this is where you open one.',
        actions: [{ label: backLabel, primary: true, goto: backTo }]
      }) + '</div>';
  }

  function emrLink(name) {
    return '<button class="emrlink">' + icon('ext') + 'Open ' + esc(name) + ' in the EMR</button>';
  }

  return {
    icon: icon, esc: esc, initials: initials, badge: badge, stat: stat, meter: meter,
    banner: banner, btn: btn, progress: progress, field: field, kv: kv, tlItem: tlItem, bars: bars,
    empty: empty, emrLink: emrLink, emptyModule: emptyModule, noRecord: noRecord
  };
})();
