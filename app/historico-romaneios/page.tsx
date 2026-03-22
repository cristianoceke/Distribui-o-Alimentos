"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { RomaneioGerado } from "@/types/romaneio";
import styles from "@/app/historico-romaneios/historico.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";

function hydrateRomaneios() {
  return readStorage<RomaneioGerado[]>("romaneios", []).map((romaneio) => ({
    ...romaneio,
    id: romaneio.id ?? createId("romaneio"),
  }));
}

export default function HistoricoRomaneiosPage() {
  const [romaneios, setRomaneios] = useState<RomaneioGerado[]>(hydrateRomaneios);
  const hydrated = useHydrated();

  useEffect(() => {
    localStorage.setItem("romaneios", JSON.stringify(romaneios));
  }, [romaneios]);

  function formatarData(dataIso: string) {
    const data = new Date(dataIso);

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function handleExcluirRomaneio(romaneioId: string) {
    const confirmou = window.confirm("Deseja realmente excluir este romaneio?");

    if (!confirmou) return;

    const novaLista = romaneios.filter((romaneio) => romaneio.id !== romaneioId);
    setRomaneios(novaLista);
  }

  const totalItens = useMemo(() => {
    return romaneios.reduce((total, romaneio) => total + romaneio.itens.length, 0);
  }, [romaneios]);

  const ultimaData = useMemo(() => {
    if (romaneios.length === 0) return "-";

    const listaOrdenada = [...romaneios].sort(
      (a, b) =>
        new Date(b.dataGeracao).getTime() - new Date(a.dataGeracao).getTime()
    );

    return formatarData(listaOrdenada[0].dataGeracao);
  }, [romaneios]);

  if (!hydrated) {
    return <section className={styles.page} />;
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Consulta e revisão</p>
          <h1 className={styles.title}>Histórico de Romaneios</h1>
          <p className={styles.description}>
            Aqui ficam os romaneios já gerados, permitindo consultar, editar ou
            excluir registros anteriores.
          </p>
        </div>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Romaneios gerados</span>
            <strong className={styles.statValue}>{romaneios.length}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Itens registrados</span>
            <strong className={styles.statValue}>{totalItens}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Última geração</span>
            <strong className={styles.statValueSmall}>{ultimaData}</strong>
          </article>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Romaneios salvos</h2>
            <p className={styles.panelText}>
              Abra o documento, volte para edição ou remova registros que não
              serão mais utilizados.
            </p>
          </div>
        </div>

        {romaneios.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Nenhum romaneio gerado ainda</h3>
            <p>
              Quando você gerar o primeiro romaneio, ele aparecerá aqui para
              consulta e edição futura.
            </p>
          </div>
        ) : (
          <div className={styles.historyList}>
            {romaneios.map((romaneio) => (
              <article key={romaneio.id ?? romaneio.dataGeracao} className={styles.historyCard}>
                <div className={styles.historyCardHeader}>
                  <div>
                    <h3 className={styles.schoolName}>{romaneio.escola}</h3>
                    <p className={styles.metaText}>
                      Semana {romaneio.semana} • {formatarData(romaneio.dataGeracao)}
                    </p>
                  </div>

                  <span className={styles.itemsBadge}>
                    {romaneio.itens.length} item
                    {romaneio.itens.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className={styles.previewList}>
                  {romaneio.itens.slice(0, 4).map((item, itemIndex) => (
                    <div key={itemIndex} className={styles.previewItem}>
                      <span className={styles.previewMain}>{item.produto}</span>
                      <span className={styles.previewSub}>
                        {item.quantidade} {item.unidade} • {item.grupo}
                      </span>
                    </div>
                  ))}

                  {romaneio.itens.length > 4 && (
                    <div className={styles.moreItems}>
                      +{romaneio.itens.length - 4} item(ns) no documento
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <Link
                    href={`/historico-romaneios/${romaneio.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primaryLink}
                  >
                    <Eye size={18} />
                    <span>Abrir</span>
                  </Link>

                  <Link
                    href={`/romaneio?editar=${romaneio.id}`}
                    className={styles.secondaryLink}
                  >
                    <Pencil size={18} />
                    <span>Editar</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleExcluirRomaneio(romaneio.id ?? "")}
                    className={styles.dangerButton}
                  >
                    <Trash2 size={18} />
                    <span>Excluir</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
