import { Fragment, useEffect, useState } from "react";
import { Map, MapControl, ControlPosition } from "@vis.gl/react-google-maps";
import type { Constituency, CampaignMarker } from "@/lib/types";
import { subscribeToMarkers } from "@/lib/api";
import { PolygonLayer } from "@deck.gl/layers";
import DeckGLOverlay from "./Overlay";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

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
