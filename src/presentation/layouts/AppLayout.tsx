/**
 * Root application layout.
 *
 * Mobile-first shell with bottom navigation bar and a content area.
 * All pages render inside the <Outlet />.
 */

import { Outlet, NavLink } from 'react-router-dom';
import { useEncryption } from '@presentation/hooks/useEncryption';

const NAV_ITEMS = [
  { to: '/', label: 'Thoughts', icon: '📓' },
  { to: '/story', label: 'Stories', icon: '✨' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
] as const;

export function AppLayout() {
  const { lockVault } = useEncryption();

  return (
    <div className="flex flex-col h-dvh bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">Journly</span>
          <span className="text-slate-400">.ai</span>
        </h1>
        <button
          onClick={lockVault}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1.5"
          title="Lock vault"
          aria-label="Lock vault"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </button>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation — mobile-first */}
      <nav className="flex items-center justify-around bg-slate-900 border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
