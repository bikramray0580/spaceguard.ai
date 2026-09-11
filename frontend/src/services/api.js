const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

// During local Vite development we use the dev-server proxy so browser
// requests remain same-origin and the backend does not need CORS changes.
export const API_BASE_URL = (configuredApiBaseUrl || (import.meta.env.DEV ? '' : 'http://localhost:8000')).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, endpoint = '', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.endpoint = endpoint
    this.details = details
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export async function apiFetch(
  path,
  {
    method = 'GET',
    body,
    signal,
    headers = {},
  } = {},
) {
  const endpoint = `${API_BASE_URL}${path}`

  let response

  try {
    response = await fetch(endpoint, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...headers,
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    throw new ApiError(
      `Unable to reach the SpaceGuard backend${API_BASE_URL ? ` at ${API_BASE_URL}` : ''}.`,
      {
        endpoint,
        details: error,
      },
    )
  }

  const payload = await parseResponse(response)

  if (!response.ok) {
    const detail =
      payload &&
      typeof payload === 'object' &&
      'detail' in payload
        ? payload.detail
        : typeof payload === 'string'
          ? payload
          : null

    throw new ApiError(
      detail ||
        `SpaceGuard API request failed with status ${response.status}.`,
      {
        status: response.status,
        endpoint,
        details: payload,
      },
    )
  }

  return payload
}
