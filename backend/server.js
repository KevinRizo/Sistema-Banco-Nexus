const express = require('express');

const cors = require('cors');

const { MongoClient } = require('mongodb');

const app = express();

app.use(cors());

app.use(express.json());

// URI REPLICA SET

const uri =
    'mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/BancoNexus?replicaSet=rsBanco';

// CLIENTE MONGODB

const client = new MongoClient(uri, {

  serverSelectionTimeoutMS: 5000,

  socketTimeoutMS: 45000

});

let db;

// CONEXION MONGODB

async function conectarMongo() {

    try {

        await client.connect();

        console.log('Conectado al Replica Set MongoDB');

        db = client.db('BancoNexus');

    } catch (error) {

        console.log('Error de conexion MongoDB');

        console.log(error);

    }

}

conectarMongo();

// CONSULTAR CUENTA

app.get('/api/cuenta/:cuenta', async (req, res) => {

    try {

        const numeroCuenta = req.params.cuenta;

        const cuenta = await db.collection('cuentas').findOne({

            numeroCuenta: numeroCuenta

        });

        if (!cuenta) {

            return res.status(404).json({

                mensaje: 'Cuenta no encontrada'

            });

        }

        const cliente = await db.collection('clientes').findOne({

            curp: cuenta.clienteCURP

        });

        const transacciones = await db
            .collection('transacciones')
            .find({

                numeroCuenta: numeroCuenta

            })
            .sort({ fecha: -1 })
            .toArray();

        res.json({

            cliente: cliente.nombre,

            cuenta: cuenta.numeroCuenta,

            saldo: cuenta.saldo,

            transacciones: transacciones

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje: 'Error al consultar cuenta'

        });

    }

});

// DEPOSITO

app.post('/api/deposito', async (req, res) => {

    try {

        const { cuenta, monto, sucursal } = req.body;

        const cuentaEncontrada =
            await db.collection('cuentas').findOne({

                numeroCuenta: cuenta

            });

        if (!cuentaEncontrada) {

            return res.status(404).json({

                mensaje: 'Cuenta no encontrada'

            });

        }

        await db.collection('cuentas').updateOne(

            {

                numeroCuenta: cuenta

            },

            {

                $inc: {

                    saldo: monto

                }

            }

        );

        await db.collection('transacciones').insertOne({

            numeroCuenta: cuenta,

            clienteCURP: cuentaEncontrada.clienteCURP,

            tipo: 'deposito',

            monto: monto,

            sucursal: sucursal,

            fecha: new Date()

        });

        res.json({

            mensaje: 'Depósito realizado correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje: 'Error en depósito'

        });

    }

});

// RETIRO

app.post('/api/retiro', async (req, res) => {

    try {

        const { cuenta, monto, sucursal } = req.body;

        const cuentaEncontrada =
            await db.collection('cuentas').findOne({

                numeroCuenta: cuenta

            });

        if (!cuentaEncontrada) {

            return res.status(404).json({

                mensaje: 'Cuenta no encontrada'

            });

        }

        if (cuentaEncontrada.saldo < monto) {

            return res.status(400).json({

                mensaje: 'Saldo insuficiente'

            });

        }

        await db.collection('cuentas').updateOne(

            {

                numeroCuenta: cuenta

            },

            {

                $inc: {

                    saldo: -monto

                }

            }

        );

        await db.collection('transacciones').insertOne({

            numeroCuenta: cuenta,

            clienteCURP: cuentaEncontrada.clienteCURP,

            tipo: 'retiro',

            monto: monto,

            sucursal: sucursal,

            fecha: new Date()

        });

        res.json({

            mensaje: 'Retiro realizado correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje: 'Error en retiro'

        });

    }

});

// TRANSFERENCIA

app.post('/api/transferencia', async (req, res) => {

    try {

        const {

            cuentaOrigen,

            cuentaDestino,

            monto,

            sucursal

        } = req.body;

        const origen =
            await db.collection('cuentas').findOne({

                numeroCuenta: cuentaOrigen

            });

        const destino =
            await db.collection('cuentas').findOne({

                numeroCuenta: cuentaDestino

            });

        if (!origen || !destino) {

            return res.status(404).json({

                mensaje: 'Cuenta no encontrada'

            });

        }

        if (origen.saldo < monto) {

            return res.status(400).json({

                mensaje: 'Saldo insuficiente'

            });

        }

        await db.collection('cuentas').updateOne(

            {

                numeroCuenta: cuentaOrigen

            },

            {

                $inc: {

                    saldo: -monto

                }

            }

        );

        await db.collection('cuentas').updateOne(

            {

                numeroCuenta: cuentaDestino

            },

            {

                $inc: {

                    saldo: monto

                }

            }

        );

        await db.collection('transacciones').insertOne({

            numeroCuenta: cuentaOrigen,

            clienteCURP: origen.clienteCURP,

            tipo: 'transferencia enviada',

            monto: monto,

            sucursal: sucursal,

            fecha: new Date()

        });

        await db.collection('transacciones').insertOne({

            numeroCuenta: cuentaDestino,

            clienteCURP: destino.clienteCURP,

            tipo: 'transferencia recibida',

            monto: monto,

            sucursal: sucursal,

            fecha: new Date()

        });

        res.json({

            mensaje: 'Transferencia realizada correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje: 'Error en transferencia'

        });

    }

});

// SERVIDOR

app.listen(3000, () => {

    console.log('Servidor ejecutandose en puerto 3000');

});

