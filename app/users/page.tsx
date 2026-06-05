"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { useAuth } from "@/app/auth/AuthContext";
import { listUsers, deactivateUser, isUserDeactivated, UserSummary } from "@/services/userListService";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const canCreate = user?.permissions.includes("USERS_CREATE");

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(u: UserSummary) {
    setPendingDelete(u);
  }

  async function confirmDelete() {
    const u = pendingDelete;
    setPendingDelete(null);
    if (!u) return;
    try {
      setDeletingId(u.userId);
      await deactivateUser(u);
      setUsers((prev) => prev.filter((x) => x.userId !== u.userId));
    } catch (error) {
      console.error(error);
      alert("Erro ao desativar usuário.");
    } finally {
      setDeletingId(null);
    }
  }

  const activeUsers = users.filter(
    (u) => u.status !== "DISABLED" && u.status !== "DESATIVADO" && !isUserDeactivated(u.userId)
  );

  const filteredUsers = searchTerm.trim()
    ? activeUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : activeUsers;

  return (
    <Layout>
      {/* Desktop layout */}
        <div className="hidden md:block">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie os colaboradores da igreja.</p>
          </div>

          {/* Filter / action bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Filter button */}
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filtrar
              </button>

              {/* New user */}
              {canCreate && (
                <button
                  onClick={() => router.push("/users/new")}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium ml-auto whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Novo usuário
                </button>
              )}
            </div>
          </div>

          {/* User table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">Carregando...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">Nenhum usuário encontrado.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Nome</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">E-mail</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Status</th>
                    {canCreate && (
                      <th className="text-right px-6 py-3 font-semibold text-gray-700">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const color = u.color || u.cor || "#94a3b8";
                    return (
                      <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                        {/* Nome + avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{u.name}</span>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Ativo
                          </span>
                        </td>

                        {/* Ações */}
                        {canCreate && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/users/${u.userId}/edit?cor=${encodeURIComponent(u.color || u.cor || "")}`
                                  )
                                }
                                title="Alterar usuário"
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(u)}
                                disabled={deletingId === u.userId}
                                title="Desativar usuário"
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {deletingId === u.userId ? (
                                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          {/* Search */}
          <div className="relative mb-3">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* User list */}
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">Carregando...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">Nenhum usuário encontrado.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredUsers.map((u) => {
                const color = u.color || u.cor || "#94a3b8";
                return (
                  <button
                    key={u.userId}
                    onClick={() => {
                      if (canCreate) {
                        router.push(
                          `/users/${u.userId}/edit?cor=${encodeURIComponent(u.color || u.cor || "")}`
                        );
                      }
                    }}
                    disabled={!canCreate}
                    className={`text-left w-full bg-white rounded-lg flex items-center gap-3 px-4 py-3 border border-gray-100 transition-colors ${
                      canCreate ? "hover:bg-gray-50 cursor-pointer" : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>

                    {/* Status badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 shrink-0">
                      Ativo
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      {pendingDelete && (
        <ConfirmDialog
          message={`Atenção: todos os agendamentos futuros de "${pendingDelete.name}" serão eliminados. Deseja continuar com a desativação?`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </Layout>
  );
}
