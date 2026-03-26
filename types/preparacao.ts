import type { IngredientePreparacao } from "./ingredientePreparacao"
import type { AuditoriaRegistro } from "./auditoria"

export type Preparacao = AuditoriaRegistro & {
  id?: string
  nome: string
  ingredientes: IngredientePreparacao[]
}
