"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, X, Boxes } from "lucide-react";
import type { Produto } from "@/types/produto";
import type { SaldoLicitado } from "@/types/saldo";
import type { PedidoSemanalGerado } from "@/types/pedido-semanal";
import styles from "@/app/saldos/saldos.module.css";

export default function SaldosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [saldos, setSaldos] = useState<SaldoLicitado[]>([]);
  const [carregouSaldos, setCarregouSaldos] = useState(false);

  const [grupo, setGrupo] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);

  const gruposFixos = [
    "creche 6 a 11 meses",
    "creche 1 a 3 anos",
    "pré/fund",
    "AEE",
    "EJA",
    "integral",
    "restrição alimentar",
  ];

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("produtos");
    if (produtosSalvos) {
      setProdutos(JSON.parse(produtosSalvos));
    }
  }, []);

  useEffect(() => {
    const saldosSalvos = localStorage.getItem("saldos");

    if (!saldosSalvos || saldosSalvos === "undefined") {
      setCarregouSaldos(true);
      return;
    }

    try {
      setSaldos(JSON.parse(saldosSalvos));
    } catch {
      setSaldos([]);
    }

    setCarregouSaldos(true);
  }, []);

  useEffect(() => {
    if (!carregouSaldos) return;
    localStorage.setItem("saldos", JSON.stringify(saldos));
  }, [saldos, carregouSaldos]);

  function recalcularUtilizado(listaBase: SaldoLicitado[]) {
    const pedidosSalvos = localStorage.getItem("pedidos-semanais");

    if (!pedidosSalvos || pedidosSalvos === "undefined") {
      return listaBase.map((saldo) => ({
        ...saldo,
        quantidadeUtilizada: 0,
      }));
    }

    let pedidos: PedidoSemanalGerado[] = [];

    try {
      pedidos = JSON.parse(pedidosSalvos);
    } catch {
      return listaBase;
    }

    return listaBase.map((saldo) => {
      let totalUtilizado = 0;

      pedidos.forEach((pedido) => {
        pedido.itens.forEach((item) => {
          if (item.produto === saldo.produto && item.grupo === saldo.grupo) {
            totalUtilizado += item.quantidade;
          }
        });
      });

      return {
        ...saldo,
        quantidadeUtilizada: totalUtilizado,
      };
    });
  }

  useEffect(() => {
    if (!carregouSaldos) return;
    setSaldos((atual) => recalcularUtilizado(atual));
  }, [carregouSaldos]);

  function limparFormulario() {
    setGrupo("");
    setProdutoSelecionado("");
    setQuantidade("");
    setIndiceEditando(null);
  }

  function handleSalvarSaldo() {
    if (!grupo || !produtoSelecionado || !quantidade) {
      alert("Preencha todos os campos.");
      return;
    }

    const produto = produtos.find((p) => p.nome === produtoSelecionado);
    if (!produto) return;

    const jaExiste = saldos.some((item, index) => {
      const mesmoGrupo = item.grupo === grupo;
      const mesmoProduto = item.produto === produto.nome;
      const outroRegistro = index !== indiceEditando;

      return mesmoGrupo && mesmoProduto && outroRegistro;
    });

    if (jaExiste) {
      alert("Já existe saldo cadastrado para esse grupo e produto.");
      return;
    }

    const novoSaldo: SaldoLicitado = {
      grupo,
      produto: produto.nome,
      unidade: produto.unidade,
      quantidadeContratada: Number(quantidade),
      quantidadeUtilizada: 0,
    };

    let novaLista = [...saldos];

    if (indiceEditando === null) {
      novaLista.push(novoSaldo);
    } else {
      novaLista[indiceEditando] = {
        ...novoSaldo,
        quantidadeUtilizada: saldos[indiceEditando].quantidadeUtilizada,
      };
    }

    const listaRecalculada = recalcularUtilizado(novaLista);
    setSaldos(listaRecalculada);
    limparFormulario();
  }

  function handleEditar(indexParaEditar: number) {
    const saldo = saldos[indexParaEditar];

    setGrupo(saldo.grupo);
    setProdutoSelecionado(saldo.produto);
    setQuantidade(String(saldo.quantidadeContratada));
    setIndiceEditando(indexParaEditar);
  }

  function handleRemover(indexParaRemover: number) {
    const confirmou = window.confirm("Deseja remover este item?");
    if (!confirmou) return;

    const novaLista = saldos.filter((_, index) => index !== indexParaRemover);
    setSaldos(novaLista);

    if (indiceEditando === indexParaRemover) {
      limparFormulario();
    }
  }

  function handleCancelarEdicao() {
    limparFormulario();
  }

  function getStatus(item: SaldoLicitado) {
    const saldoRestante = item.quantidadeContratada - item.quantidadeUtilizada;
    const percentual =
      item.quantidadeContratada > 0
        ? (saldoRestante / item.quantidadeContratada) * 100
        : 0;

    if (saldoRestante <= 0) return "critico";
    if (percentual <= 20) return "atencao";
    return "ok";
  }

  const totalSaldoCadastrado = useMemo(() => saldos.length, [saldos]);

  const totalProdutosComCritico = useMemo(() => {
    return saldos.filter((item) => getStatus(item) === "critico").length;
  }, [saldos]);

  function getStatusLabel(status: string) {
    if (status === "critico") return "CRÍTICO";
    if (status === "atencao") return "ATENÇÃO";
    return "OK";
  }

  function getStatusClass(status: string) {
    if (status === "critico") return styles.statusCritical;
    if (status === "atencao") return styles.statusWarning;
    return styles.statusOk;
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Controle de consumo</p>
          <h1 className={styles.title}>Saldo da Licitação</h1>
          <p className={styles.description}>
            Cadastre a quantidade licitada por grupo e produto, acompanhe o
            consumo e identifique rapidamente itens em atenção.
          </p>
        </div>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Saldos cadastrados</span>
            <strong className={styles.statValue}>{totalSaldoCadastrado}</strong>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Itens críticos</span>
            <strong className={styles.statValue}>{totalProdutosComCritico}</strong>
          </article>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                {indiceEditando === null ? "Novo saldo" : "Editar saldo"}
              </h2>
              <p className={styles.panelText}>
                Informe grupo, produto e quantidade licitada.
              </p>
            </div>

            {indiceEditando !== null && (
              <span className={styles.editingBadge}>Modo de edição</span>
            )}
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="grupo">Grupo</label>
              <select
                id="grupo"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
              >
                <option value="">Selecione</option>
                {gruposFixos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="produto">Produto</label>
              <select
                id="produto"
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
              >
                <option value="">Selecione</option>
                {produtos.map((produto) => (
                  <option key={produto.nome} value={produto.nome}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="quantidade">Quantidade licitada</label>
              <input
                id="quantidade"
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex.: 150"
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleSalvarSaldo}
                className={styles.primaryButton}
              >
                {indiceEditando === null ? <Plus size={18} /> : <Save size={18} />}
                <span>
                  {indiceEditando === null ? "Adicionar saldo" : "Salvar edição"}
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
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Controle de saldo</h2>
              <p className={styles.panelText}>
                Visualize o saldo contratado, utilizado e restante por item.
              </p>
            </div>
          </div>

          {saldos.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Nenhum saldo cadastrado</h3>
              <p>Cadastre o primeiro saldo para começar o controle.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Produto</th>
                    <th>Unidade</th>
                    <th>Contratado</th>
                    <th>Utilizado</th>
                    <th>Saldo</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {saldos.map((item, index) => {
                    const saldoRestante =
                      item.quantidadeContratada - item.quantidadeUtilizada;

                    const status = getStatus(item);

                    return (
                      <tr key={`${item.grupo}-${item.produto}-${index}`}>
                        <td className={styles.capitalize}>{item.grupo}</td>
                        <td>
                          <div className={styles.productCell}>
                            <span className={styles.productIcon}>
                              <Boxes size={16} />
                            </span>
                            <span>{item.produto}</span>
                          </div>
                        </td>
                        <td>{item.unidade}</td>
                        <td>{item.quantidadeContratada}</td>
                        <td>{item.quantidadeUtilizada.toFixed(2)}</td>
                        <td>{saldoRestante.toFixed(2)}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              onClick={() => handleEditar(index)}
                              className={styles.secondaryButton}
                            >
                              <Pencil size={18} />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemover(index)}
                              className={styles.dangerButton}
                            >
                              <Trash2 size={18} />
                              <span>Remover</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}