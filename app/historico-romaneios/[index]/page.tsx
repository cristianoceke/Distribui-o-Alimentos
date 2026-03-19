"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { RomaneioGerado } from "@/types/romaneio";

export default function RomaneioSalvoPage() {
  const params = useParams();
  const index = Number(Array.isArray(params.index) ? params.index[0] : params.index);

  const [romaneio, setRomaneio] = useState<RomaneioGerado | null>(null);

  useEffect(() => {
    const romaneiosSalvos = localStorage.getItem("romaneios");

    if (!romaneiosSalvos || romaneiosSalvos === "undefined") return;

    try {
      const lista = JSON.parse(romaneiosSalvos) as RomaneioGerado[];
      if (!Number.isNaN(index) && lista[index]) {
        setRomaneio(lista[index]);
      }
    } catch {
      setRomaneio(null);
    }
  }, [index]);

  if (!romaneio) {
    return (
      <main>
        <h1>Romaneio não encontrado</h1>
        <p>Não foi possível localizar esse romaneio.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Romaneio</h1>
      <p>Escola: {romaneio.escola}</p>
      <p>Semana: {romaneio.semana}</p>
      <p>Data de geração: {romaneio.dataGeracao}</p>

      <table>
        <thead>
          <tr>
            <th>Descrição do produto</th>
            <th>Unidade</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {romaneio.itens.map((item, itemIndex) => (
            <tr key={itemIndex}>
              <td>{item.produto}</td>
              <td>{item.unidade}</td>
              <td>{item.quantidade.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={() => window.print()}>
        Imprimir
      </button>
    </main>
  );
}