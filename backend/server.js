const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

const uri ='mongodb://localhost:27017';

const client = new MongoClient(uri);

app.use(express.json());

async function conectarDB() {

    await client.connect();

    console.log("Conectado a MongoDB");

    return client.db('BancoNexus');
}

let db;

// Conexión a MongoDB
conectarDB()
    .then(database => {

        db = database;

        app.listen(PORT, () => {

            console.log(`Servidor ejecutándose en puerto ${PORT}`);

        });

    })
    .catch(error => {

        console.log(error);

    });

// CONSULTAR CUENTA

app.get('/api/cuenta/:cuenta', async (req, res) => {

    try {

        const numeroCuenta = req.params.cuenta;

        // Buscar cuenta
        const cuenta = await db.collection('cuentas').findOne({
            numeroCuenta: numeroCuenta
        });

        // Verificar existencia
        if (!cuenta) {

            if (!numeroCuenta) {

                return res.status(400).json({
                    mensaje: 'Debes ingresar un número de cuenta'
                });

            }

            if (!cuenta) {

                return res.status(404).json({
                    mensaje: 'La cuenta no existe'
                });

            }

        }

        // Buscar cliente
        const cliente = await db.collection('clientes').findOne({
            curp: cuenta.clienteCURP
        });

        // Buscar transacciones
        const transacciones = await db.collection('transacciones')
            .find({
                numeroCuenta: numeroCuenta
            })
            .toArray();

        // Respuesta
        res.json({
            cliente: cliente.nombre,
            cuenta: cuenta.numeroCuenta,
            tipo: cuenta.tipo,
            saldo: cuenta.saldo,
            transacciones: transacciones
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error del servidor'
        });

    }

});

// DEPOSITO

app.post('/api/deposito', async (req, res) => {

    try {

        const { cuenta, monto } = req.body;

        if (!cuenta || !monto) {

            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });

        }

        if (monto <= 0) {

            return res.status(400).json({
                mensaje: 'El monto debe ser mayor a cero'
            });

        }

        // Buscar cuenta
        const cuentaEncontrada = await db.collection('cuentas').findOne({
            numeroCuenta: cuenta
        });

        // Verificar existencia
        if (!cuentaEncontrada) {

            return res.status(404).json({
                mensaje: 'La cuenta no existe'
            });

        }

        // Actualizar saldo
        await db.collection('cuentas').updateOne(
            { numeroCuenta: cuenta },
            {
                $inc: { saldo: monto }
            }
        );

        // Registrar transacción
        await db.collection('transacciones').insertOne({
            numeroCuenta: cuenta,
            tipo: 'deposito',
            monto: monto,
            fecha: new Date()
        });

        // Respuesta
        res.json({
            mensaje: 'Depósito realizado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error del servidor'
        });

    }

});

// RETIRO

app.post('/api/retiro', async (req, res) => {

    try {

        const { cuenta, monto } = req.body;

        if (!cuenta || !monto) {

            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });

        }

        if (monto <= 0) {

            return res.status(400).json({
                mensaje: 'El monto debe ser mayor a cero'
            });

        }

        // Buscar cuenta
        const cuentaEncontrada = await db.collection('cuentas').findOne({
            numeroCuenta: cuenta
        });

        // Verificar existencia
        if (!cuentaEncontrada) {

            return res.status(404).json({
                mensaje: 'La cuenta no existe'
            });

        }

        // Verificar saldo suficiente
        if (cuentaEncontrada.saldo < monto) {

            return res.status(400).json({
                mensaje: 'Saldo insuficiente'
            });

        }

        // Actualizar saldo
        await db.collection('cuentas').updateOne(
            { numeroCuenta: cuenta },
            {
                $inc: { saldo: -monto }
            }
        );

        // Registrar transacción
        await db.collection('transacciones').insertOne({
            numeroCuenta: cuenta,
            tipo: 'retiro',
            monto: monto,
            fecha: new Date()
        });

        // Respuesta
        res.json({
            mensaje: 'Retiro realizado correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error del servidor'
        });

    }
});

// TRANSFERENCIA

app.post('/api/transferencia', async (req, res) => {

    try {

        const {
            cuentaOrigen,
            cuentaDestino,
            monto
        } = req.body;

        if (
            !cuentaOrigen ||
            !cuentaDestino ||
            !monto
        ) {

            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });

        }

        if (monto <= 0) {

            return res.status(400).json({
                mensaje: 'El monto debe ser mayor a cero'
            });

        }

        if (cuentaOrigen === cuentaDestino) {

            return res.status(400).json({
                mensaje: 'No puedes transferir a la misma cuenta'
            });

        }

        const origen = await db.collection('cuentas').findOne({
            numeroCuenta: cuentaOrigen
        });

        const destino = await db.collection('cuentas').findOne({
            numeroCuenta: cuentaDestino
        });

        if (!origen || !destino) {

            return res.status(404).json({
                mensaje: 'La cuenta origen o destino no existe'
            });

        }

        if (origen.saldo < monto) {

            return res.status(400).json({
                mensaje: 'Saldo insuficiente'
            });

        }

        // Restar saldo origen
        await db.collection('cuentas').updateOne(
            { numeroCuenta: cuentaOrigen },
            {
                $inc: { saldo: -monto }
            }
        );

        // Sumar saldo destino
        await db.collection('cuentas').updateOne(
            { numeroCuenta: cuentaDestino },
            {
                $inc: { saldo: monto }
            }
        );

        // Registrar movimiento origen
        await db.collection('transacciones').insertOne({
            numeroCuenta: cuentaOrigen,
            tipo: 'transferencia enviada',
            monto: monto,
            fecha: new Date()
        });

        // Registrar movimiento destino
        await db.collection('transacciones').insertOne({
            numeroCuenta: cuentaDestino,
            tipo: 'transferencia recibida',
            monto: monto,
            fecha: new Date()
        });

        res.json({
            mensaje: 'Transferencia realizada correctamente'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error del servidor'
        });

    }

});

