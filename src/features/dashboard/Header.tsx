import type { Customer, Segment } from "../../api/types";
import { Skeleton } from "../../components/Skeleton";
import { SegmentSwitch } from "../preferences/SegmentSwitch";
import { ThemeToggle } from "../preferences/ThemeToggle";
import styles from "./Header.module.css";

const DISABLED_NAV_ITEMS = ["Cards", "Payments", "Insights"];

interface HeaderProps {
  customer?: Customer;
  segment: Segment;
  onSegmentChange: (segment: Segment) => void;
}

export function Header({ customer, segment, onSegmentChange }: HeaderProps) {
  const initials = customer
    ? `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`
    : "";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a href="#main" className={styles.brand} aria-label="Meridian home">
          <span className={styles.logoMark} aria-hidden="true">
            M
          </span>
          <span className={styles.brandName}>Meridian</span>
        </a>

        <nav aria-label="Primary" className={styles.nav}>
          <a href="#main" className={styles.navLink} aria-current="page">
            Overview
          </a>
          {DISABLED_NAV_ITEMS.map((label) => (
            <span
              key={label}
              className={styles.navLink}
              aria-disabled="true"
              title="Not available in this demo"
            >
              {label}
            </span>
          ))}
        </nav>

        <div className={styles.segment}>
          <SegmentSwitch segment={segment} onChange={onSegmentChange} />
        </div>

        <div className={styles.headerActions}>
          <ThemeToggle />
          <span
            className={styles.avatar}
            role="img"
            aria-label={
              customer
                ? `${customer.firstName} ${customer.lastName}`
                : "Profile"
            }
          >
            {initials || <Skeleton width="1.5em" />}
          </span>
        </div>
      </div>
    </header>
  );
}
