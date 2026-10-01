import { Nfc, QrCode } from 'lucide-react'

export function StaffScanBar({ videoRef, scanning, onScanQr, onStopQr, onScanNfc }) {
  return (
    <>
      <div className="staff-scan-actions">
        <button type="button" className="dash-cta" onClick={scanning ? onStopQr : onScanQr}>
          <QrCode size={16} /> {scanning ? 'Cerrar cámara' : 'Escanear QR'}
        </button>
        <button type="button" className="dash-cta" onClick={onScanNfc}>
          <Nfc size={16} /> Leer NFC
        </button>
      </div>
      <video ref={videoRef} className={scanning ? 'staff-video is-on' : 'staff-video'} muted playsInline />
      {scanning ? <p className="muted">Apunta al QR. Toca Cerrar cámara para cancelar.</p> : null}
    </>
  )
}
