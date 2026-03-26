import type { AuditoriaRegistro } from "./auditoria"

export type Produto = AuditoriaRegistro & {
  id?: string
  nome: string
  unidade: string
  unidadeCompra?: string
  quantidadePorUnidadeCompra?: number
  perCapitaCreche?: number
  perCapitaPreFundIntegralAee?: number
  perCapitaEja?: number
  categoria: string
}
