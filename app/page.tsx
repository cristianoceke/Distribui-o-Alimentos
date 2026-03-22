"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  School2,
  ChefHat,
  CalendarDays,
  Apple,
  UtensilsCrossed,
  ClipboardList,
  Package,
  Pencil,
  ExternalLink,
} from "lucide-react";

import type { Escola } from "@/types/escola";
import type { Produto } from "@/types/produto";
import type { Preparacao } from "@/types/preparacao";
import type { Cardapio } from "@/types/cardapio";
import type { RomaneioGerado } from "@/types/romaneio";
import { readStorage, useHydrated } from "@/utils/storage";

type RefeicaoDia = {
  refeicao: string;
  preparacoes: string[];
};

type DiaResumo = {
  dia: string;
  chave: string;
  refeicoes: RefeicaoDia[];
};

const diasOrdem = [
  { label: "Segunda-feira", chave: "segunda" },
  { label: "Terça-feira", chave: "terca" },
  { label: "Quarta-feira", chave: "quarta" },
  { label: "Quinta-feira", chave: "quinta" },
  { label: "Sexta-feira", chave: "sexta" },
];

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/-feira/g, "")
    .replace(/feira/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizarDia(dia: string) {
  const valor = normalizarTexto(dia);

  if (valor.includes("segunda")) return "segunda";
  if (valor.includes("terca")) return "terca";
  if (valor.includes("quarta")) return "quarta";
  if (valor.includes("quinta")) return "quinta";
  if (valor.includes("sexta")) return "sexta";

  return valor;
}

export default function Home() {
  const [escolas] = useState<Escola[]>(() => readStorage<Escola[]>("escolas", []));
  const [produtos] = useState<Produto[]>(() => readStorage<Produto[]>("produtos", []));
  const [preparacoes] = useState<Preparacao[]>(() =>
    readStorage<Preparacao[]>("preparacoes", [])
  );
  const [cardapios] = useState<Cardapio[]>(() =>
    readStorage<Cardapio[]>("cardapios", [])
  );
  const [romaneios] = useState<RomaneioGerado[]>(() =>
    readStorage<RomaneioGerado[]>("romaneios", [])
  );
  const [diaAtivo, setDiaAtivo] = useState("segunda");
  const [grupoSelecionado, setGrupoSelecionado] = useState(() => {
    const grupos = [
      ...new Set(readStorage<Cardapio[]>("cardapios", []).map((item) => item.grupo)),
    ];
    return grupos[0] || "";
  });
  const hydrated = useHydrated();

  const totalGrupos = useMemo(() => {
    return escolas.reduce((total, escola) => total + escola.grupos.length, 0);
  }, [escolas]);

  const gruposDisponiveis = useMemo(() => {
    return [...new Set(cardapios.map((item) => item.grupo))];
  }, [cardapios]);

  const semanaAtual = useMemo(() => {
    const semanas = [...new Set(cardapios.map((item) => item.semana))];
    return semanas[0] || "";
  }, [cardapios]);

  const resumoSemana = useMemo<DiaResumo[]>(() => {
    const base = cardapios.filter((item) => {
      const bateSemana = semanaAtual ? item.semana === semanaAtual : true;
      const bateGrupo = grupoSelecionado ? item.grupo === grupoSelecionado : true;
      return bateSemana && bateGrupo;
    });

    return diasOrdem.map(({ label, chave }) => {
      const itensDoDia = base.flatMap((grupo) =>
        grupo.itens.filter((item) => normalizarDia(item.dia) === chave)
      );

      const mapa = new Map<string, string[]>();

      itensDoDia.forEach((item) => {
        const listaAtual = mapa.get(item.refeicao) || [];

        if (!listaAtual.includes(item.preparacao)) {
          listaAtual.push(item.preparacao);
        }

        mapa.set(item.refeicao, listaAtual);
      });

      const refeicoes: RefeicaoDia[] = Array.from(mapa.entries()).map(
        ([refeicao, preparacoes]) => ({
          refeicao,
          preparacoes,
        })
      );

      return {
        dia: label,
        chave,
        refeicoes,
      };
    });
  }, [cardapios, semanaAtual, grupoSelecionado]);

  const diaSelecionado = resumoSemana.find((item) => item.chave === diaAtivo);

  const resumoRomaneio = useMemo(() => {
    const ultimoRomaneio = [...romaneios].sort(
      (a, b) =>
        new Date(b.dataGeracao).getTime() - new Date(a.dataGeracao).getTime()
    )[0];

    if (!ultimoRomaneio) return [];

    const mapa = new Map<
      string,
      {
        produto: string;
        unidade: string;
        quantidade: number;
      }
    >();

    ultimoRomaneio.itens.forEach((item) => {
      const chave = `${item.produto}-${item.unidade}`;
      const existente = mapa.get(chave);

      if (existente) {
        existente.quantidade += item.quantidade;
      } else {
        mapa.set(chave, {
          produto: item.produto,
          unidade: item.unidade,
          quantidade: item.quantidade,
        });
      }
    });

    return Array.from(mapa.values()).slice(0, 6);
  }, [romaneios]);

  function formatarQuantidade(valor: number) {
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  if (!hydrated) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <section className={styles.topCards}>
        <article className={styles.summaryCard}>
          <div className={`${styles.summaryIconWrap} ${styles.iconSchool}`}>
            <School2 size={34} strokeWidth={2.1} />
          </div>

          <div className={styles.summaryContent}>
            <p className={styles.summaryTitle}>Escolas Cadastradas</p>
            <strong className={styles.summaryValue}>{escolas.length} Escolas</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <div className={`${styles.summaryIconWrap} ${styles.iconChef}`}>
            <ChefHat size={34} strokeWidth={2.1} />
          </div>

          <div className={styles.summaryContent}>
            <p className={styles.summaryTitle}>Preparações Cadastradas</p>
            <strong className={styles.summaryValue}>
              {preparacoes.length} Receitas
            </strong>
          </div>
        </article>

        <article className={styles.summaryCardLarge}>
          <div className={styles.largeCardLeft}>
            <div className={`${styles.summaryIconWrap} ${styles.iconCalendar}`}>
              <CalendarDays size={34} strokeWidth={2.1} />
            </div>

            <div className={styles.summaryContent}>
              <p className={styles.summaryTitle}>Cardápio Semanal</p>
              <strong className={styles.summaryValue}>{totalGrupos} Grupos</strong>
            </div>
          </div>

          <Link href="/romaneio" className={styles.primaryButton}>
            Criar Romaneio
          </Link>
        </article>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <article className={styles.panel}>
            <div className={styles.sectionTitle}>
              <div>
                <h2>Cardápio da Semana</h2>
                <p>{semanaAtual ? `Semana ${semanaAtual}` : "Sem cardápio cadastrado"}</p>
              </div>

              <div className={styles.filtersRow}>
                <label className={styles.selectLabel}>
                  <span>Grupo</span>
                  <select
                    value={grupoSelecionado}
                    onChange={(e) => setGrupoSelecionado(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Selecione</option>
                    {gruposDisponiveis.map((grupo) => (
                      <option key={grupo} value={grupo}>
                        {grupo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className={styles.tabs}>
              {diasOrdem.map((dia) => (
                <button
                  key={dia.chave}
                  type="button"
                  className={`${styles.tab} ${
                    diaAtivo === dia.chave ? styles.tabActive : ""
                  }`}
                  onClick={() => setDiaAtivo(dia.chave)}
                >
                  {dia.label}
                </button>
              ))}
            </div>

            <div className={styles.refeicoesGrid}>
              {diaSelecionado?.refeicoes.length ? (
                diaSelecionado.refeicoes.map((refeicao) => (
                  <div key={refeicao.refeicao} className={styles.mealCard}>
                    <div className={styles.mealHeader}>
                      <div className={styles.mealHeaderIcon}>
                        {refeicao.refeicao.toLowerCase().includes("lanche") ? (
                          <Apple size={22} strokeWidth={2.2} />
                        ) : (
                          <UtensilsCrossed size={22} strokeWidth={2.2} />
                        )}
                      </div>

                      <strong>Refeição: {refeicao.refeicao}</strong>
                    </div>

                    <ul className={styles.mealList}>
                      {refeicao.preparacoes.map((preparacao) => (
                        <li key={preparacao}>
                          <span className={styles.bullet}>•</span>
                          <span className={styles.mealText}>{preparacao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className={styles.emptyBox}>
                  Nenhum item cadastrado para este dia e grupo.
                </div>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelTableHeader}>
              <h2>Preparações Cadastradas</h2>
            </div>

            {preparacoes.length === 0 ? (
              <div className={styles.emptyBox}>Nenhuma preparação cadastrada.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Ingredientes</th>
                      <th className={styles.alignRight}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparacoes.slice(0, 6).map((item, index) => (
                      <tr key={`${item.nome}-${index}`}>
                        <td>{item.nome}</td>
                        <td>{item.ingredientes.length}</td>
                        <td className={styles.alignRight}>
                          <div className={styles.tableActions}>
                            <Link href="/pratos" className={styles.actionButton}>
                              <Pencil size={15} strokeWidth={2.2} />
                              <span>Editar</span>
                            </Link>

                            <Link href="/pratos" className={styles.iconOnlyButton}>
                              <ExternalLink size={15} strokeWidth={2.2} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <div className={styles.rightColumn}>
          <article className={styles.panel}>
            <div className={styles.panelTableHeader}>
              <h2>Resumo do Romaneio</h2>
            </div>

            {resumoRomaneio.length === 0 ? (
              <div className={styles.emptyBox}>Nenhum romaneio gerado ainda.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Unidade</th>
                      <th>Quantidade Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoRomaneio.map((item) => (
                      <tr key={`${item.produto}-${item.unidade}`}>
                        <td>{item.produto}</td>
                        <td>{item.unidade}</td>
                        <td>{formatarQuantidade(item.quantidade)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className={styles.miniStatsPanel}>
            <div className={styles.miniStatItem}>
              <div className={styles.miniStatIcon}>
                <ClipboardList size={18} />
              </div>
              <div>
                <span>Cardápios</span>
                <strong>{cardapios.length}</strong>
              </div>
            </div>

            <div className={styles.miniStatItem}>
              <div className={styles.miniStatIcon}>
                <Package size={18} />
              </div>
              <div>
                <span>Produtos</span>
                <strong>{produtos.length}</strong>
              </div>
            </div>

            <div className={styles.miniStatItem}>
              <div className={styles.miniStatIcon}>
                <School2 size={18} />
              </div>
              <div>
                <span>Grupos</span>
                <strong>{totalGrupos}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
