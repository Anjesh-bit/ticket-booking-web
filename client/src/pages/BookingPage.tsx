import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConcert, TierCard } from "@features/concerts";
import { useBooking, BookingForm, BookingConfirmation } from "@features/booking";
import type { TicketTier } from "@features/concerts";
import type { BookingFormValues } from "@features/booking";
import { Spinner } from "@shared/components/ui/Spinner";
import styles from "./BookingPage.module.css";

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: concert, loading, error } = useConcert(id!);
  const { book, loading: booking, data: result } = useBooking();
  const [selected, setSelected] = useState<BookingFormValues | null>(null);

  if (loading) return <Spinner />;
  if (error || !concert) return <p className={styles.error}>{error ?? "Concert not found"}</p>;
  if (result) return <BookingConfirmation result={result} />;

  const handleSelect = (tier: TicketTier) => {
    setSelected({ tierId: tier.id, tierType: tier.tier, price: tier.price, quantity: 1 });
  };

  const handleSubmit = async (quantity: number) => {
    if (!selected) return;
    await book({ tier_id: selected.tierId, quantity });
  };

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate("/")}>
        ← Back
      </button>
      <h1 className={styles.heading}>{concert.name}</h1>
      <p className={styles.meta}>
        {concert.venue} · {new Date(concert.date).toLocaleDateString()}
      </p>

      <div className={styles.layout}>
        <div className={styles.tiers}>
          <h2 className={styles.sub}>Select a Tier</h2>
          {concert.tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} onSelect={handleSelect} />
          ))}
        </div>

        {selected && <BookingForm values={selected} onSubmit={handleSubmit} loading={booking} />}
      </div>
    </div>
  );
};

export default BookingPage;
