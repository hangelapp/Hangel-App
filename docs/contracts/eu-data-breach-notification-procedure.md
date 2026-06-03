# hangel — EU Personal Data Breach Notification Procedure (GDPR Art. 33–34)

> **DRAFT — NOT LEGAL ADVICE.** Working draft requiring review by qualified EU counsel and information-security counsel before adoption.

**Effective date:** \[YYYY-MM-DD]
**Version:** 1.0 (draft)
**Last updated:** 2026-06-03

---

## 1. Purpose

This procedure governs the detection, assessment, internal escalation, supervisory authority notification, and data subject communication of personal data breaches affecting hangel, in compliance with:

- **GDPR Art. 33** — Notification of a personal data breach to the supervisory authority (within **72 hours** of becoming aware).
- **GDPR Art. 34** — Communication of a personal data breach to the data subject ("without undue delay" where high risk).
- **EDPB Guidelines 9/2022** on personal data breach notification under the GDPR (replacing WP250 rev.01).
- NIS2 Directive (EU 2022/2555) where hangel is in scope as an essential or important entity.

## 2. Definition (Art. 4(12))

A "personal data breach" means a breach of security leading to the accidental or unlawful **destruction, loss, alteration, unauthorised disclosure of, or access to**, personal data transmitted, stored or otherwise processed. Three categories:

- **Confidentiality breach** — unauthorised or accidental disclosure or access.
- **Integrity breach** — unauthorised or accidental alteration.
- **Availability breach** — accidental or unauthorised loss of access or destruction.

A single incident may belong to more than one category.

## 3. Detection Sources

- Cloud Logging alerts (auth anomalies, IAM changes, exfiltration patterns).
- Firebase App Check + security rules denial spikes.
- Crashlytics / Sentry exception patterns indicating data exposure.
- Bug bounty / responsible disclosure submissions to `security@hangel.org`.
- Processor notifications (Art. 33(2) — processor must notify controller without undue delay).
- Internal reports from any staff member.
- External reports from data subjects, regulators, media, law enforcement.

## 4. "Awareness" Clock (Recital 87, EDPB Guidelines 9/2022)

The 72-hour clock starts when hangel has **reasonable degree of certainty** that a security incident has occurred that led to personal data being compromised — not at first suspicion. A brief investigation to confirm the breach is permitted; it must not be used to delay notification.

## 5. Severity Assessment

Within **24 hours** of detection, the security-lead + DPO complete a risk assessment using the ENISA Methodology for Severity Assessment plus EDPB factors:

| Factor | Considerations |
|--------|----------------|
| Type of breach | Confidentiality / integrity / availability |
| Nature of personal data | Special categories? Identification data? Financial? Children's? |
| Ease of identification | Direct identifiers? Pseudonymised? Encrypted with key not compromised? |
| Severity of consequences | Identity theft, fraud, financial loss, reputational damage, discrimination, physical harm |
| Special characteristics of individuals | Vulnerable groups, minors, patients |
| Special characteristics of controller | Type of service (health-adjacent for hangel) |
| Number of affected data subjects | Order of magnitude |

Output: **Risk Level** = none / low / medium / high / very high.

## 6. Notification Decision Matrix

| Risk Level | SA Notification (Art. 33) | Data Subject Communication (Art. 34) |
|------------|---------------------------|--------------------------------------|
| None | No (document under Art. 33(5)) | No |
| Low | Yes | No, unless SA requires |
| Medium | Yes | Case-by-case; usually No if mitigations applied |
| High | Yes | **Yes**, unless Art. 34(3) exception applies |
| Very High | Yes (priority) | **Yes**, immediate |

### Art. 34(3) Exceptions to Subject Communication

(a) Encryption or other technical/organisational measures rendered data unintelligible to unauthorised persons (and key not compromised).
(b) Subsequent measures eliminated the high risk.
(c) Disproportionate effort — replaced by a public communication.

## 7. Supervisory Authority Notification (Art. 33)

### 7.1 Lead SA Determination

For cross-border processing, hangel notifies the **lead supervisory authority** identified under Art. 56 + EDPB Guidelines 8/2022. Until a Member State main establishment is designated, hangel notifies the SA of each Member State where data subjects are materially affected.

### 7.2 Notification Content (Art. 33(3))

a) Nature of the breach, including categories and approximate number of data subjects and records concerned.
b) Name and contact details of the DPO or other contact point.
c) Likely consequences of the breach.
d) Measures taken or proposed to address the breach and mitigate possible adverse effects.

### 7.3 Phased Notification

If full information is not available within 72 hours, hangel notifies **partial information first** within the 72-hour window, then follows up with completing details "without undue further delay" (Art. 33(4)).

### 7.4 Channels

Use each SA's online portal:

| Country | Portal |
|---------|--------|
| Ireland (DPC) | https://forms.dataprotection.ie/breach-notification |
| Germany (BfDI / Länder) | Per state DPA |
| France (CNIL) | https://notifications.cnil.fr |
| Italy (Garante) | https://servizi.gpdp.it |
| Spain (AEPD) | https://sedeagpd.gob.es |
| Netherlands (AP) | https://datalekken.autoriteitpersoonsgegevens.nl |
| ... | See `eu-member-state-overview.md` for full list |

## 8. Data Subject Communication (Art. 34)

When required, the communication must be in **clear and plain language** and contain at least items (b)–(d) of Art. 33(3). Channels:

- **Primary:** in-app message + push notification + email to the registered address.
- **Backup:** SMS if available; public notice on hangel.org/security-notices for hard-to-reach individuals.
- **Languages:** Member State official language(s) of each affected user.

Timing: "without undue delay" — typically within the same week as SA notification; immediately for very-high-risk events (e.g., active fraud campaign).

## 9. Internal Documentation (Art. 33(5))

Every personal data breach — notifiable or not — must be documented in `breach_register/{breachId}`:

```
{
  detectedAt: timestamp,
  awarenessAt: timestamp,
  breachType: 'confidentiality' | 'integrity' | 'availability' | string[],
  description: string,
  affectedSystems: string[],
  affectedDataCategories: string[],
  specialCategories: boolean,
  childrenAffected: boolean,
  approxSubjectsAffected: number,
  approxRecordsAffected: number,
  riskAssessment: { method: string, level: 'none'|'low'|'medium'|'high'|'very_high', rationale: string },
  saNotifications: [{ authority: string, notifiedAt: timestamp, reference: string, phased: boolean }],
  subjectCommunications: [{ method: string, sentAt: timestamp, count: number }],
  mitigations: string[],
  rootCause: string,
  preventiveActions: string[],
  closedAt: timestamp | null
}
```

Retention: minimum 5 years; longer if SA-related litigation pending.

## 10. Processor Obligations

Data processing agreements with hangel processors (Art. 28(3)(f)) require notification to hangel **within 24 hours** of the processor becoming aware. Failure invokes contractual penalties + audit rights. List of processors in `docs/audit/runbooks/processor-registry.md` (planned).

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| Detector (any staff/processor) | Report within 1 hour of suspicion to `security@hangel.org` and on-call security-lead. |
| Security-lead | Triage, containment, evidence preservation, technical assessment. |
| DPO | Legal assessment, notification decisions, SA + data subject communications. |
| Backend-lead | Forensic extraction (logs, dataset diff), remediation rollout. |
| Product-lead | Public communications, customer support scripting. |
| Devops-lead | Infrastructure isolation, credential rotation. |
| CEO / executive sponsor | Final sign-off on high/very-high notifications; external counsel engagement. |

## 12. Drills and Improvement

- Quarterly tabletop exercise simulating a confidentiality breach of donor health data.
- Annual review of this procedure with lessons-learned integration.
- Post-incident review (blameless) within 14 days of closure.

## 13. Interaction with Other Regimes

- **NIS2 (EU 2022/2555):** if hangel qualifies, additional 24h early warning + 72h incident notification + 1-month final report to CSIRT/competent authority.
- **eIDAS / DORA:** not currently in scope.
- **Member State health-data laws:** may impose parallel notifications (e.g., Italian Garante + Ministry of Health).
- **Law enforcement:** notify where criminal activity suspected, balanced against not tipping off attackers (coordinate with SA).

---

**Owner:** hangel DPO + security-lead (joint). Reviewed annually.
