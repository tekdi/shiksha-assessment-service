# 📚 Shiksha Assessment Microservice

A robust, scalable NestJS microservice for managing the entire lifecycle of tests and assessments with support for rule-based tests, subjective questions, and enterprise-grade plugin architecture.

## 🚀 Features

### **Core Assessment Features**
- ✅ **Test Management** - Create, update, and manage tests with various types
- ✅ **Question Types** - MCQ, Multiple Answer, True/False, Fill-in-Blank, Matching, Subjective, Essay
- ✅ **Rule-Based Tests** - Dynamic question selection based on rules and criteria
- ✅ **Test Sections** - Organize tests into logical sections
- ✅ **Attempt Management** - Track user attempts with detailed analytics
- ✅ **Review System** - Manual review for subjective questions with rubric support
- ✅ **Scoring & Grading** - Automatic and manual scoring with flexible grading strategies

### **Enterprise Features**
- ✅ **Multi-tenancy** - Complete tenant and organization isolation
- ✅ **Plugin System** - Joomla-like triggers for extensible functionality
- ✅ **Database Migrations** - Version-controlled schema management
- ✅ **Caching** - Redis-based caching for performance
- ✅ **API Documentation** - Swagger/OpenAPI documentation
- ✅ **Health Checks** - Comprehensive health monitoring
- ✅ **Rate Limiting** - Built-in throttling and protection

### **Plugin Architecture**
- ✅ **Internal Plugins** - Fast, in-process event handling
- ✅ **External Services** - Webhook-based external integrations
- ✅ **Hybrid Approach** - Best of both worlds for scalability
- ✅ **Event-Driven** - Loose coupling through standardized events

## 🏗️ Architecture

### **Technology Stack**
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Migration**: Custom migration system

### **Database Schema**
```
tests (1) ←→ (N) testSections
tests (1) ←→ (N) testQuestions
testSections (1) ←→ (N) testQuestions
testRules (1) ←→ (N) testQuestions (via ruleId)
testAttempts (1) ←→ (1) tests (generated) (via resolvedTestId)
testUserAnswers (N) ←→ (1) testAttempts
questions (1) ←→ (N) questionOptions
```

## 📦 Installation

### **Prerequisites**
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)

### **Setup**
```bash
# Clone the repository
git clone https://github.com/vaivk369/shiksha-assessment-service.git
cd shiksha-assessment-service

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Configure environment variables
# Edit .env file with your database and Redis settings

# Run database migrations
npm run migration:run

# Start the application
npm run start:dev
```

### **Environment Variables**
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=assessment_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
PORT=3000
NODE_ENV=development

# Plugin Configuration
USE_INTERNAL_PLUGINS=true
USE_EXTERNAL_SERVICES=false
USE_HYBRID_PLUGINS=false
```

## 🔌 Plugin System

### **Overview**
The assessment service includes a powerful plugin system that supports both internal plugins (for development) and external services (for production scalability).

### **Plugin Types**

#### **1. Internal Plugins** (Phase 1)
```typescript
export class NotificationPlugin implements Plugin {
  id = 'notification-plugin';
  name = 'Notification Plugin';
  type: 'internal' = 'internal';
  isActive = true;
  
  hooks: PluginHook[] = [
    {
      name: 'attempt.submitted',
      priority: 100,
      handler: async (event) => {
        await this.sendEmail(event.data);
      }
    }
  ];
}
```

#### **2. External Services** (Phase 2)
```typescript
export class WebhookPlugin implements Plugin {
  id = 'webhook-plugin';
  name = 'Webhook Plugin';
  type: 'external' = 'external';
  isActive = true;
  hooks = [];
  
  externalService = {
    type: 'webhook',
    webhook: {
      url: 'https://api.external.com/webhooks',
      method: 'POST',
      headers: { 'Authorization': 'Bearer API_KEY' },
      timeout: 10000,
      retries: 3,
      events: ['attempt.submitted']
    }
  };
}
```

### **Available Events**
- **Test Events**: `test.created`, `test.updated`, `test.deleted`, `test.published`
- **Question Events**: `question.created`, `question.updated`, `question.deleted`
- **Attempt Events**: `attempt.started`, `attempt.submitted`, `attempt.reviewed`
- **Answer Events**: `answer.submitted`
- **Rule Events**: `rule.created`, `rule.updated`, `rule.deleted`
- **User Events**: `user.registered`, `user.login`, `user.logout`
- **System Events**: `system.startup`, `system.shutdown`, `error.occurred`

### **Plugin Configuration**
```typescript
// Register plugins based on environment
await PluginConfiguration.registerPlugins(pluginManager);

// Environment variables control the approach:
// NODE_ENV=development          → Internal plugins
// NODE_ENV=production           → External services  
// USE_HYBRID_PLUGINS=true       → Both internal and external
```

## 📊 API Endpoints

### **Tests**
```
GET    /tests                    # List tests with filtering
POST   /tests                    # Create new test
GET    /tests/:id                # Get test details
PUT    /tests/:id                # Update test
DELETE /tests/:id                # Delete test
POST   /tests/:id/publish        # Publish test
POST   /tests/:id/unpublish      # Unpublish test
```

### **Questions**
```
GET    /questions                # List questions with filtering
POST   /questions                # Create new question
GET    /questions/:id            # Get question details
PUT    /questions/:id            # Update question
DELETE /questions/:id            # Delete question
```

### **Attempts**
```
POST   /attempts/:testId/start   # Start test attempt
GET    /attempts/:id/questions   # Get attempt questions
POST   /attempts/:id/answers     # Submit answer
POST   /attempts/:id/submit      # Submit attempt
GET    /attempts/:id/result      # Get attempt result
```

### **Rules**
```
GET    /rules                    # List rules
POST   /rules                    # Create new rule
GET    /rules/:id                # Get rule details
PUT    /rules/:id                # Update rule
DELETE /rules/:id                # Delete rule
```

### **Sections**
```
GET    /sections                 # List sections
POST   /sections                 # Create new section
GET    /sections/:id             # Get section details
PUT    /sections/:id             # Update section
DELETE /sections/:id             # Delete section
```

### **Review**
```
GET    /reviews/pending          # Get pending reviews
POST   /reviews/:attemptId       # Review attempt
```

## 🎯 Question Types & Grading Types

### **Supported Question Types**
1. **MCQ** - Single choice with auto-scoring
2. **Multiple Answer** - Multiple choice with partial scoring
3. **True/False** - Auto-scored
4. **Fill-in-Blank** - Auto-scored with case sensitivity
5. **Matching** - Auto-scored
6. **Subjective** - Manual review with rubric-based scoring
7. **Essay** - Manual review with comprehensive rubric

### **Supported Grading Types**
1. **QUIZ** - Auto-scored objective questions (MCQ, True/False, etc.)
2. **ASSIGNMENT** - Manually reviewed subjective questions (Essay, Subjective)
3. **FEEDBACK** - Unscored feedback tests (all questions in the test are treated as feedback, not included in final score)

### **Answer Format (JSON)**
```json
{
  "selectedOptionIds": ["opt-1"],           // MCQ/True-False
  "selectedOptionIds": ["opt-1", "opt-3"],  // Multiple Answer
  "text": "Answer text...",                 // Subjective/Essay/Feedback
  "blanks": ["answer1", "answer2"],         // Fill-in-Blank
  "matches": ["A-1", "B-3"]                 // Matching
}
```

### **FEEDBACK Test Behavior**
- When a test has `gradingType: 'feedback'`, all questions in that test are treated as feedback questions
- Feedback questions are validated for response length but are not scored
- Attempts on feedback tests have `score: null` and `result: 'FEEDBACK'`
- Feedback responses are stored but do not contribute to the final grade

## 🔄 Rule-Based Tests

### **Workflow**
1. **Create Test** with type 'rule_based'
2. **Create Rules** with criteria and selection strategies
3. **Add Questions** to testQuestions table with ruleId
4. **User Attempt** triggers question generation
5. **System Creates** generated test with selected questions
6. **Attempt Links** to generated test via resolvedTestId

### **Rule Types**
- **Category-based** - Select questions by category
- **Difficulty-based** - Select questions by difficulty level
- **Type-based** - Select questions by question type
- **Marks-based** - Select questions by marks range

### **Selection Strategies**
- **Random** - Random selection from available questions
- **Sequential** - First N questions in order
- **Weighted** - Selection based on question weights/difficulty

## 🛠️ Database Migrations

### **Migration System**
```typescript
// Run pending migrations
const result = await migrationService.runMigrations(migrations);

// Rollback migrations
const rollbackResult = await migrationService.rollbackMigrations(2);

// Get migration status
const status = await migrationService.getMigrationStatus();
```

### **Migration Features**
- ✅ **Version Tracking** - Records executed migrations in database
- ✅ **Dependency Resolution** - Handles migration dependencies
- ✅ **Rollback Support** - Can undo migrations in reverse order
- ✅ **Error Recovery** - Continues from failed migrations
- ✅ **Performance Monitoring** - Tracks execution time

## 🧪 Testing

### **Run Tests**
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### **Test Structure**
```
test/
├── unit/                    # Unit tests
├── integration/             # Integration tests
└── e2e/                     # End-to-end tests
```

## 📚 Documentation

### **API Documentation**
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI Spec**: `http://localhost:3000/api-json`

### **Database Design**
- **Schema Documentation**: `docs/db-design.md`
- **Service PRD**: `docs/service-prd.md`
- **Learner Flow**: `docs/learner_flow.md`

### **Plugin System**
- **Plugin Documentation**: `PLUGIN_SYSTEM_README.md`
- **Configuration Examples**: `src/modules/plugins/plugin-config.example.ts`

## 🚀 Deployment

### **Development**
```bash
npm run start:dev
```

### **Production**
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### **Docker**
```bash
# Build Docker image
docker build -t assessment-service .

# Run container
docker run -p 3000:3000 assessment-service
```

### **Environment Configuration**
```bash
# Development
NODE_ENV=development
USE_INTERNAL_PLUGINS=true

# Production
NODE_ENV=production
USE_EXTERNAL_SERVICES=true

# Hybrid
USE_HYBRID_PLUGINS=true
```

## 🔧 Configuration

### **Database Configuration**
```typescript
// src/config/database.config.ts
export class DatabaseConfig implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Use migrations in production
      logging: process.env.NODE_ENV === 'development',
    };
  }
}
```

### **Redis Configuration**
```typescript
// src/config/redis.config.ts
export class RedisConfig implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      ttl: 60 * 60 * 24, // 24 hours
    };
  }
}
```

## 📊 Monitoring

### **Health Checks**
```
GET /health                    # Basic health check
GET /health/detailed          # Detailed health information
```

### **Plugin Statistics**
```typescript
const stats = PluginConfiguration.getPluginStats(pluginManager);
// Returns: totalPlugins, totalHooks, externalServices, registeredEvents, activePlugins
```

### **Migration Status**
```typescript
const status = await migrationService.getMigrationStatus();
// Returns: total, executed, pending, failed
```

## 🔒 Security

### **Multi-tenancy**
- All data is isolated by `tenantId` and `organisationId`
- No cross-tenant data access
- Tenant-specific caching

### **Rate Limiting**
- Built-in throttling (100 requests per minute)
- Configurable limits per endpoint
- IP-based rate limiting

### **Input Validation**
- DTO-based validation with class-validator
- Type-safe request handling
- SQL injection protection via TypeORM

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### **Code Style**
```bash
# Format code
npm run format

# Lint code
npm run lint
```

### **Commit Convention**
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: code style changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

### **Issues**
- Report bugs: [GitHub Issues](https://github.com/vaivk369/shiksha-assessment-service/issues)
- Feature requests: [GitHub Discussions](https://github.com/vaivk369/shiksha-assessment-service/discussions)

### **Documentation**
- [API Documentation](http://localhost:3000/api-docs)
- [Database Design](docs/db-design.md)
- [Plugin System](PLUGIN_SYSTEM_README.md)

### **Community**
- Join our [Discord Server](https://discord.gg/shiksha)
- Follow us on [Twitter](https://twitter.com/shiksha_edu)

---

**Built with ❤️ by the Shiksha Team**

*Empowering education through technology*
