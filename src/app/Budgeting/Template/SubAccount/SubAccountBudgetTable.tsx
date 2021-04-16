import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { isNil, map } from "lodash";
import { createSelector } from "reselect";

import { CreateSubAccountGroupModal, EditGroupModal } from "components/modals";
import { simpleDeepEqualSelector, simpleShallowEqualSelector } from "store/selectors";

import SubAccountsTable from "../SubAccountsTable";
import { selectTemplateId } from "../../store/selectors";
import {
  setSubAccountsSearchAction,
  selectSubAccountAction,
  addPlaceholdersToStateAction,
  deselectSubAccountAction,
  removeSubAccountAction,
  updateSubAccountAction,
  selectAllSubAccountsAction,
  deleteGroupAction,
  addGroupToStateAction,
  removeSubAccountFromGroupAction,
  bulkUpdateSubAccountAction,
  updateGroupInStateAction
} from "../../store/actions/template/subAccount";

const selectGroups = simpleDeepEqualSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.groups.data
);
const selectSelectedRows = simpleDeepEqualSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.selected
);
const selectSubAccounts = simpleDeepEqualSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.data
);
const selectTableSearch = simpleShallowEqualSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.search
);
const selectPlaceholders = simpleShallowEqualSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.placeholders
);
const selectSaving = createSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.deleting,
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.updating,
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.creating,
  (deleting: Redux.ModelListActionInstance[], updating: Redux.ModelListActionInstance[], creating: boolean) =>
    deleting.length !== 0 || updating.length !== 0 || creating === true
);
const selectSubAccountDetail = simpleDeepEqualSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.detail.data
);
const selectReadyToRender = createSelector(
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.responseWasReceived,
  (state: Redux.ApplicationStore) => state.template.subaccount.subaccounts.groups.responseWasReceived,
  (accountsResponseReceived: boolean, groupsResponseReceived: boolean) =>
    accountsResponseReceived === true && groupsResponseReceived === true
);

interface SubAccounttemplateTableProps {
  subaccountId: number;
}

const SubAccounttemplateTable = ({ subaccountId }: SubAccounttemplateTableProps): JSX.Element => {
  const [groupSubAccounts, setGroupSubAccounts] = useState<number[] | undefined>(undefined);
  const [groupToEdit, setGroupToEdit] = useState<Model.TemplateGroup | undefined>(undefined);

  const dispatch = useDispatch();
  const history = useHistory();
  const templateId = useSelector(selectTemplateId);
  const data = useSelector(selectSubAccounts);
  const placeholders = useSelector(selectPlaceholders);
  const selected = useSelector(selectSelectedRows);
  const search = useSelector(selectTableSearch);
  const saving = useSelector(selectSaving);
  const subaccountDetail = useSelector(selectSubAccountDetail);
  const groups = useSelector(selectGroups);
  const readyToRender = useSelector(selectReadyToRender);

  return (
    <React.Fragment>
      <SubAccountsTable
        data={data}
        groups={groups}
        placeholders={placeholders}
        selected={selected}
        renderFlag={readyToRender}
        tableFooterIdentifierValue={
          !isNil(subaccountDetail) && !isNil(subaccountDetail.description)
            ? `${subaccountDetail.description} Total`
            : "Sub Account Total"
        }
        search={search}
        onSearch={(value: string) => dispatch(setSubAccountsSearchAction(value))}
        saving={saving}
        onRowAdd={() => dispatch(addPlaceholdersToStateAction(1))}
        onRowSelect={(id: number) => dispatch(selectSubAccountAction(id))}
        onRowDeselect={(id: number) => dispatch(deselectSubAccountAction(id))}
        onRowDelete={(row: Table.TemplateSubAccountRow) => dispatch(removeSubAccountAction(row.id))}
        onRowUpdate={(payload: Table.RowChange<Table.TemplateSubAccountRow>) =>
          dispatch(updateSubAccountAction(payload))
        }
        onRowBulkUpdate={(changes: Table.RowChange<Table.TemplateSubAccountRow>[]) =>
          dispatch(bulkUpdateSubAccountAction(changes))
        }
        onRowExpand={(id: number) => history.push(`/templates/${templateId}/subaccounts/${id}`)}
        onBack={() => {
          if (!isNil(subaccountDetail)) {
            const ancestor = subaccountDetail.ancestors[subaccountDetail.ancestors.length - 1];
            if (ancestor.type === "subaccount") {
              history.push(`/templates/${templateId}/subaccounts/${ancestor.id}`);
            } else {
              history.push(`/templates/${templateId}/accounts/${ancestor.id}`);
            }
          }
        }}
        cookies={!isNil(subaccountDetail) ? { ordering: `subaccount-${subaccountDetail.id}-table-ordering` } : {}}
        onDeleteGroup={(group: Model.TemplateGroup) => dispatch(deleteGroupAction(group.id))}
        onRowRemoveFromGroup={(row: Table.TemplateSubAccountRow) => dispatch(removeSubAccountFromGroupAction(row.id))}
        onGroupRows={(rows: Table.TemplateSubAccountRow[]) =>
          setGroupSubAccounts(map(rows, (row: Table.TemplateSubAccountRow) => row.id))
        }
        onEditGroup={(group: Model.TemplateGroup) => setGroupToEdit(group)}
        onSelectAll={() => dispatch(selectAllSubAccountsAction(null))}
        tableTotals={{
          estimated: !isNil(subaccountDetail) && !isNil(subaccountDetail.estimated) ? subaccountDetail.estimated : 0.0
        }}
      />
      {!isNil(groupSubAccounts) && (
        <CreateSubAccountGroupModal<Model.TemplateGroup>
          subaccountId={subaccountId}
          subaccounts={groupSubAccounts}
          open={true}
          onSuccess={(group: Model.TemplateGroup) => {
            setGroupSubAccounts(undefined);
            dispatch(addGroupToStateAction(group));
          }}
          onCancel={() => setGroupSubAccounts(undefined)}
        />
      )}
      {!isNil(groupToEdit) && (
        <EditGroupModal<Model.TemplateGroup>
          group={groupToEdit}
          open={true}
          onCancel={() => setGroupToEdit(undefined)}
          onSuccess={(group: Model.TemplateGroup) => {
            setGroupToEdit(undefined);
            dispatch(updateGroupInStateAction(group));
          }}
        />
      )}
    </React.Fragment>
  );
};

export default SubAccounttemplateTable;
