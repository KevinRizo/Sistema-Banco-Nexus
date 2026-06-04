const API_URL =
  process.env.REACT_APP_API_URL ||
  'http://localhost:3000';

export const apiUrl = (ruta) =>
  `${API_URL}${ruta}`;