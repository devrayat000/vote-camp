import { useEffect, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface DrawingManagerProps {
  onOverlayComplete: (rectangle: google.maps.Rectangle) => void;
}

export function DrawingManager({ onOverlayComplete }: DrawingManagerProps) {
  const map = useMap();
  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager | null>(null);

  useEffect(() => {
    if (!map) return;

    // Initialize DrawingManager
    const dm = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.RECTANGLE],
      },
      rectangleOptions: {
        fillColor: "#3b82f6",
        fillOpacity: 0.3,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: true,
        zIndex: 1,
      },
    });

    dm.setMap(map);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawingManager(dm);

    return () => {
      dm.setMap(null);
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!drawingManager) return;

    const listener = google.maps.event.addListener(
      drawingManager,
      "overlaycomplete",
      (event: google.maps.drawing.OverlayCompleteEvent) => {
        if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
          const rectangle = event.overlay as google.maps.Rectangle;

          // Switch back to non-drawing mode after one shape
          drawingManager.setDrawingMode(null);

          onOverlayComplete(rectangle);
        }
      }
    );

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [drawingManager, onOverlayComplete]);

  return null;
}
