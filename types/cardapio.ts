import type { AuditoriaRegistro } from "./auditoria"

export type ItemCardapio = {
    dia: string
    refeicao: string
    preparacao: string
}

export type Cardapio = AuditoriaRegistro & {
    grupo: string
    semana: string
    itens: ItemCardapio[]
}
