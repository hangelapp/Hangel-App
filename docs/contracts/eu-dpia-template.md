# hangel — Data Protection Impact Assessment (DPIA) Template

> **DRAFT — NOT LEGAL ADVICE.** This is an internal template based on Article 35 GDPR, the WP29 / EDPB DPIA Guidelines (WP248 rev.01), and ISO/IEC 29134. It MUST be completed by the DPO in cooperation with the processing-owner business unit and reviewed by counsel before sign-off. Where required under Art. 36 GDPR, the supervisory authority must be consulted.

**Document ID:** DPIA-\[NNN]
**Processing operation:** \[short name]
**Owner business unit:** \[team]
**DPO:** \[name, email]
**Date opened:** \[YYYY-MM-DD]
**Date approved:** \[YYYY-MM-DD]
**Version:** 0.1 (draft template)

---

## 1. Why this DPIA is mandatory

Article 35(3) GDPR requires a DPIA where processing is "likely to result in a high risk to the rights and freedoms of natural persons", in particular:

- (a) systematic and extensive evaluation including profiling that produces effects on the data subject;
- (b) processing on a **large scale of special categories of data** (Art. 9) — applicable to hangel (health data: blood type, eligibility);
- (c) systematic monitoring of a publicly accessible area on a large scale.

In addition, the **WP29 nine criteria** are applied; reaching **two or more** criteria triggers a DPIA. For hangel's blood-matching processing, the following criteria are met:

- [x] **Evaluation/scoring** (donor ranking algorithm)
- [x] **Automated decision-making** with effects (notifications based on eligibility)
- [x] **Sensitive data / health data** (Art. 9)
- [x] **Data processed on a large scale**
- [x] **Matching or combining datasets** (donor profile + request + geo)
- [x] **Data concerning vulnerable subjects** (patients in emergency)
- [x] **Innovative use** (mobile push-based donor activation)

→ DPIA mandatory.

Also relevant: the supervisory authority of \[Member State] publishes a Black List under Art. 35(4). Processing of health data via a mobile platform with automated matching is **listed** in most Member State black lists. The Member State White List under Art. 35(5) is also consulted and does **not** exempt this processing.

---

## 2. Description of the processing (Art. 35(7)(a))

### 2.1 Nature
End-to-end mobile + cloud platform that connects blood requesters (patients, hospitals, family members) with eligible donors via geographic and biological matching, push notifications, and in-app messaging.

### 2.2 Scope
- **Data categories** — see Section 3.
- **Volume** — \[X] active donors, \[Y] requests/month, \[Z] Member States.
- **Frequency** — continuous.
- **Geographic scope** — EU/EEA (data subjects), Türkiye (processing), USA (sub-processors).

### 2.3 Context
- **Relationship with data subjects:** voluntary platform users (B2C).
- **Reasonable expectations:** high transparency expected for health data.
- **Power asymmetry:** moderate — patient side may be in distress.
- **Public concern / media attention:** moderate, increasing for AI-assisted health platforms.

### 2.4 Purposes
See Privacy Policy Section 4.

### 2.5 Legitimate interest balancing (where applicable)
Documented separately when Art. 6(1)(f) is the basis.

---

## 3. Data inventory

| # | Data element | Category | Special (Art. 9)? | Source | Storage | Retention | Recipient(s) |
|---|---|---|---|---|---|---|---|
| 1 | Full name | Identification | No | User | Firestore (EU) | Account + 30d | hangel only |
| 2 | Email, phone | Contact | No | User | Firestore | Account + 30d | Twilio, SendGrid (proc.) |
| 3 | Blood type | **Health** | **Yes** | User self-declared | Firestore | Account + 30d | Internal matcher only |
| 4 | Last donation date | **Health** | **Yes** | User | Firestore | Account + 30d | Internal matcher |
| 5 | Approx. location (city) | Location | No | User / IP | Firestore | Account + 30d | Internal matcher |
| 6 | Precise location | Location | Conditional | User (opt-in) | Memory only — not stored | None | None |
| 7 | Push token | Identifier | No | OS | Firestore | 18m inactivity | Apple APNs, Google FCM |
| 8 | Device IDs, crash logs | Technical | No | App SDK | Firestore + Sentry | 90 days | Sentry (proc.) |

---

## 4. Necessity and proportionality (Art. 35(7)(b))

- **Lawful basis:** as set out in Privacy Policy §4 (consent, vital interest, contract, legitimate interest, legal obligation).
- **Purpose limitation:** data is processed only for purposes listed; no secondary uses without renewed consent.
- **Data minimisation:** precise GPS is not stored; only the minimal city-level pseudonym is used for matching.
- **Accuracy:** users can edit profile at any time; blood type changes require re-verification flow.
- **Storage limitation:** retention table in Privacy Policy §8.
- **Data subject rights:** in-app "My Rights" + dpo@hangel.org channel.
- **Processor governance:** Art. 28 DPAs in place; sub-processor list public.
- **International transfer mechanism:** SCCs 2021/914 + DPF + TIA.

---

## 5. Risk assessment (Art. 35(7)(c))

### 5.1 Risk identification

| Risk ID | Risk to data subjects | Threat | Vulnerability |
|---|---|---|---|
| R1 | Unauthorised disclosure of blood type / health status | External attacker | Misconfigured Firestore rules |
| R2 | Re-identification from pseudonymised matching events | Linkage attack | Quasi-identifiers (city + age + blood type rare combo) |
| R3 | Disclosure of donor location to malicious requester | Social engineering | Lax verification of requester |
| R4 | Discrimination based on health status | Profiling | Algorithmic bias |
| R5 | Excessive notifications / nuisance | Service design | Insufficient rate limits |
| R6 | Unlawful third-country access | Government access (US/TR) | Encryption key residency |
| R7 | Loss of availability during emergency | DoS / outage | Single-region deployment |
| R8 | Data breach via lost/stolen device | Device theft | Lack of biometric lock enforcement |
| R9 | Children processed without parental consent | Age misrepresentation | Self-declared age |
| R10 | Inability to exercise rights (Art. 15–22) | Process failure | Manual queue backlog |

### 5.2 Risk matrix

Severity × Likelihood scored on 1 (negligible) — 4 (maximum):

| Risk | Likelihood (1-4) | Severity (1-4) | Inherent risk | Mitigations | Residual risk |
|---|---|---|---|---|---|
| R1 | 2 | 4 | **High** | Firestore rules unit tests, SAST, pen-test, AES-256 | Low |
| R2 | 3 | 3 | **High** | k-anonymity ≥ 5 in matching, no quasi-ID exports | Medium |
| R3 | 2 | 4 | **High** | Requester KYC, location coarsened to city, anti-stalking heuristics | Low |
| R4 | 2 | 3 | Medium | Algorithm audit, fairness metrics, human override | Low |
| R5 | 3 | 2 | Medium | Daily caps, per-user mute, quiet hours | Low |
| R6 | 2 | 4 | **High** | SCCs + DPF + TIA + supplementary encryption | Medium |
| R7 | 2 | 3 | Medium | Multi-AZ Firestore, redundant FCM/APNs, SMS fallback (Twilio) | Low |
| R8 | 3 | 3 | **High** | Biometric lock prompt, remote logout, token rotation | Low |
| R9 | 2 | 3 | Medium | Age gate at signup, parental consent flow under DSA + GDPR Art. 8 | Low |
| R10 | 2 | 3 | Medium | Self-service rights portal, 30-day SLA monitoring | Low |

Scoring: **Likelihood × Severity** = inherent risk; values 1–4 Low, 5–9 Medium, 10–16 High.

### 5.3 Risk treatment principle
All risks must be reduced to **Low** or **Medium with documented justification**. Any residual **High** risk triggers **mandatory prior consultation of the supervisory authority under Art. 36 GDPR** before the processing starts.

---

## 6. Mitigation and safeguards (Art. 35(7)(d))

### 6.1 Technical measures
- TLS 1.3 in transit; AES-256 at rest; HSM-backed keys.
- Firestore Security Rules + automated test suite.
- App Check / DeviceCheck attestation.
- Pseudonymisation of donor identifiers in analytical pipelines.
- Differential-privacy noise in aggregated dashboards.
- SAST + DAST + dependency scanning in CI.
- Annual third-party penetration test.
- Logging and SIEM with 12-month retention.

### 6.2 Organisational measures
- Role-based access; least privilege; quarterly access review.
- MFA enforced for all admin consoles.
- Mandatory annual GDPR + secure-coding training.
- Incident response plan (P1 < 4h, breach notification < 72h).
- Vendor due diligence checklist; Art. 28 DPA in place; sub-processor pre-approval workflow.
- Data Inventory / Record of Processing Activities (Art. 30) maintained in \[tool].

### 6.3 Data-subject-facing measures
- Layered Privacy Notice (short in-app + full web).
- Self-service rights portal.
- Granular consent toggles.
- Transparency disclosure of matching algorithm.

---

## 7. Stakeholder consultation

| Stakeholder | Consulted | Date | Outcome / view |
|---|---|---|---|
| DPO | ☐ | | |
| Engineering lead | ☐ | | |
| Security lead | ☐ | | |
| Legal counsel | ☐ | | |
| Medical advisor | ☐ | | |
| Data subjects (sample / survey) | ☐ | | |
| Supervisory authority (Art. 36 if residual high risk) | ☐ | | |

---

## 8. DPO opinion (Art. 35(2))

Free-text section reserved for the DPO's reasoned opinion, including approval, approval-with-conditions, or refusal with motivation.

> *\[DPO opinion to be written here. Must address: lawfulness, necessity, proportionality, adequacy of safeguards, residual risk, and whether prior consultation under Art. 36 is required.]*

---

## 9. Decision and sign-off

- [ ] **Approved** — processing may proceed.
- [ ] **Approved with conditions** — list conditions and target dates.
- [ ] **Rejected** — processing must not proceed in current form.
- [ ] **Prior consultation triggered** — submitted to \[DPA] on \[date], ref. \[…].

| Role | Name | Signature | Date |
|---|---|---|---|
| Processing owner | | | |
| DPO | | | |
| CISO | | | |
| General counsel | | | |
| Executive sponsor | | | |

---

## 10. Review schedule

- **Mandatory review:** at least every **24 months**, or upon material change of processing (new data category, new sub-processor, new jurisdiction, new technology, change of legal basis), or following a personal data breach involving this processing.
- **Next scheduled review:** \[YYYY-MM-DD]

---

## 11. EU AI Act overlay (Regulation 2024/1689)

For the blood-matching algorithm:

- **Classification:** assessed as not falling within Annex III high-risk categories; therefore **limited-risk**. If future features add biometric inference, emotion recognition, or social-scoring traits, reclassification is required.
- **Transparency obligations (Art. 50):** users are informed they are interacting with an automated matching system.
- **Provider obligations (Art. 16) — if reclassified high-risk:** technical documentation, logging, post-market monitoring, conformity assessment, CE marking, EU database registration. Plan to be activated only upon reclassification.

---

## 12. Appendices

- A. Data flow diagram
- B. Record of Processing Activities (Art. 30) extract
- C. Legitimate Interest Assessment (LIA), if applicable
- D. Transfer Impact Assessment (TIA)
- E. Sub-processor list snapshot
- F. Security architecture summary
- G. Algorithmic fairness evaluation report
- H. Consultation evidence (surveys, meeting minutes)

---

*End of DPIA Template — Draft v0.1.*
