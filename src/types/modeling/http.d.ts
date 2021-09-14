/// <reference path="./models.d.ts" />

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace Http {
  type Method = "POST" | "PATCH" | "GET" | "DELETE";

  type PayloadFilterSetting = boolean | string | string[];

  interface RequestOptions extends AxiosRequestConfig {
    readonly retries?: number;
    readonly headers?: { [key: string]: string };
    readonly cancelToken?: any;
  }

  interface Query {
    [key: string]: any;
  }

  type Order = 1 | -1 | 0;
  type Ordering = { [key: string]: Http.Order };

  interface ListQuery extends Http.Query {
    readonly ordering?: Http.Ordering;
    readonly page?: number;
    readonly page_size?: number;
    readonly no_pagination?: string | number | boolean;
    readonly search?: string;
  }

  type NonModelPayloadFields = "created_at" | "updated_at" | "created_by" | "updated_by" | "id";

  type ModelPayload<M extends Model.Model> = {
    [key in keyof Omit<M, NonModelPayloadFields>]: M[key];
  };

  interface ListResponse<T> {
    readonly count: number;
    readonly data: T[];
    readonly next?: string | null;
    readonly previous?: string | null;
  }

  type TableResponse<M extends Model.Model = Model.Model, G extends Model.Group = Model.Group> = {
    readonly models: Http.ListResponse<M>;
    readonly groups: Http.ListResponse<G>;
  } | {
    readonly models: Http.ListResponse<M>;
    readonly groups?: Http.ListResponse<G>;
  } | {
    readonly models?: Http.ListResponse<M>;
    readonly groups: Http.ListResponse<G>;
  }

  type ErrorType = "unknown" | "http" | "field" | "global" | "auth";

  interface ErrorInterface {
    readonly error_type: Http.ErrorType;
    readonly code: string;
    readonly message: string;
  }

  interface BaseError {
    readonly code: string;
    readonly message: string;
  }

  interface IHttpNetworkError {
    readonly url?: string;
  }

  interface IHttpServerError {
    readonly url?: string;
  }

  interface IHttpClientError {
    readonly message: string;
    readonly name: string;
    readonly url: string;
    readonly status: number;
    readonly response: import("axios").AxiosResponse<any>;
    readonly errors: any;
  }

  interface IHttpAuthenticationError {
    readonly url: string;
    readonly response: import("axios").AxiosResponse<any>;
    readonly errors: any;
  }

  interface UnknownError extends BaseError {
    readonly error_type: "unknown";
  }

  interface FieldError extends BaseError {
    readonly error_type: "field";
    readonly field: string;
    readonly code: "unique" | "invalid" | "required";
  }

  interface GlobalError extends BaseError {
    readonly error_type: "global";
  }

  interface HttpError extends BaseError {
    readonly error_type: "http";
  }

  interface AuthError extends BaseError {
    readonly error_type: "auth";
    readonly force_logout?: boolean;
  }

  type Error = Http.HttpError | Http.UnknownError | Http.FieldError | Http.GlobalError | Http.AuthError;

  type ErrorResponse = {
    errors: Http.Error[];
    [key: string]: any;
  };

  interface TokenValidationResponse {
    readonly user: Model.User;
  }

  interface SocialPayload {
    readonly token_id: string;
    readonly provider: string;
  }

  interface RegistrationPayload {
    readonly first_name: string;
    readonly last_name: string;
    readonly email: string;
    readonly password: string;
  }

  interface UserPayload {
    readonly first_name: string;
    readonly last_name: string;
    readonly profile_image?: string | ArrayBuffer | null;
    readonly timezone?: string;
  }

  interface FileUploadResponse {
    readonly fileUrl: string;
  }

  interface FringePayload {
    readonly name: string;
    readonly description?: string | null;
    readonly cutoff?: number | null;
    readonly rate: number;
    readonly unit?: Model.FringeUnit;
    readonly color?: string | null;
  }

  interface BudgetPayload {
    readonly production_type?: Model.ProductionTypeId;
    readonly name: string;
    readonly template?: ID;
    readonly image?: string | ArrayBuffer | null;
  }

  interface TemplatePayload {
    readonly name: string;
    readonly image?: string | ArrayBuffer | null;
    readonly community?: boolean;
    readonly hidden?: boolean;
  }

  interface GroupPayload {
    readonly name: string;
    readonly children?: ID[];
    readonly color: string;
  }

  interface AccountPayload extends Http.ModelPayload<Model.Account> {
    // This is a write-only field in the backend, so we have to explicitly include
    // in the payload.
    readonly group?: ID | null;
  }

  interface SubAccountPayload extends Omit<Http.ModelPayload<Model.SubAccount>, "unit"> {
    readonly unit?: Model.SubAccountUnitId | null;
    // This is a write-only field in the backend, so we have to explicitly include
    // in the payload.
    readonly group?: ID | null;
  }

  interface ActualPayload extends Omit<Http.ModelPayload<Model.Actual>, "subaccount" | "payment_method"> {
    readonly payment_method?: Model.PaymentMethodId | null;
    readonly subaccount?: ID | null;
  }

  interface CommentPayload {
    readonly likes?: number[];
    readonly text: string;
  }

  interface HeaderTemplatePayload extends Http.ModelPayload<Model.HeaderTemplate> {
    readonly left_image?: string | ArrayBuffer | null;
    readonly right_image?: string | ArrayBuffer | null;
  }

  interface ContactPayload {
    readonly type?: Model.ContactTypeId | null;
    readonly first_name?: string | null;
    readonly last_name?: string | null;
    readonly company?: string | null;
    readonly position?: string | null;
    readonly city?: string | null;
    readonly email?: string | null;
    readonly phone_number?: string | null;
    readonly rate?: number | null;
    readonly image?: ArrayBuffer | string | null;
  }

  type BulkCreatePayload<T extends Http.ModelPayload> = { data: Partial<T>[] };

  type ModelBulkUpdatePayload<T extends Http.ModelPayload> = (Partial<T> | {}) & { readonly id: ID };
  type BulkUpdatePayload<T extends Http.ModelPayload> = { data: ModelBulkUpatePayload<T>[] };

  type BulkModelResponse<M extends Model.Model> = {
    readonly data: M;
  }

  type BulkCreateResponse<M extends Model.Model> = {
    readonly data: M[];
  }

  type BudgetBulkResponse<B extends Model.Budget | Model.Template, M extends Model.Model> = Http.BulkModelResponse<M> & {
    readonly budget: B;
  }

  type BulkCreateChildrenResponse<M extends Model.Model, C extends Model.Model> = Http.BulkModelResponse<M> & {
    readonly children: C[];
  }

  type BudgetBulkCreateResponse<B extends Model.Budget | Model.Template, M extends Model.Model, C extends Model.Model> = Http.BulkCreateChildrenResponse<M, C> & {
    readonly budget: B;
  }
}