import { lazy, Suspense } from 'react';
import { InboxList } from './components/InboxList/InboxList';
import { useInboxStore, selectSelectedId, selectDebugMode } from './store/useInboxStore';

const DetailPanel = lazy(() =>
  import('./components/DetailPanel/DetailPanel').then((m) => ({ default: m.DetailPanel }))
);

function App() {
  const selectedId      = useInboxStore(selectSelectedId);
  const debugMode       = useInboxStore(selectDebugMode);
  const toggleDebugMode = useInboxStore((s) => s.toggleDebugMode);

  return (
    // h-dvh uses the dynamic viewport height — fixes iOS Safari bottom-bar clipping
    <div className="flex flex-col h-dvh bg-[#f6f8fc]">

      <h1 className="sr-only">AI Triage Inbox</h1>

      {/* App header */}
      <header className="flex items-center justify-between px-4 md:px-5 py-2.5 bg-white border-b border-[#e8eaed] flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">📬</span>
          <span className="text-sm font-semibold text-[#202124] tracking-tight" aria-hidden="true">
            AI Triage Inbox
          </span>
        </div>
        <button
          onClick={toggleDebugMode}
          aria-pressed={debugMode}
          aria-label={debugMode ? 'Disable debug mode' : 'Enable debug mode'}
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
            debugMode
              ? 'bg-[#fef7e0] text-[#e37400] border border-[#fdd663]'
              : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'
          }`}
        >
          🐛 Debug
        </button>
      </header>

      {/* Two-panel layout
          Mobile  : only one panel visible at a time — inbox list OR detail
          Desktop : both panels side-by-side                               */}
      <main className="flex flex-1 min-h-0">

        {/* Left — inbox list
            Mobile: visible when no message is selected; hidden once one is */}
        <aside
          className={`flex-shrink-0 flex flex-col min-h-0 w-full md:w-96 ${
            selectedId ? 'hidden md:flex' : 'flex'
          }`}
          aria-label="Message list"
        >
          <InboxList />
        </aside>

        {/* Right — detail view
            Mobile: visible only when a message is selected                */}
        <section
          className={`min-w-0 min-h-0 overflow-hidden bg-white md:border-l border-[#e8eaed] flex flex-col ${
            selectedId ? 'flex-1' : 'hidden md:flex md:flex-1'
          }`}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-[#6b7280] text-sm">
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
      {/* Keyboard hints only make sense on desktop */}
      <p className="hidden md:block text-xs text-[#6b7280]">
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
