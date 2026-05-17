const fetch = require('node-fetch');

async function operacionCancun() {

    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/retiro',
            {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    cuenta: '1002',

                    monto: 400,

                    sucursal: 'Cancun'

                })

            }
        );

        const data = await respuesta.json();

        console.log('Cancún:', data.mensaje);

    } catch (error) {

        console.log('Error Cancún:', error);

    }

}

module.exports = operacionCancun;