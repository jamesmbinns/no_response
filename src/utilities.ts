import { AidType, Constants } from "./types";
import L from "leaflet";
import * as turf from "@turf/turf";

export const getMarkerData = (markerType: AidType) => {
  switch (markerType) {
    case AidType.AirFood:
      return {
        color: "blue",
        radius: 45,
      };

    case AidType.WaterFood:
      return {
        color: "blue",
        radius: 100,
      };

    case AidType.AirSoldier:
      return {
        color: "red",
        radius: 30,
      };

    case AidType.WaterSoldier:
      return {
        color: "red",
        radius: 75,
      };

    default:
      return {
        color: "white",
        radius: 50,
      };
  }
};

export const borderStyle = () => {
  return {
    weight: 2,
    dashArray: "3",
    opacity: 1,
    color: "yellow",
    fillOpacity: 0,
  };
};

export const altBorderStyle = () => {
  return {
    weight: 2,
    dashArray: "3",
    opacity: 1,
    color: "red",
    fillColor: "yellow",
    fillOpacity: 0.5,
  };
};

export const dwellingsStyle = (styleObj: any) => {
  return {
    fillColor: styleObj.fill,
    weight: styleObj.weight || 1,
    opacity: 1,
    color: styleObj.color,
    dashArray: "3",
    fillOpacity: 0.7,
  };
};

export const highlightFeature = (e: L.LayerEvent) => {
  var layer = e.target;

  layer.setStyle({
    weight: 1,
    color: "white",
    fillColor: "yellow",
    dashArray: "",
    fillOpacity: 0.8,
  });

  layer.bringToFront();
};

export const getDwellingColor = (dwelling: any) => {
  const humansInDwelling =
    dwelling.feature.properties.soldiers +
    dwelling.feature.properties.occupancy;

  const foodDaysLeft = dwelling.feature.properties.food / humansInDwelling;

  const color = dwelling.feature.properties.soldiers ? "red" : "grey";
  const weight = dwelling.feature.properties.soldiers ? 3 : 1;

  if (humansInDwelling <= 0) {
    return {
      fill: "grey",
      color: color,
      weight: weight,
    };
  }

  if (foodDaysLeft > 10) {
    return {
      fill: "green",
      color: color,
      weight: weight,
    };
  }

  if (foodDaysLeft > 5) {
    return {
      fill: "yellow",
      color: color,
      weight: weight,
    };
  }

  return {
    fill: "red",
    color: color,
    weight: weight,
  };
};

export const resetHighlight = (e: L.LayerEvent) => {
  const layer = e.target;

  layer.setStyle(dwellingsStyle(getDwellingColor(layer)));
};

export const pointInBorder = (lng: number, lat: number, border: any) => {
  const point = turf.point([lng, lat]);
  const poly = turf.polygon(
    border.toGeoJSON().features[0].geometry.coordinates
  );

  return turf.booleanPointInPolygon(point, poly);
};

export const polygonInPolygon = (first: any, second: any) => {
  const one = turf.polygon(first.toGeoJSON().features[0].geometry.coordinates);

  const two = turf.polygon(second.toGeoJSON().features[0].geometry.coordinates);

  return turf.booleanContains(one, two);
};

export const handleDwellingClick = (e: L.LayerEvent) => {
  var layer = e.target;
  var properties = layer.feature.properties;

  layer
    .bindPopup(
      `<div><div>Type: ${properties.type}</div><div>Food: ${properties.food}</div><div>Civilians: ${properties.occupancy}</div><div>Soldiers: ${properties.soldiers}</div></div>`
    )
    .openPopup();
};

export const setCloseInterval = (
  closeSeconds: number,
  setTimer: (time: number) => void
) => {
  var interval = setInterval(function () {
    closeSeconds--;

    setTimer(closeSeconds);

    if (closeSeconds < 0) {
      setTimer(0);
      clearInterval(interval);
    }
  }, Constants.HourlyInterval);
};
