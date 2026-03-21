import { z } from 'zod';
import type { AIResult } from '../types';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const AIResultSchema = z.object({
  summary_bullets: z.array(z.string()).min(2).max(4),
  category: z.enum([
    'Billing', 'Claims', 'Endorsement', 'General',
    'Urgent', 'Spam', 'Technical', 'Legal', 'Complaint',
  ]),
  priority: z.enum(['P1', 'P2', 'P3']),
  suggested_action: z.string(),
  draft_reply: z.string(),
  confidence: z.number().min(0).max(1),
});

// ─── Preset templates ─────────────────────────────────────────────────────────

const TEMPLATES: AIResult[] = [
  // 0 — Billing dispute
  {
    summary_bullets: [
      'Customer disputes invoice amount — claims wrong tier was billed.',
      'References signed contract as evidence of agreed pricing.',
      'Hard deadline: net-30 payment due date requires resolution.',
    ],
    category: 'Billing',
    priority: 'P2',
    suggested_action: 'Pull the original contract, verify seat tier, issue corrected invoice or credit memo within 2 business days.',
    draft_reply: `Hi {name},

Thank you for bringing this to our attention. I've pulled your account and located the signed agreement from April 2024 — you're absolutely right that your contract specifies the Standard tier at 3 seats through Q1 2025.

I'm issuing a corrected invoice now and will send a credit memo for the overcharge of $1,780.00 within 1 business day. Your accounts payable team will receive both documents directly.

Apologies for the billing error. Please don't hesitate to reach out if you have any questions.

Best regards`,
    confidence: 0.94,
  },

  // 1 — Claims / vehicle damage
  {
    summary_bullets: [
      'Vehicle damage claim with full supporting documentation attached.',
      'Third-party insurer (State Farm) has already been notified.',
      'Repair estimate from body shop: $8,200.',
    ],
    category: 'Claims',
    priority: 'P2',
    suggested_action: 'Acknowledge receipt, assign adjuster, request MVR and State Farm claim number, schedule inspection within 5 business days.',
    draft_reply: `Hi {name},

Thank you for submitting all the documentation for claim #CLM-2024-5541. I can confirm we've received the police report, photos, repair estimate, and driver statement.

I'm assigning your claim to one of our adjusters who will be in touch within 1 business day to schedule the vehicle inspection and coordinate with State Farm on the liability determination.

In the meantime, if you need a rental vehicle while your Transit is in for repairs, please let me know and I can authorize that coverage.

Best regards`,
    confidence: 0.91,
  },

  // 2 — Endorsement / policy change
  {
    summary_bullets: [
      'Requesting mid-term endorsement to add a new driver to fleet policy.',
      'Driver has a clean MVR — low risk addition.',
      'Wants effective date of December 1.',
    ],
    category: 'Endorsement',
    priority: 'P2',
    suggested_action: 'Run MVR verification, calculate pro-rated premium adjustment, issue updated declarations page within 24 hours.',
    draft_reply: `Hi {name},

Thanks for sending the driver details. I've started the endorsement process for policy HI-88321-B to add Sandra Okafor effective December 1, 2024.

A clean MVR is great news — based on the details provided, I expect a modest pro-rated premium adjustment for the remainder of the policy term. I'll have the updated declarations page and a premium notice to you within 24 hours.

If you need the endorsement confirmed before then for any operational reason, just reply here and I'll prioritize.

Best regards`,
    confidence: 0.95,
  },

  // 3 — Urgent / outage
  {
    summary_bullets: [
      'Production outage — all agents offline, license server unreachable.',
      'Customer has 200+ in queue, revenue impact ongoing.',
      'Customer has already tried basic remediation steps.',
    ],
    category: 'Urgent',
    priority: 'P1',
    suggested_action: 'Escalate immediately to on-call engineering. Open incident bridge. Acknowledge within 5 minutes. Check license service status dashboard.',
    draft_reply: `Hi {name},

I'm escalating this to our on-call engineering team right now and opening an incident bridge.

Our on-call engineer will reach out to you directly within the next 10 minutes. While we investigate, can you confirm:
1. Your server region / data center (US-East, US-West, EU)?
2. Whether the error appeared immediately after a recent deployment or config change on your end?

I'll stay on this thread until it's resolved.

Status page: status.yourplatform.com

Best regards`,
    confidence: 0.97,
  },

  // 4 — Spam / prompt injection
  {
    summary_bullets: [
      'Identified as spam — prize/reward phishing attempt.',
      'Contains embedded prompt injection attack targeting AI systems.',
      'No legitimate business request — safe to discard.',
    ],
    category: 'Spam',
    priority: 'P3',
    suggested_action: 'Mark as spam, do not reply, flag the prompt injection attempt to the security team for logging.',
    draft_reply: `[No reply recommended — this is a spam/phishing message. Flag to security team and close.]`,
    confidence: 0.99,
  },

  // 5 — General / short / ambiguous
  {
    summary_bullets: [
      'Brief cancellation request with no reason provided.',
      'Account may be a churn risk — no context given.',
    ],
    category: 'General',
    priority: 'P2',
    suggested_action: 'Reach out to understand the reason for cancellation. Offer a retention touchpoint before processing.',
    draft_reply: `Hi {name},

I received your cancellation request. Before I process it, I'd love to understand what's driving this decision — even a quick sentence would help us improve.

If there's a specific issue we can resolve (pricing, a feature gap, a support experience), I'd be glad to connect you with someone who can help.

If you'd still like to proceed, just confirm and I'll take care of it right away.

Best regards`,
    confidence: 0.82,
  },

  // 6 — Technical / API / integration
  {
    summary_bullets: [
      'API integration broke after a platform maintenance window.',
      'OAuth tokens are failing with invalid_grant error.',
      'CTO is the contact — high-visibility issue for a mid-size account.',
    ],
    category: 'Technical',
    priority: 'P1',
    suggested_action: 'Check if Nov 25 maintenance changed OAuth token expiry or revoked app credentials. Provide re-authorization steps. Escalate to integrations team if widespread.',
    draft_reply: `Hi {name},

Thanks for flagging this. The November 25 maintenance window included a security update that rotated OAuth signing keys — this would explain the invalid_grant errors even after you refreshed tokens, because the old tokens were signed with the previous key.

To fix this:
1. Go to Settings → Integrations → Salesforce
2. Click "Disconnect" then "Reconnect"
3. Re-authorize with your Salesforce admin credentials

This is a known post-maintenance step for OAuth apps. Your Kevin should be unblocked within 5 minutes. If the issue persists after reconnecting, reply here and I'll escalate to our integrations team directly.

Apologies for the disruption.

Best regards`,
    confidence: 0.88,
  },

  // 7 — Legal / compliance
  {
    summary_bullets: [
      'Formal GDPR Article 17 right-to-erasure request via legal counsel.',
      'Statutory 30-day response window applies.',
      'Failure to comply risks supervisory authority complaint.',
    ],
    category: 'Legal',
    priority: 'P1',
    suggested_action: 'Forward to DPO and legal team immediately. Log receipt timestamp. Confirm within 72 hours. Initiate erasure workflow for all data processors.',
    draft_reply: `Dear Mr O'Brien,

Thank you for this formal erasure request on behalf of your client, Elaine Murray.

I can confirm receipt of this request as of {date}. In accordance with Article 17 GDPR, we will:

1. Complete the erasure of all personal data within 30 days of this date
2. Notify all relevant data processors who hold Ms Murray's data
3. Provide written confirmation of deletion upon completion

Our Data Protection Officer has been notified and will oversee the process. You can direct any follow-up questions to dpo@yourplatform.com.

Yours faithfully`,
    confidence: 0.96,
  },

  // 8 — Complaint / agent conduct
  {
    summary_bullets: [
      'Formal complaint about agent conduct — customer felt dismissed and interrupted.',
      '4-year customer with churn risk if not handled carefully.',
      'Customer requests call recording review and corrective action.',
    ],
    category: 'Complaint',
    priority: 'P1',
    suggested_action: 'Pull call recording CR-20241122-0093. Acknowledge formally within same business day. Escalate to QA for review. Assign senior agent for follow-up.',
    draft_reply: `Hi {name},

Thank you for taking the time to write to us about your experience on November 22nd. I want to sincerely apologize — the interaction you described is not the standard of service we hold ourselves to, and certainly not what a customer of four years deserves.

I've pulled call reference #CR-20241122-0093 and our Quality Assurance team will complete a full review by November 29th. I'll personally follow up with you on the outcome and the steps we've taken.

Your loyalty means a great deal to us. Would you be open to a brief call with our Head of Customer Experience this week? I want to make sure we earn back your confidence properly.

Best regards`,
    confidence: 0.93,
  },
];

// ─── Hash function (djb2) ─────────────────────────────────────────────────────

function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (h * 33) ^ id.charCodeAt(i);
  }
  return Math.abs(h);
}

// ─── Exported errors ──────────────────────────────────────────────────────────

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIValidationError extends Error {
  readonly issues: unknown;
  constructor(message: string, issues: unknown) {
    super(message);
    this.name = 'AIValidationError';
    this.issues = issues;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Deterministic mock AI engine.
 * - Always returns the same template for a given messageId (hash-based).
 * - Simulates 200–1200ms network latency.
 * - Throws AIServiceError ~12% of the time to exercise the error path.
 * - Validates the response with Zod before returning.
 */
export async function analyzeMessage(
  messageId: string,
  signal?: AbortSignal,
): Promise<AIResult> {
  // Simulate latency: 200–1200ms
  const delay = 200 + (hashId(messageId + 'delay') % 1001);
  await sleep(delay, signal);

  // 12% random failure (seeded by messageId so it's stable per message)
  const failureSeed = (hashId(messageId + 'fail') % 100);
  if (failureSeed < 12) {
    throw new AIServiceError(
      'AI service unavailable — upstream model returned 503. Please try again.',
    );
  }

  // Pick template deterministically
  const raw = TEMPLATES[hashId(messageId) % TEMPLATES.length];

  // Validate with Zod (this will throw AIValidationError if schema doesn't match)
  const parsed = AIResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AIValidationError(
      'AI response failed schema validation.',
      parsed.error.issues,
    );
  }

  return parsed.data as AIResult;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}
