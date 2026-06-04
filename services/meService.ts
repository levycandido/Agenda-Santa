export type MeResponse = {
  userId: string;
  email: string;
  nome: string;
  roles: string[];
  permissions: string[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function getMe(): Promise<MeResponse> {
  const token = localStorage.getItem("id_token");

  if (!token) {
    throw new Error("Token não encontrado");
  }

  const response = await fetch(`${API_BASE_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao buscar usuário: ${response.status} - ${text}`);
  }

  return response.json();
}