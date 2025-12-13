"use client";
import styles from "./Input.module.css";

export default function Input({
  type = "text",
  placeholder = "",
  value,
  onChange,
  icon,
  className = "",
  ...props
}) {
  return (
    <label className={`${styles.inputRow} ${className}`}>
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.input}
        {...props}
      />
    </label>
  );
}
