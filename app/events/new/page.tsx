"use client";

import { useEffect, useState } from "react";
import { listRooms, Room } from "@/services/roomService";
import { listUsers } from "@/services/userListService";
import { createEvent } from "@/services/eventService";

type User = {
  userId: string;
  name: string;
};

export default function NewEventPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
    loadUsers();
  }, []);

  async function loadRooms() {
    try {
      const data = await listRooms();
      setRooms(data);
    } catch (error) {
      console.error("Erro ao carregar salas", error);
    }
  }

  async function loadUsers() {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const selectedUser = users.find(
      (user) => user.userId === userId
    );

    if (!selectedUser) {
      alert("Selecione uma pessoa.");
      return;
    }

    if (!roomId) {
      alert("Selecione uma sala.");
      return;
    }

    if (!eventDate) {
      alert("Informe a data.");
      return;
    }

    if (!startTime) {
      alert("Informe o horário inicial.");
      return;
    }

    if (!endTime) {
      alert("Informe o horário final.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId: selectedUser.userId,
        userName: selectedUser.name,
        roomId,
        eventDate,
        startTime,
        endTime,
      };

      const savedEvent = await createEvent(payload);

      console.log("Evento salvo:", savedEvent);

      alert("Evento salvo com sucesso!");

      setUserId("");
      setRoomId("");
      setEventDate("");
      setStartTime("");
      setEndTime("");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar evento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">
        Novo Evento
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="block mb-1">
            Pessoa
          </label>

          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border p-2 w-full text-black"
            required
          >
            <option value="">
              Selecione uma pessoa
            </option>

            {users.map((user) => (
              <option
                key={user.userId}
                value={user.userId}
              >
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">
            Sala
          </label>

          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border p-2 w-full text-black"
            required
          >
            <option value="">
              Selecione uma sala
            </option>

            {rooms.map((room) => (
              <option
                key={room.roomId}
                value={room.roomId}
              >
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">
            Data
          </label>

          <input
            type="date"
            value={eventDate}
            onChange={(e) =>
              setEventDate(e.target.value)
            }
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">
            Hora Inicial
          </label>

          <input
            type="time"
            value={startTime}
            onChange={(e) =>
              setStartTime(e.target.value)
            }
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">
            Hora Final
          </label>

          <input
            type="time"
            value={endTime}
            onChange={(e) =>
              setEndTime(e.target.value)
            }
            className="border p-2 w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded"
        >
          {loading
            ? "Salvando..."
            : "Salvar Evento"}
        </button>
      </form>
    </div>
  );
}