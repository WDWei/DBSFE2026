import {
  useEffect,
  useRef,
  type ReactNode,
  type SubmitEventHandler,
} from "react";
import styles from "./StepFrame.module.css";

interface StepFrameProps {
  title: string;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  actions: ReactNode;
  children: ReactNode;
}

/** Shared step layout: a scrolling body above a footer that stays in view. */
export function StepFrame({
  title,
  onSubmit,
  actions,
  children,
}: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Each step replaces the last, so focus would otherwise fall out of the
  // dialog. Landing on the heading also makes screen readers read the new step.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <form noValidate className={styles.frame} onSubmit={onSubmit}>
      <div className={styles.body}>
        <h3 ref={headingRef} tabIndex={-1} className={styles.title}>
          {title}
        </h3>
        {children}
      </div>
      <footer className={styles.footer}>{actions}</footer>
    </form>
  );
}
