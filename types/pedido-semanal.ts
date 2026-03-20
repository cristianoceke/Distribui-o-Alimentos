export type ItemPedidoSemanal = {
  grupo: string
  produto: string
  unidade: string
  quantidade: number
  ativo: boolean
}

export type PedidoSemanalGerado = {
  grupo: string
  semana: string
  dataGeracao: string
  totalAlunos: number
  itens: ItemPedidoSemanal[]
}