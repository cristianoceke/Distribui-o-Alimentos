import type { Produto } from "@/types/produto";

export type CategoriaPerCapita = "creche" | "preFundIntegralAee" | "eja";

function normalizarTexto(valor: string) {
  return valor.trim().toLowerCase();
}

export function findProdutoByName(produtos: Produto[], nome: string) {
  return produtos.find((produto) => normalizarTexto(produto.nome) === normalizarTexto(nome));
}

export function getDescricaoCompra(produto: Produto) {
  if (!produto.unidadeCompra || !produto.quantidadePorUnidadeCompra) {
    return null;
  }

  return `${produto.unidadeCompra} (${produto.quantidadePorUnidadeCompra} ${produto.unidade} por ${produto.unidadeCompra})`;
}

export function getCategoriaPerCapitaDoGrupo(grupo: string): CategoriaPerCapita {
  const grupoNormalizado = normalizarTexto(grupo);

  if (grupoNormalizado.includes("creche")) {
    return "creche";
  }

  if (grupoNormalizado.includes("eja")) {
    return "eja";
  }

  return "preFundIntegralAee";
}

export function getPerCapitaProdutoPorGrupo(
  produto: Produto | undefined,
  grupo: string
) {
  if (!produto) {
    return 0;
  }

  const categoria = getCategoriaPerCapitaDoGrupo(grupo);

  if (categoria === "creche") {
    return Number(produto.perCapitaCreche || 0);
  }

  if (categoria === "eja") {
    return Number(produto.perCapitaEja || 0);
  }

  return Number(produto.perCapitaPreFundIntegralAee || 0);
}

export function getEquivalenciaCompra(produto: Produto | undefined, quantidadeBase: number) {
  if (
    !produto ||
    !produto.unidadeCompra ||
    !produto.quantidadePorUnidadeCompra ||
    produto.quantidadePorUnidadeCompra <= 0
  ) {
    return null;
  }

  return {
    quantidade: quantidadeBase / produto.quantidadePorUnidadeCompra,
    unidadeCompra: produto.unidadeCompra,
  };
}

export function formatarQuantidade(valor: number) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatarQuantidadeComUnidade(quantidade: number, unidade: string) {
  return `${formatarQuantidade(quantidade)} ${unidade}`;
}

export function formatarEquivalenciaCompra(produto: Produto | undefined, quantidadeBase: number) {
  const equivalencia = getEquivalenciaCompra(produto, quantidadeBase);

  if (!equivalencia) {
    return null;
  }

  return `${formatarQuantidade(equivalencia.quantidade)} ${equivalencia.unidadeCompra}`;
}

export function getResumoQuantidade(
  produto: Produto | undefined,
  quantidadeBase: number,
  unidadeBase: string
) {
  return {
    base: formatarQuantidadeComUnidade(quantidadeBase, unidadeBase),
    compra: formatarEquivalenciaCompra(produto, quantidadeBase),
  };
}
