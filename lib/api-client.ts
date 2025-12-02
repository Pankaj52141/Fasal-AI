// API client utility for frontend
export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(endpoint)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },

  async delete(endpoint: string) {
    const response = await fetch(endpoint, { method: "DELETE" })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },
}

// Specific API methods
export const farmAPI = {
  list: (userId: string) => apiClient.get(`/api/farms?userId=${userId}`),
  create: (data: any) => apiClient.post("/api/farms", data),
}

export const cropAPI = {
  list: (farmId: string) => apiClient.get(`/api/crops?farmId=${farmId}`),
  create: (data: any) => apiClient.post("/api/crops", data),
}

export const sensorAPI = {
  list: (cropId: string, sensorType?: string) => {
    const url = `/api/sensor-data?cropId=${cropId}${sensorType ? `&sensorType=${sensorType}` : ""}`
    return apiClient.get(url)
  },
  record: (data: any) => apiClient.post("/api/sensor-data", data),
}

export const predictionAPI = {
  list: (cropId: string) => apiClient.get(`/api/predictions?cropId=${cropId}`),
  create: (data: any) => apiClient.post("/api/predictions", data),
}

export const sustainabilityAPI = {
  list: (farmId: string) => apiClient.get(`/api/sustainability?farmId=${farmId}`),
  record: (data: any) => apiClient.post("/api/sustainability", data),
}

export const recommendationAPI = {
  generate: (data: any) => apiClient.post("/api/recommendations", data),
}

export const yieldAPI = {
  forecast: (data: any) => apiClient.post("/api/yield-forecast", data),
}
