export type ItemRomaneio = {
  produto: string
  unidade: string
  quantidade: number
  grupo: string
}

export type RomaneioGerado = {
  escola: string
  semana: string
  dataGeracao: string
  itens: ItemRomaneio[]
}