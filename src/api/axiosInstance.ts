import axios, { type AxiosInstance } from 'axios'; // Add the 'type' keyword here

const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;