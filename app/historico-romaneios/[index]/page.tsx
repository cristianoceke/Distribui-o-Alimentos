"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type { RomaneioGerado } from "@/types/romaneio";
import type { Produto } from "@/types/produto";
import styles from "@/app/historico-romaneios/[index]/historico-romaneios.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";
import {
  findProdutoByName,
  getCategoriaPerCapitaDoGrupo,
  getResumoQuantidade,
} from "@/utils/produtos";
import { formatarAtualizadoPor, formatarCriadoPor } from "@/utils/auditoria";

function hydrateRomaneios() {
  return readStorage<RomaneioGerado[]>("romaneios", []).map((romaneio) => ({
    ...romaneio,
    id: romaneio.id ?? createId("romaneio"),
  }));
}

export default function RomaneioSalvoPage() {
  const params = useParams();
  const romaneioId = Array.isArray(params.index) ? params.index[0] : params.index;
  const hydrated = useHydrated();
  const [produtos] = useState<Produto[]>(() => readStorage<Produto[]>("produtos", []));
  const [romaneio] = useState<RomaneioGerado | null>(() => {
    const lista = hydrateRomaneios();
    return lista.find((item) => item.id === romaneioId) ?? null;
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

  const itensConsolidados = (romaneio?.itens ?? []).reduce<
    Array<{
      produto: string;
      unidade: string;
      quantidadeCreche: number;
      quantidadePreFundIntegralAee: number;
      quantidadeEja: number;
      quantidade: number;
    }>
  >((acc, item) => {
    const existente = acc.find(
      (itemAcc) =>
        itemAcc.produto === item.produto && itemAcc.unidade === item.unidade
    );

    const categoria = getCategoriaPerCapitaDoGrupo(item.grupo);
    const alvo =
      existente ??
      (() => {
        const novoItem = {
          produto: item.produto,
          unidade: item.unidade,
          quantidadeCreche: 0,
          quantidadePreFundIntegralAee: 0,
          quantidadeEja: 0,
          quantidade: 0,
        };

        acc.push(novoItem);
        return novoItem;
      })();

    if (categoria === "creche") {
      alvo.quantidadeCreche += item.quantidade;
    } else if (categoria === "eja") {
      alvo.quantidadeEja += item.quantidade;
    } else {
      alvo.quantidadePreFundIntegralAee += item.quantidade;
    }

    alvo.quantidade =
      alvo.quantidadeCreche +
      alvo.quantidadePreFundIntegralAee +
      alvo.quantidadeEja;

    return acc;
  }, []);

  if (!romaneio) {
    return (
      <main className={styles.page}>
        <div className={styles.notFound}>
          <h1>Romaneio não encontrado</h1>
          <p>Não foi possível localizar esse romaneio.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.actions}>
        <button type="button" onClick={() => window.print()} className={styles.printButton}>
          Imprimir
        </button>
      </div>

      <section className={styles.document}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.mainTitle}>MERENDA ESCOLAR ITAPORANGA</h1>
            <p className={styles.subInfo}>{romaneio.escola}</p>
          </div>

          <div className={styles.headerCenter}>
            <p className={styles.centerText}>Semana {romaneio.semana}</p>
            <p className={styles.centerText}>
              Data: {formatarData(romaneio.dataGeracao)}
            </p>
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
          <div className={styles.schoolBox}>
            <span className={styles.boxLabel}>Unidade Escolar</span>
            <strong className={styles.boxValue}>{romaneio.escola}</strong>
          </div>

          <div className={styles.deliveryBox}>
            <span className={styles.boxLabel}>Entrega prevista</span>
            <strong className={styles.boxValue}>____________</strong>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Semana</span>
            <strong className={styles.metaValue}>{romaneio.semana}</strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Data de geração</span>
            <strong className={styles.metaValue}>
              {formatarData(romaneio.dataGeracao)}
            </strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Criado por</span>
            <strong className={styles.metaValue}>
              {formatarCriadoPor(romaneio) || "Não informado"}
            </strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Última edição por</span>
            <strong className={styles.metaValue}>
              {formatarAtualizadoPor(romaneio) || "Não informado"}
            </strong>
          </div>

          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Período de consumo</span>
            <strong className={styles.metaValue}>________________</strong>
          </div>
        </div>

        <div className={styles.receiptLine}>
          <span>Recebido (nome e assinatura):</span>
          <span className={styles.dotted}></span>
          <span>Data da entrega: ____ / ____ / ________</span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>DESCRIÇÃO PRODUTO</th>
              <th>UNIDADE</th>
              <th>CRECHE</th>
              <th>PRÉ/FUND. INTEGRAL/AEE</th>
              <th>EJA</th>
              <th>TOTAL</th>
              <th>QUANT. FORNEC.</th>
            </tr>
          </thead>
          <tbody>
            {itensConsolidados.map((item, itemIndex) => (
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
                    <td className={styles.center}>{item.quantidadeCreche.toFixed(2)}</td>
                    <td className={styles.center}>
                      {item.quantidadePreFundIntegralAee.toFixed(2)}
                    </td>
                    <td className={styles.center}>{item.quantidadeEja.toFixed(2)}</td>
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
                    <td className={styles.center}></td>
                  </tr>
                );
              })()
            ))}
          </tbody>
        </table>

        <footer className={styles.footer}>
          <div className={styles.signatureBlock}>
            <div className={styles.signatureLine}></div>
            <p>Assinatura / Recebimento</p>
          </div>
        </footer>
      </section>
    </main>
  );
}
