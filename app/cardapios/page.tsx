"use client";

import { useEffect, useMemo, useState } from "react";
import type { Cardapio, ItemCardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import styles from "@/app/cardapios/cardapios.module.css";

const gruposCardapio = [
  "creche 6 a 11 meses",
  "creche 1 a 3 anos",
  "pré/fund",
  "AEE",
  "EJA",
  "integral",
];

const semanasCardapio = ["1", "2", "3", "4"];

const diasCardapio = [
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
];

const refeicoesCardapio = [
  "desjejum",
  "almoço",
  "lanche",
  "jantar",
  "sobremesa",
  "refeição única",
];

export default function CardapiosPage() {
  const [grupo, setGrupo] = useState("");
  const [semana, setSemana] = useState("");
  const [itens, setItens] = useState<ItemCardapio[]>([]);

  const [dia, setDia] = useState("");
  const [refeicao, setRefeicao] = useState("");
  const [preparacao, setPreparacao] = useState("");

  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);
  const [carregouCardapios, setCarregouCardapios] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);

  useEffect(() => {
    const preparacoesSalvas = localStorage.getItem("preparacoes");
    if (preparacoesSalvas) {
      setPreparacoes(JSON.parse(preparacoesSalvas));
    }
  }, []);

  useEffect(() => {
    const cardapiosSalvos = localStorage.getItem("cardapios");
    if (cardapiosSalvos) {
      setCardapios(JSON.parse(cardapiosSalvos));
    }
    setCarregouCardapios(true);
  }, []);

  useEffect(() => {
    if (!carregouCardapios) return;
    localStorage.setItem("cardapios", JSON.stringify(cardapios));
  }, [cardapios, carregouCardapios]);

  function limparMensagem() {
    setErro("");
    setSucesso("");
  }

  function handleAdicionarItemCardapio() {
    limparMensagem();

    if (!grupo.trim() || !semana.trim()) {
      setErro("Selecione o grupo e a semana antes de adicionar itens.");
      return;
    }

    if (!dia.trim() || !refeicao.trim() || !preparacao.trim()) {
      setErro("Selecione dia, refeição e preparação.");
      return;
    }

    const itemDuplicado = itens.some(
      (item) =>
        item.dia === dia &&
        item.refeicao === refeicao &&
        item.preparacao === preparacao
    );

    if (itemDuplicado) {
      setErro("Esse item já foi adicionado ao cardápio em montagem.");
      return;
    }

    const novoItem: ItemCardapio = {
      dia,
      refeicao,
      preparacao,
    };

    setItens([...itens, novoItem]);
    setDia("");
    setRefeicao("");
    setPreparacao("");
    setSucesso("Item adicionado ao cardápio.");
  }

  function handleRemoverItemCardapio(indexParaRemover: number) {
    const novaLista = itens.filter((_, index) => index !== indexParaRemover);
    setItens(novaLista);
    setSucesso("");
  }

  function handleSalvarCardapio() {
    limparMensagem();

    if (!grupo.trim() || !semana.trim() || itens.length === 0) {
      setErro("Preencha grupo, semana e adicione ao menos um item.");
      return;
    }

    const cardapioDuplicado = cardapios.some((cardapio, index) => {
      const mesmoGrupo = cardapio.grupo === grupo;
      const mesmaSemana = cardapio.semana === semana;
      const outroCardapio = index !== indiceEditando;

      return mesmoGrupo && mesmaSemana && outroCardapio;
    });

    if (cardapioDuplicado) {
      setErro("Já existe um cardápio cadastrado para esse grupo e semana.");
      return;
    }

    const novoCardapio: Cardapio = {
      grupo,
      semana,
      itens,
    };

    let novaLista = [...cardapios];

    if (indiceEditando === null) {
      novaLista.push(novoCardapio);
    } else {
      novaLista[indiceEditando] = novoCardapio;
    }

    setCardapios(novaLista);

    setGrupo("");
    setSemana("");
    setItens([]);
    setDia("");
    setRefeicao("");
    setPreparacao("");
    setIndiceEditando(null);

    setSucesso(
      indiceEditando === null
        ? "Cardápio salvo com sucesso."
        : "Cardápio editado com sucesso."
    );
  }

  function handleEditarCardapio(indexParaEditar: number) {
    const cardapio = cardapios[indexParaEditar];

    setGrupo(cardapio.grupo);
    setSemana(cardapio.semana);
    setItens(cardapio.itens);
    setIndiceEditando(indexParaEditar);

    limparMensagem();
    setSucesso("Editando cardápio...");
  }

  function handleRemoverCardapio(indexParaRemover: number) {
    const confirmou = window.confirm("Tem certeza que deseja remover este cardápio?");
    if (!confirmou) return;

    const novaLista = cardapios.filter((_, index) => index !== indexParaRemover);
    setCardapios(novaLista);

    if (indiceEditando === indexParaRemover) {
      setGrupo("");
      setSemana("");
      setItens([]);
      setDia("");
      setRefeicao("");
      setPreparacao("");
      setIndiceEditando(null);
    }

    limparMensagem();
    setSucesso("Cardápio removido com sucesso.");
  }

  function handleCancelarEdicao() {
    setGrupo("");
    setSemana("");
    setItens([]);
    setDia("");
    setRefeicao("");
    setPreparacao("");
    setIndiceEditando(null);
    limparMensagem();
  }

  const totalItensCadastrados = useMemo(() => {
    return cardapios.reduce((total, cardapio) => total + cardapio.itens.length, 0);
  }, [cardapios]);

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Planejamento alimentar</p>
          <h1 className={styles.title}>Cardápios</h1>
          <p className={styles.description}>
            Monte os cardápios semanais por grupo, definindo os dias, refeições
            e preparações que serão usadas no romaneio.
          </p>
        </div>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Cardápios cadastrados</span>
            <strong className={styles.statValue}>{cardapios.length}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Itens planejados</span>
            <strong className={styles.statValue}>{totalItensCadastrados}</strong>
          </article>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.leftColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Informações do cardápio</h2>
                <p className={styles.panelText}>
                  Selecione o grupo e a semana antes de montar os itens.
                </p>
              </div>
            </div>

            <div className={styles.form}>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="grupo">Grupo / Modalidade</label>
                  <select
                    id="grupo"
                    value={grupo}
                    onChange={(event) => {
                      setGrupo(event.target.value);
                      limparMensagem();
                    }}
                  >
                    <option value="">Selecione o grupo</option>
                    {gruposCardapio.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="semana">Semana</label>
                  <select
                    id="semana"
                    value={semana}
                    onChange={(event) => {
                      setSemana(event.target.value);
                      limparMensagem();
                    }}
                  >
                    <option value="">Selecione a semana</option>
                    {semanasCardapio.map((item) => (
                      <option key={item} value={item}>
                        Semana {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Adicionar item ao cardápio</h2>
                <p className={styles.panelText}>
                  Escolha o dia, a refeição e a preparação correspondente.
                </p>
              </div>
            </div>

            <div className={styles.form}>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="dia">Dia</label>
                  <select
                    id="dia"
                    value={dia}
                    onChange={(event) => {
                      setDia(event.target.value);
                      limparMensagem();
                    }}
                  >
                    <option value="">Selecione o dia</option>
                    {diasCardapio.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="refeicao">Refeição</label>
                  <select
                    id="refeicao"
                    value={refeicao}
                    onChange={(event) => {
                      setRefeicao(event.target.value);
                      limparMensagem();
                    }}
                  >
                    <option value="">Selecione a refeição</option>
                    {refeicoesCardapio.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="preparacao">Preparação</label>
                <select
                  id="preparacao"
                  value={preparacao}
                  onChange={(event) => {
                    setPreparacao(event.target.value);
                    limparMensagem();
                  }}
                >
                  <option value="">Selecione uma preparação</option>
                  {preparacoes.map((item) => (
                    <option key={item.nome} value={item.nome}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>

              {erro && <div className={styles.errorBox}>{erro}</div>}
              {sucesso && <div className={styles.successBox}>{sucesso}</div>}

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleAdicionarItemCardapio}
                  className={styles.primaryButton}
                >
                  Adicionar ao cardápio
                </button>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Itens em montagem</h2>
                <p className={styles.panelText}>
                  Revise os itens antes de salvar o cardápio.
                </p>
              </div>
            </div>

            {itens.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>Nenhum item adicionado</h3>
                <p>Adicione os primeiros itens para montar o cardápio.</p>
              </div>
            ) : (
              <>
                <div className={styles.itemList}>
                  {itens.map((item, index) => (
                    <article key={index} className={styles.itemCard}>
                      <div className={styles.itemCardHeader}>
                        <div>
                          <h3 className={styles.itemTitle}>{item.preparacao}</h3>
                          <p className={styles.itemMeta}>
                            {item.dia} · {item.refeicao}
                          </p>
                        </div>

                        <span className={styles.itemBadge}>Em montagem</span>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          onClick={() => {
                            const confirmou = window.confirm(
                              "Tem certeza que deseja remover esta preparação?"
                            );

                            if (confirmou) {
                              handleRemoverItemCardapio(index);
                            }
                          }}
                          className={styles.dangerButton}
                        >
                          Remover
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className={styles.footerActions}>
                  <button
                    type="button"
                    onClick={handleSalvarCardapio}
                    className={styles.saveButton}
                  >
                    {indiceEditando === null ? "Salvar cardápio" : "Salvar edição"}
                  </button>

                  {indiceEditando !== null && (
                    <button
                      type="button"
                      onClick={handleCancelarEdicao}
                      className={styles.primaryButton}
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Cardápios cadastrados</h2>
              <p className={styles.panelText}>
                Visualize os cardápios já salvos por grupo e semana.
              </p>
            </div>
          </div>

          {cardapios.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Nenhum cardápio cadastrado</h3>
              <p>Os cardápios salvos aparecerão aqui.</p>
            </div>
          ) : (
            <div className={styles.savedList}>
              {cardapios.map((cardapio, index) => (
                <article key={index} className={styles.savedCard}>
                  <div className={styles.savedCardHeader}>
                    <div>
                      <h3 className={styles.savedTitle}>{cardapio.grupo}</h3>
                      <p className={styles.savedMeta}>Semana {cardapio.semana}</p>
                    </div>

                    <span className={styles.savedBadge}>
                      {cardapio.itens.length} item
                      {cardapio.itens.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {cardapio.itens.length === 0 ? (
                    <p className={styles.savedEmptyText}>
                      Esse cardápio ainda não tem itens.
                    </p>
                  ) : (
                    <div className={styles.savedItems}>
                      {cardapio.itens.map((item, itemIndex) => (
                        <div key={itemIndex} className={styles.savedItemRow}>
                          <span className={styles.savedItemMain}>
                            {item.preparacao}
                          </span>
                          <span className={styles.savedItemSub}>
                            {item.dia} · {item.refeicao}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleEditarCardapio(index)}
                      className={styles.primaryButton}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoverCardapio(index)}
                      className={styles.dangerButton}
                    >
                      Remover
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}