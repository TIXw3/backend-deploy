const { sendError } = require("../utils/responseFormatter");
const supabase = require("../config/supabaseClient");

module.exports = async function (req, res, next) {
  const usuarioId = req.user.id;
  const usuarioIdParaEditar = req.params.id;
  const { email } = req.body;

  // Se o usuário está tentando editar seu próprio perfil
  if (usuarioId === usuarioIdParaEditar) {
    // Se estiver atualizando o email, verifica se já existe
    if (email) {
      const { data: emailExistente, error: emailError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email)
        .neq("id", usuarioId)
        .single();

      if (emailError && emailError.code !== "PGRST116") {
        return sendError(
          res,
          "Erro ao verificar email",
          { details: emailError.message },
          500
        );
      }

      if (emailExistente) {
        return sendError(res, "Email já está em uso", {}, 400);
      }
    }
    return next();
  }

  // Se chegou aqui, o usuário não tem permissão
  return sendError(
    res,
    "Você não tem permissão para editar este perfil",
    {},
    403
  );
}; 
