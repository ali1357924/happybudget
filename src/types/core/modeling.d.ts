/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace Model {
  interface StringObj {
    [key: string]: any;
  }

  interface M {
    readonly id: string | number;
  }

  /* eslint-disable no-shadow */
  interface Model {
    readonly id: number;
  }

  interface Choice<I extends number, N extends string> {
    id: I;
    name: N;
  }

  type ProductionTypeName = "Film" | "Episodic" | "Music Video" | "Commercial" | "Documentary" | "Custom";
  type ProductionTypeId = 0 | 1 | 2 | 3 | 4 | 5;
  type ProductionType = Model.Choice<ProductionTypeId, ProductionTypeName>;

  type PaymentMethodName = "Check" | "Card" | "Wire";
  type PaymentMethodId = 0 | 1 | 2;
  type PaymentMethod = Model.Choice<PaymentMethodId, PaymentMethodName>;

  type FringeUnitId = 0 | 1;
  type FringeUnitName = "Percent" | "Flat";
  type FringeUnit = Model.Choice<FringeUnitId, FringeUnitName>;

  type ContactRoleName =
    | "Producer"
    | "Executive Producer"
    | "Production Manager"
    | "Production Designer"
    | "Actor"
    | "Director"
    | "Medic"
    | "Wardrobe"
    | "Writer"
    | "Client"
    | "Other";
  type ContactRoleId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  type ContactRole = Model.Choice<ContactRoleId, ContactRoleName>;

  type EntityType = "budget" | "template" | "account" | "subaccount";
  type BudgetType = "budget" | "template";

  type ModelWithColor = Model.Model & { color: string | null };
  type ModelWithName = Model.Model & { name: string | null };

  interface Tag extends Model.Model {
    readonly created_at: string;
    readonly updated_at: string;
    readonly title: string;
    readonly order: number;
    readonly color: string | null;
  }

  interface SimpleUser extends Model.Model {
    readonly first_name: string;
    readonly last_name: string;
    readonly full_name: string;
    readonly email: string;
    readonly profile_image: string | null;
  }

  interface NestedUser extends Model.SimpleUser {
    readonly username: string;
    readonly is_active: boolean;
    readonly is_staff: boolean;
    readonly is_admin: boolean;
    readonly is_superuser: boolean;
  }

  interface User extends Model.NestedUser {
    readonly last_login: null | string;
    readonly date_joined: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly timezone: string;
    readonly is_first_time: boolean;
  }

  interface Fringe extends Model.Model {
    readonly color: string | null;
    readonly name: string | null;
    readonly description: string | null;
    readonly cutoff: number | null;
    readonly rate: number | null;
    readonly unit: Model.FringeUnit | null;
    readonly created_by: number | null;
    readonly updated_by: number | null;
    readonly created_at: string;
    readonly updated_at: string;
  }

  interface BaseBudget extends Model.Model {
    readonly name: string;
    readonly type: BudgetType;
    readonly created_at: string;
    readonly updated_at: string;
    readonly created_by: number;
    readonly updated_by: number | null;
  }

  interface SimpleTemplate extends Model.BaseBudget {
    readonly type: "template";
    readonly image: string | null;
    // The hidden attribute will not be present for non-community templates.
    readonly hidden?: boolean;
  }

  interface Template extends Model.SimpleTemplate {
    readonly estimated: number;
  }

  interface SimpleBudget extends Model.BaseBudget {
    readonly type: "budget";
    readonly image: string | null;
  }

  interface ISimpleBudget extends Model.IModel<Model.SimpleBudget> {}

  interface Budget extends Model.SimpleBudget {
    readonly project_number: number;
    readonly production_type: Model.ProductionType;
    readonly shoot_date: string;
    readonly delivery_date: string;
    readonly build_days: number;
    readonly prelight_days: number;
    readonly studio_shoot_days: number;
    readonly location_days: number;
    readonly actual: number;
    readonly variance: number;
    readonly estimated: number;
  }

  interface PdfBudget {
    readonly name: string;
    readonly estimated: number | null;
    readonly actual: number | null;
    readonly variance: number | null;
    readonly accounts: Model.PdfAccount[];
    readonly groups: Model.Group[];
  }

  interface Group extends Model.Model {
    readonly children: number[];
    readonly name: string;
    readonly color: string | null;
    readonly estimated: number;
    readonly children: number[];
    readonly created_by: number | null;
    readonly updated_by: number | null;
    readonly created_at: string;
    readonly updated_at: string;
    // Will be undefined for Template Account(s).
    readonly variance?: number;
    readonly actual?: number;
  }

  interface SimpleAccount extends Model.Model {
    readonly identifier: string | null;
    readonly type: "account";
    readonly description: string | null;
  }

  interface SubAccountTreeNode extends Model.SimpleSubAccount {
    readonly children: Model.SubAccountTreeNode[];
    readonly in_search_path: boolean;
  }

  type Tree = Model.AccountTreeNode[];

  interface Account extends Model.SimpleAccount {
    readonly access: number[];
    readonly estimated: number;
    readonly subaccounts: number[];
    readonly created_by: number | null;
    readonly updated_by: number | null;
    readonly created_at: string;
    readonly updated_at: string;
    // Only included for detail endpoints.
    readonly siblings?: Model.SimpleAccount[];
    readonly ancestors?: Model.Entity[];
    // Will be undefined for Template Account(s).
    readonly variance?: number;
    readonly actual?: number;
  }

  interface PdfAccount {
    readonly id: number;
    readonly identifier: string | null;
    readonly type: "account";
    readonly description: string | null;
    readonly estimated: number | null;
    readonly variance: number | null;
    readonly actual: number | null;
    readonly subaccounts: Model.PdfSubAccount[];
    readonly group: number | null;
    readonly groups: Model.Group[];
  }

  interface SimpleSubAccount extends Model.Model {
    readonly name: string | null;
    readonly type: "subaccount";
    readonly identifier: string | null;
    readonly description: string | null;
  }

  interface SubAccount extends Model.SimpleSubAccount {
    readonly created_by: number | null;
    readonly updated_by: number | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly quantity: number | null;
    readonly rate: number | null;
    readonly multiplier: number | null;
    readonly unit: Model.Tag | null;
    readonly object_id: number;
    readonly type: "subaccount";
    readonly parent_type: "account" | "subaccount";
    readonly fringes: number[];
    readonly subaccounts: number[];
    readonly estimated: number;
    // Only included for detail endpoints.
    readonly siblings?: Model.SimpleSubAccount[];
    readonly ancestors?: Model.Entity[];
    // Will be undefined for Template SubAccount(s).
    readonly variance?: number;
    readonly actual?: number;
  }

  interface PdfSubAccount {
    readonly id: number;
    readonly name: string | null;
    readonly identifier: string | null;
    readonly description: string | null;
    readonly quantity: number | null;
    readonly rate: number | null;
    readonly multiplier: number | null;
    readonly unit: Model.Tag | null;
    readonly estimated: number | null;
    readonly variance: number | null;
    readonly actual: number | null;
    readonly group: number | null;
    readonly subaccounts: PdfSubAccount[];
    readonly groups: Model.Group[];
  }

  type TemplateForm = Model.Template | Model.SimpleTemplate;
  type BudgetForm = Model.Budget | Model.SimpleBudget;
  type SimpleLineItem = Model.SimpleAccount | Model.SimpleSubAccount;
  type LineItem = Model.Account | Model.SubAccount;
  type SimpleEntity = Model.SimpleAccount | Model.SimpleBudget | Model.SimpleSubAccount | Model.SimpleTemplate;
  type Entity = Model.Account | Model.Budget | Model.SubAccount | Model.Template;
  type AccountForm = Model.Account | Model.SimpleAccount;
  type SubAccountForm = Model.SubAccount | Model.SimpleSubAccount;

  interface Actual extends Model.Model {
    readonly vendor: string | null;
    readonly description: string | null;
    readonly purchase_order: string | null;
    readonly date: string | null;
    readonly payment_id: string | null;
    readonly value: number | null;
    readonly payment_method: Model.PaymentMethod | null;
    readonly subaccount: Model.SimpleSubAccount | null;
    readonly created_by: number | null;
    readonly updated_by: number | null;
    readonly created_at: string;
    readonly updated_at: string;
  }

  interface Comment extends Model.Model {
    readonly created_at: string;
    readonly updated_at: string;
    readonly likes: Model.SimpleUser[];
    readonly user: Model.SimpleUser;
    readonly text: string;
    readonly object_id: number;
    readonly content_object_type: "budget" | "account" | "subaccount" | "comment";
    readonly comments: Model.Comment[];
  }

  interface Contact extends Model.Model {
    readonly first_name: string | null;
    readonly last_name: string | null;
    readonly full_name: string;
    readonly company: string | null;
    readonly email: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly role: Model.ContactRole | null;
    readonly rate: number | null;
    readonly city: string | null;
    readonly phone_number: string | null;
  }

  type HistoryEventType = "field_alteration" | "create";

  interface PolymorphicEvent extends Model.Model {
    readonly created_at: string;
    readonly user: Model.SimpleUser;
    readonly type: Model.HistoryEventType;
    readonly content_object: Model.SimpleAccount | Model.SimpleSubAccount;
  }

  interface FieldAlterationEvent extends Model.PolymorphicEvent {
    readonly new_value: string | number | null;
    readonly old_value: string | number | null;
    readonly field: string;
  }

  interface CreateEvent extends Model.PolymorphicEvent {}

  type HistoryEvent = Model.FieldAlterationEvent | Model.CreateEvent;
}
