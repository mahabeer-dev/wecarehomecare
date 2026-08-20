# Testing the prototype as a real user

No backend, no database, no accounts to create. Everything below runs in the browser.

**Open** `index.html`, or the deployed URL.
**Demo password for every account:** `wechc-2026`

Set the flow selector in the bottom bar to **“— free navigation —”** first. Otherwise you are
following a script rather than testing.

---

## How to change who you are

Sign in and out like a real user:

1. On the sign-in screen, pick one of the three accounts under **Sign in as**
2. Type the demo password
3. **Sign out** is at the bottom of the left sidebar, under your name

That is the honest way to test roles. The **Role** dropdown in the black bar does the same
thing in one click — quicker, but it skips the sign-in screen, so use it for spot checks
rather than for the walkthrough below.

---

## Round 1 — Dawn Bostock · Owner (Super Admin)

Sign in as Dawn.

- [ ] Sidebar shows **all 14 items**, including **Settings** and **Audit trail**
- [ ] The header has a **Georgia / Mississippi switcher** — nobody else gets this
- [ ] Switch to **Mississippi**. The client list changes completely: Jerome Sandifer,
      Loretta Bynum, Vernon Ashby. **No Georgia client appears.**
- [ ] Switch back to Georgia. Five clients, Maria Lopez among them.
- [ ] Open **Settings → Automatic rules**. Every threshold that drives the system is a number
      the client can change — no developer needed.
- [ ] Open **Settings → Users & roles** and read the permission matrix. That is the contract
      the other two rounds should match.
- [ ] Open **Audit trail**. Note the entries written by *System*, not by a person.

## Round 2 — Renee Alcott · Office Manager (Admin)

Sign out. Sign in as Renee.

- [ ] **No agency switcher** in the header. She is locked to Georgia.
- [ ] **Settings has gone** from the sidebar. Audit trail is still there.
- [ ] Dashboard shows the Georgia workload: overdue tasks, budget alerts, open incidents,
      reviews due.
- [ ] **Clients → Maria Lopez → Waiver documents.** One missing, one expired. That is why she
      is flagged on the dashboard.
- [ ] **Authorisations → Maria Lopez.** Check the arithmetic yourself:
      2,000 units at $6.25 = $12,500. At 1,500 used that is 75%, 500 units left, $3,125
      remaining, 125 hours. The screen should agree.
- [ ] **Enter hours → save.** Watch the 75% alert fire.
- [ ] Now try to overspend: the screen that warns before saving when only 40 units remain.
      **Nothing is written.** This is the feature that pays for the system.
- [ ] **Incidents → the 3 April fall.** Follow-up is 25 days late and has been escalated.
- [ ] **Incidents → the 30 April fall.** A quality item opened *by itself* — third incident
      that month against a threshold of two.

## Round 3 — Yvonne Pryce · Registered Nurse

Sign out. Sign in as Yvonne.

- [ ] Sidebar has **9 items**. **Caregivers, Authorisations and Quality are greyed out.**
      Settings and Audit trail are gone entirely.
- [ ] Hover a greyed item — it says nurses do not have access to that area.
- [ ] The dashboard is **completely different**: her own visits, not the agency workload.
- [ ] **Hospitalisations → Maria Lopez → record the nurse visit.** Tick the two plan reviews.
      Each tick creates a task with an owner and a due date — nothing is typed twice.
- [ ] Confirm the hospital stay **cannot close** until the visit and both reviews are done.

---

## Cross-cutting checks

- [ ] **Wrong password.** Type anything else and it is rejected, and it echoes back what you
      typed. Type nothing and you get a different message. Second attempt always gets through.
- [ ] **Import.** Clients → Import → pick `caseload-april.xlsx`. Four rows fail validation and
      **nothing is saved** until you approve the preview. The clean file skips straight to the
      preview.
- [ ] **Nothing dead-ends.** Click anything — buttons, table rows, cards, tabs, filter chips.
      Every one of them goes somewhere.
- [ ] **The ▦ button** in the black bar lists all 65 screens. Use it to reach anything the
      walkthrough missed.
- [ ] **Resize the window** to tablet and phone width. Nothing should scroll sideways.

## What is deliberately fake

Nothing saves. Refreshing the page resets everything. Typing in a field does not change
anything except the password box. The dates are fixed around May 2026 so the alerts always
look alive.

Every client, caregiver and clinical event is invented.
