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
  polygonInPolygon,
} from "./map_utilities";
import L from "leaflet";
import { computeDestinationPoint } from "geolib";

const App = () => {
  const [gameTime, setGameTime] = useState<number>(0);
  const [map, setMap] = useState<L.Map>();
  const [markerType, setMarkerType] = useState<AidType | null>();
  const [supplyDrop, setSupplyDrop] = useState<L.Marker>();
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

    setHordes([
      {
        id: "60a28b39-8755-494e-9e40-2e2c8fab8ea7",
        size: 100,
        lat: 45.363800364206654,
        lng: -73.86541843414308,
      },
      {
        id: "11a28b39-8755-494e-9e40-2e2c8fab8e11",
        size: 200,
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
      setGameTime(gameTime + 1000);

      checkHordeKills();
      renderHordes();
    }, 1000);

    // Every day check
    const dailyInterval = setInterval(() => {
      checkDwellingLoss();
      updateHordeLocation();
    }, 24000);

    return () => {
      clearInterval(hourInterval);
      clearInterval(dailyInterval);
    };
  }, [map]);

  const checkDwellingLoss = () => {
    const newDwellings = dwellings.eachLayer((dwelling: any) => {
      // Lose one food every day per person
      if (
        dwelling.feature.properties.food &&
        (dwelling.feature.properties.occupancy ||
          dwelling.feature.properties.soldiers)
      ) {
        dwelling.feature.properties.food -=
          dwelling.feature.properties.occupancy +
          dwelling.feature.properties.soldiers;
      }

      // If no food, all occupants and soldiers die
      if (dwelling.feature.properties.food <= 0) {
        dwelling.feature.properties.occupancy = 0;
        dwelling.feature.properties.soldiers = 0;
      }
      // If dwelling has occupants
      if (
        dwelling.feature.properties.occupancy ||
        dwelling.feature.properties.soldiers
      ) {
        hordes.forEach((horde: any) => {
          const distance = L.latLng([horde.lat, horde.lng]).distanceTo([
            dwelling.getBounds()._northEast.lat,
            dwelling.getBounds()._northEast.lng,
          ]);
          // If horde radius encompases a dwelling
          if (distance <= horde?.size) {
            // If dwelling has soldiers
            if (Math.random() > 0.75) {
              if (dwelling.feature.properties.soldiers) {
                dwelling.feature.properties.soldiers -= 1;
              }

              if (dwelling.feature.properties.occupancy) {
                dwelling.feature.properties.occupancy -= 1;
              }
            }
          }
        });
      }

      dwelling.bringToFront();
    });

    setDwellings(newDwellings);
  };

  const checkHordeKills = () => {
    const newHordes = hordes.map((horde: any) => {
      dwellings.eachLayer((layer: any) => {
        const distance = L.latLng([horde.lat, horde.lng]).distanceTo([
          layer.getBounds()._northEast.lat,
          layer.getBounds()._northEast.lng,
        ]);
        // If horde radius encompases a dwelling
        if (distance <= horde?.size) {
          // If dwelling has soldiers
          if (layer.feature.properties.soldiers && Math.random() > 0.5) {
            horde.size -= 1;
          }
        }
      });

      return horde;
    });

    setHordes(newHordes);
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

  const updateHordeLocation = useCallback(() => {
    const newHordes = hordes
      .map((horde: any) => {
        console.log("===inside horde:horde", horde);

        const newCoords = computeDestinationPoint(
          {
            latitude: horde.lat,
            longitude: horde.lng,
          },
          200,
          Math.floor(Math.random() * 360)
        );

        if (pointInBorder(newCoords.longitude, newCoords.latitude, border)) {
          horde.lat = newCoords.latitude;
          horde.lng = newCoords.longitude;
        }

        return horde;
      })
      .filter((horde: any) => horde.size > 0);

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
      const markerData = getMarkerData(markerType!);

      if (!markerType) return;

      // Check for water-based supply drops
      if (
        [AidType.WaterFood, AidType.WaterSoldier].includes(markerType) &&
        pointInBorder(e.latlng.lng, e.latlng.lat, border)
      ) {
        return;
      }

      L.circle([e.latlng.lat, e.latlng.lng], {
        color: markerData.color,
        fillColor: markerData.color,
        fillOpacity: 0.2,
        radius: markerData.radius!,
        weight: 3,
        dashArray: "3",
        className: "marker",
      }).addTo(supplyLayer);

      var icon = L.icon({
        iconUrl: `/src/assets/${markerType}.png`,

        iconSize: [30, 51], // size of the icon
        popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
      });

      // Add a marker to the clicked area
      let drop = L.marker([e.latlng.lat, e.latlng.lng], {
        icon,
      }).addTo(supplyLayer);

      setSupplyDrop(drop);

      setTimeout(() => {
        setMarkerType(null);
        setClearMap(true);
      }, 5000);
    },
    [map, markerType, supplyLayer]
  );

  // Supply Drop event #1
  useEffect(() => {
    if (clearMap) {
      supplyLayer.clearLayers();

      dwellings.eachLayer((layer: any) => {
        layer.setStyle(
          dwellingsStyle(layer.feature.properties.soldiers ? "red" : "grey")
        );
      });

      setClearMap(false);
    }
  }, [clearMap, supplyLayer]);

  // Supply Drop event #2
  useEffect(() => {
    const markerData = getMarkerData(markerType!);
    if (dwellings && supplyDrop && markerData) {
      dwellings.eachLayer((dwelling: any) => {
        const distance = supplyDrop
          ?.getLatLng()
          .distanceTo([
            dwelling.getBounds()._northEast.lat,
            dwelling.getBounds()._northEast.lng,
          ]);

        if (distance <= markerData?.radius) {
          dwelling.setStyle({
            fillOpacity: 1,
          });
          dwelling.setStyle(dwellingsStyle(markerData.color));

          if (
            [AidType.AirSoldier, AidType.WaterSoldier].includes(markerType!)
          ) {
            dwelling.feature.properties.soldiers = 2;
          }

          dwelling.bringToFront();
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
