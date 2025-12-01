import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Map,
  MapControl,
  ControlPosition,
  useApiIsLoaded,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { Constituency, CampaignArea, MarkerStatus } from "@/lib/types";
import { subscribeToAreas, addArea, updateAreaStatus } from "@/lib/api";
import { PolygonLayer } from "@deck.gl/layers";
import DeckGLOverlay from "./Overlay";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { DrawingManager } from "./DrawingManager";
import { MarkerSidebar } from "./MarkerSidebar";
import { toast } from "sonner";

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

function getStatusColor(
  status: MarkerStatus
): [number, number, number, number] {
  switch (status) {
    case "visited":
      return [34, 197, 94, 100]; // Green
    case "absent":
      return [239, 68, 68, 100]; // Red
    case "completed":
      return [59, 130, 246, 100]; // Blue
    case "pending":
    default:
      return [148, 163, 184, 100]; // Gray
  }
}

interface GoogleMapWrapperProps {
  constituency: Constituency;
  areas: CampaignArea[];
}

export function GoogleMapWrapper({
  constituency,
  areas: initialAreas,
}: GoogleMapWrapperProps) {
  const isLoaded = useApiIsLoaded();
  const coreLib = useMapsLibrary("core");
  const mapsLib = useMapsLibrary("maps");
  const [areas, setAreas] = useState<CampaignArea[]>(initialAreas);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [newAreaBounds, setNewAreaBounds] =
    useState<google.maps.LatLngBoundsLiteral | null>(null);

  const [tempRectangle, setTempRectangle] =
    useState<google.maps.Rectangle | null>(null);

  const restrictions = useMemo(() => {
    if (!isLoaded || !coreLib) {
      return undefined;
    }

    const constituencyPaths = convertCoordinates(constituency.geometry);

    // Calculate bounds based on the constituency geometry
    const bounds = new coreLib.LatLngBounds();
    constituencyPaths.forEach((path) => {
      path.forEach((point) => bounds.extend(point));
    });
    return bounds;
  }, [isLoaded, coreLib, constituency]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToAreas(constituency.id, (data) => {
      setAreas(data);
    });
    return () => unsubscribe();
  }, [constituency.id]);

  const handleOverlayComplete = (rectangle: google.maps.Rectangle) => {
    const bounds = rectangle.getBounds();
    if (bounds) {
      setNewAreaBounds(bounds.toJSON());
      setIsDrawing(false);
      // Do NOT remove the map from the rectangle yet.
      // We need it visible while the user fills out the form.
      // We will remove it when the form is saved or cancelled.

      // Store the rectangle instance to clean it up later
      setTempRectangle(rectangle);
    }
  };

  const cleanupTempRectangle = () => {
    if (tempRectangle) {
      tempRectangle.setMap(null);
      setTempRectangle(null);
    }
  };

  const handleSaveNewArea = async (status: MarkerStatus, notes: string) => {
    if (newAreaBounds) {
      toast.promise(
        addArea({
          bounds: newAreaBounds,
          status,
          notes,
          constituencyId: constituency.id,
        }),
        {
          loading: "Saving new area...",
          success: "New area saved!",
          error: "Failed to save new area.",
        }
      );
      setNewAreaBounds(null);
      cleanupTempRectangle();
    }
  };

  const handleUpdateArea = async (
    id: string,
    status: MarkerStatus,
    notes: string
  ) => {
    toast.promise(updateAreaStatus(id, status, notes), {
      loading: "Updating area...",
      success: "Area updated!",
      error: "Failed to update area.",
    });
    setSelectedAreaId(null);
  };

  return (
    <Fragment>
      <Map
        defaultCenter={constituency.center}
        defaultZoom={15}
        mapId="DEMO_MAP_ID"
        disableDefaultUI={false}
        mapTypeControlOptions={{
          position: ControlPosition.TOP_RIGHT,
          style: mapsLib?.MapTypeControlStyle.DROPDOWN_MENU,
        }}
        gestureHandling={"greedy"}
        restriction={
          restrictions
            ? {
                latLngBounds: restrictions,
                strictBounds: false,
              }
            : undefined
        }
        onClick={() => {
          setSelectedAreaId(null);
          setNewAreaBounds(null);
          setIsDrawing(false);
          cleanupTempRectangle();
        }}
      >
        <MapControl position={ControlPosition.TOP_LEFT}>
          <div className="flex flex-col gap-2">
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

            <Button
              variant={isDrawing ? "destructive" : "secondary"}
              size="icon-lg"
              className="shadow-md bg-white rounded-xs"
              onClick={() => {
                setIsDrawing(!isDrawing);
                setSelectedAreaId(null);
                setNewAreaBounds(null);
              }}
            >
              {isDrawing ? (
                <X className="h-8 w-8" />
              ) : (
                <Pencil className="h-8 w-8" />
              )}
            </Button>
          </div>
        </MapControl>

        {isDrawing && (
          <DrawingManager onOverlayComplete={handleOverlayComplete} />
        )}

        <DeckGLOverlay
          interleaved
          layers={[
            new PolygonLayer({
              id: "constituency-layer",
              data: [constituency.geometry],
              getPolygon: (d) => d.coordinates,
              getLineColor: [0x25, 0x63, 0xeb, 0x80],
              getLineWidth: 20,
              getFillColor: [0x25, 0x63, 0xeb, 0x05], // Reduced opacity to see areas better
              lineWidthMinPixels: 1,
              colorFormat: "RGBA",
              pickable: true,
            }),
            new PolygonLayer({
              id: "campaign-areas-layer",
              data: areas,
              getPolygon: (d: CampaignArea) => [
                [d.bounds.west, d.bounds.north],
                [d.bounds.east, d.bounds.north],
                [d.bounds.east, d.bounds.south],
                [d.bounds.west, d.bounds.south],
                [d.bounds.west, d.bounds.north],
              ],
              getFillColor: (d: CampaignArea) => getStatusColor(d.status),
              getLineColor: (d: CampaignArea) => {
                const color = getStatusColor(d.status);
                return [color[0], color[1], color[2], 255];
              },
              getLineWidth: 2,
              lineWidthMinPixels: 1,
              pickable: true,
              onClick: (info) => {
                if (info.object) {
                  setSelectedAreaId(info.object.id);
                  setNewAreaBounds(null);
                  setIsDrawing(false);
                  return true;
                }
              },
            }),
          ]}
          layerFilter={({ layer, viewport }) => {
            if (layer.id === "campaign-areas-layer") {
              return viewport.zoom >= 15;
            }
            if (layer.id === "constituency-layer") {
              return viewport.zoom < 15;
            }
            return true;
          }}
        />
      </Map>

      {/* Sidebar for Details */}
      {(selectedAreaId || newAreaBounds) && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 p-4 animate-in slide-in-from-right">
          <MarkerSidebar
            key={selectedAreaId || "new"}
            // We need to cast or update MarkerSidebar to accept CampaignArea
            // For now, let's assume we update MarkerSidebar or map the props
            marker={areas.find((m) => m.id === selectedAreaId)}
            isNew={!!newAreaBounds}
            onSave={handleSaveNewArea}
            onUpdate={handleUpdateArea}
            onClose={() => {
              setSelectedAreaId(null);
              setNewAreaBounds(null);
              setIsDrawing(false);
              cleanupTempRectangle();
            }}
          />
        </div>
      )}
    </Fragment>
  );
}
