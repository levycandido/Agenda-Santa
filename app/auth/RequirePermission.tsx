"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Permission } from "@/types/User";
import { useAuth } from "@/app/auth/AuthContext";

type Props = {
  permission: Permission | Permission[];
  children: React.ReactNode;
};

export function RequirePermission({ permission, children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = permissions.some((p) => user.permissions.includes(p));

  if (!hasAccess) {
    return <p>Acesso negado.</p>;
  }

  return <>{children}</>;
}
