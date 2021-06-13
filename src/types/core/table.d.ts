/// <reference path="./modeling.d.ts" />

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace Table {
  type RowType = "subaccount" | "account" | "fringe" | "actual";

  interface RowMeta {
    readonly isGroupFooter?: boolean;
    readonly isTableFooter?: boolean;
    readonly isBudgetFooter?: boolean;
    readonly children: number[];
    readonly label: string;
    readonly typeLabel: string;
    readonly fieldsLoading: string[];
    readonly type: Table.RowType;
  }

  interface PdfRowMeta<C extends Model.Model> {
    readonly children: C[];
  }

  interface PageAndSize {
    readonly page: number;
    readonly pageSize: number;
  }

  interface Row<RE = RowMeta> extends Record<string, any> {
    readonly id: number;
    readonly meta: RE;
    readonly group: number | null;
  }

  interface RowColorDefinition {
    readonly backgroundColor?: string;
    readonly color?: string;
  }

  type PdfRow<C extends Model.Model> = Table.Row<PdfRowMeta<C>>;

  type ColumnTypeId =
    | "text"
    | "longText"
    | "singleSelect"
    | "contactCard"
    | "phoneNumber"
    | "email"
    | "number"
    | "phone"
    | "contact"
    | "currency"
    | "sum"
    | "percentage"
    | "date"
    | "action";

  type ColumnAlignment = "right" | "left" | null;

  interface ColumnType {
    readonly id: ColumnTypeId;
    readonly style?: React.CSSProperties;
    readonly icon?: any;
    readonly editorIsPopup?: boolean;
    readonly pdfOverrides?: Omit<Partial<ColumnType>, "id" | "editorIsPopup">;
    readonly headerOverrides?: Omit<Partial<ColumnType>, "id" | "editorIsPopup" | "icon" | "pdfOverrides">;
  }

  type APIs = {
    readonly grid: import("@ag-grid-community/core").GridApi;
    readonly column: import("@ag-grid-community/core").ColumnApi;
  };

  interface ColumnVisibilityChange {
    readonly field: string;
    readonly visible: boolean;
  }

  type Formatter = (value: string | number) => string;

  interface FooterColumn<R extends Table.Row> extends Omit<import("@ag-grid-community/core").ColDef, "field" | "headerName"> {
    readonly value?: any;
  }

  type PdfCellStandardProps = {
    readonly style?: Table.OptionalPdfCellCallback<R, M, C, import("@react-pdf/types").Style>;
    readonly className?: Table.OptionalPdfCellCallback<R, M, C, string>;
    readonly textStyle?: Table.OptionalPdfCellCallback<R, M, C, import("@react-pdf/types").Style>;
    readonly textClassName?: Table.OptionalPdfCellCallback<R, M, C, string>;
  }
  type PdfCellLocation = { index: number, colIndex: number };
  type PdfCellCallbackParams<R extends Table.PdfRow<C>, M extends Model.Model, C extends Model.Model> = {
    readonly location: PdfCellLocation;
    readonly column: Table.PdfColumm<R, M, C>;
    readonly row: R;
    readonly isHeader: boolean;
    readonly rawValue: any;
    readonly value: any;
  }
  type PdfCellCallback<R extends Table.PdfRow<C>, M extends Model.Model, C extends Model.Model, V = any> = (params: PdfCellCallbackParams<R, M, C>) => V;
  type OptionalPdfCellCallback<R extends Table.PdfRow<C>, M extends Model.Model, C extends Model.Model, V = any> = V | Table.PdfCellCallback<R, M, C, V>;

  interface FooterPdfColumn {
    readonly value?: any;
    readonly textStyle?: import("@react-pdf/types").Style;
  }

  interface Column<R extends Table.Row> extends Omit<import("@ag-grid-community/core").ColDef, "field"> {
    readonly type: ColumnTypeId;
    readonly nullValue?: null | "" | 0 | [];
    readonly field: keyof R & string;
    readonly isCalculated?: boolean;
    readonly excludeFromExport?: boolean;
    readonly processCellForClipboard?: (row: R) => string;
    readonly processCellFromClipboard?: (value: string) => any;
    readonly budget?: FooterColumn<R>;
    readonly footer?: FooterColumn<R>;
  }

  interface PdfColumn<R extends Table.PdfRow<C>, M extends Model.Model, C extends Model.Model> {
    readonly field: keyof R & string;
    readonly headerName: string;
    readonly isCalculated?: boolean;
    readonly type: Table.ColumnTypeId;
    readonly formatter?: Formatter;
    readonly width?: string | number;
    readonly cellProps?: PdfCellStandardProps;
    readonly headerCellProps?: PdfCellStandardProps;
    readonly footer?: Table.FooterPdfColumn;
    readonly cellContentsVisible?: Table.OptionalPdfCellCallback<R, M, C, boolean>;
    readonly cellRenderer?: (params: PdfCellCallbackParams<R, M, C>) => JSX.Element;
    // NOTE: This only applies for the individual Account tables, not the overall
    // Accounts table.
    readonly childFooter?: (s: M) => Table.FooterPdfColumn;
  }

  type CellChange<R extends Table.Row, V = R[keyof R]> = {
    readonly oldValue: V;
    readonly newValue: V;
    readonly field: keyof R;
    readonly id: number;
  };

  type RowChangeData<R extends Table.Row> = {
    readonly [key in keyof R]?: Omit<Table.CellChange<R[key]>, "field", "id">;
  };

  type RowChange<R extends Table.Row> = {
    readonly id: number;
    readonly data: RowChangeData<R>;
  };

  type Change<R extends Table.Row> =
    | Table.RowChange<R>
    | Table.CellChange<R>
    | (Table.CellChange<R> | Table.RowChange<R>)[];

  type ConsolidatedChange<R extends Table.Row> = Table.RowChange<R>[];

  type RowAddPayload<R extends Table.Row> = number | Partial<R> | Partial<R>[];
  type RowAddFunc<R extends Table.Row> = (payload: RowAddPayload<R>) => void;

  type ChangeEventId = "dataChange" | "rowAdd" | "rowDelete";

  type BaseChangeEvent = {
    readonly type: ChangeEventId;
  }

  type DataChangeEvent<R extends Table.Row> = Table.BaseChangeEvent & {
    readonly type: "dataChange";
    readonly payload: Table.Change<R>
  }

  type RowAddEvent<R extends Table.Row> = Table.BaseChangeEvent & {
    readonly type: "rowAdd";
    readonly payload: Table.RowAddPayload<R>;
  }

  type RowDeleteEvent = Table.BaseChangeEvent & {
    readonly type: "rowDelete";
    readonly payload: number[] | number;
  }

  type ChangeEvent<R extends Table.Row> = DataChangeEvent<R> | RowAddEvent<R> | RowDeleteEvent;

  // TODO: We need to merge this together with other mechanics.
  interface CellValueChangedParams<R extends Table.Row> {
    readonly column: import("@ag-grid-community/core").Column;
    readonly row: R;
    readonly oldRow: R | null;
    readonly node: import("@ag-grid-community/core").RowNode;
    readonly oldValue: any;
    readonly newValue: any;
    readonly change: Table.Change<R>;
  }

  interface CellPositionMoveOptions {
    readonly startEdit?: boolean;
  }

  type CellDoneEditingEvent =
    | import("react").SyntheticEvent
    | KeyboardEvent
    | import("antd/lib/checkbox").CheckboxChangeEvent;

  // I really don't know why, but extending import("@ag-grid-community/core").ICellEditorParams
  // does not work here.
  interface CellEditorParams {
    readonly value: any;
    readonly keyPress: number | null;
    readonly charPress: string | null;
    readonly column: import("@ag-grid-community/core").Column;
    readonly colDef: import("@ag-grid-community/core").ColDef;
    readonly node: import("@ag-grid-community/core").RowNode;
    readonly data: any;
    readonly rowIndex: number;
    readonly api: import("@ag-grid-community/core").GridApi | null | undefined;
    readonly columnApi: import("@ag-grid-community/core").ColumnApi | null | undefined;
    readonly cellStartedEdit: boolean;
    readonly context: any;
    readonly onKeyDown: (event: KeyboardEvent) => void;
    readonly stopEditing: (suppressNavigateAfterEdit?: boolean) => void;
    readonly eGridCell: HTMLElement;
    readonly parseValue: (value: any) => any;
    readonly formatValue: (value: any) => any;
    // When the cell editor finishes editing, the AG Grid callback (onCellDoneEditing)
    // does not have any context about what event triggered the completion, so we have
    // to handle that ourselves so we can trigger different behaviors depending on
    // how the selection was performed.
    readonly onDoneEditing: (e: Table.CellDoneEditingEvent) => void;
  }

  type DataObjType<R extends Table.Row, M extends Model.Model> = R | M | Table.RowChange<R> | Table.RowChangeData<R>;
  type RowObjType<R extends Table.Row> = R | Table.RowChange<R> | Table.RowChangeData<R>;

  type IBaseField<R extends Table.Row, M extends Model.Model> = {
    // Whether or not the field is required to be present for POST requests (i.e.
    // when creating a new instance).  If the field is required, the mechanics will
    // wait until a value is present for the field before creating an instance
    // via an HTTP POST request that is associated with the row (R).
    readonly required?: boolean;
  };

  type IReadField<R extends Table.Row, M extends Model.Model> = Table.IBaseField<R, M> & {
    readonly read: true;
    // Whether or not the model (M) field value should be used to construct the
    // row (R) model.
    readonly modelOnly?: boolean;
    // Whether or not the row (R) field should be used to update the model (M).
    readonly rowOnly?: boolean;
    readonly getValue: (obj: Table.DataObjType<R, M>) => any;
  };

  type IReadFieldConfig<R extends Table.Row, M extends Model.Model> = Omit<Table.IReadField<R, M>, "read" | "getValue">;

  type IWriteField<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Table.IBaseField<
    R,
    M
  > & {
    readonly write: true;
    // Whether or not the field value is allowed to take on null values for HTTP
    // requests.
    readonly allowNull?: boolean;
    // Whether or not the field value is allowed to take on empty string values for
    // HTTP requests.
    readonly allowBlank?: boolean;
    // The HTTP methods that the field should be used for.  Defaults to PATCH and
    // POST requests.
    readonly http?: Http.Method[];
    // Used to transform a value that is on the row (R) model to a value that is
    // included in the HTTP PATCH or POST payloads.
    readonly httpValueConverter?: (value: R[keyof R]) => P[keyof P] | undefined;
    readonly getHttpValue: (row: R | Partial<R> | Table.RowChange<R>, method?: Http.Method) => P[keyof P] | undefined;
    readonly getValue: (obj: Table.DataObjType<R, M>) => any;
  };

  type IWriteFieldConfig<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Omit<
    Table.IWriteField<R, M, P>,
    "write" | "getHttpValue" | "getValue"
  >;

  type IReadWriteField<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Table.IWriteField<
    R,
    M,
    P
  > &
    Table.IReadField<R, M>;

  type IReadWriteFieldConfig<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Omit<
    Table.IReadWriteField<R, M, P>,
    "read" | "write" | "getValue" | "getHttpValue"
  >;

  // Field configuration for Field that is included in HTTP requests to update or
  // create the instance but not on the model (M) or row (R).
  type IWriteOnlyField<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Omit<
    Table.IWriteField<R, M, P>,
    "getValue"
  > & {
    readonly field: keyof P;
    readonly writeOnly: true;
    readonly getValueFromRowChangeData: (data: Table.RowChangeData<R>) => P[keyof P] | undefined;
    readonly getValueFromRow: (row: R) => P[keyof P] | undefined;
    readonly getValue: (obj: Table.RowObjType<R>) => any;
  };

  type IWriteOnlyFieldConfig<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Omit<
    Table.IWriteOnlyField<R, M, P>,
    "write" | "writeOnly" | "getValue" | "getHttpValue"
  >;

  // Field configuration for Field that is not included in HTTP requests to update or
  // create the instance but present on the model (M) and row (R).
  type IReadOnlyField<R extends Table.GenericRow, M extends Model.Model> = Table.IReadField<R, M> & {
    readonly field: keyof M & keyof R;
    readonly readOnly: true;
  };

  type IReadOnlyFieldConfig<R extends Table.Row, M extends Model.Model> = Omit<
    Table.IReadOnlyField<R, M>,
    "read" | "readOnly" | "getValue"
  >;

  type ISplitReadWriteField<
    R extends Table.Row,
    M extends Model.Model,
    P extends Http.ModelPayload<M>
  > = Table.IReadWriteField<R, M, P> & {
    // The name of the field on the model (M) model that the field configuration
    // corresponds to.
    readonly modelField: keyof M & keyof P;
    // The name of the field on the row (R) model that the field configuration
    // corresponds to.
    readonly rowField: keyof R;
  };

  type ISplitReadWriteFieldConfig<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Omit<
    Table.ISplitReadWriteField<R, M, P>,
    "read" | "write" | "getValue" | "getHttpValue"
  >;

  type IAgnosticReadWriteField<
    R extends Table.Row,
    M extends Model.Model,
    P extends Http.ModelPayload<M>
  > = Table.IReadWriteField<R, M, P> & {
    // The name of the field on both the row (R) model and model (M) model that the
    // field configuration corresponds to.
    readonly field: keyof M & keyof R & keyof P;
  };

  type IAgnosticReadWriteFieldConfig<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> = Omit<
    Table.IAgnosticReadWriteField<R, M, P>,
    "read" | "write" | "getValue" | "getHttpValue"
  >;

  type WriteableField<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> =
    | Table.ISplitReadWriteField<R, M, P>
    | Table.IAgnosticReadWriteField<R, M, P>
    | Table.IWriteOnlyField<R, M, P>;

  type Field<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M> = Http.ModelPayload<M>> =
    | Table.WriteableField<R, M, P>
    | Table.IReadOnlyField<R, M>;

  // TODO: This needs to include the methods on the class as well.
  interface IRowManagerConfig<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>> {
    readonly fields: Table.Field<R, M, P>[];
    readonly childrenGetter?: ((model: M) => number[]) | string | null;
    readonly groupGetter?: ((model: M) => number | null) | string | null;
    readonly typeLabel: string;
    readonly rowType: Table.RowType;
    readonly labelGetter: (model: M) => string;
  }

  interface IPdfRowManagerConfig<R extends Table.PdfRow, M extends Model.Model, C extends Model.Model> {
    readonly fields: Table.IReadOnlyField<R, M>[];
    readonly childrenGetter?: ((model: M) => C[]) | string | null;
    readonly groupGetter?: ((model: M) => number | null) | string | null;
  }

  interface IRowManager<R extends Table.Row, M extends Model.Model, P extends Http.ModelPayload<M>>
    extends Table.IRowManagerConfig<R, M, P> {
    readonly requiredFields: Table.Field<R, M, P>[];
    readonly getField: (name: keyof R | keyof M) => Table.Field<R, M, P> | null;
    readonly getChildren: (model: M) => number[];
    readonly getGroup: (model: M) => number | null;
    readonly modelToRow: (model: M, meta: Partial<Table.RowMeta> = {}) => R;
    readonly mergeChangesWithRow: (obj: R, change: Table.RowChange<R>) => R;
    readonly mergeChangesWithModel: (obj: M, change: Table.RowChange<R>) => M;
    readonly payload: (row: R | Partial<R> | Table.RowChange<R>) => P | Partial<P>;
  }

  interface IPdfRowManager<R extends Table.PdfRow, M extends Model.Model, C extends Model.Model>
    extends Table.IPdfRowManagerConfig<R, M, C> {
    readonly getField: (name: keyof R | keyof M) => Table.IReadOnlyField<R, M> | null;
    readonly getChildren: (model: M) => C[];
    readonly getGroup: (model: M) => number | null;
    readonly modelToRow: (model: M, meta: Partial<Table.PdfRowMeta> = {}) => R;
  }
}

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace BudgetTable {
  type GridId = "primary" | "tableFooter" | "budgetFooter";
  type GridSet<T> = { primary: T; tableFooter: T; budgetFooter: T };

  interface GroupProps<R extends Table.Row, G extends Model.Group = Model.Group> {
    readonly onGroupRows: (rows: R[]) => void;
    readonly onDeleteGroup: (group: G) => void;
    readonly onEditGroup: (group: G) => void;
    readonly onRowRemoveFromGroup: (row: R) => void;
    readonly onRowAddToGroup: (groupId: number, row: R) => void;
  }

  interface CookiesProps {
    readonly ordering?: string;
  }

  type MenuAction = {
    readonly icon: import("@fortawesome/fontawesome-svg-core").IconProp;
    readonly tooltip?: Partial<import("antd/lib/tooltip").TooltipPropsWithTitle> | string;
    readonly onClick?: () => void;
    readonly disabled?: boolean;
    readonly text?: string;
    readonly render?: RenderFunc;
    readonly wrap?: (children: ReactNode) => JSX.Element;
  }

  interface MenuActionParams<R extends Table.Row> {
    readonly apis: Table.APIs;
    readonly columns: Table.Column<R>[];
  }

  interface MenuProps<R extends Table.Row> {
    readonly apis: Table.APIs;
    readonly columns: Table.Column<R>[];
    readonly actions?:
      | ((params: BudgetTable.MenuActionParams<R>) => BudgetTable.MenuAction[])
      | BudgetTable.MenuAction[];
    readonly search?: string;
    readonly detached?: boolean;
    readonly onSearch?: (value: string) => void;
  }

  // The abstract/generic <Grid> component that wraps AG Grid right at the interface.
  interface GridProps<R extends Table.Row = Table.Row>
    extends Omit<
      import("@ag-grid-community/react").AGGridReactProps,
      "columnDefs" | "overlayNoRowsTemplate" | "overlayLoadingTemplate" | "modules" | "debug"
    > {
    readonly columns: Table.Column<R>[];
  }

  interface SpecificGridProps {
    readonly apis: Table.APIs | null;
    readonly onFirstDataRendered: (e: import("ag-grid-community/core").FirstDataRenderedEvent) => void;
    readonly onGridReady: (event: import("@ag-grid-community/core").GridReadyEvent) => void;
    readonly options?: import("@ag-grid-community/core").GridOptions;
    readonly columns: Table.Column<R>[];
  }

  interface BudgetFooterGridProps<R extends Table.Row> extends SpecificGridProps {
    readonly loadingBudget?: boolean | undefined;
  }

  interface TableFooterGridProps<R extends Table.Row> extends SpecificGridProps {
    readonly loadingParent?: boolean;
  }

  // Props provided to the BudgetTable that are passed directly through to the PrimaryGrid.
  interface PrimaryGridPassThroughProps<
    R extends Table.Row,
    M extends Model.Model,
    G extends Model.Group = Model.Group
  > {
    readonly data: M[];
    readonly groups?: G[];
    readonly groupParams?: BudgetTable.GroupProps<R, G>;
    readonly frameworkComponents?: { [key: string]: any };
    readonly search?: string;
    readonly columns: Table.Column<R>[];
    readonly manager: Table.IRowManager<R, M, P>;
    readonly onChangeEvent: (event: Table.ChangeEvent<R>) => void;
    // Callback to conditionally set the ability of a row to expand or not.  Only applicable if
    // onRowExpand is provided to the BudgetTable.
    readonly rowCanExpand?: (row: R) => boolean;
    readonly onRowExpand?: null | ((id: number) => void);
    readonly onBack?: () => void;
  }

  interface PrimaryGridRef {
    readonly getCSVData: (fields?: string[]) => CSVData;
  }

  interface PrimaryGridProps<R extends Table.Row, M extends Model.Model, G extends Model.Group = Model.Group>
    extends BudgetTable.PrimaryGridPassThroughProps<R, M, G>,
      Omit<BudgetTable.MenuProps<R>, "columns" | "onExport" | "onDelete" | "apis">,
      SpecificGridProps {
    readonly gridRef: import("react").RefObject<PrimaryGridRef>;
    readonly ordering: FieldOrder<keyof R>[];
    readonly isCellEditable: (row: R, colDef: Table.Column<R>) => boolean;
  }

  interface Ref extends PrimaryGridRef {
    readonly changeColumnVisibility: (changes: Table.ColumnVisibilityChange[]) => void;
    readonly setColumnVisibility: (change: Table.ColumnVisibilityChange) => void;
  }

  interface Props<
    R extends Table.Row,
    M extends Model.Model,
    G extends Model.Group = Model.Group,
    P extends Http.ModelPayload<M> = Http.ModelPayload<M>
  > extends Omit<BudgetTable.MenuProps<R>, "columns" | "onColumnsChange" | "onExport" | "onDelete" | "apis">,
      BudgetTable.PrimaryGridPassThroughProps<R, M, G>,
      StandardComponentProps {
    readonly tableRef: import("react").RefObject<BudgetTable.Ref>;
    readonly indexColumn?: Partial<Table.Column<R>>;
    readonly expandColumn?: Partial<Table.Column<R>>;
    readonly loadingBudget?: boolean;
    readonly loadingParent?: boolean;
    readonly exportable?: boolean;
    readonly nonEditableCells?: (keyof R)[];
    readonly cookies?: BudgetTable.CookiesProps;
    readonly loading?: boolean;
    readonly cellClass?: (params: import("@ag-grid-community/core").CellClassParams) => string | undefined;
    readonly isCellEditable?: (row: R, col: Table.Column) => boolean;
    readonly isCellSelectable?: (row: R, col: Table.Column) => boolean;
  }

  interface AccountRow extends Table.Row {
    readonly identifier: string | null;
    readonly description: string | null;
    readonly estimated: number | null;
  }

  interface BudgetAccountRow extends BudgetTable.AccountRow {
    readonly variance: number | null;
    readonly actual: number | null;
  }

  interface TemplateAccountRow extends BudgetTable.AccountRow {}

  interface SubAccountRow extends Table.Row {
    readonly identifier: string | null;
    readonly name: string | null;
    readonly description: string | null;
    readonly quantity: number | null;
    readonly unit: Model.Tag | null;
    readonly multiplier: number | null;
    readonly rate: number | null;
    readonly estimated: number | null;
    readonly fringes: number[];
  }

  interface BudgetSubAccountRow extends BudgetTable.SubAccountRow {
    readonly actual: number | null;
    readonly variance: number | null;
  }

  interface TemplateSubAccountRow extends BudgetTable.SubAccountRow {}

  interface FringeRow extends Table.Row {
    readonly color: string | null;
    readonly name: string | null;
    readonly description: string | null;
    readonly cutoff: number | null;
    readonly rate: number | null;
    readonly unit: Model.FringeUnit;
  }

  interface ActualRow extends Table.Row {
    readonly description: string | null;
    readonly vendor: string | null;
    readonly purchase_order: string | null;
    readonly date: string | null;
    readonly payment_method: Model.PaymentMethod | null;
    readonly subaccount: Model.SimpleAccount;
    readonly payment_id: string | null;
    readonly value: string | null;
  }
}

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace BudgetPdf {
  interface Options {
    readonly excludeZeroTotals?: boolean;
  }

  interface SubAccountRow extends Table.PdfRow<Model.PdfSubAccount> {
    readonly identifier: string | null;
    readonly name: string | null;
    readonly description: string | null;
    readonly quantity: number | null;
    readonly unit: Model.Tag | null;
    readonly multiplier: number | null;
    readonly rate: number | null;
    readonly estimated: number | null;
  }

  interface AccountRow extends Table.PdfRow<Model.PdfSubAccount> {
    readonly identifier: string | null;
    readonly description: string | null;
    readonly estimated: number | null;
    readonly variance: number | null;
    readonly actual: number | null;
  }

  interface AccountRowGroup {
    readonly group: Model.BudgetGroup | null;
    readonly rows: BudgetPdf.AccountRow[];
  }

  interface TableProps<R extends Table.PdfRow<C>, M extends Model.Model, C extends Model.Model> {
    readonly columns: Table.PdfColumn<R, M, C>[];
    readonly manager: Table.IPdfRowManager<R, M, C>;
    readonly options: BudgetPdf.Options;
  }

  type AccountsTableProps = TableProps<BudgetPdf.AccountRow, Model.PdfAccount, Model.PdfSubAccount> & {
    readonly data: M[];
    readonly groups: Model.BudgetGroup[];
  }

  type AccountTableProps = TableProps<BudgetPdf.SubAccountRow, Model.PdfSubAccount, Model.PdfSubAccount> & {
    readonly account: Model.PdfAccount;
  }

  type SubAccountBlockProps = TableProps<BudgetPdf.SubAccountRow, Model.PdfSubAccount, Model.PdfSubAccount> & {
    readonly subaccount: Model.PdfSubAccount;
    readonly isLast?: boolean;
  }
}
