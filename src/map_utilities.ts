import { AidType } from "./map_types";
import L from "leaflet";
import * as turf from "@turf/turf";

export const getMarkerData = (markerType: AidType) => {
  switch (markerType) {
    case AidType.AirFood:
      return {
        color: "blue",
        radius: 60,
      };

    case AidType.WaterFood:
      return {
        color: "blue",
        radius: 150,
      };

    case AidType.AirSoldier:
      return {
        color: "red",
        radius: 50,
      };

    case AidType.WaterSoldier:
      return {
        color: "red",
        radius: 100,
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
    color: "yellow",
    fillColor: "yellow",
    fillOpacity: 0.5,
  };
};

export const dwellingsStyle = (color: string) => {
  return {
    fillColor: color,
    weight: 1,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.4,
  };
};

export const highlightFeature = (e: L.LayerEvent) => {
  var layer = e.target;

  layer.setStyle({
    weight: 7,
    color: "white",
    fillColor: "yellow",
    dashArray: "",
    fillOpacity: 0.8,
  });

  layer.bringToFront();
};

export const resetHighlight = (e: L.LayerEvent) => {
  const layer = e.target;
  layer.setStyle(
    dwellingsStyle(layer.feature.properties.soldiers ? "red" : "grey")
  );
};

export const pointInBorder = (lng: number, lat: number, border: any) => {
  const point = turf.point([lng, lat]);
  const poly = turf.polygon(
    border.toGeoJSON().features[0].geometry.coordinates
  );

  return turf.booleanPointInPolygon(point, poly);
};

export const handleDwellingClick = (e: L.LayerEvent) => {
  var layer = e.target;
  var properties = layer.feature.properties;
  console.log("===handleDwellingClick:layer.feature", layer.feature);

  layer
    .bindPopup(
      `<div><div>ID: ${properties.id}</div><div>Type: ${properties.type}</div><div>Soldiers: ${properties.soldiers}</div><div>Max Occupancy: ${properties.max_occupancy}</div></div>`
    )
    .openPopup();
};
