import type { AuditoriaRegistro } from "./auditoria"

export type GrupoEscola = {
    grupo: string
    quantidadeAlunos: number
}

export type Escola = AuditoriaRegistro & {
    nome: string
    local: string
    grupos: GrupoEscola[]
}
