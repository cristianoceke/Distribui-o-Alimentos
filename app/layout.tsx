import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const resolvedAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const ogImageUrl = new URL("/opengraph-image", resolvedAppUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(resolvedAppUrl),
  title: "Sistema de Alimentação Escolar",
  description: "Gestão de escolas, preparações, cardápios e romaneio",
  openGraph: {
    title: "Sistema de Alimentação Escolar",
    description: "Gestão de escolas, preparações, cardápios e romaneio",
    url: resolvedAppUrl,
    siteName: "Sistema de Alimentação Escolar",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Logo do Sistema de Alimentação Escolar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Alimentação Escolar",
    description: "Gestão de escolas, preparações, cardápios e romaneio",
    images: [ogImageUrl],
  },
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
