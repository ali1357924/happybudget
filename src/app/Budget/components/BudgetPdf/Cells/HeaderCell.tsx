import classNames from "classnames";

import Cell, { CellProps } from "./Cell";

const HeaderCell = <R extends Table.RowData, M extends Model.HttpModel = Model.HttpModel>(
  props: Omit<CellProps<R, M>, "rawValue" | "value">
): JSX.Element => {
  return (
    <Cell
      {...props}
      className={classNames("th", props.className)}
      textClassName={classNames("th-text", props.textClassName)}
      isHeader={true}
      rawValue={props.column.headerName || ""}
      value={props.column.headerName || ""}
    />
  );
};

export default HeaderCell;
