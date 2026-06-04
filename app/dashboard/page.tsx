"use client";

import { Layout } from "@/components/Layout";
import { useAuth } from "@/app/auth/AuthContext";
import { getMe } from "@/services/meService";
import { useState } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [apiResult, setApiResult] = useState("");

  async function testProtectedApi() {
    try {
      const data = await getMe();
      setApiResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(error);
      setApiResult("Erro ao chamar API protegida.");
    }
  }

  if (loading) {
    return (
      <Layout>
        <p>Carregando usuário...</p>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <h1 className="text-2xl font-bold">Acesso negado</h1>
        <p>Você precisa fazer login.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <h2 className="mt-6 text-xl font-semibold">Usuário logado</h2>

      <pre className="mt-2 rounded bg-gray-100 p-4 text-black">
        {JSON.stringify(user, null, 2)}
      </pre>

      <button
        onClick={testProtectedApi}
        className="mt-6 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Testar API Protegida /me
      </button>

      {apiResult && (
        <>
          <h2 className="mt-6 text-xl font-semibold">Resposta da API</h2>

          <pre className="mt-2 rounded bg-gray-100 p-4 text-black">
            {apiResult}
          </pre>
        </>
      )}
    </Layout>
  );
}