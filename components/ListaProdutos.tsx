"use client";

import type { Produto } from "@/types/produto";
import styles from "@/components/ListaProdutos.module.css";

type ListaProdutosProps = {
  produtos: Produto[];
  indiceEditando: number | null;
  onRemoverProduto: (index: number) => void;
  onEditarProduto: (index: number) => void;
  onCancelarEdicao: () => void;
};

export default function ListaProdutos({
  produtos,
  indiceEditando,
  onRemoverProduto,
  onEditarProduto,
  onCancelarEdicao,
}: ListaProdutosProps) {
  if (produtos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>Nenhum produto cadastrado</h3>
        <p>
          Cadastre os primeiros alimentos para começar a montar as preparações.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.productList}>
      {produtos.map((produto, index) => {
        const estaEditando = indiceEditando === index;

        return (
          <article
            key={index}
            className={`${styles.productCard} ${
              estaEditando ? styles.productCardEditing : ""
            }`}
          >
            <div className={styles.productCardHeader}>
              <div>
                <h3 className={styles.productName}>{produto.nome}</h3>
                <p className={styles.productMeta}>
                  Unidade: <strong>{produto.unidade}</strong>
                </p>
              </div>

              <span className={styles.categoryBadge}>{produto.categoria}</span>
            </div>

            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={() => onEditarProduto(index)}
                className={styles.secondaryButton}
              >
                Editar
              </button>

              {estaEditando && (
                <button
                  type="button"
                  onClick={onCancelarEdicao}
                  className={styles.warningButton}
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const confirmou = window.confirm(
                    "Tem certeza que deseja remover este produto?"
                  );
                  if (confirmou) {
                    onRemoverProduto(index);
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
  );
}