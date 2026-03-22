import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export const Button = ({
  variant = "primary",
  loading,
  children,
  disabled,
  ...rest
}: ButtonProps) => (
  <button className={`${styles.btn} ${styles[variant]}`} disabled={disabled ?? loading} {...rest}>
    {loading ? <span className={styles.spinner} /> : children}
  </button>
);
