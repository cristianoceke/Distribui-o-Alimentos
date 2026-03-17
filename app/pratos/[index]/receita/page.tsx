"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./receita.module.css";

type ProdutoReceita = {
  nome: string;
  unidade: string;
};

type IngredienteReceita = {
  produto: string;
  quantidade: string;
  unidade: string;
};

export default function ReceitaPreparacaoPage() {
  const params = useParams();
  const index = params.index;

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [ingredientes, setIngredientes] = useState<IngredienteReceita[]>([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [produtos, setProdutos] = useState<ProdutoReceita[]>([]);
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);
  const [nomePreparacao, setNomePreparacao] = useState("");

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("produtos");

    if (produtosSalvos) {
      setProdutos(JSON.parse(produtosSalvos));
    }
  }, []);

  useEffect(() => {
    const preparacoesSalvas = localStorage.getItem("preparacoes");
    if (!preparacoesSalvas) return;

    const listaPreparacoes = JSON.parse(preparacoesSalvas);
    const indiceNumero = Number(Array.isArray(index) ? index[0] : index);

    if (Number.isNaN(indiceNumero) || !listaPreparacoes[indiceNumero]) return;

    setNomePreparacao(listaPreparacoes[indiceNumero].nome);

    const ingredientesSalvos = listaPreparacoes[indiceNumero].ingredientes;

    if (Array.isArray(ingredientesSalvos)) {
      setIngredientes(ingredientesSalvos);
    } else {
      setIngredientes([]);
    }
  }, [index]);

  function limparFormulario() {
    setProdutoSelecionado("");
    setQuantidade("");
    setErro("");
    setSucesso("");
    setIndiceEditando(null);
  }

  function handleAdicionarIngrediente() {
    if (!produtoSelecionado || !quantidade) {
      setErro("Selecione um produto e informe a quantidade.");
      setSucesso("");
      return;
    }

    const ingredienteJaExiste = ingredientes.some((ingrediente, indexAtual) => {
      const mesmoProduto = ingrediente.produto === produtoSelecionado;
      const outroIngrediente = indexAtual !== indiceEditando;
      return mesmoProduto && outroIngrediente;
    });

    if (ingredienteJaExiste) {
      setErro("Esse ingrediente já foi adicionado na receita.");
      setSucesso("");
      return;
    }

    const produtoEncontrado = produtos.find(
      (produto) => produto.nome === produtoSelecionado
    );

    if (!produtoEncontrado) {
      setErro("Produto não encontrado.");
      setSucesso("");
      return;
    }

    const novoIngrediente: IngredienteReceita = {
      produto: produtoSelecionado,
      quantidade,
      unidade: produtoEncontrado.unidade,
    };

    const novaLista = [...ingredientes];

    if (indiceEditando === null) {
      novaLista.push(novoIngrediente);
    } else {
      novaLista[indiceEditando] = novoIngrediente;
    }

    setIngredientes(novaLista);
    limparFormulario();
  }

  function handleRemoverIngrediente(indexParaRemover: number) {
    const novaLista = ingredientes.filter(
      (_, indexAtual) => indexAtual !== indexParaRemover
    );
    setIngredientes(novaLista);

    if (indiceEditando === indexParaRemover) {
      limparFormulario();
    }
  }

  function handleEditarIngrediente(indexParaEditar: number) {
    const ingrediente = ingredientes[indexParaEditar];

    setProdutoSelecionado(ingrediente.produto);
    setQuantidade(ingrediente.quantidade);
    setIndiceEditando(indexParaEditar);
    setErro("");
    setSucesso("");
  }

  function handleCancelarEdicao() {
    limparFormulario();
  }

  function handleSalvarReceita() {
    const preparacoesSalvas = localStorage.getItem("preparacoes");

    if (!preparacoesSalvas) {
      setErro("Nenhuma preparação encontrada para salvar a receita.");
      setSucesso("");
      return;
    }

    const listaPreparacoes = JSON.parse(preparacoesSalvas);
    const indiceNumero = Number(Array.isArray(index) ? index[0] : index);

    if (Number.isNaN(indiceNumero) || !listaPreparacoes[indiceNumero]) {
      setErro("Preparação não encontrada.");
      setSucesso("");
      return;
    }

    listaPreparacoes[indiceNumero].ingredientes = ingredientes;
    localStorage.setItem("preparacoes", JSON.stringify(listaPreparacoes));

    setErro("");
    setSucesso("Receita salva com sucesso.");
  }

  const totalIngredientes = ingredientes.length;

  const unidadeAtual = useMemo(() => {
    const produtoEncontrado = produtos.find(
      (produto) => produto.nome === produtoSelecionado
    );
    return produtoEncontrado?.unidade || "-";
  }, [produtoSelecionado, produtos]);

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Montagem da receita</p>
          <h1 className={styles.title}>Receita da preparação</h1>
          <p className={styles.description}>
            Defina os ingredientes e as quantidades per capita da preparação.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/pratos" className={styles.backButton}>
            Voltar para preparações
          </Link>
        </div>
      </div>

      <div className={styles.heroCard}>
        <div>
          <span className={styles.heroLabel}>Preparação selecionada</span>
          <h2 className={styles.heroTitle}>{nomePreparacao || "Preparação"}</h2>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Ingredientes</span>
            <strong className={styles.heroStatValue}>{totalIngredientes}</strong>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                {indiceEditando === null
                  ? "Adicionar ingrediente"
                  : "Editar ingrediente"}
              </h2>
              <p className={styles.panelText}>
                Escolha um produto cadastrado e informe a quantidade per capita.
              </p>
            </div>

            {indiceEditando !== null && (
              <span className={styles.editingBadge}>Modo de edição</span>
            )}
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="produto">Produto</label>
              <select
                id="produto"
                value={produtoSelecionado}
                onChange={(event) => {
                  setProdutoSelecionado(event.target.value);
                  setErro("");
                  setSucesso("");
                }}
              >
                <option value="">Selecione um produto</option>
                {produtos.map((produto) => (
                  <option key={produto.nome} value={produto.nome}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="quantidade">Quantidade per capita</label>
                <input
                  id="quantidade"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Ex.: 0.08"
                  value={quantidade}
                  onChange={(event) => {
                    setQuantidade(event.target.value);
                    setErro("");
                    setSucesso("");
                  }}
                />
              </div>

              <div className={styles.field}>
                <label>Unidade</label>
                <div className={styles.readonlyField}>{unidadeAtual}</div>
              </div>
            </div>

            {erro && <div className={styles.errorBox}>{erro}</div>}
            {sucesso && <div className={styles.successBox}>{sucesso}</div>}

            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleAdicionarIngrediente}
                className={styles.primaryButton}
              >
                {indiceEditando === null
                  ? "Adicionar ingrediente"
                  : "Salvar edição"}
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
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Ingredientes da receita</h2>
              <p className={styles.panelText}>
                Revise, edite ou remova os ingredientes antes de salvar.
              </p>
            </div>
          </div>

          {ingredientes.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Nenhum ingrediente adicionado</h3>
              <p>Adicione os ingredientes que compõem esta preparação.</p>
            </div>
          ) : (
            <>
              <div className={styles.ingredientList}>
                {ingredientes.map((ingrediente, indexAtual) => {
                  const estaEditando = indiceEditando === indexAtual;

                  return (
                    <article
                      key={indexAtual}
                      className={`${styles.ingredientCard} ${
                        estaEditando ? styles.ingredientCardEditing : ""
                      }`}
                    >
                      <div className={styles.ingredientCardHeader}>
                        <div>
                          <h3 className={styles.ingredientName}>
                            {ingrediente.produto}
                          </h3>
                          <p className={styles.ingredientMeta}>
                            {ingrediente.quantidade} {ingrediente.unidade} por aluno
                          </p>
                        </div>

                        <span className={styles.unitBadge}>
                          {ingrediente.unidade}
                        </span>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          onClick={() => handleEditarIngrediente(indexAtual)}
                          className={styles.secondaryButton}
                        >
                          Editar
                        </button>

                        {estaEditando && (
                          <button
                            type="button"
                            onClick={handleCancelarEdicao}
                            className={styles.warningButton}
                          >
                            Cancelar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const confirmou = window.confirm(
                              "Tem certeza que deseja remover este ingrediente?"
                            );

                            if (confirmou) {
                              handleRemoverIngrediente(indexAtual);
                            }
                          }}
                          className={styles.dangerButton}
                        >
                          Remover
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={styles.footerActions}>
                <button
                  type="button"
                  onClick={handleSalvarReceita}
                  className={styles.saveRecipeButton}
                >
                  Salvar receita
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}