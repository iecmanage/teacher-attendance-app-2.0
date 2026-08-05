import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
  bgColor = '#0f172a',
  fgColor = '#10b981',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        },
        (error) => {
          if (error) console.error('QR code rendering error:', error);
        }
      );
    }
  }, [value, size, bgColor, fgColor]);

  return (
    <div className={`inline-flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg ${className}`}>
      <canvas ref={canvasRef} className="rounded-xl" />
    </div>
  );
};
