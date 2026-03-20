"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Escola } from "@/types/escola";
import type { Cardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import type { SaldoLicitado } from "@/types/saldo";
import type {
  ItemPedidoSemanal,
  PedidoSemanalGerado,
} from "@/types/pedido-semanal";

type ItemAjustado = ItemPedidoSemanal;

export default function PedidosSemanaisPage() {
  const semanas = ["1", "2", "3", "4"];

  const grupos = [
    "creche 6 a 11 meses",
    "creche 1 a 3 anos",
    "pré/fund",
    "AEE",
    "EJA",
    "integral",
    "restrição alimentar",
  ];

  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);
  const [saldos, setSaldos] = useState<SaldoLicitado[]>([]);

  const [grupoSelecionado, setGrupoSelecionado] = useState("");
  const [semanaSelecionada, setSemanaSelecionada] = useState("");

  const [itensAjustados, setItensAjustados] = useState<ItemAjustado[]>([]);

  const [pedidosGerados, setPedidosGerados] = useState<PedidoSemanalGerado[]>([]);
  const [carregouPedidos, setCarregouPedidos] = useState(false);
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);

  useEffect(() => {
    const escolasSalvas = localStorage.getItem("escolas");
    if (escolasSalvas) {
      setEscolas(JSON.parse(escolasSalvas));
    }

    const cardapiosSalvos = localStorage.getItem("cardapios");
    if (cardapiosSalvos) {
      setCardapios(JSON.parse(cardapiosSalvos));
    }

    const preparacoesSalvas = localStorage.getItem("preparacoes");
    if (preparacoesSalvas) {
      setPreparacoes(JSON.parse(preparacoesSalvas));
    }

    const saldosSalvos = localStorage.getItem("saldos");
    if (saldosSalvos && saldosSalvos !== "undefined") {
      try {
        setSaldos(JSON.parse(saldosSalvos));
      } catch {
        setSaldos([]);
      }
    }
  }, []);

  useEffect(() => {
    const pedidosSalvos = localStorage.getItem("pedidos-semanais");

    if (!pedidosSalvos || pedidosSalvos === "undefined") {
      setCarregouPedidos(true);
      return;
    }

    try {
      setPedidosGerados(JSON.parse(pedidosSalvos));
    } catch {
      setPedidosGerados([]);
    }

    setCarregouPedidos(true);
  }, []);

  useEffect(() => {
    if (!carregouPedidos) return;
    localStorage.setItem("pedidos-semanais", JSON.stringify(pedidosGerados));
  }, [pedidosGerados, carregouPedidos]);

  const totalAlunosGrupo = escolas.reduce((total, escola) => {
    const grupoDaEscola = escola.grupos.find(
      (grupo) => grupo.grupo === grupoSelecionado
    );

    return total + (grupoDaEscola?.quantidadeAlunos || 0);
  }, 0);

  useEffect(() => {
    if (!grupoSelecionado || !semanaSelecionada) {
      if (indiceEditando === null) {
        setItensAjustados([]);
      }
      return;
    }

    if (indiceEditando !== null) return;

    const cardapioDoGrupo = cardapios.find(
      (cardapio) =>
        cardapio.grupo === grupoSelecionado &&
        cardapio.semana === semanaSelecionada
    );

    if (!cardapioDoGrupo) {
      setItensAjustados([]);
      return;
    }

    const itensCalculados = cardapioDoGrupo.itens.flatMap((item) => {
      const preparacao = preparacoes.find(
        (prep) => prep.nome === item.preparacao
      );

      if (!preparacao) return [];

      return preparacao.ingredientes.map((ingrediente) => ({
        grupo: grupoSelecionado,
        produto: ingrediente.produto,
        unidade: ingrediente.unidade,
        quantidade: Number(ingrediente.quantidade) * totalAlunosGrupo,
        ativo: true,
      }));
    });

    const itensConsolidados = itensCalculados.reduce((acc, item) => {
      const itemExistente = acc.find(
        (itemAcc) =>
          itemAcc.produto === item.produto &&
          itemAcc.unidade === item.unidade &&
          itemAcc.grupo === item.grupo
      );

      if (itemExistente) {
        itemExistente.quantidade += item.quantidade;
      } else {
        acc.push({ ...item });
      }

      return acc;
    }, [] as ItemAjustado[]);

    setItensAjustados(itensConsolidados);
  }, [
    grupoSelecionado,
    semanaSelecionada,
    cardapios,
    preparacoes,
    totalAlunosGrupo,
    indiceEditando,
  ]);

  function toggleItem(index: number) {
    const novaLista = [...itensAjustados];
    novaLista[index].ativo = !novaLista[index].ativo;
    setItensAjustados(novaLista);
  }

  function handleAlterarQuantidade(index: number, valor: string) {
    const novaLista = [...itensAjustados];
    novaLista[index].quantidade = Number(valor || 0);
    setItensAjustados(novaLista);
  }

  function getSaldoDoItem(produto: string, grupo: string) {
    const saldo = saldos.find(
      (item) => item.produto === produto && item.grupo === grupo
    );

    if (!saldo) return 0;

    return saldo.quantidadeContratada - saldo.quantidadeUtilizada;
  }

  function getStatusDoPedido(
    produto: string,
    grupo: string,
    quantidadePedido: number
  ) {
    const saldoRestante = getSaldoDoItem(produto, grupo);

    if (saldoRestante <= 0) return "CRÍTICO";
    if (saldoRestante < quantidadePedido) return "ATENÇÃO";
    return "OK";
  }

  function atualizarSaldosComBaseNosPedidos(listaPedidos: PedidoSemanalGerado[]) {
    const saldosSalvos = localStorage.getItem("saldos");

    if (!saldosSalvos || saldosSalvos === "undefined") return;

    let listaSaldos: SaldoLicitado[] = [];

    try {
      listaSaldos = JSON.parse(saldosSalvos);
    } catch {
      return;
    }

    const novosSaldos = listaSaldos.map((saldo) => {
      let totalUtilizado = 0;

      listaPedidos.forEach((pedido) => {
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

    localStorage.setItem("saldos", JSON.stringify(novosSaldos));
    setSaldos(novosSaldos);
  }

  function handleGerarPedido() {
    if (!grupoSelecionado || !semanaSelecionada || itensAjustados.length === 0) {
      alert("Selecione grupo, semana e confira os itens.");
      return;
    }

    const confirmar = window.confirm(
      indiceEditando === null
        ? "Deseja realmente gerar este pedido semanal?"
        : "Deseja salvar a edição deste pedido semanal?"
    );

    if (!confirmar) return;

    const novoPedido: PedidoSemanalGerado = {
      grupo: grupoSelecionado,
      semana: semanaSelecionada,
      dataGeracao: new Date().toISOString(),
      totalAlunos: totalAlunosGrupo,
      itens: itensAjustados
        .filter((item) => item.ativo)
        .map((item) => ({
          ...item,
          quantidade: Number(item.quantidade.toFixed(2)),
        })),
    };

    let novaLista = [...pedidosGerados];
    let indiceFinal = 0;

    if (indiceEditando === null) {
      novaLista.push(novoPedido);
      indiceFinal = novaLista.length - 1;
    } else {
      novaLista[indiceEditando] = novoPedido;
      indiceFinal = indiceEditando;
    }

    setPedidosGerados(novaLista);
    localStorage.setItem("pedidos-semanais", JSON.stringify(novaLista));

    atualizarSaldosComBaseNosPedidos(novaLista);

    setIndiceEditando(null);

    window.open(`/pedidos-semanais/${indiceFinal}`, "_blank");
  }

  function handleEditarPedido(indexParaEditar: number) {
    const pedido = pedidosGerados[indexParaEditar];

    setGrupoSelecionado(pedido.grupo);
    setSemanaSelecionada(pedido.semana);
    setItensAjustados(pedido.itens);
    setIndiceEditando(indexParaEditar);
  }

  function handleCancelarEdicao() {
    setGrupoSelecionado("");
    setSemanaSelecionada("");
    setItensAjustados([]);
    setIndiceEditando(null);
  }

  function handleExcluirPedido(indexParaRemover: number) {
    const confirmou = window.confirm(
      "Deseja realmente excluir este pedido semanal?"
    );

    if (!confirmou) return;

    const novaLista = pedidosGerados.filter(
      (_, index) => index !== indexParaRemover
    );

    setPedidosGerados(novaLista);
    localStorage.setItem("pedidos-semanais", JSON.stringify(novaLista));

    atualizarSaldosComBaseNosPedidos(novaLista);

    if (indiceEditando === indexParaRemover) {
      handleCancelarEdicao();
    }
  }

  function formatarData(dataIso: string) {
    const data = new Date(dataIso);

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <main>
      <h1>Pedidos Semanais</h1>
      <p>Calcule o pedido da rede por grupo e semana.</p>

      <div>
        <label>Grupo</label>
        <select
          value={grupoSelecionado}
          onChange={(event) => setGrupoSelecionado(event.target.value)}
        >
          <option value="">Selecione o grupo</option>
          {grupos.map((grupo) => (
            <option key={grupo} value={grupo}>
              {grupo}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Semana</label>
        <select
          value={semanaSelecionada}
          onChange={(event) => setSemanaSelecionada(event.target.value)}
        >
          <option value="">Selecione a semana</option>
          {semanas.map((semana) => (
            <option key={semana} value={semana}>
              {semana}
            </option>
          ))}
        </select>
      </div>

      {grupoSelecionado && (
        <div>
          <h2>Resumo</h2>
          <p>Grupo: {grupoSelecionado}</p>
          <p>Semana: {semanaSelecionada || "-"}</p>
          <p>Total de alunos da rede neste grupo: {totalAlunosGrupo}</p>
        </div>
      )}

      <h2>Itens do pedido</h2>

      {itensAjustados.length === 0 ? (
        <p>Nenhum item encontrado para esse grupo e semana.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Usar</th>
              <th>Produto</th>
              <th>Unidade</th>
              <th>Quantidade</th>
              <th>Saldo disponível</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {itensAjustados.map((item, index) => {
              const saldoDisponivel = getSaldoDoItem(item.produto, item.grupo);
              const status = getStatusDoPedido(
                item.produto,
                item.grupo,
                item.quantidade
              );

              let cor = "";
              if (status === "CRÍTICO") cor = "#ffcccc";
              else if (status === "ATENÇÃO") cor = "#fff3cd";
              else cor = "#d4edda";

              return (
                <tr
                  key={`${item.grupo}-${item.produto}-${index}`}
                  style={{ backgroundColor: cor }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={item.ativo}
                      onChange={() => toggleItem(index)}
                    />
                  </td>
                  <td style={{ opacity: item.ativo ? 1 : 0.4 }}>
                    {item.produto}
                  </td>
                  <td style={{ opacity: item.ativo ? 1 : 0.4 }}>
                    {item.unidade}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantidade}
                      onChange={(event) =>
                        handleAlterarQuantidade(index, event.target.value)
                      }
                      style={{ opacity: item.ativo ? 1 : 0.4 }}
                    />
                  </td>
                  <td>{saldoDisponivel.toFixed(2)}</td>
                  <td>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button type="button" onClick={handleGerarPedido}>
        {indiceEditando === null ? "Gerar pedido semanal" : "Salvar edição"}
      </button>

      {indiceEditando !== null && (
        <button type="button" onClick={handleCancelarEdicao}>
          Cancelar edição
        </button>
      )}

      <hr />

      <h2>Histórico de pedidos</h2>

      {pedidosGerados.length === 0 ? (
        <p>Nenhum pedido semanal gerado ainda.</p>
      ) : (
        <div>
          {pedidosGerados.map((pedido, index) => (
            <div key={index}>
              <p>
                <strong>{pedido.grupo}</strong> - Semana {pedido.semana}
              </p>
              <p>{formatarData(pedido.dataGeracao)}</p>

              <div>
                <Link
                  href={`/pedidos-semanais/${index}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir
                </Link>{" "}
                <button type="button" onClick={() => handleEditarPedido(index)}>
                  Editar
                </button>{" "}
                <button
                  type="button"
                  onClick={() => handleExcluirPedido(index)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}