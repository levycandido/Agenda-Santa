"use client";

import { Permission } from "@/types/User";
import { useAuth } from "@/app/auth/AuthContext";

type Props = {
  permission: Permission | Permission[];
  children: React.ReactNode;
};

export function RequirePermission({ permission, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <p>Você precisa estar logado.</p>;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = permissions.some((p) => user.permissions.includes(p));

  if (!hasAccess) {
    return <p>Acesso negado.</p>;
  }

  return <>{children}</>;
}
