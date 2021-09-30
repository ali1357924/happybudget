import { client } from "api";
import * as services from "./services";

export const login = async (email: string, password: string, options?: Http.RequestOptions): Promise<Model.User> => {
  const url = services.URL.v1("auth", "login");
  return client.post<Model.User>(url, { email, password }, options);
};

export const socialLogin = async (payload: Http.SocialPayload, options?: Http.RequestOptions): Promise<Model.User> => {
  const url = services.URL.v1("auth", "social-login");
  return client.post<Model.User>(url, payload, options);
};

export const logout = async (): Promise<null> => {
  const url = services.URL.v1("auth", "logout");
  return client.post<null>(url);
};

export const validateToken = async (): Promise<Http.TokenValidationResponse> => {
  const url = services.URL.v1("jwt", "validate");
  return client.post<Http.TokenValidationResponse>(url);
};
