import React from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { isNil, map, filter, intersection } from "lodash";

import { tabling, budgeting, redux, model } from "lib";
import { useGrouping, useMarkup } from "components/hooks";
import { AccountsTable as GenericAccountsTable, connectTableToStore } from "components/tabling";

import { actions } from "../../store";

type R = Tables.AccountRowData;
type M = Model.Account;

const ActionMap = {
  tableChanged: actions.accounts.handleTableChangeEventAction,
  request: actions.accounts.requestAction,
  loading: actions.accounts.loadingAction,
  response: actions.accounts.responseAction,
  saving: actions.accounts.savingTableAction,
  addModelsToState: actions.accounts.addModelsToStateAction,
  setSearch: actions.accounts.setSearchAction,
  clear: actions.accounts.clearAction
};

const ConnectedTable = connectTableToStore<
  GenericAccountsTable.AuthenticatedTemplateProps,
  R,
  M,
  Tables.AccountTableStore
>({
  asyncId: "async-accounts-table",
  actions: ActionMap,
  footerRowSelectors: {
    footer: createSelector(
      [redux.selectors.simpleDeepEqualSelector((state: Application.Authenticated.Store) => state.template.detail.data)],
      (budget: Model.Template | null) => ({
        identifier: !isNil(budget) && !isNil(budget.name) ? `${budget.name} Total` : "Budget Total",
        estimated: !isNil(budget) ? model.businessLogic.estimatedValue(budget) : 0.0
      })
    )
  },
  reducer: budgeting.reducers.createAuthenticatedAccountsTableReducer({
    tableId: "accounts-table",
    columns: filter(
      GenericAccountsTable.Columns,
      (c: Table.Column<R, M>) => intersection([c.field, c.colId], ["variance", "actual"]).length === 0
    ),
    actions: ActionMap,
    getModelRowChildren: (m: Model.Account) => m.children,
    initialState: redux.initialState.initialTableState
  })
})(GenericAccountsTable.AuthenticatedTemplate);

interface AccountsTableProps {
  readonly templateId: number;
  readonly template: Model.Template | null;
}

const AccountsTable = ({ templateId, template }: AccountsTableProps): JSX.Element => {
  const history = useHistory();
  const dispatch = useDispatch();

  const table = tabling.hooks.useTable<R>();

  const [groupModals, onEditGroup, onCreateGroup] = useGrouping({
    parentId: templateId,
    parentType: "template",
    table: table.current,
    onGroupUpdated: (group: Model.Group) =>
      dispatch(
        actions.accounts.handleTableChangeEventAction({
          type: "groupUpdated",
          payload: { id: group.id, data: group }
        })
      )
  });

  const [markupModals, onEditMarkup, onCreateMarkup] = useMarkup({
    parentId: templateId,
    parentType: "template",
    table: table.current,
    onResponse: (response: Http.BudgetContextDetailResponse<Model.Markup, Model.Template>) => {
      dispatch(actions.updateTemplateInStateAction({ id: response.budget.id, data: response.budget }));
    }
  });

  return (
    <React.Fragment>
      <ConnectedTable
        tableId={"accounts-table"}
        table={table}
        budget={template}
        menuPortalId={"supplementary-header"}
        savingChangesPortalId={"saving-changes"}
        onRowExpand={(row: Table.ModelRow<R>) => history.push(`/templates/${templateId}/accounts/${row.id}`)}
        onGroupRows={(rows: Table.ModelRow<R>[]) => onCreateGroup(map(rows, (row: Table.ModelRow<R>) => row.id))}
        onMarkupRows={(rows?: Table.ModelRow<R>[]) =>
          rows === undefined ? onCreateMarkup() : onCreateMarkup(map(rows, (row: Table.ModelRow<R>) => row.id))
        }
        onEditGroup={(group: Table.GroupRow<R>) => onEditGroup(group)}
        onEditMarkup={(row: Table.MarkupRow<R>) => onEditMarkup(tabling.rows.markupId(row.id))}
      />
      {groupModals}
      {markupModals}
    </React.Fragment>
  );
};

export default AccountsTable;
