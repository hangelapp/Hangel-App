# hangel — EU Digital Services Act (DSA) Compliance Document

> **DRAFT — Subject to legal review.** This document is a working draft prepared for internal alignment and prospective counsel review. It does **not** constitute legal advice and must be validated by a qualified EU regulatory lawyer before publication or reliance.

- **Service operator:** hangel (legal entity, address, and EU representative to be confirmed)
- **Contact for this document:** dsa@hangel.org (to be provisioned)
- **Version:** 0.1 — DRAFT
- **Last updated:** 2026-06-03
- **Regulation:** Regulation (EU) 2022/2065 (Digital Services Act), in force for all online platforms since **17 February 2024**

---

## 1. Scope and Categorisation

hangel is a digital service operating in the European Union that connects blood donors and recipients, hosts user-generated content (donation requests, hospital posts, library entries, project descriptions), and provides AI-assisted features. Under the DSA, hangel qualifies as a **hosting service** and an **online platform** because it stores and disseminates user-provided information to the public on the request of recipients of the service.

hangel does **not** meet the Very Large Online Platform (VLOP) threshold of **45 million average monthly active recipients** in the Union (Article 33 DSA) and therefore is not subject to the additional VLOP obligations (systemic risk assessments, independent audits, crisis response, etc.). hangel nonetheless applies the framework set out below as a baseline compliance posture and as forward-cover should usage approach the threshold.

---

## 2. Article 11 & 12 — Points of Contact

### 2.1 Single point of contact for authorities (Article 11)
hangel designates the following electronic point of contact for direct communication with Member State authorities, the European Commission, and the European Board for Digital Services:

- **Email:** authorities-dsa@hangel.org
- **Working languages:** English, Turkish
- **Response SLA:** acknowledgement within 48 working hours

### 2.2 Single point of contact for recipients (Article 12)
hangel publishes an easily accessible electronic contact for recipients of the service:

- **In-app path:** Settings → Help & Legal → Contact hangel
- **Email:** support@hangel.org
- **Web form:** https://hangel.org/contact

The contact channel is operated in English and Turkish; automated routing is restricted to ticketing and triage and does **not** replace a human-reviewable channel.

---

## 3. Article 13 — Legal Representative in the Union

Because hangel does not have an establishment in the Union but offers services there, hangel is required to designate a legal representative in one Member State where it offers services. The designated representative is the entity authorised to be addressed for the purpose of receipt of, compliance with, and enforcement of decisions issued under the DSA.

- **Legal representative:** *(to be appointed prior to launch in the EEA)*
- **Member State of representation:** *(to be confirmed — see §11)*

---

## 4. Article 14 — Terms of Service Transparency

hangel's Terms of Service (`eu-terms-of-service.md`) include, in clear, plain, intelligible, user-friendly and unambiguous language:

- restrictions imposed in relation to the use of the service in respect of information provided by recipients;
- policies, procedures, measures and tools used for content moderation, including algorithmic decision-making and human review;
- rules of procedure of any internal complaint-handling system;
- a summary version aimed at minors where the service is directed at or used by minors (hangel restricts accounts to 18+).

Material changes are notified to recipients in advance and a versioned changelog is maintained.

---

## 5. Article 15 — Transparency Reporting

hangel will publish, at least once per calendar year, a public transparency report covering:

- the number of orders received from Member State authorities (Articles 9 and 10) by category of illegal content, by Member State, and median response time;
- the number of notices submitted under Article 16, categorised by alleged illegal content type, action taken, and whether action was based on legal grounds or terms-of-service grounds, and median time to action;
- meaningful and comprehensible information about content moderation engaged in at hangel's own initiative, including the use of automated tools, training and assistance provided to human moderators, and accuracy/error indicators where available;
- the number of complaints received via the internal complaint-handling system (Article 20), the basis for those complaints, decisions taken, the median time needed, and the number of decisions reversed.

The first reporting period will be **calendar year 2026**, with publication by **30 June 2027** at https://hangel.org/transparency.

---

## 6. Article 16 — Notice-and-Action Mechanism

hangel provides an electronic mechanism allowing any individual or entity to notify the presence of specific items of information that the notifier considers illegal content. The mechanism is:

- accessible without account creation;
- easy to use;
- structured to capture (a) a sufficiently substantiated explanation of why the content is alleged to be illegal, (b) a precise indication of the exact electronic location (URL) where applicable, (c) the notifier's name and email (except where the alleged illegality concerns CSAM or content listed in Articles 3–7 of Directive 2011/93/EU), and (d) a good-faith statement that the information is accurate and complete.

**In-app path:** any content card → "Report" → "Illegal content" → form.
**Web path:** https://hangel.org/report

Upon receipt, hangel sends an electronic acknowledgement to the notifier without undue delay, processes the notice in a timely, diligent, non-arbitrary and objective manner, and notifies the notifier of its decision and of the redress possibilities.

Where action is taken, the recipient who provided the content receives a **statement of reasons** under Article 17 (specifying scope of restriction, facts and circumstances relied on, automated-decision usage if any, contractual or legal basis, and redress options including the internal complaint-handling system, out-of-court dispute settlement under Article 21, and judicial redress).

---

## 7. Article 22 — Trusted Flaggers

hangel commits to processing notices submitted by entities awarded "trusted flagger" status by the Digital Services Coordinator of a Member State **with priority** and without undue delay. A dedicated intake (trustedflaggers@hangel.org) is provisioned, and trusted-flagger volume and outcomes are reported separately in the annual transparency report.

---

## 8. Article 23 — Measures Against Misuse

hangel suspends, for a reasonable period and after issuing a prior warning, the provision of its services to recipients that frequently provide manifestly illegal content, and the processing of notices/complaints submitted by individuals or entities that frequently submit notices/complaints that are manifestly unfounded. The policy specifies the facts and circumstances considered (number, gravity, intent) and is published in the Terms of Service.

---

## 9. Article 24 — Online Interfaces Transparency (Dark Patterns Prohibited)

hangel does **not** design, organise or operate its online interfaces in a way that deceives or manipulates recipients or otherwise materially distorts or impairs their ability to make free and informed decisions. Specifically, hangel prohibits in its own design system:

- visually privileging consent over refusal;
- repeatedly requesting consent already refused (within a session);
- making it more difficult to terminate a service than to subscribe to it;
- default settings that are difficult to change and that nudge recipients into decisions favouring hangel.

Design reviews include a dark-patterns checklist; the checklist is appended to the design system documentation.

---

## 10. Article 25 — Recommender System Transparency

hangel currently surfaces donation requests primarily through geographic and blood-type filters and chronological feeds. To the extent any **recommender system** (ranking, personalisation, "for you" surfaces) is used, hangel sets out in the Terms of Service, in plain language:

- the main parameters used in the recommender system;
- any options available to recipients to modify or influence those parameters;
- where multiple options are available, a functionality allowing recipients to select and modify their preferred option at any time, accessible directly from the relevant interface.

---

## 11. Article 26 — Advertising Transparency

hangel's current product does **not** display third-party advertising. Should advertising be introduced, each ad will be accompanied, in real time and in a clear, concise and unambiguous manner, by:

- the fact that the information is an advertisement;
- the natural or legal person on whose behalf the advertisement is presented and who paid for it (if different);
- meaningful information about the main parameters used to determine the recipient to whom the advertisement is presented and, where applicable, how to change those parameters.

hangel will **not** present advertisements based on **profiling using special categories of personal data** (Article 9 GDPR), including health data.

---

## 12. Article 28 — Protection of Minors

hangel restricts donor accounts to natural persons **aged 18 or over**, in line with EU Member State blood-donation rules. hangel does **not** present advertisements based on profiling using personal data of recipients when it is aware with reasonable certainty that the recipient is a minor. Age-assurance mechanisms are reviewed annually and documented in the DPIA.

---

## 13. Article 20 — Internal Complaint-Handling System

For at least six months following a moderation decision (removal, restriction of visibility, suspension or termination of account, suspension of monetary payments), hangel provides recipients with access to a free electronic internal complaint-handling system enabling them to lodge complaints. Decisions are not solely based on automated means; a qualified human reviewer makes or confirms the final decision and informs the complainant without undue delay.

---

## 14. Article 21 — Out-of-Court Dispute Settlement

Recipients are entitled to select any out-of-court dispute settlement body certified by the Digital Services Coordinator of a Member State to resolve disputes relating to those decisions, including complaints not resolved through the Article 20 system. hangel will engage in good faith with the certified body and bear fees in accordance with Article 21(5).

---

## 15. VLOP Threshold Monitoring

hangel monitors monthly active recipients in the Union on a rolling six-month basis. Should the average reach **10% of the 45 million-recipient threshold** (i.e., **4.5 million MAU**), an internal escalation is triggered to scope VLOP-readiness work (systemic risk assessment, independent audit, data access for vetted researchers under Article 40, etc.).

---

## 16. Document Governance

- Owner: hangel Trust & Safety lead
- Review cycle: every 12 months or upon material regulatory change
- Change log maintained at the foot of this document
- Cross-references: `eu-terms-of-service.md`, `eu-ai-act-statement.md`, `privacy-policy.md`, `dpia.md`
