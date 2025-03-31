import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus marker icon
const createBusIcon = (busNo: string, routeNo: string) => L.divIcon({
  className: 'bus-marker',
  html: `<div style="background-color: #222; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 10px; flex-direction: column;">
          <div>${busNo}</div>
          <div style="font-size: 8px">${routeNo}</div>
        </div>`,
  iconSize: [30, 30],
});

// Types for bus data
interface BusPosition {
  id: string;
  busNo: string;
  routeNo: string;
  position: [number, number];
  latitude: number;
  longitude: number;
}

// Component to center map on user location
function LocationFinder() {
  const map = useMap();
  const { toast } = useToast();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 15 });

    map.on('locationfound', (e) => {
      L.circle(e.latlng, e.accuracy).addTo(map);
      toast({
        title: "Location found",
        description: "Map centered on your location",
      });
    });

    map.on('locationerror', () => {
      map.setView([28.6139, 77.2090], 15); // Default to Delhi
      toast({
        title: "Location error",
        description: "Using default location (Delhi)",
        variant: "destructive",
      });
    });
  }, [map, toast]);

  return null;
}

const MapComponent: React.FC = () => {
  const [buses, setBuses] = useState<BusPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io('http://localhost:3000'); // Adjust to your server URL

    socket.on('connect', () => {
      toast({
        title: "Connected",
        description: "Receiving live bus updates",
      });
      setLoading(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast({
        title: "Connection error",
        description: "Failed to connect to bus service",
        variant: "destructive",
      });
      setLoading(false);
    });

    socket.on('busUpdate', (data: { buses: any[] }) => {
      const transformedBuses = data.buses.map(bus => ({
        id: bus.busNo || 'Unknown',
        busNo: bus.busNo || 'Unknown',
        routeNo: bus.routeNo || 'Unknown',
        position: [bus.latitude, bus.longitude] as [number, number],
        latitude: bus.latitude,
        longitude: bus.longitude,
      }));

      setBuses(transformedBuses);
      setLoading(false);

      toast({
        title: "Data updated",
        description: `Tracking ${transformedBuses.length} buses`,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        style={{ width: '100%', height: '100%' }}
        center={[28.6139, 77.2090] as [number, number]}
        zoom={15}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <LocationFinder />

        {buses.map((bus) => (
          <Marker
            key={bus.id}
            position={bus.position}
            icon={createBusIcon(bus.busNo, bus.routeNo)}
          >
            <Popup>
              <div className="font-medium">Bus {bus.busNo}</div>
              <div className="text-sm">Route: {bus.routeNo}</div>
              <div className="text-sm">Lat: {bus.latitude}</div>
              <div className="text-sm">Lon: {bus.longitude}</div>
            </Popup>
          </Marker>
        ))}

        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', textAlign: 'center' }}>
            Loading bus data...
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;