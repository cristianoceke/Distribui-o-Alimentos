import type { AuditoriaRegistro } from "./auditoria"

export type SaldoLicitado = AuditoriaRegistro & {
  grupo: string
  produto: string
  unidade: string
  quantidadeContratada: number
  quantidadeUtilizada: number
}
