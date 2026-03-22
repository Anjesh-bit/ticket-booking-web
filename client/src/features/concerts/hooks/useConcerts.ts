import { useEffect, useState } from "react";
import type { Concert } from "../concert.types";
import { concertApi } from "../concert.api";

type State = {
  data: Concert[];
  loading: boolean;
  error: string | null;
};

export const useConcerts = () => {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });

  useEffect(() => {
    concertApi
      .getAll()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: [], loading: false, error: err.message }));
  }, []);

  return state;
};
