const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';

const client = new MongoClient(uri);

async function crearBaseDeDatos() {

    try {

        await client.connect();

        console.log('Conectado a MongoDB');

        const db = client.db('BancoNexus');

        // Limpiar colecciones anteriores

        await db.collection('clientes').deleteMany({});
        await db.collection('cuentas').deleteMany({});
        await db.collection('transacciones').deleteMany({});

        // CLIENTES
  
        const clientes = [
            {
                nombre: 'Juan Pérez',
                curp: 'PEPJ010101HDFRRN01',
                telefono: '6121111111',
                correo: 'juan@gmail.com'
            },
            {
                nombre: 'María López',
                curp: 'LOMM020202MDFPRR02',
                telefono: '6122222222',
                correo: 'maria@gmail.com'
            },
            {
                nombre: 'Carlos Ramírez',
                curp: 'RACR030303HDFMRR03',
                telefono: '6123333333',
                correo: 'carlos@gmail.com'
            },
            {
                nombre: 'Ana Torres',
                curp: 'TOAA040404MDFRNS04',
                telefono: '6124444444',
                correo: 'ana@gmail.com'
            },
            {
                nombre: 'Luis Hernández',
                curp: 'HELL050505HDFRRS05',
                telefono: '6125555555',
                correo: 'luis@gmail.com'
            },
            {
                nombre: 'Sofía Castro',
                curp: 'CASS060606MDFTRF06',
                telefono: '6126666666',
                correo: 'sofia@gmail.com'
            },
            {
                nombre: 'Diego Flores',
                curp: 'FLOD070707HDFLRG07',
                telefono: '6127777777',
                correo: 'diego@gmail.com'
            },
            {
                nombre: 'Fernanda Ruiz',
                curp: 'RUFN080808MDFZRD08',
                telefono: '6128888888',
                correo: 'fernanda@gmail.com'
            },
            {
                nombre: 'Miguel Sánchez',
                curp: 'SAMM090909HDFNCL09',
                telefono: '6129999999',
                correo: 'miguel@gmail.com'
            },
            {
                nombre: 'Valeria Gómez',
                curp: 'GOVV101010MDFMRS10',
                telefono: '6121010101',
                correo: 'valeria@gmail.com'
            }
        ];

        const resultadoClientes = await db
            .collection('clientes')
            .insertMany(clientes);

        console.log('Clientes insertados');

        // CUENTAS

        const clientesIds = Object.values(
            resultadoClientes.insertedIds
        );

        const cuentas = clientes.map((cliente, index) => ({
            numeroCuenta: `${1001 + index}`,
            clienteCURP: cliente.curp,
            saldo: Math.floor(Math.random() * 10000) + 1000,
            tipo: 'Debito'
        }));

        const resultadoCuentas = await db
            .collection('cuentas')
            .insertMany(cuentas);

        console.log('Cuentas insertadas');

        // TRANSACCIONES

        const cuentasIds = Object.values(
            resultadoCuentas.insertedIds
        );

        const transacciones = [];

        cuentasIds.forEach((cuentaId) => {

            transacciones.push({
                cuentaId: cuentaId,
                tipo: 'deposito',
                monto: Math.floor(Math.random() * 5000) + 500,
                fecha: new Date()
            });

            transacciones.push({
                cuentaId: cuentaId,
                tipo: 'retiro',
                monto: Math.floor(Math.random() * 2000) + 200,
                fecha: new Date()
            });

        });

        await db
            .collection('transacciones')
            .insertMany(transacciones);

        console.log('Transacciones insertadas');

        console.log('Base de datos creada correctamente');

    } catch (error) {

        console.error('Error:', error);

    } finally {

        await client.close();

    }

}

crearBaseDeDatos();