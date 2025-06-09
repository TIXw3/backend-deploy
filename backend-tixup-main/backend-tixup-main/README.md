O TixUp Backend é a API REST desenvolvida com Node.js e Express, responsável por gerenciar a autenticação, cadastro de usuários, criação e gerenciamento de eventos e ingressos. O projeto utiliza PostgreSQL (via Supabase ou Docker) como banco de dados e implementa autenticação segura com JWT e Firebase Authentication.

Funcionalidades:
- Autenticação de usuários via Google OAuth, Apple e Email/Senha.
- Gerenciamento de usuários, eventos e ingressos.
- API estruturada com controllers, services, models e routes.
- Middleware global para logs de requisições.
- Variáveis de ambiente configuradas para maior segurança.


NÃO COPIE DIRETAMENTE, ABRA O EDIT DESSE README E AI SIM COPIE

O cors(backend) no app.js está configurado pra rodar localmente(somente nessa branch)
para o deploy apenas deixe o cors default

e api.ts do front deve estar no padrão abaixo para rodar localmente junto com o Backend

import axios from "axios";

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tixup_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

para roda no deploy api.ts deve estar assim:

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tixup_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
