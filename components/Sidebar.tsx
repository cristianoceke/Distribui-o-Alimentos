"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/", label: "Home" },
  { href: "/romaneio", label: "Romaneio" },
  { href: "/escolas", label: "Escolas" },
  { href: "/cardapios", label: "Cardápios" },
  { href: "/pratos", label: "Pratos" },
  { href: "/produtos", label: "Produtos" },
  { href: "/historico-romaneios", label: "Histórico de Romaneios" },
  { href: "/pedidos-semanais", label: "Pedidos" },
  { href: "/saldos", label: "Saldo" },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`sidebar__link ${
                isActive ? "sidebar__link--active" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}