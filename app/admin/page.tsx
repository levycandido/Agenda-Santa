"use client";

import { RequirePermission } from "@/app/auth/RequirePermission";

export default function AdminPage() {
  return (
    <RequirePermission permission="USERS_MANAGE">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Administração</h1>
      </div>
    </RequirePermission>
  );
}