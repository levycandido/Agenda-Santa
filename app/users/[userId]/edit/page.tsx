"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { getUser, updateUser, markUserDeactivated } from "@/services/userListService";
import { deleteFutureUserEvents } from "@/services/eventService";

const ALL_ROLES = ["ADMIN", "COLABORADOR", "MUSICO", "VISUALIZADOR"];

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
  const [roles, setRoles] = useState<string[]>([]);
  const [color, setColor] = useState(corFromList);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  useEffect(() => {
    getUser(userId)
      .then((u) => {
        setNome(u.nome || u.name || "");
        setEmail(u.email);
        setRoles(u.roles || []);
        const apiColor = u.cor || u.color;
        if (apiColor) setColor(apiColor);
      })
      .catch(() => setDialog({ message: "Erro ao carregar usuário.", onOk: () => router.push("/users") }))
      .finally(() => setLoadingData(false));
  }, [userId]);

  function toggleRole(role: string) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((x) => x !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (roles.length === 0) {
      setDialog({ message: "Selecione ao menos um perfil.", onOk: () => setDialog(null) });
      return;
    }
    try {
      setSaving(true);
      await updateUser(userId, { nome, email, roles, cor: color });
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
            roles,
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
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push("/users")}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Voltar"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">Alterar Usuário</h1>
          </div>

          {loadingData ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="border rounded px-3 py-2 w-full text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border rounded px-3 py-2 w-full text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Cor</label>
                <ColorPicker value={color} onChange={setColor} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Perfis (Roles)</label>
                <div className="flex flex-col gap-2">
                  {ALL_ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="rounded"
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/users")}
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

              <div className="border-t pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={saving}
                  className="w-full border border-red-300 text-red-600 rounded px-4 py-2 text-sm hover:bg-red-50 disabled:opacity-60"
                >
                  Desativar Usuário
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
