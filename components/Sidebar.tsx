"use client";

import Link from "next/link";
import {
  ClipboardList,
  FileSpreadsheet,
  History,
  Home,
  LogOut,
  Package,
  School2,
  ScrollText,
  Soup,
  UserRound,
  WalletCards,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { SessaoUsuario } from "@/types/auth";

const menuItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/romaneio", label: "Romaneio", icon: ScrollText },
  { href: "/historico-romaneios", label: "Histórico de Romaneios", icon: History },
  { href: "/pedidos-semanais", label: "Pedidos", icon: ClipboardList },
  { href: "/escolas", label: "Escolas", icon: School2 },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/pratos", label: "Pratos", icon: Soup },
  { href: "/cardapios", label: "Cardápios", icon: FileSpreadsheet },
  { href: "/saldos", label: "Saldo", icon: WalletCards },
];

type SidebarProps = {
  onNavigate?: () => void;
  onLogout?: () => void;
  sessaoUsuario?: SessaoUsuario | null;
};

export default function Sidebar({
  onNavigate,
  onLogout,
  sessaoUsuario,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`sidebar__link ${
                isActive ? "sidebar__link--active" : ""
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {(sessaoUsuario || onLogout) && (
        <div className="sidebar__footer">
          {sessaoUsuario && (
            <div className="sidebar__userCard">
              <div className="sidebar__userIcon">
                <UserRound size={18} />
              </div>

              <div className="sidebar__userInfo">
                <strong>{sessaoUsuario.nome}</strong>
                <span>{sessaoUsuario.cargo || sessaoUsuario.email}</span>
              </div>
            </div>
          )}

          {onLogout && (
            <button type="button" onClick={onLogout} className="sidebar__logout">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
