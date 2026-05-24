const axios = require('axios');

const URL =
  'http://localhost:3000/api/cuenta/1001';

console.log(
  'Iniciando pruebas automatizadas de failover...\n'
);

const ejecutarPrueba = async () => {

  try {

    const inicio = Date.now();

    const respuesta = await axios.get(URL);

    const fin = Date.now();

    const tiempo = fin - inicio;

    console.log(
      `Conexion exitosa | Cuenta: ${respuesta.data.cuenta} | Tiempo: ${tiempo} ms`
    );

    // ALERTA LATENCIA

    if (tiempo > 3000) {

      console.log(
        'Alta latencia detectada'
      );

    }

  } catch (error) {

    console.log(
      'Nodo primario caido o servidor no disponible'
    );

  }

};

// EJECUTAR CADA 5 SEGUNDOS

setInterval(() => {

  ejecutarPrueba();

}, 5000);

