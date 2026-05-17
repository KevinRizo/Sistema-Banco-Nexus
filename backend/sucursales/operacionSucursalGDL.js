const fetch = require('node-fetch');

async function operacionGDL() {

    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/retiro',
            {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    cuenta: '1001',

                    monto: 500,

                    sucursal: 'GDL'

                })

            }
        );

        const data = await respuesta.json();

        console.log('GDL:', data.mensaje);

    } catch (error) {

        console.log('Error GDL:', error);

    }

}

module.exports = operacionGDL;

