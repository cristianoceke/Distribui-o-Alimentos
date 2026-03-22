"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Save,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
} from "lucide-react";
import styles from "./receita.module.css";
import type { Preparacao } from "@/types/preparacao";
import type { Produto } from "@/types/produto";
import { readStorage, useHydrated } from "@/utils/storage";

type IngredienteReceita = {
  produto: string;
  quantidade: string;
  unidade: string;
};

export default function ReceitaPreparacaoPage() {
  const params = useParams();
  const index = params.index;
  const indiceNumero = Number(Array.isArray(index) ? index[0] : index);
  const preparacoes = readStorage<Preparacao[]>("preparacoes", []);
  const preparacaoAtual =
    !Number.isNaN(indiceNumero) ? preparacoes[indiceNumero] : undefined;

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [ingredientes, setIngredientes] = useState<IngredienteReceita[]>(
    Array.isArray(preparacaoAtual?.ingredientes)
      ? preparacaoAtual.ingredientes.map((ingrediente) => ({
          ...ingrediente,
          quantidade: String(ingrediente.quantidade),
        }))
      : []
  );
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [produtos] = useState<Produto[]>(() => readStorage<Produto[]>("produtos", []));
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);
  const [nomePreparacao] = useState(preparacaoAtual?.nome ?? "");
  const hydrated = useHydrated();

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
    if (!preparacoes[indiceNumero]) {
      setErro("Nenhuma preparação encontrada para salvar a receita.");
      setSucesso("");
      return;
    }

    const listaPreparacoes = [...preparacoes];

    listaPreparacoes[indiceNumero].ingredientes = ingredientes.map(
      (ingrediente) => ({
        ...ingrediente,
        quantidade: Number(ingrediente.quantidade),
      })
    );
    localStorage.setItem("preparacoes", JSON.stringify(listaPreparacoes));

    setProdutoSelecionado("");
    setQuantidade("");
    setErro("");
    setSucesso("Receita salva com sucesso.");
    setIndiceEditando(null);
  }

  const totalIngredientes = ingredientes.length;

  const unidadeAtual = useMemo(() => {
    const produtoEncontrado = produtos.find(
      (produto) => produto.nome === produtoSelecionado
    );
    return produtoEncontrado?.unidade || "-";
  }, [produtoSelecionado, produtos]);

  if (!hydrated) {
    return <section className={styles.page} />;
  }

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
            <ArrowLeft size={18} />
            <span>Voltar para preparações</span>
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
                {indiceEditando === null ? <Plus size={18} /> : <Save size={18} />}
                <span>
                  {indiceEditando === null
                    ? "Adicionar ingrediente"
                    : "Salvar edição"}
                </span>
              </button>

              {indiceEditando !== null && (
                <button
                  type="button"
                  onClick={handleCancelarEdicao}
                  className={styles.warningButton}
                >
                  <X size={18} />
                  <span>Cancelar edição</span>
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
                          <Pencil size={18} />
                          <span>Editar</span>
                        </button>

                        {estaEditando && (
                          <button
                            type="button"
                            onClick={handleCancelarEdicao}
                            className={styles.warningButton}
                          >
                            <X size={18} />
                            <span>Cancelar</span>
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
                          <Trash2 size={18} />
                          <span>Remover</span>
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
                  <Save size={18} />
                  <span>Salvar receita</span>
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
