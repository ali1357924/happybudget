import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { isNil, map } from "lodash";
import { createSelector } from "reselect";

import { redux, tabling, budgeting } from "lib";
import { useGrouping, useMarkup } from "components/hooks";
import { connectTableToStore } from "tabling";

import { actions, selectors, sagas } from "../../store";
import TemplateSubAccountsTable, { TemplateSubAccountsTableProps } from "../SubAccountsTable";

type M = Model.SubAccount;
type R = Tables.SubAccountRowData;

const selectAccountDetail = redux.selectors.simpleDeepEqualSelector(
  (state: Application.AuthenticatedStore) => state.template.account.detail.data
);

const ConnectedTable = connectTableToStore<
  TemplateSubAccountsTableProps,
  R,
  M,
  Tables.SubAccountTableStore,
  Tables.SubAccountTableContext
>({
  actions: {
    tableChanged: actions.account.handleTableChangeEventAction,
    loading: actions.account.loadingAction,
    response: actions.account.responseAction,
    saving: actions.account.savingTableAction,
    addModelsToState: actions.account.addModelsToStateAction,
    setSearch: actions.account.setSearchAction
  },
  onSagaConnected: (dispatch: Redux.Dispatch, c: Tables.SubAccountTableContext) =>
    dispatch(actions.account.requestAction(null, c)),
  createSaga: (table: Table.TableInstance<R, M>) => sagas.account.createTableSaga(table),
  selector: selectors.selectSubAccountsTableStore,
  footerRowSelectors: {
    page: createSelector(
      (state: Application.AuthenticatedStore) => state.template.detail.data,
      (template: Model.Template | null) => ({
        identifier: !isNil(template) && !isNil(template.name) ? `${template.name} Total` : "Budget Total",
        estimated: !isNil(template) ? budgeting.businessLogic.estimatedValue(template) : 0.0,
        variance: !isNil(template) ? budgeting.businessLogic.varianceValue(template) : 0.0,
        actual: template?.actual || 0.0
      })
    ),
    footer: createSelector(
      (state: Application.AuthenticatedStore) => state.template.account.detail.data,
      (detail: Model.Account | null) => ({
        identifier: !isNil(detail) && !isNil(detail.description) ? `${detail.description} Total` : "Account Total",
        estimated: !isNil(detail) ? budgeting.businessLogic.estimatedValue(detail) : 0.0,
        variance: !isNil(detail) ? budgeting.businessLogic.varianceValue(detail) : 0.0,
        actual: detail?.actual || 0.0
      })
    )
  }
})(TemplateSubAccountsTable);

interface SubAccountsTableProps {
  readonly accountId: number;
  readonly budgetId: number;
  readonly budget: Model.Template | null;
}

const SubAccountsTable = ({ budget, budgetId, accountId }: SubAccountsTableProps): JSX.Element => {
  const dispatch = useDispatch();
  const history = useHistory();

  const accountDetail = useSelector(selectAccountDetail);
  const table = tabling.hooks.useTable<R, M>();

  const [groupModals, onEditGroup, onCreateGroup] = useGrouping({
    parentId: accountId,
    parentType: "account",
    table: table.current,
    onGroupUpdated: (group: Model.Group) =>
      table.current.applyTableChange({
        type: "groupUpdated",
        payload: group
      })
  });

  const [markupModals, onEditMarkup, onCreateMarkup] = useMarkup({
    parentId: accountId,
    parentType: "account",
    table: table.current,
    onResponse: (response: Http.BudgetParentContextDetailResponse<Model.Markup, Model.Account, Model.Template>) => {
      dispatch(actions.account.updateInStateAction({ id: response.parent.id, data: response.parent }));
      dispatch(actions.updateBudgetInStateAction({ id: response.budget.id, data: response.budget }));
    }
  });

  return (
    <React.Fragment>
      <ConnectedTable
        id={accountId}
        budget={budget}
        budgetId={budgetId}
        actionContext={{ budgetId, id: accountId }}
        tableId={"template-account-subaccounts"}
        table={table}
        exportFileName={!isNil(accountDetail) ? `account_${accountDetail.identifier}` : ""}
        categoryName={"Sub Account"}
        identifierFieldHeader={"Account"}
        onRowExpand={(row: Table.ModelRow<R>) => history.push(`/templates/${budgetId}/subaccounts/${row.id}`)}
        onBack={() => history.push(`/templates/${budgetId}/accounts?row=${accountId}`)}
        onGroupRows={(rows: Table.ModelRow<R>[]) => onCreateGroup(map(rows, (row: Table.ModelRow<R>) => row.id))}
        onMarkupRows={(rows?: Table.ModelRow<R>[]) =>
          rows === undefined ? onCreateMarkup() : onCreateMarkup(map(rows, (row: Table.ModelRow<R>) => row.id))
        }
        onEditGroup={(group: Table.GroupRow<R>) => onEditGroup(group)}
        onEditMarkup={(row: Table.MarkupRow<R>) => onEditMarkup(tabling.managers.markupId(row.id))}
      />
      {groupModals}
      {markupModals}
    </React.Fragment>
  );
};

export default SubAccountsTable;
