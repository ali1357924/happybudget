import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { isNil } from "lodash";
import { map } from "lodash";

import { tabling, redux } from "lib";
import { CreateTemplateAccountGroupModal, EditGroupModal } from "components/modals";
import { TemplateAccountsTable } from "components/tabling";

import * as actions from "../../../store/actions/template/accounts";

const selectGroups = redux.selectors.simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budget.template.budget.groups.data
);
const selectData = redux.selectors.simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budget.template.budget.children.data
);
const selectTableSearch = redux.selectors.simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budget.template.budget.children.search
);

interface AccountsTableProps {
  readonly templateId: number;
  readonly template: Model.Template | undefined;
}

const AccountsTable = ({ templateId, template }: AccountsTableProps): JSX.Element => {
  const [groupAccounts, setGroupAccounts] = useState<number[] | undefined>(undefined);
  const [groupToEdit, setGroupToEdit] = useState<Model.Group | undefined>(undefined);

  const dispatch = useDispatch();
  const history = useHistory();

  const data = useSelector(selectData);
  const search = useSelector(selectTableSearch);
  const groups = useSelector(selectGroups);

  const table = tabling.hooks.useBudgetTable<Tables.AccountRow, Model.Account>();

  return (
    <React.Fragment>
      <TemplateAccountsTable
        table={table}
        data={data}
        groups={groups}
        template={template}
        search={search}
        menuPortalId={"supplementary-header"}
        onSearch={(value: string) => dispatch(actions.setAccountsSearchAction(value))}
        onChangeEvent={(e: Table.ChangeEvent<Tables.AccountRow, Model.Account>) =>
          dispatch(actions.handleTableChangeEventAction(e))
        }
        onRowExpand={(id: number) => history.push(`/templates/${templateId}/accounts/${id}`)}
        onGroupRows={(rows: Tables.AccountRow[]) => setGroupAccounts(map(rows, (row: Tables.AccountRow) => row.id))}
        onEditGroup={(group: Model.Group) => setGroupToEdit(group)}
      />
      {!isNil(groupAccounts) && !isNil(templateId) && (
        <CreateTemplateAccountGroupModal
          templateId={templateId}
          accounts={groupAccounts}
          open={true}
          onSuccess={(group: Model.Group) => {
            setGroupAccounts(undefined);
            dispatch(actions.addGroupToStateAction(group));
          }}
          onCancel={() => setGroupAccounts(undefined)}
        />
      )}
      {!isNil(groupToEdit) && (
        <EditGroupModal
          group={groupToEdit}
          open={true}
          onCancel={() => setGroupToEdit(undefined)}
          onSuccess={(group: Model.Group) => {
            setGroupToEdit(undefined);
            dispatch(actions.updateGroupInStateAction({ id: group.id, data: group }));
            if (group.color !== groupToEdit.color) {
              table.current.applyGroupColorChange(group);
            }
          }}
        />
      )}
    </React.Fragment>
  );
};

export default AccountsTable;
