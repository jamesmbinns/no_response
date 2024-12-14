import { useEffect, useState } from "react";
import { Feature, GeoJsonObject } from "geojson";
import "./App.css";
import "leaflet/dist/leaflet.css";
import borderJSON from "./assets/border.json";
import dwellingsJSON from "./assets/dwellings.json";
import { AidType, Constants } from "./types";
import {
  getMarkerData,
  borderStyle,
  dwellingsStyle,
  highlightFeature,
  resetHighlight,
  handleDwellingClick,
  getDwellingColor,
  setCloseInterval,
} from "./utilities";
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
  const [dwellingsLayer, setDwellingsLayer] = useState<any>([]);
  const [clearMap, setClearMap] = useState<boolean>(false);
  const [frontDwellings, setFrontDwellings] = useState<boolean>(false);

  const [airSoldierTimer, setAirSoldierTimer] = useState<number>();
  const [airFoodTimer, setAirFoodTimer] = useState<number>();
  const [waterSoldierTimer, setWaterSoldierTimer] = useState<number>();
  const [waterFoodTimer, setWaterFoodTimer] = useState<number>();

  const renderHordes = useRenderHordes(
    hordes,
    hordesLayer,
    map,
    setFrontDwellings
  );
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
    setDwellings,
    dwellingsLayer
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
      style: dwellingsStyle({
        fill: "grey",
        color: "grey",
      }),
      bubblingMouseEvents: false,
      onEachFeature: (_feature: Feature, layer: L.Layer) => {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: handleDwellingClick,
        });
      },
    });

    // Customize dwellings
    dwells.eachLayer((dwelling: any) => {
      dwelling.options.fillColor = getDwellingColor(dwelling).fill;

      // Randomize occupancy
      dwelling.feature.properties.occupancy = Math.ceil(
        dwelling.feature.properties.max_occupancy * Math.random()
      );

      // Randomize food
      dwelling.feature.properties.food = Math.ceil(
        dwelling.feature.properties.occupancy * 50 * Math.random()
      );

      dwelling.setStyle(dwellingsStyle(getDwellingColor(dwelling)));
    });

    setDwellings(dwells);

    // Add empty supply layer
    const suplyLyr = L.layerGroup();

    setSupplyLayer(suplyLyr);

    // Add empty dwellings layer
    const dwellsLyr = L.layerGroup();

    setDwellingsLayer(dwellsLyr);

    // Add hordes and hordes layer
    const hordsLyr = L.layerGroup();

    setHordes([
      {
        id: "60a28b39-8755-494e-9e40-2e2c8fab8ea7",
        size: 125,
        lat: 45.363800364206654,
        lng: -73.86541843414308,
      },
      {
        id: "11a28b39-8755-494e-9e40-2e2c8fab8e11",
        size: 50,
        lat: 45.37314684836281,
        lng: -73.85553717613222,
      },
      {
        id: "22a28b39-8755-494e-9e40-2e2c8fa1122",
        size: 150,
        lat: 45.36158411646757,
        lng: -73.87598906102649,
      },
      {
        id: "33a28b39-8755-494e-9e40-2e2c8fa1133",
        size: 200,
        lat: 45.367825571719365,
        lng: -73.87460784103854,
      },
      {
        id: "44a28b39-8755-494e-9e40-2e2c8fa1144",
        size: 50,
        lat: 45.3566387064922,
        lng: -73.88521171011645,
      },
      {
        id: "55a28b39-8755-494e-9e40-2e2c8fa1155",
        size: 75,
        lat: 45.36888082218041,
        lng: -73.88216363438961,
      },
    ]);

    setHordesLayer(hordsLyr);

    // Create map and add layers
    const aMap = L.map("map", {
      center: [45.3946, -73.9579],
      zoom: 12,
      layers: [baseMapLayer, bord, hordsLyr, suplyLyr, dwells, dwellsLyr],
    });

    // Must stay locked on location
    aMap.setMaxBounds(aMap.getBounds());

    setMap(aMap);
  }, []);

  // Game loop
  useEffect(() => {
    // Every hour check
    const hourInterval = setInterval(() => {
      checkHordeKills();
    }, Constants.HourlyInterval);

    // Every 12 hours check
    const dailyInterval = setInterval(() => {
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
    const markerData = getMarkerData(markerType!);

    // Update timers depending on AidType
    if ([AidType.AirSoldier].includes(markerType!)) {
      setCloseInterval(Constants.AirSoldierTimer, setAirSoldierTimer);
    }

    if ([AidType.WaterSoldier].includes(markerType!)) {
      setCloseInterval(Constants.WaterSoldierTimer, setWaterSoldierTimer);
    }

    // Add food if food drop
    if ([AidType.AirFood].includes(markerType!)) {
      setCloseInterval(Constants.AirFoodTimer, setAirFoodTimer);
    }

    if ([AidType.WaterFood].includes(markerType!)) {
      setCloseInterval(Constants.WaterFoodTimer, setWaterFoodTimer);
    }

    // Check if dwellings are impacted by supplyDrops
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
            dwelling.setStyle(
              dwellingsStyle({
                fill: markerData.color,
                color: markerData.color,
              })
            );

            // Add soldiers if soldier drop
            if ([AidType.AirSoldier].includes(markerType!)) {
              dwelling.feature.properties.soldiers += Math.ceil(
                Constants.AirSoldierDrop * Math.random()
              );
            }

            if ([AidType.WaterSoldier].includes(markerType!)) {
              dwelling.feature.properties.soldiers += Math.ceil(
                Constants.WaterSoldierDrop * Math.random()
              );
            }

            // Add food if food drop
            if ([AidType.AirFood].includes(markerType!)) {
              dwelling.feature.properties.food += Math.ceil(
                Constants.AirFoodDrop * Math.random()
              );
            }

            if ([AidType.WaterFood].includes(markerType!)) {
              dwelling.feature.properties.food += Math.ceil(
                Constants.WaterFoodDrop * Math.random()
              );
            }
          }
        })
        .bringToFront();

      setMarkerType(null);
      setDwellings(dwellings);
    }
  }, [supplyDrop]);

  // Supply Drop event #2
  useEffect(() => {
    if (clearMap) {
      supplyLayer.clearLayers();
      dwellingsLayer.clearLayers();

      dwellings.eachLayer((dwelling: any) => {
        dwelling.setStyle(dwellingsStyle(getDwellingColor(dwelling)));

        if (dwelling.feature.properties.soldiers) {
          L.circle(
            [
              dwelling.getBounds().getCenter().lat,
              dwelling.getBounds().getCenter().lng,
            ],
            {
              color: "red",
              fillColor: "red",
              fillOpacity: 0.1,
              radius: 50,
              weight: 1,
              className: "marker",
            }
          ).addTo(dwellingsLayer);
        }
      });

      setClearMap(false);
    }
  }, [clearMap]);

  // Bring dwellings to front
  useEffect(() => {
    if (dwellings) {
      dwellings.bringToFront();
      setFrontDwellings(false);
    }
  }, [hordes, supplyDrop, frontDwellings]);

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
        <h3 className="underline">Supply Drops</h3>
        <div className="flex flex-col">
          <button
            onClick={() => {
              setMarkerType(AidType.AirFood);
            }}
            className="text-left mt-2 disabled:text-slate-500"
            disabled={!!airFoodTimer}
          >
            Air Food {airFoodTimer != 0 && <span>{airFoodTimer}</span>}
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.WaterFood);
            }}
            className="text-left mt-2 disabled:text-slate-500"
            disabled={!!waterFoodTimer}
          >
            Water Food {waterFoodTimer != 0 && <span>{waterFoodTimer}</span>}
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.AirSoldier);
            }}
            className="text-left mt-2 disabled:text-slate-500"
            disabled={!!airSoldierTimer}
          >
            Air Soldier {airSoldierTimer != 0 && <span>{airSoldierTimer}</span>}
          </button>
          <button
            onClick={() => {
              setMarkerType(AidType.WaterSoldier);
            }}
            className="text-left mt-2 disabled:text-slate-500"
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
