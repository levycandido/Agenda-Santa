"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { getUser, updateUser, markUserDeactivated } from "@/services/userListService";
import { deleteFutureUserEvents } from "@/services/eventService";

const PROFILE_OPTIONS = ["ADMIN", "COLABORADOR"];

const PALETTE = [
  "#fecaca", "#fed7aa", "#fef08a", "#d9f99d", "#bbf7d0",
  "#99f6e4", "#bae6fd", "#bfdbfe", "#ddd6fe", "#fbcfe8",
  "#fca5a5", "#fdba74", "#fde047", "#bef264", "#86efac",
  "#5eead4", "#7dd3fc", "#93c5fd", "#c4b5fd", "#f9a8d4",
  "#f87171", "#fb923c", "#facc15", "#a3e635", "#4ade80",
  "#2dd4bf", "#38bdf8", "#60a5fa", "#a78bfa", "#f472b6",
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#0ea5e9", "#3b82f6", "#8b5cf6", "#ec4899",
  "#fde8e8", "#fff7ed", "#fefce8", "#f7fee7", "#f0fdf4",
  "#f0fdfa", "#f0f9ff", "#eff6ff", "#f5f3ff", "#fdf2f8",
];

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

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Selecionar cor"
        className="w-5 h-5 rounded-full border border-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-110 transition-transform"
        style={{ backgroundColor: value }}
      />
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-64">
          <p className="text-xs font-medium text-gray-500 mb-2">Selecione uma cor</p>
          <div className="grid grid-cols-10 gap-1">
            {PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => { onChange(color); setOpen(false); }}
                className="w-5 h-5 rounded-sm border border-transparent hover:scale-125 hover:border-gray-400 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className="text-xs text-gray-500">Personalizada:</span>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-6 rounded cursor-pointer border border-gray-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;

  const corFromList = searchParams.get("cor") || "#6366f1";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [color, setColor] = useState(corFromList);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  useEffect(() => {
    getUser(userId)
      .then((u) => {
        setNome(u.nome || u.name || "");
        setEmail(u.email);
        setRole(u.roles?.[0] || "");
        const apiColor = u.cor || u.color;
        if (apiColor) setColor(apiColor);
      })
      .catch(() => setDialog({ message: "Erro ao carregar usuário.", onOk: () => router.push("/users") }))
      .finally(() => setLoadingData(false));
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      setDialog({ message: "Selecione um perfil.", onOk: () => setDialog(null) });
      return;
    }
    try {
      setSaving(true);
      await updateUser(userId, { nome, email, roles: [role], cor: color });
      setDialog({
        message: "Usuário alterado com sucesso!",
        onOk: () => router.push("/users"),
      });
    } catch {
      setDialog({ message: "Erro ao alterar usuário.", onOk: () => setDialog(null) });
    } finally {
      setSaving(false);
    }
  }

  function handleDeactivate() {
    setDialog({
      message: `Atenção: todos os agendamentos futuros de "${nome}" serão eliminados. Deseja continuar com a desativação?`,
      onOk: async () => {
        setDialog(null);
        try {
          setSaving(true);
          markUserDeactivated(userId);
          await updateUser(userId, {
            nome,
            email,
            roles: role ? [role] : [],
            cor: color,
            status: "DISABLED",
            updatedAt: new Date().toISOString(),
          });
          await deleteFutureUserEvents(userId);
          setDialog({
            message: "Usuário desativado com sucesso!",
            onOk: () => router.push("/users"),
          });
        } catch {
          setDialog({ message: "Erro ao desativar usuário.", onOk: () => setDialog(null) });
        } finally {
          setSaving(false);
        }
      },
      onCancel: () => setDialog(null),
    });
  }

  return (
    <Layout>
      <RequirePermission permission="USERS_CREATE">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push("/users")}
              className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alterar Usuário</h1>
              <p className="text-sm text-gray-500 mt-0.5">Atualize as informações do usuário.</p>
            </div>
          </div>

          {/* Form */}
          {loadingData ? (
            <p className="text-gray-500 text-sm text-center py-6">Carregando...</p>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Nome</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Perfil</label>
                      <div className="flex flex-col gap-2">
                        {PROFILE_OPTIONS.map((option) => (
                          <label key={option} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded">
                            <input
                              type="radio"
                              name="profile"
                              value={option}
                              checked={role === option}
                              onChange={(e) => setRole(e.target.value)}
                              className="rounded-full border-gray-300"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Cor</label>
                      <div className="flex items-center">
                        <ColorPicker value={color} onChange={setColor} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => router.push("/users")}
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

              {/* Deactivate button */}
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Desativar Usuário
              </button>
            </>
          )}
        </div>

        {dialog && <AppDialog {...dialog} />}
      </RequirePermission>
    </Layout>
  );
}
