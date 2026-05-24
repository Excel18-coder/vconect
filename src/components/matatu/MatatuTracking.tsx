import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface MatatuTrackingProps {
  bookingId: string;
  scheduleId: string;
  operatorName: string;
  routeName: string;
  departureTime: string;
  status: 'pending' | 'en_route' | 'arrived' | 'cancelled';
  onClose?: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MatatuTracking({
  bookingId,
  scheduleId,
  operatorName,
  routeName,
  departureTime,
  status,
  onClose,
}: MatatuTrackingProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markers = useRef<any[]>([]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    const loadGoogleMaps = () => {
      const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!mapsApiKey) {
        setError('Google Maps API key is not configured');
        return;
      }

      if (window.google && window.google.maps) {
        initMap();
      } else {
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
      }
    };

    const initMap = () => {
      if (!mapRef.current) return;

      const newMap = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: -1.2921, lng: 36.8219 }, // Nairobi center
        mapTypeControl: true,
        fullscreenControl: true,
      });

      setMap(newMap);
    };

    loadGoogleMaps();
  }, []);

  // Fetch live location
  useEffect(() => {
    if (!map) return;

    const fetchLocation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}/transport/tracking/${scheduleId}`, {
          credentials: 'include',
          headers: {
            ...getAuthHeaders(),
          },
        });

        if (response.status === 404) {
          throw new Error('Live tracking not available yet');
        }

        if (!response.ok) throw new Error('Failed to fetch location');

        const data = await response.json();
        if (data.success && data.location) {
          const loc = data.location;
          setCurrentLocation(loc);

          // Clear previous markers
          markers.current.forEach((marker) => marker.setMap(null));
          markers.current = [];

          // Add matatu marker
          const matatuMarker = new window.google.maps.Marker({
            position: {
              lat: loc.latitude,
              lng: loc.longitude,
            },
            map,
            title: `${operatorName} - ${routeName}`,
            icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px;">
                <strong>${operatorName}</strong><br>
                <small>${routeName}</small><br>
                <small>${new Date(loc.timestamp).toLocaleTimeString()}</small>
              </div>
            `,
          });

          matatuMarker.addListener('click', () => {
            infoWindow.open(map, matatuMarker);
          });

          markers.current.push(matatuMarker);

          // Center map on matatu
          map.setCenter({
            lat: loc.latitude,
            lng: loc.longitude,
          });

          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch location');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();

    // Poll location every 10 seconds
    const interval = setInterval(fetchLocation, 10000);

    return () => clearInterval(interval);
  }, [map, scheduleId, operatorName, routeName]);

  const getStatusColor = () => {
    switch (status) {
      case 'en_route':
        return 'bg-blue-500';
      case 'arrived':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'en_route':
        return 'In Transit';
      case 'arrived':
        return 'Arrived';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending Departure';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{operatorName}</h3>
          <p className="text-sm text-muted-foreground">{routeName}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`${getStatusColor()} text-white`}>
              {getStatusLabel()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Departs: {new Date(departureTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden border">
        <div
          ref={mapRef}
          className="w-full h-96 bg-muted"
          style={{ minHeight: '400px' }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="bg-white rounded-lg p-3 flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading location...</span>
            </div>
          </div>
        )}
      </div>

      {/* Location Info */}
      {currentLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">Current Location</span>
          </div>
          <div className="text-sm text-blue-900">
            <p>
              Latitude: <code className="bg-white px-2 py-1 rounded">{currentLocation.latitude.toFixed(6)}</code>
            </p>
            <p>
              Longitude: <code className="bg-white px-2 py-1 rounded">{currentLocation.longitude.toFixed(6)}</code>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Updated: {new Date(currentLocation.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Journey Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Booking ID</p>
          <p className="font-mono text-xs font-semibold break-all">{bookingId.substring(0, 8)}...</p>
        </div>
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <p className="font-semibold text-xs">{getStatusLabel()}</p>
        </div>
      </div>

      {/* Auto-Refresh Info */}
      <p className="text-xs text-muted-foreground text-center">
        📍 Location updates every 10 seconds
      </p>
    </div>
  );
}
