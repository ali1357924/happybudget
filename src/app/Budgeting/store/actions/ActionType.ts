const ActionType = {
  SubAccountUnits: {
    Response: "subaccountunits.Response",
    Loading: "subaccountunits.Loading"
  },
  FringeColors: {
    Loading: "fringecolors.Loading",
    Response: "fringecolors.colors.Response"
  },
  Budget: {
    WipeState: "budget.WipeState",
    SetCommentsHistoryDrawerVisibility: "budget.SetCommentsHistoryDrawerVisibility",
    SetId: "budget.SetId",
    SetAutoIndex: "budget.SetAutoIndex",
    Loading: "budget.Loading",
    Response: "budget.Response",
    Request: "budget.Request",
    Comments: {
      Loading: "budget.comments.Loading",
      Response: "budget.comments.Response",
      Request: "budget.comments.Request",
      Delete: "budget.comments.Delete",
      Update: "budget.comments.Update",
      Create: "budget.comments.Create",
      Creating: "budget.comments.Creating",
      Deleting: "budget.comments.Deleting",
      Updating: "budget.comments.Updating",
      Replying: "budget.comments.Replying",
      AddToState: "budget.comments.AddToState",
      RemoveFromState: "budget.comments.RemoveFromState",
      UpdateInState: "budget.comments.UpdateInState"
    },
    Fringes: {
      TableChanged: "budget.fringes.TableChanged",
      Deleting: "budget.fringes.Deleting",
      Creating: "budget.fringes.Creating",
      Updating: "budget.fringes.Updating",
      Loading: "budget.fringes.Loading",
      Response: "budget.fringes.Response",
      Request: "budget.fringes.Request",
      AddToState: "budget.fringes.AddToState",
      SetSearch: "budget.fringes.SetSearch"
    },
    Accounts: {
      TableChanged: "budget.accounts.TableChanged",
      Deleting: "budget.accounts.Deleting",
      Creating: "budget.accounts.Creating",
      Updating: "budget.accounts.Updating",
      SetSearch: "budget.accounts.SetSearch",
      Loading: "budget.accounts.Loading",
      Response: "budget.accounts.Response",
      Request: "budget.accounts.Request",
      AddToState: "budget.accounts.AddToState",
      RemoveFromGroup: "budget.accounts.RemoveFromGroup",
      AddToGroup: "budget.accounts.AddToGroup",
      Groups: {
        Response: "budget.accounts.groups.Response",
        Request: "budget.accounts.groups.Request",
        Loading: "budget.accounts.groups.Loading",
        Delete: "budget.accounts.groups.Delete",
        Deleting: "budget.accounts.groups.Deleting",
        AddToState: "budget.accounts.groups.AddToState",
        RemoveFromState: "budget.accounts.groups.RemoveFromState",
        UpdateInState: "budget.accounts.groups.UpdateInState"
      },
      History: {
        Loading: "budget.accounts.history.Loading",
        Response: "budget.accounts.history.Response",
        Request: "budget.accounts.history.Request",
        AddToState: "budget.accounts.history.AddToState"
      }
    },
    SubAccount: {
      SetId: "budget.subaccount.SetId",
      Loading: "budget.subaccount.Loading",
      Response: "budget.subaccount.Response",
      Request: "budget.subaccount.Request",
      UpdateInState: "budget.subaccount.UpdateInState",
      TableChanged: "budget.subaccount.TableChanged",
      Comments: {
        Loading: "budget.subaccount.comments.Loading",
        Response: "budget.subaccount.comments.Response",
        Request: "budget.subaccount.comments.Request",
        Delete: "budget.subaccount.comments.Delete",
        Update: "budget.subaccount.comments.Update",
        Creating: "budget.subaccount.comments.Creating",
        Deleting: "budget.subaccount.comments.Deleting",
        Replying: "budget.subaccount.comments.Replying",
        Updating: "budget.subaccount.comments.Updating",
        Create: "budget.subaccount.comments.Create",
        AddToState: "budget.subaccount.comments.AddToState",
        RemoveFromState: "budget.subaccount.comments.RemoveFromState",
        UpdateInState: "budget.subaccount.comments.UpdateInState"
      },
      SubAccounts: {
        Deleting: "budget.subaccount.subaccounts.Deleting",
        Creating: "budget.subaccount.subaccounts.Creating",
        Updating: "budget.subaccount.subaccounts.Updating",
        SetSearch: "budget.subaccount.subaccounts.SetSearch",
        Loading: "budget.subaccount.subaccounts.Loading",
        Response: "budget.subaccount.subaccounts.Response",
        Request: "budget.subaccount.subaccounts.Request",
        AddToState: "budget.subaccount.subaccounts.AddToState",
        RemoveFromGroup: "budget.subaccount.subaccounts.RemoveFromGroup",
        AddToGroup: "budget.subaccount.subaccounts.AddToGroup",
        Groups: {
          Response: "budget.subaccount.subaccounts.groups.Response",
          Request: "budget.subaccount.subaccounts.groups.Request",
          Loading: "budget.subaccount.subaccounts.groups.Loading",
          Delete: "budget.subaccount.subaccounts.groups.Delete",
          Deleting: "budget.subaccount.subaccounts.groups.Deleting",
          AddToState: "budget.subaccount.subaccounts.groups.AddToState",
          RemoveFromState: "budget.subaccount.subaccounts.groups.RemoveFromState",
          UpdateInState: "budget.subaccount.subaccounts.groups.UpdateInState"
        },
        History: {
          Loading: "budget.subaccount.subaccounts.history.Loading",
          Response: "budget.subaccount.subaccounts.history.Response",
          Request: "budget.subaccount.subaccounts.history.Request"
        }
      }
    },
    Account: {
      SetId: "budget.account.SetId",
      Loading: "budget.account.Loading",
      Response: "budget.account.Response",
      Request: "budget.account.Request",
      UpdateInState: "budget.account.UpdateInState",
      TableChanged: "budget.account.TableChanged",
      Comments: {
        Loading: "budget.account.comments.Loading",
        Response: "budget.account.comments.Response",
        Request: "budget.account.comments.Request",
        Creating: "budget.account.comments.Creating",
        Deleting: "budget.account.comments.Deleting",
        Updating: "budget.account.comments.Updating",
        Replying: "budget.account.comments.Replying",
        Delete: "budget.account.comments.Delete",
        Update: "budget.account.comments.Update",
        Create: "budget.account.comments.Create",
        AddToState: "budget.account.comments.AddToState",
        RemoveFromState: "budget.account.comments.RemoveFromState",
        UpdateInState: "budget.account.comments.UpdateInState"
      },
      SubAccounts: {
        Deleting: "budget.account.subaccounts.Deleting",
        Creating: "budget.account.subaccounts.Creating",
        Updating: "budget.account.subaccounts.Updating",
        Loading: "budget.account.subaccounts.Loading",
        Response: "budget.account.subaccounts.Response",
        Request: "budget.account.subaccounts.Request",
        SetSearch: "budget.account.subaccounts.SetSearch",
        AddToState: "budget.account.subaccounts.AddToState",
        RemoveFromGroup: "budget.account.subaccounts.RemoveFromGroup",
        AddToGroup: "budget.account.subaccounts.AddToGroup",
        Groups: {
          Response: "budget.account.subaccounts.groups.Response",
          Request: "budget.account.subaccounts.groups.Request",
          Loading: "budget.account.subaccounts.groups.Loading",
          Delete: "budget.account.subaccounts.groups.Delete",
          Deleting: "budget.account.subaccounts.groups.Deleting",
          AddToState: "budget.account.subaccounts.groups.AddToState",
          RemoveFromState: "budget.account.subaccounts.groups.RemoveFromState",
          UpdateInState: "budget.account.subaccounts.groups.UpdateInState"
        },
        History: {
          Loading: "budget.account.subaccounts.history.Loading",
          Response: "budget.account.subaccounts.history.Response",
          Request: "budget.account.subaccounts.history.Request"
        }
      }
    },
    SubAccountsTree: {
      Request: "budget.subaccountstree.Request",
      Loading: "budget.subaccountstree.Loading",
      Response: "budget.subaccountstree.Response",
      SetSearch: "budget.subaccountstree.SetSearch",
      RestoreSearchCache: "budget.subaccountstree.RestoreSearchCache"
    },
    Actuals: {
      TableChanged: "budget.actuals.TableChanged",
      Deleting: "budget.actuals.Deleting",
      Creating: "budget.actuals.Creating",
      Updating: "budget.actuals.Updating",
      Loading: "budget.actuals.Loading",
      SetSearch: "budget.actuals.SetSearch",
      Response: "budget.actuals.Response",
      Request: "budget.actuals.Request",
      AddToState: "budget.actuals.AddToState"
    }
  },
  Template: {
    WipeState: "template.WipeState",
    SetId: "template.SetId",
    SetAutoIndex: "template.SetAutoIndex",
    Loading: "template.Loading",
    Response: "template.Response",
    Request: "template.Request",
    Fringes: {
      TableChanged: "template.fringes.TableChanged",
      Deleting: "template.fringes.Deleting",
      Creating: "template.fringes.Creating",
      Updating: "template.fringes.Updating",
      Loading: "template.fringes.Loading",
      Response: "template.fringes.Response",
      Request: "template.fringes.Request",
      AddToState: "template.fringes.AddToState",
      SetSearch: "template.fringes.SetSearch"
    },
    Accounts: {
      TableChanged: "template.accounts.TableChanged",
      Deleting: "template.accounts.Deleting",
      Creating: "template.accounts.Creating",
      Updating: "template.accounts.Updating",
      SetSearch: "template.accounts.SetSearch",
      Loading: "template.accounts.Loading",
      Response: "template.accounts.Response",
      Request: "template.accounts.Request",
      AddToState: "template.accounts.AddToState",
      RemoveFromGroup: "template.accounts.RemoveFromGroup",
      AddToGroup: "template.accounts.AddToGroup",
      Groups: {
        Response: "template.accounts.groups.Response",
        Request: "template.accounts.groups.Request",
        Loading: "template.accounts.groups.Loading",
        Delete: "template.accounts.groups.Delete",
        Deleting: "template.accounts.groups.Deleting",
        AddToState: "template.accounts.groups.AddToState",
        RemoveFromState: "template.accounts.groups.RemoveFromState",
        UpdateInState: "template.accounts.groups.UpdateInState"
      }
    },
    SubAccount: {
      SetId: "template.subaccount.SetId",
      Loading: "template.subaccount.Loading",
      Response: "template.subaccount.Response",
      Request: "template.subaccount.Request",
      UpdateInState: "template.subaccount.UpdateInState",
      TableChanged: "template.subaccount.TableChanged",
      SubAccounts: {
        Deleting: "template.subaccount.subaccounts.Deleting",
        Creating: "template.subaccount.subaccounts.Creating",
        Updating: "template.subaccount.subaccounts.Updating",
        SetSearch: "template.subaccount.subaccounts.SetSearch",
        Loading: "template.subaccount.subaccounts.Loading",
        Response: "template.subaccount.subaccounts.Response",
        Request: "template.subaccount.subaccounts.Request",
        AddToState: "template.subaccount.subaccounts.AddToState",
        RemoveFromGroup: "template.subaccount.subaccounts.RemoveFromGroup",
        AddToGroup: "template.subaccount.subaccounts.AddToGroup",
        Groups: {
          Response: "template.subaccount.subaccounts.groups.Response",
          Request: "template.subaccount.subaccounts.groups.Request",
          Loading: "template.subaccount.subaccounts.groups.Loading",
          Delete: "template.subaccount.subaccounts.groups.Delete",
          Deleting: "template.subaccount.subaccounts.groups.Deleting",
          AddToState: "template.subaccount.subaccounts.groups.AddToState",
          RemoveFromState: "template.subaccount.subaccounts.groups.RemoveFromState",
          UpdateInState: "template.subaccount.subaccounts.groups.UpdateInState"
        }
      }
    },
    Account: {
      SetId: "template.account.SetId",
      Loading: "template.account.Loading",
      Response: "template.account.Response",
      Request: "template.account.Request",
      UpdateInState: "template.account.UpdateInState",
      TableChanged: "template.account.TableChanged",
      SubAccounts: {
        Loading: "template.account.subaccounts.Loading",
        Response: "template.account.subaccounts.Response",
        Request: "template.account.subaccounts.Request",
        Deleting: "template.account.subaccounts.Deleting",
        Creating: "template.account.subaccounts.Creating",
        Updating: "template.account.subaccounts.Updating",
        SetSearch: "template.account.subaccounts.SetSearch",
        AddToState: "template.account.subaccounts.AddToState",
        RemoveFromGroup: "template.account.subaccounts.RemoveFromGroup",
        AddToGroup: "template.account.subaccounts.AddToGroup",
        Groups: {
          Response: "template.account.subaccounts.groups.Response",
          Request: "template.account.subaccounts.groups.Request",
          Loading: "template.account.subaccounts.groups.Loading",
          Delete: "template.account.subaccounts.groups.Delete",
          Deleting: "template.account.subaccounts.groups.Deleting",
          AddToState: "template.account.subaccounts.groups.AddToState",
          RemoveFromState: "template.account.subaccounts.groups.RemoveFromState",
          UpdateInState: "template.account.subaccounts.groups.UpdateInState"
        }
      }
    }
  }
};

export default ActionType;
