# hangel — EU Child Privacy Policy (GDPR Art. 8 + EDPB Guidelines)

> **DRAFT — NOT LEGAL ADVICE.** This document is a working draft prepared for internal review. It MUST be reviewed and approved by a qualified data protection lawyer admitted in the relevant EU/EEA Member State(s) before being published to end users.

**Effective date:** \[YYYY-MM-DD]
**Version:** 1.0 (draft)
**Last updated:** 2026-06-03

---

## 1. Scope

This policy describes how hangel processes personal data of children under the age of 18, with specific attention to GDPR Article 8 (conditions applicable to child's consent in relation to information society services) and the EDPB Guidelines 05/2020 on consent and Guidelines 8/2022 on identifying a controller's lead supervisory authority. Member State law may impose a higher digital age of consent (see §3).

hangel is not directed at children under 13. Where a Member State sets the digital consent age above 13 (up to 16), hangel applies the higher Member State threshold for users in that country.

## 2. Age Gate

At account creation, hangel collects the user's date of birth. If the declared age is below the applicable Member State digital age of consent (see §3), the registration flow:

1. Requires a verifiable parental/guardian email address.
2. Sends a double opt-in confirmation message to the parent describing the processing, categories of data, retention period, and rights.
3. Withholds activation of donor matching, location processing, and marketing communications until parental authorisation is logged.
4. Records the consent event in the `consent_logs` collection with timestamp, IP, user agent, and parent verification token (hashed).

## 3. Digital Age of Consent — Member State Variants

| Member State | Digital age | Source |
|--------------|-------------|--------|
| Austria | 14 | DSG §4 |
| Belgium | 13 | Loi du 30 juillet 2018, Art. 7 |
| Bulgaria | 14 | LPDP Art. 25h |
| Croatia | 16 | ZPOP Art. 19 |
| Cyprus | 14 | L.125(I)/2018 §7 |
| Czechia | 15 | Zákon č. 110/2019 §7 |
| Denmark | 13 | Databeskyttelsesloven §6(3) |
| Estonia | 13 | IKS §8 |
| Finland | 13 | Tietosuojalaki §5 |
| France | 15 | LIL Art. 45 |
| Germany | 16 | BDSG (default GDPR Art. 8) |
| Greece | 15 | N. 4624/2019 Art. 21 |
| Hungary | 16 | Infotv. §6/A |
| Ireland | 16 | Data Protection Act 2018, §31 |
| Italy | 14 | Codice Privacy Art. 2-quinquies |
| Latvia | 13 | FPDL §10 |
| Lithuania | 14 | ADTAĮ §5 |
| Luxembourg | 16 | Loi du 1er août 2018, Art. 10 |
| Malta | 13 | Data Protection Act 2018 |
| Netherlands | 16 | UAVG Art. 5 |
| Poland | 16 | UODO Art. 8 |
| Portugal | 13 | Lei n.º 58/2019 Art. 16 |
| Romania | 16 | Legea 190/2018 |
| Slovakia | 16 | Zákon 18/2018 §15 |
| Slovenia | 15 | ZVOP-2 |
| Spain | 14 | LOPDGDD Art. 7 |
| Sweden | 13 | Dataskyddslag 2 kap. 4 § |

## 4. Verifiable Parental Consent (VPC)

Pursuant to Art. 8(2), hangel makes reasonable efforts to verify that consent is given by the holder of parental responsibility, considering available technology:

- **Tier 1 (default):** double opt-in email + signed declaration (PDF).
- **Tier 2 (high risk processing, e.g., health/donor matching for minors):** government-issued ID verification of the parent via a regulated KYC provider, OR micro-charge to a payment card refunded immediately (COPPA-style).
- **Tier 3 (location, biometric, profiling):** prohibited for minors unless a Tier 2 VPC plus DPIA covering the specific processing exists.

Consent records: see `consent_logs/{userId}/events/{eventId}` schema in `docs/audit/decisions.md`.

## 5. Special Categories of Data

Children's **health data** (blood group, donation eligibility) is special category data under Art. 9. Processing requires:

- Explicit consent of the parent (Art. 9(2)(a)), AND
- A lawful basis under Art. 6 (parental consent under Art. 8), AND
- Where applicable, a Member State condition under Art. 9(4) (e.g., Italy Codice Privacy Art. 2-septies).

hangel does **not** enable minors to be listed as active blood donors. Minors may only access educational content and family-account read-only features until they reach the legal blood-donation age in their jurisdiction (typically 17 or 18).

## 6. Profiling and Automated Decisions

In accordance with Recital 71 and EDPB Guidelines on Automated Decision-Making (WP251 rev.01), hangel does **not** subject children to:
- Targeted advertising profiling.
- Automated donor-matching scoring that produces legal or similarly significant effects.
- Behavioural analytics SDKs (Firebase Analytics, Crashlytics with user_id) — disabled for child accounts.

## 7. Information Provided to Children

Information notices addressed to children are written in plain, age-appropriate language (EDPB Guidelines on Transparency WP260 rev.01, §10–11). hangel maintains a separate child-friendly notice at `/privacy/kids` with icons, short sentences (Flesch reading ease ≥70), and a one-tap "Talk to my parent" button.

## 8. Right to Erasure (Right to Be Forgotten — Art. 17(1)(f))

Recital 65: where consent was given as a child, the data subject can withdraw consent and obtain erasure even if the data is still being processed at adulthood. hangel honours such requests within 30 days regardless of the original legal basis claimed.

## 9. Data Retention

- Child account data: retained only as long as the user is below the digital consent age. Upon reaching the age, the user is prompted to re-confirm consent under Art. 7. Failure to re-confirm within 30 days triggers automatic deletion.
- Consent logs: retained for the limitation period of the relevant Member State (typically 3–6 years) as evidence under Art. 7(1).

## 10. Cross-Border Transfers

Children's data is not transferred outside the EU/EEA unless covered by Chapter V safeguards (SCCs, adequacy decisions). Türkiye-based hangel servers process child data only where a Member State competent supervisory authority has approved the transfer mechanism (see EU Privacy Policy §8).

## 11. Supervisory Authority Contact

A child or parent may lodge a complaint with the competent Member State supervisory authority (list maintained at `docs/contracts/eu-member-state-overview.md`).

---

**Document control:** managed by hangel DPO. Material amendments require approval of legal counsel and re-issuance of the notice with versioned changelog.
