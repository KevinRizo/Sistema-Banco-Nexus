const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

// CONEXION MONGODB

const uri = 'mongodb://localhost:27017';

const client = new MongoClient(uri);

async function conectarDB() {

    await client.connect();

    console.log('Conectado a MongoDB');

    return client.db('BancoNexus');

}

let db;

// INICIALIZAR SERVIDOR

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

            return res.status(404).json({
                mensaje: 'La cuenta no existe'
            });

        }

        // Buscar cliente asociado

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
