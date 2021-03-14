import { useSelector } from "react-redux";
import { ICellRendererParams, RowNode } from "ag-grid-community";

import { BudgetItemsTreeSelect } from "components/control";

interface UnitCellProps extends ICellRendererParams {
  onChange: (object_id: number, parent_type: string, row: Table.IActualRow) => void;
  node: RowNode;
}

const BudgetItemCell = ({ node, onChange }: UnitCellProps): JSX.Element => {
  const budgetItemsTree = useSelector((state: Redux.IApplicationStore) => state.actuals.budgetItemsTree);

  return (
    <BudgetItemsTreeSelect
      value={node.data.object_id}
      onChange={(nd: IBudgetItemNode) => onChange(nd.id, nd.type, node.data)}
      nodes={budgetItemsTree.data}
    />
  );
};

export default BudgetItemCell;
