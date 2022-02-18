import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { isNil } from "lodash";

import { budgeting, tabling } from "lib";
import { AccountsTable as GenericAccountsTable, connectTableToAuthenticatedStore } from "tabling";

import { actions, selectors, sagas } from "../../store";

type R = Tables.AccountRowData;
type M = Model.Account;

const ConnectedTable = connectTableToAuthenticatedStore<
  GenericAccountsTable.AuthenticatedTemplateProps,
  R,
  M,
  Tables.AccountTableStore,
  Tables.AccountTableContext
>({
  actions: {
    tableChanged: actions.template.accounts.handleTableChangeEventAction,
    loading: actions.template.accounts.loadingAction,
    response: actions.template.accounts.responseAction,
    addModelsToState: actions.template.accounts.addModelsToStateAction,
    setSearch: actions.template.accounts.setSearchAction
  },
  tableId: "template-accounts",
  selector: (s: Application.Store) => selectors.selectAccountsTableStore(s, { domain: "template" }),
  createSaga: (table: Table.TableInstance<R, M>) => sagas.template.accounts.createTableSaga(table),
  footerRowSelectors: {
    footer: createSelector(
      (state: Application.Store) => state.template.detail.data,
      (budget: Model.Template | null) => ({
        identifier: !isNil(budget) && !isNil(budget.name) ? `${budget.name} Total` : "Budget Total",
        estimated: !isNil(budget) ? budgeting.businessLogic.estimatedValue(budget) : 0.0
      })
    )
  }
})(GenericAccountsTable.AuthenticatedTemplate);

interface AccountsTableProps {
  readonly budgetId: number;
  readonly budget: Model.Template | null;
}

const AccountsTable = (props: AccountsTableProps): JSX.Element => {
  const dispatch = useDispatch();
  const table = tabling.hooks.useTable<R, M>();

  useEffect(() => {
    dispatch(actions.template.accounts.requestAction(null, { budgetId: props.budgetId }));
  }, [props.budgetId]);

  return (
    <ConnectedTable
      id={props.budgetId}
      parent={props.budget}
      actionContext={{ budgetId: props.budgetId }}
      table={table}
      onParentUpdated={(p: Model.Template) =>
        dispatch(actions.template.updateBudgetInStateAction({ id: p.id, data: p }))
      }
    />
  );
};

export default AccountsTable;