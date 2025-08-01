import { useState, useEffect } from "react";
import { MapPin, CheckCircle, XCircle } from "lucide-react";

interface LocationVerificationProps {
  onLocationUpdate: (location: { lat: number; lng: number; address?: string }) => void;
}

export default function LocationVerification({ onLocationUpdate }: LocationVerificationProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const getLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get address
      let address = "Location verified";
      try {
        // Using a simple reverse geocoding approach (in production, use a proper service)
        address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
      } catch (geocodeError) {
        console.warn("Geocoding failed:", geocodeError);
      }

      const locationData = { lat: latitude, lng: longitude, address };
      setLocation(locationData);
      setIsVerified(true);
      onLocationUpdate(locationData);
    } catch (error) {
      console.error("Location error:", error);
      setError("Unable to get location. Please enable location services.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-get location on component mount
    getLocation();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm">
          <MapPin className={`h-5 w-5 ${isVerified ? 'text-secondary' : 'text-gray-400'}`} />
          <span>Location Verification</span>
        </div>
        {isVerified && (
          <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-xs">
            <CheckCircle className="inline h-3 w-3 mr-1" />
            Verified
          </span>
        )}
        {error && (
          <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs">
            <XCircle className="inline h-3 w-3 mr-1" />
            Failed
          </span>
        )}
      </div>

      {location && (
        <div className="text-xs text-neutral bg-gray-50 p-3 rounded-lg">
          <p>{location.address}</p>
        </div>
      )}

      {error && (
        <div className="text-xs text-accent bg-accent/10 p-3 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={getLocation}
            className="mt-2 text-primary hover:text-primary/80 underline"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-xs text-neutral bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            Getting your location...
          </div>
        </div>
      )}
    </div>
  );
}