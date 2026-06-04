import { deleteFutureUserEvents } from "@/services/eventService";

const DEACTIVATED_KEY = "deactivatedUserIds";

function getDeactivatedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DEACTIVATED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function markUserDeactivated(userId: string): void {
  if (typeof window === "undefined") return;
  const ids = getDeactivatedIds();
  ids.add(userId);
  localStorage.setItem(DEACTIVATED_KEY, JSON.stringify([...ids]));
}

export function isUserDeactivated(userId: string): boolean {
  return getDeactivatedIds().has(userId);
}

export async function syncDeactivatedUsers(users: UserSummary[]): Promise<boolean> {
  const results = await Promise.allSettled(users.map((u) => getUser(u.userId)));
  let changed = false;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      const s = r.value.status;
      if ((s === "DISABLED" || s === "DESATIVADO") && !isUserDeactivated(users[i].userId)) {
        markUserDeactivated(users[i].userId);
        changed = true;
      }
    }
  });
  return changed;
}

export type UserSummary = {
  userId: string;
  name: string;
  email: string;
  color?: string;
  cor?: string;
  status?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function listUsers(): Promise<UserSummary[]> {
  const token = localStorage.getItem("id_token");

  if (!token) {
    throw new Error("Token não encontrado");
  }

  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Erro ao buscar usuários: ${response.status} - ${text}`
    );
  }

  return response.json();
}

export async function deactivateUser(u: UserSummary): Promise<void> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const full = await getUser(u.userId);

  const response = await fetch(`${API_BASE_URL}/users/${u.userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: u.userId,
      nome: full.nome || full.name || u.name,
      email: full.email,
      roles: full.roles || [],
      cor: full.cor || full.color || u.color || u.cor || "",
      status: "DISABLED",
      updatedAt: new Date().toISOString(),
    }),
  });

  markUserDeactivated(u.userId);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao desativar usuário: ${response.status} - ${text}`);
  }

  await deleteFutureUserEvents(u.userId);
}

export type UserDetail = {
  userId: string;
  nome?: string;
  name?: string;
  email: string;
  roles: string[];
  color?: string;
  cor?: string;
  status?: string;
};

export async function getUser(userId: string): Promise<UserDetail> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao buscar usuário: ${response.status} - ${text}`);
  }

  return response.json();
}

export type CreateUserInput = {
  nome: string;
  email: string;
  roles: string[];
  cor: string;
};

export type UpdateUserInput = {
  nome: string;
  email: string;
  roles: string[];
  cor: string;
  status?: string;
  updatedAt?: string;
};

export async function updateUser(userId: string, data: UpdateUserInput): Promise<void> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, ...data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao alterar usuário: ${response.status} - ${text}`);
  }
}

export async function createUser(data: CreateUserInput): Promise<UserSummary> {
  const token = localStorage.getItem("id_token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data, status: "ACTIVATED" }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao criar usuário: ${response.status} - ${text}`);
  }

  return response.json();
}