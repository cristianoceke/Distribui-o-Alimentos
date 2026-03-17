export type ItemRomaneio = {
    produto: string
    unidade: string
    quantidade: number
}

export type RomaneioGerado = {
    escola: string
    semana: string
    dataGeracao: string
    itens: ItemRomaneio[]
}