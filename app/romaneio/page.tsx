"use client";

import { useEffect, useState } from "react";
import type { Escola } from "@/types/escola";
import type { Cardapio } from "@/types/cardapio";
import type { Preparacao } from "@/types/preparacao";
import type { RomaneioGerado } from "@/types/romaneio";

export default function RomaneioPage() {
  const selSemanas = ["1", "2", "3", "4"]

  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolaSelecionada, setEscolaSelecionada] = useState("");
  const [semana, setSemana] = useState("");
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);
  const [romaneiosGerados, setRomaneiosGerados] = useState<RomaneioGerado[]>([]);
  const [carregouRomaneios, setCarregouRomaneios] = useState(false);

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

  useEffect(()=> {
    const romaneiosSalvos = localStorage.getItem("romaneios");

    if (!romaneiosSalvos || romaneiosSalvos === "undefined") {
      setCarregouRomaneios(true);
      return;
    }
    try{
      setRomaneiosGerados(JSON.parse(romaneiosSalvos));
    } catch {
      setRomaneiosGerados([]);
    }

    setCarregouRomaneios(true);
  }, []);

  useEffect(()=> {
    if(!carregouRomaneios) return;

    localStorage.setItem("romaneios",JSON.stringify(romaneiosGerados));
  }, [romaneiosGerados, carregouRomaneios])

  const escolaEscolhida = escolas.find(
    (escola) => escola.nome === escolaSelecionada
  );

  const cardapiosDaSemana = cardapios.filter(
    (cardapio) => cardapio.semana === semana
  );

  const cardapiosDaEscola = escolaEscolhida
    ? cardapiosDaSemana.filter((cardapios) =>
      escolaEscolhida.grupos.some((grupoEscola) => grupoEscola.grupo === cardapios.grupo)
    ) : [];

  const preparacoesDoRomaneio = cardapiosDaEscola.flatMap((cardapio) =>
    cardapio.itens
      .map((item) =>
        preparacoes.find((preparacao) => preparacao.nome === item.preparacao)
      )
      .filter((preparacao): preparacao is Preparacao => Boolean(preparacao))
  )

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
  }, [] as typeof itensCalculados);

  function handleGerarRomaneio(){
    if(!escolaEscolhida || !semana || itensConsolidados.length === 0 ){
      return;
    }

    const novoRomaneio: RomaneioGerado = {
      escola: escolaEscolhida.nome,
      semana,
      dataGeracao: new Date().toISOString(),
      itens: itensConsolidados.map((item)=> ({
          produto: item.produto,
          unidade: item.unidade,
          quantidade: Number(item.quantidade.toFixed(2)),
      })),
    };
    setRomaneiosGerados([...romaneiosGerados, novoRomaneio]);
    window.alert("Romaneio gerado com sucesso!")
  }

  return (
    <main>
      <h1>Gerar Romaneio</h1>
      <p>Aqui vamos selecionar a escola e a semana para gerar o romaneio.</p>

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
          onChange={(event) => {
            setSemana(event.target.value)
          }}
        >
          <option value="">Selecione a semana</option>
          {selSemanas.map((item)=>(
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={handleGerarRomaneio}>Gerar romaneio</button>

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
                <li key={index}>
                  {item.grupo} - {item.quantidadeAlunos} alunos
                </li>
              ))}
            </ul>
          )}

          <h3>Cardápios encontrados para a semana {semana}</h3>
          <p>{cardapiosDaSemana.length} cardápios da semana</p>

          <h3>Cardápios aplicáveis para esta escola</h3>
          <p>{cardapiosDaEscola.length} cardápios</p>
          {cardapiosDaEscola.length === 0 ? (
            <p>Nenhum cardápio aplicável encontrado.</p>
          ) : (
            <ul>
              {cardapiosDaEscola.map((cardapio, index) => (
                <li key={index}>
                  {cardapio.grupo} - semana {cardapio.semana} - {cardapio.itens.length} itens
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <h3>Preparações encontradas</h3>
      {cardapiosDaEscola.length === 0 ? (
        <p>Nenhuma preparaçao encontrada.</p>
      ) : (
        <ul>
          {cardapiosDaEscola.flatMap((cardapio) =>
            cardapio.itens.map((item, index) => (
              <li key={index}>
                {item.dia} - {item.refeicao} - {item.preparacao}
              </li>
            ))
          )}
        </ul>
      )}

      <h3>Preparações completas encontradas</h3>
      {preparacoesDoRomaneio.length === 0 ? (
        <p>Nenhuma preparacao completa encontrada.</p>
      ) : (
        <ul>
          {preparacoesDoRomaneio.map((preparacao, index) => (
            <li key={index}>
              {preparacao.nome} - {preparacao.ingredientes.length} ingredientes
            </li>
          ))}
        </ul>
      )}

      <h3>Itens calculados do romaneio</h3>
      {itensCalculados.length === 0 ? (
        <p>Nenhum item calculado ainda.</p>
      ) : (
        <ul>
          {itensCalculados.map((item, index) => (
            <li key={index}>
              {item.produto} - {item.unidade} - {item.quantidade}
            </li>
          ))}
        </ul>
      )}

      <h3>Itens consolidados do romaneio</h3>
      {itensConsolidados.length === 0 ? (
        <p>Nenhum item consolidado ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Descrição do produto</th>
              <th>Unidade</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {itensConsolidados.map((item, index) => (
              <tr key={index}>
                <td>{item.produto}</td>
                <td>{item.unidade}</td>
                <td>{item.quantidade.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Romaneios gerados</h3>
      {romaneiosGerados.length === 0 ? (
        <p>Nenhum romaneio gerado ainda.</p>
      ):(
        <div>
          {romaneiosGerados.map((romaneio, index)=> (
            <div key={index}>
              <p>Escola: {romaneio.escola}</p>
              <p>Semana: {romaneio.semana}</p>
              <p>Data: {romaneio.dataGeracao}</p>
              <p>Itens: {romaneio.itens.length}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}