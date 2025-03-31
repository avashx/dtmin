
import axios from 'axios';
import io from 'socket.io-client';

// Define types for the API response
export interface LiveBusData {
  busNo: string;
  routeNo: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
}

// Delhi Transit API endpoint
const DELHI_API_URL = 'https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=7pnJf5w6MCh0JWrdisnafk0YhnKfUqxx';

/**
 * Note: Protobuf data can't be directly parsed in the browser.
 * This service expects that a backend proxy server (like the Express server provided)
 * is running to handle the protobuf parsing and serve the data via Socket.io.
 * 
 * If running without the backend, the app will fall back to demo data.
 */

// Initialize Socket.IO connection
export const connectToTransitSocket = (
  onConnect: () => void,
  onBusUpdate: (data: { buses: any[], busStops: any[] }) => void,
  onError: (error: any) => void
) => {
  const socket = io();
  
  socket.on('connect', onConnect);
  socket.on('busUpdate', onBusUpdate);
  socket.on('connect_error', onError);
  
  // Return disconnect function
  return () => {
    socket.off('connect');
    socket.off('busUpdate');
    socket.off('connect_error');
    socket.disconnect();
  };
};

// Direct API call (this won't work directly in the browser due to protobuf encoding)
// It's included here as a reference for how you would call the API if you had a proxy server
export const fetchBusPositionsDirectly = async (): Promise<LiveBusData[]> => {
  try {
    const response = await axios.get(DELHI_API_URL, {
      responseType: 'arraybuffer'
    });
    
    // This would require protobuf parsing - handled by the backend server
    console.warn('Direct protobuf parsing not available in the browser');
    return [];
  } catch (error) {
    console.error('Error fetching bus positions directly:', error);
    throw error;
  }
};

// Test if backend proxy server is available
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    // Try to reach the Socket.IO endpoint
    await axios.get('/socket.io/');
    return true;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};
