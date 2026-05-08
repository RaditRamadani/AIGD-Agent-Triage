"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Navigation, Clock } from "lucide-react";
import type { Facility } from "@/types";

// ── MapEmbed ──
// Menampilkan peta Google Maps interaktif dengan markers faskes.
// Marker biru = lokasi pasien, marker merah = faskes.

interface MapEmbedProps {
  facilities: Facility[];
  userLocation?: { lat: number; lng: number };
}

export function MapEmbed({ facilities, userLocation }: MapEmbedProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pastikan API key tersedia
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps API key belum dikonfigurasi.");
      return;
    }

    if (!mapRef.current || facilities.length === 0) return;

    // Set API options (v2 API)
    setOptions({ key: apiKey, v: "weekly" });

    // Load maps library
    importLibrary("maps")
      .then((mapsLib) => {
        const MapClass = (mapsLib as google.maps.MapsLibrary).Map;

        // Center peta di lokasi user atau faskes pertama
        const center = userLocation ?? facilities[0]?.location ?? { lat: -7.2575, lng: 112.7521 };

        const map = new MapClass(mapRef.current!, {
          center,
          zoom: 13,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Marker lokasi pasien (biru)
        if (userLocation) {
          new google.maps.Marker({
            position: userLocation,
            map,
            title: "Lokasi Anda",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#0891B2",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          });
        }

        // Markers faskes (merah + label)
        facilities.forEach((facility, index) => {
          const marker = new google.maps.Marker({
            position: facility.location,
            map,
            title: facility.name,
            label: {
              text: String(index + 1),
              color: "white",
              fontWeight: "bold",
            },
          });

          // Info window
          const infoContent = `
            <div style="font-family: 'Noto Sans', sans-serif; padding: 4px; max-width: 220px;">
              <strong style="font-size: 14px;">${facility.name}</strong>
              <p style="font-size: 12px; margin: 4px 0; color: #666;">${facility.address}</p>
              ${facility.distance_km ? `<p style="font-size: 12px;">📍 ${facility.distance_km} km • ${facility.duration_minutes} menit</p>` : ""}
              <a href="https://www.google.com/maps/dir/?api=1&destination=${facility.location.lat},${facility.location.lng}"
                 target="_blank" rel="noopener noreferrer"
                 style="color: #0891B2; font-size: 12px; font-weight: 600;">
                 Navigasi →
              </a>
            </div>
          `;

          const infoWindow = new google.maps.InfoWindow({ content: infoContent });
          marker.addListener("click", () => infoWindow.open(map, marker));
        });

        setMapLoaded(true);
      })
      .catch((loadError: Error) => {
        console.error("Gagal memuat Google Maps:", loadError);
        setError("Gagal memuat peta.");
      });
  }, [facilities, userLocation]);

  // ── Fallback: list faskes tanpa peta ──
  if (error || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <FacilityList facilities={facilities} />
    );
  }

  return (
    <div className="space-y-3">
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-48 sm:h-64 rounded-xl overflow-hidden border border-[hsl(var(--color-border))] shadow-sm"
        aria-label="Peta fasilitas kesehatan terdekat"
      />

      {/* Facility list under map */}
      <FacilityList facilities={facilities} />
    </div>
  );
}

// ── FacilityList ──
// List faskes dengan info jarak dan tombol navigasi (selalu tampil).
function FacilityList({ facilities }: { facilities: Facility[] }) {
  return (
    <div className="space-y-2">
      {facilities.map((facility, index) => (
        <div
          key={facility.place_id}
          className="bg-white rounded-lg border border-[hsl(var(--color-border))] p-3 flex items-start gap-3
                     hover:shadow-md transition-shadow duration-200"
        >
          {/* Number badge */}
          <span className="shrink-0 w-7 h-7 rounded-full bg-[hsl(var(--color-primary))] text-white text-sm font-bold flex items-center justify-center">
            {index + 1}
          </span>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{facility.name}</p>
            <p className="text-xs text-[hsl(var(--color-text-muted))] truncate">
              {facility.address}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--color-text-muted))]">
              {facility.distance_km && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {facility.distance_km} km
                </span>
              )}
              {facility.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {facility.duration_minutes} mnt
                </span>
              )}
              {facility.is_open !== null && (
                <span className={facility.is_open ? "text-green-600" : "text-red-500"}>
                  {facility.is_open ? "Buka" : "Tutup"}
                </span>
              )}
            </div>
          </div>

          {/* Navigate button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${facility.location.lat},${facility.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--color-primary-light))] text-[hsl(var(--color-primary))]
                       flex items-center justify-center
                       hover:bg-[hsl(var(--color-primary))] hover:text-white
                       transition-all duration-200 cursor-pointer"
            aria-label={`Navigasi ke ${facility.name}`}
          >
            <Navigation className="w-4 h-4" />
          </a>
        </div>
      ))}
    </div>
  );
}
