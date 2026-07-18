import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,          // always refetch in background when component mounts
      gcTime: 1000 * 60 * 5, // keep unused data in cache for 5 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

// Bust stale cache whenever the app version changes
const APP_VERSION = '2.0.0'
const storedVersion = localStorage.getItem('app_version')
if (storedVersion !== APP_VERSION) {
  queryClient.clear()
  localStorage.setItem('app_version', APP_VERSION)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)

