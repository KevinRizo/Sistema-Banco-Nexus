const API_URL =
  process.env.REACT_APP_API_URL ||
  'http://ec2-54-90-218-159.compute-1.amazonaws.com:3000';

export const apiUrl = (ruta) =>
  `${API_URL}${ruta}`;