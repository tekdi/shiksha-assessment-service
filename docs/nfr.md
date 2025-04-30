
# 📘 Assessment Service – NestJS Microservice Specification

This document outlines the complete technical specification for generating a fully functional **NestJS microservice** named `assessment-service`.

## 📁 Input Resources

- `db-design.md`
- `service-prd.md`
- `swagger.yaml`

---

## 🎯 Objective

Generate a production-ready **NestJS microservice** that is downloadable as a `.zip`, fully documented, containerized, and compliant with modern architectural standards.

---

## 📦 Project Structure

```
assessment-service/
├── src/
│   ├── [module]/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── [module].controller.ts
│   │   ├── [module].service.ts
│   │   ├── [module].module.ts
│   ├── app.module.ts
│   └── main.ts
├── migrations/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **ORM**: TypeORM
- **Languages**: TypeScript
- **Caching**: Redis via `@nestjs/cache-manager`
- **Docs**: Swagger (`@nestjs/swagger`)
- **Testing**: Jest

---

## 🔧 Dependencies

```bash
@nestjs/common
@nestjs/core
@nestjs/config
@nestjs/typeorm
@nestjs/swagger
@nestjs/mapped-types
@nestjs/cache-manager
class-validator
class-transformer
dotenv
pg
uuid
cache-manager-ioredis
```

---

## 📄 Environment Variables (`.env.example`)

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=assessment_db
DB_USER=postgres
DB_PASS=postgres
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CACHE_TTL=60
```

---

## 🧱 Modules – Structure & Relations

Each module must follow this structure:

```
src/[module]/
├── dto/
│   ├── create-[module].dto.ts
│   └── update-[module].dto.ts
├── entities/
│   └── [module].entity.ts
├── [module].controller.ts
├── [module].service.ts
└── [module].module.ts
```

Use TypeORM decorators:
- `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn()`
- Relationships: `@OneToMany()`, `@ManyToOne()`, `@JoinColumn()`

---

## 🛠️ Core Features

### ✅ CRUD Functionality

- **Create**:
  - Validate required fields and relations
  - Enforce unique constraints

- **Read (Find)**:
  - Support search, filter, sort, paginate
  - Exclude `status = 'archived'`

- **Update**:
  - Validate `id` and `tenantId`
  - Update only changed fields
  - Set `updated_by`

- **Archive/Delete**:
  - Do not physically delete
  - Mark `status = 'archived'`
  - Update `updated_by`
  - Ensure archived records are excluded from queries

---

## 🔐 Tenant Handling

- Extract `tenantId` from JWT authorization token
- Verify `tenantId` on update/delete to enforce multi-tenancy

---

## 🧠 Caching Strategy

- Use Redis for caching listing endpoints
- Invalidate cache on updates and deletions
- Respect `CACHE_TTL` from `.env`

---

## 📚 Swagger API Documentation

- Available at: `GET /api/docs`
- Include:
  - DTO schemas
  - Parameters
  - Responses

---

## 🧪 Testing

- Use Jest
- Write unit tests for:
  - Controllers
  - Services
- Structure:
  - `*.spec.ts` files
  - Mock DB/services as needed

---

## 🐳 Docker Support

- **Dockerfile** for Node.js microservice
- **docker-compose.yml** to include:
  - PostgreSQL
  - Redis (optional)

---

## ⚠️ Global Error Handling

Use centralized `ExceptionFilter`:
- `BadRequestException`
- `NotFoundException`
- `InternalServerErrorException`
- Validation errors

## Common Response Structure

All API responses follow this general structure:

```json
{
  "id": "api.question.create",        // API ID
  "ver": "1.0",         // API version
  "ts": "2024-03-20T00:00:00Z", // Timestamp
  "params": {
    "resmsgid": "uuid",  // Response message ID
    "status": "successful", // 'successful' or 'failed'
    "err": null,         // Error code (if any)
    "errmsg": null,      // Error message (if any)
    "successmessage": "string" // Success message (if any)
  },
  "responseCode": number, // HTTP status code
  "result": object | array // Response data
}
```

## Common Consts Structure
 use common consts classes each UPLOAD_PATHS, RESPONSE_MESSAGES, API_IDS, CONFIGS and more wherever required.


---

## 📦 Downloadable Package

- Bundle all files into a `.zip`
- Ready for deployment after `.env` setup

---

## ➕ Optional Enhancements

- **Health Check Endpoint**: `/health` with DB and Redis checks
- **Rate Limiting**: via `@nestjs/throttler`

---

## ✅ Output

- ✅ Fully working microservice as per documentations
- ✅ Ready-to-run Docker + PostgreSQL setup
- ✅ Downloadable `.zip` package
- ✅ Swagger API documentation
- ✅ Unit-tested with example test cases

---
