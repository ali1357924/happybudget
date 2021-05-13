import { isNil } from "lodash";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSigma, faPercentage, faUpload, faTrashAlt } from "@fortawesome/pro-solid-svg-icons";

import BudgetTable, { BudgetTableProps, BudgetTableActionsParams } from "../BudgetTable";

export interface GenericAccountsTableProps<
  R extends Table.AccountRow<G>,
  M extends Model.Account,
  G extends Model.Group,
  P extends Http.ModelPayload<M> = Http.ModelPayload<M>
> extends Omit<
    BudgetTableProps<R, M, G, P>,
    "identifierField" | "identifierFieldHeader" | "groupParams" | "tableFooterIdentifierValue" | "rowCanExpand"
  > {
  onGroupRows: (rows: R[]) => void;
  onDeleteGroup: (group: G) => void;
  onEditGroup: (group: G) => void;
  onRowRemoveFromGroup: (row: R) => void;
  onRowAddToGroup: (group: number, row: R) => void;
  detail: Model.Template | Model.Budget | undefined;
}

const GenericAccountsTable = <
  R extends Table.AccountRow<G>,
  M extends Model.Account,
  G extends Model.Group,
  P extends Http.ModelPayload<M> = Http.ModelPayload<M>
>({
  /* eslint-disable indent */
  onGroupRows,
  onDeleteGroup,
  onEditGroup,
  onRowRemoveFromGroup,
  onRowAddToGroup,
  detail,
  ...props
}: GenericAccountsTableProps<R, M, G, P>): JSX.Element => {
  return (
    <BudgetTable<R, M, G, P>
      identifierField={"identifier"}
      identifierFieldHeader={"Account"}
      tableFooterIdentifierValue={!isNil(detail) ? `${detail.name} Total` : "Total"}
      sizeColumnsToFit={false}
      groupParams={{
        onDeleteGroup,
        onRowRemoveFromGroup,
        onGroupRows,
        onEditGroup,
        onRowAddToGroup
      }}
      rowCanExpand={(row: R) => row.identifier !== null}
      actions={(params: BudgetTableActionsParams<R, G>) => [
        {
          tooltip: "Delete",
          icon: <FontAwesomeIcon icon={faTrashAlt} />,
          disabled: params.selectedRows.length === 0,
          onClick: params.onDelete
        },
        {
          tooltip: "Sub-Total",
          icon: <FontAwesomeIcon icon={faSigma} />,
          disabled: true
        },
        {
          tooltip: "Mark Up",
          icon: <FontAwesomeIcon icon={faPercentage} />,
          disabled: true
        },
        {
          tooltip: "Import",
          icon: <FontAwesomeIcon icon={faUpload} />,
          disabled: true
        }
      ]}
      {...props}
      columns={[
        {
          field: "description",
          headerName: "Account Description",
          flex: 100
        },
        ...props.columns
      ]}
    />
  );
};

export default GenericAccountsTable;
