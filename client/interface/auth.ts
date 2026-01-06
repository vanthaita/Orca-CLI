export type ProjectUser = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  plan: string;
  createdAt: string;
  updatedAt: string;
};

export type MeResponse = {
  user: ProjectUser;
};

export type CliVerifyResponse = {
  ok: boolean;
  message?: string;
};
