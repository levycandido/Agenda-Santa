"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { useAuth } from "@/app/auth/AuthContext";
import { listRooms, deleteRoom, Room } from "@/services/roomService";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const ROOM_COLORS = ["#6366f1", "#f59e0b", "#f43f5e", "#10b981", "#3b82f6", "#8b5cf6"];

function CouchIcon({ color = "currentColor", size = 32 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <rect x="4" y="5" width="16" height="7" rx="2" />
      <rect x="2" y="10" width="4" height="7" rx="2" />
      <rect x="18" y="10" width="4" height="7" rx="2" />
      <rect x="4" y="13" width="16" height="4" rx="1" />
    </svg>
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const canCreate = user?.permissions.includes("ROOMS_CREATE");

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(r: Room) {
    setPendingDelete(r);
  }

  async function confirmDelete() {
    const r = pendingDelete;
    setPendingDelete(null);
    if (!r) return;
    try {
      setDeletingId(r.roomId);
      await deleteRoom(r.roomId);
      setRooms((prev) => prev.filter((x) => x.roomId !== r.roomId));
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir sala.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredRooms = searchTerm.trim()
    ? rooms.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : rooms;

  return (
    <Layout>
      {/* Desktop layout */}
        <div className="hidden md:block">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Salas</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie as salas e espaços disponíveis.</p>
          </div>

          {/* Filter / action bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-5">
            <div className="flex items-center gap-3">
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
                  placeholder="Buscar salas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* New room */}
              {canCreate && (
                <button
                  onClick={() => router.push("/sala/new")}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Nova sala
                </button>
              )}
            </div>
          </div>

          {/* Room cards */}
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">Carregando...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">Nenhuma sala encontrada.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredRooms.map((r, i) => {
                const color = ROOM_COLORS[i % ROOM_COLORS.length];
                const bgLight = color + "22";
                return (
                  <div
                    key={r.roomId}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 px-5 py-4 border-l-4"
                    style={{ borderLeftColor: color }}
                  >
                    {/* Icon box */}
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: bgLight }}
                    >
                      <CouchIcon color={color} size={32} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900">{r.name}</p>
                      <span className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Ativa
                      </span>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          Capacidade: — pessoas
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                          </svg>
                          Disponível
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Agendamentos ativos
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {canCreate && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            router.push(`/sala/${r.roomId}/edit?name=${encodeURIComponent(r.name)}`)
                          }
                          title="Alterar sala"
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={deletingId === r.roomId}
                          title="Excluir sala"
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {deletingId === r.roomId ? (
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
              placeholder="Buscar salas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Room list */}
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">Carregando...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">Nenhuma sala encontrada.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredRooms.map((r, i) => {
                const color = ROOM_COLORS[i % ROOM_COLORS.length];
                const bgLight = color + "22";
                return (
                  <button
                    key={r.roomId}
                    onClick={() => {
                      if (canCreate) {
                        router.push(`/sala/${r.roomId}/edit?name=${encodeURIComponent(r.name)}`);
                      }
                    }}
                    disabled={!canCreate}
                    className={`text-left w-full bg-white rounded-lg flex items-center gap-3 px-4 py-3 border border-gray-100 transition-colors ${
                      canCreate ? "hover:bg-gray-50 cursor-pointer" : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: bgLight }}
                    >
                      <CouchIcon color={color} size={24} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500 truncate">Capacidade: — pessoas</p>
                    </div>

                    {/* Status badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-600 shrink-0">
                      Ativa
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      {pendingDelete && (
        <ConfirmDialog
          message={`Deseja excluir a sala "${pendingDelete.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </Layout>
  );
}
