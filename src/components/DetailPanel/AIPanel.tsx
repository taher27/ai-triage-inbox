import { useState } from 'react';
import { useInboxStore, selectAIState } from '../../store/useInboxStore';
import type { AICategory } from '../../types';
import { Skeleton } from './Skeleton';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';

// ─── Category chip colours ────────────────────────────────────────────────────

const CATEGORY_CHIP: Record<AICategory, string> = {
  Billing:     'bg-[#e8f0fe] text-[#1a73e8] border-[#c5d9f7]',
  Claims:      'bg-[#fef7e0] text-[#e37400] border-[#fdd663]',
  Endorsement: 'bg-[#e6f4ea] text-[#137333] border-[#a8d5b5]',
  General:     'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]',
  Urgent:      'bg-[#fce8e6] text-[#c5221f] border-[#f5c6c4]',
  Spam:        'bg-[#fce8e6] text-[#c5221f] border-[#f5c6c4]',
  Technical:   'bg-[#f3e8fd] text-[#7b1fa2] border-[#d7b8f5]',
  Legal:       'bg-[#e8eaf6] text-[#3949ab] border-[#c5cae9]',
  Complaint:   'bg-[#fff3e0] text-[#e65100] border-[#ffcc80]',
};

const PRIORITY_CHIP = {
  P1: 'bg-[#fce8e6] text-[#c5221f] border-[#f5c6c4]',
  P2: 'bg-[#fef7e0] text-[#e37400] border-[#fdd663]',
  P3: 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]',
};

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? '#0f9d58' : pct >= 60 ? '#e37400' : '#c5221f';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#e8eaed] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy draft reply"
      className="text-xs px-2 py-1 rounded border border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AIPanelProps {
  messageId: string;
}

export function AIPanel({ messageId }: AIPanelProps) {
  const aiState  = useInboxStore(selectAIState(messageId));
  const setAIState = useInboxStore((s) => s.setAIState);
  const { analyze, stopStreaming, regenerate } = useAIAnalysis(messageId);

  const { status, result, error, streamedDraft, isStreaming, userEditedDraft } = aiState;

  return (
    <section aria-label="AI analysis" aria-live="polite">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
          ✨ AI Assist
        </h3>
        {status === 'success' && (
          <button
            onClick={regenerate}
            title={userEditedDraft ? 'Regenerate (you have unsaved edits)' : 'Regenerate'}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a73e8] ${
              userEditedDraft
                ? 'border-[#e37400] text-[#e37400] bg-[#fef7e0] hover:bg-[#fde68a]'
                : 'border-[#dadce0] text-[#5f6368] bg-white hover:bg-[#f1f3f4]'
            }`}
          >
            {userEditedDraft ? '↺ Regenerate*' : '↺ Regenerate'}
          </button>
        )}
      </div>

      {/* ── idle ── */}
      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-[#dadce0] bg-[#fafafa]">
          <span className="text-3xl mb-3" aria-hidden="true">✨</span>
          <p className="text-sm text-[#5f6368] mb-4 text-center max-w-xs">
            Summarize, classify, and draft a reply — automatically.
          </p>
          <button
            onClick={() => analyze()}
            className="px-4 py-2 rounded-md bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1a73e8]"
          >
            Analyze with AI
          </button>
        </div>
      )}

      {/* ── loading ── */}
      {status === 'loading' && (
        <div className="rounded-xl border border-[#e8eaed] bg-[#fafafa] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#1a73e8] animate-ping" />
            <span className="text-xs text-[#9aa0a6]">Analyzing message…</span>
          </div>
          {/* Summary skeleton */}
          <Skeleton className="h-2.5 w-1/3 rounded" />
          <Skeleton className="h-2.5 w-full rounded" />
          <Skeleton className="h-2.5 w-5/6 rounded" />
          <Skeleton className="h-2.5 w-4/6 rounded" />
          {/* Meta skeleton */}
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          {/* Draft skeleton */}
          <div className="pt-2">
            <Skeleton className="h-2.5 w-1/4 rounded mb-3" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      )}

      {/* ── error ── */}
      {status === 'error' && (
        <div className="rounded-xl border border-[#f5c6c4] bg-[#fce8e6] p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0" aria-hidden="true">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#c5221f] mb-1">AI analysis failed</p>
              <p className="text-xs text-[#c5221f]/80 mb-3 leading-relaxed">
                {error ?? 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => analyze(true)}
                className="text-xs px-3 py-1.5 rounded-md bg-white border border-[#f5c6c4] text-[#c5221f] hover:bg-[#fce8e6] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#c5221f]"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── success ── */}
      {status === 'success' && result && (
        <div className="rounded-xl border border-[#e8eaed] bg-white overflow-hidden">

          {/* Summary bullets */}
          <div className="px-4 pt-4 pb-3 border-b border-[#f1f3f4]">
            <p className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wide mb-2.5">
              Summary
            </p>
            <ul className="space-y-1.5 pl-1" role="list">
              {result.summary_bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#3c4043]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1a73e8] flex-shrink-0" aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Category + priority + confidence */}
          <div className="px-4 py-3 border-b border-[#f1f3f4] space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_CHIP[result.category]}`}>
                {result.category}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITY_CHIP[result.priority]}`}>
                AI suggests {result.priority}
              </span>
            </div>
            <div>
              <p className="text-xs text-[#9aa0a6] mb-1">Confidence</p>
              <ConfidenceBar value={result.confidence} />
            </div>
          </div>

          {/* Suggested action */}
          <div className="px-4 py-3 border-b border-[#f1f3f4]">
            <p className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wide mb-1.5">
              Suggested Action
            </p>
            <p className="text-sm text-[#202124] leading-relaxed">
              {result.suggested_action}
            </p>
          </div>

          {/* Draft reply */}
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wide">
                Draft Reply
              </p>
              <div className="flex items-center gap-1.5">
                {isStreaming ? (
                  <button
                    onClick={stopStreaming}
                    className="text-xs px-2.5 py-1 rounded-md border border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
                    aria-label="Stop streaming"
                  >
                    ⏹ Stop
                  </button>
                ) : (
                  <CopyButton text={streamedDraft} />
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={streamedDraft}
                disabled={isStreaming}
                onChange={(e) =>
                  setAIState(messageId, {
                    streamedDraft: e.target.value,
                    userEditedDraft: true,
                  })
                }
                aria-label="Draft reply — editable"
                rows={8}
                className={`w-full text-sm text-[#202124] border rounded-lg px-3 py-2.5 resize-y leading-relaxed transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent ${
                  isStreaming
                    ? 'bg-[#f8f9fa] border-[#e8eaed] cursor-not-allowed text-[#5f6368]'
                    : 'bg-white border-[#dadce0] hover:border-[#bdc1c6]'
                }`}
              />
              {/* Streaming cursor */}
              {isStreaming && (
                <span
                  className="absolute bottom-3 right-3 text-[#1a73e8] text-sm animate-pulse select-none"
                  aria-hidden="true"
                >
                  ▋
                </span>
              )}
            </div>

            {userEditedDraft && !isStreaming && (
              <p className="text-xs text-[#9aa0a6] mt-1.5">
                * You've edited this draft. Click ↺ Regenerate to start fresh.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
