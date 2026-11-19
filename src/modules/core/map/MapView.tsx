"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "./LeafletMap";

// Leaflet touches `window`, and is heavy: load it only in the browser, after the page.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="map map-loading" />,
});

export function MapView(props: MapProps) {
  return <LeafletMap {...props} />;
}
