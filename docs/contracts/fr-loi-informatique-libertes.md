# France — Loi Informatique et Libertés (LIL)

**⚠️ DRAFT — Pas un avis juridique.** Révision par un avocat inscrit au barreau français spécialisé en droit des données personnelles requise avant production. Dernière mise à jour : 2026-06-03.

---

## 1. Framework and Scope (Cadre juridique)

The **Loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés** (modified by Loi n° 2018-493 of 20 June 2018 and Ordonnance n° 2018-1125 of 12 December 2018) is the French national law supplementing the GDPR. Implementing decree: **Décret n° 2019-536 du 29 mai 2019**.

LIL applies where:
- Processing occurs in the context of an establishment in France (Art. 3-I LIL), OR
- The data subject resides in France and processing is by a controller not established in the EU but targeting French residents (Art. 3-II — mirrors GDPR Art. 3(2)).

## 2. CNIL — Commission Nationale de l'Informatique et des Libertés

- Independent administrative authority (autorité administrative indépendante) established 1978; oldest DPA in Europe.
- Powers: investigations (contrôles), formal notices (mises en demeure), sanctions up to GDPR maximum (€20M / 4% turnover), public naming.
- President + 17 commissioners; restricted committee (formation restreinte) issues sanctions.
- Website: **cnil.fr**. Mandatory contact for: data breach notifications (≤72h), DPIA prior consultation, complaints.
- Notable enforcement: Google LLC (€150M, 2022, cookies), Facebook Ireland (€60M, 2022, cookies), Clearview AI (€20M, 2022), Microsoft Ireland (€60M, 2022).

## 3. Cookies and Trackers — CNIL Lignes Directrices 2020 + Recommandation 2020

Implements ePrivacy Art. 5(3) via LIL Art. 82 and CNIL deliberations **n° 2020-091** (lignes directrices) and **n° 2020-092** (recommandation), updated 2020-09-17 after Conseil d'État partial annulation.

Core rules:
- **Explicit, prior, informed, free, specific consent** for all non-essential trackers (analytics, advertising, social, fingerprinting).
- **Accept and refuse must be equally easy** — one-click reject as prominent as one-click accept. Pre-checked boxes invalid.
- **Continuing to navigate ≠ consent.**
- **Cookie wall** (refuse = no access) — case by case; generally discouraged.
- **Granular choice** by purpose (analytics vs. ads vs. personalisation).
- **Withdrawal** must be as easy as giving consent; persistent UI element required.
- **Proof of consent** retention required.
- **Audience measurement exemption** (Art. 82 LIL + CNIL): only if anonymised aggregated stats, no cross-site tracking, single site/publisher.

## 4. Health Data Hosting — HDS Certification

- Health data (données de santé à caractère personnel) hosted by third parties **must** be hosted by an **HDS-certified host** (Hébergeur de Données de Santé) per **Art. L1111-8 Code de la santé publique**.
- HDS certification scheme managed by ANS (Agence du Numérique en Santé); auditors accredited by COFRAC.
- AWS, GCP, Azure, OVHcloud, Outscale, Scaleway have HDS certifications in France.
- Loi n° 2022-217 ("3DS") and subsequent reforms reinforced sovereignty considerations for sensitive health workloads (cf. Health Data Hub controversy with Microsoft Azure).
- **Practical impact for hangel:** any health-adjacent data (patient registries, donation health screenings, beneficiary medical records of French data subjects) hosted by hangel must be on HDS-certified infrastructure.

## 5. Children's Digital Consent — Age 15

France used the GDPR Art. 8 opt-down: **age of digital consent is 15** (Art. 45 LIL). For users 13–15, **joint consent of minor + parent** required for information society services. Under 13: parental consent only.

## 6. DPO (Délégué à la Protection des Données — DPD)

GDPR Art. 37 thresholds apply. CNIL recommends designation even when not mandatory. Notification to CNIL via the online dedicated portal (declaration of DPO). DPO list publicly searchable.

## 7. Numerical Sovereignty and US Cloud Act

- **CJEU Schrems II (C-311/18)** invalidated Privacy Shield. SCCs require **Transfer Impact Assessment (TIA / AIPD-transfert)** and supplementary measures (encryption with EU-held keys, pseudonymisation, contractual).
- **CNIL position (2022):** Google Analytics use without supplementary measures violates GDPR Art. 44. Migration to server-side or EU-hosted analytics required.
- **EU–US Data Privacy Framework (2023):** Adequacy decision in force; certified US importers may receive data without SCCs. Monitor litigation (Schrems III pending).
- **Cloud Act risk:** US-headquartered processors can be compelled to disclose data regardless of EU location. CNIL recommends "trusted cloud" (SecNumCloud-qualified ANSSI providers) for sensitive workloads.

## 8. Sector-Specific Rules

- **Code des relations entre le public et l'administration (CRPA):** open-data and admin data reuse rules.
- **Loi République Numérique (2016):** right to digital death (Art. 40-1 LIL — directives post mortem); portability strengthened.
- **Loi anti-haine (Avia, partially censored 2020) / Loi DSA implementation (2024):** illegal content notice-and-action.
- **Loi SREN (2024):** age verification for porn / certain platforms; supervised by ARCOM + CNIL.

## 9. Practical Checklist for hangel

- [ ] French-language privacy notice (politique de confidentialité) covering Art. 13/14 GDPR.
- [ ] Cookie banner conforming to CNIL deliberations — A/B test reject button parity.
- [ ] Designate DPO; declare to CNIL if appointed.
- [ ] If processing health data of French residents at scale: contract HDS-certified host.
- [ ] TIA (analyse d'impact relative au transfert) for TR data exports; document supplementary measures.
- [ ] Age gate at 15 for any FR-targeted children's flow.
- [ ] French-language consent UIs, including donation receipts and email opt-ins.

---
*Références : LIL n° 78-17 modifiée ; Décret n° 2019-536 ; CNIL délibérations n° 2020-091/092 ; CE 19/06/2020 La Quadrature du Net ; CJUE Schrems II ; Code de la santé publique L1111-8.*
