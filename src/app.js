require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

const authRoutes = require('./routes/auth.route')
const pointRecordRoutes = require('./routes/pointRecord.route')
const walletRoutes = require('./routes/wallet.route')

require('./relations/pointRecord.relations')

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);
app.use('/pointRecord', pointRecordRoutes)
app.use('/wallet', walletRoutes)

app.get("/", (req, res) => {
  res.send("Ola, mundo")
})

sequelize.authenticate().then(() => {
  console.log('Banco sincronizado');
  app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
});
