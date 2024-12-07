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
  altBorderStyle,
  dwellingsStyle,
  highlightFeature,
  resetHighlight,
  pointInBorder,
  handleDwellingClick,
} from "./map_utilities";
import L from "leaflet";
import { computeDestinationPoint } from "geolib";

const App = () => {
  const [gameTime, setGameTime] = useState<number>(0);
  const [map, setMap] = useState<L.Map>();
  const [markerType, setMarkerType] = useState<AidType | null>();
  const [supplyDrop, setSupplyDrop] = useState<L.Marker>();
  const [supplyDropCircle, setSupplyDropCircle] = useState<L.Circle>();
  const [dwellings, setDwellings] = useState<any>();
  const [border, setBorder] = useState<any>();
  const [hordes, setHordes] = useState<any>([]);
  const [hordesLayer, setHordesLayer] = useState<any>([]);
  const [supplyLayer, setSupplyLayer] = useState<any>([]);
  const [clearMap, setClearMap] = useState<boolean>(false);

  // Game initialization
  useEffect(() => {
    const baseMapLayer = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    // Add border layer
    const bord: L.GeoJSON = L.geoJson(borderJSON as GeoJsonObject, {
      style: borderStyle,
      onEachFeature: (_feature: Feature, layer: L.Layer) => {
        layer.on({
          mouseout: (e: L.LayerEvent) => {
            var layer = e.target;

            layer.setStyle(borderStyle());
          },
        });
      },
    });
    setBorder(bord);

    // Add dwellings layer
    const dwells: L.GeoJSON = L.geoJson(dwellingsJSON as GeoJsonObject, {
      style: dwellingsStyle("grey"),
      bubblingMouseEvents: false,
      onEachFeature: (_feature: Feature, layer: L.Layer) => {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: handleDwellingClick,
        });
      },
    });

    setDwellings(dwells);

    // Add supply layer
    const suplyLyr = L.layerGroup();

    setSupplyLayer(suplyLyr);

    // Add hordes and hordes layer
    const hordsLyr = L.layerGroup();

    const bordCenter = bord.getBounds().getCenter();

    setHordes([
      {
        id: "60a28b39-8755-494e-9e40-2e2c8fab8ea7",
        size: 100,
        lat: bordCenter.lat,
        lng: bordCenter.lng,
      },
      {
        id: "11a28b39-8755-494e-9e40-2e2c8fab8e11",
        size: 200,
        lat: bordCenter.lat,
        lng: bordCenter.lng,
      },
    ]);

    setHordesLayer(hordsLyr);

    // Create map and add layers
    const aMap = L.map("map", {
      center: [45.3946, -73.9579],
      zoom: 12,
      layers: [baseMapLayer, bord, dwells, hordsLyr, suplyLyr],
    });

    setMap(aMap);

    // Must stay locked on location
    aMap.setMaxBounds(aMap.getBounds());
  }, []);

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime(gameTime + 1000);

      renderGame();
    }, 1000);

    const hordesInterval = setInterval(() => {
      updateHordes();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(hordesInterval);
    };
  }, [map]);

  const renderGame = () => {
    renderHordes();

    console.log("===GAME LOOP HEARTBEAT");
  };

  const renderHordes = useCallback(() => {
    if (!hordes.length) return;

    hordesLayer.clearLayers();

    hordes.forEach((horde: any) => {
      L.circle([horde.lat, horde.lng], {
        color: "yellow",
        fillColor: "yellow",
        fillOpacity: 0.2,
        radius: horde.size,
        weight: 3,
        dashArray: "3",
        className: "horde",
      }).addTo(hordesLayer);

      // Add a horde marker to the map center
      L.marker([horde.lat, horde.lng], {
        icon: L.icon({
          iconUrl: `/src/assets/zombie.png`,
          iconSize: [30, 51], // size of the icon
          popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
        }),
      }).addTo(hordesLayer);
    });
  }, [hordes, hordesLayer, map]);

  const updateHordes = useCallback(() => {
    const newHordes = hordes.map((horde: any) => {
      const newCoords = computeDestinationPoint(
        {
          latitude: horde.lat,
          longitude: horde.lng,
        },
        200,
        Math.floor(Math.random() * 360)
      );

      horde.lat = newCoords.latitude;
      horde.lng = newCoords.longitude;

      return horde;
    });

    setHordes(newHordes);
  }, [hordes]);

  const borderMouseover = useCallback(
    (e: L.LayerEvent) => {
      if ([AidType.WaterFood, AidType.WaterSoldier].includes(markerType!)) {
        var layer = e.target;

        layer.setStyle(altBorderStyle());
      }
    },
    [markerType]
  );

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
        pointInBorder(e.latlng.lng, e.latlng.lat, border)
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
        setMarkerType(null);
        setClearMap(true);
      }, 5000);
    },
    [map, markerType, supplyDrop, supplyDropCircle]
  );

  // Supply Drop event #1
  useEffect(() => {
    if (clearMap && supplyDrop && supplyDropCircle) {
      supplyLayer.clearLayers();

      dwellings.eachLayer((layer: any) => {
        layer.setStyle(
          dwellingsStyle(layer.feature.properties.soldiers ? "red" : "grey")
        );
      });

      setClearMap(false);
    }
  }, [clearMap, map, supplyLayer]);

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
            layer.feature.properties.soldiers = 2;
          }

          layer.bringToFront();
        }
      });
    }
  }, [supplyDrop]);

  // Handle clicks
  useEffect(() => {
    if (map) {
      // Map Events
      map.on("click", handleMapClick);
      border.on("mouseover", borderMouseover);

      return () => {
        map.off("click", handleMapClick);
        border.off("mouseover", borderMouseover);
      };
    }
  }, [map, markerType]);

  return (
    <div className="flex flex-row">
      <div className="sidebar">
        <h3 className="text-green underline">Sidebar</h3>
        <div className="flex flex-col">
          <button
            onClick={() => {
              setMarkerType(AidType.AirFood);
            }}
          >
            Air Food
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.WaterFood);
            }}
          >
            Water Food
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.AirSoldier);
            }}
          >
            Air Solider
          </button>
          <button
            onClick={() => {
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
