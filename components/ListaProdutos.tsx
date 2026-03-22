"use client";

import { Pencil, Trash2, X, Package2 } from "lucide-react";
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
        <p>Adicione o primeiro produto para montar sua base de alimentos.</p>
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
              <div className={styles.productMainInfo}>
                <div className={styles.productIcon}>
                  <Package2 size={18} />
                </div>

                <div>
                  <h3 className={styles.productName}>{produto.nome}</h3>
                  <p className={styles.productMeta}>
                    Unidade: {produto.unidade}
                  </p>
                </div>
              </div>

              <span className={styles.categoryBadge}>{produto.categoria}</span>
            </div>

            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={() => onEditarProduto(index)}
                className={styles.secondaryButton}
              >
                <Pencil size={18} />
                <span>Editar</span>
              </button>

              {estaEditando && (
                <button
                  type="button"
                  onClick={onCancelarEdicao}
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
                    "Tem certeza que deseja remover este produto?"
                  );

                  if (confirmou) {
                    onRemoverProduto(index);
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
  );
}