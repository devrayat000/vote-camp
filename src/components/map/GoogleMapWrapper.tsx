import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Map,
  MapControl,
  ControlPosition,
  useApiIsLoaded,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { Constituency, Ward, MarkerStatus } from "@/lib/types";
import { subscribeToWards, addWard } from "@/lib/api";
import { generateMockWards } from "@/lib/mockWards";
import { PolygonLayer } from "@deck.gl/layers";
import DeckGLOverlay from "./Overlay";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
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
}

export function GoogleMapWrapper({ constituency }: GoogleMapWrapperProps) {
  const isLoaded = useApiIsLoaded();
  const coreLib = useMapsLibrary("core");
  const mapsLib = useMapsLibrary("maps");
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);

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
    const unsubscribe = subscribeToWards(constituency.id, (data) => {
      setWards(data);
    });
    return () => unsubscribe();
  }, [constituency.id]);

  const handleSeedWards = async () => {
    const mockWards = generateMockWards(constituency);
    for (const ward of mockWards) {
      await addWard(ward);
    }
    toast.success("Wards seeded!");
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
          setSelectedWardId(null);
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
            {wards.length === 0 && (
              <Button
                variant="default"
                onClick={handleSeedWards}
                className="shadow-md"
              >
                Seed Wards
              </Button>
            )}
          </div>
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
              getFillColor: [0x25, 0x63, 0xeb, 0x20],
              lineWidthMinPixels: 1,
              colorFormat: "RGBA",
              pickable: true,
            }),
            new PolygonLayer({
              id: "wards-layer",
              data: wards,
              getPolygon: (d: Ward) => d.geometry.coordinates,
              getFillColor: (d: Ward) => getStatusColor(d.status),
              getLineColor: [0, 0, 0, 100],
              getLineWidth: 2,
              lineWidthMinPixels: 1,
              pickable: true,
              onClick: (info) => {
                if (info.object) {
                  setSelectedWardId(info.object.id);
                  return true;
                }
              },
            }),
          ]}
          layerFilter={() => {
            return true;
          }}
        />
      </Map>

      {/* Sidebar for Details */}
      {selectedWardId && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 p-4 animate-in slide-in-from-right overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Ward Details</h2>
          {(() => {
            const ward = wards.find((w) => w.id === selectedWardId);
            if (!ward) return null;
            return (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Name</h3>
                  <p>{ward.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <p className="capitalize">{ward.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Activity Log</h3>
                  {ward.activityLog && ward.activityLog.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                      {ward.activityLog.map((log, i) => (
                        <li key={i} className="text-sm border-b pb-2">
                          <p className="font-medium">{log.workerName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs">{log.action}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No activity yet.</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedWardId(null)}
                >
                  Close
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </Fragment>
  );
}
