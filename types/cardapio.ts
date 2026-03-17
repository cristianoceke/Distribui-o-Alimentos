export type ItemCardapio = {
    dia: string
    refeicao: string
    preparacao: string
}

export type Cardapio = {
    grupo: string
    semana: string
    itens: ItemCardapio[]
}