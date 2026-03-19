"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [menuAberto, setMenuAberto] = useState(false);

  function toggleMenu() {
    setMenuAberto((prev) => !prev);
  }

  function fecharMenu() {
    setMenuAberto(false);
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

            <div className="brand__badge" />

            <div className="brand__text">
              <h1>Sistema de Merenda Escolar</h1>
              <span>Gestão de escolas, cardápios e romaneios</span>
            </div>
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
          <Sidebar onNavigate={fecharMenu} />
        </div>

        <main className="page-content">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}