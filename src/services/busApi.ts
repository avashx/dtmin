
// This file is now primarily a fallback to socket.io for demonstration purposes

interface BusPosition {
  id: string;
  route: string;
  position: [number, number];
  nextStop: string;
  eta: string;
  // Fields that will be in the backend response
  busNo?: string;
  routeNo?: string;
  latitude?: number;
  longitude?: number;
}

interface BusStop {
  id: number;
  name: string;
  position: [number, number];
  buses: string[];
  // Fields that will be in the backend response
  latitude?: number;
  longitude?: number;
}

// Demo data for fallback if socket connection fails
// Simulate fetching bus positions from API
export const fetchBusPositions = async (): Promise<BusPosition[]> => {
  try {
    // This is a fallback - in production, data comes from Socket.io
    return [
      { id: '1A', route: '1A', position: [28.6150, 77.2095], nextStop: 'Central Station', eta: '2 min' },
      { id: '2B', route: '2B', position: [28.6170, 77.2140], nextStop: 'Town Hall', eta: '5 min' },
      { id: '3C', route: '3C', position: [28.6260, 77.2070], nextStop: 'Market Square', eta: '3 min' },
      { id: '4D', route: '4D', position: [28.6080, 77.2130], nextStop: 'Opera House', eta: '7 min' },
      { id: '5E', route: '5E', position: [28.6220, 77.1990], nextStop: 'University', eta: '4 min' },
    ];
  } catch (error) {
    console.error('Error fetching bus positions:', error);
    return [];
  }
};

// Simulate fetching bus stops from API
export const fetchBusStops = async (): Promise<BusStop[]> => {
  try {
    // This is a fallback - in production, data comes from Socket.io
    return [
      { id: 1, name: 'Central Station', position: [28.6139, 77.2090], buses: ['1A', '2B', '3C'] },
      { id: 2, name: 'Town Hall', position: [28.6180, 77.2150], buses: ['2B', '4D', '6F'] },
      { id: 3, name: 'University', position: [28.6100, 77.2030], buses: ['1A', '5E', '7G'] },
      { id: 4, name: 'Market Square', position: [28.6250, 77.2080], buses: ['3C', '4D', '8H'] },
      { id: 5, name: 'Park South', position: [28.6190, 77.1990], buses: ['5E', '7G', '9I'] },
      { id: 6, name: 'Opera House', position: [28.6080, 77.2130], buses: ['2B', '6F', '8H'] },
      { id: 7, name: 'Museum', position: [28.6120, 77.2060], buses: ['1A', '9I', '10J'] },
    ];
  } catch (error) {
    console.error('Error fetching bus stops:', error);
    return [];
  }
};

// This would normally be a real-time websocket connection
// but we won't need it since we're using Socket.io directly
export const subscribeToBusUpdates = (callback: (buses: BusPosition[]) => void) => {
  // Simulate real-time updates by moving buses slightly every few seconds
  const interval = setInterval(() => {
    fetchBusPositions().then(buses => {
      const updatedBuses = buses.map(bus => {
        // Randomly adjust position slightly to simulate movement
        const latAdjust = (Math.random() - 0.5) * 0.002;
        const lngAdjust = (Math.random() - 0.5) * 0.002;
        return {
          ...bus,
          position: [
            bus.position[0] + latAdjust,
            bus.position[1] + lngAdjust
          ] as [number, number]
        };
      });
      callback(updatedBuses);
    });
  }, 5000); // Update every 5 seconds
  
  // Return unsubscribe function
  return () => clearInterval(interval);
};
