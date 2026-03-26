"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import ListaProdutos from "@/components/ListaProdutos";
import type { Produto } from "@/types/produto";
import styles from "@/app/produtos/produtos.module.css";
import { createId, readStorage, useHydrated } from "@/utils/storage";
import { criarAuditoriaRegistro } from "@/utils/auditoria";

const unidades = ["Kg", "g", "litro", "unidade"];
const unidadesCompra = ["", "pacote", "fardo", "caixa", "saco", "bandeja", "unidade"];

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
  const [unidadeCompra, setUnidadeCompra] = useState("");
  const [quantidadePorUnidadeCompra, setQuantidadePorUnidadeCompra] = useState("");
  const [perCapitaCreche, setPerCapitaCreche] = useState("");
  const [perCapitaPreFundIntegralAee, setPerCapitaPreFundIntegralAee] = useState("");
  const [perCapitaEja, setPerCapitaEja] = useState("");
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
    setUnidadeCompra("");
    setQuantidadePorUnidadeCompra("");
    setPerCapitaCreche("");
    setPerCapitaPreFundIntegralAee("");
    setPerCapitaEja("");
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

    if (!perCapitaCreche || !perCapitaPreFundIntegralAee || !perCapitaEja) {
      setErro("Informe as tres per capitas do produto.");
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
      unidadeCompra: unidadeCompra || undefined,
      quantidadePorUnidadeCompra: unidadeCompra
        ? Number(quantidadePorUnidadeCompra || 0)
        : undefined,
      perCapitaCreche: Number(perCapitaCreche || 0),
      perCapitaPreFundIntegralAee: Number(perCapitaPreFundIntegralAee || 0),
      perCapitaEja: Number(perCapitaEja || 0),
      categoria,
      ...criarAuditoriaRegistro(
        produtos.find((produto) => produto.id === produtoEditandoId)
      ),
    };

    if (unidadeCompra && !quantidadePorUnidadeCompra) {
      setErro("Informe quanto existe em cada unidade de compra.");
      return;
    }

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
    setUnidadeCompra(produto.unidadeCompra ?? "");
    setQuantidadePorUnidadeCompra(
      produto.quantidadePorUnidadeCompra
        ? String(produto.quantidadePorUnidadeCompra)
        : ""
    );
    setCategoria(produto.categoria);
    setPerCapitaCreche(
      produto.perCapitaCreche ? String(produto.perCapitaCreche) : ""
    );
    setPerCapitaPreFundIntegralAee(
      produto.perCapitaPreFundIntegralAee
        ? String(produto.perCapitaPreFundIntegralAee)
        : ""
    );
    setPerCapitaEja(produto.perCapitaEja ? String(produto.perCapitaEja) : "");
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
                Informe nome, unidade, categoria e as tres per capitas usadas no calculo.
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

            <div className={`${styles.fieldGrid} ${styles.alignedFieldGrid}`}>
              <div className={styles.field}>
                <label htmlFor="unidadeCompra" className={styles.alignedLabel}>
                  Compra por
                </label>
                <select
                  id="unidadeCompra"
                  value={unidadeCompra}
                  onChange={(event) => {
                    setUnidadeCompra(event.target.value);

                    if (!event.target.value) {
                      setQuantidadePorUnidadeCompra("");
                    }
                  }}
                >
                  <option value="">Sem conversão</option>
                  {unidadesCompra
                    .filter((item) => item)
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </div>

              <div className={styles.field}>
                <label
                  htmlFor="quantidadePorUnidadeCompra"
                  className={styles.alignedLabel}
                >
                  Quantidade por embalagem
                </label>
                <input
                  id="quantidadePorUnidadeCompra"
                  type="number"
                  step="0.01"
                  value={quantidadePorUnidadeCompra}
                  onChange={(event) => setQuantidadePorUnidadeCompra(event.target.value)}
                  placeholder={`Ex.: 0.5 ${unidade}`}
                  disabled={!unidadeCompra}
                />
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <h3>Per capitas por publico</h3>
                <p>
                  Defina a quantidade base para creche, pre/fund. integral/AEE e EJA.
                </p>
              </div>

              <div className={`${styles.fieldGrid} ${styles.alignedFieldGrid}`}>
                <div className={styles.field}>
                  <label htmlFor="perCapitaCreche" className={styles.alignedLabel}>
                    Per capita creche
                  </label>
                  <input
                    id="perCapitaCreche"
                    type="number"
                    min="0"
                    step="0.01"
                    value={perCapitaCreche}
                    onChange={(event) => setPerCapitaCreche(event.target.value)}
                    placeholder={`Ex.: 0.08 ${unidade}`}
                  />
                </div>

                <div className={styles.field}>
                  <label
                    htmlFor="perCapitaPreFundIntegralAee"
                    className={styles.alignedLabel}
                  >
                    Per capita pre/fund. integral/AEE
                  </label>
                  <input
                    id="perCapitaPreFundIntegralAee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={perCapitaPreFundIntegralAee}
                    onChange={(event) =>
                      setPerCapitaPreFundIntegralAee(event.target.value)
                    }
                    placeholder={`Ex.: 0.1 ${unidade}`}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="perCapitaEja">Per capita EJA</label>
                <input
                  id="perCapitaEja"
                  type="number"
                  min="0"
                  step="0.01"
                  value={perCapitaEja}
                  onChange={(event) => setPerCapitaEja(event.target.value)}
                  placeholder={`Ex.: 0.12 ${unidade}`}
                />
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
