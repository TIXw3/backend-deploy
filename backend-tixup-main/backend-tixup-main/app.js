const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./src/config/swagger-output.json");
const logger = require("./src/middlewares/logger");

global.resBODY = null;

const app = express();

// Configuração do CORS
//app.use(cors());
//quando for usar o frontend localmente use o cors abaixo
app.use(cors({
  origin: 'http://localhost:5173', // URL do frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(logger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/", (req, res) => {
  res.send("Backend TixUp funcionando");
});

// Rotas
const authRoutes = require("./src/routes/authRoutes");
const eventoRoutes = require("./src/routes/eventoRoutes");
const ingressoRoutes = require("./src/routes/ingressoRoutes");
const colaboradorRoutes = require("./src/routes/colaboradorRoutes");
const notificacoesRoutes = require("./src/routes/notificacoesRoutes");
const usuariosRoutes = require("./src/routes/usuariosRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/colaboradores", colaboradorRoutes);
app.use("/api/ingressos", ingressoRoutes);
app.use("/api/notificacoes", notificacoesRoutes);
app.use("/api/usuarios", usuariosRoutes);

module.exports = app;
