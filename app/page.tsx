"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/auth/AuthContext";

const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;

function loginWithProvider(provider: string) {
  const loginUrl =
    `${COGNITO_DOMAIN}/oauth2/authorize` +
    `?identity_provider=${provider}` +
    `&response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=openid+email+profile`;

  window.location.href = loginUrl;
}

const providers = [
  {
    id: "Google",
    label: "Entrar com Google",
    bg: "bg-[#DB4437] hover:bg-[#c53929]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: "Facebook",
    label: "Entrar com Facebook",
    bg: "bg-[#3b5998] hover:bg-[#2d4373]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "Twitter",
    label: "Entrar com Twitter",
    bg: "bg-[#1DA1F2] hover:bg-[#0d8bd9]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.917 9.917 0 01-3.127 1.195 4.929 4.929 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.9 4.9 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417a9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
      </svg>
    ),
  },
  {
    id: "Github",
    label: "Entrar com GitHub",
    bg: "bg-[#24292e] hover:bg-[#1b1f23]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/events");
    }
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div className="flex min-h-screen items-end lg:items-center justify-center p-0 lg:p-8 relative overflow-hidden">
      {/* Fundo da página de login */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/fundo-login.png"
          alt="Fundo login"
          fill
          className="object-cover"
          quality={90}
          priority
        />
        {/* Overlay com imagem da Igreja no mobile */}
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="/images/igreja.png"
            alt="Igreja Batista Vida Abundante"
            fill
            className="object-cover opacity-60"
            quality={90}
          />
          {/* Overlay gradiente no mobile */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-600/30 to-purple-700/70" />
        </div>
      </div>

      {/* Ícone da Igreja no topo (Mobile) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 lg:hidden">
        <svg viewBox="0 0 100 120" className="w-16 h-16" fill="none">
          <circle cx="50" cy="30" r="15" fill="white" />
          <circle cx="35" cy="20" r="10" fill="white" />
          <circle cx="50" cy="10" r="12" fill="white" />
          <circle cx="65" cy="20" r="10" fill="white" />
          <path d="M 20 50 L 50 30 L 80 50" stroke="white" strokeWidth="3" fill="none" />
          <rect x="25" y="50" width="50" height="45" stroke="white" strokeWidth="3" fill="none" />
        </svg>
      </div>

      {/* Card de login */}
      <div className="flex w-full lg:max-w-5xl shadow-2xl rounded-t-3xl lg:rounded-3xl overflow-hidden relative z-10 lg:bg-white">
        {/* Coluna esquerda - Desktop only */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-indigo-600 via-purple-600 to-purple-700 flex-col items-center justify-between p-12 relative overflow-hidden">
          {/* Imagem de fundo da Igreja */}
          <div className="absolute inset-0">
            <Image
              src="/images/igreja.png"
              alt="Igreja Batista Vida Abundante"
              fill
              className="object-cover"
              quality={90}
              priority
            />
            {/* Overlay semi-transparente */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/40 via-purple-600/60 to-purple-700/80" />
          </div>

          {/* Ícone da Igreja no topo */}
          <div className="relative z-10 mt-8">
            <svg viewBox="0 0 100 120" className="w-20 h-20" fill="none">
              <circle cx="50" cy="30" r="15" fill="white" />
              <circle cx="35" cy="20" r="10" fill="white" />
              <circle cx="50" cy="10" r="12" fill="white" />
              <circle cx="65" cy="20" r="10" fill="white" />
              <path d="M 20 50 L 50 30 L 80 50" stroke="white" strokeWidth="3" fill="none" />
              <rect x="25" y="50" width="50" height="45" stroke="white" strokeWidth="3" fill="none" />
            </svg>
          </div>

          {/* Citação no rodapé */}
          <blockquote className="relative z-10 text-center mb-12">
            <p className="text-white text-lg font-medium leading-relaxed">Portanto, ide, ensinai todas as nações</p>
            <p className="text-white text-lg font-medium leading-relaxed">batizando-as em nome do Pai, e do Filho, e do Espírito Santo.</p>
            <footer className="mt-4 text-sm text-indigo-100">Mateus 28:19</footer>
          </blockquote>
        </div>

        {/* Coluna direita - Card de login */}
        <div className="w-full lg:w-1/2 flex flex-col justify-start lg:justify-center items-center p-6 lg:p-12 bg-white lg:bg-white">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8 mt-8 lg:mt-0">
              <h1 className="text-4xl font-bold text-slate-900">Agenda Santa</h1>
              <p className="text-lg text-indigo-600 mt-2 font-medium">Igreja Batista Vida Abundante</p>

              {/* Decoração de coração */}
              <div className="flex items-center justify-center gap-3 my-8">
                <div className="flex-1 h-px bg-slate-300" />
                <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <div className="flex-1 h-px bg-slate-300" />
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-center text-slate-600 text-sm mb-8 font-medium">Acesse sua conta para continuar</p>

            {/* Login buttons */}
            <div className="space-y-4">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loginWithProvider(p.id)}
                  className={`w-full flex items-center justify-center gap-4 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all hover:shadow-lg ${p.bg}`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 mb-6">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Seus dados estão protegidos conosco.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
