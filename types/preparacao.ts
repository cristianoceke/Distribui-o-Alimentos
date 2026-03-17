import type { IngredientePreparacao } from "./ingredientePreparacao"

export type Preparacao = {
    nome: string
    ingredientes: IngredientePreparacao[]
}