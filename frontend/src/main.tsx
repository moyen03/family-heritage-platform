import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,  // 1 min — prevents immediate refetch on every navigation
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false, // avoid spurious refetches when switching tabs
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

