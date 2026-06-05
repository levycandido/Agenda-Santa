"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/auth/AuthContext";
import { Menu } from "@/components/Menu";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function getPageTitle(): { title: string; subtitle: string } {
  const pathname = usePathname();
  if (pathname === "/events") return { title: "Agenda", subtitle: "Visualize sua agenda" };
  if (pathname === "/users") return { title: "Usuários", subtitle: "Gerencie os colaboradores" };
  if (pathname === "/sala") return { title: "Salas", subtitle: "Gerencie as salas" };
  return { title: "Agenda Santa", subtitle: "" };
}

export function Layout({ children, onAddClick }: { children: React.ReactNode; onAddClick?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { title, subtitle } = getPageTitle();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f0f4f8]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Menu />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden bg-indigo-600 px-4 py-3 flex items-center justify-between shrink-0 relative z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-1 hover:bg-indigo-700 rounded transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="text-center flex-1">
            <p className="text-white font-bold text-base leading-tight">{title}</p>
            <p className="text-indigo-200 text-xs leading-tight">{subtitle}</p>
          </div>
          <button
            onClick={onAddClick}
            disabled={!onAddClick}
            className="text-white p-1 relative hover:bg-indigo-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Nova ação"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute top-0 left-0 w-64 h-screen bg-white shadow-lg flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              </div>
              <nav className="overflow-y-auto">
                <Link
                  href="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                    pathname === "/events"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-transparent text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Agenda
                </Link>
                <Link
                  href="/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                    pathname === "/users"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-transparent text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Usuários
                </Link>
                <Link
                  href="/sala"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                    pathname === "/sala"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-transparent text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="4" y="5" width="16" height="7" rx="2" /><rect x="2" y="10" width="4" height="7" rx="2" />
                    <rect x="18" y="10" width="4" height="7" rx="2" /><rect x="4" y="13" width="16" height="4" rx="1" />
                  </svg>
                  Salas
                </Link>
              </nav>
              <div className="mt-auto flex flex-col">
                <div className="border-t border-gray-200 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Logado como:</p>
                  <p className="text-sm font-medium text-gray-900">{user?.name || "[não carregado]"}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-t border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors w-full"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Deslogar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop top bar */}
        <div className="hidden md:flex shrink-0 bg-white border-b border-gray-200 px-6 py-3 items-center justify-end">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold select-none">
                {getInitials(user.name)}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user.name.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto md:p-6 p-4 md:pb-4 pb-20">{children}</main>

        {/* Mobile bottom navigation */}
        <div className="md:hidden shrink-0 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2">
          <Link href="/events" className="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-500 hover:text-indigo-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className={`text-xs ${pathname === "/events" ? "font-semibold text-indigo-600" : ""}`}>
              Agenda
            </span>
          </Link>
          <Link href="/users" className="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-500 hover:text-indigo-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className={`text-xs ${pathname === "/users" ? "font-semibold text-indigo-600" : ""}`}>
              Usuários
            </span>
          </Link>
          <Link href="/sala" className="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-500 hover:text-indigo-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="4" y="5" width="16" height="7" rx="2" /><rect x="2" y="10" width="4" height="7" rx="2" />
              <rect x="18" y="10" width="4" height="7" rx="2" /><rect x="4" y="13" width="16" height="4" rx="1" />
            </svg>
            <span className={`text-xs ${pathname === "/sala" ? "font-semibold text-indigo-600" : ""}`}>
              Salas
            </span>
          </Link>
          <button className="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-500 hover:text-indigo-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" />
              <circle cx="5" cy="12" r="1" fill="currentColor" />
            </svg>
            <span className="text-xs">Mais</span>
          </button>
        </div>
      </div>
    </div>
  );
}
