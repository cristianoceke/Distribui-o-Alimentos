export type AssinaturaUsuario = {
  id: string;
  nome: string;
  email: string;
};

export type AuditoriaRegistro = {
  criadoEm?: string;
  criadoPor?: AssinaturaUsuario;
  atualizadoEm?: string;
  atualizadoPor?: AssinaturaUsuario;
};
