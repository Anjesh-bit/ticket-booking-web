import { ConcertCard, useConcerts } from "@features/concerts";
import { Spinner } from "@shared/components/ui/Spinner";
import styles from "./CatalogPage.module.css";

const CatalogPage = () => {
  const { data, loading, error } = useConcerts();

  if (loading) return <Spinner />;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Upcoming Concerts</h1>
      <div className={styles.grid}>
        {data.map((concert) => (
          <ConcertCard key={concert.id} concert={concert} />
        ))}
      </div>
    </div>
  );
};

export default CatalogPage;
