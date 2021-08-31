import React from "react";
import Cell from "./Cell";

/* eslint-disable indent */
const ValueCell = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  S extends Redux.TableStore<R, M> = Redux.TableStore<R, M>
>({
  value,
  ...props
}: Table.ValueCellProps<R, M, S>): JSX.Element => {
  return <Cell<R, M, S> {...props}>{value}</Cell>;
};

export default React.memo(ValueCell) as typeof ValueCell;
