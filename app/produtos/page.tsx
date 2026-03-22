"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import ListaProdutos from "@/components/ListaProdutos";
import type { Produto } from "@/types/produto";
import styles from "@/app/produtos/produtos.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";

const unidades = ["Kg", "g", "litro", "unidade"];

const categorias = [
  "hortifruti",
  "grãos",
  "proteína",
  "temperos",
  "laticínios",
  "panificação",
  "outros",
];

function hydrateProdutos() {
  return readStorage<Produto[]>("produtos", []).map((produto) => ({
    ...produto,
    id: produto.id ?? createId("produto"),
  }));
}

export default function ProdutosPage() {
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("Kg");
  const [categoria, setCategoria] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>(hydrateProdutos);
  const [erro, setErro] = useState("");
  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    localStorage.setItem("produtos", JSON.stringify(produtos));
  }, [produtos]);

  function limparFormulario() {
    setNome("");
    setUnidade("Kg");
    setCategoria("");
    setErro("");
    setProdutoEditandoId(null);
  }

  function handleAdicionarProduto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomeNormalizado = nome.trim().toLowerCase();

    const produtoJaExiste = produtos.some((produto) => {
      const mesmoNome = produto.nome.trim().toLowerCase() === nomeNormalizado;
      const outroProduto = produto.id !== produtoEditandoId;
      return mesmoNome && outroProduto;
    });

    if (!nomeNormalizado || !categoria.trim()) {
      setErro("Preencha o nome e a categoria do produto.");
      return;
    }

    if (produtoJaExiste) {
      setErro("Já existe um produto com esse nome.");
      return;
    }

    const novoProduto: Produto = {
      id: produtoEditandoId ?? createId("produto"),
      nome: nome.trim(),
      unidade,
      categoria,
    };

    const novaLista =
      produtoEditandoId === null
        ? [...produtos, novoProduto]
        : produtos.map((produto) =>
            produto.id === produtoEditandoId ? novoProduto : produto
          );

    novaLista.sort((a, b) => a.nome.localeCompare(b.nome));
    setProdutos(novaLista);
    limparFormulario();
  }

  function handleRemoverProduto(produtoId: string) {
    const novaLista = produtos.filter((produto) => produto.id !== produtoId);
    setProdutos(novaLista);

    if (produtoEditandoId === produtoId) {
      limparFormulario();
    }
  }

  function handleEditarProduto(produtoId: string) {
    const produto = produtos.find((item) => item.id === produtoId);

    if (!produto) {
      return;
    }

    setNome(produto.nome);
    setUnidade(produto.unidade);
    setCategoria(produto.categoria);
    setProdutoEditandoId(produto.id ?? null);
    setErro("");
  }

  function handleCancelarEdicao() {
    limparFormulario();
  }

  const totalCategorias = useMemo(() => {
    return new Set(produtos.map((produto) => produto.categoria)).size;
  }, [produtos]);

  if (!hydrated) {
    return <section className={styles.page} />;
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Base de alimentos</p>
          <h1 className={styles.title}>Produtos</h1>
          <p className={styles.description}>
            Cadastre os alimentos utilizados nas preparações com unidade e
            categoria para organizar melhor o cardápio e o romaneio.
          </p>
        </div>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Produtos cadastrados</span>
            <strong className={styles.statValue}>{produtos.length}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Categorias em uso</span>
            <strong className={styles.statValue}>{totalCategorias}</strong>
          </article>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                {produtoEditandoId === null ? "Novo produto" : "Editar produto"}
              </h2>
              <p className={styles.panelText}>
                Informe nome, unidade de medida e categoria do alimento.
              </p>
            </div>

            {produtoEditandoId !== null && (
              <span className={styles.editingBadge}>Modo de edição</span>
            )}
          </div>

          <form onSubmit={handleAdicionarProduto} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="nome">Nome do produto</label>
              <input
                id="nome"
                type="text"
                placeholder="Ex.: Arroz, leite, cenoura..."
                value={nome}
                onChange={(event) => {
                  setNome(event.target.value);
                  setErro("");
                }}
              />
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="unidade">Unidade</label>
                <select
                  id="unidade"
                  value={unidade}
                  onChange={(event) => setUnidade(event.target.value)}
                >
                  {unidades.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="categoria">Categoria</label>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(event) => {
                    setCategoria(event.target.value);
                    setErro("");
                  }}
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <h3>Categorias disponíveis</h3>
                <p>
                  Essas categorias ajudam a organizar os itens para uso futuro
                  nas preparações e no romaneio.
                </p>
              </div>

              <div className={styles.categoryPreview}>
                {categorias.map((item) => (
                  <span key={item} className={styles.categoryTag}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {erro && <div className={styles.errorBox}>{erro}</div>}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                {produtoEditandoId === null ? <Plus size={18} /> : <Save size={18} />}
                <span>
                  {produtoEditandoId === null ? "Adicionar produto" : "Salvar edição"}
                </span>
              </button>

              {produtoEditandoId !== null && (
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
              <h2 className={styles.panelTitle}>Produtos cadastrados</h2>
              <p className={styles.panelText}>
                Visualize, edite ou remova os alimentos cadastrados.
              </p>
            </div>
          </div>

          <ListaProdutos
            produtos={produtos}
            produtoEditandoId={produtoEditandoId}
            onRemoverProduto={handleRemoverProduto}
            onEditarProduto={handleEditarProduto}
            onCancelarEdicao={handleCancelarEdicao}
          />
        </section>
      </div>
    </section>
  );
}
