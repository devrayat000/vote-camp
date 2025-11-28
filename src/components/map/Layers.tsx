import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { Constituency, Ward } from "@/lib/types";

interface LayersProps {
  zoom: number;
  constituency: Constituency;
  wards: Ward[];
  onConstituencyClick?: (event: google.maps.MapMouseEvent) => void;
}

// Helper to convert GeoJSON coordinates to Google Maps paths
const convertCoordinates = (geometry: {
  type: string;
  coordinates: unknown[];
}) => {
  if (!geometry || !geometry.coordinates) return [];

  const processPolygon = (coords: unknown[]) => {
    // GeoJSON is [lng, lat], Google Maps is {lat, lng}
    // coords[0] is the outer ring
    const ring = coords[0] as number[][];
    return ring.map((pt) => ({ lat: pt[1], lng: pt[0] }));
  };

  if (geometry.type === "Polygon") {
    return [processPolygon(geometry.coordinates)];
  } else if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((poly) =>
      processPolygon(poly as unknown[])
    );
  }
  return [];
};

export function Layers({
  zoom,
  constituency,
  wards,
  onConstituencyClick,
}: LayersProps) {
  const map = useMap();

  // Effect to render Constituency Polygon (Zoom < 13)
  useEffect(() => {
    if (!map) return;

    const showConstituency = zoom < 13;

    const constituencyPaths = convertCoordinates(constituency.geometry);

    // Calculate bounds based on the constituency geometry
    const bounds = new google.maps.LatLngBounds();
    constituencyPaths.forEach((path) => {
      path.forEach((point) => bounds.extend(point));
    });

    // Restrict the map to the calculated bounds
    map.setOptions({
      restriction: {
        latLngBounds: bounds,
        strictBounds: false,
      },
    });

    const constituencyPolygon = new google.maps.Polygon({
      paths: constituencyPaths,
      strokeColor: "#2563eb",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      fillColor: "#2563eb",
      fillOpacity: 0.9,
      map: showConstituency ? map : null,
      zIndex: 1,
      clickable: true, // Make sure it's clickable
    });

    if (onConstituencyClick) {
      constituencyPolygon.addListener("click", onConstituencyClick);
    }

    const wardPolygons = wards.map((ward) => {
      const wardPaths = convertCoordinates(ward.geometry);
      return new google.maps.Polygon({
        paths: wardPaths,
        strokeColor: "#16a34a",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#16a34a",
        fillOpacity: 0.1,
        map: !showConstituency ? map : null,
        zIndex: 2,
        clickable: false,
      });
    });

    return () => {
      if (onConstituencyClick) {
        google.maps.event.clearListeners(constituencyPolygon, "click");
      }
      constituencyPolygon.setMap(null);
      wardPolygons.forEach((p) => p.setMap(null));

      // Remove restriction when component unmounts
      map.setOptions({ restriction: null });
    };
  }, [map, zoom, constituency, wards, onConstituencyClick]);

  return null; // This component doesn't render DOM elements, it manages Map objects
}
