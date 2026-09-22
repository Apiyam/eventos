import { useEffect, useRef, useState } from 'react'
import { normalizeScanCode } from '../lib/nfc'

export function useCodeScanner(onCode) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const onCodeRef = useRef(onCode)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanHint, setScanHint] = useState('')

  onCodeRef.current = onCode

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }

  function emitCode(value) {
    const next = normalizeScanCode(value)
    if (!next) return
    stopCamera()
    setScanHint('')
    onCodeRef.current(next)
  }

  async function startCamera() {
    setScanError('')
    setScanHint('')
    stopCamera()
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('Este celular no permite cámara. Escribe el NFC.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes[0]?.rawValue) {
              emitCode(codes[0].rawValue)
              return
            }
          } catch {
            /* keep scanning */
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    } catch (err) {
      setScanError(err.message || 'No se pudo abrir la cámara')
    }
  }

  async function startNfc() {
    setScanError('')
    if (!('NDEFReader' in window)) {
      setScanError('NFC nativo no está disponible. Usa QR o el código.')
      return
    }
    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()
      ndef.onreading = (event) => {
        for (const record of event.message.records) {
          const bytes = record.data ? new TextDecoder().decode(record.data) : ''
          if (bytes) emitCode(bytes)
        }
      }
      setScanHint('Acerca el NFC al celular.')
    } catch (err) {
      setScanError(err.message || 'No se pudo leer NFC')
    }
  }

  useEffect(() => () => stopCamera(), [])

  return {
    videoRef,
    scanning,
    scanError,
    scanHint,
    startCamera,
    startNfc,
    canDetectQr: typeof window !== 'undefined' && 'BarcodeDetector' in window,
  }
}
