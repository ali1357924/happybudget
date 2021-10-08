/// <reference path="../modeling/models.d.ts" />

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace Table {
  type Name = "account-subaccounts" | "accounts" | "subaccount-subaccounts" | "fringes" | "actuals" | "contacts";
  type Id = `${Name}-table`;
  type AsyncId = `async-${Id}`;
  type Domain = "pdf" | "aggrid";

  type AgGridProps = import("@ag-grid-community/react/lib/interfaces").AgGridReactProps;

  type NullValue<R extends RowData> = R[keyof R];

  type NativeFormatterParams<P extends string | number> = P | null;
  type AGFormatterParams = import("@ag-grid-community/core").ValueFormatterParams;

  type AGFormatter = (params: AGFormatterParams) => string;
  type NativeFormatter<P extends string | number> = (params: NativeFormatterParams<P>) => string;

  type GridApi = import("@ag-grid-community/core").GridApi;
  type ColumnApi = import("@ag-grid-community/core").ColumnApi;
  type GridApis = {
    readonly grid: GridApi;
    readonly column: ColumnApi;
  };

  type FooterGridId = "footer" | "page";
  type GridId = "data" | FooterGridId;
  type GridSet<T> = { [key in GridId]: T };
  type FooterGridSet<T> = { [key in FooterGridId]: T };

  type TableApiSet = GridSet<GridApis | null>;
  type GridOptions = import("@ag-grid-community/core").GridOptions;
  type TableOptionsSet = GridSet<import("@ag-grid-community/core").GridOptions>;

  type GeneralClassName = string | undefined | null;
  type RowClassParams = import("@ag-grid-community/core").RowClassParams;
  type GetRowStyle = (params: RowClassParams) => import("react").CSSProperties | null | undefined;
  type GetRowClassName = (params: RowClassParams) => RowClassName;

  type CellPosition = Omit<import("@ag-grid-community/core").CellPosition, "rowPinned">;
  type CellKeyDownEvent = import("@ag-grid-community/core").CellKeyDownEvent;
  type ColDef = import("@ag-grid-community/core").ColDef;
  type AgColumn = import("@ag-grid-community/core").Column;
  type RowNode = import("@ag-grid-community/core").RowNode;
  type MenuItemDef = import("@ag-grid-community/core").MenuItemDef | string;
  type GridReadyEvent = import("@ag-grid-community/core").GridReadyEvent;
  type FirstDataRenderedEvent = import("@ag-grid-community/core").FirstDataRenderedEvent;

  type FrameworkGroup = { [key: string]: React.ComponentType<any> };
  type GridFramework = {
    readonly editors?: FrameworkGroup;
    readonly cells?: FrameworkGroup;
  };
  type Framework = {
    readonly editors?: FrameworkGroup;
    readonly cells?: Partial<GridSet<FrameworkGroup>>;
  };

  interface ITableApis {
    readonly store: Partial<TableApiSet>;
    readonly get: (id: GridId) => GridApis | null;
    readonly set: (id: GridId, apis: GridApis) => void;
    readonly clone: () => ITableApis;
    readonly gridApis: GridApi[];
  }

  interface RowColorDef {
    readonly backgroundColor?: string;
    readonly color?: string;
  }

  type DataRowType = "placeholder" | "model";
  type BodyRowType = DataRowType | "group" | "markup";
  type RowType = BodyRowType | "footer";

  type ModelRowId = number;
  type FooterRowId = `footer-${FooterGridId}`;
  type PlaceholderRowId = `placeholder-${number}`;
  type GroupRowId = `group-${number}`;
  type MarkupRowId = `markup-${number}`;
  type DataRowId = ModelRowId | PlaceholderRowId;
  type EditableRowId = ModelRowId | MarkupRowId;
  type BodyRowId = ModelRowId | PlaceholderRowId | GroupRowId | MarkupRowId;

  type RowId = BodyRowId | FooterRowId;

  type RowNameLabelType = number | string | null;
  type RowStringGetter<R extends Row> = RowNameLabelType | FnWithTypedArgs<RowNameLabelType, [R]>;

  type RowData = object;

  type IRow<RId extends RowId, TP extends RowType, Grid extends GridId = GridId> = {
    readonly id: RId;
    readonly rowType: TP;
    readonly gridId: Grid;
  };

  type IBodyRow<RId extends RowId, TP extends BodyRowType, D extends RowData> = IRow<RId, TP, "data"> & {
    readonly data: D;
  };

  type FooterRow<Grid extends FooterGridId = FooterGridId> = IRow<FooterRowId, "footer", Grid>;
  type ModelRow<R extends RowData> = IBodyRow<ModelRowId, "model", R> & {
    readonly children: number[];
  };
  type PlaceholderRow<R extends RowData> = IBodyRow<PlaceholderRowId, "placeholder", R>;
  type GroupRow<R extends RowData> = IBodyRow<GroupRowId, "group", R> & {
    readonly children: number[];
    readonly groupData: Pick<Model.Group, "name" | "color">;
  };
  type MarkupRow<R extends RowData> = IBodyRow<MarkupRowId, "markup", R> & {
    readonly children: number[];
    readonly markupData: Pick<Model.Markup, "unit" | "rate">;
  };
  type DataRow<D extends RowData> = ModelRow<D> | PlaceholderRow<D>;
  type EditableRow<D extends RowData> = ModelRow<D> | MarkupRow<D>;

  type BodyRow<D extends RowData = RowData> = ModelRow<D> | PlaceholderRow<D> | GroupRow<D> | MarkupRow<D>;
  type Row<D extends RowData = RowData> = BodyRow<D> | FooterRow;

  type RowWithColor<D extends RowData = RowData> = BodyRow<D & { color: Style.HexColor | null }>;
  type RowWithName<D extends RowData = RowData> = BodyRow<D & { name: string | null }>;
  type RowWithDescription<D extends RowData = RowData> = BodyRow<D & { description: string | null }>;
  type RowWithIdentifier<D extends RowData = RowData> = BodyRow<D & { identifier: string | null }>;

  type CreateTableDataConfig<
    R extends RowData,
    M extends Model.TypedHttpModel = Model.TypedHttpModel,
    C extends AnyColumn<R, M> = AnyColumn<R, M>
  > = {
    readonly response: Http.TableResponse<M>;
    readonly columns: C[];
    readonly getModelRowChildren?: (m: M) => number[];
  };

  type ColumnTypeId =
    | "text"
    | "longText"
    | "singleSelect"
    | "phone"
    | "email"
    | "number"
    | "contact"
    | "currency"
    | "sum"
    | "percentage"
    | "date";

  type ColumnAlignment = "right" | "left" | null;
  type TableColumnTypeId = "action" | "body" | "calculated" | "fake";

  interface ColumnType {
    readonly id: ColumnTypeId;
    readonly style?: React.CSSProperties;
    readonly icon?: IconOrElement;
    readonly pdfOverrides?: Omit<Partial<ColumnType>, "id" | "editorIsPopup">;
    readonly headerOverrides?: Omit<Partial<ColumnType>, "id" | "editorIsPopup" | "icon" | "pdfOverrides">;
  }

  type CellCallbackParams<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = {
    readonly column: Column<R, M>;
    readonly row: BodyRow<R>;
  };

  type RawClassName = string | string[] | undefined | { [key: string]: boolean };
  type ClassNameParamCallback<T> = (params: T) => RawClassName;
  interface _CellClassNameArray<P> {
    [n: number]: RawClassName | ClassNameParamCallback<P>;
  }
  type ClassName<P> = RawClassName | ClassNameParamCallback<P> | _CellClassNameArray<P>;

  type CellClassName = ClassName<import("@ag-grid-community/core").CellClassParams>;
  type RowClassName = ClassName<import("@ag-grid-community/core").RowClassParams>;

  type ColSpanParams<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel
  > = import("@ag-grid-community/core").ColSpanParams & {
    readonly columns: Column<R, M>[];
  };

  interface BaseColumn<R extends RowData, M extends Model.HttpModel = Model.HttpModel, D extends Domain = Domain> {
    readonly field?: keyof R;
    readonly colId?: string;
    readonly domain: D;
    readonly headerName?: string;
    readonly columnType?: ColumnTypeId;
    readonly tableColumnType: TableColumnTypeId;
    readonly index?: number;
    readonly getRowValue?: (m: M) => R[keyof R];
  }

  type PdfCellCallbackParams<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any> = {
    readonly colIndex: number;
    readonly column: PdfColumn<R, M, V>;
    readonly isHeader: boolean;
    readonly rawValue: V | null;
    readonly value: string;
    readonly indented: boolean;
  };

  type PdfCellCallback<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any, RV = any> = (
    params: PdfCellCallbackParams<R, M, V>
  ) => RV;

  type PdfOptionalCellCallback<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any, RV = any> =
    | RV
    | PdfCellCallback<R, M, V>
    | undefined;

  interface _PdfCellClassName<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any> {
    [n: number]: PdfOptionalCellCallback<R, M, V, string> | _PdfCellClassName<R, M, V>;
  }
  type PdfCellClassName<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any> =
    | PdfOptionalCellCallback<R, M, V, string>
    | _PdfCellClassName<R, M, V>;

  interface _PdfCellStyle<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any> {
    [n: number]: PdfOptionalCellCallback<R, M, V, import("@react-pdf/types").Style> | _PdfCellStyle<R, M, V>;
  }
  type PdfCellStyle<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any> =
    | PdfOptionalCellCallback<R, M, V, import("@react-pdf/types").Style>
    | _PdfCellStyle<R, M, V>;

  type PdfCellStandardProps<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any> = {
    readonly style?: PdfCellStyle<R, M, V>;
    readonly className?: PdfCellClassName<R, M, V>;
    readonly textStyle?: PdfCellStyle<R, M, V>;
    readonly textClassName?: PdfCellClassName<R, M, V>;
  };

  interface PdfFooterColumn<V = any> {
    readonly value?: V | null;
    readonly textStyle?: import("@react-pdf/types").Style;
  }

  type PdfValueGetter<R extends RowData, V = any> = (r: BodyRow<R>, rows: BodyRow<R>[]) => V | null;
  type PdfFooterValueGetter<R extends RowData, V = any> = (rows: BodyRow<R>[]) => V | null;

  interface PdfColumn<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any>
    extends BaseColumn<R, M, "pdf"> {
    // In the PDF case, since we cannot dynamically resize columns, the width refers to a ratio
    // of the column width to the overall table width assuming that all columns are present.  When
    // columns are hidden/shown, this ratio is adjusted.
    readonly width?: number;
    readonly cellProps?: PdfCellStandardProps<R, M, V>;
    readonly headerCellProps?: PdfCellStandardProps<R, M, V>;
    readonly footer?: PdfFooterColumn<V>;
    readonly cellContentsVisible?: PdfOptionalCellCallback<R, M, V, boolean>;
    readonly formatter?: (value: string | number) => string;
    readonly valueGetter?: PdfValueGetter<R, V>;
    readonly footerValueGetter?: V | null | PdfFooterValueGetter<R, V>;
    readonly cellRenderer?: (params: PdfCellCallbackParams<R, M, V>) => JSX.Element;
    // NOTE: This only applies for the individual Account tables, not the the overall
    // Accounts table.
    readonly childFooter?: (s: M) => PdfFooterColumn<V>;
  }

  type OmitColDefParams =
    | "field"
    | "colId"
    | "headerName"
    | "cellRenderer"
    | "cellClass"
    | "getCellClass"
    | "colSpan"
    | "cellStyle"
    | "editable"
    | "onCellDoubleClicked";

  interface Column<R extends RowData, M extends Model.HttpModel = Model.HttpModel, V = any>
    extends Omit<ColDef, OmitColDefParams>,
      BaseColumn<R, M, "aggrid"> {
    readonly nullValue?: NullValue<R>;
    readonly selectable?: boolean | ((params: CellCallbackParams<R, M>) => boolean) | undefined;
    readonly editable?: boolean | ((params: CellCallbackParams<R, M>) => boolean);
    readonly footer?: FooterColumn<R, M>;
    readonly page?: FooterColumn<R, M>;
    readonly isRead?: boolean;
    readonly isWrite?: boolean;
    readonly cellRenderer?: string | Partial<GridSet<string>>;
    readonly cellClass?: CellClassName;
    readonly cellStyle?: React.CSSProperties;
    readonly defaultHidden?: boolean;
    readonly canBeHidden?: boolean;
    readonly canBeExported?: boolean;
    readonly requiresAuthentication?: boolean;
    readonly editorIsPopup?: boolean;
    readonly onDataChange?: (id: Table.ModelRowId, event: CellChange<R>) => void;
    readonly getCSVValue?: (row: BodyRow<R>) => string;
    readonly colSpan?: (params: ColSpanParams<R, M>) => number;
    readonly onCellFocus?: (params: CellFocusedParams<R, M>) => void;
    readonly onCellUnfocus?: (params: CellFocusedParams<R, M>) => void;
    readonly refreshColumns?: (change: CellChange<R, V>) => keyof R | (keyof R)[] | null;
    readonly getHttpValue?: (value: any) => any;
    readonly getCellChanges?: (id: EditableRowId, oldValue: any, newValue: any) => SoloCellChange<R>[];
    readonly processCellForClipboard?: (row: R) => string | number;
    readonly processCellFromClipboard?: (value: string) => V | null;
    readonly onCellDoubleClicked?: (row: ModelRow<R>) => void;
  }

  type AnyColumn<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = Column<R, M> | PdfColumn<R, M, any>;

  interface FooterColumn<R extends RowData, M extends Model.HttpModel = Model.HttpModel>
    extends Pick<Column<R, M>, "colSpan"> {
    readonly cellStyle?: React.CSSProperties;
  }

  interface CookieNames {
    readonly hiddenColumns?: string;
  }

  type ExpandActionBehavior = "expand" | "edit";

  type DataGridInstance<R extends RowData = RowData> = {
    readonly getCSVData: (fields?: string[]) => CSVData;
  };

  type TableInstance<R extends RowData = RowData> = DataGridInstance<R> & {
    readonly getFocusedRow: () => BodyRow<R> | null;
    readonly getRow: (id: BodyRowId) => BodyRow<R> | null;
    readonly getRowsAboveAndIncludingFocusedRow: () => BodyRow<R>[];
    readonly applyTableChange: (event: SingleOrArray<ChangeEvent<R>>) => void;
    readonly applyGroupColorChange: (group: Model.Group) => void;
    readonly changeColumnVisibility: (changes: SingleOrArray<ColumnVisibilityChange<R>>, sizeToFit?: boolean) => void;
  };

  type MenuActionObj = {
    readonly index?: number;
    readonly icon: IconOrElement;
    readonly tooltip?: Tooltip;
    readonly disabled?: boolean;
    readonly label?: string;
    readonly isWriteOnly?: boolean;
    // If being wrapped in a Dropdown, the onClick prop will not be used.
    readonly onClick?: () => void;
    readonly wrapInDropdown?: (children: import("react").ReactChild | import("react").ReactChild[]) => JSX.Element;
    readonly render?: RenderFunc;
  };

  type MenuActionParams<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = {
    readonly apis: GridApis;
    readonly columns: Column<R, M>[];
    readonly hiddenColumns: (keyof R | string)[];
  };

  type UnauthenticatedMenuActionParams<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel
  > = MenuActionParams<R, M>;

  type AuthenticatedMenuActionParams<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = MenuActionParams<
    R,
    M
  > & {
    readonly selectedRows: EditableRow<R>[];
  };

  type MenuActionCallback<
    V,
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel,
    T extends MenuActionParams<R, M> = MenuActionParams<R, M>
  > = (params: T) => V;
  type MenuAction<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel,
    T extends MenuActionParams<R, M> = MenuActionParams<R, M>
  > = MenuActionObj | MenuActionCallback<MenuActionObj, R, M, T>;
  type MenuActions<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel,
    T extends MenuActionParams<R, M> = MenuActionParams<R, M>
  > = Array<MenuAction<R, M, T>> | MenuActionCallback<MenuAction<R, M, T>[], R, M, T>;

  type UnauthenticatedMenuAction<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = MenuAction<
    R,
    M,
    UnauthenticatedMenuActionParams<R, M>
  >;
  type AuthenticatedMenuAction<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = MenuAction<
    R,
    M,
    AuthenticatedMenuActionParams<R, M>
  >;
  type UnauthenticatedMenuActions<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = MenuActions<
    R,
    M,
    UnauthenticatedMenuActionParams<R, M>
  >;
  type AuthenticatedMenuActions<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = MenuActions<
    R,
    M,
    AuthenticatedMenuActionParams<R, M>
  >;

  interface ColumnVisibilityChange<R extends RowData> {
    readonly field: keyof R | string;
    readonly visible: boolean;
  }

  type Cell<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = {
    readonly row: BodyRow<R>;
    readonly column: Column<R, M>;
    readonly rowNode: import("@ag-grid-community/core").RowNode;
  };

  type CellFocusedParams<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = {
    readonly cell: Cell<R, M>;
    readonly apis: GridApis;
  };

  type CellFocusChangedParams<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = {
    readonly cell: Cell<R, M>;
    readonly previousCell: Cell<R, M> | null;
    readonly apis: GridApis;
  };

  type ChangeEventId =
    | "dataChange"
    | "rowAdd"
    | "rowDelete"
    | "rowRemoveFromGroup"
    | "rowAddToGroup"
    | "groupUpdated"
    | "groupAdded"
    | "rowRemoveFromMarkup"
    | "rowAddToMarkup"
    | "markupAdded"
    | "markupUpdated";

  type BaseChangeEvent = {
    readonly type: ChangeEventId;
  };

  type CellChange<R extends RowData, V = any> = {
    readonly oldValue: V | null;
    readonly newValue: V | null;
  };

  type SoloCellChange<R extends RowData, I extends EditableRowId = EditableRowId, V = any> = CellChange<R, V> & {
    readonly field: keyof R;
    readonly id: I;
  };

  type RowChangeData<R extends RowData> = { [Property in keyof R]?: CellChange<R> };

  type RowChange<R extends RowData, I extends EditableRowId = EditableRowId> = {
    readonly id: I;
    readonly data: RowChangeData<R>;
  };

  type RowAdd<R extends RowData> = {
    readonly id: PlaceholderRowId;
    readonly data?: Partial<R>;
  };

  type DataChangePayload<R extends RowData, I extends EditableRowId = EditableRowId> = SingleOrArray<RowChange<R, I>>;

  type ConsolidatedChange<R extends RowData, I extends EditableRowId = EditableRowId> = RowChange<R, I>[];

  type DataChangeEvent<R extends RowData, I extends EditableRowId = EditableRowId> = {
    readonly type: "dataChange";
    readonly payload: DataChangePayload<R, I>;
  };

  type RowAddPayload<R extends RowData> = RowAdd<R> | RowAdd<R>[];
  type RowAddEvent<R extends RowData> = {
    readonly type: "rowAdd";
    readonly payload: RowAddPayload<R>;
  };

  type RowDeletePayload = {
    readonly rows: SingleOrArray<ModelRowId | MarkupRowId | GroupRowId | PlaceholderRowId>;
  };
  type RowDeleteEvent = {
    readonly type: "rowDelete";
    readonly payload: RowDeletePayload;
  };

  type RowRemoveFromGroupPayload = {
    readonly rows: SingleOrArray<ModelRowId>;
    readonly group: GroupRowId;
  };
  type RowRemoveFromGroupEvent = {
    readonly type: "rowRemoveFromGroup";
    readonly payload: RowRemoveFromGroupPayload;
  };

  type RowRemoveFromMarkupPayload = {
    readonly rows: SingleOrArray<ModelRowId>;
    readonly markup: MarkupRowId;
  };
  type RowRemoveFromMarkupEvent = {
    readonly type: "rowRemoveFromMarkup";
    readonly payload: RowRemoveFromMarkupPayload;
  };

  type RowAddToGroupPayload = {
    readonly group: GroupRowId;
    readonly rows: SingleOrArray<ModelRowId>;
  };
  type RowAddToGroupEvent = {
    readonly type: "rowAddToGroup";
    readonly payload: RowAddToGroupPayload;
  };

  type RowAddToMarkupPayload = {
    readonly markup: MarkupRowId;
    readonly rows: SingleOrArray<ModelRowId>;
  };
  type RowAddToMarkupEvent = {
    readonly type: "rowAddToMarkup";
    readonly payload: RowAddToMarkupPayload;
  };

  type GroupAddedPayload = Model.Group;
  type GroupAddedEvent = {
    readonly type: "groupAdded";
    readonly payload: GroupAddedPayload;
  };

  type MarkupAddedPayload = Model.Markup;
  type MarkupAddedEvent = {
    readonly type: "markupAdded";
    readonly payload: MarkupAddedPayload;
  };

  type GroupUpdatedPayload = Redux.UpdateActionPayload<Model.Group, number>;
  type GroupUpdatedEvent = {
    readonly type: "groupUpdated";
    readonly payload: GroupUpdatedPayload;
  };

  type MarkupUpdatedPayload = Redux.UpdateActionPayload<Model.Markup, number>;
  type MarkupUpdatedEvent = {
    readonly type: "markupUpdated";
    readonly payload: MarkupUpdatedPayload;
  };

  type ChangeEventTypeMap<R extends RowData> = {
    dataChange: DataChangeEvent<R>;
    rowAdd: RowAddEvent<R>;
    rowDelete: RowDeleteEvent;
    rowRemoveFromGroup: RowRemoveFromGroupEvent;
    rowAddToGroup: RowAddToGroupEvent;
    groupAdded: GroupAddedEvent;
    groupUpdated: GroupUpdatedEvent;
    markupAdded: MarkupAddedEvent;
    markupUpdated: MarkupUpdatedEvent;
    rowAddToMarkup: RowAddToMarkupEvent;
    rowRemoveFromMarkup: RowRemoveFromMarkupEvent;
  };

  type ChangeEventTaskMap<R extends RowData> = Redux.TaskMapObject<ChangeEventTypeMap<R>>;

  type FullRowEvent = RowDeleteEvent | RowRemoveFromGroupEvent | RowAddToGroupEvent;

  type GroupEvent = RowRemoveFromGroupEvent | RowAddToGroupEvent | GroupUpdatedEvent | GroupAddedEvent;

  type ChangeEvent<R extends RowData> =
    | DataChangeEvent<R>
    | RowAddEvent<R>
    | RowDeleteEvent
    | RowRemoveFromGroupEvent
    | RowAddToGroupEvent
    | GroupAddedEvent
    | GroupUpdatedEvent
    | RowRemoveFromMarkupEvent
    | RowAddToMarkupEvent
    | MarkupAddedEvent
    | MarkupUpdatedEvent;

  type CellDoneEditingEvent = import("react").SyntheticEvent | KeyboardEvent;

  // I really don't know why, but extending import("@ag-grid-community/core").IEditorParams
  // does not work here.
  interface EditorParams<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel,
    S extends Redux.TableStore<R> = Redux.TableStore<R>,
    V = any
  > {
    readonly value: V | null;
    readonly keyPress: number | null;
    readonly charPress: string | null;
    readonly column: Column<R, M>;
    readonly columns: Column<R, M>[];
    readonly colDef: import("@ag-grid-community/core").ColDef;
    readonly node: import("@ag-grid-community/core").RowNode;
    readonly data: any;
    readonly rowIndex: number;
    readonly api: import("@ag-grid-community/core").GridApi | null | undefined;
    readonly columnApi: import("@ag-grid-community/core").ColumnApi | null | undefined;
    readonly cellStartedEdit: boolean;
    readonly context: any;
    readonly eGridCell: HTMLElement;
    readonly selector: (state: Application.Store) => S;
    readonly onKeyDown: (event: KeyboardEvent) => void;
    readonly stopEditing: (suppressNavigateAfterEdit?: boolean) => void;
    readonly parseValue: (value: any) => any;
    readonly formatValue: (value: any) => any;
    // When the cell editor finishes editing, the AG Grid callback (onCellDoneEditing)
    // does not have any context about what event triggered the completion, so we have
    // to handle that ourselves so we can trigger different behaviors depending on
    // how the selection was performed.
    readonly onDoneEditing: (e: CellDoneEditingEvent) => void;
  }

  interface CellProps<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel,
    S extends Redux.TableStore<R> = Redux.TableStore<R>,
    V = any
  > extends Omit<import("@ag-grid-community/core").ICellRendererParams, "value">,
      StandardComponentProps {
    readonly loading?: boolean;
    readonly hideClear?: boolean;
    readonly customCol: Column<R, M>;
    readonly value: V;
    readonly gridId: GridId;
    readonly icon?: IconOrElement | ((row: BodyRow<R>) => IconOrElement | undefined | null);
    readonly generateNewRowData?: (rows: BodyRow<R>[]) => Partial<R>;
    // Note: This is only applied for the data grid rows/cells - so we have to be careful.  We need
    // a better way of establishing which props are available to cells based on which grid they lie
    // in,
    readonly getRowColorDef: (row: BodyRow<R>) => RowColorDef;
    readonly selector: (state: Application.Store) => S;
    readonly onClear?: (row: BodyRow<R>, column: Column<R, M>) => void;
    readonly showClear?: (row: BodyRow<R>, column: Column<R, M>) => boolean;
    readonly onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    readonly onChangeEvent?: (event: ChangeEvent<R>) => void;
  }

  type CellWithChildrenProps<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel,
    S extends Redux.TableStore<R> = Redux.TableStore<R>
  > = Omit<CellProps<R, M, S>, "value"> & {
    readonly children: import("react").ReactNode;
  };

  type ValueCellProps<
    R extends RowData,
    M extends Model.HttpModel = Model.HttpModel,
    S extends Redux.TableStore<R> = Redux.TableStore<R>
  > = CellProps<R, M, S, string | number | null> & {
    // This is used for extending cells.  Normally, the value formatter will be included on the ColDef
    // of the associated column.  But when extending a Cell, we sometimes want to provide a formatter
    // for that specific cell.
    readonly valueFormatter?: AGFormatter;
  };

  type RowDataSelector<R extends RowData> = (state: Application.Store) => Partial<R>;

  interface DataGridConfig<R extends RowData> {
    readonly refreshRowExpandColumnOnCellHover?: (row: Row<R>) => boolean;
  }

  type AuthenticatedDataGridConfig<R extends RowData> = DataGridConfig<R> & {
    readonly rowCanDelete?: (row: EditableRow<R>) => boolean;
    readonly includeRowInNavigation?: (row: EditableRow<R>) => boolean;
  };

  type UnauthenticatedDataGridConfig<R extends RowData> = {
    readonly includeRowInNavigation?: (row: EditableRow<R>) => boolean;
  };

  type FooterGridConfig<R extends RowData, M extends Model.HttpModel = Model.HttpModel> = {
    readonly id: "page" | "footer";
    readonly rowClass: RowClassName;
    readonly className: GeneralClassName;
    readonly rowHeight?: number;
    readonly getFooterColumn: (column: Column<R, M>) => FooterColumn<R, M> | null;
  };

  type TaskConfig<
    R extends RowData,
    M extends Model.TypedHttpModel = Model.TypedHttpModel,
    A extends Redux.TableActionMap<M> = Redux.TableActionMap<M>
  > = Redux.TaskConfig<A> & {
    readonly columns: Column<R, M>[];
  };

  type ReducerConfig<
    R extends RowData,
    M extends Model.TypedHttpModel = Model.TypedHttpModel,
    S extends Redux.TableStore<R> = Redux.TableStore<R>,
    A extends Redux.TableActionMap<M> = Redux.TableActionMap<M>,
    CFG extends CreateTableDataConfig<R, M, Column<R, M>> = CreateTableDataConfig<R, M, Column<R, M>>
  > = TaskConfig<R, M, A> &
    Omit<CFG, "gridId" | "response"> & {
      readonly initialState: S;
      readonly tableId: Id;
      readonly createTableRows?: (config: CFG) => BodyRow<R>[];
    };

  type SagaConfig<
    R extends RowData,
    M extends Model.TypedHttpModel = Model.TypedHttpModel,
    A extends Redux.TableActionMap<M> = Redux.TableActionMap<M>
  > = Redux.SagaConfig<Redux.TableTaskMap<R>, A>;

  type StoreConfig<
    R extends RowData,
    M extends Model.TypedHttpModel = Model.TypedHttpModel,
    S extends Redux.TableStore<R> = Redux.TableStore<R>,
    A extends Redux.TableActionMap<M> = Redux.TableActionMap<M>
  > = {
    readonly autoRequest?: boolean;
    readonly asyncId?: AsyncId;
    readonly actions: Redux.ActionMapObject<A>;
    readonly selector?: (state: Application.Store) => S;
    readonly footerRowSelectors?: Partial<FooterGridSet<RowDataSelector<R>>>;
    readonly reducer?: Redux.Reducer<S>;
  };
}

namespace PdfBudgetTable {
  // Either the TopSheet page or an ID of the account.
  type TableOption = "topsheet" | number;

  interface Options {
    readonly header: Omit<HeaderTemplateFormData, "name">;
    readonly columns: (keyof Tables.PdfSubAccountRowData | string)[];
    readonly tables?: TableOption[] | null | undefined;
    readonly excludeZeroTotals: boolean;
    readonly notes?: RichText.Block[];
    readonly includeNotes: boolean;
  }
}
