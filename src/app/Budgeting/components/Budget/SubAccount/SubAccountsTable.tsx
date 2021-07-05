import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { isNil, map } from "lodash";

import { faCommentsAlt, faPrint } from "@fortawesome/pro-solid-svg-icons";

import * as api from "api";
import { download } from "lib/util/files";

import { CreateSubAccountGroupModal, EditGroupModal } from "components/modals";
import { simpleDeepEqualSelector, simpleShallowEqualSelector } from "store/selectors";

import { setCommentsHistoryDrawerVisibilityAction } from "../../../store/actions/budget";
import {
  selectBudgetDetail,
  selectCommentsHistoryDrawerOpen,
  selectBudgetId,
  selectSubAccountUnits
} from "../../../store/selectors";
import * as actions from "../../../store/actions/budget/subAccount";

import BudgetSubAccountsTable from "../SubAccountsTable";

const selectGroups = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.subaccounts.groups.data
);
const selectSubAccounts = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.subaccounts.data
);
const selectTableSearch = simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.subaccounts.search
);
const selectSubAccountDetail = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.detail.data
);
const selectLoadingSubAcount = simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.detail.loading
);

interface SubAccountsTableProps {
  subaccountId: number;
}

const SubAccountsTable = ({ subaccountId }: SubAccountsTableProps): JSX.Element => {
  const [groupSubAccounts, setGroupSubAccounts] = useState<number[] | undefined>(undefined);
  const [groupToEdit, setGroupToEdit] = useState<Model.BudgetGroup | undefined>(undefined);

  const dispatch = useDispatch();
  const history = useHistory();

  const budgetDetail = useSelector(selectBudgetDetail);
  const budgetId = useSelector(selectBudgetId);
  const data = useSelector(selectSubAccounts);
  const search = useSelector(selectTableSearch);
  const subaccountDetail = useSelector(selectSubAccountDetail);
  const loadingSubAccount = useSelector(selectLoadingSubAcount);
  const groups = useSelector(selectGroups);
  const subAccountUnits = useSelector(selectSubAccountUnits);
  const commentsHistoryDrawerOpen = useSelector(selectCommentsHistoryDrawerOpen);

  return (
    <React.Fragment>
      <BudgetSubAccountsTable
        data={data}
        groups={groups}
        detail={subaccountDetail}
        loadingParent={loadingSubAccount}
        subAccountUnits={subAccountUnits}
        // Right now, the SubAccount recursion only goes 1 layer deep.
        // Account -> SubAccount -> Detail (Recrusive SubAccount).
        onRowExpand={null}
        tableFooterIdentifierValue={
          !isNil(subaccountDetail) && !isNil(subaccountDetail.description)
            ? `${subaccountDetail.description} Total`
            : "Sub Account Total"
        }
        exportFileName={!isNil(subaccountDetail) ? `subaccount_${subaccountDetail.identifier}` : ""}
        search={search}
        onSearch={(value: string) => dispatch(actions.setSubAccountsSearchAction(value))}
        categoryName={"Detail"}
        identifierFieldHeader={"Line"}
        onChangeEvent={(e: Table.ChangeEvent<BudgetTable.BudgetSubAccountRow>) =>
          dispatch(actions.handleTableChangeEventAction(e))
        }
        onBack={(row?: BudgetTable.FringeRow) => {
          if (!isNil(subaccountDetail)) {
            const ancestor = subaccountDetail.ancestors[subaccountDetail.ancestors.length - 1];
            if (ancestor.type === "subaccount") {
              history.push(`/budgets/${budgetId}/subaccounts/${ancestor.id}?row=${subaccountId}`);
            } else {
              history.push(`/budgets/${budgetId}/accounts/${ancestor.id}?row=${subaccountId}`);
            }
          }
        }}
        cookies={!isNil(subaccountDetail) ? { ordering: `subaccount-${subaccountDetail.id}-table-ordering` } : {}}
        onDeleteGroup={(group: Model.BudgetGroup) => dispatch(actions.deleteGroupAction(group.id))}
        onRowRemoveFromGroup={(row: BudgetTable.BudgetSubAccountRow) =>
          dispatch(actions.removeSubAccountFromGroupAction(row.id))
        }
        onRowAddToGroup={(group: number, row: BudgetTable.BudgetSubAccountRow) =>
          dispatch(actions.addSubAccountToGroupAction({ id: row.id, group }))
        }
        onGroupRows={(rows: BudgetTable.BudgetSubAccountRow[]) =>
          setGroupSubAccounts(map(rows, (row: BudgetTable.BudgetSubAccountRow) => row.id))
        }
        onEditGroup={(group: Model.BudgetGroup) => setGroupToEdit(group)}
        actions={[
          {
            tooltip: "Export as PDF",
            icon: faPrint,
            text: "Export PDF",
            onClick: () => {
              if (!isNil(budgetId)) {
                api.getBudgetPdf(budgetId).then((response: any) => {
                  download(response, !isNil(budgetDetail) ? `${budgetDetail.name}.pdf` : "budget.pdf");
                });
              }
            }
          },
          {
            tooltip: "Comments",
            text: "Comments",
            icon: faCommentsAlt,
            onClick: () => dispatch(setCommentsHistoryDrawerVisibilityAction(!commentsHistoryDrawerOpen))
          }
        ]}
      />
      {!isNil(groupSubAccounts) && (
        <CreateSubAccountGroupModal
          subaccountId={subaccountId}
          subaccounts={groupSubAccounts}
          open={true}
          onSuccess={(group: Model.BudgetGroup) => {
            setGroupSubAccounts(undefined);
            dispatch(actions.addGroupToStateAction(group));
          }}
          onCancel={() => setGroupSubAccounts(undefined)}
        />
      )}
      {!isNil(groupToEdit) && (
        <EditGroupModal<Model.BudgetGroup>
          group={groupToEdit}
          open={true}
          onCancel={() => setGroupToEdit(undefined)}
          onSuccess={(group: Model.BudgetGroup) => {
            setGroupToEdit(undefined);
            dispatch(actions.updateGroupInStateAction({ id: group.id, data: group }));
          }}
        />
      )}
    </React.Fragment>
  );
};

export default SubAccountsTable;
