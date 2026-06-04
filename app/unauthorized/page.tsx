import { Layout } from "@/components/Layout";

export default function UnauthorizedPage() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold">Acesso negado</h1>
      <p>Você não tem permissão para acessar esta página.</p>
    </Layout>
  );
}