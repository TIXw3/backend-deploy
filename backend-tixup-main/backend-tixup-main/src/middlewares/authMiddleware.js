const jwt = require("jsonwebtoken");
require("dotenv").config();
const { sendError } = require("../utils/responseFormatter");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Token não fornecido", {}, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, "Token inválido", { details: err.message }, 401);
  }
};

module.exports = authMiddleware;
