import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X, Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Campus Check-In QR Code',
  subtitle = 'Point your camera at the Institute QR Code or your Teacher ID Badge',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setScannedResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions or upload a QR image below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        setScannedResult(code.data);
        stopCamera();
        onScanSuccess(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Allow uploading image file with QR code as fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            setScannedResult(code.data);
            stopCamera();
            onScanSuccess(code.data);
          } else {
            alert('No valid QR code detected in the uploaded image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-white pt-1">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        {/* Live Camera View Box */}
        <div className="relative aspect-square w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Overlay Line Effect */}
          {cameraActive && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              <div className="w-full h-full border-2 border-dashed border-emerald-400/70 rounded-xl relative">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500"></div>
                
                {/* Scanning Laser Line */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse my-auto top-1/2 relative"></div>
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 transition-all inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera Access
              </button>
            </div>
          )}

          {/* Scanned Success Confirmation Overlay */}
          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/95 p-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
              <h4 className="text-base font-bold text-white">QR Code Recognized!</h4>
              <p className="text-xs font-mono bg-slate-900 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-xl break-all max-w-full">
                {scannedResult}
              </p>
            </div>
          )}
        </div>

        {/* Alternative: Upload Image File */}
        <div className="pt-1 flex items-center justify-between gap-3 text-xs border-t border-slate-800">
          <span className="text-slate-400 font-medium">Have a saved QR image?</span>
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
