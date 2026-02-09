# 🎮 Project Loldle API (NestJS)

> Uma plataforma de jogos de adivinhação estilo "Termo" e "Loldle", construída com arquitetura modular, escalável e focada em performance.

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

## 📖 Sobre o Projeto

Este projeto é o Backend (API) de um jogo de adivinhação multitemático. Embora o foco inicial seja **League of Legends** (adivinhar campeões baseados em atributos), a arquitetura foi desenhada para ser agnóstica a temas, suportando jogos como Valorant, Pokémon ou Capitais do Mundo.

O sistema conta com modos de jogo solo, desafios diários globais sincronizados e um sistema complexo de **Salas Privadas (Social)**, onde amigos podem competir entre si com desafios sincronizados exclusivos daquela sala.

## 🚀 Funcionalidades Principais

### 🧠 Core & Engine

- **Motor de Comparação Lógico:** Algoritmo capaz de comparar atributos complexos (Ex: Mana vs Energy, Ano 2010 vs 2012) retornando status (Correto, Parcial, Incorreto) e direção (Cima/Baixo para números).
- **Suporte Multi-Tema:** CMS Headless interno onde novos temas e entidades podem ser cadastrados dinamicamente via API.

### 🎮 Gameplay

- **Desafio Diário Global:** Um CronJob (ou gatilho lógico) define uma palavra secreta por dia. Todos os usuários jogam a mesma palavra.
- **Modo Infinito:** Jogue quantas vezes quiser com palavras aleatórias.
- **Persistência de Sessão:** O progresso é salvo no banco. Se o usuário fechar o navegador, ao voltar, o jogo continua exatamente de onde parou.

### 👥 Social & Multiplayer (Salas)

- **Salas Privadas:** Criação de salas com códigos curtos (ex: `X7Z9`).
- **Sincronização de Desafio:** A sala possui seu próprio "Seed" diário. Todos os membros da sala jogam a mesma palavra secreta naquele dia, diferente do desafio global.
- **Ranking da Sala:** Leaderboard específico filtrando apenas as vitórias dentro daquele grupo de amigos.

### 🏆 Competição

- **Ranking Global:** Aggregation Pipelines otimizados no MongoDB para listar os Top 100 jogadores.
- **Sistema de Pontuação:** Pontos baseados em número de tentativas e vitórias.

### 🛡️ Segurança

- **Autenticação:** JWT (JSON Web Token) com Passport Strategy.
- **Validação:** DTOs rigorosos com `class-validator` e `class-transformer`.
- **Environment:** Validação estrita de variáveis de ambiente antes do boot da aplicação.

## 🏗️ Arquitetura

O projeto segue uma arquitetura modular baseada em **Vertical Slices** (Fatias Verticais), garantindo baixo acoplamento e alta coesão.

| Módulo          | Responsabilidade                                                                    |
| :-------------- | :---------------------------------------------------------------------------------- |
| **Auth**        | Login, Registro, Hashing de Senha e Geração de JWT.                                 |
| **Content**     | Gerenciamento de Temas (Schemas) e Entidades (Personagens).                         |
| **Game Core**   | A "Lógica Pura". Recebe Chute + Alvo e retorna o feedback (Verde/Amarelo/Vermelho). |
| **Gameplay**    | Gerencia Sessões, Estado do Jogo (Playing/Won) e Histórico de tentativas.           |
| **Rooms**       | Gestão de grupos, códigos de convite e desafios locais.                             |
| **Leaderboard** | Agregações de dados para rankings Globais e Locais.                                 |

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js (v18+)
- MongoDB (Local ou Atlas)

### Passo a Passo

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/DiegoAndreLeffa/gametermo-api
   cd gametermo-api

Instale as dependências:

code
Bash
download
content_copy
expand_less
npm install

Configure as Variáveis de Ambiente:
Crie um arquivo .env na raiz baseado no exemplo abaixo:

code
Env
download
content_copy
expand_less
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/loldle_dev
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRATION=1d

Execute o projeto:

code
Bash
download
content_copy
expand_less

## Modo de Desenvolvimento (Watch Mode)

npm run start:dev
📡 Documentação da API (Principais Rotas)
Auth

POST /auth/register - Criar nova conta.

POST /auth/login - Receber Token JWT.

Content

POST /content/themes - Criar novo tema (Admin).

POST /content/entities - Criar novo personagem.

Gameplay

POST /gameplay/daily/:theme/start - Iniciar/Continuar Desafio Diário.

POST /gameplay/room/:code/start - Iniciar/Continuar Desafio da Sala.

POST /gameplay/:sessionId/guess - Enviar um chute.

Rooms

POST /rooms - Criar uma sala.

POST /rooms/join - Entrar em uma sala via código.

Leaderboard

GET /leaderboard/global - Ranking mundial.

GET /leaderboard/room/:id - Ranking interno da sala.

🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

Fork o projeto.

Crie uma Branch (git checkout -b feature/NovaFeature).

Commit suas mudanças (git commit -m 'Add some NovaFeature').

Push para a Branch (git push origin feature/NovaFeature).

Abra um Pull Request.

📝 Licença

Este projeto está sob a licença MIT.
