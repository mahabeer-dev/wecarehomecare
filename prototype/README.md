# We Care Home Care — clickable prototype

A walkthrough of the whole Operations Management System. Click anything and it moves on —
there is no validation, no backend and no database. Everything you see is invented demo data.

## Open it

Double-click `index.html`. That is all — it runs straight from the filesystem with no build step,
no npm and no internet connection.

To serve it locally instead:

```bash
cd .. && python3 serve.py 8910
```

## Put it online

The folder is already a static site. Drag it onto Netlify Drop, or from this directory:

```bash
npx vercel deploy --prod
```

## How to drive it

The dark bar along the bottom is the demo control bar. It is not part of the product.

| Control | What it does |
| --- | --- |
| ↺ | Reset everything back to the start |
| Role | Switch between Super Admin, Admin staff and Nurse — the menu and dashboard change with it |
| Flow | Pick a scripted walkthrough |
| ▦ | Index of all 72 screens — jump anywhere |
| **Day one / In use** | Switch between a brand new empty system and one with records in it |
| Next: … | Advance the script. The label always names the step it is about to show |

You can also press **→** to advance, and **Esc** to close the screen index.

### Testing as a real user

Pick one of the three accounts on the sign-in screen, type the demo password `wechc-2026`,
and **Sign out** from the bottom of the sidebar to swap. [`TESTING.md`](TESTING.md) is a
role-by-role script — Owner, then Office Manager, then Nurse — with what to expect at each
step.

| Account | Role | Sees |
| --- | --- | --- |
| Dawn Bostock | Super Admin | Everything, both agencies, Settings, Audit trail |
| Renee Alcott | Admin staff | Georgia only, no Settings |
| Yvonne Pryce | Nurse | Georgia only, own visits; no Caregivers, Authorisations or Quality |

### Clicking

**Everything clickable moves you forward.** Buttons, table rows, cards, tabs, filter chips,
stat tiles — click any of them and you go somewhere. Nothing validates and nothing can fail.

- **Inside a flow**, clicking anything follows the script — the same as pressing Next.
- **In free navigation**, a control with its own destination goes there; anything else follows
  the screen's forward chain, so you can click your way through the whole product without
  ever hitting a dead end.
- **The sidebar always wins.** Clicking a menu item leaves the current flow and takes you
  straight to that module.
- **Text fields accept typing** and do not navigate.
- **Loading screens move on by themselves** after a second or so, like real ones.

### Seeing it empty, as the client receives it

Press **Day one** in the black bar, or run the flow **● Day one — a brand new empty system**.

Every list goes empty, a **Getting started** checklist appears at the top of the sidebar, and
the dashboard admits it has nothing to show. The seven setup steps are the real order of
operations: agencies → team → waiver programmes → reminder timings → import clients → import
caregivers → add authorisations. Only after the last one does the system have any dates to
watch.

Press **In use** to put the demo records back.

## Where to start

**Show a client this first:** the flow called **★ Maria Lopez — one client, one year**.
Twenty steps following a single client from their import in January through a fall, a hospital
stay, an automatic quality item, a budget alert and finally an attempt to overspend their
authorisation. It covers most of the system without explaining any of it.

## The flows

| Flow | Steps | What it shows |
| --- | --- | --- |
| ★ Maria Lopez — one client, one year | 20 | The whole system through one person |
| Who sees what — roles and agencies | 11 | Permissions, and Georgia vs Mississippi separation |
| Bringing a caseload in from Excel | 6 | Import, including the rows that fail validation |
| Budget — the calculator with alarms | 9 | Set-up, monthly entry, 75% alert, the over-spend block |
| An incident, start to finish | 8 | Record → chase → escalate → quality item → outcome |
| Hospital stay and the nurse visit | 6 | Admission → discharge → nurse visit → close |
| Caregiver papers that expire | 5 | Credential tracking and renewal history |
| Scheduled reviews | 6 | Supervisor visits, assessments, HRST, plans, DDP |
| Monthly goal progress | 3 | The typed percentage and the sharp-drop alert |
| Tasks and escalation | 4 | Generic work items attached to any record |
| Reports and exports | 4 | Builder → results → export → branded PDF |
| What the client can change without us | 6 | Reminder timings, thresholds, checklists, intervals |
| Empty, loading and audit | 4 | The states people forget to design |
| ● Day one — a brand new empty system | 18 | First sign-in through to a working system |

## Structure

```
index.html          loads everything in order
css/tokens.css      palette, type, spacing
css/app.css         shell, sidebar, topbar, demo chrome
css/components.css  cards, tables, forms, badges, meters
js/data.js          all demo data in one place
js/ui.js            icons and render primitives
js/app.js           screen registry, router, step machine, click handling
js/screens/*.js     one file per module
js/flows.js         the scripted walkthroughs
```

Adding a screen is two lines: register it in `js/screens/…`, and reference it from a flow.

```js
screen('clients.list', {
  title: 'Client list',
  nav: 'clients',
  render: function (S) { return '<div class="page">…</div>'; }
});
```

Plain `<script>` tags and globals throughout — deliberately no ES modules, because those
cannot load over `file://`.

## Two things to remember

**Every person in here is invented.** Maria Lopez, Renee Alcott, Yvonne Pryce and everyone
else are fictional, as are all the incidents, hospital stays and medical details. The banner
at the top of every screen says so.

**No pricing appears anywhere**, in this prototype or in the sibling documents. Milestone
values and the contract total live only in the Work Agreement.
