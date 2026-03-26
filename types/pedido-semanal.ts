import type { AuditoriaRegistro } from "./auditoria"

export type ItemPedidoSemanal = {
  grupo: string
  produto: string
  unidade: string
  quantidade: number
  ativo: boolean
}

export type PedidoSemanalGerado = AuditoriaRegistro & {
  id?: string
  grupo: string
  semana: string
  dataGeracao: string
  totalAlunos: number
  itens: ItemPedidoSemanal[]
}
