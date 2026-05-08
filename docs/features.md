---
sidebar_position: 2
---

# Features

### Core Assessment Features
- ✅ **Test Management** - Create, update, and manage tests with various types.
- ✅ **Question Types** - Support for MCQ, Multiple Answer, True/False, Fill-in-Blank, Matching, Subjective, and Essay.
- ✅ **Rule-Based Tests** - Dynamic question selection based on predefined rules and criteria (Category, Difficulty, Type, Marks).
- ✅ **Test Sections** - Organize tests into logical, ordered sections.
- ✅ **Attempt Management** - Track user attempts comprehensively with detailed analytics and attempt status checks.
- ✅ **Review System** - Manual review logic for subjective and essay questions with configurable rubric support.
- ✅ **Scoring & Grading** - Automatic and manual scoring with flexible grading strategies (`first_attempt`, `last_attempt`, `average`, `highest`).

### Enterprise Features
- ✅ **Multi-tenancy** - Complete tenant and organization data isolation enforced across all endpoints.
- ✅ **Plugin System** - Powerful event-driven architecture using Joomla-like triggers for extensible functionality.
- ✅ **Database Migrations** - Custom version-controlled schema management system handling migrations, dependencies, and rollbacks.
- ✅ **Caching** - Built-in Redis-based caching to enhance retrieval performance.
- ✅ **API Documentation** - Comprehensive Swagger/OpenAPI documentation.
- ✅ **Health Checks** - Built-in service health and structural monitoring.
- ✅ **Rate Limiting** - Integrated endpoint throttling and DDoS protection (e.g., 100 requests per minute).

### Plugin Architecture Highlights
The plugin system supports progressive adoption of decoupled architectures:
- ✅ **Internal Plugins** - Fast, in-process event handling for standard functionality.
- ✅ **External Services** - Webhook-based external integrations for a distributed ecosystem.
- ✅ **Hybrid Approach** - Simultaneous use of both systems for transitioning scalability.
- ✅ **Event-Driven** - Loose coupling through standardized events (`test.created`, `attempt.submitted`, `user.registered`, etc.).
