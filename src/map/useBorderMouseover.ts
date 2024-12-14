import { useCallback } from "react";
import { AidType } from "../types";
import { altBorderStyle } from "../utilities";

import L from "leaflet";

export const useBorderMouseover = (markerType: AidType | null | undefined) => {
  return useCallback(
    (e: L.LayerEvent) => {
      if ([AidType.WaterFood, AidType.WaterSoldier].includes(markerType!)) {
        var layer = e.target;

        layer.setStyle(altBorderStyle());
      }
    },
    [markerType]
  );
};
