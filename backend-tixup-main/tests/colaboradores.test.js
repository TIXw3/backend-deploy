const request = require("supertest");
const app = require("../app");
const supabase = require("../src/config/supabaseClient");

describe("Colaboradores Endpoints", () => {
  const emailOrg = `organizador_${Date.now()}@tixup.com`;
  const emailColaborador = `colaborador_${Date.now()}@tixup.com`;
  const senha = "123456";
  let tokenOrganizador, tokenColaborador, eventoId, colaboradorId;

  beforeAll(async () => {
    const cadastroOrg = await request(app).post("/api/auth/cadastro").send({
      nome: "Organizador Teste",
      email: emailOrg,
      senha,
      tipo: "organizador",
    });

    if (cadastroOrg.statusCode !== 201) {
      console.error("❌ Erro ao cadastrar organizador:", cadastroOrg.body);
      throw new Error("Falha ao cadastrar organizador");
    }

    const loginOrg = await request(app).post("/api/auth/login").send({
      email: emailOrg,
      senha,
    });

    tokenOrganizador = loginOrg.body.data.token;
    console.log("Token organizador:", tokenOrganizador);

    const evento = await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Evento de Teste",
        descricao: "Evento criado para teste",
        data: "2025-12-31",
        local: "Centro de Eventos",
        preco: 100,
        imagem: "https://imagem.com/evento.jpg",
        publico: true,
        categoria: "show",
      });

    if (evento.statusCode !== 201) {
      console.error("❌ Erro ao criar evento:", evento.body);
      throw new Error("Falha ao criar evento");
    }

    eventoId = evento.body.data.id;
    console.log("Evento criado com ID:", eventoId);

    const cadastroColaborador = await request(app)
      .post("/api/auth/cadastro")
      .send({
        nome: "Colaborador Teste",
        email: emailColaborador,
        senha,
        tipo: "usuario",
      });

    if (cadastroColaborador.statusCode !== 201) {
      console.error(
        "❌ Erro ao cadastrar colaborador:",
        cadastroColaborador.body
      );
      throw new Error("Falha ao cadastrar colaborador");
    }

    const loginColaborador = await request(app).post("/api/auth/login").send({
      email: emailColaborador,
      senha,
    });

    tokenColaborador = loginColaborador.body.data.token;
    colaboradorId = loginColaborador.body.data.usuario.id;
    console.log("Colaborador logado com ID:", colaboradorId);
  }, 15000);

  afterAll(async () => {
    await supabase.from("colaboradores").delete().eq("evento_id", eventoId);
    await supabase.from("eventos").delete().eq("id", eventoId);
    await supabase.from("usuarios").delete().eq("email", emailOrg);
    await supabase.from("usuarios").delete().eq("email", emailColaborador);
  });

  it("deve adicionar um colaborador ao evento", async () => {
    const res = await request(app)
      .post(`/api/eventos/${eventoId}/colaboradores`)
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: colaboradorId,
        permissao: "Assistente",
      });

    console.log("Resposta adicionar colaborador:", res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Colaborador adicionado com sucesso");
    expect(res.body.data).toHaveProperty("permissao", "Assistente");
  }, 10000);

  it("não deve adicionar colaborador com campos faltando", async () => {
    const res = await request(app)
      .post(`/api/eventos/${eventoId}/colaboradores`)
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: colaboradorId,
        // permissao ausente
      });

    console.log(
      "Resposta adicionar colaborador (campos faltando):",
      res.statusCode,
      res.body
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Campos obrigatórios: usuario_id, permissao");
  }, 10000);

  it("deve listar os colaboradores do evento", async () => {
    await request(app)
      .post(`/api/eventos/${eventoId}/colaboradores`)
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: colaboradorId,
        permissao: "Assistente",
      });

    const res = await request(app)
      .get(`/api/eventos/${eventoId}/colaboradores`)
      .set("Authorization", `Bearer ${tokenOrganizador}`);

    console.log("Resposta listar colaboradores:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Colaboradores listados com sucesso");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty("permissao", "Assistente");
  }, 10000);

  it("não deve listar colaboradores para evento inexistente", async () => {
    const res = await request(app)
      .get(`/api/eventos/inexistente/colaboradores`)
      .set("Authorization", `Bearer ${tokenOrganizador}`);

    console.log(
      "Resposta listar colaboradores (evento inexistente):",
      res.statusCode,
      res.body
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Evento não encontrado ou você não é o organizador"
    );
  }, 10000);

  it("deve promover um usuário a organizador", async () => {
    const res = await request(app)
      .put("/api/auth/promover-organizador")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: colaboradorId,
      });

    console.log("Resposta promover usuário:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      "Usuário promovido a organizador com sucesso"
    );
  }, 10000);

  it("não deve promover com usuario_id inválido", async () => {
    const res = await request(app)
      .put("/api/auth/promover-organizador")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: "invalido",
      });

    console.log(
      "Resposta promover usuário (usuario_id inválido):",
      res.statusCode,
      res.body
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Usuário não encontrado");
  }, 10000);

  it("não deve promover usuário já organizador", async () => {
    await request(app)
      .put("/api/auth/promover-organizador")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: colaboradorId,
      });

    const res = await request(app)
      .put("/api/auth/promover-organizador")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: colaboradorId,
      });

    console.log(
      "Resposta promover usuário (já organizador):",
      res.statusCode,
      res.body
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Usuário já é organizador");
  }, 10000);

  it("não deve promover sem autenticação", async () => {
    const res = await request(app).put("/api/auth/promover-organizador").send({
      usuario_id: colaboradorId,
    });

    console.log(
      "Resposta promover usuário (sem autenticação):",
      res.statusCode,
      res.body
    );
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Token não fornecido");
  }, 10000);
});
