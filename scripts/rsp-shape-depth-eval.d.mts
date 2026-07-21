export interface ShapeDepthCase {
  id: string
  load_deep_reference: boolean
  prohibited_actions: string[]
  required_contract: string[]
  sources: string[]
}

export interface ShapeDepthResult {
  id: string
  missing: string[]
  passed: boolean
}

export function loadShapeDepthCases(root: string): ShapeDepthCase[]
export function evaluateShapeDepth(root: string): ShapeDepthResult[]
