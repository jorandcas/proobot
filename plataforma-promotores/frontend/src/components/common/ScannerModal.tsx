import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  instructions?: string;
  hint?: string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escaneando ICC...',
  instructions = 'Apunta la cámara al código de barras del ICC',
  hint = 'Mantén el código horizontal y con buena iluminación'
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      try {
        // Verificar mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tu navegador no soporta acceso a la cámara');
        }

        const html5QrCode = new Html5Qrcode('reader');
        scannerRef.current = html5QrCode;
        detectedRef.current = false;

        const stopScanning = () => {
          if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
              onClose();
            }).catch((err) => {
              console.error('Error deteniendo escáner:', err);
              onClose();
            });
          }
        };

        const config = {
          fps: 10,
          qrbox: {
            width: 400,
            height: 150,
          },
          aspectRatio: 1.0,
        };

        html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string, decodedResult: any) => {
            if (detectedRef.current) return;

            // Limpiar el código
            let cleanCode = decodedText.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

            // Remover F final si existe
            if (cleanCode.endsWith('F')) {
              cleanCode = cleanCode.slice(0, -1);
            }

            // Validar longitud
            if (cleanCode.length >= 15 && cleanCode.length <= 25) {
              detectedRef.current = true;
              stopScanning();
              onScan(cleanCode);
            }
          },
          () => {
            // Silencioso - errores de escaneo son normales
          }
        ).then(() => {
          // Timeout de 60 segundos
          setTimeout(() => {
            if (!detectedRef.current) {
              stopScanning();
            }
          }, 60000);
        }).catch((err: any) => {
          console.error('Error iniciando escáner:', err);
          stopScanning();
        });

      } catch (err) {
        console.error('Error:', err);
        onClose();
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-5">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">{title}</h2>

        <div className="relative w-full h-[300px] bg-black rounded-xl overflow-hidden mb-4">
          <div id="reader" className="w-full h-full"></div>
        </div>

        <p className="text-sm text-gray-700 mb-1 text-center font-semibold">
          {instructions}
        </p>

        <p className="text-xs text-gray-500 mb-4 text-center">
          {hint}
        </p>

        <button
          onClick={() => {
            if (scannerRef.current) {
              scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
                onClose();
              }).catch(() => {
                onClose();
              });
            } else {
              onClose();
            }
          }}
          className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
