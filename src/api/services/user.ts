import { AxiosResponse } from "axios";
import { client } from "api";
import * as services from "./services";

export const register = async (
  payload: Http.RegistrationPayload,
  options?: Http.RequestOptions
): Promise<Model.User> => {
  const url = services.URL.v1("users", "registration");
  return client.post<Model.User>(url, payload, options);
};

export const verifyEmail = async (token: string, options?: Http.RequestOptions): Promise<null> => {
  const url = services.URL.v1("users", "verify-email");
  return client.post<null>(url, { token }, options);
};

export const updateActiveUser = async (
  payload: Partial<Http.UserPayload> | FormData,
  options?: Http.RequestOptions
): Promise<Model.User> => {
  const url = services.URL.v1("users", "user");
  return client.patch<Model.User>(url, payload, options);
};

export const tempUploadImage = async (
  data: FormData,
  options?: Http.RequestOptions
): Promise<AxiosResponse<Http.FileUploadResponse>> => {
  const url = services.URL.v1("users", "temp_upload_user_image");
  return client.upload<Http.FileUploadResponse>(url, data, options);
};
