const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");
const { uploadImage } = require("../services/uploadService");
const { gerarTokenJWT } = require("../services/authService");

exports.autoPromover = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", usuarioId)
      .single();

    if (usuarioError) {
      return sendError(
        res,
        "Erro ao buscar usuário",
        { details: usuarioError.message },
        500
      );
    }

    if (usuario.tipo === "organizador") {
      return sendError(res, "Usuário já é organizador", {}, 400);
    }

    const { data: usuarioAtualizado, error: updateError } = await supabase
      .from("usuarios")
      .update({ tipo: "organizador", is_organizador: true })
      .eq("id", usuarioId)
      .select()
      .single();

    if (updateError) {
      return sendError(
        res,
        "Erro ao se promover",
        { details: updateError.message },
        500
      );
    }

    // Gera um novo token JWT com o tipo atualizado
    const novoToken = gerarTokenJWT(usuarioAtualizado);

    sendSuccess(
      res,
      "Usuário promovido a organizador com sucesso",
      { usuario: usuarioAtualizado, token: novoToken },
      200
    );
  } catch (err) {
    sendError(res, "Erro ao se promover", { details: err.message }, 500);
  }
};

exports.editarUsuarioPorId = async (req, res) => {
  console.log("Entrou em editarUsuarioPorId");
  try {
    const { id } = req.params;
    const { nome, datanascimento, telefone, endereco, email } = req.body;
    let imagemUrl = null;

    // Se houver uma nova imagem no request, faz o upload
    if (req.file) {
      try {
        imagemUrl = await uploadImage(req.file, "imagem.perf");
      } catch (uploadError) {
        return sendError(
          res,
          "Erro ao fazer upload da imagem",
          { details: uploadError.message },
          500
        );
      }
    }

    // Validate input
    if (!nome && !datanascimento && !telefone && !endereco && !email && !imagemUrl) {
      return sendError(
        res,
        "Pelo menos um campo (nome, datanascimento, telefone, endereco, email ou imagem) deve ser fornecido",
        {},
        400
      );
    }

    // Validate datanascimento (must be at least 18 years old)
    if (datanascimento) {
      const birthDate = new Date(datanascimento);
      const currentDate = new Date('2025-05-15');
      const age = currentDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = currentDate.getMonth() - birthDate.getMonth();
      const dayDiff = currentDate.getDate() - birthDate.getDate();
      
      if (
        age < 18 || 
        (age === 18 && monthDiff < 0) || 
        (age === 18 && monthDiff === 0 && dayDiff < 0)
      ) {
        return sendError(
          res,
          "Usuário deve ter pelo menos 18 anos",
          {},
          400
        );
      }
    }

    // Fetch current user data
    const { data: usuario, error: getUserErr } = await supabase
      .from("usuarios")
      .select("id, nome, email, datanascimento, telefone, endereco, is_organizador, imagemPerf")
      .eq("id", id)
      .single();

    if (getUserErr || !usuario) {
      return sendError(res, "Usuário não encontrado", {}, 404);
    }

    // Prepare update object
    const updateData = {};
    if (nome) updateData.nome = nome;
    if (datanascimento) updateData.datanascimento = datanascimento;
    if (telefone) updateData.telefone = telefone;
    if (endereco) updateData.endereco = endereco;
    if (email) updateData.email = email;
    if (imagemUrl) updateData.imagemPerf = imagemUrl;

    // Update user data
    const { data: updatedUsuario, error: updateError } = await supabase
      .from("usuarios")
      .update(updateData)
      .eq("id", id)
      .select("id, nome, email, datanascimento, telefone, endereco, is_organizador, imagemPerf")
      .single();

    if (updateError) {
      console.error("Erro ao atualizar usuário:", updateError);
      return sendError(
        res,
        "Erro ao atualizar informações do usuário",
        { details: updateError.message },
        500
      );
    }

    sendSuccess(
      res,
      "Informações do usuário atualizadas com sucesso",
      { usuario: updatedUsuario },
      200
    );
  } catch (err) {
    console.error("Erro em editarUsuarioPorId:", err);
    return sendError(
      res,
      "Erro ao atualizar informações do usuário",
      { details: err.message },
      500
    );
  }
};
