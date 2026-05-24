import { useState } from 'react';

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

  const [cuenta, setCuenta] = useState('');

  const [datos, setDatos] = useState(null);

  const [monto, setMonto] = useState('');

  const [cuentaDestino, setCuentaDestino] = useState('');

  const [mensaje, setMensaje] = useState('');

  const [tipoMensaje, setTipoMensaje] = useState('');

  const [sucursal, setSucursal] = useState('CDMX');

  // CONSULTAR CUENTA

  const consultarCuenta = async () => {

    try {

      if (!cuenta) {

        setMensaje('Ingresa un número de cuenta');

        setTipoMensaje('error');

        return;

      }

      const inicio = Date.now();

      const respuesta = await fetch(
        `http://localhost:3000/api/cuenta/${cuenta}`
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

      if (tiempoRespuesta <= 3000) {

        setMensaje(
          'Cuenta consultada correctamente'
        );

        setTipoMensaje('success');

      }

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

      if (!monto || monto <= 0) {

        setMensaje('Ingresa un monto válido');

        setTipoMensaje('error');

        return;

      }

      const respuesta = await fetch(
        'http://localhost:3000/api/deposito',
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            cuenta: cuenta,
            monto: Number(monto),
            sucursal: sucursal
          })

        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {

        consultarCuenta();

        setMonto('');

        setMensaje(data.mensaje);

        setTipoMensaje('success');

      } else {

        setMensaje(data.mensaje);

        setTipoMensaje('error');

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

      if (!monto || monto <= 0) {

        setMensaje('Ingresa un monto válido');

        setTipoMensaje('error');

        return;

      }

      const respuesta = await fetch(
        'http://localhost:3000/api/retiro',
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            cuenta: cuenta,
            monto: Number(monto),
            sucursal: sucursal
          })

        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {

        consultarCuenta();

        setMonto('');

        setMensaje(data.mensaje);

        setTipoMensaje('success');

      } else {

        setMensaje(data.mensaje);

        setTipoMensaje('error');

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
        'http://localhost:3000/api/transferencia',
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            cuentaOrigen: cuenta,
            cuentaDestino: cuentaDestino,
            monto: Number(monto),
            sucursal: sucursal
          })

        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {

        consultarCuenta();

        setMonto('');

        setCuentaDestino('');

        setMensaje(data.mensaje);

        setTipoMensaje('success');

      } else {

        setMensaje(data.mensaje);

        setTipoMensaje('error');

      }

    } catch (error) {

      console.log(error);

      setMensaje(
        'Servidor no disponible o nodo primario caido'
      );

      setTipoMensaje('error');

    }

  };

  // GRAFICA

  const saldoHistorico = [];

  if (datos && datos.transacciones) {

    let saldoActual = datos.saldo;

    saldoHistorico.push(saldoActual);

    const movimientosInvertidos =
      [...datos.transacciones].reverse();

    movimientosInvertidos.forEach((movimiento) => {

      if (movimiento.tipo === 'deposito') {
        saldoActual -= movimiento.monto;
      }

      if (movimiento.tipo === 'retiro') {
        saldoActual += movimiento.monto;
      }

      if (movimiento.tipo === 'transferencia enviada') {
        saldoActual += movimiento.monto;
      }

      if (movimiento.tipo === 'transferencia recibida') {
        saldoActual -= movimiento.monto;
      }

      saldoHistorico.push(saldoActual);

    });

    saldoHistorico.reverse();

  }

  const data = {

    labels: datos
      ? [
          'Saldo Inicial',
          ...datos.transacciones.map(
            (_, index) =>
              `Movimiento ${index + 1}`
          )
        ]
      : [],

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

  return (

    <div className="container">

      <h1>Banco Nexus</h1>

      <p className="subtitle">
        Sistema Bancario Digital
      </p>

      {mensaje && (

        <div className={`mensaje ${tipoMensaje}`}>

          {mensaje}

        </div>

      )}

      <div className="search-box">

        <input
          type="text"
          placeholder="Número de cuenta"
          value={cuenta}
          onChange={(e) =>
            setCuenta(e.target.value)
          }
        />

        <button onClick={consultarCuenta}>
          Consultar
        </button>

      </div>

      {datos && (

        <div className="card">

          <div className="info">

            <div className="info-box">

              <h3>Cliente</h3>

              <p>{datos.cliente}</p>

            </div>

            <div className="info-box">

              <h3>Cuenta</h3>

              <p>{datos.cuenta}</p>

            </div>

            <div className="info-box">

              <h3>Saldo</h3>

              <p>${datos.saldo}</p>

            </div>

          </div>

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

            <input
              type="text"
              placeholder="Cuenta destino"
              value={cuentaDestino}
              onChange={(e) =>
                setCuentaDestino(e.target.value)
              }
            />

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

                      {movimiento.tipo.toUpperCase()}

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
                      ).toLocaleDateString()}

                    </p>

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

