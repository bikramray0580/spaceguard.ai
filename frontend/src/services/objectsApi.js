import { apiFetch } from './api'

export async function fetchObjects(options = {}) {
  return apiFetch('/api/objects', options)
}

export async function fetchObject(objectId, options = {}) {
  if (!objectId) {
    throw new Error('An object ID is required.')
  }

  return apiFetch(
    `/api/objects/${encodeURIComponent(objectId)}`,
    options,
  )
}

export function toObjectViewModel(object) {
  return {
    id: object.object_id,
    name: object.name,
    epoch: object.epoch,
    tle: object.tle,
    risk: 'unclassified',
    source: 'backend',
  }
}
