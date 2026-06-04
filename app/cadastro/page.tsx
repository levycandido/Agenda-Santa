"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/app/auth/AuthContext";
import { createUser } from "@/services/userListService";
import { createRoom } from "@/services/roomService";

type DialogState = { message: string; onOk: () => void } | null;

function AppDialog({ message, onOk }: NonNullable<DialogState>) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Agenda Santa</h3>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onOk}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function UserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      await createUser({ nome: name, email, roles: [], cor: "" });
      setName("");
      setEmail("");
      setDialog({ message: "Usuário cadastrado com sucesso!", onOk: () => setDialog(null) });
    } catch (err) {
      console.error(err);
      setDialog({ message: "Erro ao cadastrar usuário.", onOk: () => setDialog(null) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
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
        <button
          type="submit"
          disabled={loading}
          className="self-start bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Cadastrar Usuário"}
        </button>
      </form>
      {dialog && <AppDialog {...dialog} />}
    </>
  );
}

function RoomForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      await createRoom({ name });
      setName("");
      setDialog({ message: "Sala cadastrada com sucesso!", onOk: () => setDialog(null) });
    } catch (err) {
      console.error(err);
      setDialog({ message: "Erro ao cadastrar sala.", onOk: () => setDialog(null) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Nome da Sala</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="self-start bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Cadastrar Sala"}
        </button>
      </form>
      {dialog && <AppDialog {...dialog} />}
    </>
  );
}

export default function CadastroPage() {
  const { user } = useAuth();

  const canCreateUser = user?.permissions.includes("USERS_CREATE");
  const canCreateRoom = user?.permissions.includes("ROOMS_CREATE");

  if (!user) return <Layout><p className="p-6">Você precisa estar logado.</p></Layout>;
  if (!canCreateUser && !canCreateRoom) return <Layout><p className="p-6">Acesso negado.</p></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-8">Cadastro</h1>

      {canCreateUser && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Novo Usuário</h2>
          <UserForm />
        </section>
      )}

      {canCreateRoom && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Nova Sala</h2>
          <RoomForm />
        </section>
      )}
    </Layout>
  );
}
