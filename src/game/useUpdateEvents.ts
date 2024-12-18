import { useCallback } from "react";

export const useUpdateEvents = (
  gameEvents: Array<Array<string>>,
  setGameEvents: (events: Array<Array<string>>) => void
) => {
  return useCallback(
    (events: Array<string>) => {
      setGameEvents([events, ...gameEvents]);
    },
    [gameEvents, setGameEvents]
  );
};
