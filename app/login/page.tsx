"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/utils/auth";
import styles from "@/app/login/login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const senhaRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function scrollCampoEmFoco(element: HTMLInputElement | null) {
    if (!element) {
      return;
    }

    setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 180);
  }

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
              ref={emailRef}
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onFocus={() => scrollCampoEmFoco(emailRef.current)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  senhaRef.current?.focus();
                }
              }}
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="senha">Senha</label>
            <input
              ref={senhaRef}
              id="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              onFocus={() => scrollCampoEmFoco(senhaRef.current)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              enterKeyHint="done"
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
