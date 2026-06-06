import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/auth/AuthContext";

export const metadata: Metadata = {
  title: "Agenda Santa",
  description: "Sistema Agenda Santa",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}