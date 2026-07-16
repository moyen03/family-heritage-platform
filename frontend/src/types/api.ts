export interface ApiCollection<T> {
  'member': T[]
  'totalItems': number
  // AP3 compatibility aliases
  'hydra:member'?: T[]
  'hydra:totalItems'?: number
}

export interface ApiError {
  status: number
  message: string
  violations?: { propertyPath: string; message: string }[]
}
