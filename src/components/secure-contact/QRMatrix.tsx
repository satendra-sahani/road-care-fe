'use client'

import { useMemo } from 'react'
import { qrMatrix } from '@/lib/secureContact'

// Deterministic pseudo-QR render (faithful to the prototype's QRMatrix).
export function QRMatrix({ id, px = 6, fg = '#0C1B2E' }: { id: string; px?: number; fg?: string }) {
  const m = useMemo(() => qrMatrix(id), [id])
  const n = m.length
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, ${px}px)`,
        gridAutoRows: `${px}px`,
        lineHeight: 0,
      }}
    >
      {m.flatMap((row, r) =>
        row.map((v, c) => (
          <div key={`${r}-${c}`} style={{ background: v ? fg : 'transparent', borderRadius: px > 5 ? 1 : 0 }} />
        )),
      )}
    </div>
  )
}
