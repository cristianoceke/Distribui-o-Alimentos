"use client";

import { useEffect, useState } from "react";
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

  return (
    <main>
      <h1>Histórico de Romaneios</h1>
      <p>Aqui vamos consultar os romaneios já gerados.</p>

      {romaneios.length === 0 ? (
        <p>Nenhum romaneio gerado ainda.</p>
      ) : (
        <div>
          {romaneios.map((romaneio, index) => (
            <div key={index}>
              <h3>{romaneio.escola}</h3>
              <p>Semana: {romaneio.semana}</p>
              <p>Data de geração: {romaneio.dataGeracao}</p>
              <p>Total de itens: {romaneio.itens.length}</p>

              <h4>Itens do romaneio</h4>
              <ul>
                {romaneio.itens.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    {item.produto} - {item.unidade} - {item.quantidade.toFixed(2)}
                  </li>
                ))}
              </ul>

              <button type="button">Reimprimir</button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}