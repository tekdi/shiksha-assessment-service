/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/app.module.ts":
/*!***************************!*\
  !*** ./src/app.module.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const cache_manager_1 = __webpack_require__(/*! @nestjs/cache-manager */ "@nestjs/cache-manager");
const throttler_1 = __webpack_require__(/*! @nestjs/throttler */ "@nestjs/throttler");
const event_emitter_1 = __webpack_require__(/*! @nestjs/event-emitter */ "@nestjs/event-emitter");
const health_module_1 = __webpack_require__(/*! ./modules/health/health.module */ "./src/modules/health/health.module.ts");
const tests_module_1 = __webpack_require__(/*! ./modules/tests/tests.module */ "./src/modules/tests/tests.module.ts");
const questions_module_1 = __webpack_require__(/*! ./modules/questions/questions.module */ "./src/modules/questions/questions.module.ts");
const attempts_module_1 = __webpack_require__(/*! ./modules/attempts/attempts.module */ "./src/modules/attempts/attempts.module.ts");
const auth_module_1 = __webpack_require__(/*! ./modules/auth/auth.module */ "./src/modules/auth/auth.module.ts");
const plugin_module_1 = __webpack_require__(/*! ./modules/plugins/plugin.module */ "./src/modules/plugins/plugin.module.ts");
const database_config_1 = __webpack_require__(/*! ./config/database.config */ "./src/config/database.config.ts");
const redis_config_1 = __webpack_require__(/*! ./config/redis.config */ "./src/config/redis.config.ts");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useClass: database_config_1.DatabaseConfig,
            }),
            cache_manager_1.CacheModule.registerAsync({
                useClass: redis_config_1.RedisConfig,
                isGlobal: true,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            event_emitter_1.EventEmitterModule.forRoot({
                global: true,
            }),
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            tests_module_1.TestsModule,
            questions_module_1.QuestionsModule,
            attempts_module_1.AttemptsModule,
            plugin_module_1.PluginModule,
        ],
    })
], AppModule);


/***/ }),

/***/ "./src/common/dto/api-response.dto.ts":
/*!********************************************!*\
  !*** ./src/common/dto/api-response.dto.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ResponseCodes = exports.ErrorTypes = exports.ApiResponseBuilder = exports.ApiErrorResponseDto = exports.ApiSuccessResponseDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
class ApiSuccessResponseDto {
}
exports.ApiSuccessResponseDto = ApiSuccessResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'api.test.create' }),
    __metadata("design:type", String)
], ApiSuccessResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1.0' }),
    __metadata("design:type", String)
], ApiSuccessResponseDto.prototype, "ver", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-11-02T10:33:23.321Z' }),
    __metadata("design:type", String)
], ApiSuccessResponseDto.prototype, "ts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            resmsgid: '3fc21690-796b-11ee-aa52-8d96a90bc246',
            msgid: '8f37305d-3a21-4494-86ce-04af5b7f2eb3',
            status: 'successful',
            err: null,
            errmsg: null,
        },
    }),
    __metadata("design:type", Object)
], ApiSuccessResponseDto.prototype, "params", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'OK' }),
    __metadata("design:type", String)
], ApiSuccessResponseDto.prototype, "responseCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ApiSuccessResponseDto.prototype, "result", void 0);
class ApiErrorResponseDto {
}
exports.ApiErrorResponseDto = ApiErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'api.test.create' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1.0' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "ver", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-11-02T10:33:23.321Z' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "ts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            resmsgid: '3fc21690-796b-11ee-aa52-8d96a90bc246',
            msgid: '8f37305d-3a21-4494-86ce-04af5b7f2eb3',
            status: 'failed',
            err: 'VALIDATION_ERROR',
            errmsg: 'Invalid input parameters',
        },
    }),
    __metadata("design:type", Object)
], ApiErrorResponseDto.prototype, "params", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CLIENT_ERROR' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "responseCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: null }),
    __metadata("design:type", void 0)
], ApiErrorResponseDto.prototype, "result", void 0);
class ApiResponseBuilder {
    static success(id, result, msgid, resmsgid) {
        return {
            id,
            ver: '1.0',
            ts: new Date().toISOString(),
            params: {
                resmsgid: resmsgid || this.generateId(),
                msgid: msgid || this.generateId(),
                status: 'successful',
                err: null,
                errmsg: null,
            },
            responseCode: 'OK',
            result,
        };
    }
    static error(id, error, errorMessage, responseCode = 'CLIENT_ERROR', msgid, resmsgid) {
        return {
            id,
            ver: '1.0',
            ts: new Date().toISOString(),
            params: {
                resmsgid: resmsgid || this.generateId(),
                msgid: msgid || this.generateId(),
                status: 'failed',
                err: error,
                errmsg: errorMessage,
            },
            responseCode,
            result: null,
        };
    }
    static generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
exports.ApiResponseBuilder = ApiResponseBuilder;
var ErrorTypes;
(function (ErrorTypes) {
    ErrorTypes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorTypes["NOT_FOUND"] = "NOT_FOUND";
    ErrorTypes["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorTypes["FORBIDDEN"] = "FORBIDDEN";
    ErrorTypes["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorTypes["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorTypes["CONFLICT"] = "CONFLICT";
})(ErrorTypes || (exports.ErrorTypes = ErrorTypes = {}));
var ResponseCodes;
(function (ResponseCodes) {
    ResponseCodes["OK"] = "OK";
    ResponseCodes["CREATED"] = "CREATED";
    ResponseCodes["CLIENT_ERROR"] = "CLIENT_ERROR";
    ResponseCodes["SERVER_ERROR"] = "SERVER_ERROR";
    ResponseCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
    ResponseCodes["FORBIDDEN"] = "FORBIDDEN";
    ResponseCodes["NOT_FOUND"] = "NOT_FOUND";
    ResponseCodes["CONFLICT"] = "CONFLICT";
})(ResponseCodes || (exports.ResponseCodes = ResponseCodes = {}));


/***/ }),

/***/ "./src/common/dto/base.dto.ts":
/*!************************************!*\
  !*** ./src/common/dto/base.dto.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaginatedResponseDto = exports.PaginationDto = exports.BaseResponseDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class BaseResponseDto {
}
exports.BaseResponseDto = BaseResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "ver", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "ts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], BaseResponseDto.prototype, "params", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "responseCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], BaseResponseDto.prototype, "result", void 0);
class PaginationDto {
    constructor() {
        this.limit = 10;
        this.offset = 0;
        this.sortOrder = 'DESC';
    }
}
exports.PaginationDto = PaginationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "offset", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], PaginationDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortOrder", void 0);
class PaginatedResponseDto {
}
exports.PaginatedResponseDto = PaginatedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], PaginatedResponseDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedResponseDto.prototype, "totalElements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedResponseDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedResponseDto.prototype, "size", void 0);


/***/ }),

/***/ "./src/common/filters/api-exception.filter.ts":
/*!****************************************************!*\
  !*** ./src/common/filters/api-exception.filter.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ApiExceptionFilter = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const api_response_dto_1 = __webpack_require__(/*! ../dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
let ApiExceptionFilter = class ApiExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorType = api_response_dto_1.ErrorTypes.INTERNAL_ERROR;
        let errorMessage = 'Internal server error';
        let responseCode = api_response_dto_1.ResponseCodes.SERVER_ERROR;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            switch (status) {
                case common_1.HttpStatus.BAD_REQUEST:
                    errorType = api_response_dto_1.ErrorTypes.VALIDATION_ERROR;
                    responseCode = api_response_dto_1.ResponseCodes.CLIENT_ERROR;
                    break;
                case common_1.HttpStatus.UNAUTHORIZED:
                    errorType = api_response_dto_1.ErrorTypes.UNAUTHORIZED;
                    responseCode = api_response_dto_1.ResponseCodes.UNAUTHORIZED;
                    break;
                case common_1.HttpStatus.FORBIDDEN:
                    errorType = api_response_dto_1.ErrorTypes.FORBIDDEN;
                    responseCode = api_response_dto_1.ResponseCodes.FORBIDDEN;
                    break;
                case common_1.HttpStatus.NOT_FOUND:
                    errorType = api_response_dto_1.ErrorTypes.NOT_FOUND;
                    responseCode = api_response_dto_1.ResponseCodes.NOT_FOUND;
                    break;
                case common_1.HttpStatus.CONFLICT:
                    errorType = api_response_dto_1.ErrorTypes.CONFLICT;
                    responseCode = api_response_dto_1.ResponseCodes.CONFLICT;
                    break;
                default:
                    errorType = api_response_dto_1.ErrorTypes.BAD_REQUEST;
                    responseCode = api_response_dto_1.ResponseCodes.CLIENT_ERROR;
            }
            if (typeof exceptionResponse === 'string') {
                errorMessage = exceptionResponse;
            }
            else if (exceptionResponse.message) {
                errorMessage = Array.isArray(exceptionResponse.message)
                    ? exceptionResponse.message.join(', ')
                    : exceptionResponse.message;
            }
            else if (exceptionResponse.error) {
                errorMessage = exceptionResponse.error;
            }
        }
        else if (exception instanceof Error) {
            errorMessage = exception.message;
        }
        const apiId = this.generateApiId(request.path, request.method);
        const errorResponse = api_response_dto_1.ApiResponseBuilder.error(apiId, errorType, errorMessage, responseCode);
        response.status(status).json(errorResponse);
    }
    generateApiId(path, method) {
        const pathParts = path
            .replace('/assessment/v1/', '')
            .split('/')
            .filter(part => part.length > 0);
        if (pathParts.length === 0)
            return 'api.unknown';
        const resource = pathParts[0];
        const action = this.getActionFromMethod(method);
        return `api.${resource}.${action}`;
    }
    getActionFromMethod(method) {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'get';
            case 'POST':
                return 'create';
            case 'PUT':
            case 'PATCH':
                return 'update';
            case 'DELETE':
                return 'delete';
            default:
                return 'unknown';
        }
    }
};
exports.ApiExceptionFilter = ApiExceptionFilter;
exports.ApiExceptionFilter = ApiExceptionFilter = __decorate([
    (0, common_1.Catch)()
], ApiExceptionFilter);


/***/ }),

/***/ "./src/common/interceptors/api-response.interceptor.ts":
/*!*************************************************************!*\
  !*** ./src/common/interceptors/api-response.interceptor.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ApiResponseInterceptor = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const operators_1 = __webpack_require__(/*! rxjs/operators */ "rxjs/operators");
const api_response_dto_1 = __webpack_require__(/*! ../dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
let ApiResponseInterceptor = class ApiResponseInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, operators_1.map)(data => {
            if (data && typeof data === 'object' && 'id' in data && 'ver' in data) {
                return data;
            }
            const apiId = this.generateApiId(request.path, request.method);
            return api_response_dto_1.ApiResponseBuilder.success(apiId, data);
        }));
    }
    generateApiId(path, method) {
        const pathParts = path
            .replace('/assessment/v1/', '')
            .split('/')
            .filter(part => part.length > 0);
        if (pathParts.length === 0)
            return 'api.unknown';
        const resource = pathParts[0];
        const action = this.getActionFromMethod(method);
        return `api.${resource}.${action}`;
    }
    getActionFromMethod(method) {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'list';
            case 'POST':
                return 'create';
            case 'PUT':
            case 'PATCH':
                return 'update';
            case 'DELETE':
                return 'delete';
            default:
                return 'unknown';
        }
    }
};
exports.ApiResponseInterceptor = ApiResponseInterceptor;
exports.ApiResponseInterceptor = ApiResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], ApiResponseInterceptor);


/***/ }),

/***/ "./src/common/interceptors/auth-context.interceptor.ts":
/*!*************************************************************!*\
  !*** ./src/common/interceptors/auth-context.interceptor.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthContextInterceptor = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let AuthContextInterceptor = class AuthContextInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const tenantId = request.headers['tenantid'] || request.headers['tenant-id'] || request.headers['tenantId'];
        const organisationId = request.headers['organisationid'] || request.headers['organisation-id'] || request.headers['organisationId'];
        const userId = request.headers['userid'] || request.headers['user-id'] || request.headers['userId'] || 'system';
        if (!tenantId) {
            throw new common_1.BadRequestException('tenantId header is required');
        }
        if (!organisationId) {
            throw new common_1.BadRequestException('organisationId header is required');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            throw new common_1.BadRequestException('tenantId must be a valid UUID format');
        }
        if (!uuidRegex.test(organisationId)) {
            throw new common_1.BadRequestException('organisationId must be a valid UUID format');
        }
        if (userId !== 'system' && !uuidRegex.test(userId)) {
            throw new common_1.BadRequestException('userId must be a valid UUID format');
        }
        const authContext = {
            userId,
            tenantId,
            organisationId,
        };
        request.user = authContext;
        return next.handle();
    }
};
exports.AuthContextInterceptor = AuthContextInterceptor;
exports.AuthContextInterceptor = AuthContextInterceptor = __decorate([
    (0, common_1.Injectable)()
], AuthContextInterceptor);


/***/ }),

/***/ "./src/common/services/plugin-manager.service.ts":
/*!*******************************************************!*\
  !*** ./src/common/services/plugin-manager.service.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PluginManagerService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PluginManagerService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const axios_1 = __webpack_require__(/*! axios */ "axios");
let PluginManagerService = PluginManagerService_1 = class PluginManagerService {
    constructor() {
        this.logger = new common_1.Logger(PluginManagerService_1.name);
        this.plugins = new Map();
        this.hooks = new Map();
        this.externalServices = new Map();
    }
    registerPlugin(plugin) {
        this.logger.log(`Registering plugin: ${plugin.name} (${plugin.id})`);
        if (this.plugins.has(plugin.id)) {
            this.logger.warn(`Plugin ${plugin.id} is already registered. Overwriting...`);
        }
        if (!plugin.type) {
            plugin.type = 'internal';
        }
        this.plugins.set(plugin.id, plugin);
        if (plugin.type === 'internal') {
            for (const hook of plugin.hooks) {
                if (!this.hooks.has(hook.name)) {
                    this.hooks.set(hook.name, []);
                }
                const hooks = this.hooks.get(hook.name);
                hooks.push(hook);
                hooks.sort((a, b) => b.priority - a.priority);
            }
        }
        if (plugin.externalService) {
            this.registerExternalService(plugin.externalService);
        }
        this.logger.log(`Plugin ${plugin.name} registered with ${plugin.hooks.length} hooks`);
    }
    unregisterPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            this.logger.warn(`Plugin ${pluginId} not found for unregistration`);
            return;
        }
        this.logger.log(`Unregistering plugin: ${plugin.name} (${pluginId})`);
        if (plugin.type === 'internal') {
            for (const hook of plugin.hooks) {
                const hooks = this.hooks.get(hook.name);
                if (hooks) {
                    const index = hooks.findIndex(h => h === hook);
                    if (index !== -1) {
                        hooks.splice(index, 1);
                    }
                    if (hooks.length === 0) {
                        this.hooks.delete(hook.name);
                    }
                }
            }
        }
        if (plugin.externalService) {
            this.unregisterExternalService(pluginId);
        }
        this.plugins.delete(pluginId);
        this.logger.log(`Plugin ${plugin.name} unregistered`);
    }
    registerExternalService(config) {
        const serviceId = this.generateServiceId(config);
        this.externalServices.set(serviceId, config);
        this.logger.log(`External service registered: ${serviceId}`);
    }
    unregisterExternalService(serviceId) {
        this.externalServices.delete(serviceId);
        this.logger.log(`External service unregistered: ${serviceId}`);
    }
    async triggerEvent(eventName, context, data) {
        const event = {
            name: eventName,
            context,
            data,
            timestamp: new Date().toISOString(),
            id: this.generateEventId(),
        };
        this.logger.debug(`Triggering event: ${eventName}`);
        await this.executeInternalPlugins(event);
        await this.triggerExternalServices(event);
        return event;
    }
    async executeInternalPlugins(event) {
        const hooks = this.hooks.get(event.name) || [];
        if (hooks.length === 0) {
            this.logger.debug(`No internal hooks found for event: ${event.name}`);
            return;
        }
        this.logger.debug(`Found ${hooks.length} internal hooks for event: ${event.name}`);
        for (const hook of hooks) {
            try {
                this.logger.debug(`Executing internal hook for event ${event.name} with priority ${hook.priority}`);
                const result = hook.handler(event);
                if (result instanceof Promise) {
                    await result;
                }
                this.logger.debug(`Internal hook executed successfully for event ${event.name}`);
            }
            catch (error) {
                this.logger.error(`Error executing internal hook for event ${event.name}: ${error.message}`, error.stack);
                event.result = {
                    error: error.message,
                    hook: hook.name,
                };
            }
        }
    }
    async triggerExternalServices(event) {
        const externalServices = Array.from(this.externalServices.values());
        if (externalServices.length === 0) {
            this.logger.debug(`No external services configured for event: ${event.name}`);
            return;
        }
        this.logger.debug(`Found ${externalServices.length} external services for event: ${event.name}`);
        const promises = externalServices.map(service => this.triggerExternalService(service, event));
        try {
            await Promise.allSettled(promises);
        }
        catch (error) {
            this.logger.error(`Error triggering external services for event ${event.name}: ${error.message}`);
        }
    }
    async triggerExternalService(service, event) {
        try {
            switch (service.type) {
                case 'webhook':
                    await this.triggerWebhook(service.webhook, event);
                    break;
                case 'message-queue':
                    await this.triggerMessageQueue(service.queue, event);
                    break;
                case 'event-stream':
                    await this.triggerEventStream(service.stream, event);
                    break;
                default:
                    this.logger.warn(`Unknown external service type: ${service.type}`);
            }
        }
        catch (error) {
            this.logger.error(`Error triggering external service: ${error.message}`);
        }
    }
    async triggerWebhook(webhook, event) {
        if (webhook.events && !webhook.events.includes(event.name)) {
            return;
        }
        const config = {
            method: webhook.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...webhook.headers,
            },
            timeout: webhook.timeout || 10000,
        };
        try {
            await (0, axios_1.default)(webhook.url, {
                ...config,
                data: event,
            });
            this.logger.debug(`Webhook triggered successfully: ${webhook.url}`);
        }
        catch (error) {
            this.logger.error(`Webhook failed: ${webhook.url}`, error.message);
            if (webhook.retries && webhook.retries > 0) {
                await this.retryWebhook(webhook, event, webhook.retries);
            }
        }
    }
    async retryWebhook(webhook, event, retries) {
        for (let i = 1; i <= retries; i++) {
            try {
                await new Promise(resolve => setTimeout(resolve, i * 1000));
                await (0, axios_1.default)(webhook.url, {
                    method: webhook.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...webhook.headers,
                    },
                    timeout: webhook.timeout || 10000,
                    data: event,
                });
                this.logger.debug(`Webhook retry successful: ${webhook.url} (attempt ${i})`);
                return;
            }
            catch (error) {
                this.logger.error(`Webhook retry failed: ${webhook.url} (attempt ${i})`, error.message);
            }
        }
    }
    async triggerMessageQueue(queue, event) {
        this.logger.debug(`Message queue trigger not implemented yet for: ${queue.name}`);
    }
    async triggerEventStream(stream, event) {
        this.logger.debug(`Event stream trigger not implemented yet for: ${stream.topic}`);
    }
    generateServiceId(config) {
        switch (config.type) {
            case 'webhook':
                return `webhook-${config.webhook.url}`;
            case 'message-queue':
                return `queue-${config.queue.name}`;
            case 'event-stream':
                return `stream-${config.stream.topic}`;
            default:
                return `external-${Date.now()}`;
        }
    }
    generateEventId() {
        return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getActivePlugins() {
        return Array.from(this.plugins.values()).filter(plugin => plugin.isActive);
    }
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    getHooksForEvent(eventName) {
        return this.hooks.get(eventName) || [];
    }
    getRegisteredEvents() {
        return Array.from(this.hooks.keys());
    }
    getPluginCount() {
        return this.plugins.size;
    }
    getHookCount() {
        return Array.from(this.hooks.values()).reduce((total, hooks) => total + hooks.length, 0);
    }
    getExternalServiceCount() {
        return this.externalServices.size;
    }
};
exports.PluginManagerService = PluginManagerService;
PluginManagerService.EVENTS = {
    TEST_CREATED: 'test.created',
    TEST_UPDATED: 'test.updated',
    TEST_DELETED: 'test.deleted',
    TEST_PUBLISHED: 'test.published',
    TEST_UNPUBLISHED: 'test.unpublished',
    QUESTION_CREATED: 'question.created',
    QUESTION_UPDATED: 'question.updated',
    QUESTION_DELETED: 'question.deleted',
    QUESTION_PUBLISHED: 'question.published',
    ATTEMPT_STARTED: 'attempt.started',
    ATTEMPT_SUBMITTED: 'attempt.submitted',
    ATTEMPT_REVIEWED: 'attempt.reviewed',
    ANSWER_SUBMITTED: 'answer.submitted',
    RULE_CREATED: 'rule.created',
    RULE_UPDATED: 'rule.updated',
    RULE_DELETED: 'rule.deleted',
    USER_REGISTERED: 'user.registered',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    SYSTEM_STARTUP: 'system.startup',
    SYSTEM_SHUTDOWN: 'system.shutdown',
    ERROR_OCCURRED: 'error.occurred',
};
exports.PluginManagerService = PluginManagerService = PluginManagerService_1 = __decorate([
    (0, common_1.Injectable)()
], PluginManagerService);


/***/ }),

/***/ "./src/config/database.config.ts":
/*!***************************************!*\
  !*** ./src/config/database.config.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseConfig = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const test_entity_1 = __webpack_require__(/*! ../modules/tests/entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_section_entity_1 = __webpack_require__(/*! ../modules/tests/entities/test-section.entity */ "./src/modules/tests/entities/test-section.entity.ts");
const test_question_entity_1 = __webpack_require__(/*! ../modules/tests/entities/test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
const test_attempt_entity_1 = __webpack_require__(/*! ../modules/tests/entities/test-attempt.entity */ "./src/modules/tests/entities/test-attempt.entity.ts");
const test_rule_entity_1 = __webpack_require__(/*! ../modules/tests/entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
const test_user_answer_entity_1 = __webpack_require__(/*! ../modules/tests/entities/test-user-answer.entity */ "./src/modules/tests/entities/test-user-answer.entity.ts");
const question_entity_1 = __webpack_require__(/*! ../modules/questions/entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
const question_option_entity_1 = __webpack_require__(/*! ../modules/questions/entities/question-option.entity */ "./src/modules/questions/entities/question-option.entity.ts");
let DatabaseConfig = class DatabaseConfig {
    constructor(configService) {
        this.configService = configService;
    }
    createTypeOrmOptions() {
        const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
        return {
            type: 'postgres',
            host: this.configService.get('DB_HOST', 'localhost'),
            port: this.configService.get('DB_PORT', 5432),
            username: this.configService.get('DB_USERNAME', 'postgres'),
            password: this.configService.get('DB_PASSWORD', 'postgres'),
            database: this.configService.get('DB_DATABASE', 'assessment_db'),
            entities: [
                test_entity_1.Test,
                test_section_entity_1.TestSection,
                test_question_entity_1.TestQuestion,
                test_attempt_entity_1.TestAttempt,
                test_rule_entity_1.TestRule,
                test_user_answer_entity_1.TestUserAnswer,
                question_entity_1.Question,
                question_option_entity_1.QuestionOption,
            ],
            synchronize: false,
            logging: isDevelopment,
            ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        };
    }
};
exports.DatabaseConfig = DatabaseConfig;
exports.DatabaseConfig = DatabaseConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], DatabaseConfig);


/***/ }),

/***/ "./src/config/redis.config.ts":
/*!************************************!*\
  !*** ./src/config/redis.config.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisConfig = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const redisStore = __webpack_require__(/*! cache-manager-redis-store */ "cache-manager-redis-store");
let RedisConfig = class RedisConfig {
    constructor(configService) {
        this.configService = configService;
    }
    createCacheOptions() {
        return {
            store: redisStore,
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            ttl: 86400,
            max: 100,
        };
    }
};
exports.RedisConfig = RedisConfig;
exports.RedisConfig = RedisConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], RedisConfig);


/***/ }),

/***/ "./src/modules/attempts/attempts.controller.ts":
/*!*****************************************************!*\
  !*** ./src/modules/attempts/attempts.controller.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttemptsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const attempts_service_1 = __webpack_require__(/*! ./attempts.service */ "./src/modules/attempts/attempts.service.ts");
const submit_answer_dto_1 = __webpack_require__(/*! ./dto/submit-answer.dto */ "./src/modules/attempts/dto/submit-answer.dto.ts");
const review_answer_dto_1 = __webpack_require__(/*! ./dto/review-answer.dto */ "./src/modules/attempts/dto/review-answer.dto.ts");
const api_response_dto_1 = __webpack_require__(/*! @/common/dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
let AttemptsController = class AttemptsController {
    constructor(attemptsService) {
        this.attemptsService = attemptsService;
    }
    async startAttempt(testId, req) {
        const authContext = req.user;
        const attempt = await this.attemptsService.startAttempt(testId, authContext.userId, authContext);
        return { attemptId: attempt.attemptId };
    }
    async getAttemptQuestions(attemptId, req) {
        const authContext = req.user;
        return this.attemptsService.getAttemptQuestions(attemptId, authContext);
    }
    async submitAnswer(attemptId, submitAnswerDto, req) {
        const authContext = req.user;
        await this.attemptsService.submitAnswer(attemptId, submitAnswerDto, authContext);
        return { message: 'Answer submitted successfully' };
    }
    async submitAttempt(attemptId, req) {
        const authContext = req.user;
        const attempt = await this.attemptsService.submitAttempt(attemptId, authContext);
        return {
            attemptId: attempt.attemptId,
            score: attempt.score,
            reviewStatus: attempt.reviewStatus,
            result: attempt.result
        };
    }
    async reviewAttempt(attemptId, reviewDto, req) {
        const authContext = req.user;
        const attempt = await this.attemptsService.reviewAttempt(attemptId, reviewDto, authContext);
        return {
            attemptId: attempt.attemptId,
            score: attempt.score,
            result: attempt.result
        };
    }
    async getPendingReviews(req) {
        const authContext = req.user;
        return this.attemptsService.getPendingReviews(authContext);
    }
};
exports.AttemptsController = AttemptsController;
__decorate([
    (0, common_1.Post)('start/:testId'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new test attempt' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Attempt started', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('testId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "startAttempt", null);
__decorate([
    (0, common_1.Get)(':attemptId/questions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get questions for an attempt' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Questions retrieved', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('attemptId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "getAttemptQuestions", null);
__decorate([
    (0, common_1.Post)(':attemptId/answers'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit an answer for a question' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Answer submitted', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('attemptId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof submit_answer_dto_1.SubmitAnswerDto !== "undefined" && submit_answer_dto_1.SubmitAnswerDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Post)(':attemptId/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a test attempt' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attempt submitted', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('attemptId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "submitAttempt", null);
__decorate([
    (0, common_1.Post)(':attemptId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Review a test attempt (for subjective questions)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attempt reviewed', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('attemptId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof review_answer_dto_1.ReviewAttemptDto !== "undefined" && review_answer_dto_1.ReviewAttemptDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "reviewAttempt", null);
__decorate([
    (0, common_1.Get)('reviews/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending reviews for subjective questions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending reviews retrieved', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttemptsController.prototype, "getPendingReviews", null);
exports.AttemptsController = AttemptsController = __decorate([
    (0, swagger_1.ApiTags)('Test Attempts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('attempts'),
    __metadata("design:paramtypes", [typeof (_a = typeof attempts_service_1.AttemptsService !== "undefined" && attempts_service_1.AttemptsService) === "function" ? _a : Object])
], AttemptsController);


/***/ }),

/***/ "./src/modules/attempts/attempts.module.ts":
/*!*************************************************!*\
  !*** ./src/modules/attempts/attempts.module.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttemptsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const attempts_controller_1 = __webpack_require__(/*! ./attempts.controller */ "./src/modules/attempts/attempts.controller.ts");
const attempts_service_1 = __webpack_require__(/*! ./attempts.service */ "./src/modules/attempts/attempts.service.ts");
const test_attempt_entity_1 = __webpack_require__(/*! ../tests/entities/test-attempt.entity */ "./src/modules/tests/entities/test-attempt.entity.ts");
const test_user_answer_entity_1 = __webpack_require__(/*! ../tests/entities/test-user-answer.entity */ "./src/modules/tests/entities/test-user-answer.entity.ts");
const test_entity_1 = __webpack_require__(/*! ../tests/entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_question_entity_1 = __webpack_require__(/*! ../tests/entities/test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
const test_rule_entity_1 = __webpack_require__(/*! ../tests/entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
const question_entity_1 = __webpack_require__(/*! ../questions/entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
const plugin_module_1 = __webpack_require__(/*! ../plugins/plugin.module */ "./src/modules/plugins/plugin.module.ts");
const tests_module_1 = __webpack_require__(/*! ../tests/tests.module */ "./src/modules/tests/tests.module.ts");
let AttemptsModule = class AttemptsModule {
};
exports.AttemptsModule = AttemptsModule;
exports.AttemptsModule = AttemptsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                test_attempt_entity_1.TestAttempt,
                test_user_answer_entity_1.TestUserAnswer,
                test_entity_1.Test,
                test_question_entity_1.TestQuestion,
                test_rule_entity_1.TestRule,
                question_entity_1.Question,
            ]),
            plugin_module_1.PluginModule,
            tests_module_1.TestsModule,
        ],
        controllers: [attempts_controller_1.AttemptsController],
        providers: [attempts_service_1.AttemptsService],
        exports: [attempts_service_1.AttemptsService],
    })
], AttemptsModule);


/***/ }),

/***/ "./src/modules/attempts/attempts.service.ts":
/*!**************************************************!*\
  !*** ./src/modules/attempts/attempts.service.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttemptsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const test_attempt_entity_1 = __webpack_require__(/*! ../tests/entities/test-attempt.entity */ "./src/modules/tests/entities/test-attempt.entity.ts");
const test_user_answer_entity_1 = __webpack_require__(/*! ../tests/entities/test-user-answer.entity */ "./src/modules/tests/entities/test-user-answer.entity.ts");
const test_entity_1 = __webpack_require__(/*! ../tests/entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_question_entity_1 = __webpack_require__(/*! ../tests/entities/test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
const test_rule_entity_1 = __webpack_require__(/*! ../tests/entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
const question_entity_1 = __webpack_require__(/*! ../questions/entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
const plugin_manager_service_1 = __webpack_require__(/*! @/common/services/plugin-manager.service */ "./src/common/services/plugin-manager.service.ts");
const question_pool_service_1 = __webpack_require__(/*! ../tests/question-pool.service */ "./src/modules/tests/question-pool.service.ts");
let AttemptsService = class AttemptsService {
    constructor(attemptRepository, testUserAnswerRepository, testRepository, testQuestionRepository, testRuleRepository, questionRepository, pluginManager, questionPoolService) {
        this.attemptRepository = attemptRepository;
        this.testUserAnswerRepository = testUserAnswerRepository;
        this.testRepository = testRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testRuleRepository = testRuleRepository;
        this.questionRepository = questionRepository;
        this.pluginManager = pluginManager;
        this.questionPoolService = questionPoolService;
    }
    async startAttempt(testId, userId, authContext) {
        const test = await this.testRepository.findOne({
            where: {
                testId: testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        const existingAttempts = await this.attemptRepository.count({
            where: {
                testId,
                userId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (existingAttempts >= test.attempts) {
            throw new Error('Maximum attempts reached for this test');
        }
        const attempt = this.attemptRepository.create({
            testId,
            userId,
            attempt: existingAttempts + 1,
            status: test_attempt_entity_1.AttemptStatus.IN_PROGRESS,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
        });
        const savedAttempt = await this.attemptRepository.save(attempt);
        if (test.type === test_entity_1.TestType.RULE_BASED) {
            await this.generateRuleBasedTestQuestions(savedAttempt, test, authContext);
        }
        await this.pluginManager.triggerEvent(plugin_manager_service_1.PluginManagerService.EVENTS.ATTEMPT_STARTED, {
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            userId: authContext.userId,
        }, {
            attemptId: savedAttempt.attemptId,
            testId: savedAttempt.testId,
            attemptNumber: savedAttempt.attempt,
        });
        return savedAttempt;
    }
    async getAttemptQuestions(attemptId, authContext) {
        const attempt = await this.attemptRepository.findOne({
            where: {
                attemptId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!attempt) {
            throw new common_1.NotFoundException('Attempt not found');
        }
        const testId = attempt.resolvedTestId || attempt.testId;
        const testQuestions = await this.testQuestionRepository.find({
            where: {
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            order: { ordering: 'ASC' },
        });
        const questionIds = testQuestions.map(tq => tq.questionId);
        if (questionIds.length === 0) {
            return [];
        }
        return this.questionRepository.find({
            where: {
                questionId: (0, typeorm_2.In)(questionIds),
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
    }
    async submitAnswer(attemptId, submitAnswerDto, authContext) {
        const attempt = await this.attemptRepository.findOne({
            where: {
                attemptId,
                userId: authContext.userId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!attempt) {
            throw new common_1.NotFoundException('Attempt not found');
        }
        if (attempt.status !== test_attempt_entity_1.AttemptStatus.IN_PROGRESS) {
            throw new Error('Cannot submit answer to completed attempt');
        }
        const question = await this.questionRepository.findOne({
            where: {
                questionId: submitAnswerDto.questionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        this.validateAnswer(submitAnswerDto.answer, question);
        const answerJson = JSON.stringify(submitAnswerDto.answer);
        const existingAnswer = await this.testUserAnswerRepository.findOne({
            where: {
                attemptId,
                questionId: submitAnswerDto.questionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (existingAnswer) {
            existingAnswer.answer = answerJson;
            existingAnswer.updatedAt = new Date();
            await this.testUserAnswerRepository.save(existingAnswer);
        }
        else {
            const userAnswer = this.testUserAnswerRepository.create({
                attemptId,
                questionId: submitAnswerDto.questionId,
                answer: answerJson,
                anssOrder: '1',
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            });
            await this.testUserAnswerRepository.save(userAnswer);
        }
        if (submitAnswerDto.timeSpent) {
            attempt.timeSpent = (attempt.timeSpent || 0) + submitAnswerDto.timeSpent;
            await this.attemptRepository.save(attempt);
        }
        await this.pluginManager.triggerEvent(plugin_manager_service_1.PluginManagerService.EVENTS.ANSWER_SUBMITTED, {
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            userId: authContext.userId,
        }, {
            attemptId,
            questionId: submitAnswerDto.questionId,
            timeSpent: submitAnswerDto.timeSpent,
            answer: submitAnswerDto.answer,
        });
    }
    async submitAttempt(attemptId, authContext) {
        const attempt = await this.attemptRepository.findOne({
            where: {
                attemptId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!attempt) {
            throw new common_1.NotFoundException('Attempt not found');
        }
        attempt.status = test_attempt_entity_1.AttemptStatus.SUBMITTED;
        attempt.submittedAt = new Date();
        attempt.submissionType = test_attempt_entity_1.SubmissionType.SELF;
        const hasSubjectiveQuestions = await this.hasSubjectiveQuestions(attemptId, authContext);
        if (hasSubjectiveQuestions) {
            attempt.reviewStatus = test_attempt_entity_1.ReviewStatus.PENDING;
        }
        else {
            const score = await this.calculateObjectiveScore(attemptId, authContext);
            attempt.score = score;
            attempt.result = score >= 60 ? test_attempt_entity_1.ResultType.PASS : test_attempt_entity_1.ResultType.FAIL;
        }
        const savedAttempt = await this.attemptRepository.save(attempt);
        await this.pluginManager.triggerEvent(plugin_manager_service_1.PluginManagerService.EVENTS.ATTEMPT_SUBMITTED, {
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            userId: authContext.userId,
        }, {
            attemptId: savedAttempt.attemptId,
            testId: savedAttempt.testId,
            score: savedAttempt.score,
            result: savedAttempt.result,
            timeSpent: savedAttempt.timeSpent,
            reviewStatus: savedAttempt.reviewStatus,
        });
        return savedAttempt;
    }
    async reviewAttempt(attemptId, reviewDto, authContext) {
        const attempt = await this.attemptRepository.findOne({
            where: {
                attemptId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!attempt) {
            throw new common_1.NotFoundException('Attempt not found');
        }
        for (const answerReview of reviewDto.answers) {
            await this.testUserAnswerRepository.update({
                attemptId,
                questionId: answerReview.questionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            }, {
                score: answerReview.score,
                remarks: answerReview.remarks,
                reviewedBy: authContext.userId,
                reviewStatus: 'R',
                reviewedAt: new Date(),
            });
        }
        const finalScore = await this.calculateFinalScore(attemptId, authContext);
        attempt.score = finalScore;
        attempt.result = finalScore >= 60 ? test_attempt_entity_1.ResultType.PASS : test_attempt_entity_1.ResultType.FAIL;
        attempt.reviewStatus = test_attempt_entity_1.ReviewStatus.REVIEWED;
        attempt.updatedBy = authContext.userId;
        const savedAttempt = await this.attemptRepository.save(attempt);
        await this.pluginManager.triggerEvent(plugin_manager_service_1.PluginManagerService.EVENTS.ATTEMPT_REVIEWED, {
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            userId: authContext.userId,
        }, {
            attemptId: savedAttempt.attemptId,
            testId: savedAttempt.testId,
            score: savedAttempt.score,
            result: savedAttempt.result,
            reviewedBy: authContext.userId,
            answersReviewed: reviewDto.answers.length,
        });
        return savedAttempt;
    }
    async getPendingReviews(authContext) {
        return this.attemptRepository
            .createQueryBuilder('attempt')
            .leftJoin('testUserAnswers', 'answers', 'answers.attemptId = attempt.attemptId')
            .leftJoin('questions', 'question', 'question.questionId = answers.questionId')
            .where('attempt.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('attempt.organisationId = :organisationId', { organisationId: authContext.organisationId })
            .andWhere('attempt.reviewStatus = :reviewStatus', { reviewStatus: test_attempt_entity_1.ReviewStatus.PENDING })
            .andWhere('question.gradingType = :gradingType', { gradingType: question_entity_1.GradingType.EXERCISE })
            .andWhere('answers.reviewStatus = :answerReviewStatus', { answerReviewStatus: 'P' })
            .select([
            'attempt.attemptId',
            'attempt.testId',
            'attempt.userId',
            'attempt.submittedAt',
            'answers.questionId',
            'question.text as title',
            'question.type',
            'question.marks',
            'question.gradingType',
            'question.params'
        ])
            .getMany();
    }
    async generateRuleBasedTestQuestions(attempt, originalTest, authContext) {
        const generatedTest = this.testRepository.create({
            title: `Generated Test for ${originalTest.title} - Attempt ${attempt.attempt}`,
            type: test_entity_1.TestType.GENERATED,
            timeDuration: originalTest.timeDuration,
            attempts: 1,
            passingMarks: originalTest.passingMarks,
            description: originalTest.description,
            status: originalTest.status,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            createdBy: 'system',
        });
        const savedGeneratedTest = await this.testRepository.save(generatedTest);
        attempt.resolvedTestId = savedGeneratedTest.testId;
        await this.attemptRepository.save(attempt);
        const rules = await this.testRuleRepository.find({
            where: {
                testId: originalTest.testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
                isActive: true,
            },
            order: { priority: 'DESC' },
        });
        let questionOrder = 1;
        for (const rule of rules) {
            let selectedQuestionIds = [];
            if (rule.selectionMode === 'PRESELECTED') {
                const availableQuestions = await this.testQuestionRepository.find({
                    where: {
                        testId: originalTest.testId,
                        ruleId: rule.ruleId,
                        tenantId: authContext.tenantId,
                        organisationId: authContext.organisationId,
                    },
                    order: { ordering: 'ASC' },
                });
                if (availableQuestions.length < rule.numberOfQuestions) {
                    throw new Error(`Not enough pre-selected questions for rule ${rule.name}. Found ${availableQuestions.length}, required ${rule.numberOfQuestions}`);
                }
                const selectedQuestions = this.selectQuestionsFromRule(availableQuestions, rule.numberOfQuestions, rule.selectionStrategy);
                selectedQuestionIds = selectedQuestions.map(q => q.questionId);
            }
            else {
                const questionIds = await this.questionPoolService.generateQuestionPool(rule.ruleId, authContext);
                if (questionIds.length < rule.numberOfQuestions) {
                    throw new Error(`Not enough questions available for rule ${rule.name}. Found ${questionIds.length}, required ${rule.numberOfQuestions}`);
                }
                selectedQuestionIds = this.selectQuestionsFromPool(questionIds, rule.numberOfQuestions, rule.selectionStrategy);
            }
            for (const questionId of selectedQuestionIds) {
                await this.testQuestionRepository.save(this.testQuestionRepository.create({
                    testId: savedGeneratedTest.testId,
                    sectionId: rule.sectionId,
                    questionId: questionId,
                    ordering: questionOrder++,
                    ruleId: rule.ruleId,
                    isCompulsory: false,
                    tenantId: authContext.tenantId,
                    organisationId: authContext.organisationId,
                }));
            }
        }
    }
    selectQuestionsFromPool(questionIds, count, strategy) {
        switch (strategy) {
            case 'random':
                return this.shuffleArray(questionIds).slice(0, count);
            case 'sequential':
                return questionIds.slice(0, count);
            case 'weighted':
                return this.shuffleArray(questionIds).slice(0, count);
            default:
                return this.shuffleArray(questionIds).slice(0, count);
        }
    }
    selectQuestionsFromRule(availableQuestions, count, strategy) {
        switch (strategy) {
            case 'random':
                return this.shuffleArray([...availableQuestions]).slice(0, count);
            case 'sequential':
                return availableQuestions.slice(0, count);
            case 'weighted':
                return this.shuffleArray([...availableQuestions]).slice(0, count);
            default:
                return this.shuffleArray([...availableQuestions]).slice(0, count);
        }
    }
    validateAnswer(answer, question) {
        switch (question.type) {
            case question_entity_1.QuestionType.MCQ:
            case question_entity_1.QuestionType.TRUE_FALSE:
                if (!answer.selectedOptionIds || answer.selectedOptionIds.length !== 1) {
                    throw new Error('MCQ/True-False questions require exactly one selected option');
                }
                break;
            case question_entity_1.QuestionType.MULTIPLE_ANSWER:
                if (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
                    throw new Error('Multiple answer questions require at least one selected option');
                }
                break;
            case question_entity_1.QuestionType.SUBJECTIVE:
            case question_entity_1.QuestionType.ESSAY:
                if (!answer.text || answer.text.trim().length === 0) {
                    throw new Error('Subjective/Essay questions require text answer');
                }
                if (question.params?.maxLength && answer.text.length > question.params.maxLength) {
                    throw new Error(`Answer exceeds maximum length of ${question.params.maxLength} characters`);
                }
                if (question.params?.minLength && answer.text.length < question.params.minLength) {
                    throw new Error(`Answer must be at least ${question.params.minLength} characters`);
                }
                break;
            case question_entity_1.QuestionType.FILL_BLANK:
                if (!answer.blanks || answer.blanks.length === 0) {
                    throw new Error('Fill-in-the-blank questions require blank answers');
                }
                break;
            case question_entity_1.QuestionType.MATCH:
                if (!answer.matches || answer.matches.length === 0) {
                    throw new Error('Matching questions require match answers');
                }
                break;
        }
    }
    async hasSubjectiveQuestions(attemptId, authContext) {
        const subjectiveQuestions = await this.questionRepository
            .createQueryBuilder('question')
            .innerJoin('testUserAnswers', 'answers', 'answers.questionId = question.questionId')
            .where('answers.attemptId = :attemptId', { attemptId })
            .andWhere('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
            .andWhere('question.gradingType = :gradingType', { gradingType: question_entity_1.GradingType.EXERCISE })
            .getCount();
        return subjectiveQuestions > 0;
    }
    async calculateObjectiveScore(attemptId, authContext) {
        const answers = await this.testUserAnswerRepository
            .createQueryBuilder('answer')
            .innerJoin('questions', 'question', 'question.questionId = answer.questionId')
            .where('answer.attemptId = :attemptId', { attemptId })
            .andWhere('answer.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('answer.organisationId = :organisationId', { organisationId: authContext.organisationId })
            .andWhere('question.gradingType = :gradingType', { gradingType: question_entity_1.GradingType.QUIZ })
            .select(['answer.answer', 'question.marks', 'question.type'])
            .getMany();
        let totalScore = 0;
        let totalMarks = 0;
        for (const answer of answers) {
            const question = await this.questionRepository.findOne({
                where: { questionId: answer.questionId },
            });
            if (question) {
                totalMarks += question.marks;
                const answerData = JSON.parse(answer.answer);
                const score = this.calculateQuestionScore(answerData, question);
                totalScore += score;
            }
        }
        return totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    }
    calculateQuestionScore(answerData, question) {
        switch (question.type) {
            case question_entity_1.QuestionType.MCQ:
            case question_entity_1.QuestionType.TRUE_FALSE:
                return answerData.selectedOptionIds?.length > 0 ? question.marks : 0;
            case question_entity_1.QuestionType.MULTIPLE_ANSWER:
                return question.marks;
            default:
                return 0;
        }
    }
    async calculateFinalScore(attemptId, authContext) {
        const answers = await this.testUserAnswerRepository.find({
            where: {
                attemptId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        let totalScore = 0;
        let totalMarks = 0;
        for (const answer of answers) {
            const question = await this.questionRepository.findOne({
                where: { questionId: answer.questionId },
            });
            if (question) {
                totalMarks += question.marks;
                totalScore += answer.score || 0;
            }
        }
        return totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
exports.AttemptsService = AttemptsService;
exports.AttemptsService = AttemptsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(test_attempt_entity_1.TestAttempt)),
    __param(1, (0, typeorm_1.InjectRepository)(test_user_answer_entity_1.TestUserAnswer)),
    __param(2, (0, typeorm_1.InjectRepository)(test_entity_1.Test)),
    __param(3, (0, typeorm_1.InjectRepository)(test_question_entity_1.TestQuestion)),
    __param(4, (0, typeorm_1.InjectRepository)(test_rule_entity_1.TestRule)),
    __param(5, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object, typeof (_e = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _e : Object, typeof (_f = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _f : Object, typeof (_g = typeof plugin_manager_service_1.PluginManagerService !== "undefined" && plugin_manager_service_1.PluginManagerService) === "function" ? _g : Object, typeof (_h = typeof question_pool_service_1.QuestionPoolService !== "undefined" && question_pool_service_1.QuestionPoolService) === "function" ? _h : Object])
], AttemptsService);


/***/ }),

/***/ "./src/modules/attempts/dto/review-answer.dto.ts":
/*!*******************************************************!*\
  !*** ./src/modules/attempts/dto/review-answer.dto.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BulkReviewDto = exports.ReviewAttemptDto = exports.ReviewAnswerDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
class ReviewAnswerDto {
}
exports.ReviewAnswerDto = ReviewAnswerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReviewAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ReviewAnswerDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewAnswerDto.prototype, "remarks", void 0);
class ReviewAttemptDto {
}
exports.ReviewAttemptDto = ReviewAttemptDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ReviewAnswerDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReviewAnswerDto),
    __metadata("design:type", Array)
], ReviewAttemptDto.prototype, "answers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewAttemptDto.prototype, "overallRemarks", void 0);
class BulkReviewDto {
}
exports.BulkReviewDto = BulkReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], BulkReviewDto.prototype, "attemptIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkReviewDto.prototype, "reviewerId", void 0);


/***/ }),

/***/ "./src/modules/attempts/dto/submit-answer.dto.ts":
/*!*******************************************************!*\
  !*** ./src/modules/attempts/dto/submit-answer.dto.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SubmitAnswerDto = exports.AnswerDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
class AnswerDto {
}
exports.AnswerDto = AnswerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AnswerDto.prototype, "selectedOptionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnswerDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AnswerDto.prototype, "matches", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AnswerDto.prototype, "blanks", void 0);
class SubmitAnswerDto {
}
exports.SubmitAnswerDto = SubmitAnswerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AnswerDto),
    __metadata("design:type", AnswerDto)
], SubmitAnswerDto.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitAnswerDto.prototype, "timeSpent", void 0);


/***/ }),

/***/ "./src/modules/auth/auth.module.ts":
/*!*****************************************!*\
  !*** ./src/modules/auth/auth.module.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({})
], AuthModule);


/***/ }),

/***/ "./src/modules/health/health.controller.ts":
/*!*************************************************!*\
  !*** ./src/modules/health/health.controller.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const health_service_1 = __webpack_require__(/*! ./health.service */ "./src/modules/health/health.service.ts");
const api_response_dto_1 = __webpack_require__(/*! @/common/dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
let HealthController = class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }
    async checkHealth() {
        const healthStatus = await this.healthService.checkHealth();
        return healthStatus;
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Health check successful',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "checkHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [typeof (_a = typeof health_service_1.HealthService !== "undefined" && health_service_1.HealthService) === "function" ? _a : Object])
], HealthController);


/***/ }),

/***/ "./src/modules/health/health.module.ts":
/*!*********************************************!*\
  !*** ./src/modules/health/health.module.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const health_controller_1 = __webpack_require__(/*! ./health.controller */ "./src/modules/health/health.controller.ts");
const health_service_1 = __webpack_require__(/*! ./health.service */ "./src/modules/health/health.service.ts");
let HealthModule = class HealthModule {
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([])],
        controllers: [health_controller_1.HealthController],
        providers: [health_service_1.HealthService],
    })
], HealthModule);


/***/ }),

/***/ "./src/modules/health/health.service.ts":
/*!**********************************************!*\
  !*** ./src/modules/health/health.service.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const cache_manager_1 = __webpack_require__(/*! @nestjs/cache-manager */ "@nestjs/cache-manager");
const common_2 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const cache_manager_2 = __webpack_require__(/*! cache-manager */ "cache-manager");
let HealthService = class HealthService {
    constructor(dataSource, cacheManager) {
        this.dataSource = dataSource;
        this.cacheManager = cacheManager;
    }
    async checkHealth() {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'unknown',
                redis: 'unknown',
            },
        };
        try {
            await this.dataSource.query('SELECT 1');
            healthStatus.services.database = 'healthy';
        }
        catch (error) {
            healthStatus.services.database = 'unhealthy';
            healthStatus.status = 'unhealthy';
        }
        try {
            await this.cacheManager.set('health_check', 'ok', 10);
            const result = await this.cacheManager.get('health_check');
            if (result === 'ok') {
                healthStatus.services.redis = 'healthy';
            }
            else {
                healthStatus.services.redis = 'unhealthy';
                healthStatus.status = 'unhealthy';
            }
        }
        catch (error) {
            healthStatus.services.redis = 'unhealthy';
            healthStatus.status = 'unhealthy';
        }
        return healthStatus;
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.DataSource !== "undefined" && typeorm_2.DataSource) === "function" ? _a : Object, typeof (_b = typeof cache_manager_2.Cache !== "undefined" && cache_manager_2.Cache) === "function" ? _b : Object])
], HealthService);


/***/ }),

/***/ "./src/modules/plugins/plugin.module.ts":
/*!**********************************************!*\
  !*** ./src/modules/plugins/plugin.module.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PluginModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const plugin_manager_service_1 = __webpack_require__(/*! @/common/services/plugin-manager.service */ "./src/common/services/plugin-manager.service.ts");
let PluginModule = class PluginModule {
};
exports.PluginModule = PluginModule;
exports.PluginModule = PluginModule = __decorate([
    (0, common_1.Module)({
        providers: [plugin_manager_service_1.PluginManagerService],
        exports: [plugin_manager_service_1.PluginManagerService],
    })
], PluginModule);


/***/ }),

/***/ "./src/modules/questions/dto/create-question.dto.ts":
/*!**********************************************************!*\
  !*** ./src/modules/questions/dto/create-question.dto.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateQuestionDto = exports.CreateQuestionOptionDto = exports.QuestionParamsDto = exports.RubricCriteriaDto = exports.QuestionMediaDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const question_entity_1 = __webpack_require__(/*! ../entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
class QuestionMediaDto {
}
exports.QuestionMediaDto = QuestionMediaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], QuestionMediaDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], QuestionMediaDto.prototype, "video", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], QuestionMediaDto.prototype, "audio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], QuestionMediaDto.prototype, "document", void 0);
class RubricCriteriaDto {
}
exports.RubricCriteriaDto = RubricCriteriaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RubricCriteriaDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RubricCriteriaDto.prototype, "maxScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RubricCriteriaDto.prototype, "description", void 0);
class QuestionParamsDto {
}
exports.QuestionParamsDto = QuestionParamsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QuestionParamsDto.prototype, "maxLength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QuestionParamsDto.prototype, "minLength", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuestionParamsDto.prototype, "allowAttachments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QuestionParamsDto.prototype, "wordLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuestionParamsDto.prototype, "caseSensitive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuestionParamsDto.prototype, "allowPartialScoring", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], QuestionParamsDto.prototype, "rubric", void 0);
class CreateQuestionOptionDto {
}
exports.CreateQuestionOptionDto = CreateQuestionOptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Option text content'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionOptionDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Media URLs for the option',
        example: {
            image: "https://cdn.example.com/opt1.png",
            video: "https://cdn.example.com/opt2.mp4"
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => QuestionMediaDto),
    __metadata("design:type", QuestionMediaDto)
], CreateQuestionOptionDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Text for matching (used in match questions)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionOptionDto.prototype, "matchWith", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Media URLs for matching (used in match questions)',
        example: {
            image: "https://cdn.example.com/match1.png",
            video: "https://cdn.example.com/match2.mp4"
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => QuestionMediaDto),
    __metadata("design:type", QuestionMediaDto)
], CreateQuestionOptionDto.prototype, "matchWithMedia", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateQuestionOptionDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateQuestionOptionDto.prototype, "isCorrect", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateQuestionOptionDto.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateQuestionOptionDto.prototype, "blankIndex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateQuestionOptionDto.prototype, "caseSensitive", void 0);
class CreateQuestionDto {
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Question text content'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Media URLs for the question',
        example: {
            image: "https://cdn.example.com/question.png",
            video: "https://cdn.example.com/question.mp4"
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => QuestionMediaDto),
    __metadata("design:type", QuestionMediaDto)
], CreateQuestionDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "alias", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: question_entity_1.QuestionType }),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionType),
    __metadata("design:type", typeof (_a = typeof question_entity_1.QuestionType !== "undefined" && question_entity_1.QuestionType) === "function" ? _a : Object)
], CreateQuestionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: question_entity_1.QuestionLevel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionLevel),
    __metadata("design:type", typeof (_b = typeof question_entity_1.QuestionLevel !== "undefined" && question_entity_1.QuestionLevel) === "function" ? _b : Object)
], CreateQuestionDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: question_entity_1.QuestionStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionStatus),
    __metadata("design:type", typeof (_c = typeof question_entity_1.QuestionStatus !== "undefined" && question_entity_1.QuestionStatus) === "function" ? _c : Object)
], CreateQuestionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "idealTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: question_entity_1.GradingType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_entity_1.GradingType),
    __metadata("design:type", typeof (_d = typeof question_entity_1.GradingType !== "undefined" && question_entity_1.GradingType) === "function" ? _d : Object)
], CreateQuestionDto.prototype, "gradingType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateQuestionDto.prototype, "allowPartialScoring", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => QuestionParamsDto),
    __metadata("design:type", QuestionParamsDto)
], CreateQuestionDto.prototype, "params", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateQuestionOptionDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuestionOptionDto),
    __metadata("design:type", Array)
], CreateQuestionDto.prototype, "options", void 0);


/***/ }),

/***/ "./src/modules/questions/dto/query-question.dto.ts":
/*!*********************************************************!*\
  !*** ./src/modules/questions/dto/query-question.dto.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueryQuestionDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const question_entity_1 = __webpack_require__(/*! ../entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
const base_dto_1 = __webpack_require__(/*! @/common/dto/base.dto */ "./src/common/dto/base.dto.ts");
class QueryQuestionDto extends base_dto_1.PaginationDto {
}
exports.QueryQuestionDto = QueryQuestionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryQuestionDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: question_entity_1.QuestionStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionStatus),
    __metadata("design:type", typeof (_a = typeof question_entity_1.QuestionStatus !== "undefined" && question_entity_1.QuestionStatus) === "function" ? _a : Object)
], QueryQuestionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: question_entity_1.QuestionType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionType),
    __metadata("design:type", typeof (_b = typeof question_entity_1.QuestionType !== "undefined" && question_entity_1.QuestionType) === "function" ? _b : Object)
], QueryQuestionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: question_entity_1.QuestionLevel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionLevel),
    __metadata("design:type", typeof (_c = typeof question_entity_1.QuestionLevel !== "undefined" && question_entity_1.QuestionLevel) === "function" ? _c : Object)
], QueryQuestionDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryQuestionDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], QueryQuestionDto.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], QueryQuestionDto.prototype, "difficultyLevels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], QueryQuestionDto.prototype, "questionTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], QueryQuestionDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], QueryQuestionDto.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryQuestionDto.prototype, "minMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryQuestionDto.prototype, "maxMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], QueryQuestionDto.prototype, "excludeQuestionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], QueryQuestionDto.prototype, "includeQuestionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryQuestionDto.prototype, "timeRangeFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryQuestionDto.prototype, "timeRangeTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryQuestionDto.prototype, "rulePreview", void 0);


/***/ }),

/***/ "./src/modules/questions/dto/rule-preview.dto.ts":
/*!*******************************************************!*\
  !*** ./src/modules/questions/dto/rule-preview.dto.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RulePreviewDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class RulePreviewDto {
}
exports.RulePreviewDto = RulePreviewDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of category IDs to filter questions',
        example: ['cat-1', 'cat-2']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RulePreviewDto.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of difficulty levels to filter questions',
        example: ['easy', 'medium', 'hard']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RulePreviewDto.prototype, "difficultyLevels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of question types to filter questions',
        example: ['mcq', 'subjective', 'essay']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RulePreviewDto.prototype, "questionTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of marks to filter questions',
        example: [1, 2, 5, 10]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], RulePreviewDto.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of tags to filter questions',
        example: ['javascript', 'react', 'nodejs']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RulePreviewDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of question IDs to exclude',
        example: ['qstn-1', 'qstn-2']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RulePreviewDto.prototype, "excludeQuestionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array of question IDs to include',
        example: ['qstn-3', 'qstn-4']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RulePreviewDto.prototype, "includeQuestionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Time range filter for questions',
        example: {
            from: '2024-01-01T00:00:00Z',
            to: '2024-12-31T23:59:59Z'
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RulePreviewDto.prototype, "timeRange", void 0);


/***/ }),

/***/ "./src/modules/questions/dto/update-question.dto.ts":
/*!**********************************************************!*\
  !*** ./src/modules/questions/dto/update-question.dto.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateQuestionDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const create_question_dto_1 = __webpack_require__(/*! ./create-question.dto */ "./src/modules/questions/dto/create-question.dto.ts");
class UpdateQuestionDto extends (0, swagger_1.PartialType)(create_question_dto_1.CreateQuestionDto) {
}
exports.UpdateQuestionDto = UpdateQuestionDto;


/***/ }),

/***/ "./src/modules/questions/entities/question-option.entity.ts":
/*!******************************************************************!*\
  !*** ./src/modules/questions/entities/question-option.entity.ts ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuestionOption = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const question_entity_1 = __webpack_require__(/*! ./question.entity */ "./src/modules/questions/entities/question.entity.ts");
let QuestionOption = class QuestionOption {
};
exports.QuestionOption = QuestionOption;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuestionOption.prototype, "questionOptionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], QuestionOption.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], QuestionOption.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], QuestionOption.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Option text content'
    }),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], QuestionOption.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Media URLs for the option',
        example: {
            image: "https://cdn.example.com/opt1.png",
            video: "https://cdn.example.com/opt2.mp4"
        }
    }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", typeof (_a = typeof question_entity_1.QuestionMedia !== "undefined" && question_entity_1.QuestionMedia) === "function" ? _a : Object)
], QuestionOption.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Text for matching (used in match questions)'
    }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], QuestionOption.prototype, "matchWith", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Media URLs for matching (used in match questions)',
        example: {
            image: "https://cdn.example.com/match1.png",
            video: "https://cdn.example.com/match2.mp4"
        }
    }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", typeof (_b = typeof question_entity_1.QuestionMedia !== "undefined" && question_entity_1.QuestionMedia) === "function" ? _b : Object)
], QuestionOption.prototype, "matchWithMedia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], QuestionOption.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], QuestionOption.prototype, "isCorrect", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuestionOption.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], QuestionOption.prototype, "blankIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], QuestionOption.prototype, "caseSensitive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], QuestionOption.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => question_entity_1.Question, question => question.options),
    (0, typeorm_1.JoinColumn)({ name: 'questionId' }),
    __metadata("design:type", typeof (_d = typeof question_entity_1.Question !== "undefined" && question_entity_1.Question) === "function" ? _d : Object)
], QuestionOption.prototype, "question", void 0);
exports.QuestionOption = QuestionOption = __decorate([
    (0, typeorm_1.Entity)('questionOptions')
], QuestionOption);


/***/ }),

/***/ "./src/modules/questions/entities/question.entity.ts":
/*!***********************************************************!*\
  !*** ./src/modules/questions/entities/question.entity.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Question = exports.GradingType = exports.QuestionStatus = exports.QuestionLevel = exports.QuestionType = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
var QuestionType;
(function (QuestionType) {
    QuestionType["MCQ"] = "mcq";
    QuestionType["MULTIPLE_ANSWER"] = "multiple_answer";
    QuestionType["TRUE_FALSE"] = "true_false";
    QuestionType["FILL_BLANK"] = "fill_blank";
    QuestionType["MATCH"] = "match";
    QuestionType["SUBJECTIVE"] = "subjective";
    QuestionType["ESSAY"] = "essay";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var QuestionLevel;
(function (QuestionLevel) {
    QuestionLevel["EASY"] = "easy";
    QuestionLevel["MEDIUM"] = "medium";
    QuestionLevel["HARD"] = "hard";
})(QuestionLevel || (exports.QuestionLevel = QuestionLevel = {}));
var QuestionStatus;
(function (QuestionStatus) {
    QuestionStatus["DRAFT"] = "draft";
    QuestionStatus["PUBLISHED"] = "published";
    QuestionStatus["ARCHIVED"] = "archived";
})(QuestionStatus || (exports.QuestionStatus = QuestionStatus = {}));
var GradingType;
(function (GradingType) {
    GradingType["QUIZ"] = "quiz";
    GradingType["EXERCISE"] = "exercise";
})(GradingType || (exports.GradingType = GradingType = {}));
let Question = class Question {
    get id() {
        return this.questionId;
    }
    get title() {
        return this.text || '';
    }
};
exports.Question = Question;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Question.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Question.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Question.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Question text content'
    }),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Question.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Media URLs for the question',
        example: {
            image: "https://cdn.example.com/question.png",
            video: "https://cdn.example.com/question.mp4"
        }
    }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Question.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Question.prototype, "alias", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Question.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Question.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: QuestionType }),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Question.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: QuestionLevel }),
    (0, typeorm_1.Column)({ type: 'text', default: QuestionLevel.MEDIUM }),
    __metadata("design:type", String)
], Question.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], Question.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: QuestionStatus }),
    (0, typeorm_1.Column)({ type: 'text', default: QuestionStatus.DRAFT }),
    __metadata("design:type", String)
], Question.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Question.prototype, "idealTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: GradingType }),
    (0, typeorm_1.Column)({ type: 'text', default: GradingType.QUIZ }),
    __metadata("design:type", String)
], Question.prototype, "gradingType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Question.prototype, "allowPartialScoring", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Question.prototype, "params", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Question.prototype, "checkedOut", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Question.prototype, "checkedOutTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Question.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Question.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Question.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Question.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('QuestionOption', 'question'),
    __metadata("design:type", Array)
], Question.prototype, "options", void 0);
exports.Question = Question = __decorate([
    (0, typeorm_1.Entity)('questions')
], Question);


/***/ }),

/***/ "./src/modules/questions/questions.controller.ts":
/*!*******************************************************!*\
  !*** ./src/modules/questions/questions.controller.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuestionsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const questions_service_1 = __webpack_require__(/*! ./questions.service */ "./src/modules/questions/questions.service.ts");
const create_question_dto_1 = __webpack_require__(/*! ./dto/create-question.dto */ "./src/modules/questions/dto/create-question.dto.ts");
const update_question_dto_1 = __webpack_require__(/*! ./dto/update-question.dto */ "./src/modules/questions/dto/update-question.dto.ts");
const query_question_dto_1 = __webpack_require__(/*! ./dto/query-question.dto */ "./src/modules/questions/dto/query-question.dto.ts");
const rule_preview_dto_1 = __webpack_require__(/*! ./dto/rule-preview.dto */ "./src/modules/questions/dto/rule-preview.dto.ts");
const api_response_dto_1 = __webpack_require__(/*! @/common/dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
const auth_context_interceptor_1 = __webpack_require__(/*! @/common/interceptors/auth-context.interceptor */ "./src/common/interceptors/auth-context.interceptor.ts");
let QuestionsController = class QuestionsController {
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    async create(createQuestionDto, req) {
        const authContext = req.user;
        const question = await this.questionsService.create(createQuestionDto, authContext);
        return { questionId: question.questionId };
    }
    async findAll(queryDto, req) {
        const authContext = req.user;
        return this.questionsService.findAll(queryDto, authContext);
    }
    async findOne(id, req) {
        const authContext = req.user;
        return this.questionsService.findOne(id, authContext);
    }
    async update(id, updateQuestionDto, req) {
        const authContext = req.user;
        const question = await this.questionsService.update(id, updateQuestionDto, authContext);
        return { questionId: question.questionId };
    }
    async remove(id, req) {
        const authContext = req.user;
        await this.questionsService.remove(id, authContext);
        return { message: 'Question deleted successfully' };
    }
    async getRulePreview(ruleCriteria, req) {
        const authContext = req.user;
        return this.questionsService.getQuestionsForRulePreview(ruleCriteria, authContext);
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new question' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Question created successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_question_dto_1.CreateQuestionDto !== "undefined" && create_question_dto_1.CreateQuestionDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all questions with pagination and filters' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Questions retrieved successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof query_question_dto_1.QueryQuestionDto !== "undefined" && query_question_dto_1.QueryQuestionDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a question by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Question retrieved successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a question' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Question updated successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof update_question_dto_1.UpdateQuestionDto !== "undefined" && update_question_dto_1.UpdateQuestionDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a question' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Question deleted successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('rule-preview'),
    (0, swagger_1.ApiOperation)({
        summary: 'Preview questions for rule criteria',
        description: 'Get questions and metadata based on rule criteria for UI preview'
    }),
    (0, swagger_1.ApiBody)({
        type: rule_preview_dto_1.RulePreviewDto,
        description: 'Rule criteria for filtering questions'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rule preview generated successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof rule_preview_dto_1.RulePreviewDto !== "undefined" && rule_preview_dto_1.RulePreviewDto) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "getRulePreview", null);
exports.QuestionsController = QuestionsController = __decorate([
    (0, swagger_1.ApiTags)('Questions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('questions'),
    (0, common_1.UseInterceptors)(auth_context_interceptor_1.AuthContextInterceptor),
    __metadata("design:paramtypes", [typeof (_a = typeof questions_service_1.QuestionsService !== "undefined" && questions_service_1.QuestionsService) === "function" ? _a : Object])
], QuestionsController);


/***/ }),

/***/ "./src/modules/questions/questions.module.ts":
/*!***************************************************!*\
  !*** ./src/modules/questions/questions.module.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuestionsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const questions_controller_1 = __webpack_require__(/*! ./questions.controller */ "./src/modules/questions/questions.controller.ts");
const questions_service_1 = __webpack_require__(/*! ./questions.service */ "./src/modules/questions/questions.service.ts");
const question_entity_1 = __webpack_require__(/*! ./entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
const question_option_entity_1 = __webpack_require__(/*! ./entities/question-option.entity */ "./src/modules/questions/entities/question-option.entity.ts");
let QuestionsModule = class QuestionsModule {
};
exports.QuestionsModule = QuestionsModule;
exports.QuestionsModule = QuestionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([question_entity_1.Question, question_option_entity_1.QuestionOption]),
        ],
        controllers: [questions_controller_1.QuestionsController],
        providers: [questions_service_1.QuestionsService],
        exports: [questions_service_1.QuestionsService],
    })
], QuestionsModule);


/***/ }),

/***/ "./src/modules/questions/questions.service.ts":
/*!****************************************************!*\
  !*** ./src/modules/questions/questions.service.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuestionsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const cache_manager_1 = __webpack_require__(/*! @nestjs/cache-manager */ "@nestjs/cache-manager");
const common_2 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const cache_manager_2 = __webpack_require__(/*! cache-manager */ "cache-manager");
const question_entity_1 = __webpack_require__(/*! ./entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
const question_option_entity_1 = __webpack_require__(/*! ./entities/question-option.entity */ "./src/modules/questions/entities/question-option.entity.ts");
let QuestionsService = class QuestionsService {
    constructor(questionRepository, questionOptionRepository, cacheManager) {
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.cacheManager = cacheManager;
    }
    async create(createQuestionDto, authContext) {
        const { options, ...questionData } = createQuestionDto;
        this.validateQuestionOptions(createQuestionDto.type, options);
        const question = this.questionRepository.create({
            ...questionData,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            createdBy: authContext.userId,
        });
        const savedQuestion = await this.questionRepository.save(question);
        if (options && options.length > 0) {
            const questionOptions = options.map(optionData => this.questionOptionRepository.create({
                ...optionData,
                questionId: savedQuestion.questionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            }));
            await this.questionOptionRepository.save(questionOptions);
        }
        await this.invalidateQuestionCache(authContext.tenantId);
        return this.findOne(savedQuestion.questionId, authContext);
    }
    async findAll(queryDto, authContext) {
        const cacheKey = `questions:${authContext.tenantId}:${JSON.stringify(queryDto)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const { limit = 10, offset = 0, search, status, type, level, categoryId, minMarks, maxMarks, categories, difficultyLevels, questionTypes, tags, marks, excludeQuestionIds, includeQuestionIds, timeRangeFrom, timeRangeTo, rulePreview, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
        const queryBuilder = this.questionRepository
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.options', 'options')
            .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId });
        if (search) {
            queryBuilder.andWhere('(question.text ILIKE :search OR question.description ILIKE :search)', { search: `%${search}%` });
        }
        if (status) {
            queryBuilder.andWhere('question.status = :status', { status });
        }
        if (type) {
            queryBuilder.andWhere('question.type = :type', { type });
        }
        if (level) {
            queryBuilder.andWhere('question.level = :level', { level });
        }
        if (categoryId) {
            queryBuilder.andWhere('question.categoryId = :categoryId', { categoryId });
        }
        if (categories && categories.length > 0) {
            queryBuilder.andWhere('question.categoryId IN (:...categories)', { categories });
        }
        if (difficultyLevels && difficultyLevels.length > 0) {
            queryBuilder.andWhere('question.level IN (:...difficultyLevels)', { difficultyLevels });
        }
        if (questionTypes && questionTypes.length > 0) {
            queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes });
        }
        if (tags && tags.length > 0) {
            queryBuilder.andWhere('question.tags @> :tags', { tags: JSON.stringify(tags) });
        }
        if (marks && marks.length > 0) {
            queryBuilder.andWhere('question.marks IN (:...marks)', { marks });
        }
        if (minMarks !== undefined || maxMarks !== undefined) {
            if (minMarks !== undefined && maxMarks !== undefined) {
                queryBuilder.andWhere('question.marks BETWEEN :minMarks AND :maxMarks', { minMarks, maxMarks });
            }
            else if (minMarks !== undefined) {
                queryBuilder.andWhere('question.marks >= :minMarks', { minMarks });
            }
            else if (maxMarks !== undefined) {
                queryBuilder.andWhere('question.marks <= :maxMarks', { maxMarks });
            }
        }
        if (excludeQuestionIds && excludeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId NOT IN (:...excludeQuestionIds)', { excludeQuestionIds });
        }
        if (includeQuestionIds && includeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId IN (:...includeQuestionIds)', { includeQuestionIds });
        }
        if (timeRangeFrom || timeRangeTo) {
            if (timeRangeFrom && timeRangeTo) {
                queryBuilder.andWhere('question.createdAt BETWEEN :timeRangeFrom AND :timeRangeTo', {
                    timeRangeFrom: new Date(timeRangeFrom),
                    timeRangeTo: new Date(timeRangeTo)
                });
            }
            else if (timeRangeFrom) {
                queryBuilder.andWhere('question.createdAt >= :timeRangeFrom', {
                    timeRangeFrom: new Date(timeRangeFrom)
                });
            }
            else if (timeRangeTo) {
                queryBuilder.andWhere('question.createdAt <= :timeRangeTo', {
                    timeRangeTo: new Date(timeRangeTo)
                });
            }
        }
        if (rulePreview === 'true') {
            queryBuilder.andWhere('question.status = :publishedStatus', { publishedStatus: 'published' });
        }
        const total = await queryBuilder.getCount();
        queryBuilder
            .orderBy(`question.${sortBy}`, sortOrder)
            .skip(offset)
            .take(limit);
        const questions = await queryBuilder.getMany();
        const result = {
            content: questions,
            totalElements: total,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(offset / limit) + 1,
            size: limit,
            ...(rulePreview === 'true' && {
                metadata: {
                    totalQuestions: total,
                    availableForRules: total,
                    rulePreviewMode: true
                }
            })
        };
        await this.cacheManager.set(cacheKey, result, 86400);
        return result;
    }
    async findOne(id, authContext) {
        const question = await this.questionRepository.findOne({
            where: {
                questionId: id,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            relations: ['options'],
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        return question;
    }
    async update(id, updateQuestionDto, authContext) {
        const question = await this.findOne(id, authContext);
        const { options, ...questionData } = updateQuestionDto;
        if (questionData.type && questionData.type !== question.type) {
            this.validateQuestionOptions(questionData.type, options);
        }
        else if (options !== undefined) {
            this.validateQuestionOptions(question.type, options);
        }
        Object.assign(question, {
            ...questionData,
            updatedBy: authContext.userId,
        });
        const updatedQuestion = await this.questionRepository.save(question);
        if (options) {
            await this.questionOptionRepository.delete({ questionId: id });
            if (options.length > 0) {
                const questionOptions = options.map(optionData => this.questionOptionRepository.create({
                    ...optionData,
                    questionId: id,
                    tenantId: authContext.tenantId,
                    organisationId: authContext.organisationId,
                }));
                await this.questionOptionRepository.save(questionOptions);
            }
        }
        await this.invalidateQuestionCache(authContext.tenantId);
        return this.findOne(id, authContext);
    }
    async remove(id, authContext) {
        const question = await this.findOne(id, authContext);
        await this.questionOptionRepository.delete({ questionId: id });
        await this.questionRepository.remove(question);
        await this.invalidateQuestionCache(authContext.tenantId);
    }
    async invalidateQuestionCache(tenantId) {
        try {
            await this.cacheManager.set(`question_cache_invalidated:${tenantId}`, Date.now(), 86400);
        }
        catch (error) {
            console.warn('Failed to invalidate question cache:', error);
        }
    }
    async getQuestionsForRulePreview(ruleCriteria, authContext) {
        const cacheKey = `rule_preview:${authContext.tenantId}:${JSON.stringify(ruleCriteria)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const queryBuilder = this.questionRepository
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.options', 'options')
            .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
            .andWhere('question.status = :status', { status: 'published' });
        if (ruleCriteria.categories && ruleCriteria.categories.length > 0) {
            queryBuilder.andWhere('question.categoryId IN (:...categories)', { categories: ruleCriteria.categories });
        }
        if (ruleCriteria.difficultyLevels && ruleCriteria.difficultyLevels.length > 0) {
            queryBuilder.andWhere('question.level IN (:...difficultyLevels)', { difficultyLevels: ruleCriteria.difficultyLevels });
        }
        if (ruleCriteria.questionTypes && ruleCriteria.questionTypes.length > 0) {
            queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes: ruleCriteria.questionTypes });
        }
        if (ruleCriteria.marks && ruleCriteria.marks.length > 0) {
            queryBuilder.andWhere('question.marks IN (:...marks)', { marks: ruleCriteria.marks });
        }
        if (ruleCriteria.tags && ruleCriteria.tags.length > 0) {
            queryBuilder.andWhere('question.tags @> :tags', { tags: JSON.stringify(ruleCriteria.tags) });
        }
        if (ruleCriteria.excludeQuestionIds && ruleCriteria.excludeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId NOT IN (:...excludeQuestionIds)', { excludeQuestionIds: ruleCriteria.excludeQuestionIds });
        }
        if (ruleCriteria.includeQuestionIds && ruleCriteria.includeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId IN (:...includeQuestionIds)', { includeQuestionIds: ruleCriteria.includeQuestionIds });
        }
        if (ruleCriteria.timeRange) {
            queryBuilder.andWhere('question.createdAt BETWEEN :fromDate AND :toDate', {
                fromDate: ruleCriteria.timeRange.from,
                toDate: ruleCriteria.timeRange.to,
            });
        }
        const questions = await queryBuilder.getMany();
        const totalQuestions = questions.length;
        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        const marksDistribution = questions.reduce((acc, q) => {
            acc[q.marks] = (acc[q.marks] || 0) + 1;
            return acc;
        }, {});
        const result = {
            questions,
            metadata: {
                totalQuestions,
                totalMarks,
                marksDistribution,
                averageMarks: totalQuestions > 0 ? (totalMarks / totalQuestions).toFixed(2) : 0,
                questionTypes: questions.reduce((acc, q) => {
                    acc[q.type] = (acc[q.type] || 0) + 1;
                    return acc;
                }, {}),
                difficultyLevels: questions.reduce((acc, q) => {
                    acc[q.level] = (acc[q.level] || 0) + 1;
                    return acc;
                }, {}),
                categories: questions.reduce((acc, q) => {
                    if (q.categoryId) {
                        acc[q.categoryId] = (acc[q.categoryId] || 0) + 1;
                    }
                    return acc;
                }, {})
            }
        };
        await this.cacheManager.set(cacheKey, result, 1800);
        return result;
    }
    validateQuestionOptions(type, options) {
        if (type !== question_entity_1.QuestionType.SUBJECTIVE && type !== question_entity_1.QuestionType.ESSAY) {
            if (!options || options.length === 0) {
                throw new common_1.BadRequestException(`Options are mandatory for question type '${type}'. Please provide at least one option.`);
            }
            options.forEach((option, index) => {
                if (!option.text || option.text.trim().length === 0) {
                    throw new common_1.BadRequestException(`Option ${index + 1} must have a non-empty text.`);
                }
                if (typeof option.isCorrect !== 'boolean') {
                    throw new common_1.BadRequestException(`Option ${index + 1} must have a valid isCorrect boolean value.`);
                }
            });
            switch (type) {
                case question_entity_1.QuestionType.MCQ:
                case question_entity_1.QuestionType.TRUE_FALSE:
                    const correctOptions = options.filter(option => option.isCorrect);
                    if (correctOptions.length !== 1) {
                        throw new common_1.BadRequestException(`${type} questions must have exactly one correct answer.`);
                    }
                    break;
                case question_entity_1.QuestionType.MULTIPLE_ANSWER:
                    const multipleCorrectOptions = options.filter(option => option.isCorrect);
                    if (multipleCorrectOptions.length === 0) {
                        throw new common_1.BadRequestException('Multiple answer questions must have at least one correct answer.');
                    }
                    break;
                case question_entity_1.QuestionType.FILL_BLANK:
                    const optionsWithBlankIndex = options.filter(option => option.blankIndex !== undefined);
                    if (optionsWithBlankIndex.length === 0) {
                        throw new common_1.BadRequestException('Fill in the blank questions must have options with blankIndex specified.');
                    }
                    break;
                case question_entity_1.QuestionType.MATCH:
                    const optionsWithMatch = options.filter(option => option.matchWith &&
                        option.matchWith.trim().length > 0);
                    if (optionsWithMatch.length === 0) {
                        throw new common_1.BadRequestException('Matching questions must have options with matchWith specified.');
                    }
                    break;
            }
        }
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(1, (0, typeorm_1.InjectRepository)(question_option_entity_1.QuestionOption)),
    __param(2, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof cache_manager_2.Cache !== "undefined" && cache_manager_2.Cache) === "function" ? _c : Object])
], QuestionsService);


/***/ }),

/***/ "./src/modules/tests/dto/add-question-to-test.dto.ts":
/*!***********************************************************!*\
  !*** ./src/modules/tests/dto/add-question-to-test.dto.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AddQuestionToTestDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class AddQuestionToTestDto {
}
exports.AddQuestionToTestDto = AddQuestionToTestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the section where the question will be added',
        example: 'section-123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddQuestionToTestDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the question to add to the test section',
        example: 'question-123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddQuestionToTestDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether this question is compulsory (optional)',
        example: false,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddQuestionToTestDto.prototype, "isCompulsory", void 0);


/***/ }),

/***/ "./src/modules/tests/dto/add-questions-bulk.dto.ts":
/*!*********************************************************!*\
  !*** ./src/modules/tests/dto/add-questions-bulk.dto.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AddQuestionsBulkDto = exports.QuestionToAddDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
class QuestionToAddDto {
}
exports.QuestionToAddDto = QuestionToAddDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the question to add to the test section',
        example: 'question-123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuestionToAddDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ordering position of the question in the section (optional)',
        example: 1,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QuestionToAddDto.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether this question is compulsory (optional)',
        example: false,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuestionToAddDto.prototype, "isCompulsory", void 0);
class AddQuestionsBulkDto {
}
exports.AddQuestionsBulkDto = AddQuestionsBulkDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the section where the questions will be added',
        example: 'section-123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddQuestionsBulkDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of questions to add to the test section',
        type: [QuestionToAddDto],
        example: [
            {
                questionId: 'question-123e4567-e89b-12d3-a456-426614174000',
                ordering: 1,
                isCompulsory: false
            },
            {
                questionId: 'question-456e7890-e89b-12d3-a456-426614174001',
                ordering: 2,
                isCompulsory: true
            }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'At least one question must be provided' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuestionToAddDto),
    __metadata("design:type", Array)
], AddQuestionsBulkDto.prototype, "questions", void 0);


/***/ }),

/***/ "./src/modules/tests/dto/create-rule.dto.ts":
/*!**************************************************!*\
  !*** ./src/modules/tests/dto/create-rule.dto.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateRuleDto = exports.RuleCriteriaDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const test_rule_entity_1 = __webpack_require__(/*! ../entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
const test_entity_1 = __webpack_require__(/*! ../entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
class RuleCriteriaDto {
}
exports.RuleCriteriaDto = RuleCriteriaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RuleCriteriaDto.prototype, "categories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RuleCriteriaDto.prototype, "difficultyLevels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RuleCriteriaDto.prototype, "questionTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RuleCriteriaDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], RuleCriteriaDto.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], RuleCriteriaDto.prototype, "excludeQuestionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], RuleCriteriaDto.prototype, "includeQuestionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RuleCriteriaDto.prototype, "timeRange", void 0);
class CreateRuleDto {
}
exports.CreateRuleDto = CreateRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: test_rule_entity_1.RuleType }),
    (0, class_validator_1.IsEnum)(test_rule_entity_1.RuleType),
    __metadata("design:type", typeof (_a = typeof test_rule_entity_1.RuleType !== "undefined" && test_rule_entity_1.RuleType) === "function" ? _a : Object)
], CreateRuleDto.prototype, "ruleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "testId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRuleDto.prototype, "numberOfQuestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRuleDto.prototype, "poolSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRuleDto.prototype, "minMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRuleDto.prototype, "maxMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: test_rule_entity_1.SelectionStrategy }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(test_rule_entity_1.SelectionStrategy),
    __metadata("design:type", typeof (_b = typeof test_rule_entity_1.SelectionStrategy !== "undefined" && test_rule_entity_1.SelectionStrategy) === "function" ? _b : Object)
], CreateRuleDto.prototype, "selectionStrategy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RuleCriteriaDto),
    __metadata("design:type", RuleCriteriaDto)
], CreateRuleDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: test_entity_1.TestStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(test_entity_1.TestStatus),
    __metadata("design:type", typeof (_c = typeof test_entity_1.TestStatus !== "undefined" && test_entity_1.TestStatus) === "function" ? _c : Object)
], CreateRuleDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRuleDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['PRESELECTED', 'DYNAMIC'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['PRESELECTED', 'DYNAMIC']),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "selectionMode", void 0);


/***/ }),

/***/ "./src/modules/tests/dto/create-section.dto.ts":
/*!*****************************************************!*\
  !*** ./src/modules/tests/dto/create-section.dto.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateSectionDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class CreateSectionDto {
}
exports.CreateSectionDto = CreateSectionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSectionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSectionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSectionDto.prototype, "testId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSectionDto.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSectionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSectionDto.prototype, "minQuestions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSectionDto.prototype, "maxQuestions", void 0);


/***/ }),

/***/ "./src/modules/tests/dto/create-test.dto.ts":
/*!**************************************************!*\
  !*** ./src/modules/tests/dto/create-test.dto.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateTestDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const test_entity_1 = __webpack_require__(/*! ../entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
class CreateTestDto {
}
exports.CreateTestDto = CreateTestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: test_entity_1.TestType }),
    (0, class_validator_1.IsEnum)(test_entity_1.TestType),
    __metadata("design:type", typeof (_a = typeof test_entity_1.TestType !== "undefined" && test_entity_1.TestType) === "function" ? _a : Object)
], CreateTestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "alias", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "reviewers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: test_entity_1.TestStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(test_entity_1.TestStatus),
    __metadata("design:type", typeof (_b = typeof test_entity_1.TestStatus !== "undefined" && test_entity_1.TestStatus) === "function" ? _b : Object)
], CreateTestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "showTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "timeDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "showTimeFinished", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "timeFinishedDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "totalMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "passingMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "answerSheet", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "showCorrectAnswer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "printAnswersheet", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "questionsShuffle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "answersShuffle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: test_entity_1.GradingType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(test_entity_1.GradingType),
    __metadata("design:type", typeof (_c = typeof test_entity_1.GradingType !== "undefined" && test_entity_1.GradingType) === "function" ? _c : Object)
], CreateTestDto.prototype, "gradingType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "isObjective", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "showThankyouPage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "showAllQuestions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "paginationLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestDto.prototype, "showQuestionsOverview", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "attempts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "attemptsGrading", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "checkedOut", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "checkedOutTime", void 0);


/***/ }),

/***/ "./src/modules/tests/dto/query-test.dto.ts":
/*!*************************************************!*\
  !*** ./src/modules/tests/dto/query-test.dto.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueryTestDto = exports.SortOrder = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const class_transformer_1 = __webpack_require__(/*! class-transformer */ "class-transformer");
const test_entity_1 = __webpack_require__(/*! ../entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const base_dto_1 = __webpack_require__(/*! @/common/dto/base.dto */ "./src/common/dto/base.dto.ts");
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "ASC";
    SortOrder["DESC"] = "DESC";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class QueryTestDto extends base_dto_1.PaginationDto {
}
exports.QueryTestDto = QueryTestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryTestDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: test_entity_1.TestStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(test_entity_1.TestStatus),
    __metadata("design:type", typeof (_a = typeof test_entity_1.TestStatus !== "undefined" && test_entity_1.TestStatus) === "function" ? _a : Object)
], QueryTestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryTestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryTestDto.prototype, "minMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryTestDto.prototype, "maxMarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryTestDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortOrder),
    __metadata("design:type", String)
], QueryTestDto.prototype, "sortOrder", void 0);


/***/ }),

/***/ "./src/modules/tests/dto/update-rule.dto.ts":
/*!**************************************************!*\
  !*** ./src/modules/tests/dto/update-rule.dto.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateRuleDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const create_rule_dto_1 = __webpack_require__(/*! ./create-rule.dto */ "./src/modules/tests/dto/create-rule.dto.ts");
class UpdateRuleDto extends (0, swagger_1.PartialType)(create_rule_dto_1.CreateRuleDto) {
}
exports.UpdateRuleDto = UpdateRuleDto;


/***/ }),

/***/ "./src/modules/tests/dto/update-section.dto.ts":
/*!*****************************************************!*\
  !*** ./src/modules/tests/dto/update-section.dto.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateSectionDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
class UpdateSectionDto {
}
exports.UpdateSectionDto = UpdateSectionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSectionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSectionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateSectionDto.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSectionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateSectionDto.prototype, "minQuestions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateSectionDto.prototype, "maxQuestions", void 0);


/***/ }),

/***/ "./src/modules/tests/dto/update-test.dto.ts":
/*!**************************************************!*\
  !*** ./src/modules/tests/dto/update-test.dto.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateTestDto = void 0;
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const create_test_dto_1 = __webpack_require__(/*! ./create-test.dto */ "./src/modules/tests/dto/create-test.dto.ts");
class UpdateTestDto extends (0, swagger_1.PartialType)(create_test_dto_1.CreateTestDto) {
}
exports.UpdateTestDto = UpdateTestDto;


/***/ }),

/***/ "./src/modules/tests/entities/test-attempt.entity.ts":
/*!***********************************************************!*\
  !*** ./src/modules/tests/entities/test-attempt.entity.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestAttempt = exports.ResultType = exports.SubmissionType = exports.ReviewStatus = exports.AttemptStatus = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const test_entity_1 = __webpack_require__(/*! ./test.entity */ "./src/modules/tests/entities/test.entity.ts");
var AttemptStatus;
(function (AttemptStatus) {
    AttemptStatus["IN_PROGRESS"] = "I";
    AttemptStatus["SUBMITTED"] = "S";
})(AttemptStatus || (exports.AttemptStatus = AttemptStatus = {}));
var ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["PENDING"] = "P";
    ReviewStatus["UNDER_REVIEW"] = "U";
    ReviewStatus["REVIEWED"] = "R";
    ReviewStatus["NOT_APPLICABLE"] = "N";
})(ReviewStatus || (exports.ReviewStatus = ReviewStatus = {}));
var SubmissionType;
(function (SubmissionType) {
    SubmissionType["SELF"] = "self";
    SubmissionType["AUTO"] = "auto";
})(SubmissionType || (exports.SubmissionType = SubmissionType = {}));
var ResultType;
(function (ResultType) {
    ResultType["PASS"] = "P";
    ResultType["FAIL"] = "F";
})(ResultType || (exports.ResultType = ResultType = {}));
let TestAttempt = class TestAttempt {
};
exports.TestAttempt = TestAttempt;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestAttempt.prototype, "attemptId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestAttempt.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestAttempt.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestAttempt.prototype, "testId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestAttempt.prototype, "resolvedTestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestAttempt.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], TestAttempt.prototype, "attempt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TestAttempt.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TestAttempt.prototype, "submittedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AttemptStatus }),
    (0, typeorm_1.Column)({ type: 'text', default: AttemptStatus.IN_PROGRESS }),
    __metadata("design:type", String)
], TestAttempt.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReviewStatus }),
    (0, typeorm_1.Column)({ type: 'text', default: ReviewStatus.NOT_APPLICABLE }),
    __metadata("design:type", String)
], TestAttempt.prototype, "reviewStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TestAttempt.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SubmissionType }),
    (0, typeorm_1.Column)({ type: 'varchar', default: SubmissionType.SELF }),
    __metadata("design:type", String)
], TestAttempt.prototype, "submissionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ResultType, required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestAttempt.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TestAttempt.prototype, "currentPosition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TestAttempt.prototype, "timeSpent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestAttempt.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], TestAttempt.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_entity_1.Test, test => test.attempts),
    (0, typeorm_1.JoinColumn)({ name: 'testId' }),
    __metadata("design:type", typeof (_d = typeof test_entity_1.Test !== "undefined" && test_entity_1.Test) === "function" ? _d : Object)
], TestAttempt.prototype, "test", void 0);
exports.TestAttempt = TestAttempt = __decorate([
    (0, typeorm_1.Entity)('testAttempts')
], TestAttempt);


/***/ }),

/***/ "./src/modules/tests/entities/test-question.entity.ts":
/*!************************************************************!*\
  !*** ./src/modules/tests/entities/test-question.entity.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestQuestion = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const test_entity_1 = __webpack_require__(/*! ./test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_section_entity_1 = __webpack_require__(/*! ./test-section.entity */ "./src/modules/tests/entities/test-section.entity.ts");
let TestQuestion = class TestQuestion {
};
exports.TestQuestion = TestQuestion;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestQuestion.prototype, "testQuestionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestQuestion.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestQuestion.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestQuestion.prototype, "testId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestQuestion.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], TestQuestion.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestQuestion.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestQuestion.prototype, "ruleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TestQuestion.prototype, "isCompulsory", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_entity_1.Test, test => test.questions),
    (0, typeorm_1.JoinColumn)({ name: 'testId' }),
    __metadata("design:type", typeof (_a = typeof test_entity_1.Test !== "undefined" && test_entity_1.Test) === "function" ? _a : Object)
], TestQuestion.prototype, "test", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_section_entity_1.TestSection, section => section.questions),
    (0, typeorm_1.JoinColumn)({ name: 'sectionId' }),
    __metadata("design:type", typeof (_b = typeof test_section_entity_1.TestSection !== "undefined" && test_section_entity_1.TestSection) === "function" ? _b : Object)
], TestQuestion.prototype, "section", void 0);
exports.TestQuestion = TestQuestion = __decorate([
    (0, typeorm_1.Entity)('testQuestions')
], TestQuestion);


/***/ }),

/***/ "./src/modules/tests/entities/test-rule.entity.ts":
/*!********************************************************!*\
  !*** ./src/modules/tests/entities/test-rule.entity.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestRule = exports.SelectionStrategy = exports.RuleType = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const test_entity_1 = __webpack_require__(/*! ./test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_section_entity_1 = __webpack_require__(/*! ./test-section.entity */ "./src/modules/tests/entities/test-section.entity.ts");
var RuleType;
(function (RuleType) {
    RuleType["CATEGORY_BASED"] = "category_based";
    RuleType["DIFFICULTY_BASED"] = "difficulty_based";
    RuleType["TYPE_BASED"] = "type_based";
    RuleType["MIXED"] = "mixed";
})(RuleType || (exports.RuleType = RuleType = {}));
var SelectionStrategy;
(function (SelectionStrategy) {
    SelectionStrategy["RANDOM"] = "random";
    SelectionStrategy["SEQUENTIAL"] = "sequential";
    SelectionStrategy["WEIGHTED"] = "weighted";
})(SelectionStrategy || (exports.SelectionStrategy = SelectionStrategy = {}));
let TestRule = class TestRule {
};
exports.TestRule = TestRule;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestRule.prototype, "ruleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestRule.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestRule.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TestRule.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestRule.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: RuleType }),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TestRule.prototype, "ruleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestRule.prototype, "testId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestRule.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], TestRule.prototype, "numberOfQuestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], TestRule.prototype, "poolSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TestRule.prototype, "minMarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TestRule.prototype, "maxMarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SelectionStrategy }),
    (0, typeorm_1.Column)({ type: 'text', default: SelectionStrategy.RANDOM }),
    __metadata("design:type", String)
], TestRule.prototype, "selectionStrategy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], TestRule.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['PRESELECTED', 'DYNAMIC'], description: 'PRESELECTED: Use pre-saved questions from testQuestions table, DYNAMIC: Query questions table during attempt' }),
    (0, typeorm_1.Column)({ type: 'enum', enum: ['PRESELECTED', 'DYNAMIC'], default: 'DYNAMIC' }),
    __metadata("design:type", String)
], TestRule.prototype, "selectionMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TestRule.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], TestRule.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestRule.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TestRule.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestRule.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TestRule.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_entity_1.Test, test => test.testId),
    (0, typeorm_1.JoinColumn)({ name: 'testId' }),
    __metadata("design:type", typeof (_c = typeof test_entity_1.Test !== "undefined" && test_entity_1.Test) === "function" ? _c : Object)
], TestRule.prototype, "test", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_section_entity_1.TestSection, section => section.sectionId),
    (0, typeorm_1.JoinColumn)({ name: 'sectionId' }),
    __metadata("design:type", typeof (_d = typeof test_section_entity_1.TestSection !== "undefined" && test_section_entity_1.TestSection) === "function" ? _d : Object)
], TestRule.prototype, "section", void 0);
exports.TestRule = TestRule = __decorate([
    (0, typeorm_1.Entity)('testRules')
], TestRule);


/***/ }),

/***/ "./src/modules/tests/entities/test-section.entity.ts":
/*!***********************************************************!*\
  !*** ./src/modules/tests/entities/test-section.entity.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestSection = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const test_entity_1 = __webpack_require__(/*! ./test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_question_entity_1 = __webpack_require__(/*! ./test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
let TestSection = class TestSection {
    get id() {
        return this.sectionId;
    }
};
exports.TestSection = TestSection;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestSection.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestSection.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestSection.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TestSection.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestSection.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestSection.prototype, "testId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], TestSection.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'text', default: 'active' }),
    __metadata("design:type", String)
], TestSection.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TestSection.prototype, "minQuestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TestSection.prototype, "maxQuestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestSection.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TestSection.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestSection.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TestSection.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_entity_1.Test, test => test.sections),
    (0, typeorm_1.JoinColumn)({ name: 'testId' }),
    __metadata("design:type", typeof (_c = typeof test_entity_1.Test !== "undefined" && test_entity_1.Test) === "function" ? _c : Object)
], TestSection.prototype, "test", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_question_entity_1.TestQuestion, question => question.section),
    __metadata("design:type", Array)
], TestSection.prototype, "questions", void 0);
exports.TestSection = TestSection = __decorate([
    (0, typeorm_1.Entity)('testSections')
], TestSection);


/***/ }),

/***/ "./src/modules/tests/entities/test-user-answer.entity.ts":
/*!***************************************************************!*\
  !*** ./src/modules/tests/entities/test-user-answer.entity.ts ***!
  \***************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestUserAnswer = exports.ReviewStatus = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const test_attempt_entity_1 = __webpack_require__(/*! ./test-attempt.entity */ "./src/modules/tests/entities/test-attempt.entity.ts");
var ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["PENDING"] = "P";
    ReviewStatus["REVIEWED"] = "R";
})(ReviewStatus || (exports.ReviewStatus = ReviewStatus = {}));
let TestUserAnswer = class TestUserAnswer {
};
exports.TestUserAnswer = TestUserAnswer;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "attemptAnsId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "attemptId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TestUserAnswer.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "reviewedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReviewStatus }),
    (0, typeorm_1.Column)({ type: 'text', default: ReviewStatus.PENDING }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "reviewStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TestUserAnswer.prototype, "reviewedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "remarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "anssOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TestUserAnswer.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestUserAnswer.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], TestUserAnswer.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_attempt_entity_1.TestAttempt, attempt => attempt.attemptId),
    (0, typeorm_1.JoinColumn)({ name: 'attemptId' }),
    __metadata("design:type", typeof (_d = typeof test_attempt_entity_1.TestAttempt !== "undefined" && test_attempt_entity_1.TestAttempt) === "function" ? _d : Object)
], TestUserAnswer.prototype, "attempt", void 0);
exports.TestUserAnswer = TestUserAnswer = __decorate([
    (0, typeorm_1.Entity)('testUserAnswers')
], TestUserAnswer);


/***/ }),

/***/ "./src/modules/tests/entities/test.entity.ts":
/*!***************************************************!*\
  !*** ./src/modules/tests/entities/test.entity.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Test = exports.GradingType = exports.TestStatus = exports.TestType = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const test_section_entity_1 = __webpack_require__(/*! ./test-section.entity */ "./src/modules/tests/entities/test-section.entity.ts");
const test_question_entity_1 = __webpack_require__(/*! ./test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
const test_attempt_entity_1 = __webpack_require__(/*! ./test-attempt.entity */ "./src/modules/tests/entities/test-attempt.entity.ts");
var TestType;
(function (TestType) {
    TestType["PLAIN"] = "plain";
    TestType["RULE_BASED"] = "rule_based";
    TestType["GENERATED"] = "generated";
})(TestType || (exports.TestType = TestType = {}));
var TestStatus;
(function (TestStatus) {
    TestStatus["DRAFT"] = "draft";
    TestStatus["PUBLISHED"] = "published";
    TestStatus["UNPUBLISHED"] = "unpublished";
    TestStatus["ARCHIVED"] = "archived";
})(TestStatus || (exports.TestStatus = TestStatus = {}));
var GradingType;
(function (GradingType) {
    GradingType["QUIZ"] = "quiz";
    GradingType["ASSIGNMENT"] = "assignment";
    GradingType["FEEDBACK"] = "feedback";
})(GradingType || (exports.GradingType = GradingType = {}));
let Test = class Test {
    get id() {
        return this.testId;
    }
};
exports.Test = Test;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Test.prototype, "testId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TestType }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Test.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Test.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Test.prototype, "organisationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Test.prototype, "ordering", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], Test.prototype, "attempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "attemptsGrading", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TestStatus }),
    (0, typeorm_1.Column)({ type: 'text', default: TestStatus.DRAFT }),
    __metadata("design:type", String)
], Test.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Test.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "alias", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "reviewers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "showTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Test.prototype, "timeDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "showTimeFinished", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Test.prototype, "timeFinishedDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Test.prototype, "totalMarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Test.prototype, "passingMarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Test.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Test.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "answerSheet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "showCorrectAnswer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "printAnswersheet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "questionsShuffle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "answersShuffle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: GradingType }),
    (0, typeorm_1.Column)({ type: 'text', default: GradingType.QUIZ }),
    __metadata("design:type", String)
], Test.prototype, "gradingType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "isObjective", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "showThankyouPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "showAllQuestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Test.prototype, "paginationLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Test.prototype, "showQuestionsOverview", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "checkedOut", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Test.prototype, "checkedOutTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Test.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Test.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Test.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_section_entity_1.TestSection, (section) => section.test),
    __metadata("design:type", Array)
], Test.prototype, "sections", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_question_entity_1.TestQuestion, (question) => question.test),
    __metadata("design:type", Array)
], Test.prototype, "questions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_attempt_entity_1.TestAttempt, (attempt) => attempt.test),
    __metadata("design:type", Array)
], Test.prototype, "testAttempts", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Test, test => test.testId),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", Test)
], Test.prototype, "parent", void 0);
exports.Test = Test = __decorate([
    (0, typeorm_1.Entity)('tests')
], Test);


/***/ }),

/***/ "./src/modules/tests/question-pool.service.ts":
/*!****************************************************!*\
  !*** ./src/modules/tests/question-pool.service.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QuestionPoolService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const test_question_entity_1 = __webpack_require__(/*! ./entities/test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
const test_rule_entity_1 = __webpack_require__(/*! ./entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
const question_entity_1 = __webpack_require__(/*! ../questions/entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
let QuestionPoolService = class QuestionPoolService {
    constructor(testQuestionRepository, testRuleRepository, questionRepository) {
        this.testQuestionRepository = testQuestionRepository;
        this.testRuleRepository = testRuleRepository;
        this.questionRepository = questionRepository;
    }
    async generateQuestionPool(ruleId, authContext) {
        const rule = await this.testRuleRepository.findOne({
            where: {
                ruleId: ruleId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
                isActive: true,
            },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Rule not found or inactive');
        }
        const questions = await this.findQuestionsByCriteria(rule.criteria, authContext);
        if (questions.length < rule.numberOfQuestions) {
            throw new Error(`Not enough questions available. Found ${questions.length}, required ${rule.numberOfQuestions}`);
        }
        const selectedQuestions = this.selectQuestions(questions, rule.numberOfQuestions, rule.selectionStrategy);
        return selectedQuestions;
    }
    async findQuestionsByCriteria(criteria, authContext) {
        const queryBuilder = this.questionRepository
            .createQueryBuilder('question')
            .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
            .andWhere('question.status = :status', { status: 'published' });
        if (criteria.categories && criteria.categories.length > 0) {
            queryBuilder.andWhere('question.categoryId IN (:...categories)', { categories: criteria.categories });
        }
        if (criteria.difficultyLevels && criteria.difficultyLevels.length > 0) {
            queryBuilder.andWhere('question.level IN (:...difficultyLevels)', { difficultyLevels: criteria.difficultyLevels });
        }
        if (criteria.questionTypes && criteria.questionTypes.length > 0) {
            queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes: criteria.questionTypes });
        }
        if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId NOT IN (:...excludeQuestionIds)', { excludeQuestionIds: criteria.excludeQuestionIds });
        }
        if (criteria.includeQuestionIds && criteria.includeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId IN (:...includeQuestionIds)', { includeQuestionIds: criteria.includeQuestionIds });
        }
        if (criteria.timeRange) {
            queryBuilder.andWhere('question.createdAt BETWEEN :fromDate AND :toDate', {
                fromDate: criteria.timeRange.from,
                toDate: criteria.timeRange.to,
            });
        }
        return queryBuilder.getMany();
    }
    selectQuestions(questions, count, strategy) {
        switch (strategy) {
            case 'random':
                return this.shuffleArray([...questions]).slice(0, count);
            case 'sequential':
                return questions.slice(0, count);
            case 'weighted':
                return this.selectWeightedQuestions(questions, count);
            default:
                return this.shuffleArray([...questions]).slice(0, count);
        }
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    selectWeightedQuestions(questions, count) {
        const weightedQuestions = questions.map(q => ({
            question: q,
            weight: q.marks,
        }));
        weightedQuestions.sort((a, b) => b.weight - a.weight);
        return weightedQuestions.slice(0, count).map(wq => wq.question);
    }
};
exports.QuestionPoolService = QuestionPoolService;
exports.QuestionPoolService = QuestionPoolService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(test_question_entity_1.TestQuestion)),
    __param(1, (0, typeorm_1.InjectRepository)(test_rule_entity_1.TestRule)),
    __param(2, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], QuestionPoolService);


/***/ }),

/***/ "./src/modules/tests/rules.controller.ts":
/*!***********************************************!*\
  !*** ./src/modules/tests/rules.controller.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RulesController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const rules_service_1 = __webpack_require__(/*! ./rules.service */ "./src/modules/tests/rules.service.ts");
const create_rule_dto_1 = __webpack_require__(/*! ./dto/create-rule.dto */ "./src/modules/tests/dto/create-rule.dto.ts");
const update_rule_dto_1 = __webpack_require__(/*! ./dto/update-rule.dto */ "./src/modules/tests/dto/update-rule.dto.ts");
const api_response_dto_1 = __webpack_require__(/*! @/common/dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
let RulesController = class RulesController {
    constructor(rulesService) {
        this.rulesService = rulesService;
    }
    async create(createRuleDto, req) {
        const authContext = req.user;
        const rule = await this.rulesService.create(createRuleDto, authContext);
        return { ruleId: rule.ruleId };
    }
    async findAll(testId, sectionId, req) {
        const authContext = req.user;
        return this.rulesService.findAll(authContext, testId, sectionId);
    }
    async findOne(id, req) {
        const authContext = req.user;
        return this.rulesService.findOne(id, authContext);
    }
    async update(id, updateRuleDto, req) {
        const authContext = req.user;
        const rule = await this.rulesService.update(id, updateRuleDto, authContext);
        return { ruleId: rule.ruleId };
    }
    async remove(id, req) {
        const authContext = req.user;
        await this.rulesService.remove(id, authContext);
        return { message: 'Rule deleted successfully' };
    }
    async getRulesForTest(testId, req) {
        const authContext = req.user;
        return this.rulesService.getRulesForTest(testId, authContext);
    }
    async getRulesForSection(sectionId, req) {
        const authContext = req.user;
        return this.rulesService.getRulesForSection(sectionId, authContext);
    }
    async getRulePreview(ruleId, req) {
        const authContext = req.user;
        return this.rulesService.getRulePreview(ruleId, authContext);
    }
    async getQuestionsByCriteria(ruleId, req) {
        const authContext = req.user;
        return this.rulesService.getQuestionsByCriteria(ruleId, authContext);
    }
};
exports.RulesController = RulesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new test rule' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Rule created', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_rule_dto_1.CreateRuleDto !== "undefined" && create_rule_dto_1.CreateRuleDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all rules with optional filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rules listed', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Query)('testId')),
    __param(1, (0, common_1.Query)('sectionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a rule by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rule found', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a rule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rule updated', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof update_rule_dto_1.UpdateRuleDto !== "undefined" && update_rule_dto_1.UpdateRuleDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a rule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rule deleted', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('test/:testId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all rules for a specific test' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rules for test', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('testId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getRulesForTest", null);
__decorate([
    (0, common_1.Get)('section/:sectionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all rules for a specific section' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rules for section', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('sectionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getRulesForSection", null);
__decorate([
    (0, common_1.Get)(':ruleId/preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get rule preview with metadata' }),
    (0, swagger_1.ApiParam)({ name: 'ruleId', description: 'Rule ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rule preview with metadata' }),
    __param(0, (0, common_1.Param)('ruleId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getRulePreview", null);
__decorate([
    (0, common_1.Post)(':ruleId/questions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get questions based on rule criteria for pre-selection' }),
    (0, swagger_1.ApiParam)({ name: 'ruleId', description: 'Rule ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Questions matching rule criteria' }),
    __param(0, (0, common_1.Param)('ruleId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RulesController.prototype, "getQuestionsByCriteria", null);
exports.RulesController = RulesController = __decorate([
    (0, swagger_1.ApiTags)('Test Rules'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('rules'),
    __metadata("design:paramtypes", [typeof (_a = typeof rules_service_1.RulesService !== "undefined" && rules_service_1.RulesService) === "function" ? _a : Object])
], RulesController);


/***/ }),

/***/ "./src/modules/tests/rules.service.ts":
/*!********************************************!*\
  !*** ./src/modules/tests/rules.service.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RulesService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const test_rule_entity_1 = __webpack_require__(/*! ./entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
const test_entity_1 = __webpack_require__(/*! ./entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const question_entity_1 = __webpack_require__(/*! ../questions/entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
let RulesService = class RulesService {
    constructor(ruleRepository, testRepository, questionRepository) {
        this.ruleRepository = ruleRepository;
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
    }
    async create(createRuleDto, authContext) {
        await this.validateRuleConfiguration(createRuleDto.testId, authContext);
        const rule = this.ruleRepository.create({
            ...createRuleDto,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            createdBy: authContext.userId,
        });
        return this.ruleRepository.save(rule);
    }
    async findAll(authContext, testId, sectionId) {
        const whereClause = {
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
        };
        if (testId) {
            whereClause.testId = testId;
        }
        if (sectionId) {
            whereClause.sectionId = sectionId;
        }
        return this.ruleRepository.find({
            where: whereClause,
            order: { priority: 'DESC', createdAt: 'DESC' },
        });
    }
    async findOne(id, authContext) {
        const rule = await this.ruleRepository.findOne({
            where: {
                ruleId: id,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Rule not found');
        }
        return rule;
    }
    async update(id, updateRuleDto, authContext) {
        const rule = await this.findOne(id, authContext);
        Object.assign(rule, {
            ...updateRuleDto,
            updatedBy: authContext.userId,
        });
        return this.ruleRepository.save(rule);
    }
    async remove(id, authContext) {
        const rule = await this.findOne(id, authContext);
        await this.ruleRepository.remove(rule);
    }
    async getRulesForTest(testId, authContext) {
        return this.ruleRepository.find({
            where: {
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
                isActive: true,
            },
            order: { priority: 'DESC' },
        });
    }
    async getRulesForSection(sectionId, authContext) {
        return this.ruleRepository.find({
            where: {
                sectionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
                isActive: true,
            },
            order: { priority: 'DESC', createdAt: 'ASC' },
        });
    }
    async getRulePreview(ruleId, authContext) {
        const rule = await this.ruleRepository.findOne({
            where: {
                ruleId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Rule not found');
        }
        const questionCount = await this.getQuestionCountByCriteria(rule.criteria, authContext);
        return {
            rule,
            metadata: {
                totalQuestionsMatching: questionCount,
                canGeneratePool: questionCount >= rule.poolSize,
                canCreateTest: questionCount >= rule.numberOfQuestions,
                poolSize: rule.poolSize,
                numberOfQuestions: rule.numberOfQuestions,
            },
        };
    }
    async getQuestionsByCriteria(ruleId, authContext) {
        const rule = await this.ruleRepository.findOne({
            where: {
                ruleId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Rule not found');
        }
        const questions = await this.getQuestionsByCriteriaInternal(rule.criteria, authContext);
        return {
            rule,
            questions,
            totalCount: questions.length,
            canGeneratePool: questions.length >= rule.poolSize,
            canCreateTest: questions.length >= rule.numberOfQuestions,
        };
    }
    async getQuestionCountByCriteria(criteria, authContext) {
        const queryBuilder = this.questionRepository
            .createQueryBuilder('question')
            .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
            .andWhere('question.isActive = :isActive', { isActive: true });
        this.applyCriteriaFilters(queryBuilder, criteria);
        return queryBuilder.getCount();
    }
    async getQuestionsByCriteriaInternal(criteria, authContext) {
        const queryBuilder = this.questionRepository
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.options', 'options')
            .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
            .andWhere('question.isActive = :isActive', { isActive: true });
        this.applyCriteriaFilters(queryBuilder, criteria);
        return queryBuilder.getMany();
    }
    applyCriteriaFilters(queryBuilder, criteria) {
        if (criteria.categories && criteria.categories.length > 0) {
            queryBuilder.andWhere('question.category IN (:...categories)', { categories: criteria.categories });
        }
        if (criteria.difficultyLevels && criteria.difficultyLevels.length > 0) {
            queryBuilder.andWhere('question.difficultyLevel IN (:...difficultyLevels)', { difficultyLevels: criteria.difficultyLevels });
        }
        if (criteria.questionTypes && criteria.questionTypes.length > 0) {
            queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes: criteria.questionTypes });
        }
        if (criteria.tags && criteria.tags.length > 0) {
            queryBuilder.andWhere('question.tags @> :tags', { tags: criteria.tags });
        }
        if (criteria.marks && criteria.marks.length > 0) {
            queryBuilder.andWhere('question.marks IN (:...marks)', { marks: criteria.marks });
        }
        if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId NOT IN (:...excludeQuestionIds)', { excludeQuestionIds: criteria.excludeQuestionIds });
        }
        if (criteria.includeQuestionIds && criteria.includeQuestionIds.length > 0) {
            queryBuilder.andWhere('question.questionId IN (:...includeQuestionIds)', { includeQuestionIds: criteria.includeQuestionIds });
        }
        if (criteria.timeRange) {
            queryBuilder.andWhere('question.createdAt BETWEEN :fromDate AND :toDate', {
                fromDate: criteria.timeRange.from,
                toDate: criteria.timeRange.to,
            });
        }
    }
    async validateRuleConfiguration(testId, authContext) {
        const test = await this.testRepository.findOne({
            where: {
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        if (test.status === test_entity_1.TestStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Cannot modify rules of a published test');
        }
        switch (test.type) {
            case test_entity_1.TestType.PLAIN:
                throw new common_1.BadRequestException('Plain tests should not have rules. Please add questions directly to sections.');
            case test_entity_1.TestType.RULE_BASED:
                break;
            case test_entity_1.TestType.GENERATED:
                throw new common_1.BadRequestException('Cannot manually create rules for generated tests. They are created automatically during test attempts.');
            default:
                throw new common_1.BadRequestException(`Unsupported test type: ${test.type}`);
        }
    }
};
exports.RulesService = RulesService;
exports.RulesService = RulesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(test_rule_entity_1.TestRule)),
    __param(1, (0, typeorm_1.InjectRepository)(test_entity_1.Test)),
    __param(2, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], RulesService);


/***/ }),

/***/ "./src/modules/tests/sections.controller.ts":
/*!**************************************************!*\
  !*** ./src/modules/tests/sections.controller.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SectionsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const sections_service_1 = __webpack_require__(/*! ./sections.service */ "./src/modules/tests/sections.service.ts");
const create_section_dto_1 = __webpack_require__(/*! ./dto/create-section.dto */ "./src/modules/tests/dto/create-section.dto.ts");
const update_section_dto_1 = __webpack_require__(/*! ./dto/update-section.dto */ "./src/modules/tests/dto/update-section.dto.ts");
const api_response_dto_1 = __webpack_require__(/*! @/common/dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
const auth_context_interceptor_1 = __webpack_require__(/*! @/common/interceptors/auth-context.interceptor */ "./src/common/interceptors/auth-context.interceptor.ts");
let SectionsController = class SectionsController {
    constructor(sectionsService) {
        this.sectionsService = sectionsService;
    }
    async create(createSectionDto, req) {
        const authContext = req.user;
        const section = await this.sectionsService.create(createSectionDto, authContext);
        return { sectionId: section.sectionId };
    }
    async findAll(req) {
        const authContext = req.user;
        return this.sectionsService.findAll(authContext);
    }
    async findByTestId(testId, req) {
        const authContext = req.user;
        return this.sectionsService.findByTestId(testId, authContext);
    }
    async findOne(id, req) {
        const authContext = req.user;
        return this.sectionsService.findOne(id, authContext);
    }
    async update(id, updateSectionDto, req) {
        const authContext = req.user;
        const section = await this.sectionsService.update(id, updateSectionDto, authContext);
        return { sectionId: section.sectionId };
    }
    async remove(id, hardDelete, req) {
        const authContext = req.user;
        const isHardDelete = hardDelete === 'true';
        await this.sectionsService.remove(id, authContext, isHardDelete);
        return { message: 'Section deleted successfully' };
    }
};
exports.SectionsController = SectionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new section' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Section created', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_section_dto_1.CreateSectionDto !== "undefined" && create_section_dto_1.CreateSectionDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], SectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all sections' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sections listed', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('test/:testId'),
    (0, swagger_1.ApiOperation)({ summary: 'List all sections for a specific test' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sections listed for test', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('testId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SectionsController.prototype, "findByTestId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a section by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Section found', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SectionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a section' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Section updated', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof update_section_dto_1.UpdateSectionDto !== "undefined" && update_section_dto_1.UpdateSectionDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], SectionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a section' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Section deleted', type: api_response_dto_1.ApiSuccessResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('hard')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SectionsController.prototype, "remove", null);
exports.SectionsController = SectionsController = __decorate([
    (0, swagger_1.ApiTags)('Test Sections'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sections'),
    (0, common_1.UseInterceptors)(auth_context_interceptor_1.AuthContextInterceptor),
    __metadata("design:paramtypes", [typeof (_a = typeof sections_service_1.SectionsService !== "undefined" && sections_service_1.SectionsService) === "function" ? _a : Object])
], SectionsController);


/***/ }),

/***/ "./src/modules/tests/sections.service.ts":
/*!***********************************************!*\
  !*** ./src/modules/tests/sections.service.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SectionsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const test_section_entity_1 = __webpack_require__(/*! ./entities/test-section.entity */ "./src/modules/tests/entities/test-section.entity.ts");
const test_entity_1 = __webpack_require__(/*! ./entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_entity_2 = __webpack_require__(/*! ./entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_rule_entity_1 = __webpack_require__(/*! ./entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
let SectionsService = class SectionsService {
    constructor(sectionRepository, testRepository, ruleRepository) {
        this.sectionRepository = sectionRepository;
        this.testRepository = testRepository;
        this.ruleRepository = ruleRepository;
    }
    async create(createSectionDto, authContext) {
        await this.validateSectionConfiguration(createSectionDto.testId, authContext);
        const section = this.sectionRepository.create({
            ...createSectionDto,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            createdBy: authContext.userId,
        });
        return this.sectionRepository.save(section);
    }
    async findAll(authContext) {
        return this.sectionRepository.find({
            where: {
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            order: { ordering: 'ASC' },
            relations: ['questions'],
        });
    }
    async findByTestId(testId, authContext) {
        return this.sectionRepository.find({
            where: {
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            order: { ordering: 'ASC' },
            relations: ['questions'],
        });
    }
    async findOne(id, authContext) {
        const section = await this.sectionRepository.findOne({
            where: {
                sectionId: id,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            relations: ['questions'],
        });
        if (!section) {
            throw new common_1.NotFoundException('Section not found');
        }
        return section;
    }
    async update(id, updateSectionDto, authContext) {
        const section = await this.findOne(id, authContext);
        Object.assign(section, updateSectionDto);
        return this.sectionRepository.save(section);
    }
    async remove(id, authContext, isHardDelete = false) {
        const section = await this.findOne(id, authContext);
        if (isHardDelete) {
            await this.sectionRepository.remove(section);
        }
        else {
            await this.sectionRepository.update(id, { status: test_entity_1.TestStatus.ARCHIVED });
        }
    }
    async validateSectionConfiguration(testId, authContext) {
        const test = await this.testRepository.findOne({
            where: {
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        if (test.status === test_entity_1.TestStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Cannot modify sections of a published test');
        }
        switch (test.type) {
            case test_entity_1.TestType.PLAIN:
                break;
            case test_entity_1.TestType.RULE_BASED:
                break;
            case test_entity_1.TestType.GENERATED:
                throw new common_1.BadRequestException('Cannot manually create sections for generated tests. They are created automatically during test attempts.');
            default:
                throw new common_1.BadRequestException(`Unsupported test type: ${test.type}`);
        }
    }
};
exports.SectionsService = SectionsService;
exports.SectionsService = SectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(test_section_entity_1.TestSection)),
    __param(1, (0, typeorm_1.InjectRepository)(test_entity_2.Test)),
    __param(2, (0, typeorm_1.InjectRepository)(test_rule_entity_1.TestRule)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object])
], SectionsService);


/***/ }),

/***/ "./src/modules/tests/tests.controller.ts":
/*!***********************************************!*\
  !*** ./src/modules/tests/tests.controller.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestsController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const tests_service_1 = __webpack_require__(/*! ./tests.service */ "./src/modules/tests/tests.service.ts");
const create_test_dto_1 = __webpack_require__(/*! ./dto/create-test.dto */ "./src/modules/tests/dto/create-test.dto.ts");
const update_test_dto_1 = __webpack_require__(/*! ./dto/update-test.dto */ "./src/modules/tests/dto/update-test.dto.ts");
const query_test_dto_1 = __webpack_require__(/*! ./dto/query-test.dto */ "./src/modules/tests/dto/query-test.dto.ts");
const add_question_to_test_dto_1 = __webpack_require__(/*! ./dto/add-question-to-test.dto */ "./src/modules/tests/dto/add-question-to-test.dto.ts");
const add_questions_bulk_dto_1 = __webpack_require__(/*! ./dto/add-questions-bulk.dto */ "./src/modules/tests/dto/add-questions-bulk.dto.ts");
const api_response_dto_1 = __webpack_require__(/*! @/common/dto/api-response.dto */ "./src/common/dto/api-response.dto.ts");
const auth_context_interceptor_1 = __webpack_require__(/*! @/common/interceptors/auth-context.interceptor */ "./src/common/interceptors/auth-context.interceptor.ts");
let TestsController = class TestsController {
    constructor(testsService) {
        this.testsService = testsService;
    }
    async create(createTestDto, req) {
        const authContext = req.user;
        const test = await this.testsService.create(createTestDto, authContext);
        return { testId: test.testId };
    }
    async findAll(queryDto, req) {
        const authContext = req.user;
        return this.testsService.findAll(queryDto, authContext);
    }
    async findOne(id, req) {
        const authContext = req.user;
        return this.testsService.findOne(id, authContext);
    }
    async getTestHierarchy(id, req) {
        const authContext = req.user;
        return this.testsService.getTestHierarchy(id, authContext);
    }
    async update(id, updateTestDto, req) {
        const authContext = req.user;
        const test = await this.testsService.update(id, updateTestDto, authContext);
        return { testId: test.testId };
    }
    async remove(id, hardDelete, req) {
        const authContext = req.user;
        const isHardDelete = hardDelete === 'true';
        await this.testsService.remove(id, authContext, isHardDelete);
        return { message: 'Test deleted successfully' };
    }
    async addQuestionToTest(testId, addQuestionDto, req) {
        const authContext = req.user;
        await this.testsService.addQuestionToTest(testId, addQuestionDto.sectionId, addQuestionDto.questionId, addQuestionDto.isCompulsory || false, authContext);
        return { message: 'Question added to test successfully' };
    }
    async addQuestionsBulkToTest(testId, addQuestionsBulkDto, req) {
        const authContext = req.user;
        const result = await this.testsService.addQuestionsBulkToTest(testId, addQuestionsBulkDto.sectionId, addQuestionsBulkDto.questions, authContext);
        return {
            message: 'Questions added to test successfully',
            result
        };
    }
};
exports.TestsController = TestsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new test',
        description: 'Creates a new test. Requires tenantId and organisationId headers.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Test created successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Missing required headers (tenantId, organisationId)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_test_dto_1.CreateTestDto !== "undefined" && create_test_dto_1.CreateTestDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tests with pagination and filters' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tests retrieved successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof query_test_dto_1.QueryTestDto !== "undefined" && query_test_dto_1.QueryTestDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a test by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test retrieved successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/hierarchy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get test hierarchy with sections and questions' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test hierarchy retrieved successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "getTestHierarchy", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a test' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test updated successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof update_test_dto_1.UpdateTestDto !== "undefined" && update_test_dto_1.UpdateTestDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a test' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test deleted successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('hard')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/questions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add a question to a test section',
        description: 'Adds a specific question to a test section. The question must exist and the section must belong to the specified test.'
    }),
    (0, swagger_1.ApiBody)({
        type: add_question_to_test_dto_1.AddQuestionToTestDto,
        description: 'Question and section details'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Question added to test successfully',
        type: api_response_dto_1.ApiSuccessResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Question is already added to this test or test is published',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Test, section, or question not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof add_question_to_test_dto_1.AddQuestionToTestDto !== "undefined" && add_question_to_test_dto_1.AddQuestionToTestDto) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "addQuestionToTest", null);
__decorate([
    (0, common_1.Post)(':id/questions/bulk'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add multiple questions to a test section in bulk',
        description: 'Adds multiple questions to a test section in a single request. Duplicate questions are automatically skipped. Questions can be ordered and marked as compulsory.'
    }),
    (0, swagger_1.ApiBody)({
        type: add_questions_bulk_dto_1.AddQuestionsBulkDto,
        description: 'Section and questions details for bulk addition'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Questions added to test successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Questions added to test successfully' },
                result: {
                    type: 'object',
                    properties: {
                        added: { type: 'number', example: 5, description: 'Number of questions successfully added' },
                        skipped: { type: 'number', example: 2, description: 'Number of questions skipped (duplicates or not found)' },
                        errors: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['Questions not found: qstn-123, qstn-456'],
                            description: 'List of error messages'
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Test is published or invalid request data',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Test or section not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof add_questions_bulk_dto_1.AddQuestionsBulkDto !== "undefined" && add_questions_bulk_dto_1.AddQuestionsBulkDto) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", Promise)
], TestsController.prototype, "addQuestionsBulkToTest", null);
exports.TestsController = TestsController = __decorate([
    (0, swagger_1.ApiTags)('Tests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tests'),
    (0, common_1.UseInterceptors)(auth_context_interceptor_1.AuthContextInterceptor),
    __metadata("design:paramtypes", [typeof (_a = typeof tests_service_1.TestsService !== "undefined" && tests_service_1.TestsService) === "function" ? _a : Object])
], TestsController);


/***/ }),

/***/ "./src/modules/tests/tests.module.ts":
/*!*******************************************!*\
  !*** ./src/modules/tests/tests.module.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestsModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const tests_controller_1 = __webpack_require__(/*! ./tests.controller */ "./src/modules/tests/tests.controller.ts");
const tests_service_1 = __webpack_require__(/*! ./tests.service */ "./src/modules/tests/tests.service.ts");
const sections_controller_1 = __webpack_require__(/*! ./sections.controller */ "./src/modules/tests/sections.controller.ts");
const sections_service_1 = __webpack_require__(/*! ./sections.service */ "./src/modules/tests/sections.service.ts");
const rules_controller_1 = __webpack_require__(/*! ./rules.controller */ "./src/modules/tests/rules.controller.ts");
const rules_service_1 = __webpack_require__(/*! ./rules.service */ "./src/modules/tests/rules.service.ts");
const question_pool_service_1 = __webpack_require__(/*! ./question-pool.service */ "./src/modules/tests/question-pool.service.ts");
const test_entity_1 = __webpack_require__(/*! ./entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_section_entity_1 = __webpack_require__(/*! ./entities/test-section.entity */ "./src/modules/tests/entities/test-section.entity.ts");
const test_question_entity_1 = __webpack_require__(/*! ./entities/test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
const test_attempt_entity_1 = __webpack_require__(/*! ./entities/test-attempt.entity */ "./src/modules/tests/entities/test-attempt.entity.ts");
const test_rule_entity_1 = __webpack_require__(/*! ./entities/test-rule.entity */ "./src/modules/tests/entities/test-rule.entity.ts");
const test_user_answer_entity_1 = __webpack_require__(/*! ./entities/test-user-answer.entity */ "./src/modules/tests/entities/test-user-answer.entity.ts");
const question_entity_1 = __webpack_require__(/*! ../questions/entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
let TestsModule = class TestsModule {
};
exports.TestsModule = TestsModule;
exports.TestsModule = TestsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                test_entity_1.Test,
                test_section_entity_1.TestSection,
                test_question_entity_1.TestQuestion,
                test_attempt_entity_1.TestAttempt,
                test_rule_entity_1.TestRule,
                test_user_answer_entity_1.TestUserAnswer,
                question_entity_1.Question,
            ]),
        ],
        controllers: [tests_controller_1.TestsController, sections_controller_1.SectionsController, rules_controller_1.RulesController],
        providers: [tests_service_1.TestsService, sections_service_1.SectionsService, rules_service_1.RulesService, question_pool_service_1.QuestionPoolService],
        exports: [tests_service_1.TestsService, sections_service_1.SectionsService, rules_service_1.RulesService, question_pool_service_1.QuestionPoolService],
    })
], TestsModule);


/***/ }),

/***/ "./src/modules/tests/tests.service.ts":
/*!********************************************!*\
  !*** ./src/modules/tests/tests.service.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestsService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const cache_manager_1 = __webpack_require__(/*! @nestjs/cache-manager */ "@nestjs/cache-manager");
const common_2 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const cache_manager_2 = __webpack_require__(/*! cache-manager */ "cache-manager");
const test_entity_1 = __webpack_require__(/*! ./entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_entity_2 = __webpack_require__(/*! ./entities/test.entity */ "./src/modules/tests/entities/test.entity.ts");
const test_question_entity_1 = __webpack_require__(/*! ./entities/test-question.entity */ "./src/modules/tests/entities/test-question.entity.ts");
const test_section_entity_1 = __webpack_require__(/*! ./entities/test-section.entity */ "./src/modules/tests/entities/test-section.entity.ts");
const question_entity_1 = __webpack_require__(/*! ../questions/entities/question.entity */ "./src/modules/questions/entities/question.entity.ts");
let TestsService = class TestsService {
    constructor(testRepository, testQuestionRepository, testSectionRepository, questionRepository, cacheManager) {
        this.testRepository = testRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testSectionRepository = testSectionRepository;
        this.questionRepository = questionRepository;
        this.cacheManager = cacheManager;
    }
    async create(createTestDto, authContext) {
        await this.validateTestConfiguration(createTestDto);
        const test = this.testRepository.create({
            ...createTestDto,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
            createdBy: authContext.userId,
        });
        const savedTest = await this.testRepository.save(test);
        await this.invalidateTestCache(authContext.tenantId);
        return savedTest;
    }
    async findAll(queryDto, authContext) {
        const cacheKey = `tests:${authContext.tenantId}:${JSON.stringify(queryDto)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const { limit = 10, offset = 0, search, status, type, minMarks, maxMarks, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
        const queryBuilder = this.testRepository
            .createQueryBuilder('test')
            .where('test.tenantId = :tenantId', { tenantId: authContext.tenantId })
            .andWhere('test.organisationId = :organisationId', { organisationId: authContext.organisationId });
        if (search) {
            queryBuilder.andWhere('(test.title ILIKE :search OR test.description ILIKE :search)', { search: `%${search}%` });
        }
        if (status) {
            queryBuilder.andWhere('test.status = :status', { status });
        }
        else {
            queryBuilder.andWhere('test.status != :status', { status: test_entity_2.TestStatus.ARCHIVED });
        }
        if (type) {
            queryBuilder.andWhere('test.type = :type', { type });
        }
        if (minMarks !== undefined || maxMarks !== undefined) {
            if (minMarks !== undefined && maxMarks !== undefined) {
                queryBuilder.andWhere('test.totalMarks BETWEEN :minMarks AND :maxMarks', { minMarks, maxMarks });
            }
            else if (minMarks !== undefined) {
                queryBuilder.andWhere('test.totalMarks >= :minMarks', { minMarks });
            }
            else if (maxMarks !== undefined) {
                queryBuilder.andWhere('test.totalMarks <= :maxMarks', { maxMarks });
            }
        }
        const total = await queryBuilder.getCount();
        queryBuilder
            .orderBy(`test.${sortBy}`, sortOrder)
            .skip(offset)
            .take(limit);
        const tests = await queryBuilder.getMany();
        const result = {
            content: tests,
            totalElements: total,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(offset / limit) + 1,
            size: limit,
        };
        await this.cacheManager.set(cacheKey, result, 86400);
        return result;
    }
    async findOne(id, authContext) {
        const test = await this.testRepository.findOne({
            where: {
                testId: id,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            relations: ['sections', 'questions'],
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        return test;
    }
    async update(id, updateTestDto, authContext) {
        const test = await this.findOne(id, authContext);
        Object.assign(test, {
            ...updateTestDto,
            updatedBy: authContext.userId,
        });
        const updatedTest = await this.testRepository.save(test);
        await this.invalidateTestCache(authContext.tenantId);
        return updatedTest;
    }
    async remove(id, authContext, isHardDelete = false) {
        const test = await this.findOne(id, authContext);
        if (isHardDelete) {
            await this.testRepository.remove(test);
        }
        else {
            await this.testRepository.update(id, { status: test_entity_2.TestStatus.ARCHIVED });
        }
        await this.invalidateTestCache(authContext.tenantId);
    }
    async getTestHierarchy(id, authContext) {
        const test = await this.testRepository.findOne({
            where: {
                testId: id,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            relations: [
                'sections',
                'sections.questions',
                'questions',
            ],
            order: {
                sections: {
                    ordering: 'ASC',
                },
                questions: {
                    ordering: 'ASC',
                },
            },
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        return test;
    }
    async addQuestionToTest(testId, sectionId, questionId, isCompulsory = true, authContext) {
        await this.validateQuestionAddition(testId, authContext);
        const existingQuestion = await this.testQuestionRepository.findOne({
            where: {
                testId,
                questionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (existingQuestion) {
            throw new common_1.BadRequestException('Question is already added to this test');
        }
        const testQuestion = this.testQuestionRepository.create({
            testId,
            sectionId,
            questionId,
            ordering: 0,
            isCompulsory,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
        });
        await this.testQuestionRepository.save(testQuestion);
    }
    async addQuestionsBulkToTest(testId, sectionId, questions, authContext) {
        await this.validateQuestionAddition(testId, authContext);
        const section = await this.testSectionRepository.findOne({
            where: {
                sectionId,
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!section) {
            throw new common_1.NotFoundException('Section not found or does not belong to the specified test');
        }
        const result = {
            added: 0,
            skipped: 0,
            errors: []
        };
        const existingQuestions = await this.testQuestionRepository.find({
            where: {
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            select: ['questionId'],
        });
        const existingQuestionIds = new Set(existingQuestions.map(q => q.questionId));
        const questionIds = questions.map(q => q.questionId);
        const foundQuestions = await this.questionRepository.find({
            where: {
                questionId: (0, typeorm_2.In)(questionIds),
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
            select: ['questionId'],
        });
        const foundQuestionIds = new Set(foundQuestions.map(q => q.questionId));
        const notFoundQuestionIds = questionIds.filter(id => !foundQuestionIds.has(id));
        if (notFoundQuestionIds.length > 0) {
            result.errors.push(`Questions not found: ${notFoundQuestionIds.join(', ')}`);
        }
        const questionsToAdd = [];
        for (const questionData of questions) {
            if (!foundQuestionIds.has(questionData.questionId)) {
                continue;
            }
            if (existingQuestionIds.has(questionData.questionId)) {
                result.skipped++;
                continue;
            }
            let ordering = questionData.ordering;
            if (ordering === undefined) {
                const maxOrdering = await this.testQuestionRepository
                    .createQueryBuilder('tq')
                    .where('tq.testId = :testId', { testId })
                    .andWhere('tq.sectionId = :sectionId', { sectionId })
                    .andWhere('tq.tenantId = :tenantId', { tenantId: authContext.tenantId })
                    .andWhere('tq.organisationId = :organisationId', { organisationId: authContext.organisationId })
                    .select('MAX(tq.ordering)', 'maxOrdering')
                    .getRawOne();
                ordering = (maxOrdering?.maxOrdering || 0) + 1;
            }
            questionsToAdd.push({
                testId,
                sectionId,
                questionId: questionData.questionId,
                ordering,
                isCompulsory: questionData.isCompulsory || false,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            });
            existingQuestionIds.add(questionData.questionId);
        }
        if (questionsToAdd.length > 0) {
            await this.testQuestionRepository
                .createQueryBuilder()
                .insert()
                .into(test_question_entity_1.TestQuestion)
                .values(questionsToAdd)
                .execute();
            result.added = questionsToAdd.length;
        }
        return result;
    }
    async invalidateTestCache(tenantId) {
        try {
            await this.cacheManager.set(`test_cache_invalidated:${tenantId}`, Date.now(), 86400);
        }
        catch (error) {
            console.warn('Failed to invalidate test cache:', error);
        }
    }
    async validateTestConfiguration(createTestDto) {
        switch (createTestDto.type) {
            case test_entity_2.TestType.PLAIN:
                if (!createTestDto.title || !createTestDto.totalMarks) {
                    throw new common_1.BadRequestException('Plain tests require title and total marks');
                }
                break;
            case test_entity_2.TestType.RULE_BASED:
            case test_entity_2.TestType.GENERATED:
                if (!createTestDto.title || !createTestDto.totalMarks) {
                    throw new common_1.BadRequestException(`${createTestDto.type} tests require title and total marks`);
                }
                break;
            default:
                throw new common_1.BadRequestException(`Unsupported test type: ${createTestDto.type}`);
        }
    }
    async validateQuestionAddition(testId, authContext) {
        const test = await this.testRepository.findOne({
            where: {
                testId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
            },
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        if (test.status === test_entity_2.TestStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Cannot modify questions of a published test');
        }
        switch (test.type) {
            case test_entity_2.TestType.PLAIN:
                break;
            case test_entity_2.TestType.RULE_BASED:
                break;
            case test_entity_2.TestType.GENERATED:
                throw new common_1.BadRequestException('Cannot manually add questions to generated tests. They are created automatically during test attempts.');
            default:
                throw new common_1.BadRequestException(`Unsupported test type: ${test.type}`);
        }
    }
};
exports.TestsService = TestsService;
exports.TestsService = TestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(test_entity_1.Test)),
    __param(1, (0, typeorm_1.InjectRepository)(test_question_entity_1.TestQuestion)),
    __param(2, (0, typeorm_1.InjectRepository)(test_section_entity_1.TestSection)),
    __param(3, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(4, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object, typeof (_e = typeof cache_manager_2.Cache !== "undefined" && cache_manager_2.Cache) === "function" ? _e : Object])
], TestsService);


/***/ }),

/***/ "@nestjs/cache-manager":
/*!****************************************!*\
  !*** external "@nestjs/cache-manager" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("@nestjs/cache-manager");

/***/ }),

/***/ "@nestjs/common":
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),

/***/ "@nestjs/config":
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),

/***/ "@nestjs/core":
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),

/***/ "@nestjs/event-emitter":
/*!****************************************!*\
  !*** external "@nestjs/event-emitter" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("@nestjs/event-emitter");

/***/ }),

/***/ "@nestjs/swagger":
/*!**********************************!*\
  !*** external "@nestjs/swagger" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),

/***/ "@nestjs/throttler":
/*!************************************!*\
  !*** external "@nestjs/throttler" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),

/***/ "@nestjs/typeorm":
/*!**********************************!*\
  !*** external "@nestjs/typeorm" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

module.exports = require("axios");

/***/ }),

/***/ "cache-manager":
/*!********************************!*\
  !*** external "cache-manager" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("cache-manager");

/***/ }),

/***/ "cache-manager-redis-store":
/*!********************************************!*\
  !*** external "cache-manager-redis-store" ***!
  \********************************************/
/***/ ((module) => {

module.exports = require("cache-manager-redis-store");

/***/ }),

/***/ "class-transformer":
/*!************************************!*\
  !*** external "class-transformer" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),

/***/ "class-validator":
/*!**********************************!*\
  !*** external "class-validator" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "rxjs/operators":
/*!*********************************!*\
  !*** external "rxjs/operators" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("rxjs/operators");

/***/ }),

/***/ "typeorm":
/*!**************************!*\
  !*** external "typeorm" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("typeorm");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = __webpack_require__(/*! crypto */ "crypto");
}
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const swagger_1 = __webpack_require__(/*! @nestjs/swagger */ "@nestjs/swagger");
const app_module_1 = __webpack_require__(/*! ./app.module */ "./src/app.module.ts");
const api_exception_filter_1 = __webpack_require__(/*! ./common/filters/api-exception.filter */ "./src/common/filters/api-exception.filter.ts");
const api_response_interceptor_1 = __webpack_require__(/*! ./common/interceptors/api-response.interceptor */ "./src/common/interceptors/api-response.interceptor.ts");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('assessment/v1');
    app.useGlobalFilters(new api_exception_filter_1.ApiExceptionFilter());
    app.useGlobalInterceptors(new api_response_interceptor_1.ApiResponseInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors();
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Assessment Service API')
        .setDescription('API for managing assessments, questions, and test-taking workflows')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addGlobalParameters({
        name: 'tenantId',
        in: 'header',
        required: true,
        description: 'Tenant ID for multi-tenancy',
        schema: {
            type: 'string',
            format: 'uuid',
        },
    }, {
        name: 'organisationId',
        in: 'header',
        required: true,
        description: 'Organisation ID for multi-tenancy',
        schema: {
            type: 'string',
            format: 'uuid',
        },
    }, {
        name: 'userId',
        in: 'header',
        required: true,
        description: 'User ID for audit trail',
        schema: {
            type: 'string',
            format: 'uuid',
        },
    })
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Assessment Service is running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();

})();

/******/ })()
;