const admin = require("firebase-admin");
require("dotenv").config();

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("🔥 Firebase Admin SDK iniciado com applicationDefault");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase Admin:", error.message);
}

module.exports = admin;
