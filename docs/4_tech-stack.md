---
sidebar_position: 4
---

# Tech Stack

The Assessment service is built using a modern, scalable technology stack designed for reliability, performance, and modularity.

### Backend Framework
- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **TypeScript**: Used throughout the project for static typing, robust interfaces, and enhanced developer productivity.

### Database & Storage
- **PostgreSQL**: The primary relational database for storing tests, questions, user attempts, and reviews.
- **TypeORM**: Object-Relational Mapper (ORM) used for database interactions and rigorous migration management.
- **Redis**: Used for high-performance caching of tests and robust attempt tracking.

### Security & Validations
- **Class-Validator**: Integrated with NestJS DTOs for strict input validation before business logic processing.
- **Multi-tenancy Headers**: Strict enforcement of `tenantId` and `organisationId` validation at controller levels.

### Documentation & API
- **Swagger/OpenAPI**: Automated interactive API documentation integrated closely with NestJS.

### DevOps & Infrastructure
- **Docker**: Containerization for consistent development and deployment environments.
- **Docker Compose**: Orchestration for local multi-service environments (app, database, cache).
