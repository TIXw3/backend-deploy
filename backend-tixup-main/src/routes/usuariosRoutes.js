const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middlewares/authMiddleware");
const { verificaPermissaoEdicao } = require("../middlewares/verificaTipoUsuario");
const { autoPromover, editarUsuarioPorId } = require("../controllers/usuariosController");

router.put(
  "/tornar-organizador",
  authMiddleware,
  (req, res, next) => {
    /* #swagger.tags = ['Usuários']
       #swagger.summary = 'Promove o usuário autenticado a organizador'
       #swagger.description = 'Permite que um usuário comum ative o modo organizador.'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.responses[200] = {
         description: 'Usuário promovido com sucesso',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: true },
                 message: { type: 'string', example: 'Usuário promovido a organizador com sucesso' },
                 data: {
                   type: 'object',
                   properties: {
                     usuario: { $ref: '#/components/schemas/Usuario' }
                   }
                 }
               }
             }
           }
         }
       }
       #swagger.responses[400] = {
         description: 'Usuário já é organizador',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: false },
                 message: { type: 'string', example: 'Usuário já é organizador' },
                 error: {
                   type: 'object',
                   properties: {
                     code: { type: 'string', example: 'BAD_REQUEST' },
                     details: { type: 'string', example: 'Nenhum detalhe adicional disponível' },
                     suggestion: { type: 'string', example: 'Verifique os dados enviados e tente novamente.' }
                   }
                 }
               }
             }
           }
         }
       }
       #swagger.responses[401] = {
         description: 'Token JWT ausente ou inválido',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: false },
                 message: { type: 'string', example: 'Token não fornecido' },
                 error: {
                   type: 'object',
                   properties: {
                     code: { type: 'string', example: 'UNAUTHORIZED' },
                     details: { type: 'string', example: 'Nenhum detalhe adicional disponível' },
                     suggestion: { type: 'string', example: 'Faça login ou verifique suas credenciais.' }
                   }
                 }
               }
             }
           }
         }
       }
       #swagger.responses[500] = {
         description: 'Erro interno ao promover',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: false },
                 message: { type: 'string', example: 'Erro ao se promover' },
                 error: {
                   type: 'object',
                   properties: {
                     code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
                     details: { type: 'string', example: 'Erro interno do servidor' },
                     suggestion: { type: 'string', example: 'Tente novamente ou contate o suporte.' }
                   }
                 }
               }
             }
           }
         }
       }
    */
    next();
  },
  autoPromover
);

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

router.put(
  "/:id",
  authMiddleware,
  verificaPermissaoEdicao(),
  upload.single('imagem'),
  (req, res, next) => {
    /* #swagger.tags = ['Usuários']
       #swagger.summary = 'Edita informações de um usuário específico'
       #swagger.description = 'Permite que um usuário edite suas próprias informações ou que um organizador edite informações de qualquer usuário'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID do usuário a ser editado',
         required: true,
         type: 'string'
       }
       #swagger.requestBody = {
         required: true,
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 nome: { type: 'string', example: 'João das Couves' },
                 datanascimento: { type: 'string', format: 'date', example: '1990-01-01' },
                 telefone: { type: 'string', example: '+5511999999999' },
                 endereco: { type: 'string', example: 'Rua Exemplo, 123, São Paulo, SP' },
                 email: { type: 'string', format: 'email', example: 'joao@email.com' },
                 imagemPerf: { type: 'string', example: 'https://storage.supabase.co/bucket/perfil/joao.jpg' }
               }
             }
           }
         }
       }
       #swagger.responses[200] = {
         description: 'Informações do usuário atualizadas com sucesso',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: true },
                 message: { type: 'string', example: 'Informações do usuário atualizadas com sucesso' },
                 data: {
                   type: 'object',
                   properties: {
                     usuario: { $ref: '#/components/schemas/Usuario' }
                   }
                 }
               }
             }
           }
         }
       }
       #swagger.responses[400] = {
         description: 'Dados inválidos fornecidos',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: false },
                 message: { type: 'string', example: 'Pelo menos um campo deve ser fornecido' },
                 error: {
                   type: 'object',
                   properties: {
                     code: { type: 'string', example: 'BAD_REQUEST' },
                     details: { type: 'string', example: 'Nenhum detalhe adicional disponível' },
                     suggestion: { type: 'string', example: 'Verifique os dados enviados e tente novamente.' }
                   }
                 }
               }
             }
           }
         }
       }
       #swagger.responses[403] = {
         description: 'Sem permissão para editar o usuário',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: false },
                 message: { type: 'string', example: 'Você não tem permissão para editar este usuário' },
                 error: {
                   type: 'object',
                   properties: {
                     code: { type: 'string', example: 'FORBIDDEN' },
                     details: { type: 'string', example: 'Nenhum detalhe adicional disponível' },
                     suggestion: { type: 'string', example: 'Verifique suas permissões ou contate o suporte.' }
                   }
                 }
               }
             }
           }
         }
       }
       #swagger.responses[404] = {
         description: 'Usuário não encontrado',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: false },
                 message: { type: 'string', example: 'Usuário não encontrado' },
                 error: {
                   type: 'object',
                   properties: {
                     code: { type: 'string', example: 'NOT_FOUND' },
                     details: { type: 'string', example: 'Nenhum detalhe adicional disponível' },
                     suggestion: { type: 'string', example: 'Verifique se o ID do usuário está correto.' }
                   }
                 }
               }
             }
           }
         }
       }
       #swagger.responses[500] = {
         description: 'Erro interno ao atualizar',
         content: {
           'application/json': {
             schema: {
               type: 'object',
               properties: {
                 success: { type: 'boolean', example: false },
                 message: { type: 'string', example: 'Erro ao atualizar informações do usuário' },
                 error: {
                   type: 'object',
                   properties: {
                     code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
                     details: { type: 'string', example: 'Erro interno do servidor' },
                     suggestion: { type: 'string', example: 'Tente novamente ou contate o suporte.' }
                   }
                 }
               }
             }
           }
         }
       }
    */
    next();
  },
  editarUsuarioPorId
);

module.exports = router;