import type { AuditoriaRegistro, AssinaturaUsuario } from "@/types/auditoria";
import { readSessaoUsuario } from "@/utils/auth";

export function getAssinaturaUsuarioAtual(): AssinaturaUsuario | null {
  const sessao = readSessaoUsuario();

  if (!sessao) {
    return null;
  }

  return {
    id: sessao.id,
    nome: sessao.nome,
    email: sessao.email,
  };
}

export function criarAuditoriaRegistro(
  registroExistente?: AuditoriaRegistro
): AuditoriaRegistro {
  const usuarioAtual = getAssinaturaUsuarioAtual();
  const agora = new Date().toISOString();

  if (!usuarioAtual) {
    return {
      criadoEm: registroExistente?.criadoEm,
      criadoPor: registroExistente?.criadoPor,
      atualizadoEm: registroExistente?.atualizadoEm,
      atualizadoPor: registroExistente?.atualizadoPor,
    };
  }

  return {
    criadoEm: registroExistente?.criadoEm ?? agora,
    criadoPor: registroExistente?.criadoPor ?? usuarioAtual,
    atualizadoEm: agora,
    atualizadoPor: usuarioAtual,
  };
}

export function formatarAssinaturaRegistro(registro?: AuditoriaRegistro | null) {
  if (!registro) {
    return null;
  }

  if (registro.atualizadoPor?.nome) {
    return `Atualizado por ${registro.atualizadoPor.nome}`;
  }

  if (registro.criadoPor?.nome) {
    return `Criado por ${registro.criadoPor.nome}`;
  }

  return null;
}

export function formatarCriadoPor(registro?: AuditoriaRegistro | null) {
  if (!registro?.criadoPor?.nome) {
    return null;
  }

  return `Criado por ${registro.criadoPor.nome}`;
}

export function formatarAtualizadoPor(registro?: AuditoriaRegistro | null) {
  if (!registro?.atualizadoPor?.nome) {
    return null;
  }

  return `Ultima edicao por ${registro.atualizadoPor.nome}`;
}
