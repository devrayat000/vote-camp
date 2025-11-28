import { useMemo, useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import {
  GoogleMapsOverlay,
  type GoogleMapsOverlayProps,
} from "@deck.gl/google-maps";

export default function DeckGLOverlay(props: GoogleMapsOverlayProps) {
  const map = useMap();

  // the GoogleMapsOverlay can persist throughout the lifetime of the DeckGlOverlay
  const deck = useMemo(() => new GoogleMapsOverlay({ interleaved: true }), []);

  useEffect(() => {
    deck.setMap(map);
  }, [deck, map]);

  // whenever the rendered data changes, the layers will be updated
  useEffect(() => {
    deck.setProps(props);
  }, [deck, props]);

  return null;
}
