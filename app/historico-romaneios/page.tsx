"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RomaneioGerado } from "@/types/romaneio";

export default function HistoricoRomaneiosPage() {
  const [romaneios, setRomaneios] = useState<RomaneioGerado[]>([]);

  useEffect(() => {
    const romaneiosSalvos = localStorage.getItem("romaneios");

    if (!romaneiosSalvos || romaneiosSalvos === "undefined") return;

    try {
      setRomaneios(JSON.parse(romaneiosSalvos));
    } catch {
      setRomaneios([]);
    }
  }, []);

  function formatarData(dataIso: string) {
    const data = new Date(dataIso);

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function handleExcluirRomaneio(indexParaRemover: number) {
    const confirmou = window.confirm("Deseja realmente excluir este romaneio?");

    if (!confirmou) return;

    const novaLista = romaneios.filter((_, index) => index !== indexParaRemover);
    setRomaneios(novaLista);
    localStorage.setItem("romaneios", JSON.stringify(novaLista));
  }

  return (
    <main>
      <h1>Histórico de Romaneios</h1>
      <p>Aqui ficam os romaneios já gerados.</p>

      {romaneios.length === 0 ? (
        <p>Nenhum romaneio gerado ainda.</p>
      ) : (
        <div>
          {romaneios.map((romaneio, index) => (
            <div key={index}>
              <p>
                <strong>{romaneio.escola}</strong>
              </p>
              <p>{formatarData(romaneio.dataGeracao)}</p>

              <div>
                <Link
                  href={`/historico-romaneios/${index}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir
                </Link>{" "}
                <Link href={`/romaneio?editar=${index}`}>
                  Editar
                </Link>{" "}
                <button
                  type="button"
                  onClick={() => handleExcluirRomaneio(index)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}