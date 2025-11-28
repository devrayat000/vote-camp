import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";
import type {
  Constituency,
  Ward,
  CampaignMarker,
  GeoPoint,
  MarkerStatus,
} from "@/lib/types";
import { Layers } from "./Layers";
import { MarkerSidebar } from "./MarkerSidebar";
import { ConstituencySidebar } from "./ConstituencySidebar";
import { subscribeToMarkers, addMarker, updateMarkerStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GoogleMapWrapperProps {
  constituency: Constituency;
  wards: Ward[];
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // TODO: Replace

export function GoogleMapWrapper({
  constituency,
  wards,
}: GoogleMapWrapperProps) {
  const [markers, setMarkers] = useState<CampaignMarker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMarkerLocation, setNewMarkerLocation] = useState<GeoPoint | null>(
    null
  );
  const [zoom, setZoom] = useState(12);
  const [showConstituencyDetails, setShowConstituencyDetails] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToMarkers(constituency.id, (data) => {
      setMarkers(data);
    });
    return () => unsubscribe();
  }, [constituency.id]);

  const handleMapClick = (ev: MapMouseEvent) => {
    if (isCreating && ev.detail.latLng) {
      setNewMarkerLocation({
        lat: ev.detail.latLng.lat,
        lng: ev.detail.latLng.lng,
      });
      setSelectedMarkerId(null); // Deselect existing
      setShowConstituencyDetails(false);
    } else {
      // If not creating, clicking map deselects everything
      setSelectedMarkerId(null);
      setNewMarkerLocation(null);
      setIsCreating(false);
      setShowConstituencyDetails(false);
    }
  };

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarkerId(markerId);
    setIsCreating(false);
    setNewMarkerLocation(null);
    setShowConstituencyDetails(false);
  };

  const handleConstituencyClick = (ev: google.maps.MapMouseEvent) => {
    setShowConstituencyDetails(true);
    setSelectedMarkerId(null);
    setNewMarkerLocation(null);
    setIsCreating(false);
    ev.stop();
  };

  const handleSaveNewMarker = async (status: MarkerStatus, notes: string) => {
    if (newMarkerLocation) {
      await addMarker({
        location: newMarkerLocation,
        status,
        notes,
        constituencyId: constituency.id,
      });
      setIsCreating(false);
      setNewMarkerLocation(null);
    }
  };

  const handleUpdateMarker = async (
    id: string,
    status: MarkerStatus,
    notes: string
  ) => {
    await updateMarkerStatus(id, status, notes);
    setSelectedMarkerId(null);
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="relative w-full h-screen">
        <Map
          defaultCenter={constituency.center}
          defaultZoom={13}
          mapId="DEMO_MAP_ID" // Required for AdvancedMarker
          className="w-full h-full"
          onClick={handleMapClick}
          onCameraChanged={(ev) => setZoom(ev.detail.zoom)}
          disableDefaultUI={true}
        >
          <Layers
            zoom={zoom}
            constituency={constituency}
            wards={wards}
            onConstituencyClick={handleConstituencyClick}
          />

          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={marker.location}
              onClick={() => handleMarkerClick(marker.id)}
            >
              <Pin
                background={getStatusColor(marker.status)}
                borderColor={"#000"}
                glyphColor={"#fff"}
              />
            </AdvancedMarker>
          ))}

          {newMarkerLocation && (
            <AdvancedMarker position={newMarkerLocation}>
              <Pin background={"#3b82f6"} scale={1.2} />
            </AdvancedMarker>
          )}
        </Map>

        {/* Floating Action Button for Adding Marker */}
        <div className="absolute bottom-8 right-8">
          <Button
            size="lg"
            className={`rounded-full shadow-lg ${
              isCreating
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={() => {
              setIsCreating(!isCreating);
              setNewMarkerLocation(null);
              setSelectedMarkerId(null);
              setShowConstituencyDetails(false);
            }}
          >
            {isCreating ? <Plus className="rotate-45" /> : <Plus />}
            <span className="ml-2">{isCreating ? "Cancel" : "Add Visit"}</span>
          </Button>
        </div>

        {/* Sidebar for Details */}
        {(selectedMarkerId || newMarkerLocation) && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 p-4 animate-in slide-in-from-right">
            <MarkerSidebar
              key={selectedMarkerId || "new"}
              marker={markers.find((m) => m.id === selectedMarkerId)}
              isNew={!!newMarkerLocation}
              onSave={handleSaveNewMarker}
              onUpdate={handleUpdateMarker}
              onClose={() => {
                setSelectedMarkerId(null);
                setNewMarkerLocation(null);
                setIsCreating(false);
              }}
            />
          </div>
        )}

        {/* Sidebar for Constituency Details */}
        {showConstituencyDetails && !selectedMarkerId && !newMarkerLocation && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 p-4 animate-in slide-in-from-right">
            <ConstituencySidebar
              constituency={constituency}
              onClose={() => setShowConstituencyDetails(false)}
            />
          </div>
        )}

        {/* Zoom Indicator (Debug/Info) */}
        <div className="absolute top-4 left-4 bg-white/90 p-2 rounded shadow text-xs font-mono">
          Zoom: {zoom.toFixed(1)} |{" "}
          {zoom < 13 ? "Showing Constituency" : "Showing Wards"}
        </div>
      </div>
    </APIProvider>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "visited":
      return "#22c55e"; // Green
    case "absent":
      return "#ef4444"; // Red
    case "pending":
      return "#94a3b8"; // Gray
    case "completed":
      return "#3b82f6"; // Blue
    default:
      return "#94a3b8";
  }
}
