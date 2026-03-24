import { useNavigate } from "react-router-dom";
import type { Concert } from "../concert.types";
import styles from "./ConcertCard.module.css";

type ConcertCardProps = {
  concert: Concert;
};

export const ConcertCard = ({ concert }: ConcertCardProps) => {
  const navigate = useNavigate();
  const date = new Date(concert.date).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  console.log(date);

  return (
    <div className={styles.card} onClick={() => navigate(`/concerts/${concert.id}`)}>
      <div className={styles.header}>
        <h2 className={styles.name}>{concert.name}</h2>
        <span className={styles.venue}>{concert.venue}</span>
      </div>
      <div className={styles.footer}>
        <span className={styles.date}>{date}</span>
        <span className={styles.tiers}>{concert.tier_count} tiers available</span>
      </div>
    </div>
  );
};
