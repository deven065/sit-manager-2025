"use client";
import styles from "./GradientBackground.module.css";

export default function GradientBackground({ className = "" }) {
  return <div className={`${styles.leftGradient} ${className}`} />;
}
