const request = require("supertest");
const app = require("../app");
const supabase = require("../src/config/supabaseClient");

describe("Auth Endpoints", () => {
  const testEmail = `pedrokatestador${Date.now()}@test.com`;
  const senha = "123456";
  let token;

  afterAll(async () => {
    await supabase.from("usuarios").delete().eq("email", testEmail);
  });

  it("deve cadastrar um novo usuário", async () => {
    const res = await request(app).post("/api/auth/cadastro").send({
      nome: "Pedroka Teste",
      email: testEmail,
      senha,
      tipo: "organizador",
    });

    console.log("Resposta cadastro:", res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Usuário criado com sucesso");
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("usuario");
    expect(res.body.data.usuario.email).toBe(testEmail);

    token = res.body.data.token;
    userId = res.body.data.usuario.id;
  }, 10000);

  it("não deve cadastrar com email repetido", async () => {
    const res = await request(app).post("/api/auth/cadastro").send({
      nome: "Pedroka Repetido",
      email: testEmail,
      senha,
      tipo: "organizador",
    });

    console.log("Resposta email repetido:", res.statusCode, res.body);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email já cadastrado");
  }, 10000);

  it("deve fazer login com sucesso", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      senha,
    });

    console.log("Resposta login:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Login realizado com sucesso");
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.usuario.email).toBe(testEmail);

    token = res.body.data.token; // atualiza o token, caso precise
  }, 10000);

  it("deve retornar dados do usuário autenticado em /auth/me", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    console.log("Resposta /auth/me:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Usuário autenticado");
    expect(res.body.data.email).toBe(testEmail);
  }, 10000);

  it("não deve retornar dados sem token em /auth/me", async () => {
    const res = await request(app).get("/api/auth/me");

    console.log("Resposta /auth/me sem token:", res.statusCode, res.body);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Token não fornecido");
  }, 10000);
});
