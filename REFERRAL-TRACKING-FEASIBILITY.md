# Referral & Lead Tracking — feasibility

**Short answer: yes, and it fits the system naturally.** It is new scope rather than an
adjustment to what is already agreed, so it needs pricing and a place in the plan — but
nothing about it fights the architecture.

---

## Why it fits

Almost everything in this platform is the same shape: a record with dates, a status, a
person responsible, a reminder before it is due, an alert when it is late, history that is
never overwritten, attachments, a dashboard card and a report.

A referral is exactly that shape. The engine that drives incidents, reviews and
authorisations is the same engine that would drive referrals, so most of this is
configuration of something already being built rather than new machinery.

The nav item, the dashboard card with four counts, the follow-up dates going Due and
Overdue, the Excel/CSV/branded PDF exports — all of that comes from parts already in the
plan.

## What is genuinely new

Three things, and only one of them is structural.

**1. A configurable pipeline.** The seventeen statuses are more than the simple
Open/Closed used elsewhere: they are an ordered sequence that differs by programme. That
means a stage model plus a screen for you to reorder, rename, add and retire stages
yourself — the same way you will manage waiver checklists.

**2. Convert to Client.** Mapping a referral onto a new client record without retyping,
and keeping the referral readable afterwards. Straightforward, but it touches the client
record, which is why the timing below matters.

**3. Timing history — the one worth flagging.** Reporting on *conversion rate*, *time from
referral to approval* and *time from referral to admission* cannot be answered by a status
field alone. It needs every status change recorded with its date, so the system can work
out how long each stage took. This is a small addition if it is designed in, and an
expensive retrofit if it is not — because the history simply would not exist to report on.

## Timing

**The decision is worth making before the database milestone**, even if the build happens
later.

Two of the three items above touch the data model: the conversion into a client record, and
the status history that the duration reports depend on. Designing for them once costs
almost nothing. Adding them afterwards means revisiting the model and the client record.

If it is decided later, the module is still perfectly separable — referrals sit *before* the
client lifecycle rather than inside it, so it can be added as its own phase without
rebuilding anything. It is only the two seams above that get more expensive.

## What we would need from you

- **Your real stage list**, per programme. The seventeen you sent are a good start; we would
  confirm which apply to Georgia and which to Mississippi.
- **Your referral sources**, so the reporting groups by something meaningful.
- **What "stalled" means to you** — a number of days without an update, so the system can
  flag it on its own.

## In short

| | |
| --- | --- |
| Technically feasible | Yes, with no architectural conflict |
| Reuses existing work | Most of it — reminders, dashboard, reports, exports, audit |
| Genuinely new | Pipeline stages, convert-to-client, status timing history |
| In current scope | No — this is a change request |
| Best decided by | Before the database is designed, even if built later |
| Can it wait | Yes, if the two data-model seams are allowed for now |

Happy to put a costed breakdown together, and to add a clickable version of the referral
screens to the prototype so you can see the pipeline before committing to it.
