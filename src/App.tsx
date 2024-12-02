import { useEffect, useState, useCallback } from "react";
import { Feature, GeoJsonObject } from "geojson";
import "./App.css";
import "leaflet/dist/leaflet.css";
import borderJSON from "./assets/border.json";
import dwellingsJSON from "./assets/dwellings.json";
import { AidType } from "./map_types";
import {
  getMarkerData,
  borderStyle,
  dwellingsStyle,
  highlightFeature,
  resetHighlight,
} from "./map_utilities";
import L from "leaflet";

const App = () => {
  const [map, setMap] = useState<L.Map>();
  const [markerType, setMarkerType] = useState<AidType>();
  const [supplyDrop, setSupplyDrop] = useState<L.Marker>();
  const [supplyDropCircle, setSupplyDropCircle] = useState<L.Circle>();
  const [dwellings, setDwellings] = useState<any>();
  const [border, setBorder] = useState<any>();
  const [clearMap, setClearMap] = useState<boolean>(false);
  const [insideBorder, setInsideBorder] = useState<boolean>(false);

  const handleDwellingClick = useCallback(
    (e: L.LayerEvent) => {
      var layer = e.target;
      var properties = layer.feature.properties;
      layer
        .bindPopup(
          `<div><div>ID: ${properties.id}</div><div>Type: ${properties.type}</div><div>Soliders? - ${properties.soldiers}</div><div>Max Occupancy: ${properties.max_occupancy}</div></div>`
        )
        .openPopup();
    },
    [markerType]
  );

  // Supply Drop event #2
  useEffect(() => {
    const markerData = getMarkerData(markerType!);
    if (dwellings && supplyDrop && markerData) {
      dwellings.eachLayer((layer: any) => {
        const distance = supplyDrop
          ?.getLatLng()
          .distanceTo([
            layer.getBounds()._northEast.lat,
            layer.getBounds()._northEast.lng,
          ]);

        if (distance <= markerData?.radius) {
          layer.setStyle({
            fillOpacity: 1,
          });
          layer.setStyle(dwellingsStyle(markerData.color));

          if (
            [AidType.AirSoldier, AidType.WaterSoldier].includes(markerType!)
          ) {
            layer.feature.properties.soldiers = true;
          }

          layer.bringToFront();
        }
      });
    }
  }, [supplyDrop]);

  // Supply Drop event #1
  useEffect(() => {
    if (clearMap && supplyDrop && supplyDropCircle) {
      map?.removeLayer(supplyDrop);
      map?.removeLayer(supplyDropCircle);

      dwellings.eachLayer((layer: any) => {
        layer.setStyle(
          dwellingsStyle(layer.feature.properties.soldiers ? "red" : "grey")
        );
      });

      setClearMap(false);
    }
  }, [clearMap, map, supplyDrop, supplyDropCircle]);

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      // Clear existing marker and circle
      if (supplyDrop && supplyDropCircle) {
        map?.removeLayer(supplyDrop);
        map?.removeLayer(supplyDropCircle);
      }

      const markerData = getMarkerData(markerType!);

      if (!markerType) return;

      // Check for water-based supply drops
      if (
        [AidType.WaterFood, AidType.WaterSoldier].includes(markerType) &&
        insideBorder
      ) {
        return;
      }

      let circle = L.circle([e.latlng.lat, e.latlng.lng], {
        color: markerData.color,
        fillColor: markerData.color,
        fillOpacity: 0.2,
        radius: markerData.radius!,
        weight: 3,
        dashArray: "3",
        className: "marker",
      }).addTo(map!);

      setSupplyDropCircle(circle);

      var icon = L.icon({
        iconUrl: `/src/assets/${markerType}.png`,

        iconSize: [30, 51], // size of the icon
        popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
      });

      // Add a marker to the clicked area
      let drop = L.marker([e.latlng.lat, e.latlng.lng], {
        icon,
      }).addTo(map!);

      setSupplyDrop(drop);

      setTimeout(() => {
        setClearMap(true);
      }, 5000);
    },
    [map, markerType, supplyDrop, supplyDropCircle, insideBorder]
  );

  // Game inititalization
  const gameInit = () => {
    if (!dwellings) return;
    dwellings._layers = Object.keys(dwellings?._layers).reduce((acc, key) => {
      let newLayer = dwellings?._layers[key];
      // Apply your transformation here
      newLayer.feature.properties.soldiers = false;
      acc[key as keyof Object] = newLayer;
      return acc;
    }, {});

    border.addTo(map);
    dwellings.addTo(map);
  };

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
    const bord: L.GeoJSON = L.geoJson(borderJSON as GeoJsonObject, {
      style: borderStyle,
      onEachFeature: (_feature: Feature, layer: L.Layer) => {
        layer.on({
          mouseover: () => {
            setInsideBorder(true);
          },
          mouseout: () => {
            setInsideBorder(false);
          },
        });
      },
    });

    setBorder(bord);

    // Add dwellings
    const dwells: L.GeoJSON = L.geoJson(dwellingsJSON as GeoJsonObject, {
      style: dwellingsStyle("grey"),
      onEachFeature: (_feature: Feature, layer: L.Layer) => {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: handleDwellingClick,
        });
      },
    });

    setDwellings(dwells);
  }, []);

  useEffect(() => {
    if (dwellings && border && map) {
      gameInit();
    }
  }, [dwellings, border, map]);

  useEffect(() => {
    if (map) {
      // Map Events
      map.on("click", handleMapClick);

      return () => {
        map.off("click", handleMapClick);
      };
    }
  }, [map, markerType, supplyDrop, supplyDropCircle, insideBorder]);

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
            Water Soldier
          </button>
        </div>
      </div>
      <div id="map" style={{ width: "100%", height: "100vh" }}></div>
    </div>
  );
};

export default App;
