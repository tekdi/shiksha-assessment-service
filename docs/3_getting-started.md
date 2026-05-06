---
sidebar_position: 3
---

# Getting Started

Follow these instructions to set up and run the Assessment microservice locally.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16 or higher
- **PostgreSQL**: v12 or higher
- **Redis**: v6 or higher
- **Docker**: (Optional, for containerized setup)

### Local Setup

1. **Clone the repository**

```sh
git clone https://github.com/tekdi/shiksha-assessment-service.git
```

2. **Navigate to the application directory**:
   ```bash
   cd shiksha-assessment-service
   ```

3. **Environment Configuration**:
   Copy the example environment file and update the variables:

   ```bash
   cp env.example .env
   ```

   _Edit `.env` with your local database and redis credentials._

4. **Install Dependencies**:

   ```bash
   npm install
   ```

5. **Database Initialization**:
   Ensure PostgreSQL is running and the database specified in `.env` exists. Since automatic migrations are not used in this project, please follow the **Manual Database Setup** instructions in [8_devops.md](./8_devops.md) to initialize your database schema.

6. **Start the Application**:

   ```bash
   # Development mode with hot-reload
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

### Docker Setup

For a quick setup using Docker Compose:

1. **Build and start all services**:

   ```bash
   docker-compose up --build -d
   ```

   This will start the Assessment service, PostgreSQL, and Redis in containers.

2. **Verify the installation**:
   The service should be accessible at `http://localhost:3000` (or the port specified in your `.env`).
   Access the Swagger documentation at `http://localhost:3000/api-docs`.
