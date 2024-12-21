import { useCallback } from "react";
import { Constants } from "../types";

import L from "leaflet";

export const useCheckHordeKills = (
  hordes: any,
  dwellings: any,
  setHordes: (hordes: any) => void,
  setHordesDestroyed: (count: any) => void,
  setZombiesDestroyed: (count: any) => void
) => {
  return useCallback(() => {
    let hordesDestroyed = 0;
    let zombiesDestroyed = 0;

    const newHordes = hordes
      .map((horde: any) => {
        dwellings.eachLayer((dwelling: any) => {
          const distance = L.latLng([horde.lat, horde.lng]).distanceTo([
            dwelling.getBounds().getCenter().lat,
            dwelling.getBounds().getCenter().lng,
          ]);
          // If horde radius encompases a dwelling
          if (
            distance <=
            Math.max(horde?.size, Constants.DefaultHordeSize) +
              Constants.SoldierKillRadius
          ) {
            // If dwelling has soldiers
            if (
              dwelling.feature.properties.soldiers &&
              Math.random() < Constants.SoldierKillRisk
            ) {
              horde.size -= dwelling.feature.properties.soldiers;
              zombiesDestroyed += dwelling.feature.properties.soldiers;
            }
          }
        });

        if (horde.size <= 0) {
          hordesDestroyed += 1;
        }

        return horde;
      })
      .filter((horde: any) => horde.size > 0);

    if (hordes != newHordes) {
      setHordes(() => newHordes);
      setZombiesDestroyed((prevCount: number) => prevCount + zombiesDestroyed);
      setHordesDestroyed((prevCount: number) => prevCount + hordesDestroyed);
    }
  }, [hordes, dwellings]);
};
