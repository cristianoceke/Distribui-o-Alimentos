"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Escola } from "@/types/escola";
import type { Cardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import type { RomaneioGerado } from "@/types/romaneio";
import type { SaldoLicitado } from "@/types/saldo";
import styles from "./romaneio.module.css";

type ItemCalculado = {
  produto: string;
  unidade: string;
  quantidade: number;
  grupo: string;
};

type ItemAjustado = ItemCalculado & {
  ativo: boolean;
};

export default function RomaneioPage() {
  const searchParams = useSearchParams();
  const editarParam = searchParams.get("editar");

  const semanas = ["1", "2", "3", "4"];

  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolaSelecionada, setEscolaSelecionada] = useState("");
  const [semana, setSemana] = useState("");

  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);
  const [saldos, setSaldos] = useState<SaldoLicitado[]>([]);

  const [itensAjustados, setItensAjustados] = useState<ItemAjustado[]>([]);
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);
  const [carregouEdicao, setCarregouEdicao] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    const escolasSalvas = localStorage.getItem("escolas");
    if (escolasSalvas && escolasSalvas !== "undefined") {
      try {
        setEscolas(JSON.parse(escolasSalvas));
      } catch {
        setEscolas([]);
      }
    }

    const cardapiosSalvos = localStorage.getItem("cardapios");
    if (cardapiosSalvos && cardapiosSalvos !== "undefined") {
      try {
        setCardapios(JSON.parse(cardapiosSalvos));
      } catch {
        setCardapios([]);
      }
    }

    const preparacoesSalvas = localStorage.getItem("preparacoes");
    if (preparacoesSalvas && preparacoesSalvas !== "undefined") {
      try {
        setPreparacoes(JSON.parse(preparacoesSalvas));
      } catch {
        setPreparacoes([]);
      }
    }

    const saldosSalvos = localStorage.getItem("saldos");
    if (saldosSalvos && saldosSalvos !== "undefined") {
      try {
        setSaldos(JSON.parse(saldosSalvos));
      } catch {
        setSaldos([]);
      }
    }
  }, []);

  useEffect(() => {
    if (editarParam === null) {
      setCarregouEdicao(true);
      return;
    }

    const indice = Number(editarParam);

    if (Number.isNaN(indice)) {
      setCarregouEdicao(true);
      return;
    }

    const romaneiosSalvos = localStorage.getItem("romaneios");

    if (!romaneiosSalvos || romaneiosSalvos === "undefined") {
      setCarregouEdicao(true);
      return;
    }

    try {
      const lista = JSON.parse(romaneiosSalvos) as RomaneioGerado[];
      const romaneio = lista[indice];

      if (!romaneio) {
        setCarregouEdicao(true);
        return;
      }

      setEscolaSelecionada(romaneio.escola);
      setSemana(romaneio.semana);
      setItensAjustados(
        romaneio.itens.map((item) => ({
          ...item,
          ativo: true,
        }))
      );
      setIndiceEditando(indice);
    } catch {
      setIndiceEditando(null);
    } finally {
      setCarregouEdicao(true);
    }
  }, [editarParam]);

  const escolaEscolhida = escolas.find((e) => e.nome === escolaSelecionada);

  useEffect(() => {
    if (!carregouEdicao) return;

    if (!escolaEscolhida || !semana) {
      if (indiceEditando === null) {
        setItensAjustados([]);
      }
      return;
    }

    if (indiceEditando !== null) return;

    const cardapiosDaSemana = cardapios.filter((c) => c.semana === semana);

    const cardapiosDaEscola = cardapiosDaSemana.filter((cardapio) =>
      escolaEscolhida.grupos.some((g) => g.grupo === cardapio.grupo)
    );

    const itensCalculados: ItemCalculado[] = [];

    cardapiosDaEscola.forEach((cardapio) => {
      const grupoDaEscola = escolaEscolhida.grupos.find(
        (g) => g.grupo === cardapio.grupo
      );

      const qtdAlunos = grupoDaEscola?.quantidadeAlunos || 0;

      cardapio.itens.forEach((item) => {
        const preparacao = preparacoes.find(
          (p) => p.nome === item.preparacao
        );

        if (!preparacao) return;

        preparacao.ingredientes.forEach((ing) => {
          itensCalculados.push({
            produto: ing.produto,
            unidade: ing.unidade,
            quantidade: Number(ing.quantidade) * qtdAlunos,
            grupo: cardapio.grupo,
          });
        });
      });
    });

    const consolidados: ItemCalculado[] = [];

    itensCalculados.forEach((item) => {
      const existente = consolidados.find(
        (i) =>
          i.produto === item.produto &&
          i.unidade === item.unidade &&
          i.grupo === item.grupo
      );

      if (existente) {
        existente.quantidade += item.quantidade;
      } else {
        consolidados.push({ ...item });
      }
    });

    setItensAjustados(
      consolidados.map((item) => ({
        ...item,
        ativo: true,
      }))
    );
  }, [
    carregouEdicao,
    escolaEscolhida,
    semana,
    cardapios,
    preparacoes,
    indiceEditando,
  ]);

  function limparMensagens() {
    setErro("");
    setSucesso("");
  }

  function toggleItem(index: number) {
    const novaLista = [...itensAjustados];
    novaLista[index].ativo = !novaLista[index].ativo;
    setItensAjustados(novaLista);
    limparMensagens();
  }

  function handleAlterarQuantidade(index: number, valor: string) {
    const novaLista = [...itensAjustados];
    novaLista[index].quantidade = Number(valor || 0);
    setItensAjustados(novaLista);
    limparMensagens();
  }

  function getSaldoDisponivel(produto: string, grupo: string) {
    const saldo = saldos.find(
      (item) => item.produto === produto && item.grupo === grupo
    );

    if (!saldo) return 0;

    return saldo.quantidadeContratada - saldo.quantidadeUtilizada;
  }

  function recalcularSaldosComBaseNosRomaneios(listaRomaneios: RomaneioGerado[]) {
    const saldosSalvos = localStorage.getItem("saldos");

    if (!saldosSalvos || saldosSalvos === "undefined") return;

    let listaSaldos: SaldoLicitado[] = [];

    try {
      listaSaldos = JSON.parse(saldosSalvos);
    } catch {
      return;
    }

    const novosSaldos = listaSaldos.map((saldo) => {
      let totalUtilizado = 0;

      listaRomaneios.forEach((romaneio) => {
        romaneio.itens.forEach((item) => {
          if (item.produto === saldo.produto && item.grupo === saldo.grupo) {
            totalUtilizado += item.quantidade;
          }
        });
      });

      return {
        ...saldo,
        quantidadeUtilizada: totalUtilizado,
      };
    });

    localStorage.setItem("saldos", JSON.stringify(novosSaldos));
    setSaldos(novosSaldos);
  }

  function handleGerarRomaneio() {
    limparMensagens();

    if (!escolaEscolhida || !semana || itensAjustados.length === 0) {
      setErro("Preencha os dados antes de gerar o romaneio.");
      return;
    }

    const confirmou = window.confirm(
      indiceEditando === null
        ? "Deseja gerar o romaneio?"
        : "Deseja salvar a edição deste romaneio?"
    );

    if (!confirmou) return;

    const romaneiosSalvos = localStorage.getItem("romaneios");

    let lista: RomaneioGerado[] = [];

    if (romaneiosSalvos && romaneiosSalvos !== "undefined") {
      try {
        lista = JSON.parse(romaneiosSalvos);
      } catch {
        lista = [];
      }
    }

    const novoRomaneio: RomaneioGerado = {
      escola: escolaEscolhida.nome,
      semana,
      dataGeracao: new Date().toISOString(),
      itens: itensAjustados
        .filter((item) => item.ativo)
        .map((item) => ({
          produto: item.produto,
          unidade: item.unidade,
          quantidade: Number(item.quantidade.toFixed(2)),
          grupo: item.grupo,
        })),
    };

    const novaLista = [...lista];
    let indiceFinal = 0;

    if (indiceEditando === null) {
      novaLista.push(novoRomaneio);
      indiceFinal = novaLista.length - 1;
    } else {
      novaLista[indiceEditando] = novoRomaneio;
      indiceFinal = indiceEditando;
    }

    localStorage.setItem("romaneios", JSON.stringify(novaLista));
    recalcularSaldosComBaseNosRomaneios(novaLista);

    setIndiceEditando(null);
    setSucesso("Romaneio salvo com sucesso.");

    window.open(`/historico-romaneios/${indiceFinal}`, "_blank");
  }

  function handleCancelarEdicao() {
    setEscolaSelecionada("");
    setSemana("");
    setItensAjustados([]);
    setIndiceEditando(null);
    limparMensagens();
  }

  const itensAtivos = itensAjustados.filter((item) => item.ativo).length;

  const totalQuantidade = useMemo(() => {
    return itensAjustados
      .filter((item) => item.ativo)
      .reduce((soma, item) => soma + item.quantidade, 0);
  }, [itensAjustados]);

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Consolidação de envio</p>
          <h1 className={styles.title}>
            {indiceEditando === null ? "Gerar Romaneio" : "Editar Romaneio"}
          </h1>
          <p className={styles.description}>
            Selecione a escola e a semana para consolidar os produtos com base
            nos cardápios, preparações e quantitativo de alunos.
          </p>
        </div>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Itens ativos</span>
            <strong className={styles.statValue}>{itensAtivos}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Quantidade total</span>
            <strong className={styles.statValue}>
              {totalQuantidade.toFixed(2)}
            </strong>
          </article>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Dados do romaneio</h2>
              <p className={styles.panelText}>
                Escolha a escola e a semana para carregar os itens calculados.
              </p>
            </div>

            {indiceEditando !== null && (
              <span className={styles.editingBadge}>Modo de edição</span>
            )}
          </div>

          <div className={styles.form}>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="escola">Escola</label>
                <select
                  id="escola"
                  value={escolaSelecionada}
                  onChange={(e) => {
                    setEscolaSelecionada(e.target.value);
                    if (indiceEditando === null) {
                      setItensAjustados([]);
                    }
                    limparMensagens();
                  }}
                >
                  <option value="">Selecione</option>
                  {escolas.map((e) => (
                    <option key={e.nome} value={e.nome}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="semana">Semana</label>
                <select
                  id="semana"
                  value={semana}
                  onChange={(e) => {
                    setSemana(e.target.value);
                    if (indiceEditando === null) {
                      setItensAjustados([]);
                    }
                    limparMensagens();
                  }}
                >
                  <option value="">Selecione</option>
                  {semanas.map((s) => (
                    <option key={s} value={s}>
                      Semana {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {erro && <div className={styles.errorBox}>{erro}</div>}
            {sucesso && <div className={styles.successBox}>{sucesso}</div>}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Resumo da seleção</h2>
              <p className={styles.panelText}>
                Visualize a escola escolhida e a quantidade de itens calculados.
              </p>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Escola</span>
              <strong className={styles.summaryValue}>
                {escolaSelecionada || "-"}
              </strong>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Semana</span>
              <strong className={styles.summaryValue}>
                {semana ? `Semana ${semana}` : "-"}
              </strong>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Itens carregados</span>
              <strong className={styles.summaryValue}>{itensAjustados.length}</strong>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Itens ativos</span>
              <strong className={styles.summaryValue}>{itensAtivos}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Itens do romaneio</h2>
            <p className={styles.panelText}>
              Revise os produtos, ajuste quantidades e escolha o que será usado.
            </p>
          </div>
        </div>

        {itensAjustados.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Nenhum item calculado</h3>
            <p>
              Selecione uma escola e uma semana para carregar automaticamente os
              itens do romaneio.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Usar</th>
                    <th>Grupo</th>
                    <th>Produto</th>
                    <th>Unidade</th>
                    <th>Quantidade</th>
                    <th>Saldo disponível</th>
                  </tr>
                </thead>
                <tbody>
                  {itensAjustados.map((item, index) => (
                    <tr
                      key={`${item.produto}-${item.grupo}-${index}`}
                      className={!item.ativo ? styles.rowInactive : ""}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={item.ativo}
                          onChange={() => toggleItem(index)}
                        />
                      </td>
                      <td>{item.grupo}</td>
                      <td>{item.produto}</td>
                      <td>{item.unidade}</td>
                      <td>
                        <input
                          className={styles.quantityInput}
                          type="number"
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) =>
                            handleAlterarQuantidade(index, e.target.value)
                          }
                        />
                      </td>
                      <td>
                        {getSaldoDisponivel(item.produto, item.grupo).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileList}>
              {itensAjustados.map((item, index) => (
                <article
                  key={`${item.produto}-${item.grupo}-mobile-${index}`}
                  className={`${styles.itemCard} ${
                    !item.ativo ? styles.itemCardInactive : ""
                  }`}
                >
                  <div className={styles.itemCardHeader}>
                    <div>
                      <h3 className={styles.itemTitle}>{item.produto}</h3>
                      <p className={styles.itemMeta}>{item.grupo}</p>
                    </div>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={item.ativo}
                        onChange={() => toggleItem(index)}
                      />
                      <span>Usar</span>
                    </label>
                  </div>

                  <div className={styles.itemInfoGrid}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemInfoLabel}>Unidade</span>
                      <strong>{item.unidade}</strong>
                    </div>

                    <div className={styles.itemInfo}>
                      <span className={styles.itemInfoLabel}>Saldo</span>
                      <strong>
                        {getSaldoDisponivel(item.produto, item.grupo).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Quantidade</label>
                    <input
                      className={styles.quantityInput}
                      type="number"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) =>
                        handleAlterarQuantidade(index, e.target.value)
                      }
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={handleGerarRomaneio}
                className={styles.primaryButton}
              >
                {indiceEditando === null ? "Gerar Romaneio" : "Salvar edição"}
              </button>

              {indiceEditando !== null && (
                <button
                  type="button"
                  onClick={handleCancelarEdicao}
                  className={styles.warningButton}
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}