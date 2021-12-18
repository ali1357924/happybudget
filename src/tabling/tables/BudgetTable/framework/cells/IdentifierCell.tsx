import React from "react";

import { framework } from "tabling/generic";
import { ValueCell } from "tabling/generic/framework/cells";

const IdentifierCell = <
  R extends Tables.BudgetRowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.BudgetTableStore<R> = Redux.BudgetTableStore<R>
>(
  props: Table.ValueCellProps<R, M, S>
): JSX.Element => {
  return <ValueCell<R, M> {...props} />;
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default framework.connectCellToStore<any, any>(React.memo(IdentifierCell)) as typeof IdentifierCell;
