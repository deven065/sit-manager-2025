"use client";
import styles from "./Button.module.css";

export default function Button({
  children,
  type = "button",
  onClick,
  className = "",
  variant = "primary",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
