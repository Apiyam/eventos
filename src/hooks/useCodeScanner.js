import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { normalizeScanCode } from '../lib/nfc'

export function useCodeScanner(onCode) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const frameRef = useRef(0)
  const onCodeRef = useRef(onCode)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanHint, setScanHint] = useState('')

  onCodeRef.current = onCode

  function stopCamera() {
    cancelAnimationFrame(frameRef.current)
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
      setScanError('Este celular no permite cámara. Escribe el NFC o la matrícula.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }
      setScanning(true)
      setScanHint('Apunta la cámara al QR del estudiante.')

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null

      const tick = async () => {
        const video = videoRef.current
        if (!video || !streamRef.current || video.readyState < 2) {
          frameRef.current = requestAnimationFrame(tick)
          return
        }
        try {
          if (detector) {
            const codes = await detector.detect(video)
            if (codes[0]?.rawValue) {
              emitCode(codes[0].rawValue)
              return
            }
          }
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const found = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })
          if (found?.data) {
            emitCode(found.data)
            return
          }
        } catch {
          /* keep scanning */
        }
        frameRef.current = requestAnimationFrame(tick)
      }
      frameRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setScanError(err.message || 'No se pudo abrir la cámara. Revisa el permiso y que el sitio esté en HTTPS.')
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
    stopCamera,
    startNfc,
    canDetectQr: true,
  }
}
