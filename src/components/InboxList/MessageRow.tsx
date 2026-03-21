import { memo } from 'react';
import type { Message } from '../../types';
import { cn, formatRelativeTime, formatFullTime } from '../../lib/utils';

interface MessageRowProps {
  message: Message;
  isSelected: boolean;
  isFocused: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
  onCheck: (id: string, checked: boolean) => void;
}

// Gmail / Instagram-inspired light palette
const STATUS_BADGE: Record<Message['status'], string> = {
  new:         'bg-[#e8f0fe] text-[#1a73e8]',
  in_progress: 'bg-[#fef7e0] text-[#e37400]',
  done:        'bg-[#e6f4ea] text-[#137333]',
};

const STATUS_LABEL: Record<Message['status'], string> = {
  new: 'New',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_BADGE: Record<Message['priority'], string> = {
  P1: 'bg-[#fce8e6] text-[#c5221f]',
  P2: 'bg-[#fef7e0] text-[#e37400]',
  P3: 'bg-[#f1f3f4] text-[#5f6368]',
};

const CHANNEL_ICON: Record<Message['channel'], string> = {
  email: '✉',
  chat:  '💬',
  phone: '📞',
};

function MessageRowInner({
  message,
  isSelected,
  isFocused,
  isChecked,
  onSelect,
  onCheck,
}: MessageRowProps) {
  const isNew = message.status === 'new';

  return (
    <div
      role="option"
      aria-selected={isSelected}
      data-message-id={message.id}
      onClick={() => onSelect(message.id)}
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-[#e8eaed] transition-colors select-none',
        isSelected  && 'bg-[#e8f0fe]',
        !isSelected && isFocused  && 'bg-[#f1f3f4]',
        !isSelected && !isFocused && 'bg-white hover:bg-[#f1f3f4]',
        isFocused && 'outline outline-2 outline-[#1a73e8] outline-offset-[-2px]',
      )}
    >
      {/* Unread dot */}
      {isNew && (
        <span
          className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1a73e8]"
          aria-label="Unread"
        />
      )}

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isChecked}
        aria-label={`Select message from ${message.sender.name}`}
        onChange={(e) => { e.stopPropagation(); onCheck(message.id, e.target.checked); }}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[#dadce0] accent-[#1a73e8] cursor-pointer"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: sender + time */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn(
            'truncate text-sm',
            isNew ? 'font-semibold text-[#202124]' : 'font-medium text-[#3c4043]',
          )}>
            {message.sender.name}
            <span className="ml-1 font-normal text-[#6b7280] text-xs">
              · {message.sender.company}
            </span>
          </span>
          <span
            className="flex-shrink-0 text-xs text-[#6b7280]"
            title={formatFullTime(message.receivedAt)}
          >
            {formatRelativeTime(message.receivedAt)}
          </span>
        </div>

        {/* Row 2: subject */}
        <p className={cn(
          'truncate text-sm mb-1.5',
          isNew ? 'text-[#202124]' : 'text-[#5f6368]',
        )}>
          <span className="mr-1 text-xs opacity-50">{CHANNEL_ICON[message.channel]}</span>
          {message.subject}
        </p>

        {/* Row 3: badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
            STATUS_BADGE[message.status],
          )}>
            {STATUS_LABEL[message.status]}
          </span>
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
            PRIORITY_BADGE[message.priority],
          )}>
            {message.priority}
          </span>
        </div>
      </div>
    </div>
  );
}

export const MessageRow = memo(MessageRowInner);
