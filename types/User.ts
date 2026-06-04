export type Permission =
  | "DASHBOARD_VIEW"
  | "USERS_VIEW"
  | "USERS_EDIT"
  | "USERS_CREATE"
  | "USERS_MANAGE"
  | "EVENTS_VIEW"
  | "EVENTS_CREATE"
  | "ROOMS_VIEW"
  | "ROOMS_CREATE";

export type User = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissions: Permission[];
};