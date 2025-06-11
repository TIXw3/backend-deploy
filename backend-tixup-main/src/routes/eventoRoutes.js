const express = require("express");
const router = express.Router();
const multer = require("multer");
const eventoController = require("../controllers/eventoController");
const authMiddleware = require("../middlewares/authMiddleware");
const { verificaTipoUsuario, verificaPermissaoEdicao } = require("../middlewares/verificaTipoUsuario");
const validaEvento = require("../middlewares/validaEvento");
const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

// Configuração do multer para processar o upload de imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // limite de 10MB
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

// Rota pública para listar eventos
router.get(
  "/",
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Lista todos os eventos públicos'
    // #swagger.parameters['categoria'] = { in: 'query', description: 'Filtrar por categoria', type: 'string' }
    // #swagger.parameters['data'] = { in: 'query', description: 'Filtrar por data (formato YYYY-MM-DD)', type: 'string' }
    /* #swagger.responses[200] = {
      description: "Eventos públicos listados com sucesso",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: { $ref: "#/components/schemas/Evento" }
          }
        }
      }
    } */
    next();
  },
  async (req, res) => {
    try {
      const { categoria, data } = req.query;

      let query = supabase.from("eventos").select("*").eq("publico", true);

      if (categoria) {
        query = query.eq("categoria", categoria);
      }

      if (data) {
        if (!isValidDate(data)) {
          return sendError(
            res,
            "O campo data deve estar no formato YYYY-MM-DD",
            {},
            400
          );
        }
        query = query.eq("data", data);
      }

      const { data: eventos, error } = await query;

      if (error) {
        return sendError(
          res,
          "Erro ao buscar eventos públicos",
          { details: error.message },
          500
        );
      }

      sendSuccess(res, "Eventos públicos listados com sucesso", eventos, 200);
    } catch (err) {
      sendError(res, "Erro ao listar eventos", { details: err.message }, 500);
    }
  }
);

// Aplica o middleware de autenticação nas rotas abaixo
router.use(authMiddleware);

// Lista eventos do organizador logado
router.get(
  "/meus-eventos",
  authMiddleware,
  verificaTipoUsuario("organizador"),
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Lista os eventos do organizador logado'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.responses[200] = {
      description: "Eventos do organizador listados com sucesso",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/Evento" }
              }
            }
          }
        }
      }
    } */
    next();
  },
  eventoController.listarMeusEventos
);

// Rota pública para buscar evento por ID
router.get(
  "/:id",
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Busca um evento específico por ID'
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    /* #swagger.responses[200] = {
      description: "Evento encontrado com sucesso",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Evento" }
        }
      }
    } */
    /* #swagger.responses[404] = {
      description: "Evento não encontrado",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Evento não encontrado" },
              error: {
                type: "object",
                properties: {
                  code: { type: "string", example: "NOT_FOUND" },
                  details: { type: "string", example: "Nenhum detalhe adicional disponível" },
                  suggestion: { type: "string", example: "Verifique se o ID do evento está correto." }
                }
              }
            }
          }
        }
      }
    } */
    next();
  },
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data: evento, error } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !evento) {
        return sendError(res, "Evento não encontrado", {}, 404);
      }

      // Se o evento não for público, verifica se o usuário é o organizador
      if (!evento.publico) {
        if (!req.user) {
          return sendError(res, "Evento não encontrado", {}, 404);
        }

        if (evento.organizador_id !== req.user.id) {
          return sendError(res, "Evento não encontrado", {}, 404);
        }
      }

      sendSuccess(res, "Evento encontrado com sucesso", evento, 200);
    } catch (err) {
      sendError(res, "Erro ao buscar evento", { details: err.message }, 500);
    }
  }
);

// Cria novo evento
router.post(
  "/",
  authMiddleware,
  verificaTipoUsuario("organizador"),
  upload.single('imagem'),
  validaEvento(),
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Cria um novo evento'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              nome: { type: "string", example: "Show do Matuê" },
              descricao: { type: "string", example: "Evento com atrações especiais" },
              data: { type: "string", format: "date", example: "2025-06-20" },
              local: { type: "string", example: "Ginásio Central" },
              preco: { type: "number", example: 99.9 },
              imagem: { type: "string", format: "binary" },
              publico: { type: "boolean", example: true },
              categoria: { type: "string", example: "show" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[201] = {
      description: "Evento criado com sucesso",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Evento" }
        }
      }
    } */
    next();
  },
  eventoController.criarEvento
);

// Edita evento
router.put(
  "/:id",
  authMiddleware,
  verificaPermissaoEdicao(),
  upload.single('imagem'),
  validaEvento(),
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Edita um evento existente'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              nome: { type: "string", example: "Show do Matuê - Atualizado" },
              descricao: { type: "string", example: "Evento com novas atrações" },
              data: { type: "string", format: "date", example: "2025-06-21" },
              local: { type: "string", example: "Estádio Municipal" },
              preco: { type: "number", example: 120.0 },
              imagem: { type: "string", example: "https://imagem.com/nova-img.jpg" },
              publico: { type: "boolean", example: true },
              categoria: { type: "string", example: "show" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[200] = {
      description: "Evento atualizado com sucesso",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Evento" }
        }
      }
    } */
    /* #swagger.responses[400] = {
      description: "Erro de validação nos campos fornecidos",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Campos obrigatórios: nome, data, local, preco, publico" },
              error: {
                type: "object",
                properties: {
                  code: { type: "string", example: "BAD_REQUEST" },
                  details: { type: "string", example: "Campos obrigatórios ausentes" },
                  suggestion: { type: "string", example: "Verifique os campos fornecidos e tente novamente." }
                }
              }
            }
          }
        }
      }
    } */
    /* #swagger.responses[403] = {
      description: "Não autorizado a editar este evento",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Você não tem permissão para editar este evento" },
              error: {
                type: "object",
                properties: {
                  code: { type: "string", example: "FORBIDDEN" },
                  details: { type: "string", example: "Apenas o organizador do evento pode editá-lo" },
                  suggestion: { type: "string", example: "Verifique suas permissões ou contate o suporte." }
                }
              }
            }
          }
        }
      }
    } */
    /* #swagger.responses[404] = { description: "Evento não encontrado" } */
    /* #swagger.responses[500] = { description: "Erro interno do servidor" } */
    next();
  },
  eventoController.editarEvento
);

// Deleta evento
router.delete(
  "/:id",
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Deleta um evento por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    // #swagger.responses[204] = { description: "Evento deletado com sucesso" }
    // #swagger.responses[403] = { description: "Não autorizado a deletar este evento" }
    // #swagger.responses[404] = { description: "Evento não encontrado" }
    next();
  },
  eventoController.deletarEvento
);

// Lista vendas (ingressos) de um evento
router.get(
  "/:id/vendas",
  verificaTipoUsuario("organizador"),
  async (req, res, next) => {
    // #swagger.tags = ['Vendas']
    // #swagger.summary = 'Lista todos os ingressos vendidos para um evento'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    /* #swagger.responses[200] = {
      description: "Lista de ingressos vendidos",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", example: "uuid-do-ingresso" },
                nome_comprador: { type: "string", example: "João Comprador" },
                data_compra: { type: "string", format: "date-time", example: "2025-04-18T10:00:00Z" },
                status: { type: "string", example: "pendente" }
              }
            }
          }
        }
      }
    } */
    /* #swagger.responses[401] = { description: "Não autorizado" } */
    /* #swagger.responses[403] = { description: "Apenas organizadores podem visualizar vendas" } */
    /* #swagger.responses[404] = { description: "Evento não encontrado" } */
    /* #swagger.responses[500] = { description: "Erro interno do servidor" } */

    try {
      const { id } = req.params;
      const organizadorId = req.user.id;

      console.log("Buscando evento com id:", id);
      const { data: evento, error: eventoError } = await supabase
        .from("eventos")
        .select("id, organizador_id")
        .eq("id", id)
        .single();
      if (eventoError || !evento) {
        console.error("Erro ao buscar evento:", eventoError);
        return sendError(res, "Evento não encontrado", {}, 404);
      }

      if (evento.organizador_id !== organizadorId) {
        return sendError(
          res,
          "Você não tem permissão para visualizar as vendas deste evento",
          {},
          403
        );
      }

      const { data: ingressos, error: ingressosError } = await supabase
        .from("ingressos")
        .select(
          `
          id,
          status,
          data_compra,
          usuario_id,
          usuarios!inner(nome)
        `
        )
        .eq("evento_id", id);

      if (ingressosError) {
        console.error("Erro ao buscar ingressos:", ingressosError);
        return sendError(
          res,
          "Erro ao buscar ingressos",
          { details: ingressosError.message },
          500
        );
      }

      const vendas = ingressos.map((ingresso) => ({
        id: ingresso.id,
        nome_comprador: ingresso.usuarios.nome,
        data_compra: ingresso.data_compra,
        status: ingresso.status,
      }));

      sendSuccess(res, "Vendas listadas com sucesso", vendas, 200);
    } catch (err) {
      console.error("Erro na rota /vendas:", err);
      sendError(res, "Erro ao listar vendas", { details: err.message }, 500);
    }
  }
);

const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

module.exports = router;
