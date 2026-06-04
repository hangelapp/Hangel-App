# Germany — BDSG Supplement (Bundesdatenschutzgesetz)

**⚠️ DRAFT — Not Legal Advice.** Review by qualified attorney admitted in Germany (Rechtsanwalt mit Schwerpunkt Datenschutzrecht) required before production use. Last updated: 2026-06-03.

---

## 1. Scope and Relationship to GDPR

The **Bundesdatenschutzgesetz (BDSG, 2018)** supplements the GDPR (Regulation EU 2016/679) in Germany by exercising opening clauses under GDPR Art. 6(2)–(3), 8, 9(2)(b)/(g)/(h)/(i)/(j), 10, 23, 85, 87, 88, 89, and 90. For hangel, BDSG applies when:
- A controller or processor is **established in Germany** (BDSG §1(4) No. 1), OR
- Processing occurs **in Germany** (No. 2), OR
- hangel offers goods/services to data subjects in Germany or monitors their behaviour (No. 3, mirroring GDPR Art. 3(2)).

This document does **not** restate GDPR obligations (see `eu-privacy-policy.md`); it covers German specifics only.

## 2. Employee and HR Data — BDSG §26

If hangel employs staff in Germany or processes German employee data:
- **Legal basis:** §26(1) BDSG permits processing necessary for the employment relationship (hiring, performance, termination) without separate consent.
- **Consent in employment context:** §26(2) — consent is valid only when freely given; the imbalance of power must be assessed. Written form recommended.
- **Special categories (health, union membership):** §26(3) requires substantial public interest or collective agreements (Betriebsvereinbarung).
- **Works council (Betriebsrat):** Under §87(1) No. 6 BetrVG, IT systems processing employee data require co-determination. Any HR analytics, Slack monitoring, badge logs, etc. require works council agreement.

## 3. Telecommunications & Telemedia — TTDSG (2021)

The **Telekommunikation-Telemedien-Datenschutzgesetz (TTDSG)** replaced TMG privacy provisions and implements ePrivacy Directive Art. 5(3) in Germany.

- **§25 TTDSG — Terminal Equipment Access:** Storing or reading information on a user's device (cookies, localStorage, fingerprinting, SDK identifiers) requires **prior, informed, explicit consent**, except where strictly necessary for an explicitly requested service.
- **Planet49 (BGH I ZR 7/16, 28.05.2020):** Pre-ticked checkboxes are invalid. "Continue using site" banners are invalid. Accept/Reject must be equal in prominence and effort (cf. CNIL approach in France).
- **Telemetry / SDKs:** Crashlytics, Firebase Analytics, Sentry, push tokens — all require §25 consent unless strictly necessary.
- **PIMS (Personal Information Management Services):** §26 TTDSG anticipates recognised consent management providers (none yet certified as of 2026-06).

## 4. Data Protection Officer (DSB / DPO)

Stricter than GDPR Art. 37. Per **BDSG §38**, a DPO must be designated if:
- ≥ **20 persons** are constantly engaged in automated processing of personal data (lower than GDPR threshold), OR
- Processing requires a DPIA under GDPR Art. 35, OR
- Personal data is processed commercially for transfer or anonymised market/opinion research.

The DSB must be notified to the competent Landesdatenschutzbehörde and meet qualification requirements (expert knowledge of German + EU data protection law).

## 5. Children's Digital Consent

GDPR Art. 8 default applies in Germany: **16 years**. Germany did not opt down. For users under 16, parental consent is required for information society services offered directly to children.

## 6. Supervisory Authorities (Aufsichtsbehörden)

Germany has a **federal + state structure** — unique in the EU:
- **BfDI** (Bundesbeauftragte für den Datenschutz und die Informationsfreiheit) — federal bodies + telecoms + postal sector.
- **16 Länder DPAs** (LfDI Baden-Württemberg, BayLDA Bayern non-public, LDA Bayern public, BlnBDI Berlin, etc.) — private sector and Länder bodies.
- **Lead authority (one-stop-shop):** Determined by location of main establishment; for German-only processing, the Land DPA of the establishment site is competent.
- **Datenschutzkonferenz (DSK):** Coordination body issuing guidance (e.g., Orientierungshilfen on telemedia, cookie banners, US transfers).

## 7. Sanctions and Enforcement Specifics

- GDPR fines apply (up to €20M / 4% global turnover).
- BDSG §41 criminalises certain wilful violations: fines + imprisonment up to 3 years for unauthorised disclosure of personal data for enrichment or harm purposes.
- German DPAs are active: notable fines include Deutsche Wohnen (€14.5M, overturned procedurally but reinstated), H&M (€35.3M employee surveillance), Vodafone (€9.55M call-centre).

## 8. Practical Checklist for hangel

- [ ] If onboarding German employees or volunteers: Betriebsvereinbarung template + §26 consent forms.
- [ ] Cookie banner: TTDSG §25 compliant — Accept = Reject in one click, no nudging dark patterns.
- [ ] DSB assessment: count automated-processing headcount; appoint if ≥ 20.
- [ ] Records of Processing Activities (Verzeichnis von Verarbeitungstätigkeiten) in German.
- [ ] If transferring to TR HQ: SCCs + Transfer Impact Assessment (Schrems II); document supplementary measures.
- [ ] German-language privacy notice (Datenschutzerklärung) and Impressum (TMG §5 / DDG §5).

---
*References: BDSG 2018; TTDSG 2021; BGH Planet49; DSK Orientierungshilfen; Art. 29 WP / EDPB guidance.*
