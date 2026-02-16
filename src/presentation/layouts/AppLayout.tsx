/**
 * Root application layout.
 *
 * Mobile-first shell with minimal header, bottom SVG nav, warm tones.
 */

import { Outlet, NavLink } from 'react-router-dom';
import { useEncryption } from '@presentation/hooks/useEncryption';
import { useNativeBackButton } from '@presentation/hooks/useNativeBackButton';

export function AppLayout() {
  const { lockVault } = useEncryption();
  useNativeBackButton();

  return (
    <div className="flex flex-col h-dvh bg-slate-950 text-slate-100">
      {/* Minimal header — just lock button */}
      <header className="flex items-center justify-end px-4 py-2">
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
      <main className="flex-1 overflow-y-auto page-fade-in">
        <Outlet />
      </main>

      {/* Bottom navigation — warm SVG icons */}
      <nav aria-label="Main navigation" className="flex items-center justify-around border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <NavLink
          to="/"
          end
          aria-label="Journal"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs transition-colors ${
              isActive
                ? 'text-primary font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <span>Journal</span>
        </NavLink>

        <NavLink
          to="/story"
          aria-label="Stories"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs transition-colors ${
              isActive
                ? 'text-primary font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
          <span>Stories</span>
        </NavLink>

        <NavLink
          to="/settings"
          aria-label="Settings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs transition-colors ${
              isActive
                ? 'text-primary font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
