import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useInboxStore, selectMessages, selectSelectedId } from '../../store/useInboxStore';
import type { Status, Priority } from '../../types';
import { MessageRow } from './MessageRow';

const ALL = 'all' as const;

export function InboxList() {
  const messages      = useInboxStore(selectMessages);
  const selectedId    = useInboxStore(selectSelectedId);
  const selectMessage = useInboxStore((s) => s.selectMessage);
  const markDone      = useInboxStore((s) => s.markDone);

  const [statusFilter,   setStatusFilter]   = useState<Status | typeof ALL>(ALL);
  const [priorityFilter, setPriorityFilter] = useState<Priority | typeof ALL>(ALL);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [checkedIds,     setCheckedIds]     = useState<Set<string>>(new Set());
  const [focusedIndex,   setFocusedIndex]   = useState(-1);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return messages.filter((m) => {
      if (statusFilter   !== ALL && m.status   !== statusFilter)   return false;
      if (priorityFilter !== ALL && m.priority !== priorityFilter) return false;
      if (q) {
        const hay = `${m.subject} ${m.sender.name} ${m.sender.company}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [messages, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    setFocusedIndex((prev) =>
      prev >= filteredMessages.length ? filteredMessages.length - 1 : prev
    );
  }, [filteredMessages.length]);

  useEffect(() => {
    if (selectedId) {
      const idx = filteredMessages.findIndex((m) => m.id === selectedId);
      if (idx !== -1) setFocusedIndex(idx);
    }
  }, [selectedId, filteredMessages]);

  useEffect(() => {
    if (focusedIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-message-id="${filteredMessages[focusedIndex]?.id}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, filteredMessages]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isSearchFocused = e.target === searchRef.current;
      if (!isSearchFocused && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) return;

      switch (e.key) {
        case '/':
          if (!isSearchFocused) { e.preventDefault(); searchRef.current?.focus(); }
          break;
        case 'Escape':
          if (isSearchFocused) { searchRef.current?.blur(); setSearchQuery(''); }
          break;
        case 'j': case 'ArrowDown':
          if (isSearchFocused) break;
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, filteredMessages.length - 1);
            selectMessage(filteredMessages[next]?.id ?? null);
            return next;
          });
          break;
        case 'k': case 'ArrowUp':
          if (isSearchFocused) break;
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            selectMessage(filteredMessages[next]?.id ?? null);
            return next;
          });
          break;
        case 'Enter':
          if (isSearchFocused) { searchRef.current?.blur(); break; }
          if (focusedIndex >= 0 && filteredMessages[focusedIndex])
            selectMessage(filteredMessages[focusedIndex].id);
          break;
      }
    },
    [filteredMessages, focusedIndex, selectMessage]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCheck = useCallback((id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = (checked: boolean) =>
    setCheckedIds(checked ? new Set(filteredMessages.map((m) => m.id)) : new Set());

  const handleMarkDone = () => { markDone([...checkedIds]); setCheckedIds(new Set()); };

  const allChecked  = filteredMessages.length > 0 && filteredMessages.every((m) => checkedIds.has(m.id));
  const someChecked = checkedIds.size > 0;
  const newCount    = messages.filter((m) => m.status === 'new').length;

  // Shared input / select style
  const inputCls = 'text-[#202124] bg-[#f1f3f4] border border-transparent focus:border-[#1a73e8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1a73e8] rounded-md transition-colors placeholder-[#9aa0a6]';

  return (
    <div className="flex flex-col h-full border-r border-[#e8eaed] bg-white">

      {/* Panel header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#e8eaed]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#202124]">
            Inbox
            {newCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#1a73e8] text-white text-xs font-medium">
                {newCount}
              </span>
            )}
          </h2>
          <span className="text-xs text-[#6b7280]">
            {filteredMessages.length} / {messages.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9aa0a6] pointer-events-none"
            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
          >
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search  (press / )"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search messages"
            className={`w-full pl-8 pr-3 py-1.5 text-sm ${inputCls}`}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | typeof ALL)}
            aria-label="Filter by status"
            className={`flex-1 text-xs py-1.5 px-2 ${inputCls}`}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | typeof ALL)}
            aria-label="Filter by priority"
            className={`flex-1 text-xs py-1.5 px-2 ${inputCls}`}
          >
            <option value="all">All Priorities</option>
            <option value="P1">P1 — Urgent</option>
            <option value="P2">P2 — Normal</option>
            <option value="P3">P3 — Low</option>
          </select>
        </div>
      </div>

      {/* Bulk actions bar */}
      {someChecked && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#e8f0fe] border-b border-[#c5d9f7]">
          <span className="text-xs text-[#1a73e8] font-medium">
            {checkedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleMarkDone}
              className="text-xs px-2.5 py-1 rounded-md bg-[#1a73e8] hover:bg-[#1765cc] text-white font-medium transition-colors"
            >
              Mark Done
            </button>
            <button
              onClick={() => setCheckedIds(new Set())}
              aria-label="Clear selection"
              className="text-xs px-2 py-1 rounded-md text-[#1a73e8] hover:bg-[#d2e3fc] transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Select-all row */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[#f1f3f4] bg-[#fafafa]">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => handleSelectAll(e.target.checked)}
          aria-label="Select all visible messages"
          className="h-3.5 w-3.5 rounded border-[#dadce0] accent-[#1a73e8] cursor-pointer"
        />
        <span className="text-xs text-[#6b7280]">Select all</span>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Messages"
        aria-multiselectable="true"
        className="flex-1 overflow-y-auto"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#9aa0a6] text-sm">
            <span className="text-2xl mb-2">📭</span>
            No messages match your filters
          </div>
        ) : (
          filteredMessages.map((message, idx) => (
            <MessageRow
              key={message.id}
              message={message}
              isSelected={message.id === selectedId}
              isFocused={idx === focusedIndex}
              isChecked={checkedIds.has(message.id)}
              onSelect={(id) => { selectMessage(id); setFocusedIndex(idx); }}
              onCheck={handleCheck}
            />
          ))
        )}
      </div>

      {/* Keyboard hint footer — desktop only */}
      <div className="hidden md:block px-4 py-2 border-t border-[#f1f3f4] bg-[#fafafa]">
        <p className="text-xs text-[#6b7280] text-center">
          <kbd className="font-mono">j/k</kbd> navigate ·{' '}
          <kbd className="font-mono">/</kbd> search ·{' '}
          <kbd className="font-mono">Enter</kbd> open
        </p>
      </div>
    </div>
  );
}
