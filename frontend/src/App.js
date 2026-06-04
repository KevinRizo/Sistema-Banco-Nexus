import Login from './Login';
import Register from './Register';
import { apiUrl } from './api';

import { useState, useEffect } from 'react';

import './App.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {

  const [alias, setAlias] = useState('');

  const [cuentaBeneficiario, setCuentaBeneficiario] = useState('');

  const [beneficiarios, setBeneficiarios] = useState([]);

  const [mostrarPerfil, setMostrarPerfil] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');

  const [nuevoCorreo, setNuevoCorreo] = useState('');

  const [cuenta, setCuenta] = useState('');

  const [datos, setDatos] = useState(null);

  const [monto, setMonto] = useState('');

  const [cuentaDestino, setCuentaDestino] = useState('');

  const [mensaje, setMensaje] = useState('');

  const [tipoMensaje, setTipoMensaje] = useState('');

  const [sucursal, setSucursal] = useState('CDMX');

  const [usuario, setUsuario] = useState(
    JSON.parse(
      localStorage.getItem('usuario')
    )
  );

  const [mostrarRegistro,
    setMostrarRegistro] =
    useState(false);

  useEffect(() => {

    if (usuario?.numeroCuenta) {

      setCuenta(
        usuario.numeroCuenta
      );

    }

  }, [usuario]);

  useEffect(() => {

    if (usuario) {

      setNuevoNombre(
        usuario.nombre
      );

      setNuevoCorreo(
        usuario.correo
      );

    }

  }, [usuario]);

  useEffect(() => {

    if (usuario?.numeroCuenta) {

      consultarCuenta(
        usuario.numeroCuenta
      );

      cargarBeneficiarios();

    }

  }, [usuario]);

  const mostrarMensaje = (texto, tipo) => {

    setMensaje(texto);

    setTipoMensaje(tipo);

    setTimeout(() => {

      setMensaje('');

      setTipoMensaje('');

    }, 4000);

  };
  // CONSULTAR CUENTA

  const consultarCuenta = async (cuentaConsulta = cuenta) => {

    try {

      if (!cuentaConsulta) {

        setMensaje('Ingresa un número de cuenta');

        setTipoMensaje('error');

        return;

      }

      const inicio = Date.now();

      const respuesta = await fetch(
        apiUrl(`/api/cuenta/${cuentaConsulta}`)
      );

      const fin = Date.now();

      const tiempoRespuesta = fin - inicio;

      if (tiempoRespuesta > 3000) {

        setMensaje(
          'Alta latencia detectada en el servidor'
        );

        setTipoMensaje('error');

      }

      const data = await respuesta.json();

      if (!respuesta.ok) {

        if (respuesta.status >= 500) {

          setMensaje(
            'Servidor no disponible o nodo primario caido'
          );

        } else {

          setMensaje(data.mensaje);

        }

        setTipoMensaje('error');

        return;

      }

      setDatos(data);


    } catch (error) {

      console.log(error);

      setMensaje(
        'Servidor no disponible o nodo primario caido'
      );

      setTipoMensaje('error');

    }

  };

  // DEPOSITAR

  const depositar = async () => {

    try {

      const token =
        localStorage.getItem('token');

      if (!monto || monto <= 0) {

        setMensaje('Ingresa un monto válido');

        setTipoMensaje('error');

        return;

      }

      const respuesta = await fetch(
        apiUrl('/api/deposito'),
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization:
              `Bearer ${token}`

          },

          body: JSON.stringify({

            monto: Number(monto),

            sucursal: sucursal

          })

        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {

        await consultarCuenta();

        setMonto('');

        mostrarMensaje(
          data.mensaje,
          'success'
        );

      } else {

        mostrarMensaje(
          data.mensaje,
          'error'
        );

      }

    } catch (error) {

      console.log(error);

      setMensaje(
        'Servidor no disponible o nodo primario caido'
      );

      setTipoMensaje('error');

    }

  };

  // RETIRAR

  const retirar = async () => {

    try {

      const token =
        localStorage.getItem('token');

      if (!monto || monto <= 0) {

        setMensaje('Ingresa un monto válido');

        setTipoMensaje('error');

        return;

      }

      const respuesta = await fetch(
        apiUrl('/api/retiro'),
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization:
              `Bearer ${token}`

          },

          body: JSON.stringify({

            monto: Number(monto),

            sucursal: sucursal

          })

        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {

        await consultarCuenta();

        setMonto('');

        mostrarMensaje(
          data.mensaje,
          'success'
        );

      } else {

        mostrarMensaje(
          data.mensaje,
          'error'
        );

      }

    } catch (error) {

      console.log(error);

      setMensaje(
        'Servidor no disponible o nodo primario caido'
      );

      setTipoMensaje('error');

    }

  };

  // TRANSFERIR

  const transferir = async () => {

    try {

      const token =
        localStorage.getItem('token');

      if (!monto || monto <= 0) {

        setMensaje('Ingresa un monto válido');

        setTipoMensaje('error');

        return;

      }

      if (!cuentaDestino) {

        setMensaje('Ingresa cuenta destino');

        setTipoMensaje('error');

        return;

      }

      if (cuenta === cuentaDestino) {

        setMensaje(
          'No puedes transferir a la misma cuenta'
        );

        setTipoMensaje('error');

        return;

      }

      const respuesta = await fetch(
        apiUrl('/api/transferencia'),
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization:
              `Bearer ${token}`

          },

          body: JSON.stringify({

            cuentaDestino: cuentaDestino,

            monto: Number(monto),

            sucursal: sucursal

          })

        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {

        await consultarCuenta();

        setMonto('');

        setCuentaDestino('');

        mostrarMensaje(
          data.mensaje,
          'success'
        );

      } else {

        mostrarMensaje(
          data.mensaje,
          'error'
        );

      }

    } catch (error) {

      console.log(error);

      setMensaje(
        'Servidor no disponible o nodo primario caido'
      );

      setTipoMensaje('error');

    }

  };

  const actualizarPerfil = async () => {

    try {

      const respuesta = await fetch(
        apiUrl('/api/perfil'),
        {

          method: 'PUT',

          headers: {

            'Content-Type': 'application/json',

            Authorization:
              `Bearer ${localStorage.getItem('token')}`

          },

          body: JSON.stringify({

            nombre: nuevoNombre,

            correo: nuevoCorreo

          })

        }

      );

      const data = await respuesta.json();

      if (respuesta.ok) {

        setMensaje(
          data.mensaje
        );

        setTipoMensaje(
          'success'
        );

        setTimeout(() => {

          setMensaje('');

          setTipoMensaje('');

        }, 3000);

        const usuarioActualizado = {

          ...usuario,

          nombre: nuevoNombre,

          correo: nuevoCorreo

        };

        setUsuario(
          usuarioActualizado
        );

        localStorage.setItem(

          'usuario',

          JSON.stringify(
            usuarioActualizado
          )

        );

      } else {

        setMensaje(
          data.mensaje
        );

        setTipoMensaje(
          'error'
        );

        setTimeout(() => {

          setMensaje('');

          setTipoMensaje('');

        }, 3000);

      }

    } catch (error) {

      console.log(error);

    }

  };

  const cargarBeneficiarios = async () => {

    try {

      const respuesta = await fetch(
        apiUrl('/api/beneficiarios'),

        {

          headers: {

            Authorization:
              `Bearer ${localStorage.getItem('token')}`

          }

        }

      );

      const data =
        await respuesta.json();

      setBeneficiarios(data);

    } catch (error) {

      console.log(error);

    }

  };

  const agregarBeneficiario = async () => {

    try {

      if (!alias || !cuentaBeneficiario) {

        setMensaje(
          'Completa todos los campos'
        );

        setTipoMensaje(
          'error'
        );

        return;

      }

      const respuesta = await fetch(
        apiUrl('/api/beneficiarios'),

        {

          method: 'POST',

          headers: {

            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${localStorage.getItem('token')}`

          },

          body: JSON.stringify({

            alias,

            cuentaDestino:
              cuentaBeneficiario

          })

        }

      );

      const data =
        await respuesta.json();

      if (respuesta.ok) {

        setAlias('');

        setCuentaBeneficiario('');

        cargarBeneficiarios();

        mostrarMensaje(
          data.mensaje,
          'success'
        );

      } else {

        mostrarMensaje(
          data.mensaje,
          'error'
        );

      }

    } catch (error) {

      console.log(error);

    }

  };

  const eliminarBeneficiario = async (id) => {

    try {

      const respuesta = await fetch(
        apiUrl(`/api/beneficiarios/${id}`),

        {

          method: 'DELETE',

          headers: {

            Authorization:
              `Bearer ${localStorage.getItem('token')}`

          }

        }

      );

      const data =
        await respuesta.json();

      if (respuesta.ok) {

        mostrarMensaje(
          data.mensaje,
          'success'
        );

        cargarBeneficiarios();

      } else {

        mostrarMensaje(
          data.mensaje,
          'error'
        );

      }

    } catch (error) {

      console.log(error);

    }

  };
  // GRAFICA

  const saldoHistorico =

    datos?.transacciones
      ?.slice()
      .reverse()
      .map(

        movimiento =>

          movimiento.saldoResultante

      ) || [];

  const totalMovimientos =
    datos?.transacciones?.length || 0;

  const totalDepositos =
    datos?.transacciones?.filter(
      t => t.tipo === 'deposito'
    ).length || 0;

  const totalRetiros =
    datos?.transacciones?.filter(
      t => t.tipo === 'retiro'
    ).length || 0;

  const totalTransferencias =
    datos?.transacciones?.filter(
      t =>
        t.tipo === 'transferencia enviada' ||
        t.tipo === 'transferencia recibida'
    ).length || 0;

  const data = {

    labels:

      datos?.transacciones
        ?.slice()
        .reverse()
        .map(

          (_, index) =>

            `Movimiento ${index + 1}`

        ) || [],

    datasets: [
      {
        label: 'Saldo de la cuenta',

        data: saldoHistorico,

        borderColor: '#2563eb',

        backgroundColor:
          'rgba(37, 99, 235, 0.2)',

        tension: 0.4,

        fill: true
      }
    ]

  };

  const options = {

    responsive: true

  };

  if (!usuario) {

    if (mostrarRegistro) {

      return (

        <Register
          onCambiarLogin={() =>
            setMostrarRegistro(false)
          }
        />

      );

    }

    return (

      <Login
        onLogin={(usuarioLogueado) =>
          setUsuario(usuarioLogueado)
        }
        onCambiarRegistro={() =>
          setMostrarRegistro(true)
        }
      />

    );

  }

  return (

    <div className="container">

      <h1>Banco Nexus</h1>

      {usuario && (

        <div className="bienvenida">

          <p>

            Bienvenido, {usuario.nombre}

          </p>

          <p>

            Correo: {usuario.correo}

          </p>

          <p>

            Cuenta: {usuario.numeroCuenta}

          </p>

        </div>

      )}

      <button
        className="logout-btn"
        onClick={() => {

          localStorage.removeItem('token');

          localStorage.removeItem('usuario');

          setMensaje('');

          setTipoMensaje('');

          setDatos(null);

          setUsuario(null);

        }}
      >

        Cerrar Sesión

      </button>

      <p className="subtitle">
        Sistema Bancario Digital
      </p>

      {mensaje && (

        <div className={`mensaje ${tipoMensaje}`}>

          {mensaje}

        </div>

      )}

      {datos && (

        <div className="card">

          <div className="info">

            <div className="estadisticas">

              <div className="stat-card">

                <h3>Movimientos</h3>

                <p>{totalMovimientos}</p>

              </div>

              <div className="stat-card">

                <h3>Depósitos</h3>

                <p>{totalDepositos}</p>

              </div>

              <div className="stat-card">

                <h3>Retiros</h3>

                <p>{totalRetiros}</p>

              </div>

              <div className="stat-card">

                <h3>Transferencias</h3>

                <p>{totalTransferencias}</p>

              </div>

            </div>

            <div className="resumen-cuenta">

              <div className="resumen-card">

                <h3>Cliente</h3>

                <p>{datos.cliente}</p>

              </div>

              <div className="resumen-card">

                <h3>Cuenta</h3>

                <p>{datos.cuenta}</p>

              </div>

              <div className="resumen-card">

                <h3>Saldo</h3>

                <p>${datos.saldo}</p>

              </div>

            </div>

            <button
              className="btn-editar"
              onClick={() =>
                setMostrarPerfil(
                  !mostrarPerfil
                )
              }
            >

              {
                mostrarPerfil
                  ? 'Ocultar Perfil'
                  : 'Editar Perfil'
              }

            </button>

          </div>

          {
            mostrarPerfil && (

              <div className="perfil-box">

                <h2>Editar Perfil</h2>

                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) =>
                    setNuevoNombre(
                      e.target.value
                    )
                  }
                  placeholder="Nombre"
                />

                <input
                  type="email"
                  value={nuevoCorreo}
                  onChange={(e) =>
                    setNuevoCorreo(
                      e.target.value
                    )
                  }
                  placeholder="Correo"
                />

                <button
                  onClick={actualizarPerfil}
                >
                  Guardar Cambios
                </button>

              </div>

            )
          }

          <div className="actions">

            <div className="sucursal-box">

              <label className="sucursal-label">

                Selecciona la sucursal bancaria:

              </label>

              <select
                value={sucursal}
                onChange={(e) =>
                  setSucursal(e.target.value)
                }
              >

                <option value="CDMX">
                  Sucursal CDMX
                </option>

                <option value="Guadalajara">
                  Sucursal Guadalajara
                </option>

                <option value="Monterrey">
                  Sucursal Monterrey
                </option>

                <option value="La Paz">
                  Sucursal La Paz
                </option>

                <option value="Cancun">
                  Sucursal Cancun
                </option>

              </select>

            </div>

            <input
              type="number"
              placeholder="Monto"
              value={monto}
              onChange={(e) =>
                setMonto(e.target.value)
              }
            />

            <select

              value={cuentaDestino}

              onChange={(e) =>
                setCuentaDestino(
                  e.target.value
                )
              }

            >

              <option value="">

                Seleccionar beneficiario

              </option>

              {

                beneficiarios.map(

                  (b) => (

                    <option

                      key={b._id}

                      value={b.cuentaDestino}

                    >

                      {b.alias}

                      {' - '}

                      {b.cuentaDestino}

                    </option>

                  )

                )

              }

            </select>

            <button onClick={depositar}>
              Depositar
            </button>

            <button
              className="btn-retirar"
              onClick={retirar}
            >
              Retirar
            </button>

            <div style={{ marginTop: '15px' }}>

              <button onClick={transferir}>
                Transferir
              </button>

            </div>

          </div>

          <div className="beneficiarios-box">

            <h2>

              Beneficiarios

            </h2>

            <input

              type="text"

              placeholder="Alias"

              value={alias}

              onChange={(e) =>
                setAlias(
                  e.target.value
                )
              }

            />

            <input

              type="text"

              placeholder="Cuenta destino"

              value={cuentaBeneficiario}

              onChange={(e) =>
                setCuentaBeneficiario(
                  e.target.value
                )
              }

            />

            <button
              onClick={
                agregarBeneficiario
              }
            >

              Agregar Beneficiario

            </button>

            <ul>

              {

                beneficiarios.map(

                  (b) => (

                    <li key={b._id}>

                      <span>

                        {b.alias}

                        {' - '}

                        {b.cuentaDestino}

                      </span>

                      <button

                        className="btn-eliminar-beneficiario"

                        onClick={() =>
                          eliminarBeneficiario(
                            b._id
                          )
                        }

                      >

                        X

                      </button>

                    </li>

                  )

                )

              }

            </ul>

          </div>

          <div className="chart-container">

            <h2>Dashboard de Movimientos</h2>

            <Line
              data={data}
              options={options}
            />

          </div>

          <div className="movimientos">

            <h2>Historial de Movimientos</h2>

            {datos.transacciones.map(
              (movimiento, index) => (

                <div
                  key={index}
                  className="movimiento-item"
                >

                  <div className="movimiento-header">

                    <h3 className="movimiento-titulo">

                      {
                        movimiento.tipo === 'deposito'
                          ? '🟢 DEPÓSITO'
                          : movimiento.tipo === 'retiro'
                            ? '🔴 RETIRO'
                            : '🔵 TRANSFERENCIA'
                      }

                    </h3>

                  </div>

                  <div className="movimiento-body">

                    <p>

                      <strong>Monto:</strong>

                      {' '}

                      ${movimiento.monto}

                    </p>

                    <p>

                      <strong>Sucursal:</strong>

                      {' '}

                      {movimiento.sucursal}

                    </p>

                    <p>

                      <strong>Fecha:</strong>

                      {' '}

                      {new Date(
                        movimiento.fecha
                      ).toLocaleString()}

                    </p>

                    {
                      (
                        movimiento.tipo === 'transferencia enviada' ||

                        movimiento.tipo === 'transferencia recibida'
                      ) && (

                        <>

                          <p>

                            <strong>Cuenta origen:</strong>

                            {' '}

                            {movimiento.cuentaOrigen}

                          </p>

                          <p>

                            <strong>Cuenta destino:</strong>

                            {' '}

                            {movimiento.cuentaDestino}

                          </p>

                        </>

                      )
                    }

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>

  );

}

export default App;

