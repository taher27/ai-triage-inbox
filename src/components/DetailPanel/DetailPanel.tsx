import { useInboxStore, selectSelectedMessage, selectNotes } from '../../store/useInboxStore';
import type { Status, Priority } from '../../types';
import { formatFullTime, formatRelativeTime } from '../../lib/utils';
import { AIPanel } from './AIPanel';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'new',         label: 'New',         color: 'text-[#1a73e8]' },
  { value: 'in_progress', label: 'In Progress',  color: 'text-[#e37400]' },
  { value: 'done',        label: 'Done',         color: 'text-[#137333]' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'P1', label: 'P1 — Urgent', color: 'text-[#c5221f]' },
  { value: 'P2', label: 'P2 — Normal', color: 'text-[#e37400]' },
  { value: 'P3', label: 'P3 — Low',    color: 'text-[#5f6368]' },
];

const STATUS_BG: Record<Status, string> = {
  new:         'bg-[#e8f0fe] text-[#1a73e8] border-[#c5d9f7]',
  in_progress: 'bg-[#fef7e0] text-[#e37400] border-[#fdd663]',
  done:        'bg-[#e6f4ea] text-[#137333] border-[#a8d5b5]',
};

const PRIORITY_BG: Record<Priority, string> = {
  P1: 'bg-[#fce8e6] text-[#c5221f] border-[#f5c6c4]',
  P2: 'bg-[#fef7e0] text-[#e37400] border-[#fdd663]',
  P3: 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]',
};

const CHANNEL_LABEL: Record<string, string> = {
  email: '✉ Email',
  chat:  '💬 Chat',
  phone: '📞 Phone',
};

// ─── Select pill ─────────────────────────────────────────────────────────────

function SelectPill({
  value,
  options,
  colorCls,
  bgCls,
  ariaLabel,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  colorCls: string;
  bgCls: string;
  ariaLabel: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-colors appearance-none pr-5 ${bgCls}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235f6368'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DetailPanel() {
  const message       = useInboxStore(selectSelectedMessage);
  const updateStatus   = useInboxStore((s) => s.updateStatus);
  const updatePriority = useInboxStore((s) => s.updatePriority);
  const updateNotes    = useInboxStore((s) => s.updateNotes);

  const selectedId = useInboxStore((s) => s.selectedId)!;
  const notes = useInboxStore(selectNotes(selectedId));

  if (!message) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-[#e8eaed] bg-white px-6 pt-5 pb-4">

        {/* Subject */}
        <h2 className="text-lg font-normal text-[#202124] leading-snug mb-3 pr-4">
          {message.subject}
        </h2>

        {/* Sender row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white select-none"
              style={{ backgroundColor: stringToColor(message.sender.name) }}
              aria-hidden="true"
            >
              {message.sender.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#202124] truncate">
                {message.sender.name}
                <span className="ml-1.5 font-normal text-[#5f6368]">
                  &lt;{message.sender.email}&gt;
                </span>
              </p>
              <p className="text-xs text-[#9aa0a6]">{message.sender.company}</p>
            </div>
          </div>

          {/* Time + channel */}
          <div className="flex-shrink-0 text-right">
            <p
              className="text-xs text-[#5f6368]"
              title={formatFullTime(message.receivedAt)}
            >
              {formatRelativeTime(message.receivedAt)}
            </p>
            <p className="text-xs text-[#9aa0a6] mt-0.5">
              {CHANNEL_LABEL[message.channel] ?? message.channel}
            </p>
          </div>
        </div>

        {/* Controls row: status + priority + tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <SelectPill
            value={message.status}
            options={STATUS_OPTIONS}
            colorCls={STATUS_OPTIONS.find((o) => o.value === message.status)?.color ?? ''}
            bgCls={STATUS_BG[message.status]}
            ariaLabel="Message status"
            onChange={(v) => updateStatus(message.id, v as Status)}
          />
          <SelectPill
            value={message.priority}
            options={PRIORITY_OPTIONS}
            colorCls={PRIORITY_OPTIONS.find((o) => o.value === message.priority)?.color ?? ''}
            bgCls={PRIORITY_BG[message.priority]}
            ariaLabel="Message priority"
            onChange={(v) => updatePriority(message.id, v as Priority)}
          />

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap ml-1">
            {message.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[#f1f3f4] text-[#5f6368] border border-[#e8eaed]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-white">

        {/* Message body */}
        <section aria-label="Message body">
          <pre className="whitespace-pre-wrap font-[inherit] text-sm text-[#202124] leading-relaxed">
            {message.body}
          </pre>
        </section>

        <hr className="border-[#e8eaed]" />

        {/* Notes */}
        <section aria-label="Internal notes">
          <label
            htmlFor={`notes-${message.id}`}
            className="block text-xs font-semibold text-[#5f6368] uppercase tracking-wide mb-2"
          >
            Internal Notes
          </label>
          <textarea
            id={`notes-${message.id}`}
            value={notes}
            onChange={(e) => updateNotes(message.id, e.target.value)}
            placeholder="Add private notes visible only to your team…"
            rows={3}
            className="w-full text-sm text-[#202124] bg-[#f8f9fa] border border-[#e8eaed] rounded-lg px-3 py-2 resize-y placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-colors"
          />
        </section>

        <hr className="border-[#e8eaed]" />

        <AIPanel messageId={message.id} />

        {/* Bottom padding so content isn't flush against edge */}
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic pastel color from a string, used for avatar bg */
function stringToColor(str: string): string {
  const palette = [
    '#1a73e8', '#0f9d58', '#f4511e', '#7986cb',
    '#039be5', '#33b679', '#8e24aa', '#e67c73',
    '#f6bf26', '#4285f4',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
