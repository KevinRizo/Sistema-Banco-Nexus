const fetch = require('node-fetch');

async function operacionMTY() {

    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/transferencia',
            {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    cuentaOrigen: '1001',

                    cuentaDestino: '1002',

                    monto: 300,

                    sucursal: 'MTY'

                })

            }
        );

        const data = await respuesta.json();

        console.log('MTY:', data.mensaje);

    } catch (error) {

        console.log('Error MTY:', error);

    }

}

module.exports = operacionMTY;

