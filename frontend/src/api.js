const API_URL =
  process.env.REACT_APP_API_URL ||
  'http://44.207.245.101:3000';

export const apiUrl = (ruta) =>
  `${API_URL}${ruta}`;