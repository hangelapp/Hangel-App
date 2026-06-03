# hangel — EU Cookie Policy (ePrivacy + GDPR)

> **DRAFT — NOT LEGAL ADVICE.** This document is a working draft. It MUST be reviewed by a qualified EU data protection lawyer before publication. ePrivacy implementation differs by Member State (e.g., Germany TTDSG, France LIL Art. 82, Italy Codice Privacy Art. 122). Adjust as required.

**Effective date:** \[YYYY-MM-DD]
**Version:** 0.1 (draft)
**Last updated:** 2026-06-03

---

## 1. Introduction

This Cookie Policy explains how hangel uses cookies and similar technologies (local storage, session storage, pixels, SDK identifiers) on the **hangel.org** website and web-based components of the hangel Service. It is issued in compliance with:

- **ePrivacy Directive 2002/58/EC** (as amended by 2009/136/EC), as transposed into national law by EU/EEA Member States;
- **General Data Protection Regulation (EU) 2016/679 (GDPR)** for any processing of personal data set via cookies;
- The forthcoming **ePrivacy Regulation** (draft) — this Policy will be updated upon entry into force;
- Guidance of the **European Data Protection Board (EDPB)** on consent (05/2020) and on cookie walls (Guidelines 05/2020, paragraphs 38–41).

It complements the **EU Privacy Policy**, which governs general processing of personal data.

---

## 2. What Are Cookies and Similar Technologies?

A **cookie** is a small text file placed on the user's device by the website. **Similar technologies** include browser local storage, session storage, IndexedDB, web beacons, pixels, fingerprinting techniques, and SDK identifiers within native apps. All are referred to as "cookies" in this Policy for simplicity.

---

## 3. Categories of Cookies Used

Pursuant to **Article 5(3) of the ePrivacy Directive**, hangel obtains the user's **prior, freely given, specific, informed, and unambiguous consent** before placing any non-essential cookie on the user's terminal equipment.

### 3.1 Strictly Necessary (no consent required — Art. 5(3) exemption)

| Cookie | Provider | Purpose | Duration |
|---|---|---|---|
| `hangel_session` | hangel (first party) | Maintain authenticated session | Session |
| `hangel_csrf` | hangel | CSRF protection | Session |
| `hangel_consent` | hangel | Store cookie consent choices | 12 months |
| `cf_clearance` | Cloudflare | DDoS / bot protection | 30 days |
| `__cf_bm` | Cloudflare | Bot management | 30 minutes |

These cookies are strictly necessary for the technical operation of the Service and the security of the communication. They cannot be disabled via the consent banner.

### 3.2 Preferences (opt-in consent)

| Cookie | Provider | Purpose | Duration |
|---|---|---|---|
| `hangel_locale` | hangel | Remember UI language | 12 months |
| `hangel_theme` | hangel | Remember light/dark theme | 12 months |
| `hangel_region` | hangel | Remember region selector | 12 months |

### 3.3 Statistics / Analytics (opt-in consent)

| Cookie | Provider | Purpose | Duration | Privacy policy |
|---|---|---|---|---|
| `_ga`, `_ga_*` | Google Analytics 4 (Google Ireland Ltd) | Aggregated usage statistics, IP-anonymised | 13 months | https://policies.google.com/privacy |
| `_clck`, `_clsk` | Microsoft Clarity (optional, only if enabled) | Session replay (masked) | 12 months | https://privacy.microsoft.com |

Analytics cookies are loaded **only after** consent. IP addresses are anonymised (last octet truncated) and Google Signals is **disabled**.

### 3.4 Marketing (opt-in consent)

| Cookie | Provider | Purpose | Duration |
|---|---|---|---|
| `_fbp` | Meta Pixel (Meta Platforms Ireland Ltd) | Conversion measurement | 90 days |
| `MUID` | Microsoft Advertising | Conversion measurement | 13 months |

Marketing cookies are deployed only after explicit consent and may involve transfers to third countries under SCCs + DPF where applicable.

---

## 4. Consent Mechanism

### 4.1 Banner Behaviour

On first visit and after each consent expiry (12 months) or material change, hangel displays a **consent banner** at the bottom of the page presenting:

- A clear summary of the categories of cookies used;
- Equally prominent buttons "**Accept all**", "**Reject all**", and "**Manage preferences**" — the reject and accept options are visually equivalent, in line with **EDPB Guidelines 03/2022** on deceptive design patterns;
- A link to this Cookie Policy and the Privacy Policy.

Until the user makes an active choice, **no non-essential cookies are set** and **no third-party scripts are loaded** (pre-consent blocking).

### 4.2 Granular Choice

In "Manage preferences", users can toggle each non-essential category independently (Preferences / Statistics / Marketing). Toggles default to **off** (opt-in).

### 4.3 Withdrawal

Consent can be withdrawn at any time, as easily as it was given, via the **"Cookie settings"** link in the website footer or via Settings → Privacy → Cookies in the app. Withdrawal does not affect the lawfulness of processing before withdrawal.

### 4.4 No Cookie Walls

In accordance with **EDPB Guidelines 05/2020 on consent** (paragraphs 38–41), access to the Service is **not conditioned on consent** to non-essential cookies. Users who refuse non-essential cookies retain full access to all core functionality.

### 4.5 Consent Records

Each consent action (timestamp, IP truncated, choices, banner version, user agent) is logged for **24 months** as proof of consent (Art. 7(1) GDPR).

---

## 5. Third-Country Transfers

Some providers above transfer data to the United States. Transfers rely on **EU Standard Contractual Clauses** (Commission Implementing Decision 2021/914) and, where applicable, the **EU-US Data Privacy Framework**. A Transfer Impact Assessment is on file and available to the supervisory authority upon request.

---

## 6. Mobile Apps and SDK Identifiers

In the native iOS and Android apps, similar opt-in consent applies before any non-essential SDK identifier is read or set, in particular:

- Apple **App Tracking Transparency (ATT)** prompt before any access to the IDFA;
- Android **Advertising ID** access subject to consent and Google Play policy;
- Firebase Analytics is initialised in **measurement-disabled** mode and only enabled after consent.

---

## 7. Updates

Updates to this Cookie Policy are notified via the banner upon material change. The current version is always at hangel.org/legal/cookies.

---

## 8. Contact

DPO email: dpo@hangel.org

To lodge a complaint with the competent supervisory authority, see the EDPB directory: https://edpb.europa.eu/about-edpb/board/members\_en

---

*End of EU Cookie Policy — Draft v0.1.*
