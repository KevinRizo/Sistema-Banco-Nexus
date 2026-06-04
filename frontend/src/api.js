const API_URL =
  process.env.REACT_APP_API_URL ||
   'http://ec2-54-80-87-19.compute-1.amazonaws.com:3000';

export const apiUrl = (ruta) =>
  `${API_URL}${ruta}`;