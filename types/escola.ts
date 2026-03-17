export type GrupoEscola = {
    grupo: string
    quantidadeAlunos: number
}

export type Escola = {
    nome: string
    local: string
    grupos: GrupoEscola[]
}