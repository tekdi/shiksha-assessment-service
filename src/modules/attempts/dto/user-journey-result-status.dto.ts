import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

/** Body for internal LMS user-journey result status (no auth headers). */
export class UserJourneyResultStatusDto {
  @ApiProperty({ description: "User ID" })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: "Test ID" })
  @IsUUID()
  testId: string;

  @ApiProperty({ description: "Tenant ID" })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: "Organisation ID" })
  @IsUUID()
  organisationId: string;
}
