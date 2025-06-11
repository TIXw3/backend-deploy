const request = require("supertest");
const app = require("../src/app");
const supabase = require("../src/config/supabaseClient");

describe("Usuários Endpoints", () => {
  let tokenUsuario;
  let tokenOrganizador;
  let usuarioId;
  let organizadorId;

  beforeAll(async () => {
    // Criar usuário comum
    const emailUsuario = `usuario_${Date.now()}@tixup.com`;
    const resUsuario = await request(app)
      .post("/api/auth/cadastro")
      .send({
        nome: "Usuário Teste",
        email: emailUsuario,
        senha: "senha123",
        tipo: "usuario",
      });
    tokenUsuario = resUsuario.body.data.token;
    usuarioId = resUsuario.body.data.usuario.id;

    // Criar organizador
    const emailOrg = `organizador_${Date.now()}@tixup.com`;
    const resOrg = await request(app)
      .post("/api/auth/cadastro")
      .send({
        nome: "Organizador Teste",
        email: emailOrg,
        senha: "senha123",
        tipo: "organizador",
      });
    tokenOrganizador = resOrg.body.data.token;
    organizadorId = resOrg.body.data.usuario.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await supabase.from("usuarios").delete().eq("id", usuarioId);
    await supabase.from("usuarios").delete().eq("id", organizadorId);
  });

  it("deve atualizar o próprio perfil", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}`)
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({
        nome: "Usuário Atualizado",
        datanascimento: "1990-01-01",
        telefone: "+5511999999999",
        endereco: "Rua Teste, 123",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Informações do usuário atualizadas com sucesso");
    expect(res.body.data.usuario.nome).toBe("Usuário Atualizado");
  });

  it("não deve atualizar perfil de outro usuário sem permissão", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${organizadorId}`)
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({
        nome: "Tentativa de Edição",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Você não tem permissão para editar este perfil");
  });

  it("deve permitir organizador atualizar qualquer perfil", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}`)
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Editado por Organizador",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Informações do usuário atualizadas com sucesso");
    expect(res.body.data.usuario.nome).toBe("Editado por Organizador");
  });

  it("não deve atualizar com email já existente", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}`)
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({
        email: "organizador@tixup.com", // Email que já existe
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email já está em uso");
  });

  it("não deve atualizar sem fornecer campos", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}`)
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Pelo menos um campo (nome, datanascimento, telefone, endereco, email ou imagemPerf) deve ser fornecido"
    );
  });

  it("não deve atualizar com data de nascimento inválida", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}`)
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({
        datanascimento: "2010-01-01", // Menor de 18 anos
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Usuário deve ter pelo menos 18 anos");
  });

  it("não deve atualizar com URL de imagem inválida", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}`)
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({
        imagemPerf: "url-invalida",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("O campo imagemPerf deve ser uma URL válida");
  });
}); 