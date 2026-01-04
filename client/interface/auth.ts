export type ProjectUser = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

export type MeResponse = {
  user: ProjectUser;
};

export type CliVerifyResponse = {
  ok: boolean;
};
