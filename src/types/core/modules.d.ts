declare namespace Modules {
  type AccountOrSubAccountStore<D extends Model.HttpModel> = {
    readonly detail: Redux.ModelDetailResponseStore<D>;
  };

  type SubAccountStore = AccountOrSubAccountStore<Model.SubAccount> & {
    readonly table: Tables.SubAccountTableStore;
  };

  type AccountStore = AccountOrSubAccountStore<Model.Account> & {
    readonly table: Tables.SubAccountTableStore;
  };

  declare namespace Template {
    interface Store {
      readonly detail: Redux.ModelDetailResponseStore<Model.Template>;
      readonly subaccount: SubAccountStore;
      readonly account: AccountStore;
      readonly accounts: Tables.AccountTableStore;
    }
  }

  declare namespace Budget {
    interface HeaderTemplatesStore extends Redux.AuthenticatedModelListResponseStore<Model.HeaderTemplate> {
      readonly displayedTemplate: Model.HeaderTemplate | null;
      readonly loadingDetail: boolean;
    }

    type AnalysisStore = {
      readonly accounts: Omit<Redux.ModelListResponseStore<Model.Account>, "loading" | "responseWasReceived">;
      readonly groups: Omit<Redux.ModelListResponseStore<Model.Group>, "loading" | "responseWasReceived">;
      readonly actuals: Omit<Redux.ModelListResponseStore<Model.Actual>, "loading" | "responseWasReceived">;
      readonly loading: boolean;
      readonly responseWasReceived: boolean;
    };

    interface Store {
      readonly detail: Redux.ModelDetailResponseStore<Model.Budget>;
      readonly subaccount: SubAccountStore;
      readonly account: AccountStore;
      readonly accounts: Tables.AccountTableStore;
      readonly actuals: Tables.ActualTableStore;
      readonly headerTemplates: HeaderTemplatesStore;
      readonly analysis: AnalysisStore;
    }
  }

  declare namespace Dashboard {
    interface Store {
      readonly budgets: Redux.AuthenticatedModelListResponseStore<Model.SimpleBudget>;
      readonly templates: Redux.AuthenticatedModelListResponseStore<Model.SimpleTemplate>;
      readonly community: Redux.AuthenticatedModelListResponseStore<Model.SimpleTemplate>;
      readonly contacts: Tables.ContactTableStore;
    }
  }

  declare namespace PublicBudget {
    interface Store {
      readonly detail: Redux.ModelDetailResponseStore<Model.Budget>;
      readonly subaccount: SubAccountStore;
      readonly account: AccountStore;
      readonly accounts: Tables.AccountTableStore;
    }
  }
}
