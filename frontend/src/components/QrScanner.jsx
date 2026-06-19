// components/QrScanner.jsx
import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

// Extracts a license number out of whatever the QR code decodes to.
// Ontario's digital licence QR redirects to a URL like:
//   https://www.compliance.gov.on.ca/services/psis-publicregistry/individual/en/50073036
// so we pull the trailing digits out of that. Falls back to treating the
// whole decoded string as the license number if it's already just digits.
function extractLicenseNumber(decodedText) {
  const trimmed = decodedText.trim();

  // Already just a license number
  if (/^\d{6,8}$/.test(trimmed)) return trimmed;

  // Pull trailing digits off a URL path
  const match = trimmed.match(/(\d{6,8})\/?$/);
  if (match) return match[1];

  return null;
}

export default function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    hasScannedRef.current = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let isStarted = false;
    let isUnmounted = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (hasScannedRef.current) return;
          const licenseNumber = extractLicenseNumber(decodedText);

          if (!licenseNumber) {
            onError?.(
              "Scanned code didn't contain a recognizable license number. Try manual entry instead."
            );
            return;
          }

          hasScannedRef.current = true;
          onScan(licenseNumber);
        },
        () => {
          // Per-frame "no QR found" callback fires constantly while scanning,
          // intentionally ignored, this is normal while the camera searches.
        }
      )
      .then(() => {
        isStarted = true;
        // If the component was unmounted while start() was still pending,
        // stop it immediately now that it's actually running.
        if (isUnmounted) {
          scanner.stop().catch(() => { });
        }
      })
      .catch((err) => {
        onError?.(
          'Could not start the camera. Check camera permissions, or use manual entry below.'
        );
        console.error('[QrScanner] start failed', err);
      });

    return () => {
      isUnmounted = true;
      // Only attempt to stop if start() actually finished. Calling stop()
      // before the scanner is running throws, this guard avoids that.
      if (isStarted) {
        scanner.stop().catch(() => {
          // Scanner may already be stopped, safe to ignore
        });
      }
    };
  }, [onScan, onError]);

  return <div id={SCANNER_ELEMENT_ID} className="qr-scanner-region" />;
}
