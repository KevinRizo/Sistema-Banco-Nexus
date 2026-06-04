import { useState } from 'react';
import { apiUrl } from './api';

function Login({ onLogin, onCambiarRegistro }) {

    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [mensaje, setMensaje] = useState('');

    const iniciarSesion = async () => {

        try {

            if (!correo.trim()) {

                setMensaje(
                    'Ingresa tu correo'
                );

                return;

            }

            if (!password.trim()) {

                setMensaje(
                    'Ingresa tu contraseña'
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

            const respuesta = await fetch(
                apiUrl('/api/auth/login'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        correo,
                        password
                    })
                }
            );

            const data = await respuesta.json();

            if (respuesta.ok) {

                localStorage.setItem(
                    'token',
                    data.token
                );

                localStorage.setItem(
                    'usuario',
                    JSON.stringify(data.usuario)
                );

                console.log(data.usuario);
                
                onLogin(data.usuario);

            } else {

                setMensaje(data.mensaje);

            }

        } catch (error) {

            setMensaje(
                'Error al iniciar sesión'
            );

        }

    };

    return (

        <div className="login-container">

            <div className="login-card">

                <div className="login-header">

                    <h1>Banco Nexus</h1>

                    <p>

                        Accede a tu banca digital

                    </p>

                </div>

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
                    onClick={iniciarSesion}
                >
                    Iniciar Sesión
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

                        ¿No tienes cuenta?

                    </p>

                    <button
                        className="register-link"
                        onClick={onCambiarRegistro}
                    >

                        Registrarse

                    </button>

                </div>

            </div>

        </div>

    );

}

export default Login;
