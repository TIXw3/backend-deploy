const express = require("express");
const router = express.Router();
const multer = require("multer");
const usuariosController = require("../controllers/usuariosController");
const authMiddleware = require("../middlewares/authMiddleware");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

// Configuração do multer para processar o upload de imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceita apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Rota para editar usuário
router.put(
  "/:id",
  authMiddleware,
  upload.single('imagem'),
  (req, res, next) => {
    // #swagger.tags = ['Usuários']
    // #swagger.summary = 'Edita informações do usuário'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do usuário', required: true, type: 'string' }
    /* #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              nome: { type: "string", example: "João Silva" },
              datanascimento: { type: "string", format: "date", example: "1990-01-01" },
              telefone: { type: "string", example: "(11) 99999-9999" },
              endereco: { type: "string", example: "Rua Exemplo, 123" },
              email: { type: "string", format: "email", example: "joao@email.com" },
              imagem: { type: "string", format: "binary" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[200] = {
      description: "Usuário atualizado com sucesso",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Usuario" }
        }
      }
    } */
    next();
  },
  usuariosController.editarUsuarioPorId
);

// ... resto do código existente ... 