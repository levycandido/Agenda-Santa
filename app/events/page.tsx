"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { useAuth } from "@/app/auth/AuthContext";
import { Menu } from "@/components/Menu";
import { listRooms, Room } from "@/services/roomService";
import { listUsers, UserSummary, isUserDeactivated, syncDeactivatedUsers } from "@/services/userListService";
import { createEvent, deleteEvent, listEvents, Event } from "@/services/eventService";

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 8;
  return `${String(h).padStart(2, "0")}:00`;
});

const ROOM_COLORS = ["#6366f1", "#f59e0b", "#f43f5e", "#10b981", "#3b82f6", "#8b5cf6"];

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

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const day = String(d).padStart(2, "0");
  const month = date.toLocaleDateString("pt-BR", { month: "long" });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} de ${y}`;
}

function CouchIcon({ color = "currentColor", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <rect x="4" y="5" width="16" height="7" rx="2" />
      <rect x="2" y="10" width="4" height="7" rx="2" />
      <rect x="18" y="10" width="4" height="7" rx="2" />
      <rect x="4" y="13" width="16" height="4" rx="1" />
    </svg>
  );
}

type DialogState = {
  message: string;
  onOk: () => void;
  onCancel?: () => void;
} | null;

function AppDialog({ message, onOk, onCancel }: NonNullable<DialogState>) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Agenda Santa</h3>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50">
              Cancelar
            </button>
          )}
          <button onClick={onOk} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function NewEventModal({
  initialDate, initialStart, initialEnd, initialRoomId, initialUserId, onClose, onSaved,
}: {
  initialDate: string; initialStart: string; initialEnd: string;
  initialRoomId: string; initialUserId: string; onClose: () => void; onSaved: () => void;
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

  function showAlert(message: string) { setDialog({ message, onOk: () => setDialog(null) }); }

  useEffect(() => {
    listRooms().then(setRooms).catch((e) => console.error("Erro ao carregar salas", e));
    listUsers().then(setUsers).catch((e) => console.error("Erro ao carregar usuários", e));
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
      await createEvent({ userId: selectedUser.userId, userName: selectedUser.name, roomId, eventDate, startTime, endTime });
      setDialog({ message: "Evento salvo com sucesso!", onOk: () => { setDialog(null); onSaved(); } });
    } catch (error) {
      console.error(error);
      showAlert("Erro ao salvar evento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Fechar">×</button>
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
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-60">
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
  const { user } = useAuth();
  const [eventDate, setEventDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [days, setDays] = useState<string[]>(() => generateDays(today, 0, 6));
  const [dialog, setDialog] = useState<DialogState>(null);
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const [mobileCollabOpen, setMobileCollabOpen] = useState(false);
  const [mobileCollabPos, setMobileCollabPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const mobileCollabBtnRef = useRef<HTMLButtonElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function openMobileCollab() {
    if (mobileCollabBtnRef.current) {
      const r = mobileCollabBtnRef.current.getBoundingClientRect();
      setMobileCollabPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setMobileCollabOpen(true);
  }

  const activeUsers = users.filter((u) => u.status !== "DISABLED" && u.status !== "DESATIVADO" && !isUserDeactivated(u.userId));
  const userColorMap = new Map(users.map((u) => [u.name, u.color || u.cor || "#6366f1"]));

  const userSelectRef = useRef<HTMLDivElement>(null);
  // Desktop scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollAdjustRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const prependingRef = useRef(false);
  const appendingRef = useRef(false);
  // Mobile scroll (separate refs — both layouts live in the DOM simultaneously)
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const mobileDayRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const mobileScrollAdjustRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const mobilePrependingRef = useRef(false);
  const mobileAppendingRef = useRef(false);

  function showAlert(message: string) { setDialog({ message, onOk: () => setDialog(null) }); }
  function showConfirm(message: string, onConfirm: () => void) {
    setDialog({ message, onOk: () => { setDialog(null); onConfirm(); }, onCancel: () => setDialog(null) });
  }

  useEffect(() => {
    if (!user) return;
    listRooms().then(setRooms).catch(console.error);
    listUsers().then(async (loaded) => {
      setUsers(loaded);
      const changed = await syncDeactivatedUsers(loaded);
      if (changed) setUsers([...loaded]);
    }).catch(console.error);
    listEvents().then(setAllEvents).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // Initialize selected room when rooms first load
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].roomId);
    }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userSelectRef.current && !userSelectRef.current.contains(e.target as Node)) {
        setUserSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (rooms.length === 0) return;
    requestAnimationFrame(() => {
      for (const [refs, container] of [
        [dayRefs.current, scrollRef.current],
        [mobileDayRefs.current, mobileScrollRef.current],
      ] as [Map<string, HTMLDivElement>, HTMLDivElement | null][]) {
        const el = refs.get(today);
        if (el && container) {
          container.scrollTop += el.getBoundingClientRect().top - container.getBoundingClientRect().top;
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  useLayoutEffect(() => {
    // Desktop
    appendingRef.current = false;
    if (scrollAdjustRef.current !== null && scrollRef.current) {
      const { scrollTop: savedTop, scrollHeight: savedHeight } = scrollAdjustRef.current;
      scrollRef.current.scrollTop = savedTop + (scrollRef.current.scrollHeight - savedHeight);
      scrollAdjustRef.current = null;
      prependingRef.current = false;
    }
    // Mobile
    mobileAppendingRef.current = false;
    if (mobileScrollAdjustRef.current !== null && mobileScrollRef.current) {
      const { scrollTop: savedTop, scrollHeight: savedHeight } = mobileScrollAdjustRef.current;
      mobileScrollRef.current.scrollTop = savedTop + (mobileScrollRef.current.scrollHeight - savedHeight);
      mobileScrollAdjustRef.current = null;
      mobilePrependingRef.current = false;
    }
  }, [days]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const containerTop = container.getBoundingClientRect().top;
    let current = days[0];
    for (const date of days) {
      const el = dayRefs.current.get(date);
      if (el) {
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop <= 20) current = date;
      }
    }
    if (current !== eventDate) setEventDate(current);
    if (!appendingRef.current && scrollTop + clientHeight >= scrollHeight - 400) {
      appendingRef.current = true;
      setDays((prev) => { const last = prev[prev.length - 1]; return [...prev, addDays(last, 1), addDays(last, 2), addDays(last, 3)]; });
    }
    if (!prependingRef.current && scrollTop <= 200) {
      prependingRef.current = true;
      scrollAdjustRef.current = { scrollTop: container.scrollTop, scrollHeight: container.scrollHeight };
      setDays((prev) => { const first = prev[0]; return [addDays(first, -3), addDays(first, -2), addDays(first, -1), ...prev]; });
    }
  }

  function handleDateInputChange(newDate: string) {
    setEventDate(newDate);
    const el = dayRefs.current.get(newDate);
    const mel = mobileDayRefs.current.get(newDate);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTop = el.offsetTop;
    }
    if (mel && mobileScrollRef.current) {
      mobileScrollRef.current.scrollTop = mel.offsetTop;
    }
    if (!el && !mel) {
      setDays(generateDays(newDate, 3, 3));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const e2 = dayRefs.current.get(newDate);
          if (e2 && scrollRef.current) scrollRef.current.scrollTop = e2.offsetTop;
          const me2 = mobileDayRefs.current.get(newDate);
          if (me2 && mobileScrollRef.current) mobileScrollRef.current.scrollTop = me2.offsetTop;
        })
      );
    }
  }

  function handleMobileScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const containerTop = container.getBoundingClientRect().top;
    let current = days[0];
    for (const date of days) {
      const el = mobileDayRefs.current.get(date);
      if (el) {
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop <= 20) current = date;
      }
    }
    if (current !== eventDate) setEventDate(current);
    if (!mobileAppendingRef.current && scrollTop + clientHeight >= scrollHeight - 400) {
      mobileAppendingRef.current = true;
      setDays((prev) => { const last = prev[prev.length - 1]; return [...prev, addDays(last, 1), addDays(last, 2), addDays(last, 3)]; });
    }
    if (!mobilePrependingRef.current && scrollTop <= 200) {
      mobilePrependingRef.current = true;
      mobileScrollAdjustRef.current = { scrollTop: container.scrollTop, scrollHeight: container.scrollHeight };
      setDays((prev) => { const first = prev[0]; return [addDays(first, -3), addDays(first, -2), addDays(first, -1), ...prev]; });
    }
  }

  async function handleCellClick(day: string, hour: string, roomId: string) {
    if (!selectedUserName) {
      showAlert("Selecione uma pessoa antes de criar um evento.");
      return;
    }
    const existing = allEvents.find(
      (ev) => ev.eventDate === day && ev.roomId === roomId && ev.startTime.slice(0, 2) === hour.slice(0, 2)
    );
    if (existing) {
      showConfirm(
        `Deseja excluir o evento de ${existing.userName} (${existing.startTime} – ${existing.endTime})?`,
        async () => {
          try { await deleteEvent(existing.eventId); setAllEvents(await listEvents()); }
          catch { showAlert("Erro ao excluir evento."); }
        }
      );
      return;
    }
    const selectedUser = users.find((u) => u.name === selectedUserName);
    if (!selectedUser) return;
    try {
      await createEvent({ userId: selectedUser.userId, userName: selectedUser.name, roomId, eventDate: day, startTime: hour, endTime: addOneHour(hour) });
      setAllEvents(await listEvents());
    } catch { showAlert("Erro ao salvar evento."); }
  }

  const gridCols = rooms.length > 0 ? `80px repeat(${rooms.length}, minmax(100px, 1fr))` : "80px 1fr";

  // Shared event card renderer
  function EventCard({ ev, compact = false }: { ev: Event; compact?: boolean }) {
    const color = userColorMap.get(ev.userName) || "#6366f1";
    return (
      <div
        key={ev.eventId}
        className={`rounded-md border-l-4 ${compact ? "px-2 py-1.5 mb-1" : "px-3 py-2 mb-1"}`}
        style={{ backgroundColor: color + "18", borderLeftColor: color }}
      >
        <p className={`font-bold truncate ${compact ? "text-xs" : "text-sm"}`} style={{ color }}>
          {ev.startTime} - {ev.endTime}
        </p>
        <p className={`text-gray-700 truncate ${compact ? "text-xs mt-0.5" : "text-xs mt-0.5"}`}>
          {ev.userName}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-500">Reunião</span>
        </div>
      </div>
    );
  }

  function FilterControls({ stacked = false }: { stacked?: boolean }) {
    const calendarIcon = (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
    const usersIcon = (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
    const chevron = (
      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    );

    return (
      <div className={stacked ? "flex flex-col gap-3" : "flex gap-6 flex-wrap items-end"}>
        {/* Date */}
        <div className={stacked ? "w-full" : ""}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            {calendarIcon} Data
          </div>
          <div className="relative border border-gray-200 rounded-lg bg-white shadow-sm cursor-pointer">
            <div className="px-3 py-2.5 pointer-events-none select-none flex items-center gap-2 pr-9">
              <span className="text-sm text-gray-700 whitespace-nowrap">{formatDateDisplay(eventDate)}</span>
            </div>
            {chevron}
            <input type="date" value={eventDate} onChange={(e) => handleDateInputChange(e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
              onKeyDown={(e) => e.preventDefault()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Collaborator — mobile: native <select>; desktop: custom dropdown */}
        <div className={stacked ? "w-full" : ""}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            {usersIcon} Colaborador
          </div>
          {stacked ? (
            /* Mobile: fixed dropdown positioned below the button */
            <button
              ref={mobileCollabBtnRef}
              type="button"
              onClick={openMobileCollab}
              className="w-full flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {selectedUserName ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: userColorMap.get(selectedUserName) || "#94a3b8" }} />
                  <span className="text-gray-800 truncate">{selectedUserName}</span>
                </>
              ) : (
                <span className="text-gray-500">Todos os colaboradores</span>
              )}
              <svg className="ml-auto w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            /* Desktop: custom dropdown */
            <div className="relative" ref={userSelectRef}>
              <button type="button" onClick={() => setUserSelectOpen((o) => !o)}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px]"
              >
                {selectedUserName ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: userColorMap.get(selectedUserName) || "#94a3b8" }} />
                    <span className="text-gray-800 truncate">{selectedUserName}</span>
                  </>
                ) : (
                  <span className="text-gray-500">Todos os colaboradores</span>
                )}
                <svg className="ml-auto w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {userSelectOpen && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl w-full min-w-[220px] py-1 max-h-60 overflow-auto">
                  <button type="button" onClick={() => { setSelectedUserName(""); setUserSelectOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50">
                    Todos os colaboradores
                  </button>
                  {activeUsers.map((u) => {
                    const color = u.color || u.cor || "#94a3b8";
                    return (
                      <button key={u.userId} type="button" onClick={() => { setSelectedUserName(u.name); setUserSelectOpen(false); }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${selectedUserName === u.name ? "bg-indigo-50 font-semibold text-indigo-700" : "text-gray-800"}`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: color }} />
                        {u.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f0f4f8]">

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Menu />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden bg-indigo-600 px-4 py-3 flex items-center justify-between shrink-0 relative z-50">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-1 hover:bg-indigo-700 rounded transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-base leading-tight">Agenda Santa</p>
            <p className="text-indigo-200 text-xs leading-tight">Igreja Batista Vida Abundante</p>
          </div>
          <button className="text-white p-1 relative" aria-label="Notificações">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <RequirePermission permission={["EVENTS_VIEW", "EVENTS_CREATE"]}>
            <>
              {/* ── MOBILE LAYOUT ── */}
              <div className="md:hidden h-full flex flex-col bg-[#f8f8fb]">

                {/* Filters */}
                <div className="shrink-0 bg-white px-4 pt-4 pb-4 border-b border-gray-100">
                  {FilterControls({ stacked: true })}
                </div>

                {/* Room tabs */}
                <div className="shrink-0 bg-white px-4 py-3 flex gap-2 overflow-x-auto border-b border-gray-100" style={{ scrollbarWidth: "none" }}>
                  {rooms.map((room, i) => {
                    const color = ROOM_COLORS[i % ROOM_COLORS.length];
                    const active = room.roomId === selectedRoomId;
                    return (
                      <button
                        key={room.roomId}
                        onClick={() => setSelectedRoomId(room.roomId)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 border transition-colors ${
                          active ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        <CouchIcon color={active ? color : "#9ca3af"} size={18} />
                        {room.name}
                      </button>
                    );
                  })}
                </div>

                {/* Date navigation */}
                <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
                  <button
                    onClick={() => handleDateInputChange(addDays(eventDate, -1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="capitalize">{formatDayHeader(eventDate)}</span>
                  </div>
                  <button
                    onClick={() => handleDateInputChange(addDays(eventDate, 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                {/* Multi-day scrollable schedule — one room at a time */}
                <div
                  ref={mobileScrollRef}
                  className="flex-1 overflow-auto bg-white"
                  onScroll={handleMobileScroll}
                >
                  <div className="grid" style={{ gridTemplateColumns: "64px 1fr" }}>
                    {days.map((day) => (
                      <React.Fragment key={day}>
                        {/* Day separator */}
                        <div
                          ref={(el) => { if (el) mobileDayRefs.current.set(day, el); else mobileDayRefs.current.delete(day); }}
                          className="col-span-2 px-4 py-2 text-sm font-semibold capitalize text-center text-gray-600 border-t border-gray-200 border-b-2 border-b-gray-300 bg-gray-50"
                        >
                          {formatDayHeader(day)}
                        </div>
                        {/* Hour rows */}
                        {HOURS.map((hour) => {
                          const cellEvents = allEvents.filter((ev) => {
                            if (ev.eventDate !== day) return false;
                            if (ev.roomId !== selectedRoomId) return false;
                            if (ev.startTime.slice(0, 2) !== hour.slice(0, 2)) return false;
                            const evUser = users.find((u) => u.name === ev.userName);
                            const inactive = evUser?.status === "DISABLED" || evUser?.status === "DESATIVADO";
                            if (inactive && ev.eventDate > today) return false;
                            return true;
                          });
                          return (
                            <React.Fragment key={`${day}-${hour}`}>
                              <div className="border-b border-r border-gray-100 px-3 py-3 text-sm text-gray-400 bg-white">
                                {hour}
                              </div>
                              <div
                                onClick={() => handleCellClick(day, hour, selectedRoomId)}
                                className="border-b border-gray-100 p-2 min-h-[64px] cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                {cellEvents.map((ev) => EventCard({ ev, compact: false }))}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* FAB */}
                <button
                  onClick={() => setModalOpen(true)}
                  className="fixed bottom-[72px] right-4 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xl flex items-center justify-center text-white text-3xl transition-colors z-40"
                  aria-label="Novo evento"
                >
                  +
                </button>

                {/* Bottom navigation */}
                <div className="shrink-0 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2 z-30">
                  <Link href="/events" className="flex flex-col items-center gap-0.5 px-3 py-1 text-indigo-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs font-medium">Agenda</span>
                  </Link>
                  <Link href="/users" className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-xs">Usuários</span>
                  </Link>
                  <Link href="/sala" className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500">
                    <CouchIcon color="#6b7280" size={24} />
                    <span className="text-xs">Salas</span>
                  </Link>
                  <Link href="/settings" className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" />
                    </svg>
                    <span className="text-xs">Mais</span>
                  </Link>
                </div>
              </div>

              {/* ── DESKTOP LAYOUT ── */}
              <div className="hidden md:flex h-full flex-col px-6 py-5 gap-4">
                <div className="shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900">Agenda de Salas</h1>
                  <p className="text-sm text-gray-500 mt-1">Visualize e gerencie a agenda de uso das salas.</p>
                </div>

                <div className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
                  {FilterControls({ stacked: false })}
                </div>

                <div className="flex-1 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div ref={scrollRef} className="h-full overflow-auto" onScroll={handleScroll}>
                    <div id="eventos" className="grid" style={{ gridTemplateColumns: gridCols }}>
                      <div className="sticky top-0 left-0 z-30 bg-white border-b border-r border-gray-200" />
                      {rooms.map((room, i) => (
                        <div key={room.roomId} className="sticky top-0 z-20 bg-white border-b border-r border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <CouchIcon color={ROOM_COLORS[i % ROOM_COLORS.length]} />
                            {room.name}
                          </div>
                        </div>
                      ))}

                      {days.map((day) => (
                        <React.Fragment key={day}>
                          <div
                            ref={(el) => { if (el) dayRefs.current.set(day, el); else dayRefs.current.delete(day); }}
                            className="px-4 py-2 text-sm font-semibold capitalize text-center text-gray-600 border-t border-gray-200 border-b-2 border-b-gray-300 bg-gray-50"
                            style={{ gridColumn: "1 / -1" }}
                          >
                            {formatDayHeader(day)}
                          </div>

                          {HOURS.map((hour) => (
                            <React.Fragment key={`${day}-${hour}`}>
                              <button
                                onClick={() => setStartTime(hour)}
                                className={`sticky left-0 z-10 border-b border-r border-gray-100 px-3 py-2 text-sm text-left transition-colors hover:bg-indigo-50 ${
                                  startTime === hour ? "bg-indigo-100 font-semibold text-indigo-700" : "bg-white text-gray-400"
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
                                    className="border-b border-r border-gray-100 p-1 min-h-[56px] cursor-pointer hover:bg-gray-50 transition-colors"
                                  >
                                    {cellEvents.map((ev) => EventCard({ ev, compact: true }))}
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          </RequirePermission>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 w-64 h-screen bg-white shadow-lg flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 border-indigo-600 bg-indigo-50 text-indigo-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Agenda
              </Link>
              <Link
                href="/users"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 border-transparent text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Usuários
              </Link>
              <Link
                href="/sala"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 border-transparent text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="4" y="5" width="16" height="7" rx="2" /><rect x="2" y="10" width="4" height="7" rx="2" />
                  <rect x="18" y="10" width="4" height="7" rx="2" /><rect x="4" y="13" width="16" height="4" rx="1" />
                </svg>
                Salas
              </Link>
            </nav>
          </div>
        </div>
      )}

      {modalOpen && (
        <NewEventModal
          initialDate={eventDate}
          initialStart={startTime}
          initialEnd={startTime ? addOneHour(startTime) : ""}
          initialRoomId={selectedRoomId}
          initialUserId={users.find((u) => u.name === selectedUserName)?.userId ?? ""}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); listEvents().then(setAllEvents).catch(console.error); }}
        />
      )}

      {dialog && <AppDialog {...dialog} />}

      {/* Mobile collaborator dropdown — position:fixed below the button, bypasses overflow-hidden */}
      {mobileCollabOpen && mobileCollabPos && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setMobileCollabOpen(false)} />
          <div
            className="fixed z-[70] bg-white border border-gray-200 rounded-xl shadow-xl overflow-auto"
            style={{ top: mobileCollabPos.top, left: mobileCollabPos.left, width: mobileCollabPos.width, maxHeight: 240 }}
          >
            {activeUsers.map((u) => {
              const color = u.color || u.cor || "#94a3b8";
              return (
                <button key={u.userId} type="button"
                  onClick={() => { setSelectedUserName(u.name); setMobileCollabOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${selectedUserName === u.name ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-800"}`}
                >
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  {u.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
