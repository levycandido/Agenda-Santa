const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type CreateEventRequest = {
  userId: string;
  userName: string;
  roomId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  description?: string;
};

export type Event = {
  eventId: string;
  userId: string;
  userName: string;
  roomId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  description?: string;
};

export async function deleteEvent(eventId: string): Promise<void> {
  const token = localStorage.getItem("id_token");

  if (!token) {
    throw new Error("Token não encontrado");
  }

  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao excluir evento: ${response.status} - ${text}`);
  }
}

export async function listEvents(): Promise<Event[]> {
  const token = localStorage.getItem("id_token");

  if (!token) {
    throw new Error("Token não encontrado");
  }

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao buscar eventos: ${response.status} - ${text}`);
  }

  return response.json();
}

export async function deleteFutureUserEvents(userId: string): Promise<void> {
  const events = await listEvents();

  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const nowDateTime = `${y}-${mo}-${d}T${h}:${mi}`;

  const toDelete = events.filter((ev) => {
    if (ev.userId !== userId) return false;
    const evDateTime = `${ev.eventDate}T${ev.startTime.slice(0, 5)}`;
    return evDateTime >= nowDateTime;
  });

  await Promise.all(toDelete.map((ev) => deleteEvent(ev.eventId)));
}

export async function createEvent(payload: CreateEventRequest) {
  const token = localStorage.getItem("id_token");

  if (!token) {
    throw new Error("Token não encontrado");
  }

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao salvar evento: ${response.status} - ${text}`);
  }

  return response.json();
}