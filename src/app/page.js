"use client";
import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";
import styles from "./page.module.css";

export default function Home() {
  const handleLogin = ({ username, password }) => {
    // TODO: integrate real auth later
    console.log("Login attempt", { username, password });
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftSide}></div>
      <div className={styles.rightPanel}>
        <Logo />

        <div className={styles.headerRow}>
          <span className={styles.line} />
          <h2 className={styles.title}>GET STARTED</h2>
          <span className={styles.line} />
        </div>

        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
