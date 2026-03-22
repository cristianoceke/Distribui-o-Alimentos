"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type { RomaneioGerado } from "@/types/romaneio";
import styles from "@/app/historico-romaneios/[index]/historico-romaneios.module.css";

export default function RomaneioSalvoPage() {
  const params = useParams();
  const index = Number(
    Array.isArray(params.index) ? params.index[0] : params.index
  );

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

  function formatarData(dataIso: string) {
    const data = new Date(dataIso);

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

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
              <th>QUANT.</th>
              <th>QUANT. FORNEC.</th>
            </tr>
          </thead>
          <tbody>
            {romaneio.itens.map((item, itemIndex) => (
              <tr key={itemIndex}>
                <td>{item.produto}</td>
                <td className={styles.center}>{item.unidade}</td>
                <td className={styles.center}>{item.quantidade.toFixed(2)}</td>
                <td className={styles.center}></td>
              </tr>
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