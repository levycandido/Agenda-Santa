"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { getRoom, updateRoom, deleteRoom } from "@/services/roomService";

type DialogState = { message: string; onOk: () => void; onCancel?: () => void } | null;

function AppDialog({ message, onOk, onCancel }: NonNullable<DialogState>) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Agenda Santa</h3>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50">
              Cancelar
            </button>
          )}
          <button onClick={onOk} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  const [name, setName] = useState(searchParams.get("name") || "");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getRoom(roomId)
      .then((r) => { if (r.name) setName(r.name); })
      .catch(() => setDialog({ message: "Erro ao carregar sala.", onOk: () => router.push("/rooms") }))
      .finally(() => setLoadingData(false));
  }, [roomId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      await updateRoom(roomId, { name });
      setDialog({
        message: "Sala alterada com sucesso!",
        onOk: () => router.push("/rooms"),
      });
    } catch {
      setDialog({ message: "Erro ao alterar sala.", onOk: () => setDialog(null) });
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteClick() {
    setDialog({
      message: `Deseja excluir a sala "${name}"?`,
      onOk: async () => {
        setDialog(null);
        try {
          setDeleting(true);
          await deleteRoom(roomId);
          setDialog({
            message: "Sala excluída com sucesso!",
            onOk: () => router.push("/rooms"),
          });
        } catch {
          setDialog({ message: "Erro ao excluir sala.", onOk: () => setDialog(null) });
        } finally {
          setDeleting(false);
        }
      },
      onCancel: () => setDialog(null),
    });
  }

  return (
    <Layout>
      <RequirePermission permission="ROOMS_CREATE">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push("/rooms")}
              className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alterar Sala</h1>
              <p className="text-sm text-gray-500 mt-0.5">Atualize as informações da sala.</p>
            </div>
          </div>

          {/* Form */}
          {loadingData ? (
            <p className="text-gray-500 text-sm text-center py-6">Carregando...</p>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Nome</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => router.push("/rooms")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Excluir Sala
              </button>
            </>
          )}
        </div>

        {dialog && <AppDialog {...dialog} />}
      </RequirePermission>
    </Layout>
  );
}
