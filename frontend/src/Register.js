import { useState } from 'react';
import { apiUrl } from './api';

function Register({ onCambiarLogin }) {

    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [mensaje, setMensaje] = useState('');

    const registrar = async () => {

        try {

            if (!nombre.trim()) {

                setMensaje(
                    'Ingresa tu nombre'
                );

                return;

            }

            const regexNombre =
                /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,50}$/;

            if (!regexNombre.test(nombre)) {

                setMensaje(
                    'El nombre solo debe contener letras'
                );

                return;

            }

            const regexCorreo =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!regexCorreo.test(correo)) {

                setMensaje(
                    'Correo electrónico inválido'
                );

                return;

            }

            if (password.length < 8) {

                setMensaje(
                    'La contraseña debe tener al menos 8 caracteres'
                );

                return;

            }

            const respuesta = await fetch(
                apiUrl('/api/auth/register'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre,
                        correo,
                        password
                    })
                }
            );

            const data = await respuesta.json();

            if (respuesta.ok) {

                setMensaje(
                    `Cuenta creada: ${data.numeroCuenta}`
                );

            } else {

                setMensaje(data.mensaje);

            }

        } catch (error) {

            setMensaje(
                'Error al registrar usuario'
            );

        }

    };

    return (

        <div className="login-container">

            <div className="login-card">

                <div className="login-header">

                    <h1>Banco Nexus</h1>

                    <p>

                        Crea tu cuenta bancaria digital

                    </p>

                </div>

                <input
                    type="text"
                    placeholder="Nombre completo"
                    value={nombre}
                    onChange={(e) =>
                        setNombre(e.target.value)
                    }
                />

                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={correo}
                    onChange={(e) =>
                        setCorreo(e.target.value)
                    }
                />

                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button
                    onClick={registrar}
                >
                    Crear Cuenta
                </button>

                {

                    mensaje && (

                        <p className="login-error">

                            {mensaje}

                        </p>

                    )

                }

                <div className="login-footer">

                    <p>

                        ¿Ya tienes cuenta?

                    </p>

                    <button
                        className="register-link"
                        onClick={onCambiarLogin}
                    >

                        Iniciar Sesión

                    </button>

                </div>

            </div>

        </div>

    );

}

export default Register;
