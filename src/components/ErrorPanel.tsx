import { Button } from "./Button";
import styles from "./ErrorPanel.module.css";

interface ErrorPanelProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export function ErrorPanel({ message, onRetry, isRetrying }: ErrorPanelProps) {
  return (
    <div role="alert" className={styles.panel}>
      <p>{message}</p>
      <Button variant="secondary" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}
