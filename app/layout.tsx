import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Merenda Escolar",
  description: "Gestão de escolas, preparações, cardápios e romaneio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar__content">
              <div className="brand">
                <div className="brand__badge" />
                <div className="brand__text">
                  <h1>Sistema de Merenda Escolar</h1>
                  <span>Gestão de escolas, cardápios e romaneios</span>
                </div>
              </div>
            </div>
          </header>

          <div className="app-body">
            <Sidebar />
            <main className="page-content">
              <div className="page-container">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}