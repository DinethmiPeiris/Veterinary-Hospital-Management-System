const API_BASE_URL = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api/v1` : 'http://localhost:8081/api/v1';

export default API_BASE_URL;
