import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const theme = {
  confirmButtonColor: '#1e4d7a',
  cancelButtonColor: '#8a96a3',
  customClass: {
    popup: 'app-swal',
  },
}

export function notifySuccess(title, text = '') {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'Listo',
    ...theme,
  })
}

export function notifyError(title, text = '') {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Entendido',
    ...theme,
  })
}

export function confirmAction(title, text = 'Esta acción no se puede deshacer.') {
  return Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    ...theme,
  }).then((result) => result.isConfirmed)
}
