import { lazy, Suspense } from 'react';
import { InboxList } from './components/InboxList/InboxList';
import { useInboxStore, selectSelectedId, selectDebugMode } from './store/useInboxStore';

const DetailPanel = lazy(() =>
  import('./components/DetailPanel/DetailPanel').then((m) => ({ default: m.DetailPanel }))
);

function App() {
  const selectedId     = useInboxStore(selectSelectedId);
  const debugMode      = useInboxStore(selectDebugMode);
  const toggleDebugMode = useInboxStore((s) => s.toggleDebugMode);

  return (
    <div className="flex flex-col h-screen bg-[#f6f8fc]">

      {/* App header — Gmail-style white bar */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-[#e8eaed] flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">📬</span>
          <span className="text-sm font-semibold text-[#202124] tracking-tight">
            AI Triage Inbox
          </span>
        </div>
        <button
          onClick={toggleDebugMode}
          aria-pressed={debugMode}
          title="Toggle debug mode"
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
            debugMode
              ? 'bg-[#fef7e0] text-[#e37400] border border-[#fdd663]'
              : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'
          }`}
        >
          🐛 Debug
        </button>
      </header>

      {/* Two-panel layout */}
      <main className="flex flex-1 min-h-0">

        {/* Left — inbox list */}
        <aside className="w-96 flex-shrink-0 flex flex-col min-h-0" aria-label="Message list">
          <InboxList />
        </aside>

        {/* Right — detail view */}
        <section className="flex-1 min-w-0 min-h-0 overflow-hidden bg-white border-l border-[#e8eaed]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-[#9aa0a6] text-sm">
              Loading…
            </div>
          }>
            {selectedId ? <DetailPanel /> : <EmptyState />}
          </Suspense>
        </section>

      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <span className="text-5xl mb-4" aria-hidden="true">📋</span>
      <p className="text-sm font-medium text-[#5f6368] mb-2">
        Select a message to get started
      </p>
      <p className="text-xs text-[#9aa0a6]">
        Use{' '}
        <kbd className="font-mono px-1 py-0.5 rounded bg-[#f1f3f4] text-[#5f6368] text-xs">j</kbd>
        {' '}/{' '}
        <kbd className="font-mono px-1 py-0.5 rounded bg-[#f1f3f4] text-[#5f6368] text-xs">k</kbd>
        {' '}to navigate,{' '}
        <kbd className="font-mono px-1 py-0.5 rounded bg-[#f1f3f4] text-[#5f6368] text-xs">/</kbd>
        {' '}to search
      </p>
    </div>
  );
}

export default App;
