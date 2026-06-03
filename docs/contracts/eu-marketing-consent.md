# hangel — EU Marketing Communications Consent (ePrivacy + GDPR)

> **DRAFT — NOT LEGAL ADVICE.** Working draft requiring review by qualified EU counsel admitted in the Member State(s) of operation. ePrivacy implementation differs by country; consult `de-bdsg-supplement.md`, `fr-loi-informatique-libertes.md`, `es-lopdgdd-supplement.md`, `it-codice-privacy.md` for local specifics.

**Effective date:** \[YYYY-MM-DD]
**Version:** 1.0 (draft)
**Last updated:** 2026-06-03

---

## 1. Purpose

This procedure defines how hangel collects, records, and honours user consent for **direct marketing communications** (email, SMS, push, in-app messages, voice calls) in compliance with:

- ePrivacy Directive 2002/58/EC, Art. 13 (unsolicited communications).
- GDPR Art. 6(1)(a), 7 (consent) and Art. 21(2) (right to object to direct marketing).
- Member State ePrivacy transpositions: TTDSG §13 (DE), CPCE Art. L34-5 (FR), LSSI-CE Art. 21 (ES), Codice Privacy Art. 130 (IT).

## 2. Definitions

- **Marketing communication:** any electronic message promoting services, fundraising campaigns, partner brand offers, or non-transactional content.
- **Transactional message:** account security, donation confirmations, blood-request alerts the user opted into, legal notices — NOT subject to this policy.
- **Soft opt-in:** narrow ePrivacy Art. 13(2) exception allowing marketing to existing customers about *similar* products where opt-out was offered at point of collection and in every subsequent message.

## 3. Consent Standards

Consent must be (Art. 4(11), 7 GDPR; EDPB Guidelines 05/2020):

1. **Freely given** — no service degradation if the user refuses.
2. **Specific** — granular per channel (email, SMS, push) and per purpose (own campaigns, partner offers, fundraising).
3. **Informed** — controller identity, channels, frequency, withdrawal mechanism disclosed at point of collection.
4. **Unambiguous** — affirmative action; no pre-ticked boxes (Planet49 CJEU C-673/17).
5. **Withdrawable** — as easy to withdraw as to give (Art. 7(3)).
6. **Demonstrable** — proof of consent recorded in `consent_logs` (timestamp, IP, UA, version of notice presented, exact wording).

## 4. Consent UI Requirements

- Separate checkboxes per channel and per purpose; never bundled with Terms acceptance.
- "Accept all" and "Reject all" buttons with equal visual prominence (CNIL Cookies Recommandation 2020; Garante 10 June 2021).
- Clear language: "I want to receive monthly campaign emails from hangel" — NOT "I agree to receive communications relevant to me."
- Frequency disclosure: estimate messages per month.
- Link to this policy and unsubscribe mechanism.

## 5. Recording Consent

Each consent event creates an immutable record at `consent_logs/{userId}/marketing/{eventId}`:

```
{
  channel: 'email' | 'sms' | 'push' | 'voice',
  purpose: 'own_campaigns' | 'partner_offers' | 'fundraising',
  granted: boolean,
  timestamp: serverTimestamp,
  source: 'signup' | 'settings' | 'campaign_landing',
  ip: string,
  userAgent: string,
  noticeVersion: string,   // hash of consent text
  consentText: string      // exact text shown
}
```

Retention: limitation period of the Member State for evidentiary purposes (typically 3–6 years after withdrawal).

## 6. Withdrawal Mechanisms

Mandatory in every marketing message (Art. 13(4) ePrivacy):

- **Email:** RFC 8058 `List-Unsubscribe` header + visible unsubscribe link in body; one-click effective.
- **SMS:** "STOP" reply handled within 24 hours.
- **Push:** in-app toggle accessible within two taps from main menu.
- **Voice:** opt-out announcement at start of call + DTMF opt-out key.

Withdrawal effective within 24 hours; reflected immediately in user preferences and propagated to ESP/SMS gateway suppression lists.

## 7. Soft Opt-In Limits

Where hangel relies on the Art. 13(2) ePrivacy soft opt-in:
- Applies only to **existing donors who completed at least one donation** AND for whom the email address was collected in the context of that donation.
- Promoted content must be **similar** (blood donation campaigns, related health services) — NOT third-party fundraising or commercial partner offers.
- Opt-out provided at collection AND in every subsequent message.
- Germany: TTDSG §13(2) requires the user to have **purchased a product or service for consideration** — hangel may NOT rely on soft opt-in in DE for unpaid donor accounts.
- France: CPCE Art. L34-5 allows soft opt-in only for *natural persons in a professional capacity* with prior similar transactions — narrower than UK PECR.

## 8. Children

Marketing to minors (under digital consent age — see `eu-child-privacy-policy.md` §3) is **prohibited**, regardless of parental consent, in line with Recital 38 and the EDPB Guidelines 1/2020 on connected vehicles (analogously applied).

## 9. Profiling for Marketing

Profiling for marketing purposes (segmentation, lookalike audiences, behavioural targeting) requires:
- Separate consent under Art. 22 if it produces legal or similarly significant effects (rare for marketing).
- Right-to-object exercisable at any time, free of charge, by a clearly accessible control (Art. 21(2)–(3)).
- Suppression upon objection — no further processing for that purpose.

## 10. Third-Country Transfers

Email/SMS providers (e.g., SendGrid US, Twilio US) processing personal data must be covered by a valid Chapter V mechanism (SCC 2021/914 + transfer impact assessment). Marketing consent does not authorise transfers absent these safeguards.

## 11. Enforcement and Sanctions

Non-compliance exposes hangel to:
- Up to €20M / 4% global turnover under GDPR Art. 83(5)(a).
- National ePrivacy fines (CNIL: up to €375k or 4% turnover; Garante: up to €20M).
- Civil claims by data subjects under Art. 82.

## 12. Internal Process

1. Marketing team submits campaign brief to DPO.
2. DPO verifies: lawful basis, audience consent state, content compliance, suppression list integrity.
3. ESP send-job tagged with `consent_check_id`; sends blocked if check fails.
4. Bounce/complaint rate monitored; suppression upon any opt-out signal (RFC 8058, ARF, DMARC reports).

---

**Owner:** hangel DPO. Reviewed annually or upon ePrivacy Regulation entry into force.
