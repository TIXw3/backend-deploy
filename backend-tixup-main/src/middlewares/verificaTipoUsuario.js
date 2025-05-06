const { sendError } = require("../utils/responseFormatter");

const verificaTipoUsuario = (tipo) => {
  return (req, res, next) => {
    if (req.user.tipo !== tipo) {
      return sendError(res, `Apenas ${tipo}es podem acessar esta rota`, {}, 403);
    }
    next();
  };
};

module.exports = verificaTipoUsuario;