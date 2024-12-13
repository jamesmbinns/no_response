import { useEffect, useState } from "react";
import { Feature, GeoJsonObject } from "geojson";
import "./App.css";
import "leaflet/dist/leaflet.css";
import borderJSON from "./assets/border.json";
import dwellingsJSON from "./assets/dwellings.json";
import { AidType, Constants } from "./map_types";
import {
  getMarkerData,
  borderStyle,
  dwellingsStyle,
  highlightFeature,
  resetHighlight,
  handleDwellingClick,
  getDwellingColor,
  setCloseInterval,
} from "./map_utilities";
import L from "leaflet";

import { useRenderHordes } from "./hordes/useRenderHordes";
import { useUpdateHordeLocation } from "./hordes/useUpdateHordeLocation";
import { useBorderMouseover } from "./map/useBorderMouseover";
import { useHandleMapClick } from "./map/useHandleMapClick";
import { useCheckDwellingLoss } from "./dwellings/useCheckDwellingLoss";
import { useCheckHordeKills } from "./hordes/useCheckHordeKills";

const App = () => {
  const [map, setMap] = useState<L.Map>();
  const [markerType, setMarkerType] = useState<AidType | null>();
  const [supplyDrop, setSupplyDrop] = useState<L.Marker>();
  const [dwellings, setDwellings] = useState<any>();
  const [border, setBorder] = useState<any>();
  const [hordes, setHordes] = useState<any>([]);
  const [hordesLayer, setHordesLayer] = useState<any>([]);
  const [supplyLayer, setSupplyLayer] = useState<any>([]);
  const [clearMap, setClearMap] = useState<boolean>(false);

  const [airSoldierTimer, setAirSoldierTimer] = useState<number>();
  const [airFoodTimer, setAirFoodTimer] = useState<number>();
  const [waterSoldierTimer, setWaterSoldierTimer] = useState<number>();
  const [waterFoodTimer, setWaterFoodTimer] = useState<number>();

  const renderHordes = useRenderHordes(hordes, hordesLayer, map);
  const borderMouseover = useBorderMouseover(markerType);
  const updateHordeLocation = useUpdateHordeLocation(
    hordes,
    border,
    hordesLayer,
    setHordes
  );
  const handleMapClick = useHandleMapClick(
    markerType,
    border,
    supplyLayer,
    map,
    setSupplyDrop,
    setClearMap
  );

  const checkDwellingLoss = useCheckDwellingLoss(
    hordes,
    dwellings,
    setDwellings
  );

  const checkHordeKills = useCheckHordeKills(hordes, dwellings, setHordes);

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

    dwells.eachLayer((layer: any) => {
      layer.options.fillColor = getDwellingColor(layer);

      // Randomize occupancy
      layer.feature.properties.occupancy = Math.floor(
        layer.feature.properties.max_occupancy * Math.random()
      );

      // Randomize food
      layer.feature.properties.food = Math.floor(
        layer.feature.properties.occupancy * 50 * Math.random()
      );
    });

    setDwellings(dwells);

    // Add empty supply layer
    const suplyLyr = L.layerGroup();

    setSupplyLayer(suplyLyr);

    // Add hordes and hordes layer
    const hordsLyr = L.layerGroup();

    setHordes([
      {
        id: "60a28b39-8755-494e-9e40-2e2c8fab8ea7",
        size: 100,
        lat: 45.363800364206654,
        lng: -73.86541843414308,
      },
      {
        id: "11a28b39-8755-494e-9e40-2e2c8fab8e11",
        size: 50,
        lat: 45.37314684836281,
        lng: -73.85553717613222,
      },
    ]);

    setHordesLayer(hordsLyr);

    // Create map and add layers
    const aMap = L.map("map", {
      center: [45.3946, -73.9579],
      zoom: 12,
      layers: [baseMapLayer, bord, hordsLyr, suplyLyr, dwells],
    });

    setMap(aMap);

    // Must stay locked on location
    aMap.setMaxBounds(aMap.getBounds());
  }, []);

  // Game loop
  useEffect(() => {
    // Every hour check
    const hourInterval = setInterval(() => {
      checkHordeKills();
    }, Constants.HourlyInterval);

    // Every 12 hours check
    const dailyInterval = setInterval(() => {
      console.log("===dailyInterval");
      checkDwellingLoss();
      updateHordeLocation();
    }, Constants.DailyInterval);

    return () => {
      clearInterval(hourInterval);
      clearInterval(dailyInterval);
    };
  }, [map]);

  // Supply Drop event #1
  useEffect(() => {
    if (clearMap) {
      supplyLayer.clearLayers();

      dwellings.eachLayer((dwelling: any) => {
        dwelling.setStyle(dwellingsStyle(getDwellingColor(dwelling)));
      });

      setClearMap(false);
    }
  }, [clearMap, supplyLayer]);

  // Supply Drop event #2
  useEffect(() => {
    const markerData = getMarkerData(markerType!);

    // Add soldiers if soldier drop
    if ([AidType.AirSoldier].includes(markerType!)) {
      setCloseInterval(30, setAirSoldierTimer);
    }

    if ([AidType.WaterSoldier].includes(markerType!)) {
      setCloseInterval(20, setWaterSoldierTimer);
    }

    // Add food if food drop
    if ([AidType.AirFood].includes(markerType!)) {
      setCloseInterval(25, setAirFoodTimer);
    }

    if ([AidType.WaterFood].includes(markerType!)) {
      setCloseInterval(15, setWaterFoodTimer);
    }

    if (dwellings && supplyDrop && markerData) {
      dwellings
        .eachLayer((dwelling: any) => {
          const distance = supplyDrop
            ?.getLatLng()
            .distanceTo([
              dwelling.getBounds().getCenter().lat,
              dwelling.getBounds().getCenter().lng,
            ]);

          if (distance <= markerData?.radius) {
            dwelling.setStyle({
              fillOpacity: 1,
            });
            dwelling.setStyle(dwellingsStyle(markerData.color));

            // Add soldiers if soldier drop
            if ([AidType.AirSoldier].includes(markerType!)) {
              dwelling.feature.properties.soldiers += 2;
            }

            if ([AidType.WaterSoldier].includes(markerType!)) {
              dwelling.feature.properties.soldiers += 3;
            }

            // Add food if food drop
            if ([AidType.AirFood].includes(markerType!)) {
              dwelling.feature.properties.food += 25;
            }

            if ([AidType.WaterFood].includes(markerType!)) {
              dwelling.feature.properties.food += 40;
            }
          }
        })
        .bringToFront();

      setMarkerType(null);
      setDwellings(dwellings);
    }
  }, [supplyDrop]);

  // Bring dwellings to front
  useEffect(() => {
    if (dwellings) {
      dwellings.bringToFront();
    }
  }, [hordes, supplyDrop]);

  // Render hordes when hordes changes
  useEffect(() => {
    if (!hordes) {
      console.log("===YOU WIN THE GAME!");
    } else {
      renderHordes();
    }
  }, [hordes]);

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
  }, [map, markerType, supplyLayer]);

  return (
    <div className="flex flex-row">
      <div className="sidebar">
        <h3 className="underline">Sidebar</h3>
        <div className="flex flex-col">
          <button
            onClick={() => {
              setMarkerType(AidType.AirFood);
            }}
            className="text-center disabled:text-slate-500"
            disabled={!!airFoodTimer}
          >
            Air Food {airFoodTimer != 0 && <span>{airFoodTimer}</span>}
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.WaterFood);
            }}
            className="text-center disabled:text-slate-500"
            disabled={!!waterFoodTimer}
          >
            Water Food {waterFoodTimer != 0 && <span>{waterFoodTimer}</span>}
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.AirSoldier);
            }}
            className="text-center disabled:text-slate-500"
            disabled={!!airSoldierTimer}
          >
            Air Soldier {airSoldierTimer != 0 && <span>{airSoldierTimer}</span>}
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.WaterSoldier);
            }}
            className="text-center disabled:text-slate-500"
            disabled={!!waterSoldierTimer}
          >
            Water Soldier{" "}
            {waterSoldierTimer != 0 && <span>{waterSoldierTimer}</span>}
          </button>
        </div>
      </div>
      <div id="map" style={{ width: "100%", height: "100vh" }}></div>
    </div>
  );
};

export default App;
