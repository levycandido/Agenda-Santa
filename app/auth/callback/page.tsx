"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CallbackPage() {
  const params = useSearchParams();
  const code = params.get("code");

  const [message, setMessage] = useState("Processando login...");

  useEffect(() => {
    async function exchangeCodeForToken() {
      if (!code) {
        setMessage("Código de autorização não encontrado.");
        return;
      }

      try {
        const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
        const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
        const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;

        const body = new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
        });

        const response = await fetch(`${cognitoDomain}/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });

        const tokens = await response.json();

        if (!response.ok) {
          console.error(tokens);
          setMessage("Erro ao trocar código por tokens.");
          return;
        }

        localStorage.setItem("id_token", tokens.id_token);
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);

        window.location.href = "/events";
      } catch (error) {
        console.error(error);
        setMessage("Erro inesperado no login.");
      }
    }

    exchangeCodeForToken();
  }, [code]);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-4">{message}</p>
    </div>
  );
}