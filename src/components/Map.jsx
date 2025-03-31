
import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import io from 'socket.io-client';
import axios from 'axios';

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

const createBusIcon = (busNo, routeNo) => L.divIcon({
  className: 'bus-marker',
  html: `<div style="background-color: #222; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 10px; flex-direction: column;">
          <div>${busNo}</div>
          <div style="font-size: 8px">${routeNo}</div>
        </div>`,
  iconSize: [30, 30],
});

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
      // Default to Delhi center if location not found
      map.setView([28.6139, 77.2090], 15);
      toast({
        title: "Location error",
        description: "Could not determine your location. Using default location.",
        variant: "destructive"
      });
    });
  }, [map, toast]);
  
  return null;
}

const MapComponent = ({ showStops, showBuses, panelExpanded }) => {
  const [busStops, setBusStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [socket, setSocket] = useState(null);

  // Function to fetch real-time bus data from the Delhi API
  const fetchLiveBusData = useCallback(async () => {
    try {
      const response = await axios.get('https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=7pnJf5w6MCh0JWrdisnafk0YhnKfUqxx', {
        responseType: 'arraybuffer',
      });
      
      // This is a placeholder since we can't directly parse protobuf on the client
      // In a real implementation, we'd need a server-side proxy to parse this data
      // The code would interact with our Socket.IO server which handles the protobuf parsing
      console.log('Attempted to fetch live bus data, but client-side protobuf parsing not supported');
      
    } catch (error) {
      console.error('Failed to fetch live bus data:', error);
      toast({
        title: "API Error",
        description: "Could not fetch live bus data. Using demo data instead.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Initialize Socket.IO connection
  useEffect(() => {
    // We're directly connecting to the current host
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      toast({
        title: "Connected to server",
        description: "Receiving real-time bus updates"
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast({
        title: "Connection error",
        description: "Unable to connect to the real-time bus service",
        variant: "destructive"
      });
      
      // Fallback to demo data if real connection fails
      fetchDemoData();
    });

    // Try to fetch real-time data
    fetchLiveBusData();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [toast, fetchLiveBusData]);

  // Fetch demo data as fallback
  const fetchDemoData = useCallback(async () => {
    try {
      setLoading(true);
      // Demo data to use if real API fails
      const stopsData = [
        { id: 1, name: 'Central Station', position: [28.6139, 77.2090], buses: ['1A', '2B', '3C'] },
        { id: 2, name: 'Town Hall', position: [28.6180, 77.2150], buses: ['2B', '4D', '6F'] },
        { id: 3, name: 'University', position: [28.6100, 77.2030], buses: ['1A', '5E', '7G'] },
        { id: 4, name: 'Market Square', position: [28.6250, 77.2080], buses: ['3C', '4D', '8H'] },
        { id: 5, name: 'Park South', position: [28.6190, 77.1990], buses: ['5E', '7G', '9I'] },
      ];
      
      const busesData = [
        { id: '1A', route: '1A', position: [28.6150, 77.2095], nextStop: 'Central Station', eta: '2 min', busNo: '1A', routeNo: '1A' },
        { id: '2B', route: '2B', position: [28.6170, 77.2140], nextStop: 'Town Hall', eta: '5 min', busNo: '2B', routeNo: '2B' },
        { id: '3C', route: '3C', position: [28.6260, 77.2070], nextStop: 'Market Square', eta: '3 min', busNo: '3C', routeNo: '3C' },
      ];

      setBusStops(stopsData);
      setBuses(busesData);
      setLoading(false);
      
      toast({
        title: "Demo data loaded",
        description: "Using demonstration data (not real-time)"
      });
    } catch (error) {
      console.error('Error loading demo data:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load any map data",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Listen for real-time bus updates
  useEffect(() => {
    if (!socket) return;

    socket.on('busUpdate', (data) => {
      // Transform the backend data to match our component's format
      const transformedBuses = data.buses.map(bus => ({
        id: bus.busNo || 'Unknown',
        route: bus.routeNo || 'Unknown',
        position: [bus.latitude, bus.longitude],
        nextStop: 'Next stop information not available',
        eta: 'ETA information not available',
        busNo: bus.busNo,
        routeNo: bus.routeNo
      }));

      const transformedStops = data.busStops.map((stop, index) => ({
        id: index,
        name: stop.name || 'Unknown Stop',
        position: [stop.latitude, stop.longitude],
        buses: [],  // Bus information not available from backend
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
      if (socket) {
        socket.off('busUpdate');
      }
    };
  }, [socket, toast]);

  // Initial data load
  useEffect(() => {
    // Try to get initial data
    if (socket) {
      setTimeout(() => {
        // If no data received after 5 seconds, use fallback demo data
        if (loading && buses.length === 0 && busStops.length === 0) {
          fetchDemoData();
        }
      }, 5000);
    } else {
      fetchDemoData();
    }
  }, [socket, loading, buses.length, busStops.length, fetchDemoData]);

  return (
    <div className={`transition-all duration-300 ease-in-out ${panelExpanded ? 'h-[50vh]' : 'h-[calc(100vh-70px)]'}`}>
      <MapContainer 
        style={{ width: '100%', height: '100%', borderRadius: '0 0 20px 20px' }}
        center={[28.6139, 77.2090]}
        zoom={15}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationFinder />
        
        {showStops && busStops.map((stop) => (
          <Marker 
            key={stop.id || `stop-${stop.name}`}
            position={stop.position || [stop.latitude || 0, stop.longitude || 0]}
          >
            <Popup>
              <div className="font-medium text-lg">{stop.name}</div>
              {stop.buses && (
                <div className="text-sm mt-1">Buses: {stop.buses.join(', ')}</div>
              )}
            </Popup>
          </Marker>
        ))}
        
        {showBuses && buses.map((bus) => (
          <Marker 
            key={bus.id}
            position={bus.position || [bus.latitude || 0, bus.longitude || 0]}
          >
            <Popup>
              <div className="font-medium">Bus {bus.route || bus.routeNo || bus.id}</div>
              <div className="text-sm">Bus No: {bus.busNo || 'Unknown'}</div>
              <div className="text-sm">Route: {bus.routeNo || 'Unknown'}</div>
              <div className="text-sm">Next stop: {bus.nextStop || 'Information not available'}</div>
              <div className="text-sm">ETA: {bus.eta || 'Information not available'}</div>
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
