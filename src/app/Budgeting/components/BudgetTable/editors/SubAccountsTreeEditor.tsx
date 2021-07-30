import { useRef, forwardRef } from "react";
import { useSelector } from "react-redux";
import { isNil } from "lodash";

import { SubAccountTreeMenu } from "components/menus";
import { simpleDeepEqualSelector, simpleShallowEqualSelector } from "store/selectors";

import useModelMenuEditor from "./ModelMenuEditor";

const selectSubAccountsTree = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budget.budget.subAccountsTree.data
);
const selectSubAccountsTreeSearch = simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budget.budget.subAccountsTree.search
);
const selectSubAccountsTreeLoading = simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budget.budget.subAccountsTree.loading
);

interface SubAccountsTreeEditorProps extends Table.CellEditorParams<BudgetTable.ActualRow, Model.Actual> {
  readonly setSearch: (value: string) => void;
  readonly value: Model.SimpleSubAccount | null;
}

const SubAccountsTreeEditor = ({ setSearch, ...props }: SubAccountsTreeEditorProps, ref: any) => {
  const subAccountsTree = useSelector(selectSubAccountsTree);
  const search = useSelector(selectSubAccountsTreeSearch);
  const loading = useSelector(selectSubAccountsTreeLoading);
  const menuRef = useRef<ExpandedModelMenuRef<Model.SubAccountTreeNode>>(null);

  const [editor] = useModelMenuEditor<BudgetTable.ActualRow, Model.Actual, Model.SimpleSubAccount>({
    ...props,
    menuRef,
    forwardedRef: ref
  });

  return (
    <SubAccountTreeMenu
      style={{ minWidth: 200, maxWidth: 300 }}
      menuLoading={loading}
      onSearch={(v: string) => setSearch(v)}
      search={search}
      selected={!isNil(editor.value) ? editor.value.id : null}
      nodes={subAccountsTree}
      defaultFocusOnlyItem={true}
      defaultFocusFirstItem={true}
      autoFocusMenu={true}
      onChange={(m: Model.SimpleSubAccount, e: Table.CellDoneEditingEvent) => {
        editor.onChange(m, e);
      }}
      menuRef={menuRef}
      focusSearchOnCharPress={true}
    />
  );
};

export default forwardRef(SubAccountsTreeEditor);
