import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

/** Body for internal LMS user result status (no auth headers). */
export class UserResultStatusDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  @IsNotEmpty()
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
