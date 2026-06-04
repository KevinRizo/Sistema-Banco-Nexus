const jwt = require('jsonwebtoken');

const express = require('express');

const cors = require('cors');

const { MongoClient, ObjectId } = require('mongodb');

const bcrypt = require('bcrypt');

const app = express();

require('dotenv').config();

app.use(cors());

app.use(express.json());

// URI REPLICA SET

const uri = process.env.MONGO_URI;

// CLIENTE MONGODB

const client = new MongoClient(uri, {

    serverSelectionTimeoutMS: 5000,

    socketTimeoutMS: 45000

});

let db;

async function crearIndices() {

    await db.collection('cuentas')
        .createIndex(

            {

                numeroCuenta: 1

            },

            {

                unique: true

            }

        );

}

async function registrarAuditoria(
    usuario,
    accion,
    estado,
    detalle
) {

    try {

        await db.collection('auditoria')
            .insertOne({

                usuario,

                accion,

                estado,

                detalle,

                fecha: new Date()

            });

    } catch (error) {

        console.log(
            'Error auditoria:',
            error
        );

    }

}

function generarNumeroCuenta() {

    const secuencia =
        Math.floor(
            Math.random() * 1000000
        )
            .toString()
            .padStart(6, '0');

    const base =
        `180${secuencia}`;

    const suma =
        base
            .split('')
            .reduce(

                (acc, digito) =>

                    acc + Number(digito),

                0

            );

    const digitoVerificador =
        suma % 10;

    return `${base}${digitoVerificador}`;

}

function verificarToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({

            mensaje:
                'Token no proporcionado'

        });

    }

    const token =
        authHeader.split(' ')[1];

    try {

        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );

        req.usuario = decoded;

        next();

    } catch (error) {

        return res.status(403).json({

            mensaje:
                'Token inválido'

        });

    }

}

// CONEXION MONGODB

async function conectarMongo() {

    try {

        await client.connect();

        db = client.db('BancoNexus');

        console.log('Conectado al Replica Set MongoDB');

    } catch (error) {

        console.log('Error de conexion MongoDB');

        console.log(error);

        process.exit(1);

    }

}

conectarMongo();

// REGISTRO DE USUARIOS

app.post('/api/auth/register', async (req, res) => {

    try {

        const {

            nombre,

            correo,

            password

        } = req.body;

        // VALIDAR NOMBRE

        if (!nombre || !nombre.trim()) {

            return res.status(400).json({

                mensaje:
                    'Nombre obligatorio'

            });

        }

        const regexNombre =
            /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,50}$/;

        if (!regexNombre.test(nombre)) {

            return res.status(400).json({

                mensaje:
                    'Nombre inválido'

            });

        }

        // VALIDAR CORREO

        const regexCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regexCorreo.test(correo)) {

            return res.status(400).json({

                mensaje:
                    'Correo inválido'

            });

        }

        // VALIDAR CONTRASEÑA

        if (!password || password.length < 8) {

            return res.status(400).json({

                mensaje:
                    'La contraseña debe tener al menos 8 caracteres'

            });

        }

        const usuarios =
            db.collection('usuarios');

        const existe =
            await usuarios.findOne({

                correo

            });

        if (existe) {

            return res.status(400).json({

                mensaje:
                    'El correo ya existe'

            });

        }

        const passwordHash =
            await bcrypt.hash(password, 10);

        const numeroCuenta =
            generarNumeroCuenta();

        await usuarios.insertOne({

            nombre,

            correo,

            password: passwordHash,

            numeroCuenta,

            fechaRegistro: new Date()

        });

        const clientes =
            db.collection('clientes');

        await clientes.insertOne({

            curp: `USR${numeroCuenta}`,

            nombre,

            correo

        });

        const cuentas =
            db.collection('cuentas');

        await cuentas.insertOne({

            numeroCuenta,

            clienteCURP:
                `USR${numeroCuenta}`,

            saldo: 0,

            tipo: 'Debito'

        });

        await registrarAuditoria(

            correo,

            'REGISTRO',

            'EXITOSO',

            `Cuenta creada: ${numeroCuenta}`

        );

        res.status(201).json({

            mensaje:
                'Usuario registrado correctamente',

            numeroCuenta

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                'Error al registrar usuario'

        });

    }

});

// LOGIN DE USUARIOS

app.post('/api/auth/login', async (req, res) => {

    try {

        const {

            correo,

            password

        } = req.body;

        if (!correo || !correo.trim()) {

            return res.status(400).json({

                mensaje:
                    'Correo obligatorio'

            });

        }

        if (!password || !password.trim()) {

            return res.status(400).json({

                mensaje:
                    'Contraseña obligatoria'

            });

        }

        const regexCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regexCorreo.test(correo)) {

            return res.status(400).json({

                mensaje:
                    'Correo inválido'

            });

        }

        const usuario =
            await db.collection('usuarios')
                .findOne({

                    correo

                });

        if (!usuario) {

            return res.status(404).json({

                mensaje:
                    'Usuario no encontrado'

            });

        }

        const passwordValido =
            await bcrypt.compare(

                password,

                usuario.password

            );

        if (!passwordValido) {

            await registrarAuditoria(

                correo,

                'LOGIN',

                'FALLIDO',

                'Contraseña incorrecta'

            );

            return res.status(401).json({

                mensaje:
                    'Contraseña incorrecta'

            });

        }

        const token = jwt.sign(

            {

                id: usuario._id,

                correo: usuario.correo,

                numeroCuenta:
                    usuario.numeroCuenta

            },

            process.env.JWT_SECRET,

            {

                expiresIn: '24h'

            }

        );

        await registrarAuditoria(

            correo,

            'LOGIN',

            'EXITOSO',

            'Inicio de sesión correcto'

        );

        res.json({

            mensaje:
                'Login exitoso',

            token,

            usuario: {

                nombre:
                    usuario.nombre,

                correo:
                    usuario.correo,

                numeroCuenta:
                    usuario.numeroCuenta

            }

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                'Error al iniciar sesión'

        });

    }

});

// PERFIL DEL USUARIO

app.get('/api/perfil', verificarToken, async (req, res) => {

    try {

        const usuario =
            await db.collection('usuarios')
                .findOne({

                    correo:
                        req.usuario.correo

                });

        if (!usuario) {

            await registrarAuditoria(

                req.usuario.correo,

                'LOGIN',

                'FALLIDO',

                'Usuario no encontrado'

            );

            return res.status(404).json({

                mensaje:
                    'Usuario no encontrado'

            });

        }

        res.json({

            nombre:
                usuario.nombre,

            correo:
                usuario.correo,

            numeroCuenta:
                usuario.numeroCuenta,

            fechaRegistro:
                usuario.fechaRegistro

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                'Error al obtener perfil'

        });

    }

});

app.put('/api/perfil', verificarToken, async (req, res) => {

    try {

        const {

            nombre,

            correo

        } = req.body;

        console.log('Usuario token:', req.usuario);

        console.log('Correo recibido:', correo);

        if (!nombre || !nombre.trim()) {

            return res.status(400).json({

                mensaje:
                    'Nombre obligatorio'

            });

        }

        const regexNombre =
            /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,50}$/;

        if (!regexNombre.test(nombre)) {

            return res.status(400).json({

                mensaje:
                    'Nombre inválido'

            });

        }

        const regexCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regexCorreo.test(correo)) {

            return res.status(400).json({

                mensaje:
                    'Correo inválido'

            });

        }
        
        console.log('Buscando correo duplicado...');

        const correoExistente =
            await db.collection('usuarios')
                .findOne({

                    correo,

                    _id: {
                        $ne: new ObjectId(
                            req.usuario.id
                        )
                    }

                });

        

        console.log(
            'Resultado correoExistente:',
            correoExistente
        );

        if (correoExistente) {

            return res.status(400).json({

                mensaje:
                    'El correo ya está registrado'

            });

        }

        const usuarioActual =
            await db.collection('usuarios')
                .findOne({

                    _id: new ObjectId(
                        req.usuario.id
                    )

                });

        if (

            usuarioActual.nombre === nombre &&

            usuarioActual.correo === correo

        ) {

            return res.json({

                mensaje:
                    'No se realizaron cambios'

            });

        }

        await db.collection('usuarios')
            .updateOne(

                {

                    _id: new ObjectId(
                        req.usuario.id
                    )

                },

                {

                    $set: {

                        nombre,

                        correo

                    }

                }

            );

        await registrarAuditoria(

            correo,

            'ACTUALIZAR PERFIL',

            'EXITOSO',

            'Datos modificados'

        );

        res.json({

            mensaje:
                'Perfil actualizado correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                'Error al actualizar perfil'

        });

    }

}
);

// BENEFICIARIOS

app.post('/api/beneficiarios', verificarToken, async (req, res) => {

    try {

        const {

            alias,

            cuentaDestino

        } = req.body;

        if (!alias || !cuentaDestino) {

            return res.status(400).json({

                mensaje:
                    'Alias y cuenta obligatorios'

            });

        }

        const regexCuenta = /^\d{10}$/;

        if (!regexCuenta.test(cuentaDestino)) {

            return res.status(400).json({

                mensaje:
                    'Número de cuenta inválido'

            });

        }

        const cuenta =
            await db.collection('cuentas')
                .findOne({

                    numeroCuenta:
                        cuentaDestino

                });

        if (!cuenta) {

            return res.status(404).json({

                mensaje:
                    'La cuenta destino no existe'

            });

        }

        const existeBeneficiario =
            await db.collection('beneficiarios')
                .findOne({

                    usuario:
                        req.usuario.numeroCuenta,

                    cuentaDestino

                });

        if (existeBeneficiario) {

            return res.status(400).json({

                mensaje:
                    'Este beneficiario ya existe'

            });

        }

        if (

            cuentaDestino ===
            req.usuario.numeroCuenta

        ) {

            return res.status(400).json({

                mensaje:
                    'No puedes agregarte como beneficiario'

            });

        }

        await db.collection('beneficiarios')
            .insertOne({

                usuario:
                    req.usuario.numeroCuenta,

                alias,

                cuentaDestino,

                fecha:
                    new Date()

            });

        await registrarAuditoria(

            req.usuario.numeroCuenta,

            'BENEFICIARIO',

            'EXITOSO',

            `Alias: ${alias}`

        );

        res.json({

            mensaje:
                'Beneficiario agregado correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                'Error al agregar beneficiario'

        });

    }

}
);

app.get('/api/beneficiarios', verificarToken, async (req, res) => {

    try {

        const beneficiarios =
            await db.collection('beneficiarios')
                .find({

                    usuario:
                        req.usuario.numeroCuenta

                })
                .toArray();

        res.json(
            beneficiarios
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                'Error al obtener beneficiarios'

        });

    }

}
);

app.delete('/api/beneficiarios/:id', verificarToken, async (req, res) => {

    console.log(
        'ID recibido:',
        req.params.id
    );

    try {

        const resultado =
            await db.collection('beneficiarios')
                .deleteOne({

                    _id: new ObjectId(
                        req.params.id
                    ),

                    usuario:
                        req.usuario.numeroCuenta

                });

        console.log(resultado);

        if (resultado.deletedCount === 0) {

            return res.status(404).json({

                mensaje:
                    'Beneficiario no encontrado'

            });

        }

        await registrarAuditoria(

            req.usuario.numeroCuenta,

            'ELIMINAR BENEFICIARIO',

            'EXITOSO',

            `ID: ${req.params.id}`

        );

        res.json({

            mensaje:
                'Beneficiario eliminado correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                'Error al eliminar beneficiario'

        });

    }

}
);

// CONSULTAR CUENTA

app.get('/api/cuenta/:cuenta', async (req, res) => {

    try {

        const numeroCuenta = req.params.cuenta;

        const regexCuenta = /^\d{10}$/;

        if (!regexCuenta.test(numeroCuenta)) {

            return res.status(400).json({

                mensaje:
                    'Número de cuenta inválido'

            });

        }

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

            cliente:
                cliente ?
                    cliente.nombre
                    : 'Cliente no encontrado',

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

app.post('/api/deposito', verificarToken, async (req, res) => {

    const session = client.startSession();

    try {

        const { monto, sucursal } = req.body;

        if (!monto || monto <= 0) {

            return res.status(400).json({

                mensaje:
                    'Monto inválido'

            });

        }

        const cuenta =
            req.usuario.numeroCuenta;

        await session.withTransaction(async () => {

            const cuentaEncontrada =
                await db.collection('cuentas').findOne(
                    {
                        numeroCuenta: cuenta
                    },
                    { session }
                );

            if (!cuentaEncontrada) {

                throw new Error(
                    'Cuenta no encontrada'
                );

            }

            await db.collection('cuentas').updateOne(

                {
                    numeroCuenta: cuenta
                },

                {
                    $inc: {
                        saldo: monto
                    }
                },

                { session }

            );

            const cuentaActualizada =
                await db.collection('cuentas')
                    .findOne(

                        {

                            numeroCuenta:
                                req.usuario.numeroCuenta

                        },

                        {

                            session

                        }

                    );

            await db.collection('transacciones').insertOne({

                numeroCuenta:
                    req.usuario.numeroCuenta,

                clienteCURP:
                    cuentaEncontrada.clienteCURP,

                tipo: 'deposito',

                monto,

                saldoResultante:
                    cuentaActualizada.saldo,

                sucursal,

                fecha: new Date()

            });

        });

        await registrarAuditoria(

            cuenta,

            'DEPOSITO',

            'EXITOSO',

            `Monto: ${monto}`

        );

        res.json({

            mensaje:
                'Depósito realizado correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                error.message ||
                'Error en depósito'

        });

    } finally {

        await session.endSession();

    }

});

// RETIRO

app.post('/api/retiro', verificarToken, async (req, res) => {

    const session = client.startSession();

    try {

        const { monto, sucursal } = req.body;

        if (!monto || monto <= 0) {

            return res.status(400).json({

                mensaje:
                    'Monto inválido'

            });

        }

        const cuenta =
            req.usuario.numeroCuenta;

        await session.withTransaction(async () => {

            const cuentaEncontrada =
                await db.collection('cuentas').findOne(
                    {
                        numeroCuenta: cuenta
                    },
                    { session }
                );

            if (!cuentaEncontrada) {

                throw new Error(
                    'Cuenta no encontrada'
                );

            }

            if (
                cuentaEncontrada.saldo < monto
            ) {

                throw new Error(
                    'Saldo insuficiente'
                );

            }

            await db.collection('cuentas').updateOne(

                {
                    numeroCuenta: cuenta
                },

                {
                    $inc: {
                        saldo: -monto
                    }
                },

                { session }

            );

            const cuentaActualizada =
                await db.collection('cuentas')
                    .findOne(

                        {

                            numeroCuenta:
                                req.usuario.numeroCuenta

                        },

                        {

                            session

                        }

                    );

            await db.collection('transacciones').insertOne({

                numeroCuenta:
                    req.usuario.numeroCuenta,

                clienteCURP:
                    cuentaEncontrada.clienteCURP,

                tipo: 'retiro',

                monto,

                saldoResultante:
                    cuentaActualizada.saldo,

                sucursal,

                fecha: new Date()

            });

        });

        await registrarAuditoria(

            cuenta,

            'RETIRO',

            'EXITOSO',

            `Monto: ${monto}`

        );

        res.json({

            mensaje:
                'Retiro realizado correctamente'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                error.message ||
                'Error en retiro'

        });

    } finally {

        await session.endSession();

    }

});

// TRANSFERENCIA

app.post('/api/transferencia', verificarToken, async (req, res) => {

    const session = client.startSession();

    try {

        const {

            cuentaDestino,

            monto,

            sucursal

        } = req.body;

        if (!monto || monto <= 0) {

            return res.status(400).json({

                mensaje:
                    'Monto inválido'

            });

        }

        if (!cuentaDestino) {

            return res.status(400).json({

                mensaje:
                    'Cuenta destino obligatoria'

            });

        }

        const regexCuenta = /^\d{10}$/;

        if (!regexCuenta.test(cuentaDestino)) {

            return res.status(400).json({

                mensaje:
                    'Número de cuenta inválido'

            });

        }

        const cuentaOrigen =
            req.usuario.numeroCuenta;

        if (cuentaOrigen === cuentaDestino) {

            return res.status(400).json({

                mensaje:
                    'No puedes transferir a la misma cuenta'

            });

        }

        await session.withTransaction(async () => {

            const origen =
                await db.collection('cuentas').findOne(

                    {
                        numeroCuenta: cuentaOrigen
                    },

                    { session }

                );

            const destino =
                await db.collection('cuentas').findOne(

                    {
                        numeroCuenta: cuentaDestino
                    },

                    { session }

                );

            if (!origen || !destino) {

                throw new Error(
                    'Cuenta no encontrada'
                );

            }

            if (origen.saldo < monto) {

                throw new Error(
                    'Saldo insuficiente'
                );

            }

            await db.collection('cuentas').updateOne(

                {
                    numeroCuenta: cuentaOrigen
                },

                {
                    $inc: {
                        saldo: -monto
                    }
                },

                { session }

            );

            await db.collection('cuentas').updateOne(

                {
                    numeroCuenta: cuentaDestino
                },

                {
                    $inc: {
                        saldo: monto
                    }
                },

                { session }

            );

            const origenActualizada =
                await db.collection('cuentas')
                    .findOne(
                        {
                            numeroCuenta: cuentaOrigen
                        },
                        { session }
                    );

            const destinoActualizada =
                await db.collection('cuentas')
                    .findOne(
                        {
                            numeroCuenta: cuentaDestino
                        },
                        { session }
                    );

            await db.collection('transacciones').insertOne(
                {
                    numeroCuenta: cuentaOrigen,

                    cuentaOrigen,

                    cuentaDestino,

                    clienteCURP:
                        origen.clienteCURP,

                    tipo:
                        'transferencia enviada',

                    monto,

                    saldoResultante:
                        origenActualizada.saldo,

                    sucursal,

                    fecha: new Date()
                },
                { session }
            );

            await db.collection('transacciones').insertOne(
                {
                    numeroCuenta: cuentaDestino,

                    cuentaOrigen,

                    cuentaDestino,

                    clienteCURP:
                        destino.clienteCURP,

                    tipo:
                        'transferencia recibida',

                    monto,

                    saldoResultante:
                        destinoActualizada.saldo,

                    sucursal,

                    fecha: new Date()
                },
                { session }
            );

        });

        await registrarAuditoria(

            cuentaOrigen,

            'TRANSFERENCIA',

            'EXITOSO',

            `Destino: ${cuentaDestino} - Monto: ${monto}`

        );

        res.json({

            mensaje:
                'Transferencia realizada correctamente (ACID)'

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            mensaje:
                error.message ||
                'Error en transferencia'

        });

    } finally {

        await session.endSession();

    }

});

// SERVIDOR

app.listen(3000, () => {

    console.log('Servidor ejecutandose en puerto 3000');

});

