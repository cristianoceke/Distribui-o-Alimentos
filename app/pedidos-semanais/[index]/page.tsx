"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { PedidoSemanalGerado } from "@/types/pedido-semanal";

export default function PedidoSemanalSalvoPage() {
  const params = useParams();
  const index = Number(Array.isArray(params.index) ? params.index[0] : params.index);

  const [pedido, setPedido] = useState<PedidoSemanalGerado | null>(null);

  useEffect(() => {
    const pedidosSalvos = localStorage.getItem("pedidos-semanais");

    if (!pedidosSalvos || pedidosSalvos === "undefined") return;

    try {
      const lista = JSON.parse(pedidosSalvos) as PedidoSemanalGerado[];

      if (!Number.isNaN(index) && lista[index]) {
        setPedido(lista[index]);
      }
    } catch {
      setPedido(null);
    }
  }, [index]);

  function formatarData(dataIso: string) {
    const data = new Date(dataIso);

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (!pedido) {
    return (
      <main>
        <h1>Pedido não encontrado</h1>
        <p>Não foi possível localizar esse pedido.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <button type="button" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>

      <div style={{ border: "1px solid #000", padding: "16px" }}>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h1 style={{ margin: 0 }}>PEDIDO SEMANAL</h1>
          <h2 style={{ margin: "8px 0 0 0" }}>REDE MUNICIPAL</h2>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p><strong>Grupo:</strong> {pedido.grupo}</p>
          <p><strong>Semana:</strong> {pedido.semana}</p>
          <p><strong>Data de geração:</strong> {formatarData(pedido.dataGeracao)}</p>
          <p><strong>Total de alunos:</strong> {pedido.totalAlunos}</p>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "16px",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: "8px" }}>
                PRODUTO
              </th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>
                UNIDADE
              </th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>
                QUANTIDADE
              </th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item, itemIndex) => (
              <tr key={itemIndex}>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {item.produto}
                </td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                  {item.unidade}
                </td>
                <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                  {item.quantidade.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}