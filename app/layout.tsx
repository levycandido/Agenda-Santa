import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/auth/AuthContext";

export const metadata: Metadata = {
  title: "Agenda Santa",
  description: "Sistema Agenda Santa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Agenda</title>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}