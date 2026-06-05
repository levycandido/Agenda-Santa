"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { Menu } from "@/components/Menu";
import { listRooms, Room } from "@/services/roomService";
import { listUsers, UserSummary, isUserDeactivated, syncDeactivatedUsers } from "@/services/userListService";
import { createEvent, deleteEvent, listEvents, Event } from "@/services/eventService";

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 8;
  return `${String(h).padStart(2, "0")}:00`;
});

function localIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayIso(): string {
  return localIso(new Date());
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return localIso(new Date(y, m - 1, d + n));
}

function addOneHour(time: string): string {
  const [h] = time.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:00`;
}

function generateDays(center: string, before: number, after: number): string[] {
  return Array.from({ length: before + after + 1 }, (_, i) =>
    addDays(center, i - before)
  );
}

function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type DialogState = {
  message: string;
  onOk: () => void;
  onCancel?: () => void;
} | null;

function AppDialog({ message, onOk, onCancel }: NonNullable<DialogState>) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Agenda Santa</h3>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
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

function NewEventModal({
  initialDate,
  initialStart,
  initialEnd,
  initialRoomId,
  initialUserId,
  onClose,
  onSaved,
}: {
  initialDate: string;
  initialStart: string;
  initialEnd: string;
  initialRoomId: string;
  initialUserId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [userId, setUserId] = useState(initialUserId);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [eventDate, setEventDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  function showAlert(message: string) {
    setDialog({ message, onOk: () => setDialog(null) });
  }

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch((e) => console.error("Erro ao carregar salas", e));
    listUsers()
      .then(setUsers)
      .catch((e) => console.error("Erro ao carregar usuários", e));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const selectedUser = users.find((u) => u.userId === userId);
    if (!selectedUser) { showAlert("Selecione uma pessoa."); return; }
    if (!roomId) { showAlert("Selecione uma sala."); return; }
    if (!eventDate) { showAlert("Informe a data."); return; }
    if (!startTime) { showAlert("Informe o horário inicial."); return; }
    if (!endTime) { showAlert("Informe o horário final."); return; }

    try {
      setLoading(true);
      await createEvent({
        userId: selectedUser.userId,
        userName: selectedUser.name,
        roomId,
        eventDate,
        startTime,
        endTime,
      });
      setDialog({ message: "Evento salvo com sucesso!", onOk: () => { setDialog(null); onSaved(); } });
    } catch (error) {
      console.error(error);
      showAlert("Erro ao salvar evento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Fechar"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-6 text-black">Novo Evento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Pessoa</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="border rounded px-2 py-1 w-full text-black text-sm" required>
              <option value="">Selecione uma pessoa</option>
              {users.filter((u) => u.status !== "DISABLED" && u.status !== "DESATIVADO" && !isUserDeactivated(u.userId)).map((u) => <option key={u.userId} value={u.userId}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Sala</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="border rounded px-2 py-1 w-full text-black text-sm" required>
              <option value="">Selecione uma sala</option>
              {rooms.map((r) => <option key={r.roomId} value={r.roomId}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Data</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="border rounded px-2 py-1 w-full text-black text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Hora Inicial</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border rounded px-2 py-1 w-full text-black text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Hora Final</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border rounded px-2 py-1 w-full text-black text-sm" required />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
      {dialog && <AppDialog {...dialog} />}
    </div>
  );
}

export default function EventsPage() {
  const today = todayIso();
  const [eventDate, setEventDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [days, setDays] = useState<string[]>(() => generateDays(today, 0, 6));
  const [dialog, setDialog] = useState<DialogState>(null);
  const [userSelectOpen, setUserSelectOpen] = useState(false);

  const activeUsers = users.filter((u) => u.status !== "DISABLED" && u.status !== "DESATIVADO" && !isUserDeactivated(u.userId));
  const userColorMap = new Map(users.map((u) => [u.name, u.color || u.cor || "#6366f1"]));

  const userSelectRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollAdjustRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const prependingRef = useRef(false);
  const appendingRef = useRef(false);

  function showAlert(message: string) {
    setDialog({ message, onOk: () => setDialog(null) });
  }

  function showConfirm(message: string, onConfirm: () => void) {
    setDialog({
      message,
      onOk: () => { setDialog(null); onConfirm(); },
      onCancel: () => setDialog(null),
    });
  }

  useEffect(() => {
    listRooms().then(setRooms).catch(console.error);
    listUsers().then(async (loaded) => {
      setUsers(loaded);
      const changed = await syncDeactivatedUsers(loaded);
      if (changed) setUsers([...loaded]);
    }).catch(console.error);
    listEvents().then(setAllEvents).catch(console.error);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userSelectRef.current && !userSelectRef.current.contains(e.target as Node)) {
        setUserSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // After rooms render, scroll to today
  useEffect(() => {
    if (rooms.length === 0) return;
    requestAnimationFrame(() => {
      const el = dayRefs.current.get(today);
      const container = scrollRef.current;
      if (el && container) {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        container.scrollTop += elRect.top - containerRect.top;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  // Adjust scroll position after prepending to avoid jump
  useLayoutEffect(() => {
    appendingRef.current = false;
    if (scrollAdjustRef.current !== null && scrollRef.current) {
      const { scrollTop: savedTop, scrollHeight: savedHeight } = scrollAdjustRef.current;
      const addedHeight = scrollRef.current.scrollHeight - savedHeight;
      scrollRef.current.scrollTop = savedTop + addedHeight;
      scrollAdjustRef.current = null;
      prependingRef.current = false;
    }
  }, [days]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const containerTop = container.getBoundingClientRect().top;

    // Detect which day header is at or just above the top of the container
    let current = days[0];
    for (const date of days) {
      const el = dayRefs.current.get(date);
      if (el) {
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop <= 20) current = date;
      }
    }
    if (current !== eventDate) setEventDate(current);

    // Append days when nearing the bottom
    if (!appendingRef.current && scrollTop + clientHeight >= scrollHeight - 400) {
      appendingRef.current = true;
      setDays((prev) => {
        const last = prev[prev.length - 1];
        return [...prev, addDays(last, 1), addDays(last, 2), addDays(last, 3)];
      });
    }

    // Prepend days when nearing the top
    if (!prependingRef.current && scrollTop <= 200) {
      prependingRef.current = true;
      scrollAdjustRef.current = { scrollTop: container.scrollTop, scrollHeight: container.scrollHeight };
      setDays((prev) => {
        const first = prev[0];
        return [addDays(first, -3), addDays(first, -2), addDays(first, -1), ...prev];
      });
    }
  }

  function handleDateInputChange(newDate: string) {
    setEventDate(newDate);
    const el = dayRefs.current.get(newDate);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTop = el.offsetTop;
    } else {
      // Date not rendered yet — reset window centered on new date
      setDays(generateDays(newDate, 3, 3));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const el2 = dayRefs.current.get(newDate);
          if (el2 && scrollRef.current) scrollRef.current.scrollTop = el2.offsetTop;
        })
      );
    }
  }

  async function handleCellClick(day: string, hour: string, roomId: string) {
    if (!selectedUserName) {
      showAlert("Selecione uma pessoa na parte superior antes de criar um evento.");
      return;
    }

    const existing = allEvents.find(
      (ev) =>
        ev.eventDate === day &&
        ev.roomId === roomId &&
        ev.startTime.slice(0, 2) === hour.slice(0, 2)
    );

    if (existing) {
      showConfirm(
        `Deseja excluir o evento de ${existing.userName} (${existing.startTime} – ${existing.endTime})?`,
        async () => {
          try {
            await deleteEvent(existing.eventId);
            setAllEvents(await listEvents());
          } catch {
            showAlert("Erro ao excluir evento.");
          }
        }
      );
      return;
    }

    const selectedUser = users.find((u) => u.name === selectedUserName);
    if (!selectedUser) return;

    try {
      await createEvent({
        userId: selectedUser.userId,
        userName: selectedUser.name,
        roomId,
        eventDate: day,
        startTime: hour,
        endTime: addOneHour(hour),
      });
      setAllEvents(await listEvents());
    } catch {
      showAlert("Erro ao salvar evento.");
    }
  }

  const gridCols =
    rooms.length > 0
      ? `80px repeat(${rooms.length}, minmax(100px, 1fr))`
      : "80px 1fr";

  return (
    <div className="flex flex-col h-screen">
      <Menu />
      <RequirePermission permission={["EVENTS_VIEW", "EVENTS_CREATE"]}>
        <>
        {/* Barra superior */}
        <div className="flex items-end justify-center gap-6 px-6 py-4 border-b shrink-0">
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-1">
              <div className="relative border border-gray-300 rounded-lg bg-white shadow-sm cursor-pointer">
                {/* Display customizado */}
                <div className="px-3 py-2 pointer-events-none select-none flex items-center gap-2 whitespace-nowrap">
                  {(() => {
                    const [y, m, d] = eventDate.split("-").map(Number);
                    const date = new Date(y, m - 1, d);
                    return (
                      <>
                        <span className="text-sm text-blue-600 font-semibold capitalize">
                          {date.toLocaleDateString("pt-BR", { weekday: "long" })}
                        </span>
                        <span className="text-sm text-black">
                          {date.toLocaleDateString("pt-BR")}
                        </span>
                      </>
                    );
                  })()}
                </div>
                {/* Input invisível por cima */}
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => handleDateInputChange(e.target.value)}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                  onKeyDown={(e) => e.preventDefault()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="relative" ref={userSelectRef}>
              <button
                type="button"
                onClick={() => setUserSelectOpen((o) => !o)}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                {selectedUserName ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: userColorMap.get(selectedUserName) || "#94a3b8" }}
                    />
                    <span className="text-gray-800 truncate">{selectedUserName}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Colaborador</span>
                )}
                <svg className="ml-auto w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {userSelectOpen && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl w-full min-w-[200px] py-1 max-h-60 overflow-auto">
                  <button
                    type="button"
                    onClick={() => { setSelectedUserName(""); setUserSelectOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
                  >
                    Todos
                  </button>
                  {activeUsers.map((u) => {
                    const color = u.color || u.cor || "#94a3b8";
                    return (
                      <button
                        key={u.userId}
                        type="button"
                        onClick={() => { setSelectedUserName(u.name); setUserSelectOpen(false); }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${selectedUserName === u.name ? "bg-blue-50 font-semibold" : "text-gray-800"}`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        {u.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grade com rolagem contínua */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
          onScroll={handleScroll}
        >
          <div
            id="eventos"
            className="grid"
            style={{ gridTemplateColumns: gridCols }}
          >
            {/* Cabeçalho das salas (sticky) */}
            <div className="sticky top-0 left-0 z-30 bg-white border-b border-r" />
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className="sticky top-0 z-20 bg-gray-100 border-b border-r px-3 py-2 font-semibold text-sm text-gray-700 text-center"
              >
                {room.name}
              </div>
            ))}

            {/* Dias */}
            {days.map((day) => (
              <React.Fragment key={day}>
                {/* Separador de dia */}
                <div
                  ref={(el) => {
                    if (el) dayRefs.current.set(day, el);
                    else dayRefs.current.delete(day);
                  }}
                  className="px-4 py-2 text-sm font-semibold capitalize text-center text-gray-700 border-t border-t-gray-300 border-b-2 border-b-gray-400"
                  style={{ gridColumn: "1 / -1", backgroundColor: "lab(96.1596 -0.082314 -1.13575)" }}
                >
                  {formatDayHeader(day)}
                </div>

                {/* Linhas de hora */}
                {HOURS.map((hour) => (
                  <React.Fragment key={`${day}-${hour}`}>
                    <button
                      onClick={() => setStartTime(hour)}
                      className={`sticky left-0 z-10 border-b border-r px-3 py-2 text-sm text-left transition-colors hover:bg-blue-50 ${
                        startTime === hour
                          ? "bg-blue-100 font-semibold text-blue-700"
                          : "bg-white text-gray-500"
                      }`}
                    >
                      {hour}
                    </button>

                    {rooms.map((room) => {
                      const cellEvents = allEvents.filter((ev) => {
                        if (ev.eventDate !== day) return false;
                        if (ev.roomId !== room.roomId) return false;
                        if (ev.startTime.slice(0, 2) !== hour.slice(0, 2)) return false;
                        const evUser = users.find((u) => u.name === ev.userName);
                        const inactive = evUser?.status === "DISABLED" || evUser?.status === "DESATIVADO";
                        if (inactive && ev.eventDate > today) return false;
                        return true;
                      });

                      return (
                        <div
                          key={`${day}-${hour}-${room.roomId}`}
                          onClick={() => handleCellClick(day, hour, room.roomId)}
                          className="border-b border-r p-1 min-h-[56px] cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          {cellEvents.map((ev) => {
                            const color = userColorMap.get(ev.userName) || "#6366f1";
                            return (
                              <div
                                key={ev.eventId}
                                className="rounded px-2 py-1 mb-1 border"
                                style={{
                                  backgroundColor: color + "40",
                                  borderColor: color,
                                }}
                              >
                                <p className="text-xs font-semibold truncate text-black">
                                  {ev.startTime} – {ev.endTime}
                                </p>
                                <p className="text-xs text-gray-700 truncate">
                                  {ev.userName}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        </>
      </RequirePermission>

      {modalOpen && (
        <NewEventModal
          initialDate={eventDate}
          initialStart={startTime}
          initialEnd={startTime ? addOneHour(startTime) : ""}
          initialRoomId=""
          initialUserId={users.find((u) => u.name === selectedUserName)?.userId ?? ""}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            listEvents().then(setAllEvents).catch(console.error);
          }}
        />
      )}

      {dialog && <AppDialog {...dialog} />}
    </div>
  );
}
