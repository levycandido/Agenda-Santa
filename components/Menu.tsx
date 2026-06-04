"use client";

import Link from "next/link";
import { useAuth } from "@/app/auth/AuthContext";

export function Menu() {
  const { user, logout } = useAuth();

  const has = (...perms: string[]) =>
    perms.some((p) => user?.permissions.includes(p as never));

  return (
    <nav className="flex gap-4 border-b p-4">
      {has("EVENTS_VIEW", "EVENTS_CREATE") && (
        <Link href="/events">Agenda</Link>
      )}
      {has("USERS_VIEW", "USERS_CREATE") && (
        <Link href="/users">Usuários</Link>
      )}
      {has("ROOMS_VIEW", "ROOMS_CREATE") && (
        <Link href="/rooms">Salas</Link>
      )}
      {user ? (
        <button onClick={logout}>Sair</button>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  );
}
