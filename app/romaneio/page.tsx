"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Escola } from "@/types/escola";
import type { Cardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import type { ItemRomaneio, RomaneioGerado } from "@/types/romaneio";
import type { SaldoLicitado } from "@/types/saldo";
import type { Produto } from "@/types/produto";
import styles from "./romaneio.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";
import { criarAuditoriaRegistro } from "@/utils/auditoria";
import {
  getCategoriaPerCapitaDoGrupo,
  getPerCapitaProdutoPorGrupo,
  findProdutoByName,
  getResumoQuantidade,
} from "@/utils/produtos";
import type { CategoriaPerCapita } from "@/utils/produtos";

type ItemCalculado = {
  produto: string;
  unidade: string;
  quantidade: number;
  grupo: string;
  categoria: CategoriaPerCapita;
};

type GrupoOrigem = {
  grupo: string;
  categoria: CategoriaPerCapita;
  quantidadeOriginal: number;
};

type ItemAjustado = {
  produto: string;
  unidade: string;
  quantidadeCreche: number;
  quantidadePreFundIntegralAee: number;
  quantidadeEja: number;
  quantidade: number;
  gruposOrigem: GrupoOrigem[];
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

function getQuantidadesVazias() {
  return {
    quantidadeCreche: 0,
    quantidadePreFundIntegralAee: 0,
    quantidadeEja: 0,
  };
}

function calcularTotalQuantidade(item: Pick<
  ItemAjustado,
  "quantidadeCreche" | "quantidadePreFundIntegralAee" | "quantidadeEja"
>) {
  return (
    item.quantidadeCreche +
    item.quantidadePreFundIntegralAee +
    item.quantidadeEja
  );
}

function consolidarItensPorProduto(itens: ItemRomaneio[]) {
  const consolidados = new Map<string, ItemAjustado>();

  itens.forEach((item) => {
    const chave = `${normalizeText(item.produto)}::${normalizeText(item.unidade)}`;
    const categoria = getCategoriaPerCapitaDoGrupo(item.grupo);
    const existente =
      consolidados.get(chave) ??
      ({
        produto: item.produto,
        unidade: item.unidade,
        ...getQuantidadesVazias(),
        quantidade: 0,
        gruposOrigem: [],
        ativo: true,
      } satisfies ItemAjustado);

    if (categoria === "creche") {
      existente.quantidadeCreche += item.quantidade;
    } else if (categoria === "eja") {
      existente.quantidadeEja += item.quantidade;
    } else {
      existente.quantidadePreFundIntegralAee += item.quantidade;
    }

    existente.quantidade = calcularTotalQuantidade(existente);

    const grupoExistente = existente.gruposOrigem.find(
      (grupo) => normalizeText(grupo.grupo) === normalizeText(item.grupo)
    );

    if (grupoExistente) {
      grupoExistente.quantidadeOriginal += item.quantidade;
    } else {
      existente.gruposOrigem.push({
        grupo: item.grupo,
        categoria,
        quantidadeOriginal: item.quantidade,
      });
    }

    consolidados.set(chave, existente);
  });

  return Array.from(consolidados.values()).map((item) => ({
    ...item,
    quantidadeCreche: Number(item.quantidadeCreche.toFixed(2)),
    quantidadePreFundIntegralAee: Number(
      item.quantidadePreFundIntegralAee.toFixed(2)
    ),
    quantidadeEja: Number(item.quantidadeEja.toFixed(2)),
    quantidade: Number(item.quantidade.toFixed(2)),
  }));
}

function distribuirQuantidadeEntreGrupos(
  totalCategoria: number,
  grupos: GrupoOrigem[]
) {
  if (grupos.length === 0 || totalCategoria <= 0) {
    return [];
  }

  const totalOriginal = grupos.reduce(
    (soma, grupo) => soma + grupo.quantidadeOriginal,
    0
  );

  if (totalOriginal <= 0) {
    const quantidadePorGrupo = totalCategoria / grupos.length;

    return grupos.map((grupo, index) => ({
      grupo: grupo.grupo,
      quantidade:
        index === grupos.length - 1
          ? Number(
              (totalCategoria - quantidadePorGrupo * (grupos.length - 1)).toFixed(2)
            )
          : Number(quantidadePorGrupo.toFixed(2)),
    }));
  }

  let acumulado = 0;

  return grupos.map((grupo, index) => {
    if (index === grupos.length - 1) {
      return {
        grupo: grupo.grupo,
        quantidade: Number((totalCategoria - acumulado).toFixed(2)),
      };
    }

    const quantidade = Number(
      ((grupo.quantidadeOriginal / totalOriginal) * totalCategoria).toFixed(2)
    );
    acumulado += quantidade;

    return {
      grupo: grupo.grupo,
      quantidade,
    };
  });
}

function calcularItensRomaneio(params: {
  escolaSelecionada: string;
  semana: string;
  escolas: Escola[];
  cardapios: Cardapio[];
  preparacoes: Preparacao[];
  produtos: Produto[];
}) {
  const { escolaSelecionada, semana, escolas, cardapios, preparacoes, produtos } = params;
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
        const produtoAtual = findProdutoByName(produtos, ingrediente.produto);
        const perCapita = getPerCapitaProdutoPorGrupo(produtoAtual, cardapio.grupo);

        itensCalculados.push({
          produto: ingrediente.produto,
          unidade: produtoAtual?.unidade ?? ingrediente.unidade,
          quantidade: perCapita * qtdAlunos,
          grupo: cardapio.grupo,
          categoria: getCategoriaPerCapitaDoGrupo(cardapio.grupo),
        });
      });
    });
  });

  return consolidarItensPorProduto(itensCalculados);
}

function getMotivosSemItens(params: {
  escolaSelecionada: string;
  semana: string;
  escolas: Escola[];
  cardapios: Cardapio[];
  preparacoes: Preparacao[];
  produtos: Produto[];
}) {
  const { escolaSelecionada, semana, escolas, cardapios, preparacoes, produtos } =
    params;

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

  const produtosSemPerCapita = Array.from(
    new Set(
      cardapiosDaSemana
        .filter((cardapio) =>
          gruposCompativeis.some(
            (grupo) => normalizeText(grupo) === normalizeText(cardapio.grupo)
          )
        )
        .flatMap((cardapio) => {
          const categoria = getCategoriaPerCapitaDoGrupo(cardapio.grupo);

          return cardapio.itens.flatMap((item) => {
            const preparacao = preparacoes.find(
              (prep) => normalizeText(prep.nome) === normalizeText(item.preparacao)
            );

            if (!preparacao) {
              return [];
            }

            return preparacao.ingredientes
              .filter((ingrediente) => {
                const produto = findProdutoByName(produtos, ingrediente.produto);

                if (!produto) {
                  return true;
                }

                if (categoria === "creche") {
                  return Number(produto.perCapitaCreche || 0) <= 0;
                }

                if (categoria === "eja") {
                  return Number(produto.perCapitaEja || 0) <= 0;
                }

                return Number(produto.perCapitaPreFundIntegralAee || 0) <= 0;
              })
              .map((ingrediente) => ingrediente.produto);
          });
        })
    )
  );

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

  if (produtosSemPerCapita.length > 0) {
    motivos.push(
      `Os seguintes produtos estao sem per capita configurada para os grupos selecionados: ${produtosSemPerCapita.join(
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
  const [produtos] = useState<Produto[]>(() => readStorage<Produto[]>("produtos", []));
  const [saldos, setSaldos] = useState<SaldoLicitado[]>(() =>
    readStorage<SaldoLicitado[]>("saldos", [])
  );

  const [itensAjustados, setItensAjustados] = useState<ItemAjustado[]>(
    romaneioInicial ? consolidarItensPorProduto(romaneioInicial.itens) : []
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

  function handleAlterarQuantidade(
    index: number,
    campo: "quantidadeCreche" | "quantidadePreFundIntegralAee" | "quantidadeEja",
    valor: string
  ) {
    const novaLista = [...itensAjustados];
    const itemAtualizado = {
      ...novaLista[index],
      [campo]: Number(valor || 0),
    };

    itemAtualizado.quantidade = calcularTotalQuantidade(itemAtualizado);
    novaLista[index] = itemAtualizado;
    setItensAjustados(novaLista);
    limparMensagens();
  }

  function getSaldoDisponivel(item: ItemAjustado) {
    const gruposDaLinha = Array.from(
      new Set(item.gruposOrigem.map((grupo) => normalizeText(grupo.grupo)))
    );

    return saldos.reduce((total, saldo) => {
      if (
        normalizeText(saldo.produto) === normalizeText(item.produto) &&
        gruposDaLinha.includes(normalizeText(saldo.grupo))
      ) {
        return total + (saldo.quantidadeContratada - saldo.quantidadeUtilizada);
      }

      return total;
    }, 0);
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
        .flatMap((item) => {
          const itensPorCategoria = [
            {
              quantidade: item.quantidadeCreche,
              grupos: item.gruposOrigem.filter((grupo) => grupo.categoria === "creche"),
            },
            {
              quantidade: item.quantidadePreFundIntegralAee,
              grupos: item.gruposOrigem.filter(
                (grupo) => grupo.categoria === "preFundIntegralAee"
              ),
            },
            {
              quantidade: item.quantidadeEja,
              grupos: item.gruposOrigem.filter((grupo) => grupo.categoria === "eja"),
            },
          ];

          return itensPorCategoria.flatMap(({ quantidade, grupos }) =>
            distribuirQuantidadeEntreGrupos(quantidade, grupos).map((grupoItem) => ({
              produto: item.produto,
              unidade: item.unidade,
              quantidade: grupoItem.quantidade,
              grupo: grupoItem.grupo,
            }))
          );
        }),
      ...criarAuditoriaRegistro(
        lista.find((romaneio) => romaneio.id === romaneioEditandoId)
      ),
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
        produtos,
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
        produtos,
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
        produtos,
      }),
    [escolaSelecionada, semana, escolas, cardapios, preparacoes, produtos]
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
                    <th>Produto</th>
                    <th>Unidade</th>
                    <th>Creche</th>
                    <th>Pré/Fund. Integral/AEE</th>
                    <th>EJA</th>
                    <th>Total</th>
                    <th>Saldo disponível</th>
                  </tr>
                </thead>
                <tbody>
                  {itensAjustados.map((item, index) => {
                    const produtoAtual = findProdutoByName(produtos, item.produto);
                    const resumoQuantidade = getResumoQuantidade(
                      produtoAtual,
                      item.quantidade,
                      item.unidade
                    );

                    return (
                      <tr
                        key={`${item.produto}-${item.unidade}-${index}`}
                        className={!item.ativo ? styles.rowInactive : ""}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={item.ativo}
                            onChange={() => toggleItem(index)}
                          />
                        </td>
                        <td>{item.produto}</td>
                        <td>{item.unidade}</td>
                        <td>
                          <input
                            className={styles.quantityInput}
                            type="number"
                            step="0.01"
                            value={item.quantidadeCreche}
                            onChange={(e) =>
                              handleAlterarQuantidade(
                                index,
                                "quantidadeCreche",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className={styles.quantityInput}
                            type="number"
                            step="0.01"
                            value={item.quantidadePreFundIntegralAee}
                            onChange={(e) =>
                              handleAlterarQuantidade(
                                index,
                                "quantidadePreFundIntegralAee",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className={styles.quantityInput}
                            type="number"
                            step="0.01"
                            value={item.quantidadeEja}
                            onChange={(e) =>
                              handleAlterarQuantidade(
                                index,
                                "quantidadeEja",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <strong>{resumoQuantidade.base}</strong>
                          {resumoQuantidade.compra && (
                            <small className={styles.conversionHint}>
                              Separar: {resumoQuantidade.compra}
                            </small>
                          )}
                        </td>
                        <td>{getSaldoDisponivel(item).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileList}>
              {itensAjustados.map((item, index) => {
                const produtoAtual = findProdutoByName(produtos, item.produto);
                const resumoQuantidade = getResumoQuantidade(
                  produtoAtual,
                  item.quantidade,
                  item.unidade
                );

                return (
                  <article
                    key={`${item.produto}-${item.unidade}-mobile-${index}`}
                    className={`${styles.itemCard} ${
                      !item.ativo ? styles.itemCardInactive : ""
                    }`}
                  >
                    <div className={styles.itemCardHeader}>
                      <div>
                        <h3 className={styles.itemTitle}>{item.produto}</h3>
                        <p className={styles.itemMeta}>
                          {item.gruposOrigem.map((grupo) => grupo.grupo).join(", ")}
                        </p>
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
                        <strong>{getSaldoDisponivel(item).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label>Creche</label>
                        <input
                          className={styles.quantityInput}
                          type="number"
                          step="0.01"
                          value={item.quantidadeCreche}
                          onChange={(e) =>
                            handleAlterarQuantidade(
                              index,
                              "quantidadeCreche",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className={styles.field}>
                        <label>Pré/Fund. Integral/AEE</label>
                        <input
                          className={styles.quantityInput}
                          type="number"
                          step="0.01"
                          value={item.quantidadePreFundIntegralAee}
                          onChange={(e) =>
                            handleAlterarQuantidade(
                              index,
                              "quantidadePreFundIntegralAee",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className={styles.field}>
                        <label>EJA</label>
                        <input
                          className={styles.quantityInput}
                          type="number"
                          step="0.01"
                          value={item.quantidadeEja}
                          onChange={(e) =>
                            handleAlterarQuantidade(
                              index,
                              "quantidadeEja",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className={styles.itemInfo}>
                        <span className={styles.itemInfoLabel}>Total</span>
                        <strong>{resumoQuantidade.base}</strong>
                        {resumoQuantidade.compra && (
                          <small className={styles.conversionHint}>
                            Separar: {resumoQuantidade.compra}
                          </small>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
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
