# NexoEscolar 🏫

> Sistema de Gestão Escolar — Prova de Conceito Arquitetural  
> Stack: **Node.js · Express · Prisma · PostgreSQL · React · TypeScript**

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Provas de Conceito Implementadas](#provas-de-conceito-implementadas)
5. [Schema do Banco de Dados](#schema-do-banco-de-dados)
6. [Guia de Execução Local](#guia-de-execução-local)
7. [Fluxo de uma Requisição](#fluxo-de-uma-requisição)

---

## Visão Geral

O NexoEscolar é um sistema web para digitalização e gestão de processos escolares, com foco inicial no **módulo de frequência (chamada)**. O projeto foi estruturado sobre os princípios da **Clean Architecture**, garantindo separação clara de responsabilidades e testabilidade.

---

## Arquitetura

O backend segue a **Arquitetura Limpa** em 4 camadas concêntricas:

```
┌─────────────────────────────────────────────────────────┐
│  Camada 4 — Infrastructure                               │
│  (Express, Prisma, PostgreSQL, Roteamento)              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Camada 3 — Interfaces                            │  │
│  │  (Controllers HTTP, Middlewares JWT)              │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Camada 2 — Application                     │  │  │
│  │  │  (DTOs, Casos de Uso)                       │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  Camada 1 — Domain  ✦ NÚCLEO          │  │  │  │
│  │  │  │  (Entidades, Interfaces de Repo)       │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Regra de dependência**: as camadas internas **nunca** importam das externas. O `Domain` não sabe que o Prisma existe; sabe apenas que alguma coisa implementa `IAttendanceRepository`.

---

## Estrutura de Pastas

```
nexo-escolar/
├── backend/
│   ├── src/
│   │   ├── domain/                        # Camada 1 — Regras centrais
│   │   │   ├── entities/
│   │   │   │   └── attendance-session.ts  # ✦ PoC #1: Entidade de chamada
│   │   │   └── repositories/
│   │   │       └── attendance-repository.ts # Interface IAttendanceRepository
│   │   │
│   │   ├── application/                   # Camada 2 — Casos de uso
│   │   │   ├── dtos/
│   │   │   │   └── register-attendance.dto.ts
│   │   │   └── use-cases/
│   │   │       └── register-attendance.use-case.ts
│   │   │
│   │   ├── interfaces/                    # Camada 3 — Adaptadores HTTP
│   │   │   ├── controllers/
│   │   │   │   └── attendance.controller.ts
│   │   │   └── middlewares/
│   │   │       └── auth.middleware.ts     # JWT + RBAC
│   │   │
│   │   ├── infrastructure/                # Camada 4 — Frameworks externos
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma          # ✦ Schema PostgreSQL
│   │   │   ├── database/
│   │   │   │   ├── prisma.client.ts       # Singleton PrismaClient
│   │   │   │   └── prisma-attendance-repository.ts # ✦ PoC #2: Repo concreto
│   │   │   └── http/
│   │   │       └── router.ts              # Composição de dependências + rotas
│   │   │
│   │   └── server.ts                      # Entry point Express
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx            # Estado global de autenticação
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx             # Tela de login
│   │   │   └── AttendancePage.tsx        # Tela de chamada (Diário de Classe)
│   │   └── services/
│   │       ├── api.ts                    # Axios + interceptores JWT
│   │       ├── auth.service.ts           # Serviço de login
│   │       └── attendance.service.ts     # Serviço de frequência
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Provas de Conceito Implementadas

### PoC #1 — `AttendanceSession` (Entidade de Domínio)

**Arquivo**: [`backend/src/domain/entities/attendance-session.ts`](backend/src/domain/entities/attendance-session.ts)

Classe TypeScript pura que encapsula as regras de negócio da chamada escolar **em memória**, sem qualquer dependência de framework:

| Método | Responsabilidade |
|---|---|
| `registerStudent(enrollmentId, name, status)` | Valida a matrícula e impede duplo apontamento |
| `getBatchEntries()` | Retorna a matriz de alunos prontos para persistência |
| `totalRegistered` | Contagem dos alunos já registrados na sessão |

**Invariantes garantidas:**
- ✅ Matrícula não pode ser vazia/nula
- ✅ Mesmo aluno não pode ser registrado duas vezes na mesma aula

### PoC #2 — `PrismaAttendanceRepository` (Repositório de Persistência)

**Arquivo**: [`backend/src/infrastructure/database/prisma-attendance-repository.ts`](backend/src/infrastructure/database/prisma-attendance-repository.ts)

Implementação concreta de `IAttendanceRepository` usando **Prisma Client**:

- **`saveBatch()`**: executa N operações `upsert` em uma única `$transaction` atômica — se qualquer upsert falhar, toda a transação faz rollback
- **`findByAulaId()`**: busca todos os registros de frequência de uma aula com join nos dados do aluno
- **Idempotência**: `upsert` garante que reenvios da mesma chamada apenas atualizam o registro existente

---

## Schema do Banco de Dados

**Arquivo**: [`backend/src/infrastructure/prisma/schema.prisma`](backend/src/infrastructure/prisma/schema.prisma)

```
┌──────────┐    ┌──────────────┐    ┌────────────┐
│ Usuario  │────│   Matricula  │────│   Turma    │
│ (perfil) │    │ (aluno+turma)│    │            │
└──────────┘    └──────┬───────┘    └─────┬──────┘
     │                 │                  │
     │          ┌──────▼───────┐   ┌──────▼──────────┐
     │          │  Frequencia  │   │ TurmaDisciplina │
     │          │(aulaId+matId)│   │(turma+disc+prof)│
     │          └──────┬───────┘   └──────┬──────────┘
     │                 │                  │
     └─────────────────┤          ┌───────▼──────┐
                       └──────────│     Aula     │
                                  │(data+conteúdo│
                                  └──────────────┘
```

**Enums**: `Perfil`, `StatusMatricula`, `StatusFrequencia`

**Chave única composta em `Frequencia`**: `(aulaId, matriculaId)` — garante no banco o que a entidade `AttendanceSession` garante em memória.

---

## Guia de Execução Local

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [npm](https://www.npmjs.com/) >= 9

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPO>
cd nexo-escolar
```

### 2. Configurar o backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL e JWT_SECRET

# Gerar o cliente Prisma
npm run prisma:generate

# Executar as migrations (cria as tabelas no banco)
npm run prisma:migrate

# Iniciar em modo desenvolvimento
npm run dev
```

O servidor estará em **http://localhost:3333**

Acesse **http://localhost:3333/api/health** para verificar se está rodando.

### 3. Configurar o frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

O frontend estará em **http://localhost:5173**

---

## Fluxo de uma Requisição

Exemplo: **POST /api/attendance** (registrar chamada)

```
Cliente HTTP
    │  POST /api/attendance
    │  Authorization: Bearer <token>
    ▼
[Express router.ts]
    │  authMiddleware → verifica JWT
    │  requirePerfil('PROFESSOR') → verifica perfil
    ▼
[AttendanceController]
    │  Valida campos obrigatórios do body
    ▼
[RegisterAttendanceUseCase]
    │  Instancia AttendanceSession
    │  Chama session.registerStudent() para cada aluno
    │    └─ Lança erro se matrícula inválida ou duplo apontamento
    │  Chama attendanceRepository.saveBatch()
    ▼
[PrismaAttendanceRepository]
    │  Monta array de prisma.frequencia.upsert(...)
    │  Executa prisma.$transaction([...upserts])
    ▼
[PostgreSQL]
    │  Transação atômica confirmada
    ▼
← 201 Created { aulaId, totalRegistered, savedAt }
```
