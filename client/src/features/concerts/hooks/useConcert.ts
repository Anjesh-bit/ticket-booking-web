import { useEffect, useState } from "react";
import type { Concert } from "../concert.types";
import { concertApi } from "../concert.api";

interface State {
  data: Concert | null;
  loading: boolean;
  error: string | null;
}

export const useConcert = (id: string) => {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    concertApi
      .getById(id)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }));
  }, [id]);

  return state;
};
