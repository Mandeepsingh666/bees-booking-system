import React from 'react'

export function Spinner({ size = '' }) {
  return <span className={`spinner ${size}`} />
}

export function LoadingCenter() {
  return <div className="loading-center"><Spinner size="lg" /></div>
}
