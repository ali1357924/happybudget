import { ColDef, CellClassParams, RowNode } from "ag-grid-community";

export interface GetExportValueParams {
  node: RowNode;
  colDef: ColDef;
  value: string | undefined;
}

export type ExportValueGetters = { [key: string]: (params: GetExportValueParams) => string };

export interface GroupProps<
  R extends Table.Row<G, C>,
  G extends Table.RowGroup = Table.RowGroup,
  C extends Table.RowChild = Table.RowChild
> {
  valueGetter?: (row: R) => any;
  groupGetter?: (row: R) => G | null;
  onGroupRows: (rows: R[]) => void;
  onDeleteGroup: (group: G) => void;
}

export interface BudgetTableProps<
  R extends Table.Row<G, C>,
  G extends Table.RowGroup = Table.RowGroup,
  C extends Table.RowChild = Table.RowChild
> {
  bodyColumns: ColDef[];
  calculatedColumns?: ColDef[];
  table: R[];
  identifierField: string;
  identifierFieldHeader: string;
  identifierFieldParams?: Partial<ColDef>;
  footerRow: Partial<R>;
  search: string;
  saving: boolean;
  frameworkComponents?: { [key: string]: any };
  getExportValue?: ExportValueGetters;
  exportFileName?: string;
  nonEditableCells?: (keyof R)[];
  highlightedNonEditableCells?: (keyof R)[];
  nonHighlightedNonEditableCells?: (keyof R)[];
  groupParams?: GroupProps<R, G, C>;
  loading?: boolean;
  cellClass?: (params: CellClassParams) => string | undefined;
  highlightNonEditableCell?: (row: R, col: ColDef) => boolean;
  rowRefreshRequired?: (existing: R, row: R) => boolean;
  onSearch: (value: string) => void;
  onRowSelect: (id: number) => void;
  onRowDeselect: (id: number) => void;
  onRowUpdate: (payload: Table.RowChange) => void;
  onRowAdd: () => void;
  onRowDelete: (row: R) => void;
  onRowExpand?: (id: number) => void;
  onSelectAll: () => void;
  isCellEditable?: (row: R, col: ColDef) => boolean;
}
