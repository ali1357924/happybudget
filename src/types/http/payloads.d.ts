/// <reference path="./payloads.d.ts" />
/// <reference path="./errors.d.ts" />

/* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
namespace Http {
  type NonModelPayloadFields = "created_by" | "id" | "type";

  type Payload = { [key: string]: any };

  type ModelPayload<M extends Model.Model> = {
    /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
    [key in keyof Omit<M, NonModelPayloadFields>]?: any;
  };

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface SocialPayload {
    readonly token_id: string;
    readonly provider: string;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface RegistrationPayload {
    readonly first_name: string;
    readonly last_name: string;
    readonly email: string;
    readonly password: string;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface ResetPasswordPayload {
    readonly password: string;
    readonly token: string;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface ChangePasswordPayload {
    readonly password: string;
    readonly new_password: string;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface UserPayload {
    readonly profile_image?: string | ArrayBuffer | null;
    readonly first_name: string;
    readonly last_name: string;
    readonly company?: string | null;
    readonly position?: string | null;
    readonly city?: string | null;
    readonly phone_number?: string | null;
    readonly timezone?: string;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface FringePayload {
    readonly name: string;
    readonly description?: string | null;
    readonly cutoff?: number | null;
    readonly rate: number;
    readonly unit?: Model.FringeUnit;
    readonly color?: string | null;
    readonly previous?: number | null;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface MarkupPayload {
    readonly identifier?: string | null;
    readonly description?: string | null;
    readonly unit: Model.MarkupUnitId;
    readonly rate?: number | null;
    readonly children?: number[];
    readonly groups?: number[];
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface ModifyMarkupPayload {
    readonly children?: number[];
    readonly groups?: number[];
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface BudgetPayload {
    readonly name: string;
    readonly template?: number;
    readonly image?: string | ArrayBuffer | null;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface TemplatePayload {
    readonly name: string;
    readonly image?: string | ArrayBuffer | null;
    readonly community?: boolean;
    readonly hidden?: boolean;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface GroupPayload {
    readonly name?: string;
    readonly color?: string;
    readonly children?: number[];
    readonly children_markups?: number[];
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface AccountPayload extends Omit<ModelPayload<Model.Account>, "order"> {
    readonly group?: number | null;
    readonly previous?: number | null;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  type SubAccountPayload = Omit<ModelPayload<Model.SubAccount>, "unit" | "attachments" | "order"> & {
    readonly unit?: number | null;
    readonly group?: number | null;
    readonly attachments?: number[];
    readonly previous?: number | null;
  };

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface ActualPayload extends Omit<ModelPayload<Model.Actual>, "owner" | "actual_type" | "attachments" | "order"> {
    readonly actual_type?: number | null;
    readonly attachments?: number[];
    readonly owner?: Model.GenericHttpModel<"subaccount"> | Model.GenericHttpModel<"markup"> | null;
    readonly previous?: number | null;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface HeaderTemplatePayload extends ModelPayload<Model.HeaderTemplate> {
    readonly left_image?: string | ArrayBuffer | null;
    readonly right_image?: string | ArrayBuffer | null;
    readonly original?: number;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  interface ContactPayload {
    readonly contact_type?: Model.ContactTypeId | null;
    readonly first_name?: string | null;
    readonly last_name?: string | null;
    readonly company?: string | null;
    readonly position?: string | null;
    readonly city?: string | null;
    readonly email?: string | null;
    readonly phone_number?: string | null;
    readonly rate?: number | null;
    readonly image?: ArrayBuffer | string | null;
    readonly attachments?: number[];
    readonly previous?: number | null;
  }

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  type BulkCreatePayload<T extends Payload> = { data: Partial<T>[] };
  type ModelBulkUpdatePayload<T extends Payload> = Partial<T> & { readonly id: number };

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  type BulkUpdatePayload<T extends Payload> = { data: ModelBulkUpdatePayload<T>[] };
}
