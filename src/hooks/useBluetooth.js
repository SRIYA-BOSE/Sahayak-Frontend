import { useContext } from 'react'
import { BluetoothContext } from '../context/BluetoothContext'

export const useBluetooth = () => {
  const context = useContext(BluetoothContext)
  if (!context) {
    throw new Error('useBluetooth must be used within BluetoothProvider')
  }
  return context
}

