"use client";

import { useEffect, useMemo, useState } from "react";
import type { Preparacao } from "@/types/preparacao";
import Link from "next/link";
import {
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";
import styles from "@/app/pratos/pratos.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";
import { criarAuditoriaRegistro } from "@/utils/auditoria";

function hydratePreparacoes() {
  return readStorage<Preparacao[]>("preparacoes", []).map((preparacao) => ({
    ...preparacao,
    id: preparacao.id ?? createId("preparacao"),
  }));
}

export default function PreparacoesPage() {
  const [nome, setNome] = useState("");
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>(hydratePreparacoes);
  const [erro, setErro] = useState("");
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    localStorage.setItem("preparacoes", JSON.stringify(preparacoes));
  }, [preparacoes]);

  function limparFormulario() {
    setNome("");
    setErro("");
    setIndiceEditando(null);
  }

  function handleAdicionarPreparacao(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomeNormalizado = nome.trim().toLowerCase();

    if (!nomeNormalizado) {
      setErro("Preencha o nome da preparação.");
      return;
    }

    const preparacaoJaExiste = preparacoes.some((preparacao, index) => {
      const mesmoNome =
        preparacao.nome.trim().toLowerCase() === nomeNormalizado;
      const outraPreparacao = index !== indiceEditando;

      return mesmoNome && outraPreparacao;
    });

    if (preparacaoJaExiste) {
      setErro("Já existe uma preparação com esse nome.");
      return;
    }

    const novaPreparacao: Preparacao = {
      id:
        indiceEditando !== null ? preparacoes[indiceEditando]?.id : createId("preparacao"),
      nome: nome.trim(),
      ingredientes:
        indiceEditando !== null
          ? preparacoes[indiceEditando]?.ingredientes || []
          : [],
      ...criarAuditoriaRegistro(
        indiceEditando !== null ? preparacoes[indiceEditando] : undefined
      ),
    };

    const novaLista = [...preparacoes];

    if (indiceEditando === null) {
      novaLista.push(novaPreparacao);
    } else {
      novaLista[indiceEditando] = novaPreparacao;
    }

    novaLista.sort((a, b) => a.nome.localeCompare(b.nome));
    setPreparacoes(novaLista);
    limparFormulario();
  }

  function handleRemoverPreparacao(indexParaRemover: number) {
    const novaLista = preparacoes.filter(
      (_, index) => index !== indexParaRemover
    );

    setPreparacoes(novaLista);

    if (indiceEditando === indexParaRemover) {
      limparFormulario();
    }
  }

  function handleEditarPreparacao(indexParaEditar: number) {
    const preparacao = preparacoes[indexParaEditar];

    setNome(preparacao.nome);
    setIndiceEditando(indexParaEditar);
    setErro("");
  }

  function handleCancelarEdicao() {
    limparFormulario();
  }

  const totalIngredientes = useMemo(() => {
    return preparacoes.reduce(
      (total, preparacao) => total + (preparacao.ingredientes?.length || 0),
      0
    );
  }, [preparacoes]);

  if (!hydrated) {
    return <section className={styles.page} />;
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Preparações do cardápio</p>
          <h1 className={styles.title}>Pratos / Preparações</h1>
          <p className={styles.description}>
            Cadastre os pratos que serão usados no cardápio e depois monte a
            receita de cada preparação com seus ingredientes.
          </p>
        </div>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Preparações cadastradas</span>
            <strong className={styles.statValue}>{preparacoes.length}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Ingredientes cadastrados</span>
            <strong className={styles.statValue}>{totalIngredientes}</strong>
          </article>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                {indiceEditando === null
                  ? "Nova preparação"
                  : "Editar preparação"}
              </h2>
              <p className={styles.panelText}>
                Informe o nome do prato e depois monte a receita com os
                ingredientes.
              </p>
            </div>

            {indiceEditando !== null && (
              <span className={styles.editingBadge}>Modo de edição</span>
            )}
          </div>

          <form onSubmit={handleAdicionarPreparacao} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="nome">Nome do prato</label>
              <input
                id="nome"
                type="text"
                placeholder="Ex.: Arroz com frango, sopa de legumes..."
                value={nome}
                onChange={(event) => {
                  setNome(event.target.value);
                  setErro("");
                }}
              />
            </div>

            <div className={styles.infoBox}>
              Depois de cadastrar o prato, use a opção{" "}
              <strong>Montar receita</strong> para definir os ingredientes.
            </div>

            {erro && <div className={styles.errorBox}>{erro}</div>}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                {indiceEditando === null ? <Plus size={18} /> : <Save size={18} />}
                <span>
                  {indiceEditando === null ? "Adicionar prato" : "Salvar edição"}
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
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Preparações cadastradas</h2>
              <p className={styles.panelText}>
                Edite o nome, monte a receita ou remova uma preparação.
              </p>
            </div>
          </div>

          {preparacoes.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Nenhuma preparação cadastrada</h3>
              <p>
                Cadastre o primeiro prato para começar a montar as receitas do
                sistema.
              </p>
            </div>
          ) : (
            <div className={styles.preparationList}>
              {preparacoes.map((preparacao, index) => {
                const estaEditando = indiceEditando === index;
                const totalIngredientesPreparacao =
                  preparacao.ingredientes?.length || 0;

                return (
                  <article
                    key={index}
                    className={`${styles.preparationCard} ${
                      estaEditando ? styles.preparationCardEditing : ""
                    }`}
                  >
                    <div className={styles.preparationCardHeader}>
                      <div>
                        <h3 className={styles.preparationName}>
                          {preparacao.nome}
                        </h3>
                        <p className={styles.preparationMeta}>
                          {totalIngredientesPreparacao} ingrediente
                          {totalIngredientesPreparacao === 1 ? "" : "s"}
                        </p>
                      </div>

                      <span className={styles.recipeBadge}>
                        Receita disponível
                      </span>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        onClick={() => handleEditarPreparacao(index)}
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

                      <Link
                        href={`/pratos/${index}/receita`}
                        className={styles.linkButton}
                      >
                        <BookOpen size={18} />
                        <span>Montar receita</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          const confirmou = window.confirm(
                            "Tem certeza que deseja remover este prato?"
                          );

                          if (confirmou) {
                            handleRemoverPreparacao(index);
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
          )}
        </section>
      </div>
    </section>
  );
}
