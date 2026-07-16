export interface ApiCollection<T> {
  'hydra:member': T[]
  'hydra:totalItems': number
}

export interface ApiError {
  status: number
  message: string
  violations?: { propertyPath: string; message: string }[]
}

