import { useCallback } from "react";
import { Constants } from "../map_types";

import L from "leaflet";

export const useCheckHordeKills = (
  hordes: any,
  dwellings: any,
  setHordes: (hordes: any) => void
) => {
  return useCallback(() => {
    const newHordes = hordes
      .map((horde: any) => {
        dwellings.eachLayer((dwelling: any) => {
          const distance = L.latLng([horde.lat, horde.lng]).distanceTo([
            dwelling.getBounds().getCenter().lat,
            dwelling.getBounds().getCenter().lng,
          ]);
          // If horde radius encompases a dwelling
          if (distance <= Math.max(horde?.size, Constants.DefaultHordeSize)) {
            // If dwelling has soldiers
            if (dwelling.feature.properties.soldiers && Math.random() > 0.5) {
              horde.size -= dwelling.feature.properties.soldiers;
            }
          }
        });

        return horde;
      })
      .filter((horde: any) => horde.size > 0);

    if (hordes != newHordes) {
      setHordes(newHordes);
    }
  }, [hordes, dwellings]);
};
