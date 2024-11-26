import { useEffect, useState, useCallback } from "react";
import {
  Feature,
  GeoJsonObject,
  GeoJSON,
  GeoJsonProperties,
  Geometry,
} from "geojson";
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
        color: "blue",
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
  const [dwellings, setDwellings] =
    useState<GeoJSON<GeoJsonProperties, Geometry>>();
  const [border, setBorder] = useState<GeoJSON<GeoJsonProperties, Geometry>>();

  const resetHighlight = (e: L.LayerEvent) => {
    const layer = e.target;
    layer.closePopup();
    dwellings?.resetStyle(e.target);
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

  // function SelectPoints(lat,lon){
  // 	xy = [lat,lon];  //center point of circle
  // 	dist = 150;  // 150 miles,
  // 	var theRadius = dist * 1609.34  //1609.34 meters in a mile

  // 	selPts.length =0;  //Reset the array if selecting new points

  // 	sites.eachLayer(function (layer) {
  // 		// Lat, long of current point as it loops through.
  // 		layer_lat_long = layer.getLatLng();

  // 		// Distance from our circle marker To current point in meters
  // 		distance_from_centerPoint = layer_lat_long.distanceTo(xy);

  // 		// See if meters is within radius, add the to array
  // 		if (distance_from_centerPoint <= theRadius) {
  // 			 selPts.push(layer.feature);
  // 		}
  // 	});

  // 	// draw circle to see the selection area
  // 	theCircle = L.circle(xy, theRadius , {   /// Number is in Meters
  // 	  color: 'orange',
  // 	  fillOpacity: 0,
  // 	  opacity: 1
  // 	}).addTo(map);

  // 	//Symbolize the Selected Points
  // 		 geojsonLayer = L.geoJson(selPts, {

  // 			pointToLayer: function(feature, latlng) {
  // 				return L.circleMarker(latlng, {
  // 				radius: 4, //expressed in pixels circle size
  // 				color: "green",
  // 				stroke: true,
  // 				weight: 7,		//outline width  increased width to look like a filled circle.
  // 				fillOpcaity: 1
  // 				});
  // 				}
  // 		});
  // 		//Add selected points back into map as green circles.
  // 		map.addLayer(geojsonLayer);

  // 		//Take array of features and make a GeoJSON feature collection
  // 		var GeoJS = { type: "FeatureCollection",  features: selPts   };
  // 		//Show number of selected features.
  // 		console.log(GeoJS.features.length +" Selected features");
  // 		 // show selected GEOJSON data in console
  // 		console.log(JSON.stringify(GeoJS));
  // }	//end of SelectPoints function

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
            fillColor: "red",
            fillOpacity: 1,
          });
          layer.bringToFront();
        } else {
          layer.setStyle({
            fillColor: "red",
            fillOpacity: 0.5,
          });
        }
      });
    }
  }, [supplyDrop]);

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      // Clear existing marker and circle
      if (supplyDrop && supplyDropCircle) {
        map?.removeLayer(supplyDrop);
        map?.removeLayer(supplyDropCircle);
      }

      const markerData = getMarkerData(markerType!);

      if (!markerType) return;

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
    },
    [map, markerType, supplyDrop, supplyDropCircle]
  );

  const gameInit = () => {
    // Game init
    if (!dwellings) return;
    dwellings._layers = Object.keys(dwellings?._layers).reduce((acc, key) => {
      let newLayer = dwellings?._layers[key];
      // Apply your transformation here
      // ex. newLayer.feature.properties.call_sign = Date.now();
      acc[key as keyof Object] = newLayer;
      return acc;
    }, {});
    // End game init

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
    const bord = L.geoJson(borderJSON as GeoJsonObject, {
      style: borderStyle,
    });

    setBorder(bord);

    // Add dwellings
    const dwells = L.geoJson(dwellingsJSON as GeoJsonObject, {
      style: dwellingsStyle,
      onEachFeature: onEachFeature,
    });

    setDwellings(dwells);
  }, []);

  useEffect(() => {
    if (dwellings && border && map) {
      gameInit();
    }
  }, [dwellings, border, map]);

  useEffect(() => {
    console.log("===useEffect:handleMapClick");
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
