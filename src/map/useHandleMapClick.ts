import { useCallback } from "react";

import { AidType, Constants } from "../map_types";
import { getMarkerData, pointInBorder } from "../map_utilities";
import L from "leaflet";

export const useHandleMapClick = (
  markerType: any,
  border: any,
  supplyLayer: any,
  map: any,
  setSupplyDrop: (supplyDrop: any) => void,
  setClearMap: (isTrue: boolean) => void
) => {
  return useCallback(
    (e: L.LeafletMouseEvent) => {
      const markerData = getMarkerData(markerType!);

      if (!markerType) return;

      // Ignore map clicks inside the border if the markerType is for a water supply
      if (
        [AidType.WaterFood, AidType.WaterSoldier].includes(markerType) &&
        pointInBorder(e.latlng.lng, e.latlng.lat, border)
      ) {
        return;
      }

      L.circle([e.latlng.lat, e.latlng.lng], {
        color: markerData.color,
        fillColor: markerData.color,
        fillOpacity: 0.2,
        radius: markerData.radius!,
        weight: 3,
        dashArray: "3",
        className: "marker",
      }).addTo(supplyLayer);

      var icon = L.icon({
        iconUrl: `/src/assets/${markerType}.png`,

        iconSize: [30, 51], // size of the icon
        popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
      });

      // Add a marker to the clicked area
      let drop = L.marker([e.latlng.lat, e.latlng.lng], {
        icon,
      }).addTo(supplyLayer);

      setSupplyDrop(drop);

      setTimeout(() => {
        setClearMap(true);
      }, Constants.HourlyInterval * 2);
    },
    [map, markerType]
  );
};
