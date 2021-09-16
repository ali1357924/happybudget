import { isNil } from "lodash";

import { ExpandCell as GenericExpandCell, ExpandCellProps } from "components/tabling/generic/framework/cells";

/* eslint-disable indent */
const ExpandCell = <
  R extends Table.RowData,
  M extends Model.HttpModel = Model.HttpModel,
  S extends Redux.BudgetTableStore<R, M> = Redux.BudgetTableStore<R, M>
>(
  props: ExpandCellProps<R, M, S>
): JSX.Element => {
  return (
    <GenericExpandCell
      {...props}
      alwaysShow={(row: Table.ModelRow<R, M>) => !isNil(row.children) && row.children.length !== 0}
    />
  );
};

export default ExpandCell;
