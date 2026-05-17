const fetch = require('node-fetch');

async function operacionCDMX() {

    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/deposito',
            {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    cuenta: '1001',

                    monto: 1000,

                    sucursal: 'CDMX'

                })

            }
        );

        const data = await respuesta.json();

        console.log('CDMX:', data.mensaje);

    } catch (error) {

        console.log('Error CDMX:', error);

    }

}

module.exports = operacionCDMX;

