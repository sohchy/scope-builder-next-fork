export {};

// Create a type for the roles
export type Roles = "admin" | "mentor";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
      founderOfMultipleStartups?: boolean;
    };
  }
}
