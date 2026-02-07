/**
 * Root application layout.
 *
 * Mobile-first shell with bottom navigation bar and a content area.
 * All pages render inside the <Outlet />.
 */

import { Outlet, NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Journal', icon: '📓' },
  { to: '/story', label: 'Stories', icon: '✨' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
] as const;

export function AppLayout() {
  return (
    <div className="flex flex-col h-dvh bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">Journly</span>
          <span className="text-slate-400">.ai</span>
        </h1>
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
