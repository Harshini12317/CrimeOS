export type Role = "IO" | "SHO" | "LEGAL_ADVISOR";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  station_id: number | null;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}