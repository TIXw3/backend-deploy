const { sendError } = require("../utils/responseFormatter");

const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const validaEvento = () => {
  return (req, res, next) => {
    const { nome, data, local, preco, publico, quantidade_ingressos } = req.body;

    // Converte o valor de publico para booleano se for string
    if (typeof publico === 'string') {
      req.body.publico = publico.toLowerCase() === 'true';
    } else if (typeof publico === 'boolean') {
      req.body.publico = publico;
    } else {
      req.body.publico = true; // valor padrão
    }

    // Converte o preço para número
    if (preco !== undefined) {
      const precoNumerico = Number(preco);
      if (isNaN(precoNumerico)) {
        return sendError(res, "O campo preco deve ser um número válido", {}, 400);
      }
      if (precoNumerico < 0) {
        return sendError(res, "O campo preco deve ser um número não negativo", {}, 400);
      }
      req.body.preco = precoNumerico;
    }

    // Converte quantidade_ingressos para número
    if (quantidade_ingressos !== undefined) {
      const quantidadeNumerica = Number(quantidade_ingressos);
      if (isNaN(quantidadeNumerica)) {
        return sendError(res, "O campo quantidade_ingressos deve ser um número válido", {}, 400);
      }
      if (quantidadeNumerica <= 0) {
        return sendError(res, "O campo quantidade_ingressos deve ser maior que zero", {}, 400);
      }
      if (quantidadeNumerica > 100000) {
        return sendError(res, "O campo quantidade_ingressos não pode exceder 100.000", {}, 400);
      }
      req.body.quantidade_ingressos = quantidadeNumerica;
    }

    // Validações para criação
    if (req.method === "POST") {
      if (!nome || !data || !local || preco === undefined || quantidade_ingressos === undefined) {
        return sendError(
          res,
          "Campos obrigatórios: nome, data, local, preco, quantidade_ingressos",
          {},
          400
        );
      }
    }

    // Validações para atualização
    if (req.method === "PUT") {
      if (!nome && !data && !local && preco === undefined && !req.file && quantidade_ingressos === undefined) {
        return sendError(
          res,
          "Pelo menos um campo deve ser fornecido para atualização",
          {},
          400
        );
      }
    }

    // Validações comuns
    if (data && !isValidDate(data)) {
      return sendError(res, "O campo data deve estar no formato YYYY-MM-DD", {}, 400);
    }

    next();
  };
};

module.exports = validaEvento;