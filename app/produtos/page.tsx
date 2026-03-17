"use client";

import { useEffect, useMemo, useState } from "react";
import ListaProdutos from "@/components/ListaProdutos";
import type { Produto } from "@/types/produto";
import styles from "@/app/produtos/produtos.module.css";

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

export default function ProdutosPage() {
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("Kg");
  const [categoria, setCategoria] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregouProdutos, setCarregouProdutos] = useState(false);
  const [erro, setErro] = useState("");
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("produtos");
    if (produtosSalvos) {
      setProdutos(JSON.parse(produtosSalvos));
    }
    setCarregouProdutos(true);
  }, []);

  useEffect(() => {
    if (!carregouProdutos) return;
    localStorage.setItem("produtos", JSON.stringify(produtos));
  }, [produtos, carregouProdutos]);

  function limparFormulario() {
    setNome("");
    setUnidade("Kg");
    setCategoria("");
    setErro("");
    setIndiceEditando(null);
  }

  function handleAdicionarProduto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomeNormalizado = nome.trim().toLowerCase();

    const produtoJaExiste = produtos.some((produto, index) => {
      const mesmoNome = produto.nome.trim().toLowerCase() === nomeNormalizado;
      const outroProduto = index !== indiceEditando;
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
      nome: nome.trim(),
      unidade,
      categoria,
    };

    const novaLista = [...produtos];

    if (indiceEditando === null) {
      novaLista.push(novoProduto);
    } else {
      novaLista[indiceEditando] = novoProduto;
    }

    novaLista.sort((a, b) => a.nome.localeCompare(b.nome));
    setProdutos(novaLista);
    limparFormulario();
  }

  function handleRemoverProduto(indexParaRemover: number) {
    const novaLista = produtos.filter((_, index) => index !== indexParaRemover);
    setProdutos(novaLista);

    if (indiceEditando === indexParaRemover) {
      limparFormulario();
    }
  }

  function handleEditarProduto(indexParaEditar: number) {
    const produto = produtos[indexParaEditar];

    setNome(produto.nome);
    setUnidade(produto.unidade);
    setCategoria(produto.categoria);
    setIndiceEditando(indexParaEditar);
    setErro("");
  }

  function handleCancelarEdicao() {
    limparFormulario();
  }

  const totalCategorias = useMemo(() => {
    return new Set(produtos.map((produto) => produto.categoria)).size;
  }, [produtos]);

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
                {indiceEditando === null ? "Novo produto" : "Editar produto"}
              </h2>
              <p className={styles.panelText}>
                Informe nome, unidade de medida e categoria do alimento.
              </p>
            </div>

            {indiceEditando !== null && (
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
                {indiceEditando === null ? "Adicionar produto" : "Salvar edição"}
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
            indiceEditando={indiceEditando}
            onRemoverProduto={handleRemoverProduto}
            onEditarProduto={handleEditarProduto}
            onCancelarEdicao={handleCancelarEdicao}
          />
        </section>
      </div>
    </section>
  );
}