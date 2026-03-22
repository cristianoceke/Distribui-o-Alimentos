export type ItemRomaneio = {
  produto: string
  unidade: string
  quantidade: number
  grupo: string
}

export type RomaneioGerado = {
  id?: string
  escola: string
  semana: string
  dataGeracao: string
  itens: ItemRomaneio[]
}
