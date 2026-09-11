import { apiFetch } from './api'

export async function checkBackendHealth(options = {}) {
  return apiFetch('/health', options)
}
