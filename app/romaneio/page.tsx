"use client";

import { useEffect, useState } from "react";
import type { Escola } from "@/types/escola";
import type { Cardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import type { RomaneioGerado } from "@/types/romaneio";

type ItemAjustado = {
  produto: string;
  unidade: string;
  quantidade: number;
  ativo: boolean;
};

export default function RomaneioPage() {
  const semanas = ["1", "2", "3", "4"];

  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolaSelecionada, setEscolaSelecionada] = useState("");
  const [semana, setSemana] = useState("");
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);

  const [romaneiosGerados, setRomaneiosGerados] = useState<RomaneioGerado[]>([]);
  const [carregouRomaneios, setCarregouRomaneios] = useState(false);

  const [itensAjustados, setItensAjustados] = useState<ItemAjustado[]>([]);

  useEffect(() => {
    const escolasSalvas = localStorage.getItem("escolas");

    if (escolasSalvas) {
      setEscolas(JSON.parse(escolasSalvas));
    }
  }, []);

  useEffect(() => {
    const cardapiosSalvos = localStorage.getItem("cardapios");

    if (!cardapiosSalvos) return;

    try {
      setCardapios(JSON.parse(cardapiosSalvos));
    } catch {
      setCardapios([]);
    }
  }, []);

  useEffect(() => {
    const preparacoesSalvas = localStorage.getItem("preparacoes");

    if (preparacoesSalvas) {
      setPreparacoes(JSON.parse(preparacoesSalvas));
    }
  }, []);

  useEffect(() => {
    const romaneiosSalvos = localStorage.getItem("romaneios");

    if (!romaneiosSalvos || romaneiosSalvos === "undefined") {
      setCarregouRomaneios(true);
      return;
    }

    try {
      setRomaneiosGerados(JSON.parse(romaneiosSalvos));
    } catch {
      setRomaneiosGerados([]);
    }

    setCarregouRomaneios(true);
  }, []);

  useEffect(() => {
    if (!carregouRomaneios) return;

    localStorage.setItem("romaneios", JSON.stringify(romaneiosGerados));
  }, [romaneiosGerados, carregouRomaneios]);

  const escolaEscolhida = escolas.find(
    (escola) => escola.nome === escolaSelecionada
  );

  const cardapiosDaSemana = cardapios.filter(
    (cardapio) => cardapio.semana === semana
  );

  const cardapiosDaEscola = escolaEscolhida
    ? cardapiosDaSemana.filter((cardapio) =>
        escolaEscolhida.grupos.some(
          (grupoEscola) => grupoEscola.grupo === cardapio.grupo
        )
      )
    : [];

  const itensCalculados = cardapiosDaEscola.flatMap((cardapio) => {
    const grupoDaEscola = escolaEscolhida?.grupos.find(
      (grupoEscola) => grupoEscola.grupo === cardapio.grupo
    );

    const quantidadeAlunos = grupoDaEscola?.quantidadeAlunos || 0;

    return cardapio.itens.flatMap((item) => {
      const preparacaoCompleta = preparacoes.find(
        (preparacao) => preparacao.nome === item.preparacao
      );

      if (!preparacaoCompleta) return [];

      return preparacaoCompleta.ingredientes.map((ingrediente) => ({
        produto: ingrediente.produto,
        unidade: ingrediente.unidade,
        quantidade: Number(ingrediente.quantidade) * quantidadeAlunos,
      }));
    });
  });

  const itensConsolidados = itensCalculados.reduce((acc, item) => {
    const itemExistente = acc.find(
      (itemAcc) =>
        itemAcc.produto === item.produto && itemAcc.unidade === item.unidade
    );

    if (itemExistente) {
      itemExistente.quantidade += item.quantidade;
    } else {
      acc.push({ ...item });
    }

    return acc;
  }, [] as { produto: string; unidade: string; quantidade: number }[]);

  useEffect(() => {
    const novosItens = itensConsolidados.map((item) => ({
      ...item,
      ativo: true,
    }));

    setItensAjustados(novosItens);
  }, [escolaSelecionada, semana]);

  function toggleItem(index: number) {
    const novaLista = [...itensAjustados];
    novaLista[index].ativo = !novaLista[index].ativo;
    setItensAjustados(novaLista);
  }

  function handleGerarRomaneio() {
    if (!escolaEscolhida || !semana || itensAjustados.length === 0) {
      return;
    }

    const novoRomaneio: RomaneioGerado = {
      escola: escolaEscolhida.nome,
      semana,
      dataGeracao: new Date().toISOString(),
      itens: itensAjustados
        .filter((item) => item.ativo)
        .map((item) => ({
          produto: item.produto,
          unidade: item.unidade,
          quantidade: Number(item.quantidade.toFixed(2)),
        })),
    };

    setRomaneiosGerados([...romaneiosGerados, novoRomaneio]);

    window.alert("Romaneio gerado com sucesso!");
  }

  return (
    <main>
      <h1>Gerar Romaneio</h1>
      <p>Selecione a escola e a semana para gerar o romaneio.</p>

      <div>
        <label>Escola</label>
        <select
          value={escolaSelecionada}
          onChange={(event) => setEscolaSelecionada(event.target.value)}
        >
          <option value="">Selecione uma escola</option>
          {escolas.map((escola) => (
            <option key={escola.nome} value={escola.nome}>
              {escola.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Semana</label>
        <select
          value={semana}
          onChange={(event) => setSemana(event.target.value)}
        >
          <option value="">Selecione a semana</option>
          {semanas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {escolaEscolhida && (
        <div>
          <h2>Escola escolhida</h2>
          <p>{escolaEscolhida.nome}</p>

          <h3>Grupos da escola</h3>
          {escolaEscolhida.grupos.length === 0 ? (
            <p>Nenhum grupo cadastrado.</p>
          ) : (
            <ul>
              {escolaEscolhida.grupos.map((item, index) => (
                <li key={`${item.grupo}-${index}`}>
                  {item.grupo} - {item.quantidadeAlunos} alunos
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <h3>Itens do romaneio</h3>
      {itensAjustados.length === 0 ? (
        <p>Nenhum item ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Usar</th>
              <th>Produto</th>
              <th>Unidade</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {itensAjustados.map((item, index) => (
              <tr key={`${item.produto}-${item.unidade}-${index}`}>
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
                <td style={{ opacity: item.ativo ? 1 : 0.4 }}>
                  {item.quantidade.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button type="button" onClick={handleGerarRomaneio}>
        Gerar romaneio
      </button>
    </main>
  );
}