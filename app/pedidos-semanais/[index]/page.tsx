"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type { PedidoSemanalGerado } from "@/types/pedido-semanal";
import type { Produto } from "@/types/produto";
import styles from "@/app/pedidos-semanais/[index]/pedidos-semanais.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";
import { findProdutoByName, getResumoQuantidade } from "@/utils/produtos";
import { formatarAtualizadoPor, formatarCriadoPor } from "@/utils/auditoria";

function hydratePedidos() {
  return readStorage<PedidoSemanalGerado[]>("pedidos-semanais", []).map(
    (pedido) => ({
      ...pedido,
      id: pedido.id ?? createId("pedido"),
    })
  );
}

export default function PedidoSemanalSalvoPage() {
  const params = useParams();
  const pedidoId = Array.isArray(params.index) ? params.index[0] : params.index;
  const hydrated = useHydrated();
  const [produtos] = useState<Produto[]>(() => readStorage<Produto[]>("produtos", []));
  const [pedido] = useState<PedidoSemanalGerado | null>(() => {
    const lista = hydratePedidos();
    return lista.find((item) => item.id === pedidoId) ?? null;
  });

  if (!hydrated) {
    return <main className={styles.page} />;
  }

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
      <main className={styles.page}>
        <div className={styles.notFound}>
          <h1>Pedido não encontrado</h1>
          <p>Não foi possível localizar esse pedido.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => window.print()}
          className={styles.printButton}
        >
          Imprimir
        </button>
      </div>

      <section className={styles.document}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.mainTitle}>MERENDA ESCOLAR ITAPORANGA</h1>
            <p className={styles.subInfo}>PEDIDO SEMANAL DA REDE MUNICIPAL</p>
          </div>

          <div className={styles.headerCenter}>
            <p className={styles.centerText}>Grupo: {pedido.grupo}</p>
            <p className={styles.centerText}>Semana {pedido.semana}</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.logoWrapper}>
              <Image
                src="/BRASÃO-PMI1.png"
                alt="Brasão da Prefeitura de Itaporanga d'Ajuda"
                width={88}
                height={88}
                className={styles.logo}
                priority
              />
            </div>

            <div className={styles.orgText}>
              <p>PREFEITURA MUNICIPAL DE ITAPORANGA D&apos;AJUDA</p>
              <p>SECRETARIA MUNICIPAL DE EDUCAÇÃO</p>
              <p>DEPARTAMENTO DE NUTRIÇÃO E ALIMENTAÇÃO ESCOLAR</p>
            </div>
          </div>
        </header>

        <div className={styles.highlightRow}>
          <div className={styles.groupBox}>
            <span className={styles.boxLabel}>Grupo</span>
            <strong className={styles.boxValue}>{pedido.grupo}</strong>
          </div>

          <div className={styles.weekBox}>
            <span className={styles.boxLabel}>Semana</span>
            <strong className={styles.boxValue}>{pedido.semana}</strong>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Data de geração</span>
            <strong className={styles.metaValue}>
              {formatarData(pedido.dataGeracao)}
            </strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Total de alunos</span>
            <strong className={styles.metaValue}>{pedido.totalAlunos}</strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Referência</span>
            <strong className={styles.metaValue}>Pedido semanal</strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Criado por</span>
            <strong className={styles.metaValue}>
              {formatarCriadoPor(pedido) || "Não informado"}
            </strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Última edição por</span>
            <strong className={styles.metaValue}>
              {formatarAtualizadoPor(pedido) || "Não informado"}
            </strong>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>PRODUTO</th>
              <th>UNIDADE</th>
              <th>QUANTIDADE</th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item, itemIndex) => (
              (() => {
                const resumoQuantidade = getResumoQuantidade(
                  findProdutoByName(produtos, item.produto),
                  item.quantidade,
                  item.unidade
                );

                return (
                  <tr key={itemIndex}>
                    <td>{item.produto}</td>
                    <td className={styles.center}>{item.unidade}</td>
                    <td className={styles.center}>
                      <div>
                        <strong>{resumoQuantidade.base}</strong>
                        {resumoQuantidade.compra && (
                          <>
                            <br />
                            <small>Separar: {resumoQuantidade.compra}</small>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })()
            ))}
          </tbody>
        </table>

        <footer className={styles.footer}>
          <div className={styles.signatureGrid}>
            <div className={styles.signatureBlock}>
              <div className={styles.signatureLine}></div>
              <p>Responsável pela emissão</p>
            </div>

            <div className={styles.signatureBlock}>
              <div className={styles.signatureLine}></div>
              <p>Recebimento / Conferência</p>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
