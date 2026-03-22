import type { IngredientePreparacao } from "./ingredientePreparacao"

export type Preparacao = {
  id?: string
  nome: string
  ingredientes: IngredientePreparacao[]
}
