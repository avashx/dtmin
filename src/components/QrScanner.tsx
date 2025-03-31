
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { X } from 'lucide-react';

interface QrScannerProps {
  onClose: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onClose }) => {
  const [scanning, setScanning] = useState(true);
  
  return (
    <motion.div 
      className="qr-scanner-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute top-6 left-6">
        <button 
          onClick={onClose}
          className="bg-black bg-opacity-50 rounded-full p-2"
        >
          <X size={24} color="white" />
        </button>
      </div>
      
      <div className="text-white text-xl mb-8">Scan QR Code</div>
      
      <div className="qr-frame">
        <Webcam
          audio={false}
          screenshotFormat="image/jpeg"
          width={250}
          height={250}
          videoConstraints={{ facingMode: 'environment' }}
        />
        <div className="qr-corner qr-corner-top-left"></div>
        <div className="qr-corner qr-corner-top-right"></div>
        <div className="qr-corner qr-corner-bottom-left"></div>
        <div className="qr-corner qr-corner-bottom-right"></div>
        
        {scanning && <div className="scan-line"></div>}
      </div>
      
      <div className="text-white text-sm mt-8 text-center max-w-xs">
        Position the QR code within the frame to scan
      </div>
    </motion.div>
  );
};

export default QrScanner;
