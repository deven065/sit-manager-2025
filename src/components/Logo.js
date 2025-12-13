"use client";
import Image from "next/image";
import styles from "./Logo.module.css";

export default function Logo({ src = "/SIT-logo.png", alt = "SIT Logo", width = 220, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${styles.logo} ${className}`}
    />
  );
}
