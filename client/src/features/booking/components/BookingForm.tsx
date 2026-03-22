import { useState } from "react";
import { Button } from "@shared/components/ui/Button";
import type { BookingFormValues } from "../booking.types";
import styles from "./BookingForm.module.css";

type BookingFormProps = {
  values: BookingFormValues;
  onSubmit: (quantity: number) => void;
  loading: boolean;
};

const TIER_LABELS: Record<string, string> = {
  VIP: "VIP",
  FRONT_ROW: "Front Row",
  GA: "General Admission",
};

export const BookingForm = ({ values, onSubmit, loading }: BookingFormProps) => {
  const [quantity, setQuantity] = useState(1);
  const total = (Number(values.price) * quantity).toFixed(2);

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>{TIER_LABELS[values.tierType] ?? values.tierType}</h3>
      <p className={styles.price}>${values.price} per ticket</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="quantity">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={10}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className={styles.input}
        />
      </div>

      <div className={styles.total}>
        Total: <strong>${total}</strong>
      </div>

      <Button loading={loading} onClick={() => onSubmit(quantity)}>
        Confirm Booking
      </Button>
    </div>
  );
};
