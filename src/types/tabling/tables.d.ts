declare namespace Tables {
  interface BudgetRowData extends Model.LineMetrics {
    readonly identifier: string | null;
    readonly description: string | null;
    readonly type: "subaccount" | "account";
  }

  interface AccountRowData extends BudgetRowData {}

  type AccountRow = Table.ModelRow<AccountRowData>;

  type AccountTableStore = Redux.BudgetTableStore<AccountRowData>;

  interface SubAccountRowData
    extends BudgetRowData,
      Pick<
        Model.SubAccount,
        "quantity" | "unit" | "multiplier" | "rate" | "fringes" | "fringe_contribution" | "attachments"
      > {
    readonly contact?: number | null;
  }

  type SubAccountRow = Table.ModelRow<SubAccountRowData>;

  type SubAccountTableStore = Redux.BudgetTableStore<SubAccountRowData> & {
    readonly fringes: FringeTableStore;
    readonly subaccountUnits: Model.Tag[];
  };

  type FringeRowData = Pick<Model.Fringe, "color" | "name" | "description" | "cutoff" | "rate" | "unit">;

  type FringeRow = Table.ModelRow<FringeRowData>;
  type FringeTableStore = Redux.TableStore<FringeRowData> & {
    readonly fringeColors: string[];
  };

  type ActualRowData = Pick<
    Model.Actual,
    | "name"
    | "notes"
    | "purchase_order"
    | "date"
    | "actual_type"
    | "payment_id"
    | "value"
    | "contact"
    | "owner"
    | "attachments"
  >;

  type ActualRow = Table.ModelRow<ActualRowData>;

  type ActualTableStore = Redux.TableStore<ActualRowData> & {
    readonly owners: Redux.AuthenticatedModelListResponseStore<Model.ActualOwner>;
    readonly types: Model.Tag[];
  };

  type ContactRowData = Pick<
    Model.Contact,
    | "contact_type"
    | "company"
    | "position"
    | "rate"
    | "phone_number"
    | "email"
    | "first_name"
    | "last_name"
    | "image"
    | "attachments"
  >;

  type ContactRow = Table.ModelRow<ContactRowData>;

  type ContactTableStore = Redux.TableStore<ContactRowData>;
}
