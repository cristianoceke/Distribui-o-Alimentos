import Image from "next/image";
import styles from "./page.module.css";
import EscolasPage from "./escolas/page";
import ProdutosPage from "./produtos/page";
import PreparacoesPage from "./pratos/page";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Sistema de Merenda Escolar</h1>
      <p>Primeiro teste do sistema</p>
    </main>
  );
}
