import { useOutletContext } from 'react-router-dom'
import { RafflePage } from '../RafflePage'
import { RedeemPage } from '../RedeemPage'
import { ScanTalkPage } from '../ScanTalkPage'

export function AdminScan() {
  const { token } = useOutletContext()
  return <ScanTalkPage token={token} />
}

export function AdminRedeem() {
  const { token } = useOutletContext()
  return <RedeemPage token={token} />
}

export function AdminRaffle() {
  return <RafflePage />
}
