"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { clearSessaoUsuario, readSessaoUsuario } from "@/utils/auth";
import { usePathname, useRouter } from "next/navigation";
import { useHydrated } from "@/utils/storage";

type AppShellProps = {
  children: React.ReactNode;
};

const CIDADE_SISTEMA = "Itaporanga d'Ajuda";

export default function AppShell({ children }: AppShellProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pageContentRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const sessao = hydrated ? readSessaoUsuario() : null;

  function toggleMenu() {
    setMenuAberto((prev) => !prev);
  }

  function fecharMenu() {
    setMenuAberto(false);
  }

  function handleLogout() {
    clearSessaoUsuario();
    setMenuAberto(false);
    router.push("/login");
  }

  useEffect(() => {
    if (!hydrated) return;

    const estaNaTelaLogin = pathname === "/login";

    if (!sessao && !estaNaTelaLogin) {
      router.push("/login");
      return;
    }

    if (sessao && estaNaTelaLogin) {
      router.push("/");
      return;
    }
  }, [hydrated, pathname, router, sessao]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const estaNaTelaLogin = pathname === "/login";
    document.body.style.overflow = estaNaTelaLogin ? "auto" : "hidden";
    document.documentElement.style.overflow = estaNaTelaLogin ? "auto" : "hidden";

    return () => {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    requestAnimationFrame(() => {
      pageContentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [pathname]);

  if (!hydrated) {
    return null;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__content">
          <div className="brand">
            <button
              type="button"
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <div className="brand__badge">
              <Image
                src="/logo.png"
                alt="Lunutrix"
                width={1536}
                height={1024}
                className="brand__logoImage"
                unoptimized
                priority
              />
            </div>

            <div className="brand__text">
              <h1>Sistema de Alimentação Escolar</h1>
              <span>Gestão de escolas, cardápios e romaneios</span>
            </div>
          </div>

          <div className="topbar__municipio">
            <span className="topbar__municipioName">{CIDADE_SISTEMA}</span>
            <Image
              src="/BRASAO-PMI1.png"
              alt="Brasão do município"
              width={62}
              height={62}
              className="topbar__municipioLogo"
              unoptimized
            />
          </div>
        </div>
      </header>

      <div className="app-body">
        {menuAberto && (
          <button
            type="button"
            className="sidebar-backdrop"
            onClick={fecharMenu}
            aria-label="Fechar menu"
          />
        )}

        <div
          className={`sidebar-wrapper ${
            menuAberto ? "sidebar-wrapper--open" : ""
          }`}
        >
          <Sidebar
            onNavigate={fecharMenu}
            onLogout={handleLogout}
            sessaoUsuario={sessao}
          />
        </div>

        <main ref={pageContentRef} className="page-content">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
