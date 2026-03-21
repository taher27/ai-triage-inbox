import { useState } from 'react';
import { useInboxStore, selectAIState, selectDebugMode } from '../../store/useInboxStore';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';

interface DebugPanelProps {
  messageId: string;
}

export function DebugPanel({ messageId }: DebugPanelProps) {
  const debugMode = useInboxStore(selectDebugMode);
  const aiState   = useInboxStore(selectAIState(messageId));
  const { analyze } = useAIAnalysis(messageId);

  const [jsonExpanded, setJsonExpanded] = useState(true);

  if (!debugMode || aiState.status === 'idle') return null;

  const { debugInfo, status } = aiState;

  const latencyColor =
    !debugInfo ? '#9aa0a6'
    : debugInfo.latencyMs < 500 ? '#137333'
    : debugInfo.latencyMs < 900 ? '#e37400'
    : '#c5221f';

  return (
    <div className="mt-4 rounded-xl border border-[#fde68a] bg-[#fffbeb] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#fde68a] bg-[#fef9c3]">
        <div className="flex items-center gap-2">
          <span className="text-sm" aria-hidden="true">🐛</span>
          <span className="text-xs font-semibold text-[#92400e] uppercase tracking-wide">
            Debug Panel
          </span>
        </div>
        <button
          onClick={() => analyze(true)}
          className="text-xs px-2.5 py-1 rounded-md border border-[#fcd34d] bg-white text-[#92400e] hover:bg-[#fef9c3] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
        >
          Force Retry
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Latency */}
          <span className="flex items-center gap-1.5">
            <span className="text-[#92400e] font-medium">Latency</span>
            <span
              className="font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded bg-white border border-[#fde68a]"
              style={{ color: latencyColor }}
            >
              {debugInfo ? `${debugInfo.latencyMs}ms` : '—'}
            </span>
          </span>

          {/* Template */}
          <span className="flex items-center gap-1.5">
            <span className="text-[#92400e] font-medium">Template #</span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-white border border-[#fde68a] text-[#78350f]">
              {debugInfo ? `${debugInfo.templateIndex} / 8` : '—'}
            </span>
          </span>

          {/* Failure seed */}
          <span className="flex items-center gap-1.5">
            <span className="text-[#92400e] font-medium">Fail seed</span>
            <span
              className="font-mono px-1.5 py-0.5 rounded bg-white border border-[#fde68a] font-semibold"
              style={{ color: debugInfo && debugInfo.failureSeed < 12 ? '#c5221f' : '#137333' }}
            >
              {debugInfo
                ? `${debugInfo.failureSeed}/99 ${debugInfo.failureSeed < 12 ? '✗ FAIL' : '✓ pass'}`
                : '—'}
            </span>
          </span>
        </div>

        {/* Schema validation */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#92400e] font-medium">Schema</span>
          {status === 'loading' ? (
            <span className="text-[#6b7280]">Validating…</span>
          ) : debugInfo ? (
            debugInfo.validationPassed ? (
              <span className="flex items-center gap-1 text-[#137333] font-medium">
                <span aria-hidden="true">✓</span> Zod validation passed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#c5221f] font-medium">
                <span aria-hidden="true">✗</span> Zod validation failed
              </span>
            )
          ) : (
            <span className="text-[#6b7280]">No data yet</span>
          )}
        </div>

        {/* Validation errors */}
        {debugInfo?.validationErrors && (
          <div className="rounded-lg border border-[#f5c6c4] bg-[#fce8e6] px-3 py-2">
            <p className="text-xs font-semibold text-[#c5221f] mb-1">Validation Errors</p>
            <pre className="text-xs text-[#c5221f] whitespace-pre-wrap font-mono overflow-x-auto max-h-32">
              {JSON.stringify(debugInfo.validationErrors, null, 2)}
            </pre>
          </div>
        )}

        {/* Raw response */}
        {debugInfo?.rawResponse !== undefined && (
          <div>
            <button
              onClick={() => setJsonExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#92400e] hover:text-[#78350f] mb-2"
              aria-expanded={jsonExpanded}
            >
              <span
                className="inline-block transition-transform duration-150"
                style={{ transform: jsonExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                aria-hidden="true"
              >
                ▶
              </span>
              Raw AI Response
            </button>

            {jsonExpanded && (
              <div className="rounded-lg overflow-hidden border border-[#374151]">
                {/* Terminal chrome */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f2937]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                  <span className="ml-2 text-xs text-[#6b7280] font-mono">
                    ai_response.json
                  </span>
                </div>
                <pre className="text-xs font-mono text-[#d1fae5] bg-[#111827] px-4 py-3 overflow-x-auto max-h-64 leading-relaxed">
                  {debugInfo.rawResponse
                    ? JSON.stringify(debugInfo.rawResponse, null, 2)
                    : 'null (service error — no response body)'}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Loading state placeholder */}
        {status === 'loading' && (
          <p className="text-xs text-[#92400e] italic">Waiting for AI response…</p>
        )}
      </div>
    </div>
  );
}
