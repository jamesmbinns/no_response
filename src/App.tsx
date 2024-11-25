import { useEffect, useState, useCallback } from "react";
import { Feature, GeoJsonObject } from "geojson";
import { booleanOverlap } from "@turf/boolean-overlap";
import "./App.css";
import "leaflet/dist/leaflet.css";
import borderJSON from "./assets/border.json";
import dwellingsJSON from "./assets/dwellings.json";

import L from "leaflet";

enum AidType {
  AirFood = "air_food",
  WaterFood = "water_food",
  AirSoldier = "air_soldier",
  WaterSoldier = "water_soldier",
}

const getMarkerData = (markerType: AidType) => {
  switch (markerType) {
    case AidType.AirFood:
      return {
        color: "red",
        radius: 100,
      };

    case AidType.WaterFood:
      return {
        color: "blue",
        radius: 200,
      };

    case AidType.AirSoldier:
      return {
        color: "red",
        radius: 100,
      };

    case AidType.WaterSoldier:
      return {
        color: "red",
        radius: 200,
      };

    default:
      return {
        color: "white",
        width: 300,
      };
  }
};

const borderStyle = () => {
  return {
    weight: 2,
    dashArray: "3",
    opacity: 0.5,
    color: "yellow",
    fillOpacity: 0,
  };
};

const dwellingsStyle = () => {
  return {
    fillColor: "red",
    weight: 1,
    opacity: 0.8,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.2,
  };
};

const highlightFeature = (e: L.LayerEvent) => {
  var layer = e.target;
  var properties = layer.feature.properties;

  layer.setStyle({
    weight: 2,
    color: "#CCC",
    dashArray: "",
    fillOpacity: 0.7,
  });

  layer
    .bindPopup(
      `<div><div>ID: ${properties.id}</div><div>Type: ${properties.type}</div><div>Max Occupancy: ${properties.max_occupancy}</div></div>`
    )
    .openPopup();

  layer.bringToFront();
};

const App = () => {
  const [map, setMap] = useState<L.Map>();
  const [markerType, setMarkerType] = useState<AidType>();
  const [supplyDrop, setSupplyDrop] = useState<L.Marker>();
  const [supplyDropCircle, setSupplyDropCircle] = useState<L.Circle>();

  let dwellings: any;
  let border: any;

  const resetHighlight = (e: L.LayerEvent) => {
    const layer = e.target;
    layer.closePopup();
    dwellings.resetStyle(e.target);
  };

  const zoomToFeature = (e: L.LayerEvent) => {
    map?.fitBounds(e.target.getBounds());
  };

  const onEachFeature = (_feature: Feature, layer: L.Layer) => {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature,
    });
  };

  const checkOverlap = () => {
    let overlap = false;

    var layers = map?.eachLayer((layer: L.Layer) => {
      let layerOverlaps = false;

      if (layer._pxBounds && supplyDropCircle) {
        layerOverlaps = supplyDropCircle!.getBounds().contains(layer._pxBounds);

        if (layer._pxBounds) {
          console.log("===layer._pxBounds", layer._pxBounds);
        }

        if (layerOverlaps) {
          console.log("===this one is good");
          overlap = true;
        }
      }

      console.log("===layerOverlaps", layerOverlaps);
    });

    console.log("===overlap", overlap);

    // layers.forEach((layer: L.Layer) => {
    //   console.log("===layer", layer);
    // });
  };

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      // Clear existing marker and circle
      if (supplyDrop && supplyDropCircle) {
        map?.removeLayer(supplyDrop);
        map?.removeLayer(supplyDropCircle);
      }

      const markerData = getMarkerData(markerType!);

      let circle = L.circle([e.latlng.lat, e.latlng.lng], {
        color: markerData.color,
        fillColor: markerData.color,
        fillOpacity: 0.2,
        radius: markerData.radius!,
        weight: 3,
        dashArray: "3",
      }).addTo(map!);

      setSupplyDropCircle(circle);

      var icon = L.icon({
        iconUrl: `/src/assets/${markerType}.png`,

        iconSize: [30, 51], // size of the icon
        popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
      });

      // Add a marker to the clicked area
      let drop = L.marker([e.latlng.lat, e.latlng.lng], { icon }).addTo(map!);

      setSupplyDrop(drop);

      checkOverlap();
    },
    [map, markerType, supplyDrop, supplyDropCircle]
  );

  useEffect(() => {
    if (map) return;

    const aMap = L.map("map").setView([45.3946, -73.9579], 12);

    setMap(aMap);

    // Must stay locked on location
    aMap.setMaxBounds(aMap.getBounds());

    L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(aMap);

    // Add border
    border = L.geoJson(borderJSON as GeoJsonObject, {
      style: borderStyle,
    });

    // Add dwellings
    dwellings = L.geoJson(dwellingsJSON as GeoJsonObject, {
      style: dwellingsStyle,
      onEachFeature: onEachFeature,
    });

    // Game init
    dwellings._layers = Object.keys(dwellings._layers).reduce((acc, key) => {
      let newLayer = dwellings._layers[key];
      // Apply your transformation here
      // ex. newLayer.feature.properties.call_sign = Date.now();
      acc[key as keyof Object] = newLayer;
      return acc;
    }, {});
    // End game init

    border.addTo(aMap);
    dwellings.addTo(aMap);
  }, []);

  useEffect(() => {
    if (map) {
      // Map Events
      map.on("click", handleMapClick);

      return () => {
        map.off("click", handleMapClick);
      };
    }
  }, [map, markerType, supplyDrop, supplyDropCircle]);

  return (
    <div className="flex flex-row">
      <div className="sidebar">
        <h3 className="text-green underline">Sidebar</h3>
        <div className="flex flex-col">
          <button
            onClick={(e) => {
              setMarkerType(AidType.AirFood);
            }}
          >
            Air Food
          </button>
          <button
            onClick={(e) => {
              setMarkerType(AidType.WaterFood);
            }}
          >
            Water Food
          </button>
          <button
            onClick={(e) => {
              setMarkerType(AidType.AirSoldier);
            }}
          >
            Air Solider
          </button>
          <button
            onClick={(e) => {
              setMarkerType(AidType.WaterSoldier);
            }}
          >
            Water Food
          </button>
        </div>
      </div>
      <div id="map" style={{ width: "100%", height: "100vh" }}></div>
    </div>
  );
};

export default App;
