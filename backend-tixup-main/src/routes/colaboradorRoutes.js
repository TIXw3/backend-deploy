const express = require("express");
const router = express.Router();
const colaboradorController = require("../controllers/colaboradoresController");
const authMiddleware = require("../middlewares/authMiddleware");
const { verificaTipoUsuario } = require("../middlewares/verificaTipoUsuario");

/**
 * @swagger
 * tags:
 *   name: Colaboradores
 *   description: Gerenciamento de colaboradores dos eventos
 */

// Adiciona um colaborador ao evento
router.post(
  "/:evento_id/colaboradores",
  authMiddleware,
  verificaTipoUsuario("organizador", "admin"),
  (req, res, next) => {
    // #swagger.tags = ['Colaboradores']
    // #swagger.summary = 'Adicionar colaborador a um evento'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.parameters['evento_id'] = {
        in: 'path',
        description: 'ID do evento',
        required: true,
        type: 'string'
    } */
    /* #swagger.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                usuario_id: { type: "string" },
                permissao: { type: "string", example: "checkin" }
              },
              required: ["usuario_id", "permissao"]
            }
          }
        }
    } */
    /* #swagger.responses[201] = {
        description: 'Colaborador adicionado com sucesso',
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    usuario_id: { type: "string" },
                    evento_id: { type: "string" },
                    permissao: { type: "string" }
                  }
                }
              }
            }
          }
        }
    } */
    next();
  },
  colaboradorController.adicionarColaborador
);

// Lista os colaboradores do evento
router.get(
  "/:evento_id/colaboradores",
  authMiddleware,
  verificaTipoUsuario("organizador", "admin"),
  (req, res, next) => {
    // #swagger.tags = ['Colaboradores']
    // #swagger.summary = 'Listar colaboradores de um evento'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.parameters['evento_id'] = {
        in: 'path',
        description: 'ID do evento',
        required: true,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        description: 'Lista de colaboradores retornada com sucesso',
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      usuario_id: { type: "string" },
                      evento_id: { type: "string" },
                      permissao: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
    } */
    next();
  },
  colaboradorController.listarColaboradores
);

module.exports = router;
