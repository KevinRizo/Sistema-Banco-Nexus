const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get('/', (req, res) => {

  res.json({
    mensaje: 'Servidor funcionando'
  });

});

app.listen(PORT, () => {

  console.log(`Servidor ejecutándose en puerto ${PORT}`);

});