import { useCallback } from "react";
import L from "leaflet";

export const useRenderHordes = (
  hordes: any,
  hordesLayer: any,
  map: any,
  setFrontDwellings: (frontDwellings: boolean) => void
) => {
  return useCallback(() => {
    if (!hordes.length) return;

    hordesLayer.clearLayers();

    hordes.forEach((horde: any) => {
      L.circle([horde.lat, horde.lng], {
        color: "yellow",
        fillColor: "yellow",
        fillOpacity: 0.2,
        radius: horde.size,
        weight: 1,
        dashArray: "3",
        className: "horde",
      }).addTo(hordesLayer);

      // Add a horde marker to the map center
      const hordeMarker = L.marker([horde.lat, horde.lng], {
        icon: L.icon({
          iconUrl: `/src/assets/zombie.svg`,
          iconSize: [51, 51], // size of the icon
          popupAnchor: [0, -20], // point from which the popup should open relative to the iconAnchor
        }),
      });

      hordeMarker.on("mouseover", (e) => {
        e.target.bindPopup(`<div>Size: ${horde.size}</div>`).openPopup();
      });

      hordeMarker.addTo(hordesLayer);
    });
    setFrontDwellings(true);
  }, [hordes, hordesLayer, map]);
};
