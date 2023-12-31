declare namespace Model {
  type Model<I extends ID = ID> = {
    readonly id: I;
  };

  type PartialModel<M extends Model> = Partial<Omit<M, "id">> & Pick<M, "id">;

  type RowHttpModelType = "subaccount" | "account" | "fringe" | "actual" | "contact" | "pdf-account" | "pdf-subaccount";

  type HttpModelType = RowHttpModelType | "collaborator" | "markup" | "group" | "budget" | "template" | "pdf-budget";

  type HttpModel = {
    readonly id: number;
  };

  type WithStringId<M extends Model.Model> = Omit<M, "id"> & { readonly id: string };

  type GenericHttpModel<T extends HttpModelType = HttpModelType> = HttpModel & {
    readonly type: T;
  };

  type RowHttpModel<T extends RowHttpModelType = RowHttpModelType> = GenericHttpModel<T> & {
    readonly order: string;
  };

  type PublicHttpModel<T extends HttpModelType = HttpModelType> = GenericHttpModel<T> & {
    readonly public_token: PublicToken | null;
  };

  type ModelLookup<M extends Model> = M["id"] | ((m: M) => boolean);

  type OnModelMissingCallbackParams<M extends Model> = {
    readonly ref: string;
    readonly lookup: ModelLookup<M>;
  };

  type GetModelOptions<M extends Model> = {
    readonly modelName?: string;
    readonly warnOnMissing?: boolean;
    readonly onMissing?: (params: OnModelMissingCallbackParams<M>) => void;
  };

  type GetReduxModelOptions<M extends Model> = Omit<GetModelOptions<M>, "onMissing"> & {
    readonly action?: Redux.Action;
    readonly warningData?: Record<string, unknown>;
  };

  type InferModelFromNameParams<M extends Model> = Omit<GetModelOptions<M>, "onMissing"> & {
    readonly getName?: (m: M) => string | null | undefined;
    readonly caseInsensitive?: boolean;
  };

  type Choice<I extends number = number, N extends string = string, S extends string = string> = {
    id: I;
    name: N;
    slug: S;
  };

  type _InferChoice<ARGS> = ARGS extends [number, string, string] ? Choice<ARGS[0], ARGS[1], ARGS[2]> : never;
  type _DistributeChoice<T> = T extends [infer I, infer N, infer S] ? _InferChoice<[I, N, S]> : never;

  type DynamicChoices<
    CH extends Choice<I, N, S>,
    I extends number = number,
    N extends string = string,
    S extends string = string
  > = {
    [key in CH["slug"]]: CH;
  };

  type Choices<
    CH extends Choice<I, N, S>,
    I extends number = number,
    N extends string = string,
    S extends string = string
  > = {
    readonly choices: CH[];
    readonly get: (id: I | S) => CH;
    readonly infer: (name: string, options?: Omit<InferModelFromNameParams<CH>, "getName">) => CH | null;
  } & DynamicChoices<CH, I, N, S>;

  type MarkupUnitChoices = [0, "Percent", "percent"] | [1, "Flat", "flat"];
  type MarkupUnit = _DistributeChoice<MarkupUnitChoices>;

  type FringeUnitChoices = [0, "Percent", "percent"] | [1, "Flat", "flat"];
  type FringeUnit = _DistributeChoice<FringeUnitChoices>;

  type ContactTypeChoices = [0, "Contractor", "contractor"] | [1, "Employee", "employee"] | [2, "Vendor", "vendor"];
  type ContactType = _DistributeChoice<ContactTypeChoices>;

  type CollaboratorAccessTypeChoices = [0, "View Only", "view_only"] | [1, "Editor", "editor"] | [2, "Owner", "owner"];
  type CollaboratorAccessType = _DistributeChoice<CollaboratorAccessTypeChoices>;

  type ActualImportSourceChoices = [0, "Bank Account", "bank_account"];
  type ActualImportSource = _DistributeChoice<ActualImportSourceChoices>;

  type ParentType = "account" | "subaccount" | "budget";
  type BudgetDomain = "budget" | "template";

  type ModelWithColor<M extends Model> = M & { color: Style.HexColor | null };

  type ModelWithName<M extends Model> = M & { name: string | null };

  type ModelWithDescription<M extends Model> = M & { description: string | null };

  type ModelWithIdentifier<M extends Model> = M & { identifier: string | null };

  type Tag = HttpModel & {
    readonly title: string;
    readonly plural_title: string | null;
    readonly order: number;
    readonly color: Style.HexColor | null;
  };

  type PublicToken = HttpModel & {
    readonly public_id: string;
    readonly is_expired: boolean;
    readonly expires_at: string | null;
    readonly created_at: string;
  };

  type SimpleUser = HttpModel & {
    readonly first_name: string;
    readonly last_name: string;
    readonly full_name: string;
    readonly email: string;
    readonly profile_image: SavedImage | null;
  };

  type UserMetrics = {
    readonly num_budgets: number;
    readonly num_collaborating_budgets: number;
    readonly num_templates: number;
    readonly num_archived_budgets: number;
  };

  type User = SimpleUser & {
    readonly last_login: null | string;
    readonly date_joined: string;
    readonly timezone: string;
    readonly is_first_time: boolean;
    readonly is_active: boolean;
    readonly is_staff: boolean;
    readonly is_superuser: boolean;
    readonly company: string | null;
    readonly position: string | null;
    readonly address: string | null;
    readonly phone_number: number | null;
    readonly product_id: ProductId | null;
    readonly billing_status: BillingStatus | null;
    readonly metrics: UserMetrics;
  };

  type SimpleAttachment = HttpModel & {
    readonly name: string;
    /*
		The extension will be null if the file name is corrupted and the extension
    cannot be determined.
		*/
    readonly extension: string | null;
    readonly url: string;
  };

  type Attachment = SimpleAttachment & {
    readonly size: number;
  };

  type Fringe = RowHttpModel<"fringe"> & {
    readonly color: Style.HexColor | null;
    readonly name: string | null;
    readonly description: string | null;
    readonly cutoff: number | null;
    readonly rate: number | null;
    readonly unit: FringeUnit | null;
  };

  type SimpleMarkup = GenericHttpModel<"markup"> & {
    readonly identifier: string | null;
    readonly description: string | null;
  };

  type UnknownMarkup = SimpleMarkup & {
    readonly rate: number | null;
    readonly unit: MarkupUnit;
  };

  type FlatMarkup = Omit<UnknownMarkup, "unit"> & {
    readonly unit: Choice<1, "Flat", "flat">;
    readonly actual: number;
  };

  type PercentMarkup = Omit<UnknownMarkup, "unit"> & {
    readonly children: number[];
    readonly unit: Choice<0, "Percent", "percent">;
    readonly actual: number;
  };

  type Markup = FlatMarkup | PercentMarkup;

  type AbstractBudget = GenericHttpModel<"budget"> & {
    readonly name: string;
    readonly domain: BudgetDomain;
    readonly updated_at: string;
    readonly image: SavedImage | null;
    /*
		A budget will not have an updated by field in the case that the user who
    updated the budget has since been deleted.
		*/
    readonly updated_by: Omit<SimpleUser, "profile_image"> | null;
  };

  type SimpleTemplate = AbstractBudget & {
    readonly domain: "template";
    // The hidden attribute will not be present for non-community templates.
    readonly hidden?: boolean;
  };

  type Template = SimpleTemplate & {
    readonly nominal_value: number;
    readonly actual: number;
    readonly accumulated_fringe_contribution: number;
    readonly accumulated_markup_contribution: number;
  };

  type SimpleCollaboratingBudget = AbstractBudget & {
    readonly domain: "budget";
  };

  type SimpleBudget = SimpleCollaboratingBudget & {
    readonly is_permissioned: boolean;
  };

  type _Budget = Omit<SimpleBudget, "is_permissioned"> &
    PublicHttpModel & {
      readonly nominal_value: number;
      readonly actual: number;
      readonly accumulated_fringe_contribution: number;
      readonly accumulated_markup_contribution: number;
    };

  type AnotherUserBudget = _Budget;
  type UserBudget = _Budget & {
    readonly is_permissioned: boolean;
  };
  type Budget = AnotherUserBudget | UserBudget;
  type BaseBudget = Budget | Template;

  type Collaborator = GenericHttpModel<"collaborator"> & {
    readonly created_at: string;
    readonly updated_at: string;
    readonly access_type: CollaboratorAccessType;
    readonly user: Model.SimpleUser;
  };

  type PdfBudget = GenericHttpModel<"pdf-budget"> & {
    readonly name: string;
    readonly nominal_value: number;
    readonly actual: number;
    readonly accumulated_fringe_contribution: number;
    readonly accumulated_markup_contribution: number;
    readonly children: PdfAccount[];
    readonly groups: Group[];
    readonly children_markups: Markup[];
  };

  type Group = GenericHttpModel<"group"> & {
    readonly name: string;
    readonly color: Style.HexColor | null;
    readonly children: number[];
  };

  type LineMetrics = {
    readonly nominal_value: number;
    readonly actual: number;
    readonly accumulated_fringe_contribution: number;
    readonly markup_contribution: number;
    readonly accumulated_markup_contribution: number;
  };

  type SimpleAccount = Omit<RowHttpModel<"account">, "order"> & {
    readonly identifier: string | null;
    readonly description: string | null;
    readonly domain: BudgetDomain;
  };

  type SimpleSubAccount = Omit<RowHttpModel<"subaccount">, "order"> & {
    readonly identifier: string | null;
    readonly description: string | null;
    readonly domain: BudgetDomain;
  };

  type Account = LineMetrics &
    SimpleAccount & {
      readonly order: string;
      readonly children: number[];
      // Only included for detail endpoints.
      readonly table?: SimpleAccount[];
      // Only included for detail endpoints.
      readonly ancestors?: [SimpleBudget | SimpleTemplate];
    };

  type PdfAccount = LineMetrics &
    RowHttpModel<"pdf-account"> & {
      readonly identifier: string | null;
      readonly description: string | null;
      readonly domain: BudgetDomain;
      readonly children: PdfSubAccount[];
      readonly groups: Group[];
      readonly children_markups: Markup[];
    };

  type SubAccountMixin = LineMetrics & {
    readonly order: string;
    readonly fringe_contribution: number;
    readonly quantity: number | null;
    readonly rate: number | null;
    readonly multiplier: number | null;
    readonly unit: Tag | null;
    // Only applicable for non-Template cases.
    readonly contact?: number | null;
  };

  type SubAccount = SimpleSubAccount &
    SubAccountMixin & {
      readonly children: number[];
      readonly object_id: number;
      readonly parent_type: "account" | "subaccount";
      readonly fringes: number[];
      // Only applicable for non-Template cases.
      readonly attachments?: SimpleAttachment[];
      // Only included for detail endpoints.
      readonly table?: SimpleSubAccount[];
      // Only included for detail endpoints.
      readonly ancestors?: [
        SimpleBudget | SimpleTemplate,
        Omit<SimpleAccount, "order">,
        ...Array<Omit<SimpleSubAccount, "order">>
      ];
    };

  type PdfSubAccount = RowHttpModel<"pdf-subaccount"> &
    SubAccountMixin & {
      readonly domain: BudgetDomain;
      readonly identifier: string | null;
      readonly description: string | null;
      readonly children: PdfSubAccount[];
      readonly groups: Group[];
      readonly children_markups: Markup[];
    };

  type Ancestor = SimpleBudget | SimpleTemplate | Omit<SimpleAccount, "order"> | Omit<SimpleSubAccount, "order">;

  type ActualOwner = SimpleMarkup | Omit<SimpleSubAccount, "order" | "domain">;

  type TaggedActual = GenericHttpModel<"actual"> & {
    readonly name: string | null;
    readonly date: string | null;
    readonly value: number | null;
    readonly owner: ActualOwner | null;
    readonly budget: SimpleBudget;
  };

  type Actual = RowHttpModel<"actual"> & {
    readonly contact: number | null;
    readonly name: string | null;
    readonly notes: string | null;
    readonly purchase_order: string | null;
    readonly date: string | null;
    readonly payment_id: string | null;
    readonly value: number | null;
    readonly actual_type: Tag | null;
    readonly attachments: SimpleAttachment[];
    readonly owner: ActualOwner | null;
  };

  type ContactNamesAndImage = {
    readonly image: SavedImage | null;
    readonly first_name: string | null;
    readonly last_name: string | null;
  };

  type Contact = ContactNamesAndImage &
    RowHttpModel<"contact"> & {
      readonly contact_type: ContactType | null;
      readonly full_name: string;
      readonly company: string | null;
      readonly position: string | null;
      readonly rate: number | null;
      readonly city: string | null;
      readonly notes: string | null;
      readonly email: string | null;
      readonly phone_number: string | null;
      readonly attachments: SimpleAttachment[];
    };

  type UserWithImage =
    | (User & { profile_image: SavedImage })
    | (SimpleUser & { profile_image: SavedImage })
    | (Contact & { image: SavedImage });

  type SimpleHeaderTemplate = HttpModel & {
    readonly name: string;
  };

  type HeaderTemplate = SimpleHeaderTemplate & {
    readonly header: string | null;
    readonly left_image: SavedImage | null;
    readonly left_info: string | null;
    readonly right_image: SavedImage | null;
    readonly right_info: string | null;
  };

  type BillingStatus = "active" | "expired" | "canceled" | null;

  type ProductId = "standard";
  type ProductPermissionId = "multiple_budgets";

  type StripeSubscriptionStatus =
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired";

  interface Product {
    readonly id: ProductId;
    readonly price_id: string;
    readonly active: boolean;
    readonly description: string | null;
    readonly name: string;
    readonly stripe_id: string;
    readonly image: string | null;
  }

  type Subscription = {
    readonly id: string;
    readonly cancel_at_period_end: boolean;
    readonly canceled_at: string | null;
    readonly current_period_start: string | null;
    readonly current_period_end: string | null;
    readonly start_date: string;
    readonly cancel_at: string | null;
    readonly status: BillingStatus;
    readonly stripe_status: StripeSubscriptionStatus;
  };
}
