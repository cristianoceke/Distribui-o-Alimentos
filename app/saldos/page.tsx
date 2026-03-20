"use client";

import { useEffect, useState } from "react";
import type { Produto } from "@/types/produto";
import type { SaldoLicitado } from "@/types/saldo";
import type { PedidoSemanalGerado } from "@/types/pedido-semanal";

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

    setGrupo("");
    setProdutoSelecionado("");
    setQuantidade("");
    setIndiceEditando(null);
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
      setGrupo("");
      setProdutoSelecionado("");
      setQuantidade("");
      setIndiceEditando(null);
    }
  }

  function handleCancelarEdicao() {
    setGrupo("");
    setProdutoSelecionado("");
    setQuantidade("");
    setIndiceEditando(null);
  }

  function getStatus(item: SaldoLicitado) {
    const saldoRestante = item.quantidadeContratada - item.quantidadeUtilizada;
    const percentual = item.quantidadeContratada > 0
      ? (saldoRestante / item.quantidadeContratada) * 100
      : 0;

    if (saldoRestante <= 0) return "critico";
    if (percentual <= 20) return "atencao";
    return "ok";
  }

  return (
    <main>
      <h1>Saldo da Licitação</h1>
      <p>Cadastre a quantidade licitada por grupo e produto.</p>

      <h2>{indiceEditando === null ? "Novo cadastro" : "Editar saldo"}</h2>

      <div>
        <label>Grupo</label>
        <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
          <option value="">Selecione</option>
          {gruposFixos.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Produto</label>
        <select
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

      <div>
        <label>Quantidade licitada</label>
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
      </div>

      <button type="button" onClick={handleSalvarSaldo}>
        {indiceEditando === null ? "Adicionar" : "Salvar edição"}
      </button>

      {indiceEditando !== null && (
        <button type="button" onClick={handleCancelarEdicao}>
          Cancelar edição
        </button>
      )}

      <h2>Controle de saldo</h2>

      {saldos.length === 0 ? (
        <p>Nenhum saldo cadastrado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Produto</th>
              <th>Unidade</th>
              <th>Contratado</th>
              <th>Utilizado</th>
              <th>Saldo</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {saldos.map((item, index) => {
              const saldoRestante =
                item.quantidadeContratada - item.quantidadeUtilizada;

              const status = getStatus(item);

              let cor = "";
              let textoStatus = "";

              if (status === "critico") {
                cor = "#ffcccc";
                textoStatus = "CRÍTICO";
              } else if (status === "atencao") {
                cor = "#fff3cd";
                textoStatus = "ATENÇÃO";
              } else {
                cor = "#d4edda";
                textoStatus = "OK";
              }

              return (
                <tr
                  key={`${item.grupo}-${item.produto}-${index}`}
                  style={{ backgroundColor: cor }}
                >
                  <td>{item.grupo}</td>
                  <td>{item.produto}</td>
                  <td>{item.unidade}</td>
                  <td>{item.quantidadeContratada}</td>
                  <td>{item.quantidadeUtilizada.toFixed(2)}</td>
                  <td>{saldoRestante.toFixed(2)}</td>
                  <td>{textoStatus}</td>
                  <td>
                    <button type="button" onClick={() => handleEditar(index)}>
                      Editar
                    </button>{" "}
                    <button type="button" onClick={() => handleRemover(index)}>
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}