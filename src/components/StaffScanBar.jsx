import { Nfc, QrCode } from 'lucide-react'

export function StaffScanBar({ videoRef, scanning, canDetectQr, onScanQr, onScanNfc }) {
  return (
    <>
      <div className="staff-scan-actions">
        <button type="button" className="dash-cta" onClick={onScanQr}>
          <QrCode size={16} /> Escanear QR
        </button>
        <button type="button" className="dash-cta" onClick={onScanNfc}>
          <Nfc size={16} /> Leer NFC
        </button>
      </div>
      <video ref={videoRef} className={scanning ? 'staff-video is-on' : 'staff-video'} muted playsInline />
      {scanning && !canDetectQr ? (
        <p className="muted">Tu navegador no lee QR en cámara. Escribe el código debajo.</p>
      ) : null}
    </>
  )
}
