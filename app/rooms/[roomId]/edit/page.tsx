"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { getRoom, updateRoom } from "@/services/roomService";

type DialogState = { message: string; onOk: () => void } | null;

function AppDialog({ message, onOk }: NonNullable<DialogState>) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Agenda Santa</h3>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end">
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

  return (
    <Layout>
      <RequirePermission permission="ROOMS_CREATE">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push("/rooms")}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Voltar"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">Alterar Sala</h1>
          </div>

          {loadingData ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border rounded px-3 py-2 w-full text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/rooms")}
                  className="flex-1 border rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          )}
        </div>

        {dialog && <AppDialog {...dialog} />}
      </RequirePermission>
    </Layout>
  );
}
