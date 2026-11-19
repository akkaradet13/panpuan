"use client";

import "leaflet/dist/leaflet.css";
import { latLngBounds, type LatLngTuple } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import { decodePolyline } from "../polyline";

export type MapProps = {
  polyline?: string;
  markers?: { lat: number; lng: number; label?: string }[];
  onPick?: (lat: number, lng: number) => void;
  height?: number;
};

const UBON: LatLngTuple = [15.2448, 104.8473];

function Picker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function LeafletMap({ polyline, markers = [], onPick, height = 320 }: MapProps) {
  const line = polyline ? decodePolyline(polyline) : [];
  const all: LatLngTuple[] = [...line, ...markers.map((m) => [m.lat, m.lng] as LatLngTuple)];
  const bounds = all.length > 1 ? latLngBounds(all).pad(0.05) : undefined;

  return (
    <MapContainer
      className="map"
      style={{ height }}
      bounds={bounds}
      center={bounds ? undefined : (all[0] ?? UBON)}
      zoom={bounds ? undefined : all.length ? 15 : 12}
      scrollWheelZoom={false}
    >
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {line.length > 1 && (
        <>
          <Polyline positions={line} pathOptions={{ color: "#ff6a00", weight: 5 }} />
          <CircleMarker center={line[0]} radius={8} pathOptions={{ color: "#22272d", fillColor: "#8fd320", fillOpacity: 1 }}>
            <Tooltip>จุดเริ่ม</Tooltip>
          </CircleMarker>
        </>
      )}
      {markers.map((m, i) => (
        <CircleMarker key={i} center={[m.lat, m.lng]} radius={9} pathOptions={{ color: "#22272d", fillColor: "#ff6a00", fillOpacity: 1 }}>
          {m.label && <Tooltip permanent>{m.label}</Tooltip>}
        </CircleMarker>
      ))}
      {onPick && <Picker onPick={onPick} />}
    </MapContainer>
  );
}
