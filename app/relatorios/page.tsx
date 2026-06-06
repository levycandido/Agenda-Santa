"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/app/auth/AuthContext";
import { listEvents, Event } from "@/services/eventService";
import { listRooms, Room } from "@/services/roomService";
import { listUsers, UserSummary } from "@/services/userListService";

type ReportType = "monthly" | "daily";

type EventStatus = "confirmado" | "pendente" | "cancelado";

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getStatusBadge(status: EventStatus) {
  const badges: Record<EventStatus, { bg: string; text: string; label: string }> = {
    confirmado: { bg: "bg-green-100", text: "text-green-700", label: "Confirmado" },
    pendente: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pendente" },
    cancelado: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
  };
  const badge = badges[status];
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>;
}

function getStatusText(status: EventStatus): string {
  const statuses: Record<EventStatus, string> = {
    confirmado: "Confirmado",
    pendente: "Pendente",
    cancelado: "Cancelado",
  };
  return statuses[status];
}

function LineChart({ data }: { data: { day: string; events: number }[] }) {
  const maxEvents = Math.max(...data.map((d) => d.events), 1);
  const width = 600;
  const height = 250;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * innerWidth + padding.left,
    y: height - padding.bottom - (d.events / maxEvents) * innerHeight,
    label: d.day,
    value: d.events,
  }));

  const yGridLines = Array.from({ length: 5 }, (_, i) => ({
    y: height - padding.bottom - (i / 4) * innerHeight,
    value: Math.round((i / 4) * maxEvents),
  }));

  return (
    <div className="flex flex-col gap-4">
      <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {yGridLines.map((line, i) => (
          <line key={i} x1={padding.left} y1={line.y} x2={width - padding.right} y2={line.y} stroke="#e5e7eb" strokeWidth="1" />
        ))}

        {/* Axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#9ca3af" strokeWidth="2" />
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#9ca3af" strokeWidth="2" />

        {/* Y axis labels */}
        {yGridLines.map((line, i) => (
          <text key={i} x={padding.left - 10} y={line.y + 4} textAnchor="end" className="text-xs fill-gray-500">
            {line.value}
          </text>
        ))}

        {/* Line */}
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" />
        ))}

        {/* X axis labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={height - padding.bottom + 20} textAnchor="middle" className="text-xs fill-gray-500">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [monthEnd, setMonthEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const exportPDF = () => {
    const docTitle = `Relatório de Eventos - ${formatDateDisplay(monthStart)} a ${formatDateDisplay(monthEnd)}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${docTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              border-bottom: 2px solid #6366f1;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              color: #1f2937;
              font-size: 24px;
            }
            .header p {
              margin: 0;
              color: #6b7280;
              font-size: 14px;
            }
            .filters {
              background-color: #f3f4f6;
              padding: 12px 15px;
              border-radius: 6px;
              margin-bottom: 20px;
              font-size: 13px;
            }
            .filters strong {
              color: #1f2937;
            }
            .summary {
              display: flex;
              gap: 20px;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .summary-card {
              flex: 1;
              padding: 15px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              text-align: center;
            }
            .summary-card-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .summary-card-value {
              font-size: 28px;
              font-weight: bold;
              color: #6366f1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              page-break-inside: avoid;
            }
            table thead {
              background-color: #f3f4f6;
            }
            table th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              color: #374151;
              border-bottom: 2px solid #d1d5db;
            }
            table td {
              padding: 10px 12px;
              font-size: 13px;
              color: #1f2937;
              border-bottom: 1px solid #e5e7eb;
            }
            table tbody tr:last-child td {
              border-bottom: none;
            }
            .status {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
            }
            .status-confirmado {
              background-color: #dcfce7;
              color: #166534;
            }
            .status-pendente {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-cancelado {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: right;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Eventos</h1>
            <p>Visualize os eventos cadastrados e acompanhe os agendamentos do sistema</p>
          </div>

          <div class="filters">
            <strong>Período:</strong> ${formatDateDisplay(monthStart)} a ${formatDateDisplay(monthEnd)}
            ${selectedRoom !== "all" ? `<br/><strong>Sala:</strong> ${rooms.find((r) => r.roomId === selectedRoom)?.name || selectedRoom}` : ""}
            ${selectedUser !== "all" ? `<br/><strong>Colaborador:</strong> ${selectedUser}` : ""}
          </div>

          <div class="summary">
            <div class="summary-card">
              <div class="summary-card-label">Total de Eventos</div>
              <div class="summary-card-value">${monthlyEvents.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-label">Salas Utilizadas</div>
              <div class="summary-card-value">${new Set(monthlyEvents.map((ev) => ev.roomId)).size}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card-label">Colaboradores</div>
              <div class="summary-card-value">${new Set(monthlyEvents.map((ev) => ev.userName)).size}</div>
            </div>
          </div>

          <h3>Eventos Cadastrados</h3>
          <table>
            <thead>
              <tr>
                <th>Sala</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Descrição</th>
                <th>Colaborador</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                monthlyEvents.length > 0
                  ? monthlyEvents
                      .map(
                        (event) => `
                <tr>
                  <td>${rooms.find((r) => r.roomId === event.roomId)?.name || event.roomId}</td>
                  <td>${formatDateDisplay(event.eventDate)}</td>
                  <td>${event.startTime} – ${event.endTime}</td>
                  <td>${event.description || "—"}</td>
                  <td>${event.userName}</td>
                  <td><span class="status status-${getStatusFromEvent(event)}">${getStatusText(getStatusFromEvent(event))}</span></td>
                </tr>
              `
                      )
                      .join("")
                  : "<tr><td colspan='6' style='text-align: center; color: #9ca3af;'>Nenhum evento encontrado no período</td></tr>"
              }
            </tbody>
          </table>

          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            <p>Sistema Agenda Santa - Igreja Batista Vida Abundante</p>
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open("", "_blank");
    if (newWindow) {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      newWindow.location.href = url;
      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  };

  useEffect(() => {
    if (!user) return;
    listEvents().then(setAllEvents).catch(console.error);
    listRooms().then(setRooms).catch(console.error);
    listUsers().then(setUsers).catch(console.error);
  }, [user?.userId]);

  const getStatusFromEvent = (ev: Event): EventStatus => {
    const eventDateTime = new Date(`${ev.eventDate}T${ev.startTime}`);
    const now = new Date();
    if (eventDateTime < now) return "confirmado";
    return "confirmado";
  };

  const filteredEvents = allEvents.filter((ev) => {
    if (selectedRoom !== "all" && ev.roomId !== selectedRoom) return false;
    if (selectedUser !== "all" && ev.userName !== selectedUser) return false;
    return true;
  });

  const monthlyEvents = filteredEvents.filter((ev) => ev.eventDate >= monthStart && ev.eventDate <= monthEnd);
  const dailyEvents = filteredEvents.filter((ev) => ev.eventDate === selectedDate);

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, 5, 1 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      day: formatDateDisplay(dateStr).split("/").slice(0, 2).join("/"),
      events: filteredEvents.filter((ev) => ev.eventDate === dateStr).length,
    };
  });

  const monthlyStats = {
    totalEvents: monthlyEvents.length,
    roomsUsed: new Set(monthlyEvents.map((ev) => ev.roomId)).size,
    collaborators: new Set(monthlyEvents.map((ev) => ev.userName)).size,
  };

  const dailyStats = {
    totalEvents: dailyEvents.length,
    roomsUsed: new Set(dailyEvents.map((ev) => ev.roomId)).size,
    collaborators: new Set(dailyEvents.map((ev) => ev.userName)).size,
  };

  const stats = reportType === "monthly" ? monthlyStats : dailyStats;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3" />
              <polyline points="12 12 20 7.5" /><polyline points="12 12 12 21" /><polyline points="12 12 4 7.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Eventos</h1>
            <p className="text-sm text-gray-600 mt-1">Visualize os eventos cadastrados e acompanhe os agendamentos do sistema.</p>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          {/* Report Type Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setReportType("monthly")}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                reportType === "monthly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3" />
              </svg>
              Relatório mensal
            </button>
            <button
              onClick={() => setReportType("daily")}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                reportType === "daily"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              Por dia
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Período or Data - First field */}
            {reportType === "monthly" ? (
              <div className="w-full md:flex-1 flex flex-col">
                <label className="block text-xs font-medium text-gray-500 mb-2">Período</label>
                <div className="flex flex-col md:flex-row gap-2 items-center">
                  <input
                    type="date"
                    value={monthStart}
                    onChange={(e) => setMonthStart(e.target.value)}
                    className="w-full md:flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="hidden md:block text-gray-400 text-sm">–</span>
                  <input
                    type="date"
                    value={monthEnd}
                    onChange={(e) => setMonthEnd(e.target.value)}
                    className="w-full md:flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full md:flex-1 flex flex-col">
                <label className="block text-xs font-medium text-gray-500 mb-2">Data</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Sala - Second field */}
            <div className="w-full md:flex-1 flex flex-col">
              <label className="block text-xs font-medium text-gray-500 mb-2">Sala</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas as salas</option>
                {rooms.map((room) => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Colaborador - Third field */}
            <div className="w-full md:flex-1 flex flex-col">
              <label className="block text-xs font-medium text-gray-500 mb-2">Colaborador</label>
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-full flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left h-full"
                >
                  {selectedUser !== "all" ? (
                    <>
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: users.find((u) => u.name === selectedUser)?.color || users.find((u) => u.name === selectedUser)?.cor || "#6366f1" }}
                      />
                      <span className="text-gray-800 truncate flex-1">{selectedUser}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Todos os colaboradores</span>
                  )}
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-auto" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {userDropdownOpen && (
                  <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-full py-1 max-h-60 overflow-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser("all");
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
                    >
                      Todos os colaboradores
                    </button>
                    {users.map((u) => {
                      const color = u.color || u.cor || "#6366f1";
                      return (
                        <button
                          key={u.userId}
                          type="button"
                          onClick={() => {
                            setSelectedUser(u.name);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                            selectedUser === u.name ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-800"
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {u.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Button - Fourth field */}
            {reportType === "monthly" && (
              <button
                onClick={exportPDF}
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 h-[42px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar PDF
              </button>
            )}

            {reportType === "daily" && (
              <button className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all h-[42px]">
                Filtrar
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {reportType === "monthly" ? (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total de eventos</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalEvents}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Salas utilizadas</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.roomsUsed}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 21h18" />
                      <rect x="5" y="3" width="14" height="18" rx="1" />
                      <circle cx="15" cy="12" r="1" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Colaboradores</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.collaborators}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Eventos do dia</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalEvents}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Salas utilizadas</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.roomsUsed}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 21h18" />
                      <rect x="5" y="3" width="14" height="18" rx="1" />
                      <circle cx="15" cy="12" r="1" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Colaboradores envolvidos</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.collaborators}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Events Table */}
        {reportType === "monthly" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Eventos cadastrados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Sala</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Horário</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Colaborador</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyEvents.length > 0 ? (
                    monthlyEvents.map((event, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{rooms.find((r) => r.roomId === event.roomId)?.name || event.roomId}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDateDisplay(event.eventDate)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {event.startTime} – {event.endTime}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{event.description || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{event.userName}</td>
                        <td className="px-4 py-3">{getStatusBadge(getStatusFromEvent(event))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nenhum evento encontrado no período selecionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === "daily" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Eventos do dia</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Sala</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Horário</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Colaborador</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyEvents.length > 0 ? (
                    dailyEvents.map((event, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{rooms.find((r) => r.roomId === event.roomId)?.name || event.roomId}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {event.startTime} – {event.endTime}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{event.description || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{event.userName}</td>
                        <td className="px-4 py-3">{getStatusBadge(getStatusFromEvent(event))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Nenhum evento neste dia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Eventos por dia</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Gráfico de linhas
            </button>
          </div>
          <div className="overflow-x-auto">
            <LineChart data={chartData} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
