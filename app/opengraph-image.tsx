import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoBuffer = await readFile(logoPath);
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "56px 72px",
          background:
            "linear-gradient(135deg, rgb(15, 79, 79), rgb(20, 143, 143))",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "620px",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              opacity: 0.86,
              marginBottom: 18,
            }}
          >
            Itaporanga d&apos;Ajuda
          </span>

          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: 18,
            }}
          >
            Sistema de Alimentacao Escolar
          </div>

          <div
            style={{
              fontSize: 30,
              lineHeight: 1.3,
              opacity: 0.92,
            }}
          >
            Gestao de escolas, cardapios, pedidos e romaneios.
          </div>
        </div>

        <div
          style={{
            width: 360,
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 36,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            padding: 28,
          }}
        >
          <img
            src={logoDataUrl}
            alt="Logo do sistema"
            width="300"
            height="200"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
