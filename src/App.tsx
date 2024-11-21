import { useEffect, useRef } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import dwellings from "./assets/dwellings.json";

import L from "leaflet";

let geojson: any;
let map: any = null;

const style = (feature: any) => {
  if (feature.properties.type == 9) return;

  return {
    fillColor: "red",
    weight: 2,
    opacity: 0.8,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.2,
  };
};

const highlightFeature = (e) => {
  var layer = e.target;
  var properties = layer.feature.properties;

  if (properties.type == 9) return;

  console.log("===layer", layer);

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

const resetHighlight = (e) => {
  const layer = e.target;
  layer.closePopup();
  geojson.resetStyle(e.target);
};

const zoomToFeature = (e) => {
  map.fitBounds(e.target.getBounds());
};

const onEachFeature = (feature, layer) => {
  if (feature.properties.type == 9) return;
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
};

const App = () => {
  useEffect(() => {
    if (map) return;

    map = L.map("map").setView([45.3946, -73.9579], 12);

    map.setMaxBounds(map.getBounds());

    L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    geojson = L.geoJson(dwellings as GeoJsonObject, {
      style: style,
      onEachFeature: onEachFeature,
    });

    console.log("===geojson._layers", geojson._layers);

    // Game init
    geojson._layers = Object.keys(geojson._layers).reduce((acc, key) => {
      let newLayer = geojson._layers[key];
      // Apply your transformation here
      // ex. newLayer.feature.properties.call_sign = Date.now();
      acc[key] = newLayer;
      return acc;
    }, {});
    // End game init

    console.log("===geojson._layers2", geojson._layers);

    geojson.addTo(map);
  }, []);

  return (
    <div className="flex flex-row">
      <div className="sidebar">
        <h3 className="text-green underline">Sidebar</h3>
      </div>
      <div id="map" style={{ width: "100%", height: "100vh" }}></div>
    </div>
  );
};

export default App;
