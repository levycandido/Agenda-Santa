"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/auth/AuthContext";

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UsersIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function DoorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 21h18" />
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ShieldIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
};

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className={active ? "text-indigo-600" : "text-gray-400"}>{icon}</span>
      {label}
    </Link>
  );
}

export function Menu() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const has = (...perms: string[]) =>
    perms.some((p) => user?.permissions.includes(p as never));

  return (
    <aside className="w-64 h-screen flex flex-col bg-white border-r border-gray-200 shrink-0">
      {/* Branding header */}
      <div className="bg-indigo-600 px-5 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-base leading-tight">Agenda Santa</p>
            <p className="text-indigo-200 text-xs leading-snug truncate">
              Igreja Batista Vida Abundante
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {has("EVENTS_VIEW", "EVENTS_CREATE") && (
          <NavItem
            href="/events"
            icon={<CalendarIcon />}
            label="Agenda"
            active={pathname === "/events"}
          />
        )}
        {has("USERS_VIEW", "USERS_CREATE") && (
          <NavItem
            href="/users"
            icon={<UsersIcon />}
            label="Usuários"
            active={pathname === "/users"}
          />
        )}
        {has("ROOMS_VIEW", "ROOMS_CREATE") && (
          <NavItem
            href="/sala"
            icon={<DoorIcon />}
            label="Salas"
            active={pathname?.startsWith("/sala") ?? false}
          />
        )}
        <NavItem
          href="/settings"
          icon={<SettingsIcon />}
          label="Configurações"
          active={pathname === "/settings"}
        />

        <div className="mt-auto pt-3">
          {user && (
            <div className="border-t border-gray-100 pt-3 pb-3">
              <p className="text-xs text-gray-500 px-4">Logado como:</p>
              <p className="text-sm font-medium text-gray-900 px-4 truncate">{user.name}</p>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="text-gray-400">
                <LogoutIcon />
              </span>
              Deslogar
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <ShieldIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-600">Agenda Santa</p>
            <p className="text-xs text-gray-400">Versão 1.0.0 • 2026</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
