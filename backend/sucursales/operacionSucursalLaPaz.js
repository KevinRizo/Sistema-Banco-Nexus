const fetch = require('node-fetch');

async function operacionLaPaz() {

    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/deposito',
            {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    cuenta: '1002',

                    monto: 700,

                    sucursal: 'La Paz'

                })

            }
        );

        const data = await respuesta.json();

        console.log('La Paz:', data.mensaje);

    } catch (error) {

        console.log('Error La Paz:', error);

    }

}

module.exports = operacionLaPaz;