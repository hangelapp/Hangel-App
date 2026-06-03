# hangel — EU Data Subject Request Handling Procedure (GDPR Art. 12–22)

> **DRAFT — NOT LEGAL ADVICE.** Working draft requiring review by qualified EU counsel before adoption.

**Effective date:** \[YYYY-MM-DD]
**Version:** 1.0 (draft)
**Last updated:** 2026-06-03

---

## 1. Purpose and Scope

This procedure operationalises hangel's obligations under GDPR Articles 12–22 to receive, verify, evaluate, and respond to data subject requests (DSRs):

- **Art. 15** — Right of access
- **Art. 16** — Right to rectification
- **Art. 17** — Right to erasure ("right to be forgotten")
- **Art. 18** — Right to restriction of processing
- **Art. 19** — Notification obligation
- **Art. 20** — Right to data portability
- **Art. 21** — Right to object
- **Art. 22** — Rights related to automated individual decision-making

It applies to all hangel personnel and to processors acting on hangel's behalf.

## 2. Intake Channels

Requests are accepted through any reasonable channel:

- Email: `privacy@hangel.org` (primary).
- In-app: Settings → Privacy → Submit Request (preferred — triggers structured ticket).
- Postal: hangel data controller registered office.
- Through the appointed EU Representative (Art. 27).
- Via the competent supervisory authority.

Each request entering any channel must be logged in the `dsr_tickets` Firestore collection within one business day with status `received`.

## 3. Acknowledgement and Timeline (Art. 12(3))

- **Acknowledgement:** within 72 hours, confirming receipt and expected response date.
- **Substantive response:** **within one (1) month** of receipt.
- **Extension:** up to two additional months where complexity or volume requires it. Data subject must be informed of the extension and reasons within the first month.
- **Refusal:** if hangel does not act, the data subject must be informed within one month with reasons and the right to lodge a complaint with the supervisory authority and to seek judicial remedy.

Clock starts on the day after receipt; ends at the equivalent calendar day of the following month (Council Regulation No 1182/71).

## 4. Identity Verification (Recital 64, Art. 12(6))

Verification is **proportionate**, not maximalist. Excessive ID demands (e.g., government ID for a registered account holder) are a GDPR violation per EDPB Guidelines 01/2022.

| User state | Verification |
|------------|--------------|
| Authenticated session via app/web | Session token sufficient; no further ID required. |
| Email request from registered email | Magic-link confirmation to that email. |
| Email request from unverified address | Magic-link to claimed account email + recent activity confirmation (e.g., last donation date). |
| Postal / third party | Sufficient information to reasonably link the requester to an account; further proof only where reasonable doubt persists. |
| Suspected impersonation | Government-issued ID (passport/national ID), copy redacted to name + photo + DOB only, deleted after verification. |

Verification artefacts retained 30 days post-resolution, then deleted.

## 5. Routing

| Request type | Owner | Tooling |
|--------------|-------|---------|
| Access (Art. 15) | DPO + backend-lead | `scripts/dsr-export.ts` (planned) |
| Rectification (Art. 16) | Backend-lead | Admin console |
| Erasure (Art. 17) | DPO + security-lead | `scripts/dsr-erase.ts` (planned) |
| Restriction (Art. 18) | DPO + backend-lead | Firestore `restricted: true` flag |
| Portability (Art. 20) | Backend-lead | JSON export endpoint |
| Object (Art. 21) | DPO | Marketing suppression + flag |
| Automated decision (Art. 22) | DPO + product-lead | Human review queue |

## 6. Response Format (Art. 12(1))

Responses are provided in a concise, transparent, intelligible, and easily accessible form, using clear and plain language. Default channel: same as the request. Default format for access/portability: machine-readable JSON + human-readable PDF summary.

## 7. Specific Rights — Operational Notes

### 7.1 Right of Access (Art. 15)

Provide copies of personal data being processed plus the meta-information in Art. 15(1)(a)–(h). For multi-source data, aggregate from: Firestore (users, donations, consent_logs, messages), Cloud Logging (auth events), payment provider (donation records), analytics (where user_id retained). Exclude trade secrets / IP, but cannot refuse outright (Recital 63).

### 7.2 Right to Erasure (Art. 17)

Evaluate grounds (a)–(f) AND exceptions (3)(a)–(e). Common grounds for refusal:
- Legal obligation to retain (tax/accounting: ~10y; donor traceability: per blood-banking law).
- Establishment, exercise, or defence of legal claims.

If erasure granted: hard delete from primary stores, schedule purge from backups within 90 days (or apply technical isolation until backup rotation completes), notify recipients (Art. 19) and processors. Logs of the erasure event retained for audit (no personal data).

### 7.3 Right to Portability (Art. 20)

Scope: personal data **provided by** the data subject, processed on consent or contract, by automated means. Export format: JSON (donor profile, donation history, messages, consent logs). Direct transmission to another controller "where technically feasible" — hangel offers email delivery only at this time.

### 7.4 Right to Object — Marketing (Art. 21(2))

Absolute and immediate. No assessment of grounds. Implementation within 24 hours; reflected in `consent_logs` and ESP suppression lists.

### 7.5 Right to Object — Other (Art. 21(1))

For processing based on Art. 6(1)(e) or (f), hangel must demonstrate compelling legitimate grounds overriding the data subject's interests, or the processing must serve legal claims.

### 7.6 Automated Decision-Making (Art. 22)

Donor matching algorithms producing significant effects: provide meaningful information about the logic, significance, envisaged consequences, plus human-in-the-loop review on request.

## 8. Refusal Grounds (Art. 12(5))

Manifestly unfounded or excessive (in particular repetitive) requests may be:
- Charged a reasonable fee, OR
- Refused.

Burden of proof on the controller. Document the assessment in the ticket.

## 9. Notification of Third Parties (Art. 19)

Where personal data was disclosed to recipients (processors, partner NGOs, brand partners), notify each recipient of rectification, erasure, or restriction unless impossible or disproportionate. Maintain `data_recipients` registry to support this.

## 10. Records

`dsr_tickets/{ticketId}` schema:
```
{
  type: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'object' | 'art22',
  channel: 'email' | 'app' | 'post' | 'eu_rep' | 'sa',
  receivedAt: timestamp,
  acknowledgedAt: timestamp,
  identityVerifiedAt: timestamp | null,
  identityMethod: string,
  dueDate: timestamp,
  status: 'received' | 'verifying' | 'in_progress' | 'extended' | 'completed' | 'refused',
  outcome: string,
  refusalReason: string | null,
  extensionReason: string | null,
  artefactsRef: string  // Cloud Storage path, encrypted
}
```

Retention: 3 years after closure (limitation for Art. 82 claims, variable by Member State).

## 11. SA Liaison and Complaints

Where the data subject lodges a complaint with a supervisory authority (Art. 77) and the SA requests information, the DPO coordinates the response within the SA's stated deadline.

## 12. Continuous Improvement

Monthly DPO review of DSR metrics: volume, mean time to response, refusal rate, complaint rate. Quarterly reporting to leadership; annual update to this procedure.

---

**Owner:** hangel DPO. Reviewed annually.
