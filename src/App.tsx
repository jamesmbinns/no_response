import { useEffect, useState, useCallback } from "react";
import { Feature, GeoJsonObject } from "geojson";
import "./App.css";
import "leaflet/dist/leaflet.css";
import borderJSON from "./assets/border.json";
import dwellingsJSON from "./assets/dwellings.json";

import L from "leaflet";

enum AidType {
  AirFood,
  WaterFood,
}

const borderStyle = () => {
  return {
    weight: 2,
    opacity: 0.5,
    color: "yellow",
    dashArray: "3",
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
  const [map, setMap] = useState<L.Map>({});
  const [markerType, setMarkerType] = useState<AidType>();
  const [airDrop, setAirDrop] = useState<L.Marker>();
  const [airDropCircle, setAirDropCircle] = useState<L.Circle>();

  let dwellings: any;
  let border: any;

  const resetHighlight = (e: L.LayerEvent) => {
    const layer = e.target;
    layer.closePopup();
    dwellings.resetStyle(e.target);
  };

  const zoomToFeature = (e: L.LayerEvent) => {
    map.fitBounds(e.target.getBounds());
  };

  const onEachFeature = (_feature: Feature, layer: L.Layer) => {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature,
    });
  };

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      // Clear existing marker and circle
      if (airDrop && airDropCircle) {
        map.removeLayer(airDrop);
        map.removeLayer(airDropCircle);
      }

      let circle = L.circle([e.latlng.lat, e.latlng.lng], {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.2,
        radius: 500,
      }).addTo(map);

      setAirDropCircle(circle);

      // Add a marker to the clicked area
      let drop = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);

      setAirDrop(drop);
    },
    [map, markerType]
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
      acc[key] = newLayer;
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
  }, [map, markerType]);

  return (
    <div className="flex flex-row">
      <div className="sidebar">
        <h3 className="text-green underline">Sidebar</h3>
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
      </div>
      <div id="map" style={{ width: "100%", height: "100vh" }}></div>
    </div>
  );
};

export default App;
