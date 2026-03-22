import { useNavigate } from "react-router-dom";
import { Button } from "@shared/components/ui/Button";
import type { BookingResult } from "../booking.types";
import styles from "./BookingConfirmation.module.css";

type BookingConfirmationProps = {
  result: BookingResult;
};

export const BookingConfirmation = ({ result }: BookingConfirmationProps) => {
  const navigate = useNavigate();
  const success = result.payment_status === "success";

  return (
    <div className={`${styles.card} ${success ? styles.success : styles.failed}`}>
      <span className={styles.icon}>{success ? "✓" : "✕"}</span>
      <h2 className={styles.title}>{success ? "Booking Confirmed" : "Payment Failed"}</h2>
      <p className={styles.message}>
        {success
          ? `Booking #${result.booking.id.slice(0, 8)} confirmed for ${result.booking.quantity} ticket(s). Total: $${result.booking.total_price}`
          : "Your payment could not be processed. No charges were made. Please try again."}
      </p>
      <Button variant="secondary" onClick={() => navigate("/")}>
        Back to Concerts
      </Button>
    </div>
  );
};
