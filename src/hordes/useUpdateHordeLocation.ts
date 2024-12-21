import { useCallback } from "react";
import { computeDestinationPoint } from "geolib";
import { Constants } from "../types";
import { pointInBorder } from "../utilities";

export const useUpdateHordeLocation = (
  hordes: any,
  border: any,
  hordesLayer: any,
  setHordes: (newHordes: any) => void
) => {
  return useCallback(() => {
    const newHordes = hordes
      .map((horde: any) => {
        const newCoords = computeDestinationPoint(
          {
            latitude: horde.lat,
            longitude: horde.lng,
          },
          Math.max(horde?.size, Constants.DefaultHordeSize),
          Math.floor(Math.random() * 360)
        );

        // If the location is within the border bounds, move the horde there
        if (pointInBorder(newCoords.longitude, newCoords.latitude, border)) {
          horde.lat = newCoords.latitude;
          horde.lng = newCoords.longitude;
        }

        return horde;
      })
      .filter((horde: any) => horde.size >= 0);

    hordesLayer.clearLayers();

    setHordes(() => newHordes);
  }, [hordes]);
};
