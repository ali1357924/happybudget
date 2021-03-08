import { isNil } from "lodash";

import { LockOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { ICellRendererParams, ColDef } from "ag-grid-community";

interface ValueCellProps extends ICellRendererParams {
  isCellEditable: (row: Redux.Budget.IAccountRow | Redux.Budget.ISubAccountRow, col: ColDef) => boolean;
  onDeselect: (id: number | string) => void;
  value: Redux.ICell<any>;
  colDef: ColDef;
}

const ValueCell = ({ isCellEditable, node, value, colDef }: ValueCellProps): JSX.Element => {
  if (!isCellEditable(node.data, colDef)) {
    return (
      <div>
        <LockOutlined className={"icon--lock"} />
        {!isNil(value) && value.value}
      </div>
    );
  } else if (!isNil(value) && !isNil(value.error)) {
    return (
      <div>
        <div className={"error-container"}>
          <div className={"text-error"}>{value.error}</div>
          <CloseCircleOutlined className={"icon--error"} />
        </div>
        {!isNil(value) && value.value}
      </div>
    );
  } else {
    return <>{!isNil(value) && value.value}</>;
  }
};

export default ValueCell;
