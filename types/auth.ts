export type UsuarioSistema = {
    id: string;
    nome: string;
    email: string;
    senha: string;
    cargo?: string;
};

export type SessaoUsuario = {
    id: string;
    nome: string;
    email: string;
    cargo?: string;
};