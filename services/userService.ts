export type ApiUser = {
  id: number;
  name: string;
  email: string;
};

export async function getUsers(): Promise<ApiUser[]> {
  const response = await fetch("https://jsonplaceholder.typicode.com/users");

  if (!response.ok) {
    throw new Error("Erro ao buscar usuários");
  }

  return response.json();
}