export interface AuthContext {
  userId: string;
  tenantId: string;
  organisationId: string;
}

export interface RequestWithAuth extends Request {
  user: AuthContext;
} 