
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bus, MapPin, QrCode, BarChart } from 'lucide-react';
import io from 'socket.io-client';

const BottomNav = ({ 
  expanded, 
  onToggle, 
  showStops, 
  showBuses, 
  toggleStops, 
  toggleBuses, 
  onQrClick,
  onAnalyticsClick
}) => {
  const [nearestStops, setNearestStops] = useState([]);
  const [nearestBuses, setNearestBuses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [socket, setSocket] = useState(null);

  const bottomNavVariants = {
    collapsed: { height: 70 },
    expanded: { height: '50vh' }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Delhi center
          setUserLocation([28.6139, 77.2090]);
        }
      );
    }
  }, []);

  // Calculate distance between two points in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Listen for real-time bus updates and calculate nearest
  useEffect(() => {
    if (!socket || !userLocation) return;

    socket.on('busUpdate', (data) => {
      if (!userLocation) return;
      
      // Transform and calculate distance for stops
      const stopsWithDistance = data.busStops.map(stop => {
        // Check if stop has latitude/longitude and they're valid numbers
        if (typeof stop.latitude !== 'number' || typeof stop.longitude !== 'number') {
          return {
            ...stop,
            distance: Infinity
          };
        }
        
        return {
          ...stop,
          name: stop.name || 'Unknown Stop',
          distance: calculateDistance(
            userLocation[0], userLocation[1],
            stop.latitude, stop.longitude
          )
        };
      });

      // Transform and calculate distance for buses
      const busesWithDistance = data.buses.map(bus => {
        // Check if bus has latitude/longitude and they're valid numbers
        if (typeof bus.latitude !== 'number' || typeof bus.longitude !== 'number') {
          return {
            ...bus,
            distance: Infinity
          };
        }
        
        return {
          ...bus,
          id: bus.busNo || 'Unknown',
          route: bus.routeNo || 'Unknown',
          distance: calculateDistance(
            userLocation[0], userLocation[1],
            bus.latitude, bus.longitude
          )
        };
      });

      // Sort by distance and take the nearest ones
      const sortedStops = stopsWithDistance
        .filter(stop => isFinite(stop.distance || Infinity))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        .slice(0, 3);

      const sortedBuses = busesWithDistance
        .filter(bus => isFinite(bus.distance || Infinity))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        .slice(0, 3);

      setNearestStops(sortedStops);
      setNearestBuses(sortedBuses);
    });

    return () => {
      if (socket) {
        socket.off('busUpdate');
      }
    };
  }, [socket, userLocation]);
  
  // Fallback to demo data if no real-time data available
  useEffect(() => {
    if (nearestStops.length === 0 && nearestBuses.length === 0 && userLocation) {
      // Demo data
      const demoStops = [
        { id: 1, name: 'Central Station', position: [28.6139, 77.2090], buses: ['1A', '2B', '3C'] },
        { id: 2, name: 'Town Hall', position: [28.6180, 77.2150], buses: ['2B', '4D', '6F'] },
        { id: 3, name: 'University', position: [28.6100, 77.2030], buses: ['1A', '5E', '7G'] },
      ];
      
      const demoBuses = [
        { id: '1A', route: '1A', position: [28.6150, 77.2095], nextStop: 'Central Station', eta: '2 min' },
        { id: '2B', route: '2B', position: [28.6170, 77.2140], nextStop: 'Town Hall', eta: '5 min' },
        { id: '3C', route: '3C', position: [28.6260, 77.2070], nextStop: 'Market Square', eta: '3 min' },
      ];

      // Calculate distances and sort
      const stopsWithDistance = demoStops.map(stop => ({
        ...stop,
        distance: calculateDistance(
          userLocation[0], userLocation[1],
          stop.position[0], stop.position[1]
        )
      }));

      const busesWithDistance = demoBuses.map(bus => ({
        ...bus,
        distance: calculateDistance(
          userLocation[0], userLocation[1],
          bus.position[0], bus.position[1]
        )
      }));

      const sortedStops = stopsWithDistance.sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );

      const sortedBuses = busesWithDistance.sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );

      setNearestStops(sortedStops);
      setNearestBuses(sortedBuses);
    }
  }, [nearestStops.length, nearestBuses.length, userLocation]);
  
  return (
    <motion.div 
      className="fixed bottom-0 left-0 w-full bg-appbg text-white bottom-nav shadow-lg z-10"
      variants={bottomNavVariants}
      initial="collapsed"
      animate={expanded ? "expanded" : "collapsed"}
      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
    >
      {/* Nav bar (always visible) */}
      <div className="h-[70px] flex items-center justify-between px-6">
        <button 
          onClick={toggleBuses}
          className={`flex flex-col items-center justify-center ${showBuses ? 'nav-item-active' : 'nav-item-inactive'}`}
        >
          <Bus size={24} />
          <span className="text-xs mt-1">Buses</span>
        </button>
        
        <button 
          onClick={toggleStops}
          className={`flex flex-col items-center justify-center ${showStops ? 'nav-item-active' : 'nav-item-inactive'}`}
        >
          <MapPin size={24} />
          <span className="text-xs mt-1">Stops</span>
        </button>
        
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={onToggle}
        >
          <div className="w-10 h-1 bg-white rounded-full mb-1"></div>
          <div className="w-6 h-1 bg-white rounded-full"></div>
        </div>
        
        <button 
          onClick={onAnalyticsClick}
          className="flex flex-col items-center justify-center nav-item-inactive"
        >
          <BarChart size={24} />
          <span className="text-xs mt-1">Analytics</span>
        </button>
        
        <button 
          onClick={onQrClick}
          className="flex flex-col items-center justify-center nav-item-inactive"
        >
          <QrCode size={24} />
          <span className="text-xs mt-1">Scan</span>
        </button>
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <div className="p-4 overflow-y-auto h-[calc(50vh-70px)]">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Nearest Bus Stops</h2>
            <div className="space-y-3">
              {nearestStops.length > 0 ? (
                nearestStops.map((stop, index) => (
                  <div key={stop.id || `stop-${index}`} className="flex items-center bg-appaccent p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      {stop.buses && (
                        <div className="text-xs text-gray-400">Buses: {stop.buses.join(', ')}</div>
                      )}
                    </div>
                    <div className="ml-auto text-sm">
                      {stop.distance ? `${Math.round(stop.distance)}m` : 'Calculating...'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-4">Loading nearest stops...</div>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-3">Nearest Buses</h2>
            <div className="space-y-3">
              {nearestBuses.length > 0 ? (
                nearestBuses.map((bus, index) => (
                  <div key={bus.id || `bus-${index}`} className="flex items-center bg-appaccent p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
                      <Bus size={20} />
                    </div>
                    <div>
                      <div className="font-medium">Bus {bus.route || bus.routeNo || bus.id}</div>
                      {bus.nextStop && (
                        <div className="text-xs text-gray-400">Next: {bus.nextStop}</div>
                      )}
                    </div>
                    <div className="ml-auto text-sm">
                      {bus.eta && <div>{bus.eta}</div>}
                      <div className="text-xs text-gray-400">
                        {bus.distance ? `${Math.round(bus.distance)}m away` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-4">Loading nearest buses...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BottomNav;
