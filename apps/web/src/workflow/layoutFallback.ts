/** Deterministic grid positions for nodes that have no `position` from the API (non-demo workflows). */
export function positionsForNodesMissingLayout(nodeIds: string[]): Record<string, { x: number; y: number }> {
  const sorted = [...nodeIds].sort()
  const out: Record<string, { x: number; y: number }> = {}
  sorted.forEach((id, i) => {
    out[id] = { x: 50 + (i % 4) * 270, y: 150 + Math.floor(i / 4) * 140 }
  })
  return out
}
