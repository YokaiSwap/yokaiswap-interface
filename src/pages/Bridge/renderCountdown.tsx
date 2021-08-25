import React from 'react'
import { CountdownRenderProps } from 'react-countdown'

export function renderCountdown(countdownProps: CountdownRenderProps) {
  const { days, hours, minutes, seconds } = countdownProps
  const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds
  const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes
  const paddedHours = hours < 10 ? `0${hours}` : hours
  return (
    <span style={{ width: '100%' }}>
      {days > 0 ? `${days} ${days === 1 ? `day` : 'days'} ` : ''}
      {paddedHours}:{paddedMinutes}:{paddedSeconds}
    </span>
  )
}
