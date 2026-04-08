import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AttemptsService } from "./attempts.service";
import { UserResultStatusDto } from "./dto/user-result-status.dto";
import { ApiSuccessResponseDto } from "@/common/dto/api-response.dto";

/**
 * Internal routes for service-to-service calls without AuthContextInterceptor
 * (no tenant/org/user headers required). Protect via private network or API gateway.
 */
@ApiTags("Internal (LMS)")
@Controller("internal/attempts")
export class InternalUserResultController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post("user/result-status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "LMS user result status (internal)",
    description:
      "Returns gradingType, aswaresheet, and isImported. For tests.gradingType assessment, isImported reflects latest attempt review/result; for quiz and other types isImported is false without reading attempts. Tenant and organisation are taken from the JSON body.",
  })
  @ApiResponse({
    status: 200,
    description: "Result status",
    type: ApiSuccessResponseDto,
  })
  async userJourneyResultStatus(@Body() dto: UserResultStatusDto) {
    return this.attemptsService.getUserJourneyResultStatus(
      dto.userId,
      dto.testId,
      dto.tenantId,
      dto.organisationId,
    );
  }
}
