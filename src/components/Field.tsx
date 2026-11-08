import { useId, type ReactNode } from "react";
import styles from "./Field.module.css";

export const inputClassName = styles.input;

interface ControlProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  label: string;
  hideLabel?: boolean;
  /** Shown on the label's line, e.g. a character counter. */
  labelAside?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Spread the control props onto the input so the label and error link up. */
  children: (control: ControlProps) => ReactNode;
}

export function Field({
  label,
  hideLabel = false,
  labelAside,
  hint,
  error,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <div className={hideLabel ? "visually-hidden" : styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelAside}
      </div>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hint && (
        <div id={hintId} className={styles.hint}>
          {hint}
        </div>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
