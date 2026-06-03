# Italy — Codice Privacy (Codice in materia di protezione dei dati personali)

**⚠️ BOZZA — Non costituisce parere legale.** Revisione obbligatoria da parte di avvocato iscritto all'albo italiano specializzato in protezione dei dati personali prima dell'uso in produzione. Ultimo aggiornamento: 2026-06-03.

---

## 1. Legal Framework (Quadro normativo)

The Italian data protection regime is built on:
- **Decreto Legislativo 30 giugno 2003, n. 196** ("Codice in materia di protezione dei dati personali" — "Codice Privacy"), as substantially amended by
- **Decreto Legislativo 10 agosto 2018, n. 101**, which harmonised the Codice with GDPR and repealed obsolete provisions.

The Codice Privacy now supplements GDPR via national derogations (Art. 6(2)–(3), 8, 9, 23, 85, 88, 89 GDPR opening clauses) and contains sectoral rules (health, employment, judicial, journalistic, public administration).

## 2. Garante per la Protezione dei Dati Personali

- Italian supervisory authority since 1997.
- Independent collegial body: President + 3 members elected by Parliament.
- Website: **garanteprivacy.it**. Active enforcement via *provvedimenti* (orders) and *delibere* (deliberations) — many sector-specific.
- Notable enforcement: TIM (€27.8M, 2020), Enel Energia (€26.5M, 2021), OpenAI ChatGPT temporary ban (2023), Replika ban (2023), Clearview AI (€20M, 2022).
- Issues binding *Linee Guida* (Guidelines) and approves Codes of Conduct (Art. 40 GDPR).

## 3. Children's Digital Consent — Age 14

Italy opted down to **14 years** (Art. 2-quinquies Codice). For users under 14, parental/guardian consent is required for information society services offered directly to minors.

## 4. Health Data (Arts. 2-septies, 75–82-bis Codice)

Italian rules on health data are particularly strict:
- **Art. 2-septies:** processing of genetic, biometric, and health data may be subject to additional measures published by the Garante (binding general measures every 2 years).
- **Garante Provvedimento 9 luglio 2020:** technical and organisational guarantees for health processing (encryption, access logs, pseudonymisation).
- **Dossier Sanitario Elettronico (DSE):** Garante 4 giugno 2015 guidelines + 2024 updates.
- **Fascicolo Sanitario Elettronico (FSE 2.0):** national electronic health record under Ministry of Health + Garante supervision.
- **Consent for health data:** Art. 9(2)(h) GDPR for care purposes (no consent needed); Art. 9(2)(a) for research and secondary uses (explicit consent generally needed).
- **Anonymisation/pseudonymisation:** Garante 2024 guidance on secondary use of health data for research.

## 5. Workers' Data — Statuto dei Lavoratori + Codice Privacy

- **Statuto dei Lavoratori (Legge 300/1970), Art. 4:** remote monitoring (geolocation, video, software telemetry) of workers requires either prior collective agreement with unions (RSU/RSA) or authorisation from the Ispettorato Nazionale del Lavoro (INL). Strict — applies to corporate phones, MDM, GPS, productivity-monitoring tools.
- **Art. 8 Statuto:** prohibits investigations into employees' opinions, religion, etc., not relevant to the job.
- **Art. 113 Codice Privacy:** reinforces Statuto Art. 4–8 in personal-data context.
- **Garante Provvedimento metadati email lavoratori (2024):** strict retention limits on email metadata retention (initial 7-day cap, extended after dialogue with stakeholders — monitor latest version).

## 6. Cookies and Online Trackers — Linee Guida 10 giugno 2021

The **Garante Linee Guida cookie e altri strumenti di tracciamento (10 giugno 2021)** define current rules:
- **Banner first layer:** clear info on data controller, purposes, "Accept all", "Reject all", link to extended policy, customise option.
- **Equal prominence:** Reject button equal weight, colour, position to Accept.
- **Scroll = no longer valid consent** (Garante revised position from 2014).
- **Cookie wall:** generally prohibited unless equivalent alternative offered.
- **Refresh consent:** at most every 6 months unless conditions change.
- **Technical cookies** and **analytics with privacy-preserving config** (IP anonymisation, no sharing, single publisher) may be exempt.
- Compliance deadline was 10 January 2022; non-compliance actively sanctioned.

## 7. Soft Spam and B2B Marketing

- Italy implemented ePrivacy Art. 13(2) soft-spam exception narrowly (Art. 130(4) Codice): email marketing to existing customers for similar products, with opt-out at collection and each communication.
- **B2B marketing** to corporate email addresses (info@, vendite@): Garante has clarified that generic corporate addresses receive lesser protection but identifiable role-addresses (mario.rossi@azienda.it) are personal data.
- **Telemarketing:** opt-out via **Registro Pubblico delle Opposizioni (RPO)** — operators must consult before calling Italian numbers.

## 8. DPIA Mandatory Cases — Garante Provvedimento 11 ottobre 2018

The Garante published an Art. 35(4) GDPR list. DPIA mandatory (non-exhaustive) for:
- Large-scale processing of biometric, genetic, health, or judicial data.
- Systematic monitoring of employees beyond Statuto Art. 4 ordinary tools.
- Large-scale public area video surveillance.
- AI-based decisioning with legal/significant effects.
- Profiling of minors for marketing.
- IoT devices in homes processing data at scale.
- Cross-border data combination for new profiling.

## 9. Sanctions

Standard GDPR sanctions (up to €20M / 4% global turnover) plus Italian criminal provisions in Arts. 167–172 Codice Privacy:
- Unlawful processing causing harm: imprisonment 6 months – 3 years.
- Unlawful disclosure of large-scale databases: up to 6 years.
- False declarations to Garante: up to 3 years.

## 10. Practical Checklist for hangel

- [ ] Italian-language privacy notice (informativa) compliant with Arts. 13/14 GDPR + Garante FAQ.
- [ ] Cookie banner per Garante Linee Guida 2021 — reject parity, no scroll-consent.
- [ ] DPO appointment + notification to Garante via dedicated form.
- [ ] If Italian employees: Statuto Art. 4 agreement/INL authorisation for any monitoring software (including Sentry-like crash tools tied to identifiable users).
- [ ] Health-data flows: review against Art. 2-septies Garante measures; encryption + access logs.
- [ ] Children's flows: age 14 gate for IT.
- [ ] Telemarketing in IT: integrate RPO check.
- [ ] TR transfers: SCCs + TIA documenting Schrems II measures.

---
*Riferimenti: D.Lgs. 196/2003; D.Lgs. 101/2018; Garante provvedimenti vari; Statuto dei Lavoratori (L. 300/1970); Linee Guida cookie 10/06/2021; Provvedimento DPIA 11/10/2018.*
