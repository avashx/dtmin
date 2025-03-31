import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import io from 'socket.io-client';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const busStopIcon = L.divIcon({
  className: 'bus-stop-marker',
  html: `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/><path d="M5 9h14"/><path d="M5 14h14"/></svg>
        </div>`,
  iconSize: [36, 36],
});

const createBusIcon = (busNo: string, routeNo: string) => L.divIcon({
  className: 'bus-marker',
  html: `<div style="background-color: #222; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 10px; flex-direction: column;">
          <div>${busNo}</div>
          <div style="font-size: 8px">${routeNo}</div>
        </div>`,
  iconSize: [30, 30],
});

// Types for our data
interface BusPosition {
  id: string;
  route: string;
  position: [number, number];
  nextStop: string;
  eta: string;
  busNo?: string;
  routeNo?: string;
  latitude?: number;
  longitude?: number;
}

interface BusStop {
  id?: number;
  name: string;
  position?: [number, number];
  buses?: string[];
  latitude?: number;
  longitude?: number;
}

// Component to locate user and adjust map view
function LocationFinder() {
  const map = useMap();
  const { toast } = useToast();
  
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });
    
    map.on('locationfound', (e) => {
      const radius = e.accuracy;
      L.circle(e.latlng, radius).addTo(map);
      toast({
        title: "Location found",
        description: "We've found your location and centered the map"
      });
    });
    
    map.on('locationerror', (e) => {
      console.error('Location error:', e.message);
      map.setView([28.6139, 77.2090], 15); // Default to Delhi center
      toast({
        title: "Location error",
        description: "Could not determine your location. Using default location.",
        variant: "destructive"
      });
    });
  }, [map, toast]);
  
  return null;
}

interface MapProps {
  showStops: boolean;
  showBuses: boolean;
  panelExpanded: boolean;
}

const MapComponent: React.FC<MapProps> = ({ showStops, showBuses, panelExpanded }) => {
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [buses, setBuses] = useState<BusPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [socket, setSocket] = useState<any>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000'); // Adjust URL to your server
    setSocket(newSocket);

    newSocket.on('connect', () => {
      toast({
        title: "Connected to server",
        description: "Receiving real-time bus updates"
      });
      setLoading(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      toast({
        title: "Connection error",
        description: "Unable to connect to the real-time bus service",
        variant: "destructive"
      });
      setLoading(false);
    });

    newSocket.on('busUpdate', (data: { buses: any[], busStops: any[] }) => {
      // Transform server data to match component interfaces
      const transformedBuses = data.buses.map(bus => ({
        id: bus.busNo || 'Unknown',
        route: bus.routeNo || 'Unknown',
        position: [bus.latitude, bus.longitude] as [number, number],
        nextStop: 'Next stop information not available',
        eta: 'ETA information not available',
        busNo: bus.busNo,
        routeNo: bus.routeNo,
        latitude: bus.latitude,
        longitude: bus.longitude
      }));

      const transformedStops = data.busStops.map((stop, index) => ({
        id: index,
        name: stop.name || 'Unknown Stop',
        position: [stop.latitude, stop.longitude] as [number, number],
        buses: [],
        latitude: stop.latitude,
        longitude: stop.longitude
      }));

      setBuses(transformedBuses);
      setBusStops(transformedStops);
      setLoading(false);

      toast({
        title: "Data updated",
        description: `Live data: ${transformedBuses.length} buses, ${transformedStops.length} stops`
      });
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [toast]);

  return (
    <div className={`transition-all duration-300 ease-in-out ${panelExpanded ? 'h-[50vh]' : 'h-[calc(100vh-70px)]'}`}>
      <MapContainer 
        style={{ width: '100%', height: '100%', borderRadius: '0 0 20px 20px' }}
        zoomControl={false}
        attributionControl={false}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        easeLinearity={0.35}
        center={[28.6139, 77.2090] as [number, number]}
        zoom={15}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <LocationFinder />
        
        {showStops && busStops.map((stop) => (
          <Marker 
            key={stop.id || `stop-${stop.name}`}
            position={(stop.position || [stop.latitude || 0, stop.longitude || 0]) as [number, number]}
            icon={busStopIcon}
          >
            <Popup>
              <div className="font-medium text-lg">{stop.name}</div>
              {stop.buses && stop.buses.length > 0 && (
                <div className="text-sm mt-1">Buses: {stop.buses.join(', ')}</div>
              )}
            </Popup>
          </Marker>
        ))}
        
        {showBuses && buses.map((bus) => (
          <Marker 
            key={bus.id}
            position={(bus.position || [bus.latitude || 0, bus.longitude || 0]) as [number, number]}
            icon={createBusIcon(bus.busNo || 'Bus', bus.routeNo || 'N/A')}
          >
            <Popup>
              <div className="font-medium">Bus {bus.route || bus.routeNo || bus.id}</div>
              <div className="text-sm">Bus No: {bus.busNo || 'Unknown'}</div>
              <div className="text-sm">Route: {bus.routeNo || 'Unknown'}</div>
              <div className="text-sm">Next stop: {bus.nextStop}</div>
              <div className="text-sm">ETA: {bus.eta}</div>
            </Popup>
          </Marker>
        ))}
        
        {loading && (
          <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-center">
            Loading bus data...
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;