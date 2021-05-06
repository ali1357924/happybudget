import React, { useState, useEffect, useMemo } from "react";
import classNames from "classnames";
import { map, isNil, includes, find, concat, uniq, forEach, filter, groupBy, flatten } from "lodash";
import Cookies from "universal-cookie";

import { AgGridReact } from "@ag-grid-community/react";
import { AllModules } from "@ag-grid-enterprise/all-modules";
import { ChangeDetectionStrategyType } from "@ag-grid-community/react/lib/changeDetectionService";
import {
  ColDef,
  CellEditingStoppedEvent,
  CellClassParams,
  GridApi,
  GridReadyEvent,
  RowNode,
  EditableCallbackParams,
  ColumnApi,
  Column,
  CellKeyDownEvent,
  CellPosition,
  NavigateToNextCellParams,
  ColSpanParams,
  RowClassParams,
  GridOptions,
  GetContextMenuItemsParams,
  MenuItemDef,
  CellValueChangedEvent,
  PasteEndEvent,
  PasteStartEvent,
  FirstDataRenderedEvent,
  SuppressKeyboardEventParams,
  ProcessCellForExportParams,
  CellRange
} from "@ag-grid-community/core";
import { FillOperationParams } from "@ag-grid-community/core/dist/cjs/entities/gridOptions";

import { TABLE_DEBUG, TABLE_PINNING_ENABLED } from "config";
import { RenderWithSpinner } from "components";
import { useDynamicCallback, useDeepEqualMemo } from "lib/hooks";
import { hashString, updateFieldOrdering, orderByFieldOrdering } from "lib/util";
import { downloadAsCsvFile } from "lib/util/files";
import { mergeClassNames, mergeClassNamesFn } from "lib/tabling/util";
import { currencyValueFormatter } from "lib/tabling/formatters";

import {
  ExpandCell,
  IndexCell,
  ValueCell,
  SubAccountUnitCell,
  IdentifierCell,
  CalculatedCell,
  PaymentMethodsCell,
  BudgetItemCell,
  FringeUnitCell,
  BudgetFringesCell,
  TemplateFringesCell,
  HeaderCell,
  FringeColorCell
} from "./cells";
import { IncludeErrorsInCell, HideCellForAllFooters, ShowCellOnlyForRowType } from "./cells/Util";
import { BudgetTableProps, CustomColDef } from "./model";
import BudgetTableMenu from "./Menu";
import { validateCookiesOrdering, rangeSelectionIsSingleCell, customColDefToColDef } from "./util";
import BudgetFooterGrid from "./BudgetFooterGrid";
import TableFooterGrid from "./TableFooterGrid";
import "./index.scss";

export * from "./cells";
export * from "./model";

const BudgetTable = <
  R extends Table.Row<G>,
  M extends Model.Model,
  G extends Model.Group = Model.Group,
  P extends Http.ModelPayload<M> = Http.ModelPayload<M>
>({
  /* eslint-disable indent */
  columns,
  data,
  actions,
  className,
  style = {},
  placeholders = [],
  groups = [],
  selected,
  manager,
  search,
  loading,
  loadingBudget,
  saving,
  frameworkComponents = {},
  exportFileName,
  getExportValue,
  nonEditableCells,
  groupParams,
  cookies,
  identifierField,
  identifierFieldHeader,
  identifierColumn = {},
  actionColumn = {},
  expandColumn = {},
  indexColumn = {},
  tableFooterIdentifierValue = "Grand Total",
  budgetFooterIdentifierValue = "Budget Total",
  processCellForClipboard = {},
  sizeColumnsToFit = true,
  renderFlag = true,
  canSearch = true,
  canExport = true,
  canToggleColumns = true,
  detached = false,
  cellClass,
  onSearch,
  onSelectAll,
  onRowUpdate,
  onRowBulkUpdate,
  onRowSelect,
  onRowDeselect,
  onRowAdd,
  onRowDelete,
  onRowExpand,
  onBack,
  isCellEditable,
  isCellSelectable,
  rowRefreshRequired,
  ...options
}: BudgetTableProps<R, M, G, P>) => {
  const [allSelected, setAllSelected] = useState(false);
  const [focused, setFocused] = useState(false);
  const [table, setTable] = useState<R[]>([]);
  const [ordering, setOrdering] = useState<FieldOrder<keyof R>[]>([]);
  const [cellChangeEvents, setCellChangeEvents] = useState<CellValueChangedEvent[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | undefined>(undefined);
  const [columnApi, setColumnApi] = useState<ColumnApi | undefined>(undefined);
  const [colDefs, setColDefs] = useState<CustomColDef<R, G>[]>([]);
  const [tableFooterColumnApi, setTableFooterColumnApi] = useState<ColumnApi | undefined>(undefined);
  const [budgetFooterColumnApi, setBudgetFooterColumnApi] = useState<ColumnApi | undefined>(undefined);
  const [gridOptions, setGridOptions] = useState<GridOptions>({
    alignedGrids: [],
    defaultColDef: {
      resizable: true,
      sortable: false,
      filter: false,
      suppressMovable: true,
      suppressKeyboardEvent: (params: SuppressKeyboardEventParams) => {
        // Suppress Backspace/Delete events when multiple cells are selected in a range.
        if (!params.editing && includes(["Backspace", "Delete"], params.event.code)) {
          if (!isNil(params.api)) {
            const api: GridApi = params.api;
            const ranges = params.api.getCellRanges();
            if (!isNil(ranges) && (ranges.length !== 1 || !rangeSelectionIsSingleCell(ranges[0]))) {
              clearCellsOverRange(ranges, api);
              return true;
            }
          }
        }
        return false;
      }
    },
    suppressHorizontalScroll: true,
    suppressContextMenu: process.env.NODE_ENV === "development" && TABLE_DEBUG,
    suppressCopyRowsToClipboard: isNil(onRowBulkUpdate),
    suppressClipboardPaste: isNil(onRowBulkUpdate),
    enableFillHandle: true,
    fillHandleDirection: "y",
    ...options
  });
  const [tableFooterGridOptions, setTableFooterGridOptions] = useState<GridOptions>({
    alignedGrids: [],
    defaultColDef: {
      resizable: false,
      sortable: false,
      filter: false,
      editable: false,
      cellClass: "cell--not-editable",
      suppressMovable: true
    },
    suppressContextMenu: true,
    suppressHorizontalScroll: true
  });
  const [budgetFooterGridOptions, setBudgetFooterGridOptions] = useState<GridOptions>({
    alignedGrids: [],
    defaultColDef: {
      resizable: false,
      sortable: false,
      filter: false,
      editable: false,
      cellClass: "cell--not-editable",
      suppressMovable: true
    },
    suppressContextMenu: true,
    suppressHorizontalScroll: true
  });

  const onFirstDataRendered = useDynamicCallback((event: FirstDataRenderedEvent): void => {
    const api = event.api;
    if (sizeColumnsToFit === true) {
      event.api.sizeColumnsToFit();
    }
    api.ensureIndexVisible(0);

    const cols = event.columnApi.getAllColumns();
    if (!isNil(cols)) {
      const identifierCol: Column | undefined = find(cols, obj => obj.getColId() === "identifier");
      if (!isNil(identifierCol)) {
        api.setFocusedCell(0, identifierCol);
        const selectedRow = api.getDisplayedRowAtIndex(0);
        selectedRow?.setSelected(true);
      }
    }
  });

  const onGridReady = useDynamicCallback((event: GridReadyEvent): void => {
    setGridApi(event.api);
    setColumnApi(event.columnApi);
  });

  const _isCellSelectable = useDynamicCallback<boolean>((row: R, colDef: ColDef | CustomColDef<R, G>): boolean => {
    if (includes(["delete", "index", "expand"], colDef.field)) {
      return false;
    } else if (row.meta.isTableFooter === true || row.meta.isGroupFooter === true || row.meta.isBudgetFooter) {
      return false;
    } else if (!isNil(isCellSelectable)) {
      return isCellSelectable(row, colDef);
    }
    return true;
  });

  const _isCellEditable = useDynamicCallback<boolean>((row: R, colDef: ColDef | CustomColDef<R, G>): boolean => {
    if (includes(["delete", "index", "expand"], colDef.field)) {
      return false;
    } else if (row.meta.isTableFooter === true || row.meta.isGroupFooter === true || row.meta.isBudgetFooter) {
      return false;
    } else if (!isNil(nonEditableCells) && includes(nonEditableCells, colDef.field as keyof R)) {
      return false;
    } else if (
      includes(
        map(
          filter(columns, (c: CustomColDef<R, G>) => c.isCalculated === true),
          (col: CustomColDef<R, G>) => col.field
        ),
        colDef.field
      )
    ) {
      return false;
    } else if (!isNil(isCellEditable)) {
      return isCellEditable(row, colDef);
    }
    return true;
  });

  const actionCell = useDynamicCallback<CustomColDef<R, G>>(
    (col: CustomColDef<R, G>): CustomColDef<R, G> => {
      return {
        width: 20,
        maxWidth: 25,
        ...col,
        cellClass: mergeClassNamesFn("cell--action", "cell--not-editable", "cell--not-selectable", col.cellClass),
        editable: false,
        headerName: "",
        resizable: false
      };
    }
  );

  const indexCell = useDynamicCallback<CustomColDef<R, G>>(
    (col: CustomColDef<R, G>): CustomColDef<R, G> =>
      actionCell({
        ...actionColumn,
        ...indexColumn,
        field: "index",
        cellRenderer: "IndexCell",
        pinned: TABLE_PINNING_ENABLED === true ? "left" : undefined,
        cellRendererParams: {
          onSelect: onRowSelect,
          onDeselect: onRowDeselect,
          onNew: onRowAdd,
          ...col.cellRendererParams,
          ...actionColumn.cellRendererParams,
          ...indexColumn.cellRendererParams
        },
        cellClass: classNames(indexColumn.cellClass, actionColumn.cellClass),
        colSpan: (params: ColSpanParams) => {
          const row: R = params.data;
          if (row.meta.isGroupFooter === true || row.meta.isTableFooter === true || row.meta.isBudgetFooter === true) {
            if (!isNil(onRowExpand)) {
              return 2;
            }
            return 1;
          }
          return 1;
        }
      })
  );

  const identifierCell = useDynamicCallback<CustomColDef<R, G>>(
    (col: CustomColDef<R, G>): CustomColDef<R, G> => ({
      field: identifierField,
      headerName: identifierFieldHeader,
      cellRenderer: "IdentifierCell",
      width: 100,
      ...identifierColumn,
      pinned: TABLE_PINNING_ENABLED === true ? "left" : undefined,
      colSpan: (params: ColSpanParams) => {
        const row: R = params.data;
        if (row.meta.isGroupFooter === true || row.meta.isTableFooter === true || row.meta.isBudgetFooter) {
          return filter(columns, (c: CustomColDef<R, G>) => !(c.isCalculated === true)).length + 1;
        } else if (!isNil(identifierColumn.colSpan)) {
          return identifierColumn.colSpan(params);
        }
        return 1;
      },
      cellRendererParams: {
        ...identifierColumn.cellRendererParams,
        onGroupEdit: !isNil(groupParams) ? groupParams.onEditGroup : undefined
      }
    })
  );

  const expandCell = useDynamicCallback<CustomColDef<R, G>>(
    (col: CustomColDef<R, G>): CustomColDef<R, G> =>
      actionCell({
        ...col,
        ...expandColumn,
        field: "expand",
        cellRenderer: "ExpandCell",
        pinned: TABLE_PINNING_ENABLED === true ? "left" : undefined,
        cellRendererParams: { onClick: onRowExpand },
        cellClass: mergeClassNamesFn(col.cellClass, expandColumn.cellClass, actionColumn.cellClass)
      })
  );

  const calculatedCell = useDynamicCallback<CustomColDef<R, G>>(
    (col: CustomColDef<R, G>): CustomColDef<R, G> => {
      return {
        width: 100,
        maxWidth: 100,
        ...col,
        cellRenderer: "CalculatedCell",
        cellStyle: { textAlign: "right" },
        valueFormatter: currencyValueFormatter,
        cellRendererParams: {
          ...col.cellRendererParams,
          renderRedIfNegative: true
        },
        cellClass: (params: CellClassParams) => {
          const row: R = params.node.data;
          if (
            row.meta.isBudgetFooter === false &&
            row.meta.isGroupFooter === false &&
            row.meta.isTableFooter === false
          ) {
            return mergeClassNames(params, "cell--not-editable-highlight", col.cellClass);
          }
          return mergeClassNames(params, col.cellClass);
        }
      };
    }
  );

  const onSort = useDynamicCallback<void>((order: Order, field: keyof R) => {
    const newOrdering = updateFieldOrdering(ordering, field, order);
    setOrdering(newOrdering);
    if (!isNil(cookies) && !isNil(cookies.ordering)) {
      const kookies = new Cookies();
      kookies.set(cookies.ordering, newOrdering);
    }
  });

  const bodyCell = useDynamicCallback<CustomColDef<R, G>>(
    (col: CustomColDef<R, G>): CustomColDef<R, G> => {
      return {
        cellRenderer: "ValueCell",
        headerComponentParams: {
          onSort: onSort,
          ordering
        },
        ...col
      };
    }
  );

  const universalCell = useDynamicCallback<CustomColDef<R, G>>(
    (col: CustomColDef<R, G>): CustomColDef<R, G> => {
      return {
        ...col,
        suppressMenu: true,
        editable: (params: EditableCallbackParams) => _isCellEditable(params.node.data as R, params.colDef),
        cellClass: (params: CellClassParams) => {
          const row: R = params.node.data;
          return mergeClassNames(params, cellClass, col.cellClass, {
            "cell--not-selectable": !_isCellSelectable(row, params.colDef),
            "cell--not-editable": !_isCellEditable(row, params.colDef)
          });
        }
      };
    }
  );

  const baseColumns = useMemo((): CustomColDef<R, G>[] => {
    let baseLeftColumns: CustomColDef<R, G>[] = [indexCell({})];
    if (!isNil(onRowExpand)) {
      // This cell will be hidden for the table footer since the previous index
      // cell will span over this column.
      baseLeftColumns.push(expandCell({}));
    }
    baseLeftColumns.push(identifierCell({}));
    return baseLeftColumns;
  }, [onRowExpand]);

  const createGroupFooter = (group: G): R => {
    const footerObj: { [key: string]: any } = {
      id: hashString(group.name),
      [identifierField]: group.name,
      group,
      meta: {
        isPlaceholder: true,
        isGroupFooter: true,
        selected: false,
        children: [],
        errors: []
      }
    };
    forEach(
      filter(columns, (col: CustomColDef<R, G>) => !(col.isCalculated === true)),
      (col: CustomColDef<R, G>) => {
        if (!isNil(col.field)) {
          footerObj[col.field] = null;
        }
      }
    );
    forEach(
      filter(columns, (col: CustomColDef<R, G>) => col.isCalculated === true),
      (col: CustomColDef<R, G>) => {
        if (!isNil(col.field) && !isNil(group[col.field as keyof G])) {
          footerObj[col.field] = group[col.field as keyof G];
        }
      }
    );
    return footerObj as R;
  };

  /**
   * Starting at the provided index, either traverses the table upwards or downwards
   * until a RowNode that is not used as a group footer is found.
   */
  const findFirstNonGroupFooterRow = useDynamicCallback((startingIndex: number, direction: "asc" | "desc" = "asc"): [
    RowNode | null,
    number,
    number
  ] => {
    if (!isNil(gridApi)) {
      let runningIndex = 0;
      let noMoreRows = false;
      let nextRowNode: RowNode | null = null;

      while (noMoreRows === false) {
        if (direction === "desc" && startingIndex - runningIndex < 0) {
          noMoreRows = true;
          break;
        }
        nextRowNode = gridApi.getDisplayedRowAtIndex(
          direction === "asc" ? startingIndex + runningIndex : startingIndex - runningIndex
        );
        if (isNil(nextRowNode)) {
          noMoreRows = true;
        } else {
          const row: R = nextRowNode.data;
          if (row.meta.isGroupFooter === false) {
            return [nextRowNode, startingIndex + runningIndex, runningIndex];
          }
          runningIndex = runningIndex + 1;
        }
      }
      return [nextRowNode, startingIndex + runningIndex, runningIndex];
    } else {
      return [null, startingIndex, 0];
    }
  });

  /**
   * Starting at the provided node, traverses the table upwards and collects
   * all of the RowNode(s) until a RowNode that is the footer for a group above
   * the provided node is reached.
   */
  const findRowsUpUntilFirstGroupFooterRow = useDynamicCallback((node: RowNode): RowNode[] => {
    const nodes: RowNode[] = [node];
    if (!isNil(gridApi)) {
      let currentNode: RowNode | null = node;
      while (!isNil(currentNode) && !isNil(currentNode.rowIndex) && currentNode.rowIndex >= 1) {
        currentNode = gridApi.getDisplayedRowAtIndex(currentNode.rowIndex - 1);
        if (!isNil(currentNode)) {
          const row: R = currentNode.data;
          if (row.meta.isGroupFooter === true) {
            break;
          } else {
            // NOTE: In practice, we will never reach a non-group footer node that belongs to a group
            // before we reach the group footer node, so as long as the ordering/grouping of rows
            // is consistent.  However, we will also make sure that the row does not belong to a group
            // for safety.
            if (isNil(row.group) && !(row.meta.isPlaceholder === true)) {
              nodes.push(currentNode);
            }
          }
        }
      }
    }
    return nodes;
  });

  const navigateToNextCell = useDynamicCallback(
    (params: NavigateToNextCellParams): CellPosition => {
      if (!isNil(params.nextCellPosition)) {
        const verticalAscend = params.previousCellPosition.rowIndex < params.nextCellPosition.rowIndex;
        const verticalDescend = params.previousCellPosition.rowIndex > params.nextCellPosition.rowIndex;

        if (verticalAscend === true) {
          /* eslint-disable no-unused-vars */
          /* eslint-disable @typescript-eslint/no-unused-vars */
          const [rowNode, _, additionalIndex] = findFirstNonGroupFooterRow(params.nextCellPosition.rowIndex);
          if (!isNil(rowNode)) {
            return {
              ...params.nextCellPosition,
              rowIndex: params.nextCellPosition.rowIndex + additionalIndex
            };
          }
          return params.nextCellPosition;
        } else if (verticalDescend === true) {
          const [rowNode, _, additionalIndex] = findFirstNonGroupFooterRow(params.nextCellPosition.rowIndex, "desc");
          if (!isNil(rowNode)) {
            return {
              ...params.nextCellPosition,
              rowIndex: params.nextCellPosition.rowIndex - additionalIndex
            };
          }
          return params.nextCellPosition;
        } else if (includes(["expand", "select"], params.nextCellPosition.column.getColId())) {
          return params.previousCellPosition;
        } else {
          return params.nextCellPosition;
        }
      }
      return params.previousCellPosition;
    }
  );

  const onCellKeyDown = useDynamicCallback((event: CellKeyDownEvent) => {
    if (!isNil(event.rowIndex) && !isNil(event.event)) {
      // I do not understand why AGGrid's Event has an underlying Event that is in
      // reality a KeyboardEvent but does not have any of the properties that a KeyboardEvent
      // should have - meaning we have to tell TS to ignore this line.
      /* @ts-ignore */
      if (event.event.keyCode === 13) {
        const editing = event.api.getEditingCells();
        if (editing.length === 0) {
          const firstEditCol = event.columnApi.getColumn(event.column.getColId());
          if (!isNil(firstEditCol)) {
            event.api.ensureColumnVisible(firstEditCol);

            let foundNonFooterRow = false;
            let nextRowNode: RowNode | null;
            let additionalIndex = 1;
            while (foundNonFooterRow === false) {
              nextRowNode = event.api.getDisplayedRowAtIndex(event.rowIndex + additionalIndex);
              if (isNil(nextRowNode)) {
                onRowAdd();
                event.api.setFocusedCell(event.rowIndex + additionalIndex, firstEditCol);
                event.api.clearRangeSelection();
                foundNonFooterRow = true;
              } else {
                let row: R = nextRowNode.data;
                if (row.meta.isGroupFooter === false) {
                  event.api.setFocusedCell(event.rowIndex + additionalIndex, firstEditCol);
                  event.api.clearRangeSelection();
                  foundNonFooterRow = true;
                } else {
                  additionalIndex = additionalIndex + 1;
                }
              }
            }
          }
        }
      }
    }
  });

  const getTableChangesFromRangeClear = useDynamicCallback((range: CellRange, api?: GridApi): Table.RowChange<R>[] => {
    const rowChanges: Table.RowChange<R>[] = [];
    api = isNil(api) ? gridApi : api;
    if (!isNil(api) && !isNil(range.startRow) && !isNil(range.endRow)) {
      let colIds: (keyof R)[] = map(range.columns, (col: Column) => col.getColId() as keyof R);
      let startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
      let endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);

      for (let i = startRowIndex; i <= endRowIndex; i++) {
        const node: RowNode | null = api.getDisplayedRowAtIndex(i);
        if (!isNil(node)) {
          const row: R = node.data;

          const rowChangeData: Table.RowChangeData<R> = {};
          /* eslint-disable no-loop-func */
          forEach(colIds, (colId: keyof R) => {
            const customColDef = find(colDefs, { field: colId } as any);
            // Only clear cells for which an onClear value is specified - otherwise it can cause bugs.
            if (!isNil(customColDef) && _isCellEditable(row, customColDef)) {
              const clearValue = customColDef.onClearValue !== undefined ? customColDef.onClearValue : null;
              if (row[colId] === undefined || row[colId] !== clearValue) {
                const change: Table.CellChange<any> = { oldValue: row[colId], newValue: clearValue };
                rowChangeData[colId] = change;
              }
            }
          });
          if (Object.keys(rowChangeData).length !== 0) {
            const rowChange: Table.RowChange<R> = { id: row.id, data: rowChangeData };
            rowChanges.push(rowChange);
          }
        }
      }
    }
    return rowChanges;
  });

  const getTableChangeFromEvent = (
    event: CellEditingStoppedEvent | CellValueChangedEvent
  ): Table.RowChange<R> | null => {
    const field = event.column.getColId() as keyof R;
    // NOTE: We want to allow the setting of fields to `null` - so we just have to make sure it is
    // not `undefined`.
    if (event.newValue !== undefined) {
      if (event.oldValue === undefined || event.oldValue !== event.newValue) {
        const change: Table.CellChange<R[keyof R]> = { oldValue: event.oldValue, newValue: event.newValue };
        const d: { [key in keyof R]?: Table.CellChange<R[key]> } = {};
        d[field as keyof R] = change;
        return { id: event.data.id, data: d };
      }
    }
    return null;
  };

  const clearCellsOverRange = useDynamicCallback((range: CellRange | CellRange[], api?: GridApi) => {
    if (!isNil(onRowBulkUpdate)) {
      const rowChanges: Table.RowChange<R>[] = !Array.isArray(range)
        ? getTableChangesFromRangeClear(range, api)
        : flatten(map(range, (rng: CellRange) => getTableChangesFromRangeClear(rng, api)));
      if (rowChanges.length !== 0) {
        // NOTE: If there are changes corresponding to rows that span multiple ranges, the task
        // will consolidate/merge these changes to reduce the request payload.
        onRowBulkUpdate(rowChanges);
      }
    }
  });

  const onPasteStart = useDynamicCallback((event: PasteStartEvent) => {
    setCellChangeEvents([]);
  });

  const onPasteEnd = useDynamicCallback((event: PasteEndEvent) => {
    if (!isNil(onRowBulkUpdate)) {
      if (cellChangeEvents.length === 1) {
        const tableChange = getTableChangeFromEvent(cellChangeEvents[0]);
        if (!isNil(tableChange)) {
          onRowUpdate(tableChange);
        }
      } else if (cellChangeEvents.length !== 0) {
        const changes = filter(
          map(cellChangeEvents, (e: CellValueChangedEvent) => getTableChangeFromEvent(e)),
          (change: Table.RowChange<R> | null) => change !== null
        ) as Table.RowChange<R>[];
        if (changes.length !== 0) {
          onRowBulkUpdate(changes);
        }
      }
    }
  });

  const onCellValueChanged = useDynamicCallback((event: CellValueChangedEvent) => {
    if (event.source === "paste") {
      setCellChangeEvents([...cellChangeEvents, event]);
    } else {
      const tableChange = getTableChangeFromEvent(event);
      if (!isNil(tableChange)) {
        onRowUpdate(tableChange);
      }
    }
  });

  const getRowClass = (params: RowClassParams) => {
    if (params.node.data.meta.isGroupFooter === true) {
      let colorClass = params.node.data.group.color;
      if (!isNil(colorClass)) {
        if (colorClass.startsWith("#")) {
          colorClass = params.node.data.group.color.slice(1);
        }
        return classNames("row--group-footer", `bg-${colorClass}`);
      }
    }
  };

  const getContextMenuItems = useDynamicCallback((params: GetContextMenuItemsParams): MenuItemDef[] => {
    // This can happen in rare cases where you right click outside of a cell.
    if (isNil(params.node)) {
      return [];
    }
    const row: R = params.node.data;
    if (row.meta.isTableFooter) {
      return [];
    } else if (row.meta.isGroupFooter) {
      if (!isNil(row.group) && !isNil(groupParams)) {
        const group = row.group;
        return [
          {
            name: `Delete Group ${group.name}`,
            action: () => groupParams.onDeleteGroup(group)
          }
        ];
      }
      return [];
    } else {
      const deleteRowContextMenuItem: MenuItemDef = {
        name: `Delete ${row.meta.label}`,
        action: () => onRowDelete(row)
      };
      if (isNil(groupParams) || row.meta.isPlaceholder) {
        return [deleteRowContextMenuItem];
      } else if (!isNil(row.group)) {
        return [
          deleteRowContextMenuItem,
          {
            name: `Remove ${row.meta.label} from Group ${row.group.name}`,
            action: () => groupParams.onRowRemoveFromGroup(row)
          }
        ];
      } else {
        const menuItems: MenuItemDef[] = [deleteRowContextMenuItem];

        const groupableNodesAbove = findRowsUpUntilFirstGroupFooterRow(params.node);
        if (groupableNodesAbove.length !== 0) {
          let label: string;
          if (groupableNodesAbove.length === 1) {
            label = `Group ${groupableNodesAbove[0].data.meta.typeLabel} ${groupableNodesAbove[0].data.meta.label}`;
          } else {
            label = `Group ${groupableNodesAbove[0].data.meta.typeLabel}s ${
              groupableNodesAbove[groupableNodesAbove.length - 1].data.meta.label
            } - ${groupableNodesAbove[0].data.meta.label}`;
          }
          menuItems.push({
            name: label,
            action: () => groupParams.onGroupRows(map(groupableNodesAbove, (n: RowNode) => n.data as R))
          });
        }

        if (groups.length !== 0) {
          menuItems.push({
            name: "Add to Group",
            subMenu: map(groups, (group: G) => ({
              name: group.name,
              action: () => groupParams.onRowAddToGroup(group.id, row)
            }))
          });
        }
        return menuItems;
      }
    }
  });

  useEffect(() => {
    setGridOptions({
      ...gridOptions,
      alignedGrids: [tableFooterGridOptions, budgetFooterGridOptions]
    });
    setBudgetFooterGridOptions({ ...budgetFooterGridOptions, alignedGrids: [gridOptions, tableFooterGridOptions] });
    setTableFooterGridOptions({ ...tableFooterGridOptions, alignedGrids: [gridOptions, budgetFooterGridOptions] });
  }, []);

  useEffect(() => {
    if (!isNil(cookies) && !isNil(cookies.ordering)) {
      const kookies = new Cookies();
      const cookiesOrdering = kookies.get(cookies.ordering);
      const validatedOrdering = validateCookiesOrdering(
        cookiesOrdering,
        filter(columns, (col: CustomColDef<R, G>) => !(col.isCalculated === true))
      );
      if (!isNil(validatedOrdering)) {
        setOrdering(validatedOrdering);
      }
    }
  }, [useDeepEqualMemo(cookies)]);

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      const ctrlCmdPressed = e.ctrlKey || e.metaKey;
      if (gridApi) {
        if (e.key === "ArrowDown" && ctrlCmdPressed) {
          const focusedCell = gridApi.getFocusedCell();
          if (focusedCell) {
            const row = gridApi?.getDisplayedRowAtIndex(focusedCell?.rowIndex);
            if (onRowExpand && !isNil(row?.data.identifier)) {
              onRowExpand(row?.data.id);
            }
          }
        }
        if (e.key === "ArrowUp" && ctrlCmdPressed) {
          if (onBack) {
            onBack();
          }
        }
      }
    };
    window.addEventListener("keydown", keyListener);
    return () => window.removeEventListener("keydown", keyListener);
  }, [gridApi]);

  useEffect(() => {
    if (renderFlag === true) {
      const getGroupForModel = (model: M): number | null => {
        const group: G | undefined = find(groups, (g: G) =>
          includes(
            map(g.children, (child: number) => child),
            model.id
          )
        );
        return !isNil(group) ? group.id : null;
      };

      const modelsWithGroup = filter(data, (m: M) => !isNil(getGroupForModel(m)));
      let modelsWithoutGroup = filter(data, (m: M) => isNil(getGroupForModel(m)));
      const groupedModels: { [key: number]: M[] } = groupBy(modelsWithGroup, (model: M) => getGroupForModel(model));

      const newTable: R[] = [];
      forEach(groupedModels, (models: M[], groupId: string) => {
        const group: G | undefined = find(groups, { id: parseInt(groupId) } as any);
        if (!isNil(group)) {
          const footer: R = createGroupFooter(group);
          newTable.push(
            ...orderByFieldOrdering(
              map(models, (m: M) => manager.modelToRow(m, group, { selected: includes(selected, m.id) })),
              ordering
            ),
            {
              ...footer,
              group,
              [identifierField]: group.name,
              meta: { ...footer.meta, isGroupFooter: true }
            }
          );
        } else {
          // In the case that the group no longer exists, that means the group was removed from the
          // state.  In this case, we want to disassociate the rows with the group.
          modelsWithoutGroup = [...modelsWithoutGroup, ...models];
        }
      });
      setTable([
        ...newTable,
        ...orderByFieldOrdering(
          [
            ...map(modelsWithoutGroup, (m: M) => manager.modelToRow(m, null, { selected: includes(selected, m.id) })),
            ...map(placeholders, (r: R) => ({ ...r, meta: { ...r.meta, selected: includes(selected, r.id) } }))
          ],
          ordering
        )
      ]);
    }
  }, [
    useDeepEqualMemo(data),
    useDeepEqualMemo(placeholders),
    useDeepEqualMemo(selected),
    useDeepEqualMemo(groups),
    useDeepEqualMemo(ordering),
    renderFlag
  ]);

  useEffect(() => {
    if (!isNil(columnApi) && !isNil(gridApi)) {
      const firstEditCol = columnApi.getAllDisplayedColumns()[2];
      if (!isNil(firstEditCol) && focused === false) {
        gridApi.ensureIndexVisible(0);
        gridApi.ensureColumnVisible(firstEditCol);
        setTimeout(() => gridApi.setFocusedCell(0, firstEditCol), 500);
        // TODO: Investigate if there is a better way to do this - currently,
        // this hook is getting triggered numerous times when it shouldn't be.
        // It is because the of the `columns` in the dependency array, which
        // are necessary to get a situation when `firstEditCol` is not null,
        // but also shouldn't be triggering this hook so many times.
        setFocused(true);
      }
    }
  }, [columnApi, gridApi, focused]);

  useEffect(() => {
    if (!isNil(gridApi)) {
      gridApi.setQuickFilter(search);
    }
  }, [search, gridApi]);

  useEffect(() => {
    if (!isNil(gridApi) && !isNil(rowRefreshRequired)) {
      gridApi.forEachNode((node: RowNode) => {
        const existing: R | undefined = find(table, { id: node.data.id });
        if (!isNil(existing)) {
          // TODO: We should figure out how to configure the API to just refresh the row at the
          // relevant column.
          if (rowRefreshRequired(existing, node.data)) {
            gridApi.refreshCells({ force: true, rowNodes: [node] });
          }
        }
      });
    }
  }, [useDeepEqualMemo(table), gridApi, rowRefreshRequired]);

  useEffect(() => {
    // Changes to the state of the selected rows does not trigger a refresh of those cells via AG
    // Grid because AG Grid cannot detect changes to the values of cells when the cell is HTML based.
    if (!isNil(gridApi) && !isNil(columnApi)) {
      gridApi.forEachNode((node: RowNode) => {
        const existing: R | undefined = find(table, { id: node.data.id });
        if (!isNil(existing)) {
          if (existing.meta.selected !== node.data.meta.selected) {
            const cols = columnApi.getAllColumns();
            const selectCol = find(cols, (col: Column) => {
              const def = col.getColDef();
              if (def.field === "index") {
                return true;
              }
              return false;
            });
            if (!isNil(selectCol)) {
              gridApi.refreshCells({ force: true, rowNodes: [node], columns: [selectCol] });
            }
          }
        }
      });
    }
  }, [useDeepEqualMemo(table), gridApi, columnApi]);

  useEffect(() => {
    // Changes to the errors in the rows does not trigger a refresh of those cells via AG Grid
    // because AG Grid cannot detect changes in that type of data structure for the row.
    if (!isNil(gridApi) && !isNil(columnApi)) {
      gridApi.forEachNode((node: RowNode) => {
        const existing: R | undefined = find(table, { id: node.data.id });
        if (!isNil(existing)) {
          // TODO: We might want to do a deeper comparison in the future here.
          if (existing.meta.errors.length !== node.data.meta.errors.length) {
            const cols = columnApi.getAllColumns();
            forEach(cols, (col: Column) => {
              const colDef = col.getColDef();
              if (!isNil(colDef.field)) {
                const cellErrors = filter(existing.meta.errors, { id: node.data.id, field: colDef.field });
                if (cellErrors.length !== 0) {
                  col.setColDef({ ...colDef, cellClass: "cell--error" }, null);
                  gridApi.refreshCells({ force: true, rowNodes: [node], columns: [col] });
                }
              }
            });
          }
        }
      });
    }
  }, [useDeepEqualMemo(table), gridApi, columnApi]);

  useEffect(() => {
    const mapped = map(table, (row: R) => row.meta.selected);
    const uniques = uniq(mapped);
    if (uniques.length === 1 && uniques[0] === true) {
      setAllSelected(true);
    } else {
      setAllSelected(false);
    }
  }, [useDeepEqualMemo(table)]);

  useEffect(() => {
    const cols = concat(
      baseColumns,
      map(
        filter(columns, (col: CustomColDef<R, G>) => !(col.isCalculated === true)),
        (def: CustomColDef<R, G>) => bodyCell(def)
      ),
      map(
        filter(columns, (col: CustomColDef<R, G>) => col.isCalculated === true),
        (def: CustomColDef<R, G>) => calculatedCell(def)
      )
    );
    setColDefs(
      map(cols, (col: CustomColDef<R, G>, index: number) => {
        if (index === cols.length - 1) {
          return universalCell({ ...col, resizable: false });
        }
        return universalCell(col);
      })
    );
  }, [useDeepEqualMemo(columns), baseColumns]);

  return (
    <React.Fragment>
      <BudgetTableMenu<R, G>
        actions={actions}
        search={search}
        onSearch={onSearch}
        canSearch={canSearch}
        canExport={canExport}
        canToggleColumns={canToggleColumns}
        columns={columns}
        onDelete={() => {
          forEach(table, (row: R) => {
            if (row.meta.selected === true) {
              onRowDelete(row);
            }
          });
        }}
        detached={detached}
        saving={saving}
        selected={allSelected}
        onSelectAll={onSelectAll}
        selectedRows={filter(table, (row: R) => row.meta.selected === true)}
        onExport={(fields: Field[]) => {
          if (!isNil(gridApi) && !isNil(columnApi)) {
            const includeColumn = (col: Column): boolean => {
              const colDef = col.getColDef();
              return (
                !isNil(colDef.field) &&
                includes(
                  map(fields, (field: Field) => field.id),
                  colDef.field
                ) &&
                includes(
                  map(columns, (c: CustomColDef<R, G>) => c.field),
                  colDef.field
                )
              );
            };

            const cols = filter(columnApi.getAllColumns(), (col: Column) => includeColumn(col));
            const headerRow: CSVRow = [];
            forEach(cols, (col: Column) => {
              const colDef = col.getColDef();
              if (!isNil(colDef.field)) {
                headerRow.push(colDef.headerName);
              }
            });

            const csvData: CSVData = [headerRow];

            gridApi.forEachNode((node: RowNode, index: number) => {
              const row: CSVRow = [];
              forEach(cols, (col: Column) => {
                const colDef = col.getColDef();
                if (!isNil(colDef.field)) {
                  if (isNil(node.data[colDef.field])) {
                    row.push("");
                  } else {
                    let value = node.data[colDef.field];
                    if (!isNil(getExportValue) && !isNil(getExportValue[colDef.field])) {
                      value = getExportValue[colDef.field]({
                        node,
                        colDef,
                        value
                      });
                    }
                    // TODO: Use a valueSetter instead of a formatter on the cell renderer.
                    if (!isNil(colDef.cellRendererParams) && !isNil(colDef.cellRendererParams.formatter)) {
                      value = colDef.cellRendererParams.formatter(value);
                    }
                    row.push(value);
                  }
                }
              });
              csvData.push(row);
            });
            let fileName = "make-me-current-date";
            if (!isNil(exportFileName)) {
              fileName = exportFileName;
            }
            downloadAsCsvFile(fileName, csvData);
          }
        }}
        onColumnsChange={(fields: Field[]) => {
          if (!isNil(columnApi) && !isNil(tableFooterColumnApi) && !isNil(budgetFooterColumnApi)) {
            forEach(columns, (col: CustomColDef<R, G>) => {
              if (!isNil(col.field)) {
                const associatedField = find(fields, { id: col.field });
                if (!isNil(associatedField)) {
                  columnApi.setColumnVisible(col.field, true);
                  tableFooterColumnApi.setColumnVisible(col.field, true);
                  budgetFooterColumnApi.setColumnVisible(col.field, true);
                } else {
                  columnApi.setColumnVisible(col.field, false);
                  tableFooterColumnApi.setColumnVisible(col.field, false);
                  budgetFooterColumnApi.setColumnVisible(col.field, false);
                }
              }
            });
          }
        }}
      />
      <RenderWithSpinner loading={loading}>
        <div className={classNames("budget-table ag-theme-alpine", className)} style={style}>
          <div className={"table-grid"}>
            <AgGridReact
              {...gridOptions}
              columnDefs={map(colDefs, (def: CustomColDef<R, G>) => customColDefToColDef(def))}
              getContextMenuItems={getContextMenuItems}
              allowContextMenuWithControlKey={true}
              rowData={table}
              debug={process.env.NODE_ENV === "development" && TABLE_DEBUG}
              getRowNodeId={(r: any) => r.id}
              getRowClass={getRowClass}
              immutableData={true}
              suppressRowClickSelection={true}
              onGridReady={onGridReady}
              /* @ts-ignore */
              modules={AllModules}
              processCellForClipboard={(params: ProcessCellForExportParams) => {
                if (!isNil(params.node)) {
                  const row: R = params.node.data;
                  const colDef = params.column.getColDef();
                  if (!isNil(colDef.field)) {
                    const processor = processCellForClipboard[colDef.field as keyof R];
                    if (!isNil(processor)) {
                      return processor(row);
                    } else {
                      const field = manager.getField(colDef.field as keyof R);
                      if (field !== null) {
                        return field.getClipboardValue(row);
                      }
                    }
                  }
                }
                return "";
              }}
              rowHeight={36}
              headerHeight={38}
              enableRangeSelection={true}
              animateRows={true}
              overlayNoRowsTemplate={"<span></span>"}
              overlayLoadingTemplate={"<span></span>"}
              navigateToNextCell={navigateToNextCell}
              onCellKeyDown={onCellKeyDown}
              onFirstDataRendered={onFirstDataRendered}
              suppressKeyboardEvent={(params: SuppressKeyboardEventParams) => {
                const e = params.event;
                const ctrlCmdPressed = e.ctrlKey || e.metaKey;
                if (params.api) {
                  if ((e.key === "ArrowDown" || e.key === "ArrowUp") && ctrlCmdPressed) {
                    return true;
                  }
                }
                return false;
              }}
              // NOTE: This might not be 100% necessary, because of how efficiently
              // we are managing the state updates to the data that flows into the table.
              // However, for now we will leave.  It is important to note that this will
              // cause the table renders to be slower for large datasets.
              rowDataChangeDetectionStrategy={ChangeDetectionStrategyType.DeepValueCheck}
              enterMovesDown={false}
              frameworkComponents={{
                ExpandCell: ExpandCell,
                IndexCell: IndexCell,
                ValueCell: IncludeErrorsInCell<R>(ValueCell),
                SubAccountUnitCell: IncludeErrorsInCell<R>(SubAccountUnitCell),
                FringeUnitCell: IncludeErrorsInCell<R>(FringeUnitCell),
                IdentifierCell: IncludeErrorsInCell<R>(IdentifierCell),
                CalculatedCell: CalculatedCell,
                PaymentMethodsCell: HideCellForAllFooters<R>(PaymentMethodsCell),
                BudgetItemCell: HideCellForAllFooters<R>(BudgetItemCell),
                BudgetFringesCell: ShowCellOnlyForRowType<R>("subaccount")(IncludeErrorsInCell<R>(BudgetFringesCell)),
                TemplateFringesCell: ShowCellOnlyForRowType<R>("subaccount")(
                  IncludeErrorsInCell<R>(TemplateFringesCell)
                ),
                FringeColorCell,
                agColumnHeader: HeaderCell,
                ...frameworkComponents
              }}
              onPasteStart={onPasteStart}
              onPasteEnd={onPasteEnd}
              onCellValueChanged={onCellValueChanged}
              fillOperation={(params: FillOperationParams) => {
                if (params.initialValues.length === 1) {
                  return false;
                }
                return params.initialValues[
                  (params.values.length - params.initialValues.length) % params.initialValues.length
                ];
              }}
            />
          </div>
          <TableFooterGrid<R, G>
            options={tableFooterGridOptions}
            colDefs={colDefs}
            columns={columns}
            sizeColumnsToFit={sizeColumnsToFit}
            frameworkComponents={frameworkComponents}
            identifierField={identifierField}
            identifierValue={tableFooterIdentifierValue}
            setColumnApi={setTableFooterColumnApi}
          />
          {filter(columns, (col: CustomColDef<R, G>) => col.isCalculated === true && !isNil(col.budgetTotal)).length !==
            0 && (
            <BudgetFooterGrid<R, G>
              options={budgetFooterGridOptions}
              colDefs={colDefs}
              columns={columns}
              sizeColumnsToFit={sizeColumnsToFit}
              frameworkComponents={frameworkComponents}
              identifierField={identifierField}
              identifierValue={budgetFooterIdentifierValue}
              loadingBudget={loadingBudget}
              setColumnApi={setBudgetFooterColumnApi}
            />
          )}
        </div>
      </RenderWithSpinner>
    </React.Fragment>
  );
};

export default BudgetTable;
