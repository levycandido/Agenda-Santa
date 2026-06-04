export type Room = {
  roomId: string;
  name: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function listRooms(): Promise<Room[]> {
  const token = localStorage.getItem("id_token");

  if (!token) {
    throw new Error("Token não encontrado");
  }

  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao buscar salas: ${response.status} - ${text}`);
  }

  return response.json();
}

export async function deleteRoom(roomId: string): Promise<void> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao excluir sala: ${response.status} - ${text}`);
  }
}

export async function getRoom(roomId: string): Promise<Room> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao buscar sala: ${response.status} - ${text}`);
  }

  return response.json();
}

export async function updateRoom(roomId: string, data: { name: string }): Promise<void> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomId, ...data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao alterar sala: ${response.status} - ${text}`);
  }
}

export async function createRoom(data: { name: string }): Promise<Room> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao criar sala: ${response.status} - ${text}`);
  }

  return response.json();
}