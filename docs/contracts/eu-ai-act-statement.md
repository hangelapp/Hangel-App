# hangel — EU AI Act Statement

> **DRAFT — Subject to legal review.** This document is a working draft prepared for internal alignment and prospective counsel review. It does **not** constitute legal advice and must be validated by a qualified EU regulatory and medical-devices lawyer before publication or reliance.

- **Service operator:** hangel
- **Document owner:** hangel AI Governance lead
- **Version:** 0.1 — DRAFT
- **Last updated:** 2026-06-03
- **Regulation:** Regulation (EU) 2024/1689 (Artificial Intelligence Act), entered into force **1 August 2024**, with phased application: prohibitions and AI-literacy obligations from **2 February 2025**, General-Purpose AI (GPAI) provider rules from **2 August 2025**, high-risk Annex III rules from **2 August 2026**, and full application by **2 August 2027**.

---

## 1. Purpose and Scope

This statement describes how hangel classifies its AI-enabled features under the AI Act, the obligations it has identified for each, and the controls in place or planned. hangel is, in AI Act terms, primarily a **deployer** of AI systems supplied by third-party providers (OpenAI, Google), and a **provider** only with respect to thin orchestration layers and prompts built on top of those models. hangel is **not** a provider of a General-Purpose AI Model (GPAI) under Article 51.

---

## 2. Inventory of AI Features

| # | Feature | Underlying model(s) | Purpose | Provisional risk class |
|---|---|---|---|---|
| 1 | Blood-matching algorithm | Rule-based + ML scoring | Rank potential donors for a request by blood-type compatibility, geography, recency of last donation, availability | Limited risk → Annex III review required (see §3) |
| 2 | Kütüphane AI (Library Assistant) | OpenAI GPT family / Google Gemini, via API | Answer user questions about donation eligibility, app usage, library content | Limited risk (Article 50 transparency) |
| 3 | Project Writing AI | OpenAI GPT family, via API | Help hospitals/NGOs draft donation campaigns and project descriptions | Limited risk (Article 50 transparency) |
| 4 | Content moderation classifiers | In-house + provider safety APIs | Flag illegal or policy-violating content for human review | Limited risk (no automated final decisions) |

A more granular inventory, including model versions, vendors, and DPA links, is maintained in the internal AI register.

---

## 3. Risk Classification

### 3.1 Prohibited practices (Article 5)
hangel does **not** operate any AI system that:

- deploys subliminal, manipulative or deceptive techniques to materially distort behaviour;
- exploits vulnerabilities of specific groups;
- performs social scoring;
- carries out untargeted scraping of facial images;
- infers emotions in the workplace or educational institutions;
- performs biometric categorisation by sensitive attributes;
- performs real-time remote biometric identification in publicly accessible spaces for law-enforcement purposes.

### 3.2 High-risk classification — blood-matching algorithm (Annex III review)
Annex III of the AI Act lists, among other areas, AI systems intended to be used for "evaluating the eligibility of natural persons for essential public services and benefits, including healthcare services" (Annex III, point 5(a)).

The blood-matching algorithm produces **ranked suggestions** of donors for a given request. It does **not** issue a clinical decision, prescribe a transfusion, or determine eligibility for a healthcare service — the receiving hospital remains the sole decision-maker, and donations always require on-site medical screening by qualified personnel under applicable national blood-bank regulation.

On this basis, hangel's provisional assessment is that the feature falls **outside Annex III point 5(a)**, because the AI system does not in itself decide on access to a healthcare service. It is operated as a **limited-risk discovery and prioritisation tool**. The classification will be reassessed if hangel introduces functionality that:

- automatically matches and dispatches a donor to a recipient without human review;
- ranks recipients by clinical urgency on behalf of a hospital;
- replaces a clinician's eligibility determination.

In addition, the algorithm is reviewed under the **Medical Device Regulation (MDR) (EU) 2017/745** for any qualification as software-as-a-medical-device (SaMD). The current functionality is positioned as **administrative/logistical**, not diagnostic or therapeutic, and is therefore not intended to qualify as a medical device. A formal MDR borderline-product assessment will be requested from a notified body prior to any clinical-decision feature being introduced.

### 3.3 Limited risk — transparency obligations (Article 50)
For features 2, 3 and 4 above (Kütüphane AI, Project Writing AI, content moderation), hangel discloses to users that they are interacting with an AI system, in a clear and distinguishable manner, **at the latest at the time of the first interaction or exposure**.

### 3.4 Minimal risk
Internal-only analytics features (e.g., aggregate dashboards) are minimal risk and outside the scope of additional obligations beyond general data-protection rules.

---

## 4. Article 50 — Transparency Obligations to Users

hangel implements the following user-facing disclosures:

- **Conversational AI:** Each AI assistant surface displays a persistent label ("AI assistant — answers may be incorrect") and shows the model family in the about screen. Users are informed before sending the first message.
- **AI-generated text in project descriptions:** Drafts produced by the Project Writing AI are marked as "AI-assisted draft" in the editor; published content carries a disclosure that AI assistance was used, unless the human author has materially edited the draft (in which case disclosure is recommended but not required by Article 50(4) for clearly creative or editorial works).
- **Synthetic media (Article 50(2)):** hangel does **not** currently generate or manipulate image, audio or video content that constitutes a deep fake. Should this change, content will be marked as artificially generated or manipulated in a machine-readable format.

---

## 5. Article 4 — AI Literacy

hangel ensures, to its best extent, a sufficient level of AI literacy of its staff and contractors dealing with the operation and use of AI systems, taking into account their technical knowledge, experience, education and training and the context in which the AI systems are to be used. An onboarding module and an annual refresher are maintained.

---

## 6. Provider vs Deployer Posture

hangel relies on third-party foundation models (OpenAI, Google Gemini) accessed through their respective APIs. hangel is a **deployer** of those AI systems and, with respect to its prompt-engineered orchestrations, may be a **provider of a limited-risk AI system**. hangel is **not** a provider of a General-Purpose AI Model under Article 51 (it does not train or substantially modify GPAI models).

Obligations flowing from this posture:

- Maintain written agreements with model providers documenting their compliance with applicable GPAI provider obligations (Articles 53–55) and reflecting the necessary information to enable hangel to comply with Article 50.
- Cooperate with model providers under Article 25 (responsibility along the AI value chain) where hangel's deployment context is material to risk classification.
- Retain logs sufficient to investigate user complaints and incidents (see §8).

---

## 7. Logging, Monitoring and Incident Response

- **Logging:** Prompts, responses, model identifiers, timestamps and user identifiers (pseudonymised where feasible) are retained for **30 days** by default for safety and abuse investigation; users may request deletion under GDPR Articles 17 and 21.
- **Monitoring:** Automated quality and safety metrics (refusal rate, toxicity rate, hallucination spot-checks) are reviewed monthly.
- **Incident response:** Serious incidents — including any erroneous output that could foreseeably lead to harm — are triaged within 24 hours and, where applicable under Article 73 (post-market monitoring for high-risk systems, when activated), reported to the relevant market-surveillance authority.

---

## 8. User Notice and Opt-Out

- Every AI surface includes a one-tap toggle to disable AI suggestions for that user. The blood-matching algorithm cannot be fully disabled (it underpins the core service) but users can choose **manual search** mode as an alternative path.
- A consolidated AI settings screen (Settings → AI Features) lists each AI feature, its purpose, the underlying provider, the data sent, and the toggle state.
- A "Report an AI response" affordance is present on every AI surface; reports are routed to human review and feed back into prompt and policy updates.

---

## 9. Data Protection Interaction

Use of personal data with AI features is governed by hangel's Privacy Policy and DPIA. Key principles:

- **No special-category data** (e.g., health) is sent to general-purpose LLMs unless the user has been informed and a clear necessity/legal basis exists.
- **No training on user data** by third-party providers: hangel uses API endpoints with documented "no training" guarantees (OpenAI API zero-retention / Google Vertex AI default).
- **Automated decision-making (Article 22 GDPR):** AI outputs are advisory; final decisions impacting users (account suspension, content removal) require human review.

---

## 10. Roadmap and Open Items

- Formal MDR borderline-product assessment for the blood-matching algorithm.
- Annex III reassessment if hangel adds clinical-urgency ranking on behalf of hospitals.
- Publication of model cards for each AI surface, summarising intended use, limitations, evaluation, and contact.
- Alignment with the forthcoming harmonised standards once published by CEN-CENELEC JTC 21.

---

## 11. Document Governance

- Owner: hangel AI Governance lead
- Review cycle: every 6 months until full AI Act application (August 2027), then every 12 months
- Cross-references: `eu-dsa-compliance.md`, `eu-terms-of-service.md`, `privacy-policy.md`, `dpia.md`
