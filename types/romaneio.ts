import type { AuditoriaRegistro } from "./auditoria"

export type ItemRomaneio = {
  produto: string
  unidade: string
  quantidade: number
  grupo: string
}

export type RomaneioGerado = AuditoriaRegistro & {
  id?: string
  escola: string
  semana: string
  dataGeracao: string
  itens: ItemRomaneio[]
}
