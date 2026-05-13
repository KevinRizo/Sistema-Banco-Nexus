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

  // CONSULTAR CUENTA

  const consultarCuenta = async () => {

    try {

      if (!cuenta) {

        setMensaje('Ingresa un número de cuenta');

        return;

      }

      const respuesta = await fetch(
        `http://localhost:3000/api/cuenta/${cuenta}`
      );

      const data = await respuesta.json();

      if (data.mensaje) {

        if (respuesta.ok) {

          setMensaje(
            'Transferencia realizada exitosamente'
          );

          setTipoMensaje('success');

        } else {

          setMensaje(` ${data.mensaje}`);

          setTipoMensaje('error');

        }

        return;

      }

      setDatos(data);

      setMensaje('');

    } catch (error) {

      console.log(error);

      setMensaje('Error al consultar cuenta');

    }

  };

  // DEPOSITAR

  const depositar = async () => {

    try {

      if (!monto || monto <= 0) {

        setMensaje(
          'Ingresa un monto válido'
        );

        return;

      }

      await fetch(
        'http://localhost:3000/api/deposito',
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            cuenta: cuenta,
            monto: Number(monto)
          })

        }
      );

      consultarCuenta();

      setMonto('');

      setMensaje(
        'Depósito realizado exitosamente'
      );

      setTipoMensaje('success');

    } catch (error) {

      console.log(error);

      setMensaje('Error al depositar');

      setTipoMensaje('error');

    }

  };

  // RETIRAR

  const retirar = async () => {

    try {

      if (!monto || monto <= 0) {

        setMensaje(
          'Ingresa un monto válido'
        );

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
            monto: Number(monto)
          })

        }
      );

      const data = await respuesta.json();

      // SI salió bien
      if (respuesta.ok) {

        setMensaje(
          'Retiro realizado exitosamente'
        );

        setTipoMensaje('success');

        consultarCuenta();

        setMonto('');

      } else {

        // SI hubo error backend
        setMensaje(`${data.mensaje}`);

        setTipoMensaje('error');

      }

    } catch (error) {

      console.log(error);

      setMensaje(
        'Error al retirar'
      );

      setTipoMensaje('error');

    }

  };

  // TRANSFERIR

  const transferir = async () => {

    try {

      if (!monto || monto <= 0) {

        setMensaje(
          'Ingresa un monto válido'
        );

        return;

      }

      if (!cuentaDestino) {

        setMensaje(
          'Ingresa cuenta destino'
        );

        return;

      }

      if (cuenta === cuentaDestino) {

        setMensaje(
          'No puedes transferir a la misma cuenta'
        );

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
            monto: Number(monto)
          })

        }
      );

      const data = await respuesta.json();

      setMensaje(data.mensaje);

      // SOLO actualizar si salió bien
      if (respuesta.ok) {

        consultarCuenta();

        setMonto('');
        setCuentaDestino('');

      }

    } catch (error) {

      console.log(error);

      setMensaje(
        'Error en transferencia'
      );

    }

  };

  // DATOS GRAFICA

  const saldoHistorico = [];

  if (datos && datos.transacciones) {

    let saldoActual = datos.saldo;

    // Agregar saldo inicial
    saldoHistorico.push(saldoActual);

    const movimientosInvertidos = [...datos.transacciones].reverse();

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
      ? ['Saldo Inicial', ...datos.transacciones.map(
        (_, index) => `Movimiento ${index + 1}`
      )]
      : [],

    datasets: [
      {
        label: 'Saldo de la cuenta',

        data: saldoHistorico,

        borderColor: '#2563eb',

        backgroundColor: 'rgba(37, 99, 235, 0.2)',

        tension: 0.4,

        fill: true,

        pointBackgroundColor: '#1d4ed8',

        pointBorderColor: '#ffffff',

        pointRadius: 5,

        pointHoverRadius: 7
      }
    ]

  };

  // OPCIONES GRAFICA

  const options = {

    responsive: true,

    plugins: {

      legend: {

        labels: {

          color: '#1e3a8a'

        }

      }

    }

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
          onChange={(e) => setCuenta(e.target.value)}
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

            <input
              type="number"
              placeholder="Monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />

            <input
              type="text"
              placeholder="Cuenta destino"
              value={cuentaDestino}
              onChange={(e) => setCuentaDestino(e.target.value)}
            />

            <button onClick={depositar}>
              Depositar
            </button>

            <button
              onClick={retirar}
              style={{ marginLeft: '10px' }}
            >
              Retirar
            </button>

            <button
              onClick={transferir}
              style={{ marginLeft: '10px' }}
            >
              Transferir
            </button>

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

            {datos.transacciones.map((movimiento, index) => (

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

                    <strong>Fecha:</strong>

                    {' '}

                    {new Date(
                      movimiento.fecha
                    ).toLocaleDateString()}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>

  );

}

export default App;