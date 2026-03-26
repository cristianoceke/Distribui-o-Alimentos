import type { SessaoUsuario, UsuarioSistema } from "@/types/auth";

const USUARIOS_KEY = "usuarios";
const SESSAO_USUARIO_KEY = "sessao-usuario";

export function readUsuarios(): UsuarioSistema[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(USUARIOS_KEY);

  if (!raw || raw === "undefined") {
    return [];
  }

  try {
    return JSON.parse(raw) as UsuarioSistema[];
  } catch {
    return [];
  }
}

export function saveUsuarios(usuarios: UsuarioSistema[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
}

export function readSessaoUsuario(): SessaoUsuario | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(SESSAO_USUARIO_KEY);

  if (!raw || raw === "undefined") {
    return null;
  }

  try {
    return JSON.parse(raw) as SessaoUsuario;
  } catch {
    return null;
  }
}

export function saveSessaoUsuario(sessao: SessaoUsuario) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SESSAO_USUARIO_KEY, JSON.stringify(sessao));
}

export function clearSessaoUsuario() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SESSAO_USUARIO_KEY);
}

export function login(email: string, senha: string): SessaoUsuario | null {
  const usuarios = readUsuarios();

  const usuario = usuarios.find(
    (item) =>
      item.email.trim().toLowerCase() === email.trim().toLowerCase() &&
      item.senha === senha
  );

  if (!usuario) {
    return null;
  }

  const sessao: SessaoUsuario = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
  };

  saveSessaoUsuario(sessao);
  return sessao;
}
