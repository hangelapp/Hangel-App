# hangel — EU Privacy Policy (GDPR)

> **DRAFT — NOT LEGAL ADVICE.** This document is a working draft prepared for internal review. It MUST be reviewed and approved by a qualified data protection lawyer admitted in the relevant EU/EEA Member State(s) before being published to end users. Member State law variations (Germany BDSG, France LIL, Italy Codice Privacy, etc.) may require additional disclosures or modifications.

**Effective date:** \[YYYY-MM-DD]
**Version:** 0.1 (draft)
**Last updated:** 2026-06-03

---

## 1. Controller Identity and Contact

The data controller responsible for the processing of personal data under this Policy is:

- **Legal name:** hangel \[full legal entity name to be inserted]
- **Registered office:** \[address — Türkiye]
- **Contact email:** privacy@hangel.org
- **Postal contact:** \[address]

### 1.1 EU Representative (GDPR Art. 27)

Because hangel is established outside the European Union but offers services to data subjects in the EU/EEA, hangel has appointed an EU Representative pursuant to Article 27 GDPR:

- **EU Representative:** \[to be appointed — e.g., a GDPR Representative Service provider established in an EU Member State where data subjects reside]
- **Address:** \[EU Member State address]
- **Email:** \[eu-rep@…]

Data subjects and supervisory authorities may contact the EU Representative directly in matters related to GDPR compliance.

### 1.2 Data Protection Officer (GDPR Art. 37)

Because hangel processes special categories of data (health-related data, specifically blood type and donation eligibility) on a large scale, hangel has designated a Data Protection Officer:

- **DPO name:** \[to be appointed]
- **DPO email:** dpo@hangel.org
- **DPO postal address:** \[address]

The DPO is the primary contact point for data subjects exercising their rights and for the competent supervisory authority.

---

## 2. Scope

This Privacy Policy applies to personal data processed by hangel through the hangel mobile applications (iOS, Android, watchOS, App Clip), the website hangel.org, and related services (collectively, the **"Service"**) when accessed by data subjects located in the European Union or European Economic Area.

This Policy is supplemented by the **Cookie Policy** (cookie usage on hangel.org) and the **DPIA** (internal risk assessment for high-risk processing).

---

## 3. Categories of Personal Data Processed

| # | Category | Examples | GDPR Article |
|---|---|---|---|
| 1 | Identification data | Full name, Apple ID, Google ID, phone number, email | Art. 6 |
| 2 | Contact data | Address, city, postal code, phone, emergency contact | Art. 6 |
| 3 | Authentication credentials | Hashed password, OAuth tokens, device IDs | Art. 6 |
| 4 | **Health data (special category)** | Blood type (ABO/Rh), last donation date, donation eligibility, medical exclusions | **Art. 9** |
| 5 | Location data | Approximate location (city level) for blood request matching; precise location only with explicit consent | Art. 6 + Art. 9 |
| 6 | Device and technical data | IP address, device model, OS version, app version, crash logs, push tokens | Art. 6 |
| 7 | Usage data | Session duration, screens viewed, features used | Art. 6 |
| 8 | Communication data | In-app messages, support tickets, SMS/email logs | Art. 6 |
| 9 | Donation history | Hospital, date, units donated (self-reported) | Art. 9 |

Special categories of data (Art. 9 GDPR) are processed strictly under the legal bases set out in Section 4.

---

## 4. Purposes and Legal Bases (Art. 6 and Art. 9 GDPR)

| Purpose | Legal basis (Art. 6) | Special category basis (Art. 9, if applicable) |
|---|---|---|
| Account creation, authentication | Art. 6(1)(b) Contract | — |
| Matching blood requests with eligible donors | Art. 6(1)(a) **Explicit consent** | Art. 9(2)(a) **Explicit consent** |
| Emergency blood request notifications | Art. 6(1)(d) **Vital interests** of the recipient or another natural person | Art. 9(2)(c) Vital interests where the data subject is physically or legally incapable of giving consent |
| Service security, fraud prevention | Art. 6(1)(f) **Legitimate interests** (security of the platform) | — |
| Push notifications, transactional messaging | Art. 6(1)(b) Contract | — |
| Marketing communications | Art. 6(1)(a) Consent (opt-in) | — |
| Aggregated and anonymised statistics | Art. 6(1)(f) Legitimate interests | Art. 9(2)(j) Statistics with safeguards |
| Compliance with legal obligations (e.g. tax, anti-money-laundering) | Art. 6(1)(c) Legal obligation | — |
| Defence of legal claims | Art. 6(1)(f) Legitimate interests | Art. 9(2)(f) Legal claims |

Where processing is based on **consent**, the data subject may withdraw consent at any time without affecting the lawfulness of processing carried out before withdrawal (Art. 7(3) GDPR). Withdrawal is performed via Settings → Privacy → Withdraw consent, or by emailing dpo@hangel.org.

---

## 5. Automated Decision-Making and Profiling (Art. 22)

hangel operates a **blood-matching algorithm** that automatically ranks and notifies eligible donors based on blood type compatibility, geographic proximity, last-donation-date eligibility window, and notification preferences.

- The algorithm **does not** produce legal effects or similarly significantly affect the data subject within the meaning of Art. 22(1) GDPR, because (i) participation is voluntary, (ii) the donor decides whether to respond, and (iii) no automated denial of any service or benefit is generated.
- Where Art. 22 nonetheless applies, hangel relies on Art. 22(2)(a) (necessary for performance of contract) and Art. 22(2)(c) (explicit consent), and provides the right to obtain human intervention, to express a point of view, and to contest the decision (dpo@hangel.org).
- **EU AI Act (Regulation 2024/1689):** the matching system is assessed as **minimal-risk** under the AI Act because it does not fall under prohibited practices, high-risk categories listed in Annex III, or general-purpose AI thresholds. hangel maintains transparency by disclosing the matching logic in the in-app **"How matching works"** section.

---

## 6. Recipients and Processors

Personal data are disclosed only to the following categories of recipients, each bound by a written **Data Processing Agreement (Art. 28 GDPR)**:

| Recipient | Role | Location | Transfer mechanism |
|---|---|---|---|
| Google LLC / Google Ireland Ltd (Firebase, Firestore, Cloud Functions, FCM) | Processor — backend, push notifications | EU (Frankfurt/Belgium) for storage; USA for support | EU SCCs (2021/914) + **EU-US Data Privacy Framework** (Google is DPF-certified) |
| Apple Distribution International (Apple Push Notifications, Sign in with Apple) | Processor | EU (Ireland) | Intra-EU; SCCs where USA processing occurs |
| Twilio Ireland Ltd | Processor — SMS / verification | EU + USA | EU SCCs + DPF (Twilio Inc. is DPF-certified) |
| SendGrid (Twilio) | Processor — transactional email | USA | EU SCCs + DPF |
| Sentry / crash reporting | Processor | EU region selected | Intra-EU; SCCs for any USA fallback |
| Hospitals / blood banks (where the data subject has explicitly requested contact) | Independent controller | EU Member State | None (intra-EU) |
| Competent authorities | Recipient | EU | Legal obligation (Art. 6(1)(c)) |

A complete and current list of sub-processors is maintained at hangel.org/legal/subprocessors and updated upon material change.

---

## 7. International Transfers (Chapter V GDPR)

Some processing involves transfers of personal data to countries outside the EEA, including:

- **Türkiye** (hangel headquarters) — **third country** without an EU adequacy decision. Transfers are made on the basis of **Standard Contractual Clauses (Module 1 controller-to-controller, Module 3 processor-to-processor)** adopted by Commission Implementing Decision (EU) **2021/914**, supplemented by a **Transfer Impact Assessment (TIA)** documenting supplementary measures: end-to-end encryption in transit (TLS 1.3), encryption at rest (AES-256), strict role-based access control, and pseudonymisation of identifiers where feasible.
- **United States** (Google, Twilio, SendGrid sub-processors) — transfers rely on **SCCs + EU-US Data Privacy Framework** certifications.
- Other countries — transfers occur only under an adequacy decision, SCCs, or another lawful Chapter V mechanism.

Copies of the SCCs and the TIA are available on request to dpo@hangel.org.

---

## 8. Retention Periods

| Data category | Retention | Justification |
|---|---|---|
| Account data | Lifetime of account + 30 days after deletion request | Contract performance + grace period for restoration |
| Blood-matching health data | Lifetime of account; pseudonymised after deletion | Art. 9(2)(a) consent, contract |
| Push tokens | Until device unregisters or 18 months of inactivity | Service operation |
| Crash and diagnostic logs | 90 days | Legitimate interest (security) |
| SMS / email transactional logs | 12 months | Legitimate interest + legal obligation |
| Marketing consent records | 5 years after withdrawal | Proof of consent (Art. 7(1)) |
| Legal claims evidence | Up to applicable limitation period (typically 5–10 years) | Art. 9(2)(f) |

Upon expiry, data are securely deleted or irreversibly anonymised.

---

## 9. Data Subject Rights (Art. 15–22 GDPR)

Data subjects in the EU/EEA have the following rights, exercisable free of charge (subject to the limits in Art. 12(5)):

- **Right of access** (Art. 15) — obtain a copy of personal data and processing information.
- **Right to rectification** (Art. 16) — correct inaccurate or incomplete data.
- **Right to erasure / "right to be forgotten"** (Art. 17) — request deletion subject to exceptions.
- **Right to restriction of processing** (Art. 18).
- **Right to data portability** (Art. 20) — receive data in a structured, commonly used, machine-readable format (JSON export).
- **Right to object** (Art. 21) — to processing based on legitimate interests or for direct marketing.
- **Rights relating to automated decision-making** (Art. 22).
- **Right to withdraw consent** (Art. 7(3)) at any time.

To exercise these rights, contact dpo@hangel.org or use the in-app **Settings → Privacy → My Rights** flow. hangel responds within **one month** (extendable by two further months for complex requests, Art. 12(3)).

### 9.1 Right to Lodge a Complaint (Art. 77)

Data subjects have the right to lodge a complaint with their **national supervisory authority**, in particular in the Member State of their habitual residence, place of work, or place of the alleged infringement. A directory of EU/EEA DPAs is available at: https://edpb.europa.eu/about-edpb/board/members\_en

---

## 10. Children's Data (Art. 8 GDPR)

The Service is not directed to children below the age of digital consent. The default GDPR age is **16**, lowered by Member State law to **13, 14, or 15** in some countries (e.g. UK 13, France 15, Germany 16, Italy 14, Spain 14). hangel applies the highest threshold of the country of the data subject; for users below that threshold, **parental consent** is required and verified through documented parental authorisation procedures. Blood donation eligibility additionally requires the minimum age set by national health law (commonly 18).

---

## 11. Security (Art. 32 GDPR)

hangel implements appropriate technical and organisational measures, including: TLS 1.3 in transit, AES-256 at rest, hardware-backed key storage on device, principle of least privilege, MFA for administrative access, periodic penetration testing, secure SDLC, vendor risk assessments, incident response plan with **72-hour breach notification** to the lead supervisory authority (Art. 33) and to affected data subjects where high risk arises (Art. 34).

---

## 12. Changes to this Policy

Material changes are notified at least **30 days** in advance via in-app banner, email, and posting at hangel.org/legal/privacy-eu. The version history is maintained for audit purposes.

---

## 13. Governing Law and Jurisdiction

Without prejudice to the rights of EU data subjects under Art. 79 GDPR to bring proceedings before the courts of the Member State of habitual residence, this Policy is governed by the law of \[Member State of EU Representative] for matters within the scope of GDPR.

---

*End of EU Privacy Policy — Draft v0.1.*
