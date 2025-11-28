import { Fragment, useEffect, useState } from "react";
import { Map, MapControl, ControlPosition } from "@vis.gl/react-google-maps";
import type { Constituency, CampaignMarker } from "@/lib/types";
import { subscribeToMarkers } from "@/lib/api";
import { PolygonLayer } from "@deck.gl/layers";
import DeckGLOverlay from "./Overlay";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

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

function getRestrictions(constituency: Constituency) {
  const constituencyPaths = convertCoordinates(constituency.geometry);

  // Calculate bounds based on the constituency geometry
  const bounds = new google.maps.LatLngBounds();
  constituencyPaths.forEach((path) => {
    path.forEach((point) => bounds.extend(point));
  });
  return bounds;
}

interface GoogleMapWrapperProps {
  constituency: Constituency;
}

export function GoogleMapWrapper({ constituency }: GoogleMapWrapperProps) {
  const [, setMarkers] = useState<CampaignMarker[]>([]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToMarkers(constituency.id, (data) => {
      setMarkers(data);
    });
    return () => unsubscribe();
  }, [constituency.id]);

  const restrictions = getRestrictions(constituency);

  return (
    <Fragment>
      <Map
        defaultCenter={constituency.center}
        defaultZoom={15}
        mapId="DEMO_MAP_ID"
        // onClick={handleMapClick}
        disableDefaultUI={false}
        mapTypeControlOptions={{
          position: ControlPosition.TOP_RIGHT,
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        }}
        gestureHandling={"greedy"}
        restriction={{
          latLngBounds: restrictions,
          strictBounds: false,
        }}
      >
        <MapControl position={ControlPosition.TOP_LEFT}>
          <Button
            variant="secondary"
            size="icon-lg"
            asChild
            className="shadow-md bg-white rounded-xs"
          >
            <Link to="/" replace>
              <ArrowLeft className="h-8 w-8" />
            </Link>
          </Button>
        </MapControl>
        <DeckGLOverlay
          interleaved
          layers={[
            new PolygonLayer({
              id: "constituency-layer",
              data: [constituency.geometry],
              getPolygon: (d) => d.coordinates,
              getLineColor: [0x25, 0x63, 0xeb, 0x80],
              getLineWidth: 20,
              getFillColor: [0x25, 0x63, 0xeb, 0x40],
              lineWidthMinPixels: 1,
              colorFormat: "RGBA",
              pickable: true,
            }),
          ]}
        />
      </Map>
    </Fragment>
  );
}
