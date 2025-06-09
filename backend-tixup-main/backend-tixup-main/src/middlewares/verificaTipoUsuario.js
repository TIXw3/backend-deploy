const { sendError } = require("../utils/responseFormatter");
const supabase = require("../config/supabaseClient");

const verificaTipoUsuarioMiddleware = (...tipos) => {
  return async (req, res, next) => {
    const usuario = req.user || req.usuario;

    if (!usuario) {
      return sendError(res, "Usuário não autenticado", {}, 401);
    }

    if (!tipos.includes(usuario.tipo)) {
      return sendError(
        res,
        `Apenas usuários do tipo '${tipos.join("' ou '")}' podem acessar esta rota`,
        {},
        403
      );
    }

    next();
  };
};

const verificaPermissaoEdicao = () => {
  return async (req, res, next) => {
    const usuario = req.user;
    const eventoId = req.params.id;

    if (!usuario) {
      return sendError(res, "Usuário não autenticado", {}, 401);
    }

    const { data: evento, error } = await supabase
      .from("eventos")
      .select("organizador_id")
      .eq("id", eventoId)
      .single();

    if (error || !evento) {
      return sendError(res, "Evento não encontrado", {}, 404);
    }

    if (evento.organizador_id !== usuario.id) {
      return sendError(
        res,
        "Você não tem permissão para editar este evento",
        {},
        403
      );
    }

    next();
  };
};

module.exports = {
  verificaTipoUsuario: verificaTipoUsuarioMiddleware,
  verificaPermissaoEdicao
};
