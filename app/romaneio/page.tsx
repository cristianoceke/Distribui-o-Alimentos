"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Escola } from "@/types/escola";
import type { Cardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import type { RomaneioGerado } from "@/types/romaneio";
import type { SaldoLicitado } from "@/types/saldo";
import styles from "./romaneio.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";

type ItemCalculado = {
  produto: string;
  unidade: string;
  quantidade: number;
  grupo: string;
};

type ItemAjustado = ItemCalculado & {
  ativo: boolean;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function hydrateRomaneios() {
  return readStorage<RomaneioGerado[]>("romaneios", []).map((romaneio) => ({
    ...romaneio,
    id: romaneio.id ?? createId("romaneio"),
  }));
}

function calcularItensRomaneio(params: {
  escolaSelecionada: string;
  semana: string;
  escolas: Escola[];
  cardapios: Cardapio[];
  preparacoes: Preparacao[];
}) {
  const { escolaSelecionada, semana, escolas, cardapios, preparacoes } = params;
  const escolaSelecionadaNormalizada = normalizeText(escolaSelecionada);
  const semanaNormalizada = normalizeText(semana);

  const escolaEscolhida = escolas.find(
    (escola) => normalizeText(escola.nome) === escolaSelecionadaNormalizada
  );

  if (!escolaEscolhida || !semana) {
    return [];
  }

  const cardapiosDaSemana = cardapios.filter(
    (cardapio) => normalizeText(cardapio.semana) === semanaNormalizada
  );

  const cardapiosDaEscola = cardapiosDaSemana.filter((cardapio) =>
    escolaEscolhida.grupos.some(
      (grupo) => normalizeText(grupo.grupo) === normalizeText(cardapio.grupo)
    )
  );

  const itensCalculados: ItemCalculado[] = [];

  cardapiosDaEscola.forEach((cardapio) => {
    const grupoDaEscola = escolaEscolhida.grupos.find(
      (grupo) => normalizeText(grupo.grupo) === normalizeText(cardapio.grupo)
    );

    const qtdAlunos = grupoDaEscola?.quantidadeAlunos || 0;

    cardapio.itens.forEach((item) => {
      const preparacao = preparacoes.find(
        (prep) => normalizeText(prep.nome) === normalizeText(item.preparacao)
      );

      if (!preparacao) return;

      preparacao.ingredientes.forEach((ingrediente) => {
        itensCalculados.push({
          produto: ingrediente.produto,
          unidade: ingrediente.unidade,
          quantidade: Number(ingrediente.quantidade) * qtdAlunos,
          grupo: cardapio.grupo,
        });
      });
    });
  });

  const consolidados: ItemCalculado[] = [];

  itensCalculados.forEach((item) => {
    const existente = consolidados.find(
      (consolidado) =>
        consolidado.produto === item.produto &&
        consolidado.unidade === item.unidade &&
        consolidado.grupo === item.grupo
    );

    if (existente) {
      existente.quantidade += item.quantidade;
    } else {
      consolidados.push({ ...item });
    }
  });

  return consolidados.map((item) => ({
    ...item,
    ativo: true,
  }));
}

function getMotivosSemItens(params: {
  escolaSelecionada: string;
  semana: string;
  escolas: Escola[];
  cardapios: Cardapio[];
  preparacoes: Preparacao[];
}) {
  const { escolaSelecionada, semana, escolas, cardapios, preparacoes } = params;

  if (!escolaSelecionada || !semana) {
    return [];
  }

  const escolaSelecionadaNormalizada = normalizeText(escolaSelecionada);
  const semanaNormalizada = normalizeText(semana);
  const escolaEscolhida = escolas.find(
    (escola) => normalizeText(escola.nome) === escolaSelecionadaNormalizada
  );

  if (!escolaEscolhida) {
    return ["A escola selecionada nao foi encontrada no cadastro."];
  }

  const cardapiosDaSemana = cardapios.filter(
    (cardapio) => normalizeText(cardapio.semana) === semanaNormalizada
  );

  if (cardapiosDaSemana.length === 0) {
    return ["Nao existe cardapio cadastrado para a semana selecionada."];
  }

  const gruposDaEscola = escolaEscolhida.grupos.map((grupo) => grupo.grupo);
  const gruposCompativeis = gruposDaEscola.filter((grupo) =>
    cardapiosDaSemana.some(
      (cardapio) => normalizeText(cardapio.grupo) === normalizeText(grupo)
    )
  );

  if (gruposCompativeis.length === 0) {
    return [
      "Os grupos da escola nao possuem cardapio vinculado nesta semana.",
    ];
  }

  const preparacoesAusentes = Array.from(
    new Set(
      cardapiosDaSemana
        .filter((cardapio) =>
          gruposCompativeis.some(
            (grupo) => normalizeText(grupo) === normalizeText(cardapio.grupo)
          )
        )
        .flatMap((cardapio) =>
          cardapio.itens
            .filter(
              (item) =>
                !preparacoes.some(
                  (prep) => normalizeText(prep.nome) === normalizeText(item.preparacao)
                )
            )
            .map((item) => item.preparacao)
        )
    )
  );

  const preparacoesSemIngredientes = Array.from(
    new Set(
      cardapiosDaSemana
        .filter((cardapio) =>
          gruposCompativeis.some(
            (grupo) => normalizeText(grupo) === normalizeText(cardapio.grupo)
          )
        )
        .flatMap((cardapio) =>
          cardapio.itens
            .filter((item) => {
              const preparacao = preparacoes.find(
                (prep) => normalizeText(prep.nome) === normalizeText(item.preparacao)
              );

              return preparacao !== undefined && preparacao.ingredientes.length === 0;
            })
            .map((item) => item.preparacao)
        )
    )
  );

  const gruposSemAlunos = escolaEscolhida.grupos
    .filter(
      (grupo) =>
        gruposCompativeis.some(
          (grupoCompativel) =>
            normalizeText(grupoCompativel) === normalizeText(grupo.grupo)
        ) && Number(grupo.quantidadeAlunos) <= 0
    )
    .map((grupo) => grupo.grupo);

  const motivos: string[] = [];

  if (preparacoesAusentes.length > 0) {
    motivos.push(
      `As seguintes preparacoes do cardapio nao foram encontradas: ${preparacoesAusentes.join(
        ", "
      )}.`
    );
  }

  if (preparacoesSemIngredientes.length > 0) {
    motivos.push(
      `Estas preparacoes nao possuem ingredientes cadastrados: ${preparacoesSemIngredientes.join(
        ", "
      )}.`
    );
  }

  if (gruposSemAlunos.length > 0) {
    motivos.push(
      `Os seguintes grupos estao com quantidade de alunos zerada: ${gruposSemAlunos.join(
        ", "
      )}.`
    );
  }

  if (motivos.length === 0) {
    motivos.push(
      "Nao foi possivel gerar itens com os dados atuais. Revise os grupos da escola, os cardapios da semana e as receitas das preparacoes."
    );
  }

  return motivos;
}

function RomaneioPageClient({ editarParam }: { editarParam: string | null }) {
  const semanas = ["1", "2", "3", "4"];
  const romaneioInicial = editarParam
    ? hydrateRomaneios().find((item) => item.id === editarParam) ?? null
    : null;

  const [escolas] = useState<Escola[]>(() => readStorage<Escola[]>("escolas", []));
  const [escolaSelecionada, setEscolaSelecionada] = useState(
    romaneioInicial?.escola ?? ""
  );
  const [semana, setSemana] = useState(romaneioInicial?.semana ?? "");

  const [cardapios] = useState<Cardapio[]>(() => readStorage<Cardapio[]>("cardapios", []));
  const [preparacoes] = useState<Preparacao[]>(() =>
    readStorage<Preparacao[]>("preparacoes", [])
  );
  const [saldos, setSaldos] = useState<SaldoLicitado[]>(() =>
    readStorage<SaldoLicitado[]>("saldos", [])
  );

  const [itensAjustados, setItensAjustados] = useState<ItemAjustado[]>(
    romaneioInicial?.itens.map((item) => ({ ...item, ativo: true })) ?? []
  );
  const [romaneioEditandoId, setRomaneioEditandoId] = useState<string | null>(
    romaneioInicial?.id ?? null
  );
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const escolaEscolhida = escolas.find(
    (e) => normalizeText(e.nome) === normalizeText(escolaSelecionada)
  );

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
    const listaSaldos = readStorage<SaldoLicitado[]>("saldos", []);

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
      romaneioEditandoId === null
        ? "Deseja gerar o romaneio?"
        : "Deseja salvar a edição deste romaneio?"
    );

    if (!confirmou) return;
    const lista = hydrateRomaneios();

    const novoRomaneio: RomaneioGerado = {
      id: romaneioEditandoId ?? createId("romaneio"),
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

    const novaLista =
      romaneioEditandoId === null
        ? [...lista, novoRomaneio]
        : lista.map((romaneio) =>
            romaneio.id === romaneioEditandoId ? novoRomaneio : romaneio
          );

    localStorage.setItem("romaneios", JSON.stringify(novaLista));
    recalcularSaldosComBaseNosRomaneios(novaLista);

    setRomaneioEditandoId(null);
    setSucesso("Romaneio salvo com sucesso.");

    window.open(`/historico-romaneios/${novoRomaneio.id}`, "_blank");
  }

  function handleCancelarEdicao() {
    setEscolaSelecionada("");
    setSemana("");
    setItensAjustados([]);
    setRomaneioEditandoId(null);
    limparMensagens();
  }

  function handleSelecionarEscola(novaEscola: string) {
    setEscolaSelecionada(novaEscola);

    if (romaneioEditandoId !== null) {
      return;
    }

    setItensAjustados(
      calcularItensRomaneio({
        escolaSelecionada: novaEscola,
        semana,
        escolas,
        cardapios,
        preparacoes,
      })
    );
  }

  function handleSelecionarSemana(novaSemana: string) {
    setSemana(novaSemana);

    if (romaneioEditandoId !== null) {
      return;
    }

    setItensAjustados(
      calcularItensRomaneio({
        escolaSelecionada,
        semana: novaSemana,
        escolas,
        cardapios,
        preparacoes,
      })
    );
  }

  const itensAtivos = itensAjustados.filter((item) => item.ativo).length;

  const totalQuantidade = useMemo(() => {
    return itensAjustados
      .filter((item) => item.ativo)
      .reduce((soma, item) => soma + item.quantidade, 0);
  }, [itensAjustados]);

  const motivosSemItens = useMemo(
    () =>
      getMotivosSemItens({
        escolaSelecionada,
        semana,
        escolas,
        cardapios,
        preparacoes,
      }),
    [escolaSelecionada, semana, escolas, cardapios, preparacoes]
  );

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Consolidação de envio</p>
          <h1 className={styles.title}>
            {romaneioEditandoId === null ? "Gerar Romaneio" : "Editar Romaneio"}
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

            {romaneioEditandoId !== null && (
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
                    handleSelecionarEscola(e.target.value);
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
                    handleSelecionarSemana(e.target.value);
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
            {escolaSelecionada && semana ? (
              <>
                <p>O romaneio nao pode ser gerado com a selecao atual.</p>
                {motivosSemItens.length > 0 && (
                  <ul className={styles.emptyReasons}>
                    {motivosSemItens.map((motivo) => (
                      <li key={motivo}>{motivo}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p>
                Selecione uma escola e uma semana para carregar automaticamente os
                itens do romaneio.
              </p>
            )}
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
                {romaneioEditandoId === null ? "Gerar Romaneio" : "Salvar edição"}
              </button>

              {romaneioEditandoId !== null && (
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

function RomaneioPageContent() {
  const searchParams = useSearchParams();
  const editarParam = searchParams.get("editar");
  const hydrated = useHydrated();

  if (!hydrated) {
    return <section className={styles.page} />;
  }

  return <RomaneioPageClient key={editarParam ?? "novo"} editarParam={editarParam} />;
}

export default function RomaneioPage() {
  return (
    <Suspense fallback={<section className={styles.page} />}>
      <RomaneioPageContent />
    </Suspense>
  );
}
