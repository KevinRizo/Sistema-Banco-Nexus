const operacionCDMX = require('./operacionSucursalCDMX');
const operacionGDL = require('./operacionSucursalGDL');
const operacionMTY = require('./operacionSucursalMTY');
const operacionLaPaz = require('./operacionSucursalLaPaz');
const operacionCancun = require('./operacionSucursalCancun');

async function ejecutarSimulacion() {

    try {

        console.log('Iniciando simulacion concurrente...\n');

        await Promise.all([

            operacionCDMX(),

            operacionGDL(),

            operacionMTY(),

            operacionLaPaz(),

            operacionCancun()

        ]);

        console.log('\nSimulacion finalizada');

    } catch (error) {

        console.log('Error en simulacion:', error);

    }

}

ejecutarSimulacion();