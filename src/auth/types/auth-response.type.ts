export type SafeUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResponse = {
  user: SafeUser;
  role: string;
  accessToken: string;
  refreshToken: string;
};
