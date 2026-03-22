import type { FC } from "react";
import type { TicketTier } from "../concert.types";
import styles from "./TierCard.module.css";

type TierCardProps = {
  tier: TicketTier;
  onSelect: (tier: TicketTier) => void;
};

const TIER_LABELS: Record<string, string> = {
  VIP: "VIP",
  FRONT_ROW: "Front Row",
  GA: "General Admission",
};

export const TierCard: FC<TierCardProps> = ({ tier, onSelect }) => {
  const sold = tier.available_seats === 0;

  return (
    <div className={`${styles.card} ${sold ? styles.sold : ""}`}>
      <div className={styles.info}>
        <span className={styles.name}>{TIER_LABELS[tier.tier] ?? tier.tier}</span>
        <span className={styles.seats}>{sold ? "Sold out" : `${tier.available_seats} left`}</span>
      </div>
      <div className={styles.right}>
        <span className={styles.price}>${tier.price}</span>
        <button className={styles.btn} disabled={sold} onClick={() => onSelect(tier)}>
          Book
        </button>
      </div>
    </div>
  );
};
