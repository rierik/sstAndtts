import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // API 기본 경로
  timeout: 10000, // 요청 제한 시간 (10초)
  headers: {
    'Content-Type': 'application/json',
  },
});

// // 요청 인터셉터
// api.interceptors.request.use(
//   (config) => {
//     // 예: 토큰 추가
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // 응답 인터셉터
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (err.response && err.response.status === 401) {
//       // 로그인 페이지로 이동하거나 로그아웃 처리
//       window.location.href = '/login';
//     }
//     return Promise.reject(err);
//   },
// );

export const fetchMenu = () => api.get('/product');
export const setOrder = ({ prompt, order }) => api.post(`/order`, { prompt: prompt, order });

export default api;
