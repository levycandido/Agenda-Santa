"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { useAuth } from "@/app/auth/AuthContext";
import { listRooms, deleteRoom, Room } from "@/services/roomService";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function RoomsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Room | null>(null);

  const canCreate = user?.permissions.includes("ROOMS_CREATE");
  const isAdmin = user?.roles.includes("ADMIN");

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

  function cancelDelete() {
    setPendingDelete(null);
  }

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <RequirePermission permission={["ROOMS_VIEW", "ROOMS_CREATE"]}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Salas</h1>
          {canCreate && (
            <button
              onClick={() => router.push("/rooms/new")}
              title="Nova Sala"
              className="bg-blue-600 text-white rounded px-3 py-2 text-sm hover:bg-blue-700 inline-flex items-center justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : rooms.length === 0 ? (
          <p className="text-gray-500">Nenhuma sala cadastrada.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-semibold text-gray-700">Nome</th>
                {isAdmin && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.roomId} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{r.name}</td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/rooms/${r.roomId}/edit?name=${encodeURIComponent(r.name)}`)}
                        title="Alterar sala"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 transition-colors text-xs font-medium"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.roomId}
                        title="Excluir sala"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-400 hover:text-red-700 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === r.roomId ? (
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RequirePermission>

      {pendingDelete && (
        <ConfirmDialog
          message={`Deseja excluir a sala "${pendingDelete.name}"?`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </Layout>
  );
}
