"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/utils/auth";
import styles from "@/app/login/login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    const sessao = login(email, senha);

    if (!sessao) {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    router.push("/");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Login</h1>
          <p className={styles.description}>
            Entre com seu e-mail e senha para acessar o sistema.
          </p>
          <p className={styles.helperText}>
            Acesso inicial: admin@merenda.com / 123456
          </p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          {erro && <div className={styles.errorBox}>{erro}</div>}

          <button type="submit" className={styles.submitButton}>
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
