import { useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { Constants } from "../types";
import { dwellingsStyle, getDwellingColor } from "../utilities";
import L from "leaflet";

export const useCheckDwellingLoss = (
  hordes: any,
  dwellings: any,
  setDwellings: (dwellings: any) => void,
  dwellingsLayer: any
) => {
  return useCallback(() => {
    dwellingsLayer.clearLayers();

    const newDwellings = dwellings.eachLayer((dwelling: any) => {
      // Lose one food every day per person
      if (
        dwelling.feature.properties.food &&
        (dwelling.feature.properties.occupancy ||
          dwelling.feature.properties.soldiers)
      ) {
        dwelling.feature.properties.food -=
          dwelling.feature.properties.occupancy +
          dwelling.feature.properties.soldiers;
      }

      // If no food, all occupants and soldiers die
      if (dwelling.feature.properties.food <= 0) {
        dwelling.feature.properties.occupancy = 0;
        dwelling.feature.properties.soldiers = 0;
      }
      // If dwelling has occupants, check if hordes kill anyone
      if (
        dwelling.feature.properties.occupancy ||
        dwelling.feature.properties.soldiers
      ) {
        hordes.forEach((horde: any) => {
          const distance = L.latLng([horde.lat, horde.lng]).distanceTo([
            dwelling.getBounds().getCenter().lat,
            dwelling.getBounds().getCenter().lng,
          ]);
          // If horde radius encompases a dwelling
          if (distance <= Math.max(horde?.size, Constants.DefaultHordeSize)) {
            // 25% chance of 1 soldier and occupant dying inside dwelling
            if (Math.random() < Constants.HordeKillRisk) {
              if (dwelling.feature.properties.soldiers) {
                dwelling.feature.properties.soldiers -= 1;
              }
            }

            if (Math.random() < Constants.HordeKillRisk) {
              if (dwelling.feature.properties.occupancy) {
                dwelling.feature.properties.occupancy -= 1;
              }
            }
          }
        });
      }

      if (dwelling.feature.properties.soldiers) {
        L.circle(
          [
            dwelling.getBounds().getCenter().lat,
            dwelling.getBounds().getCenter().lng,
          ],
          {
            color: "red",
            fillColor: "red",
            fillOpacity: 0.1,
            radius: 50,
            weight: 2,
            className: "marker",
          }
        ).addTo(dwellingsLayer);
      }

      // Set dwelling style to reflect new dwelling status
      dwelling.setStyle(dwellingsStyle(getDwellingColor(dwelling)));
    });

    setDwellings(newDwellings);
  }, [hordes, dwellings]);
};
