
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import MapComponent from '../components/Map';
import BottomNav from '../components/BottomNav';
import QrScanner from '../components/QrScanner';
import Analytics from '../components/Analytics';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [navExpanded, setNavExpanded] = useState(false);
  const [showStops, setShowStops] = useState(true);
  const [showBuses, setShowBuses] = useState(true);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Show welcome toast when app loads
    toast({
      title: "Welcome to BusFinder",
      description: "Find nearby bus stops and track buses in real-time"
    });
    
    // Create a simple proxy to bypass CORS if we're not directly connected to the backend
    if (import.meta.env.DEV) {
      // In development, inform about backend connection
      toast({
        title: "Development Mode",
        description: "Connect to the backend server to see live bus data"
      });
    }
  }, [toast]);
  
  const toggleNav = () => {
    setNavExpanded(!navExpanded);
  };
  
  const toggleStops = () => {
    setShowStops(!showStops);
    toast({
      description: !showStops ? "Bus stops shown" : "Bus stops hidden"
    });
  };
  
  const toggleBuses = () => {
    setShowBuses(!showBuses);
    toast({
      description: !showBuses ? "Buses shown" : "Buses hidden"
    });
  };
  
  const openQrScanner = () => {
    setShowQrScanner(true);
  };
  
  const closeQrScanner = () => {
    setShowQrScanner(false);
  };
  
  const openAnalytics = () => {
    setShowAnalytics(true);
  };
  
  const closeAnalytics = () => {
    setShowAnalytics(false);
  };
  
  return (
    <div className="app-container">
      <MapComponent 
        showStops={showStops} 
        showBuses={showBuses} 
        panelExpanded={navExpanded} 
      />
      
      <BottomNav 
        expanded={navExpanded}
        onToggle={toggleNav}
        showStops={showStops}
        showBuses={showBuses}
        toggleStops={toggleStops}
        toggleBuses={toggleBuses}
        onQrClick={openQrScanner}
        onAnalyticsClick={openAnalytics}
      />
      
      <AnimatePresence>
        {showQrScanner && <QrScanner onClose={closeQrScanner} />}
      </AnimatePresence>
      
      <AnimatePresence>
        {showAnalytics && <Analytics onClose={closeAnalytics} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
