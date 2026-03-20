"use client";

import { useEffect, useState } from "react";
import type { Escola } from "@/types/escola";
import type { Cardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import type { RomaneioGerado } from "@/types/romaneio";

type ItemCalculado = {
  produto: string;
  unidade: string;
  quantidade: number;
  grupo: string;
};

type ItemAjustado = ItemCalculado & {
  ativo: boolean;
};

export default function RomaneioPage() {
  const semanas = ["1", "2", "3", "4"];

  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolaSelecionada, setEscolaSelecionada] = useState("");
  const [semana, setSemana] = useState("");

  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);

  const [itensAjustados, setItensAjustados] = useState<ItemAjustado[]>([]);

  // carregar dados
  useEffect(() => {
    const escolasSalvas = localStorage.getItem("escolas");
    if (escolasSalvas) setEscolas(JSON.parse(escolasSalvas));

    const cardapiosSalvos = localStorage.getItem("cardapios");
    if (cardapiosSalvos) setCardapios(JSON.parse(cardapiosSalvos));

    const preparacoesSalvas = localStorage.getItem("preparacoes");
    if (preparacoesSalvas) setPreparacoes(JSON.parse(preparacoesSalvas));
  }, []);

  const escolaEscolhida = escolas.find(
    (e) => e.nome === escolaSelecionada
  );

  // 🔥 calcular itens
  useEffect(() => {
    if (!escolaEscolhida || !semana) {
      setItensAjustados([]);
      return;
    }

    const cardapiosDaSemana = cardapios.filter(
      (c) => c.semana === semana
    );

    const cardapiosDaEscola = cardapiosDaSemana.filter((cardapio) =>
      escolaEscolhida.grupos.some(
        (g) => g.grupo === cardapio.grupo
      )
    );

    const itensCalculados: ItemCalculado[] = [];

    cardapiosDaEscola.forEach((cardapio) => {
      const grupoDaEscola = escolaEscolhida.grupos.find(
        (g) => g.grupo === cardapio.grupo
      );

      const qtdAlunos = grupoDaEscola?.quantidadeAlunos || 0;

      cardapio.itens.forEach((item) => {
        const preparacao = preparacoes.find(
          (p) => p.nome === item.preparacao
        );

        if (!preparacao) return;

        preparacao.ingredientes.forEach((ing) => {
          itensCalculados.push({
            produto: ing.produto,
            unidade: ing.unidade,
            quantidade: Number(ing.quantidade) * qtdAlunos,
            grupo: cardapio.grupo,
          });
        });
      });
    });

    // 🔥 consolidar por produto + grupo
    const consolidados: ItemCalculado[] = [];

    itensCalculados.forEach((item) => {
      const existente = consolidados.find(
        (i) =>
          i.produto === item.produto &&
          i.unidade === item.unidade &&
          i.grupo === item.grupo
      );

      if (existente) {
        existente.quantidade += item.quantidade;
      } else {
        consolidados.push({ ...item });
      }
    });

    // transformar em ajustável
    setItensAjustados(
      consolidados.map((i) => ({
        ...i,
        ativo: true,
      }))
    );
  }, [escolaSelecionada, semana, cardapios, preparacoes]);

  function toggleItem(index: number) {
    const novaLista = [...itensAjustados];
    novaLista[index].ativo = !novaLista[index].ativo;
    setItensAjustados(novaLista);
  }

  function handleGerarRomaneio() {
    if (!escolaEscolhida || !semana || itensAjustados.length === 0) {
      alert("Preencha os dados.");
      return;
    }

    const confirmar = window.confirm("Deseja gerar o romaneio?");
    if (!confirmar) return;

    const romaneiosSalvos = localStorage.getItem("romaneios");

    let lista: RomaneioGerado[] = [];

    if (romaneiosSalvos && romaneiosSalvos !== "undefined") {
      try {
        lista = JSON.parse(romaneiosSalvos);
      } catch {
        lista = [];
      }
    }

    const novo: RomaneioGerado = {
      escola: escolaEscolhida.nome,
      semana,
      dataGeracao: new Date().toISOString(),
      itens: itensAjustados
        .filter((i) => i.ativo)
        .map((i) => ({
          produto: i.produto,
          unidade: i.unidade,
          quantidade: Number(i.quantidade.toFixed(2)),
          grupo: i.grupo,
        })),
    };

    const novaLista = [...lista, novo];

    localStorage.setItem("romaneios", JSON.stringify(novaLista));

    const index = novaLista.length - 1;

    window.open(`/historico-romaneios/${index}`, "_blank");
  }

  return (
    <main>
      <h1>Gerar Romaneio</h1>

      <div>
        <label>Escola</label>
        <select
          value={escolaSelecionada}
          onChange={(e) => setEscolaSelecionada(e.target.value)}
        >
          <option value="">Selecione</option>
          {escolas.map((e) => (
            <option key={e.nome} value={e.nome}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Semana</label>
        <select
          value={semana}
          onChange={(e) => setSemana(e.target.value)}
        >
          <option value="">Selecione</option>
          {semanas.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <h3>Itens</h3>

      {itensAjustados.length === 0 ? (
        <p>Nenhum item.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Usar</th>
              <th>Grupo</th>
              <th>Produto</th>
              <th>Unidade</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {itensAjustados.map((item, index) => (
              <tr key={`${item.produto}-${item.grupo}-${index}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={item.ativo}
                    onChange={() => toggleItem(index)}
                  />
                </td>
                <td>{item.grupo}</td>
                <td>{item.produto}</td>
                <td>{item.unidade}</td>
                <td>{item.quantidade.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={handleGerarRomaneio}>
        Gerar Romaneio
      </button>
    </main>
  );
}