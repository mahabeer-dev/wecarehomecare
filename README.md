# We Care Home Care — Custom Operations Management System

A management, compliance, quality, oversight and budget-utilisation platform for two home care
agencies in Georgia and Mississippi. It sits **alongside** the existing EMR and does not replace
it — the EMR holds the clinical record, this system answers what is due, what is late, what is
missing and whose authorisation is running out.

## What is in this repository

| | |
| --- | --- |
| [`prototype/`](prototype/) | A clickable prototype of the whole system — 65 screens, 13 guided walkthroughs. No backend, no build step. |
| [`SYSTEM-FLOWCHARTS.html`](SYSTEM-FLOWCHARTS.html) | 13 flowcharts covering every module, readable without any prior knowledge of the project. |

## Run the prototype

Open `prototype/index.html` in a browser. That is the whole procedure — no npm, no build, no
internet connection required.

To serve it instead:

```bash
python3 -m http.server 8899 --directory prototype
```

See [`prototype/README.md`](prototype/README.md) for how to drive it and what each flow shows.

**Start with the flow called “★ Maria Lopez — one client, one year”.** It follows a single
client from their import in January through a fall, a hospital stay, an automatically raised
quality item, a budget alert and an attempted over-spend. It demonstrates most of the system
without explaining any of it.

## Scope

**In scope** — task and compliance management · client and caregiver records · service
agreements, prior authorisations and waiver documentation · NOW/COMP budget utilisation with
75/90/100% alerts · incident tracking · hospitalisation and nurse follow-up · quality
improvement · monthly ISP goal progress · DDP and clinical oversight · calendar · dashboards ·
reporting and exports · audit trail · multi-agency separation.

**Out of scope** — this does not replace the EMR, and does not do clinical documentation, care
plan authoring, shift scheduling, electronic visit verification, payroll, billing or claims
submission. There is no API integration with the EMR; records are entered manually or imported
from Excel/CSV, with a link out to each person's EMR profile.

## Users

Administration and clinical staff only — roughly 6 to 10 accounts across the two agencies.
Field caregivers do **not** receive logins; they exist in the system as compliance records so
their licences, training and certifications can be tracked.

## Technology

MERN — MongoDB, Express, React with TypeScript, Node.js. Deployed on HIPAA-eligible cloud
hosting under We Care Home Care's own accounts.

The prototype itself is deliberately plain HTML, CSS and vanilla JavaScript with no
dependencies, so it runs from the filesystem and will still open years from now.

## A note on the data

Every client, caregiver, incident, hospitalisation and medical detail in the prototype is
**invented**. Maria Lopez, Renee Alcott, Yvonne Pryce and everyone else are fictional, and every
screen carries a banner saying so. Nothing here describes a real person.
