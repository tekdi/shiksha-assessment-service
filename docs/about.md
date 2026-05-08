---
sidebar_position: 1
---

# About

The Assessment Service is a robust, scalable NestJS microservice designed for managing the entire lifecycle of tests, assessments, and forms. It supports dynamic rule-based tests, subjective questions, and features an enterprise-grade plugin architecture.

Built with NestJS, the service offers a high-performance, modular architecture that supports multi-tenancy, allowing different organizations and tenants to manage their assessments in isolation. 

## Key Capabilities

### **Comprehensive Test & Form Management**
Create and manage exams or forms with diverse structures, sections, and various question types. Supported question types include:
- **MCQ**: Standard Multiple Choice Questions.
- **Multiple Answer**: Questions allowing multiple correct selections.
- **True/False**: Simple boolean response.
- **Fill in the Blanks**: Text-based blank filling.
- **Match**: Match the following items.
- **Subjective**: Short answer questions requiring manual review.
- **Essay**: Long-form answers with rubric support.
- **Dropdown**: Select from a list of options.
- **Rating**: Star or scale-based rating (useful for surveys/forms).
- **Checkbox**: Multi-select options.
- **File Upload**: Collect file submissions (PDFs, Images, etc.) as answers.

### **Standalone Usage**
While designed as part of the Shiksha ecosystem, this service is **fully capable of operating as a standalone form or survey tool**:
- **Independent Operations**: Does not require an LMS for core test/form creation or submission collection.
- **Data Collection**: Use it to build standalone surveys, enrollment forms, or observation tools.
- **Header-Based Context**: Operates using `tenantId`, `organisationId`, and `userId` headers to maintain data isolation even in standalone mode.

### **Advanced Features**
- **Dynamic Rule-Based Tests**: Dynamic question selection based on customizable rules and criteria.
- **Enterprise Plugin Architecture**: Features triggers for extensible functionality, supporting both internal plugins and webhook-based external services.
- **Robust Scoring & Review**: Automated and manual scoring utilizing varied grading strategies and rubrics.
- **Data Isolation**: Ensures secure and isolated data for multiple tenants and organizations.
