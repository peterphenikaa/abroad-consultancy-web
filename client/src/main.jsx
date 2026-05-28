import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import AppRoutes from './AppRoutes.jsx'
import './styles/fonts.css'
import './index.css'
import axios from 'axios'
import { AuthProvider } from './contexts/AuthContext'
import { getLocalAccessToken } from './services/apiClient'
import { syncServerTime, cleanupExpiredData } from './services/db'

axios.interceptors.request.use((config) => {
  const token = getLocalAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use((response) => {
  if (response.headers && response.headers.date) {
    const serverTime = new Date(response.headers.date).getTime();
    if (!isNaN(serverTime)) syncServerTime(serverTime);
  }
  return response;
}, (error) => {
  if (error.response && error.response.headers && error.response.headers.date) {
    const serverTime = new Date(error.response.headers.date).getTime();
    if (!isNaN(serverTime)) syncServerTime(serverTime);
  }
  return Promise.reject(error);
});

cleanupExpiredData();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
