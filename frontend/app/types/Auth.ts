export type Role = "IO" | "SHO" | "LEGAL_ADVISOR";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}