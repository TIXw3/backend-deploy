const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificaTipoUsuario = require("../middlewares/verificaTipoUsuario");

router.post("/cadastro", authController.cadastro);

router.post("/login", authController.login);

router.post("/login-firebase", authController.loginFirebase);

router.get(
  "/me",
  authMiddleware,
  (req, res, next) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Retorna os dados do usuário autenticado'
    // #swagger.description = 'Requer token JWT válido no header Authorization'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.responses[200] = {
    //   description: 'Dados do usuário autenticado',
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         properties: {
    //           mensagem: { type: "string", example: "Usuário autenticado" },
    //           dados: {
    //             type: "object",
    //             properties: {
    //               id: { type: "string", example: "uuid-do-usuario" },
    //               tipo: { type: "string", example: "organizador" },
    //               email: { type: "string", example: "usuario@email.com" }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
    // #swagger.responses[401] = {
    //   description: 'Token inválido ou ausente',
    //   content: {
    //     "application/json": {
    //       schema: {
    //         type: "object",
    //         properties: {
    //           erro: { type: "string", example: "Token não fornecido" }
    //         }
    //       }
    //     }
    //   }
    // }
    next();
  },
  authController.getMe
);

module.exports = router;
