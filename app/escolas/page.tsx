"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Escola, GrupoEscola } from "@/types/escola";
import styles from "@/app/escolas/escola.module.css";
import { readStorage, useHydrated } from "@/utils/storage";
import { criarAuditoriaRegistro } from "@/utils/auditoria";
import { formatarAtualizadoPor, formatarCriadoPor } from "@/utils/auditoria";

const gruposDisponiveis = [
  "creche 6 a 11 meses",
  "creche 1 a 3 anos",
  "pré/fund",
  "AEE",
  "EJA",
  "integral",
  "restrição alimentar",
];

export default function EscolasPage() {
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");
  const [erro, setErro] = useState("");
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);

  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  const [quantidadesPorGrupo, setQuantidadesPorGrupo] = useState<
    Record<string, string>
  >({});
  const [escolas, setEscolas] = useState<Escola[]>(() =>
    readStorage<Escola[]>("escolas", [])
  );
  const hydrated = useHydrated();

  useEffect(() => {
    localStorage.setItem("escolas", JSON.stringify(escolas));
  }, [escolas]);

  function handleToggleGrupo(grupoMarcado: string) {
    const jaSelecionado = gruposSelecionados.includes(grupoMarcado);

    if (jaSelecionado) {
      const novaLista = gruposSelecionados.filter((item) => item !== grupoMarcado);
      setGruposSelecionados(novaLista);

      const novasQuantidades = { ...quantidadesPorGrupo };
      delete novasQuantidades[grupoMarcado];
      setQuantidadesPorGrupo(novasQuantidades);
    } else {
      setGruposSelecionados([...gruposSelecionados, grupoMarcado]);
    }

    setErro("");
  }

  function handleQuantidadeGrupo(grupoMarcado: string, valor: string) {
    setQuantidadesPorGrupo({
      ...quantidadesPorGrupo,
      [grupoMarcado]: valor,
    });
    setErro("");
  }

  function handleAdicionarEscola(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomeNormalizado = nome.trim().toLowerCase();

    const escolaJaExiste = escolas.some((escola, index) => {
      const mesmoNome = escola.nome.trim().toLowerCase() === nomeNormalizado;
      const outraEscola = index !== indiceEditando;
      return mesmoNome && outraEscola;
    });

    if (!nome.trim() || !local.trim() || gruposSelecionados.length === 0) {
      setErro("Preencha nome, local e selecione pelo menos um grupo.");
      return;
    }

    if (escolaJaExiste) {
      setErro("Já existe uma escola com esse nome.");
      return;
    }

    const grupos: GrupoEscola[] = gruposSelecionados.map((item) => ({
      grupo: item,
      quantidadeAlunos: Number(quantidadesPorGrupo[item] || 0),
    }));

    const novaEscola: Escola = {
      nome: nome.trim(),
      local: local.trim(),
      grupos,
      ...criarAuditoriaRegistro(
        indiceEditando !== null ? escolas[indiceEditando] : undefined
      ),
    };

    const novaLista = [...escolas];

    if (indiceEditando === null) {
      novaLista.push(novaEscola);
    } else {
      novaLista[indiceEditando] = novaEscola;
    }

    setEscolas(novaLista);
    limparFormulario();
  }

  function handleRemoverEscola(indexParaRemover: number) {
    const novaLista = escolas.filter((_, index) => index !== indexParaRemover);
    setEscolas(novaLista);

    if (indiceEditando === indexParaRemover) {
      limparFormulario();
    }
  }

  function handleEditarEscola(indexParaEditar: number) {
    const escola = escolas[indexParaEditar];

    setNome(escola.nome);
    setLocal(escola.local);

    const gruposMarcados = escola.grupos.map((item) => item.grupo);
    const quantidades: Record<string, string> = {};

    escola.grupos.forEach((item) => {
      quantidades[item.grupo] = String(item.quantidadeAlunos);
    });

    setGruposSelecionados(gruposMarcados);
    setQuantidadesPorGrupo(quantidades);
    setIndiceEditando(indexParaEditar);
    setErro("");
  }

  function handleCancelarEdicao() {
    limparFormulario();
  }

  function limparFormulario() {
    setNome("");
    setLocal("");
    setGruposSelecionados([]);
    setQuantidadesPorGrupo({});
    setErro("");
    setIndiceEditando(null);
  }

  const totalAlunos = useMemo(() => {
    return escolas.reduce((total, escola) => {
      const totalEscola = escola.grupos.reduce(
        (soma, item) => soma + item.quantidadeAlunos,
        0
      );
      return total + totalEscola;
    }, 0);
  }, [escolas]);

  if (!hydrated) {
    return <section className={styles.page} />;
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Cadastro da rede</p>
          <h1 className={styles.title}>Escolas</h1>
          <p className={styles.description}>
            Cadastre as unidades escolares, grupos atendidos e quantidade de
            alunos por grupo para gerar romaneios com mais precisão.
          </p>
        </div>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Escolas cadastradas</span>
            <strong className={styles.statValue}>{escolas.length}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Total de alunos</span>
            <strong className={styles.statValue}>{totalAlunos}</strong>
          </article>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                {indiceEditando === null ? "Nova escola" : "Editar escola"}
              </h2>
              <p className={styles.panelText}>
                Preencha os dados da unidade e informe os grupos atendidos.
              </p>
            </div>

            {indiceEditando !== null && (
              <span className={styles.editingBadge}>Modo de edição</span>
            )}
          </div>

          <form onSubmit={handleAdicionarEscola} className={styles.form}>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="nome">Nome da escola</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex.: Escola Municipal João Ribeiro"
                  value={nome}
                  onChange={(event) => {
                    setNome(event.target.value);
                    setErro("");
                  }}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="local">Local</label>
                <input
                  id="local"
                  type="text"
                  placeholder="Ex.: Zona urbana / Povoado X"
                  value={local}
                  onChange={(event) => {
                    setLocal(event.target.value);
                    setErro("");
                  }}
                />
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <h3>Grupos atendidos</h3>
                <p>Selecione os grupos que esta escola atende.</p>
              </div>

              <div className={styles.groupsGrid}>
                {gruposDisponiveis.map((item) => {
                  const ativo = gruposSelecionados.includes(item);

                  return (
                    <label
                      key={item}
                      className={`${styles.groupOption} ${
                        ativo ? styles.groupOptionActive : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={ativo}
                        onChange={() => handleToggleGrupo(item)}
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <h3>Quantidade de alunos por grupo</h3>
                <p>
                  Informe o quantitativo apenas para os grupos selecionados.
                </p>
              </div>

              {gruposSelecionados.length === 0 ? (
                <div className={styles.emptyStateInline}>
                  Nenhum grupo selecionado ainda.
                </div>
              ) : (
                <div className={styles.quantityGrid}>
                  {gruposSelecionados.map((item) => (
                    <div key={item} className={styles.field}>
                      <label htmlFor={item}>{item}</label>
                      <input
                        id={item}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={quantidadesPorGrupo[item] || ""}
                        onChange={(event) =>
                          handleQuantidadeGrupo(item, event.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {erro && <div className={styles.errorBox}>{erro}</div>}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                {indiceEditando === null ? <Plus size={18} /> : <Pencil size={18} />}
                <span>
                  {indiceEditando === null ? "Adicionar escola" : "Salvar edição"}
                </span>
              </button>

              {indiceEditando !== null && (
                <button
                  type="button"
                  onClick={handleCancelarEdicao}
                  className={styles.warningButton}
                >
                  <X size={18} />
                  <span>Cancelar edição</span>
                </button>
              )}
            </div>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Escolas cadastradas</h2>
              <p className={styles.panelText}>
                Visualize, edite ou remova as unidades cadastradas.
              </p>
            </div>
          </div>

          {escolas.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Nenhuma escola cadastrada</h3>
              <p>
                Comece adicionando a primeira escola para montar a base do
                sistema.
              </p>
            </div>
          ) : (
            <div className={styles.schoolList}>
              {escolas.map((escola, index) => {
                const total = escola.grupos.reduce(
                  (soma, item) => soma + item.quantidadeAlunos,
                  0
                );

                const estaEditando = indiceEditando === index;

                return (
                  <article
                    key={index}
                    className={`${styles.schoolCard} ${
                      estaEditando ? styles.schoolCardEditing : ""
                    }`}
                  >
                    <div className={styles.schoolCardHeader}>
                      <div>
                        <h3 className={styles.schoolName}>{escola.nome}</h3>
                        <p className={styles.schoolLocation}>
                          Local: {escola.local}
                        </p>
                        {formatarCriadoPor(escola) && (
                          <p className={styles.signatureMeta}>{formatarCriadoPor(escola)}</p>
                        )}
                        {formatarAtualizadoPor(escola) && (
                          <p className={styles.signatureMeta}>
                            {formatarAtualizadoPor(escola)}
                          </p>
                        )}
                      </div>

                      <div className={styles.totalBadge}>{total} alunos</div>
                    </div>

                    <div className={styles.groupTags}>
                      {escola.grupos.map((item, grupoIndex) => (
                        <span key={grupoIndex} className={styles.groupTag}>
                          {item.grupo}: {item.quantidadeAlunos}
                        </span>
                      ))}
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        onClick={() => handleEditarEscola(index)}
                        className={styles.secondaryButton}
                      >
                        <Pencil size={18} />
                        <span>Editar</span>
                      </button>

                      {estaEditando && (
                        <button
                          type="button"
                          onClick={handleCancelarEdicao}
                          className={styles.warningButton}
                        >
                          <X size={18} />
                          <span>Cancelar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const confirmou = window.confirm(
                            "Tem certeza que deseja remover esta escola?"
                          );
                          if (confirmou) {
                            handleRemoverEscola(index);
                          }
                        }}
                        className={styles.dangerButton}
                      >
                        <Trash2 size={18} />
                        <span>Remover</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
