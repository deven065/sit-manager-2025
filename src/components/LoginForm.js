"use client";
import { useState } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { UserIcon, LockIcon } from "./ui/Icons";
import styles from "./LoginForm.module.css";

export default function LoginForm({ onSubmit, onSuccess, onError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (onSubmit) {
        await onSubmit({ username, password });
      }
      
      if (onSuccess) {
        onSuccess({ username, password });
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
      console.error("Login error:", error);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        icon={<UserIcon />}
      />

      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockIcon />}
      />

      <Button type="submit" variant="primary">
        LOGIN
      </Button>
    </form>
  );
}
