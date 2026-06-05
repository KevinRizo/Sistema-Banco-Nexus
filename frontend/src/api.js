const API_URL =
  process.env.REACT_APP_API_URL ||
  'http://Balanceador-Banco-1515816684.us-east-1.elb.amazonaws.com';

export const apiUrl = (ruta) =>
  `${API_URL}${ruta}`;