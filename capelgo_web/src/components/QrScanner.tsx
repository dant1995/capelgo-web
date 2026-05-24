import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
}

// ID único para evitar conflitos se o componente for remontado
let scannerInstanceId = 0;

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const [status, setStatus] = useState<'loading' | 'scanning' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const scannedRef = useRef(false); // evita disparar onScan múltiplas vezes
  const containerId = useRef(`qr-scan-${++scannerInstanceId}`);

  useEffect(() => {
    mountedRef.current = true;
    scannedRef.current = false;

    // Pequeno delay para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      } catch (_) {}
    }
  };

  const startScanner = async () => {
    const el = document.getElementById(containerId.current);
    if (!el || !mountedRef.current) return;

    try {
      const scanner = new Html5Qrcode(containerId.current, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          // Evitar chamadas múltiplas
          if (scannedRef.current) return;
          scannedRef.current = true;

          // Para scanner antes de notificar
          try {
            scanner.stop().catch(() => {});
          } catch (_) {}
          scannerRef.current = null;

          if (mountedRef.current) {
            onScan(decodedText.trim());
          }
        },
        () => { /* frames sem QR Code, ignorar */ }
      );

      if (mountedRef.current) setStatus('scanning');

    } catch (err: any) {
      console.warn('QrScanner erro:', err);
      if (mountedRef.current) {
        const msg = err?.message?.includes('Permission')
          ? 'Permissão de câmera negada. Por favor, autorize o acesso à câmera nas configurações do navegador.'
          : 'Câmera não disponível neste dispositivo ou navegador.';
        setErrorMsg(msg);
        setStatus('error');
        if (onError) onError(msg);
      }
    }
  };

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center px-2">
        <div className="text-4xl">📵</div>
        <p className="text-sm font-black text-gray-700">Câmera indisponível</p>
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-[240px]">{errorMsg}</p>
        <p className="text-[10px] text-purple-500 font-bold">Use a aba Manual para digitar o código.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Wrapper do viewfinder */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-purple-300 shadow-lg bg-black min-h-[260px] flex items-center justify-center">
        
        {/* Container real do html5-qrcode */}
        <div id={containerId.current} className="w-full" style={{ minHeight: '260px' }} />

        {/* Loading enquanto câmera não iniciou */}
        {status === 'loading' && (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-[11px] font-bold tracking-wider">Iniciando câmera...</p>
          </div>
        )}

        {/* Cantos de mira (só mostra quando está escaneando) */}
        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-purple-400 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-purple-400 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-purple-400 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-purple-400 rounded-br-lg" />
          </div>
        )}
      </div>

      {status === 'scanning' && (
        <p className="text-[11px] text-gray-500 font-bold text-center">
          📷 Aponte a câmera para o QR Code do cliente
        </p>
      )}
    </div>
  );
}
