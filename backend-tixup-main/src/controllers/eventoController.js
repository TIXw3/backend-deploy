const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");
const notificacoesController = require("./notificacoesController");
const { uploadImage } = require("../services/uploadService");

exports.criarEvento = async (req, res) => {
  const organizador_id = req.user.id;
  console.log("Criando evento como organizador:", organizador_id);
  try {
    const { nome, descricao, data, local, preco, publico, categoria, quantidade_ingressos } = req.body;
    let imagemUrl = null;

    // Se houver uma imagem no request, faz o upload
    if (req.file) {
      try {
        imagemUrl = await uploadImage(req.file);
      } catch (uploadError) {
        console.error("Erro ao fazer upload da imagem:", uploadError);
        return sendError(
          res,
          "Erro ao fazer upload da imagem",
          { details: uploadError.message },
          500
        );
      }
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("is_organizador")
      .eq("id", organizador_id)
      .single();

    if (usuarioError) {
      console.error("Erro ao verificar tipo de usuário:", usuarioError);
      return sendError(
        res,
        "Erro ao verificar tipo de usuário",
        { details: usuarioError.message },
        500
      );
    }

    if (!usuario.is_organizador) {
      return sendError(
        res,
        "Apenas organizadores podem criar eventos",
        {},
        403
      );
    }

    console.log("Dados do evento a serem inseridos:", {
      nome,
      descricao,
      data,
      local,
      preco,
      imagem: imagemUrl,
      publico,
      categoria,
      organizador_id,
      quantidade_ingressos
    });

    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .insert([
        {
          nome,
          descricao,
          data,
          local,
          preco,
          imagem: imagemUrl,
          publico,
          categoria,
          organizador_id,
          quantidade_ingressos: Number(quantidade_ingressos)
        },
      ])
      .select()
      .single();

    if (eventoError) {
      console.error("Erro ao criar evento:", eventoError);
      return sendError(
        res,
        "Erro ao criar evento",
        { details: eventoError.message },
        500
      );
    }

    console.log("Evento criado com sucesso:", evento);
    sendSuccess(res, "Evento criado com sucesso", evento, 201);
  } catch (err) {
    console.error("Erro em criarEvento:", err);
    sendError(res, "Erro ao criar evento", { details: err.message }, 500);
  }
};

exports.editarEvento = async (req, res) => {
  const organizador_id = req.user.id;
  const { id } = req.params;
  console.log("Editando evento:", { id, organizador_id });
  try {
    // Primeiro verifica se o evento pertence ao organizador
    const { data: eventoExistente, error: eventoError } = await supabase
      .from("eventos")
      .select("organizador_id")
      .eq("id", id)
      .single();

    if (eventoError || !eventoExistente) {
      return sendError(res, "Evento não encontrado", {}, 404);
    }

    if (eventoExistente.organizador_id !== organizador_id) {
      return sendError(
        res,
        "Você não tem permissão para editar este evento",
        {},
        403
      );
    }

    const { nome, descricao, data, local, preco, publico, categoria } = req.body;
    let imagemUrl = null;

    // Se houver uma nova imagem no request, faz o upload
    if (req.file) {
      try {
        imagemUrl = await uploadImage(req.file);
      } catch (uploadError) {
        return sendError(
          res,
          "Erro ao fazer upload da imagem",
          { details: uploadError.message },
          500
        );
      }
    }

    // Monta o objeto de atualização
    const updateData = {};
    if (nome) updateData.nome = nome;
    if (descricao) updateData.descricao = descricao;
    if (data) updateData.data = data;
    if (local) updateData.local = local;
    if (preco !== undefined) updateData.preco = preco;
    if (imagemUrl) updateData.imagem = imagemUrl;
    if (publico !== undefined) updateData.publico = publico;
    if (categoria) updateData.categoria = categoria;
    updateData.updated_at = new Date().toISOString();

    // Atualiza o evento
    const { data: updatedEvento, error: updateError } = await supabase
      .from("eventos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return sendError(
        res,
        "Erro ao atualizar evento",
        { details: updateError.message },
        500
      );
    }

    // Notifica usuários sobre a atualização
    const { data: ingressos } = await supabase
      .from("ingressos")
      .select("usuario_id")
      .eq("evento_id", id);

    if (ingressos && ingressos.length > 0) {
      const usuarios = [...new Set(ingressos.map((i) => i.usuario_id))];
      if (usuarios.length > 0) {
        const notificacaoReq = {
          body: {
            evento_id: id,
            titulo: "Evento Atualizado",
            mensagem: `O evento ${nome || updatedEvento.nome} foi atualizado.`,
          },
          user: req.user,
        };
        await notificacoesController.enviarNotificacaoPorEvento(notificacaoReq, {
          status: () => ({ json: () => {} }), // Mock res to avoid sending response
        });
      }
    }

    sendSuccess(res, "Evento atualizado com sucesso", updatedEvento, 200);
  } catch (err) {
    console.error("Erro em editarEvento:", err);
    sendError(res, "Erro ao atualizar evento", { details: err.message }, 500);
  }
};

exports.listarEventos = async (req, res) => {
  try {
    const { data: eventos, error } = await supabase
      .from("eventos")
      .select("*")
      .eq("publico", true);

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
};

exports.listarMeusEventos = async (req, res) => {
  try {
    const organizador_id = req.user.id;
    console.log("Buscando eventos do organizador:", organizador_id);

    const { data: eventos, error } = await supabase
      .from("eventos")
      .select("*")
      .eq("organizador_id", organizador_id);

    if (error) {
      console.error("Erro ao buscar eventos:", error);
      return sendError(
        res,
        "Erro ao buscar eventos do organizador",
        { details: error.message },
        500
      );
    }

    console.log("Eventos encontrados:", eventos);
    sendSuccess(
      res,
      "Eventos do organizador listados com sucesso",
      eventos,
      200
    );
  } catch (err) {
    console.error("Erro em listarMeusEventos:", err);
    sendError(res, "Erro ao listar eventos", { details: err.message }, 500);
  }
};

exports.deletarEvento = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const { data: evento, error: fetchError } = await supabase
      .from("eventos")
      .select("id, organizador_id")
      .eq("id", id)
      .single();

    if (fetchError || !evento) {
      return sendError(res, "Evento não encontrado", {}, 404);
    }

    if (evento.organizador_id !== userId) {
      return sendError(
        res,
        "Você não tem permissão para deletar este evento",
        {},
        403
      );
    }

    const { error: deleteError } = await supabase
      .from("eventos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return sendError(
        res,
        "Erro ao deletar evento",
        { details: deleteError.message },
        500
      );
    }

    sendSuccess(res, "Evento deletado com sucesso", {}, 204);
  } catch (err) {
    sendError(res, "Erro ao deletar evento", { details: err.message }, 500);
  }
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
