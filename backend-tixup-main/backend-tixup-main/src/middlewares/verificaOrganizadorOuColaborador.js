const supabase = require("../config/supabaseClient");

module.exports = async function (req, res, next) {
  const usuarioId = req.user.id;
  const eventoId = req.params.id;

  const { data: evento } = await supabase
    .from("eventos")
    .select("organizador_id")
    .eq("id", eventoId)
    .single();

  if (!evento) return res.status(404).json({ error: "Evento não encontrado" });

  if (evento.organizador_id === usuarioId) return next();

  const { data: colaborador } = await supabase
    .from("colaboradores")
    .select("*")
    .eq("evento_id", eventoId)
    .eq("usuario_id", usuarioId)
    .single();

  if (!colaborador) {
    return res.status(403).json({ error: "Acesso negado ao evento" });
  }

  next();
};
