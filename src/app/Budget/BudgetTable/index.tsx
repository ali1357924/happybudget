import React, { useState, useEffect, useMemo } from "react";
import classNames from "classnames";
import { map, isNil, includes, find, concat, uniq, forEach, filter, groupBy } from "lodash";

import { AgGridReact } from "ag-grid-react";
import { ChangeDetectionStrategyType } from "ag-grid-react/lib/changeDetectionService";
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
  MenuItemDef
} from "ag-grid-community";
import { FirstDataRenderedEvent } from "@ag-grid-community/core";

import { RenderWithSpinner, ShowHide } from "components/display";
import { useDynamicCallback, useDeepEqualMemo } from "hooks";
import { downloadAsCsvFile } from "util/files";
import { formatCurrencyWithoutDollarSign, hashString } from "util/string";

import {
  ExpandCell,
  IndexCell,
  ValueCell,
  UnitCell,
  IdentifierCell,
  CalculatedCell,
  PaymentMethodsCell,
  BudgetItemCell
} from "./cells";
import { BudgetTableProps } from "./model";
import TableHeader from "./TableHeader";
import { IncludeErrorsInCell, HideCellForAllFooters } from "./Util";
import "./index.scss";

export * from "./model";

const actionCell = (col: ColDef): ColDef => {
  return {
    editable: false,
    headerName: "",
    width: 25,
    maxWidth: 30,
    resizable: false,
    cellClass: classNames("cell--action", "cell--not-editable"),
    ...col
  };
};

const BudgetTable = <
  R extends Table.Row<G, C>,
  M extends Model,
  G extends IGroup<any>,
  P extends Http.IPayload = Http.IPayload,
  C extends Model = UnknownModel
>({
  /* eslint-disable indent */
  bodyColumns,
  calculatedColumns = [],
  data,
  placeholders = [],
  groups = [],
  selected,
  mapping,
  search,
  loading,
  saving,
  frameworkComponents = {},
  exportFileName,
  getExportValue,
  nonEditableCells,
  highlightedNonEditableCells,
  nonHighlightedNonEditableCells,
  groupParams,
  identifierField,
  identifierFieldHeader,
  identifierFieldParams = {},
  tableFooterIdentifierValue = "Grand Total",
  budgetFooterIdentifierValue = "Budget Total",
  tableTotals,
  budgetTotals,
  cellClass,
  onSearch,
  onSelectAll,
  onRowUpdate,
  onRowSelect,
  onRowDeselect,
  onRowAdd,
  onRowDelete,
  onRowExpand,
  isCellEditable,
  highlightNonEditableCell,
  rowRefreshRequired
}: BudgetTableProps<R, M, G, P, C>) => {
  const [allSelected, setAllSelected] = useState(false);
  const [focused, setFocused] = useState(false);
  const [table, setTable] = useState<R[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | undefined>(undefined);
  const [columnApi, setColumnApi] = useState<ColumnApi | undefined>(undefined);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [tableFooterColumnApi, setTableFooterColumnApi] = useState<ColumnApi | undefined>(undefined);
  const [budgetFooterColumnApi, setBudgetFooterColumnApi] = useState<ColumnApi | undefined>(undefined);
  const [gridOptions, setGridOptions] = useState<GridOptions>({
    alignedGrids: [],
    defaultColDef: {
      resizable: true,
      sortable: false,
      filter: false
    },
    suppressHorizontalScroll: true
  });
  const [tableFooterGridOptions, setTableFooterGridOptions] = useState<GridOptions>({
    alignedGrids: [],
    defaultColDef: {
      resizable: false,
      sortable: false,
      filter: false,
      editable: false,
      cellClass: "cell--not-editable"
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
      cellClass: "cell--not-editable"
    },
    suppressContextMenu: true,
    suppressHorizontalScroll: true
  });

  const onFirstDataRendered = useDynamicCallback((event: FirstDataRenderedEvent): void => {
    event.api.sizeColumnsToFit();
  });

  const onGridReady = useDynamicCallback((event: GridReadyEvent): void => {
    setGridApi(event.api);
    setColumnApi(event.columnApi);
  });

  const onTableFooterFirstDataRendered = useDynamicCallback((event: FirstDataRenderedEvent): void => {
    event.api.sizeColumnsToFit();
  });

  const onTableFooterGridReady = useDynamicCallback((event: GridReadyEvent): void => {
    setTableFooterColumnApi(event.columnApi);
  });

  const onBudgetFooterFirstDataRendered = useDynamicCallback((event: FirstDataRenderedEvent): void => {
    event.api.sizeColumnsToFit();
  });

  const onBudgetFooterGridReady = useDynamicCallback((event: GridReadyEvent): void => {
    setBudgetFooterColumnApi(event.columnApi);
  });

  useEffect(() => {
    setGridOptions({ ...gridOptions, alignedGrids: [tableFooterGridOptions, budgetFooterGridOptions] });
    setBudgetFooterGridOptions({ ...budgetFooterGridOptions, alignedGrids: [gridOptions, tableFooterGridOptions] });
    setTableFooterGridOptions({ ...tableFooterGridOptions, alignedGrids: [gridOptions, budgetFooterGridOptions] });
  }, []);

  const baseColumns = useMemo((): ColDef[] => {
    let baseLeftColumns: ColDef[] = [
      actionCell({
        field: "index",
        cellRenderer: "IndexCell",
        cellRendererParams: { onSelect: onRowSelect, onDeselect: onRowDeselect, onNew: onRowAdd },
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
    ];
    if (!isNil(onRowExpand)) {
      // This cell will be hidden for the table footer since the previous index
      // cell will span over this column.
      baseLeftColumns.push(
        actionCell({
          field: "expand",
          cellRenderer: "ExpandCell",
          cellRendererParams: { onClick: onRowExpand }
        })
      );
    }
    baseLeftColumns.push({
      field: identifierField,
      headerName: identifierFieldHeader,
      cellRenderer: "IdentifierCell",
      minWidth: 100,
      maxWidth: 125,
      ...identifierFieldParams,
      colSpan: (params: ColSpanParams) => {
        const row: R = params.data;
        if (row.meta.isGroupFooter === true || row.meta.isTableFooter === true || row.meta.isBudgetFooter) {
          return bodyColumns.length + 1;
        } else if (!isNil(identifierFieldParams.colSpan)) {
          return identifierFieldParams.colSpan(params);
        }
        return 1;
      }
    });
    return baseLeftColumns;
  }, [
    groupParams,
    onRowSelect,
    onRowDeselect,
    onRowExpand,
    onRowDelete,
    identifierField,
    identifierFieldHeader,
    identifierFieldParams
  ]);

  // TODO: It might make more sense to just treat all of the cells corresponding
  // to the calculatedColumns as non-editable.
  const _isCellEditable = useDynamicCallback((row: R, colDef: ColDef): boolean => {
    if (includes(["delete", "select", "expand"], colDef.field)) {
      return false;
    } else if (row.meta.isTableFooter === true || row.meta.isGroupFooter === true || row.meta.isBudgetFooter) {
      return false;
    } else if (!isNil(nonEditableCells) && includes(nonEditableCells, colDef.field as keyof R)) {
      return false;
    } else if (
      includes(
        map(calculatedColumns, (col: ColDef) => col.field),
        colDef.field
      )
    ) {
      return false;
    } else if (!isNil(isCellEditable)) {
      return isCellEditable(row, colDef);
    }
    return true;
  });

  const _isCellNonEditableHighlight = useDynamicCallback((row: R, colDef: ColDef): boolean => {
    if (includes(["delete", "select", "expand"], colDef.field)) {
      return false;
    } else if (row.meta.isTableFooter === true || row.meta.isGroupFooter === true || row.meta.isBudgetFooter === true) {
      return false;
    } else if (!_isCellEditable(row, colDef)) {
      if (!isNil(nonHighlightedNonEditableCells)) {
        return !includes(nonHighlightedNonEditableCells, colDef.field as keyof R);
      } else if (!isNil(highlightedNonEditableCells)) {
        return includes(highlightedNonEditableCells, colDef.field as keyof R);
      } else if (!isNil(highlightNonEditableCell)) {
        return highlightNonEditableCell(row, colDef);
      }
      return true;
    }
    return false;
  });

  const createGroupFooter = (group: G): R => {
    const footerObj: { [key: string]: any } = {
      id: group.id,
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
    forEach(bodyColumns, (col: ColDef) => {
      if (!isNil(col.field)) {
        footerObj[col.field] = null;
      }
    });
    forEach(calculatedColumns, (col: ColDef) => {
      if (!isNil(col.field) && !isNil(group[col.field as keyof G])) {
        footerObj[col.field] = group[col.field as keyof G];
      }
    });
    return footerObj as R;
  };

  const tableFooter = useMemo((): R | null => {
    if (!isNil(tableTotals)) {
      const footerObj: { [key: string]: any } = {
        id: hashString("tablefooter"),
        [identifierField]: tableFooterIdentifierValue,
        meta: {
          isPlaceholder: false,
          isGroupFooter: false,
          isTableFooter: true,
          isBudgetFooter: false,
          selected: false,
          children: [],
          errors: []
        }
      };
      forEach(bodyColumns, (col: ColDef) => {
        if (!isNil(col.field)) {
          footerObj[col.field] = null;
        }
      });
      forEach(calculatedColumns, (col: ColDef) => {
        if (!isNil(col.field) && !isNil(tableTotals[col.field])) {
          footerObj[col.field] = tableTotals[col.field];
        }
      });
      return footerObj as R;
    }
    return null;
  }, [useDeepEqualMemo(tableTotals), tableFooterIdentifierValue]);

  const budgetFooter = useMemo((): R | null => {
    if (!isNil(budgetTotals)) {
      const footerObj: { [key: string]: any } = {
        id: hashString("budgetfooter"),
        [identifierField]: budgetFooterIdentifierValue,
        meta: {
          isPlaceholder: false,
          isGroupFooter: false,
          isTableFooter: false,
          isBudgetFooter: true,
          selected: false,
          children: [],
          errors: []
        }
      };
      forEach(bodyColumns, (col: ColDef) => {
        if (!isNil(col.field)) {
          footerObj[col.field] = null;
        }
      });
      forEach(calculatedColumns, (col: ColDef) => {
        if (!isNil(col.field) && !isNil(budgetTotals[col.field])) {
          footerObj[col.field] = budgetTotals[col.field];
        }
      });
      return footerObj as R;
    }
    return null;
  }, [useDeepEqualMemo(budgetTotals), budgetFooterIdentifierValue]);

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
            if (isNil(row.group)) {
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
        } else if (
          includes(
            [calculatedColumns[0].field, "expand", "select", "delete"],
            params.nextCellPosition.column.getColId()
          )
        ) {
          return params.previousCellPosition;
        } else {
          return params.nextCellPosition;
        }
      }
      return params.previousCellPosition;
    }
  );

  const onCellKeyDown = useDynamicCallback((event: CellKeyDownEvent) => {
    // const count = event.api.getDisplayedRowCount();
    if (!isNil(event.rowIndex) && !isNil(event.event)) {
      // I do not understand why AGGrid's Event has an underlying Event that is in
      // reality a KeyboardEvent but does not have any of the properties that a KeyboardEvent
      // should have - meaning we have to tell TS to ignore this line.
      /* @ts-ignore */
      if (event.event.keyCode === 13) {
        event.api.stopEditing(false);
        event.api.clearFocusedCell();

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
  });

  const onCellEditingStopped = useDynamicCallback((event: CellEditingStoppedEvent) => {
    const field = event.column.getColId();
    if (!isNil(event.newValue)) {
      if (isNil(event.oldValue) || event.oldValue !== event.newValue) {
        if (!isNil(event.colDef.valueSetter) && typeof event.colDef.valueSetter !== "string") {
          const valid = event.colDef.valueSetter({ ...event });
          if (valid === true) {
            onRowUpdate({
              id: event.data.id,
              data: { [field]: { oldValue: event.oldValue, newValue: event.newValue } }
            });
          }
        } else {
          onRowUpdate({
            id: event.data.id,
            data: { [field]: { oldValue: event.oldValue, newValue: event.newValue } }
          });
        }
      }
    }
  });

  const getRowClass = useDynamicCallback((params: RowClassParams) => {
    if (params.node.data.meta.isGroupFooter === true) {
      let colorClass = params.node.data.group.color;
      if (colorClass.startsWith("#")) {
        colorClass = params.node.data.group.color.slice(1);
      }
      return classNames("row--group-footer", `bg-${colorClass}`);
    }
  });

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
        name: `Delete ${row.meta.typeLabel} ${row.meta.label}`,
        action: () => onRowDelete(row)
      };
      if (isNil(groupParams)) {
        return [deleteRowContextMenuItem];
      } else if (!isNil(row.group)) {
        return [
          deleteRowContextMenuItem,
          {
            name: `Remove ${row.meta.typeLabel} ${row.meta.label} from Group ${row.group.name}`,
            action: () => groupParams.onRowRemoveFromGroup(row)
          }
        ];
      } else {
        const groupableNodesAbove = findRowsUpUntilFirstGroupFooterRow(params.node);
        let label: string;
        if (groupableNodesAbove.length === 1) {
          label = `Group ${groupableNodesAbove[0].data.meta.typeLabel} ${groupableNodesAbove[0].data.meta.label}`;
        } else {
          label = `Group ${groupableNodesAbove[0].data.meta.typeLabel}s ${
            groupableNodesAbove[groupableNodesAbove.length - 1].data.meta.label
          } - ${groupableNodesAbove[0].data.meta.label}`;
        }
        return [
          deleteRowContextMenuItem,
          {
            name: label,
            action: () => groupParams.onGroupRows(map(groupableNodesAbove, (node: RowNode) => node.data as R))
          }
        ];
      }
    }
  });

  // TODO: We need a way to preserve the indices of the existing data that was already there!
  // This is important for placeholders when they are activated and removed!
  useEffect(() => {
    const newTable: R[] = [];

    const getGroupForModel = (model: M): number | null => {
      const group: G | undefined = find(groups, (g: G) =>
        includes(
          map(g.children, (child: any) => child.id),
          model.id
        )
      );
      return !isNil(group) ? group.id : null;
    };

    const modelsWithGroup = filter(data, (m: M) => !isNil(getGroupForModel(m)));
    let modelsWithoutGroup = filter(data, (m: M) => isNil(getGroupForModel(m)));
    const groupedModels: { [key: number]: M[] } = groupBy(modelsWithGroup, (model: M) => getGroupForModel(model));

    forEach(groupedModels, (models: M[], groupId: string) => {
      const group: G | undefined = find(groups, { id: parseInt(groupId) } as any);
      if (!isNil(group)) {
        const footer: R = createGroupFooter(group);
        newTable.push(...map(models, (m: M) => mapping.modelToRow(m, group, { selected: includes(selected, m.id) })), {
          ...footer,
          group,
          [identifierField]: group.name,
          meta: { ...footer.meta, isGroupFooter: true }
        });
      } else {
        // In the case that the group no longer exists, that means the group was removed from the
        // state.  In this case, we want to disassociate the rows with the group.
        modelsWithoutGroup = [...modelsWithoutGroup, ...models];
      }
    });
    setTable([
      ...newTable,
      ...map(modelsWithoutGroup, (m: M) => mapping.modelToRow(m, null, { selected: includes(selected, m.id) })),
      ...map(placeholders, (r: R) => ({ ...r, meta: { ...r.meta, selected: includes(selected, r.id) } }))
    ]);
  }, [useDeepEqualMemo(data), useDeepEqualMemo(placeholders), useDeepEqualMemo(selected), useDeepEqualMemo(groups)]);

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
    // Changes to the selected rows and other possible HTML based cells do not trigger
    // refreshes via AGGrid because AGGrid cannot detect changes to these HTML
    // based cells.  Therefore, we must trigger the refresh manually.
    if (!isNil(gridApi)) {
      gridApi.forEachNode((node: RowNode) => {
        if (node.group === false) {
          const existing: R | undefined = find(table, { id: node.data.id });
          if (!isNil(existing)) {
            if (
              existing.meta.selected !== node.data.meta.selected ||
              (!isNil(rowRefreshRequired) && rowRefreshRequired(existing, node.data))
            ) {
              gridApi.refreshCells({ force: true, rowNodes: [node] });
            }
          }
        }
      });
    }
  }, [useDeepEqualMemo(table), gridApi]);

  useEffect(() => {
    // Changes to the errors in the rows does not trigger a refresh of those cells
    // via AGGridReact because AGGridReact cannot detect changes in that type of
    // data structure for the row.
    if (!isNil(gridApi) && !isNil(columnApi)) {
      gridApi.forEachNode((node: RowNode) => {
        if (node.group === false) {
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
    setColDefs(
      map(
        concat(
          baseColumns,
          map(
            bodyColumns,
            (def: ColDef) =>
              ({
                cellRenderer: "ValueCell",
                ...def
              } as ColDef)
          ),
          map(
            calculatedColumns,
            (def: ColDef) =>
              ({
                cellRenderer: "CalculatedCell",
                minWidth: 100,
                maxWidth: 125,
                cellStyle: { textAlign: "right" },
                cellRendererParams: { formatter: formatCurrencyWithoutDollarSign, renderRedIfNegative: true },
                ...def
              } as ColDef)
          )
        ),
        (col: ColDef) => ({
          ...col,
          suppressMenu: true,
          suppressMenuHide: true,
          editable: (params: EditableCallbackParams) => _isCellEditable(params.node.data as R, params.colDef),
          cellClass: (params: CellClassParams) => {
            const row: R = params.node.data;
            let rootClassNames = undefined;
            if (!isNil(col.cellClass)) {
              if (typeof col.cellClass === "string" || Array.isArray(col.cellClass)) {
                rootClassNames = col.cellClass;
              } else {
                rootClassNames = col.cellClass(params);
              }
            }
            // TODO: See if we can move some of these to their specific column
            // definitions in the map() above.
            return classNames(col.cellClass, rootClassNames, {
              "cell--not-editable": !_isCellEditable(row, params.colDef),
              "cell--not-editable-highlight": _isCellNonEditableHighlight(row, params.colDef)
            });
          }
        })
      )
    );
  }, [useDeepEqualMemo(bodyColumns), useDeepEqualMemo(calculatedColumns)]);

  return (
    <React.Fragment>
      <TableHeader
        search={search}
        setSearch={(value: string) => onSearch(value)}
        columns={[...bodyColumns, ...calculatedColumns]}
        onDelete={() => {
          forEach(table, (row: R) => {
            if (row.meta.selected === true) {
              onRowDelete(row);
            }
          });
        }}
        saving={saving}
        selected={allSelected}
        onSelect={onSelectAll}
        deleteDisabled={filter(table, (row: R) => row.meta.selected === true).length === 0}
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
                  map([...bodyColumns, ...calculatedColumns], (c: ColDef) => c.field),
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
            forEach([...bodyColumns, ...calculatedColumns], (col: ColDef) => {
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
      <RenderWithSpinner absolute loading={loading}>
        <div className={"budget-table ag-theme-alpine"}>
          <div className={"table-grid"}>
            <AgGridReact
              {...gridOptions}
              debug={true}
              columnDefs={colDefs}
              getContextMenuItems={getContextMenuItems}
              allowContextMenuWithControlKey={true}
              rowData={table}
              getRowNodeId={(r: any) => r.id}
              getRowClass={getRowClass}
              immutableData={true}
              suppressRowClickSelection={true}
              onGridReady={onGridReady}
              rowHeight={36}
              headerHeight={38}
              enableRangeSelection={true}
              clipboardDeliminator={","}
              animateRows={true}
              navigateToNextCell={navigateToNextCell}
              onCellKeyDown={onCellKeyDown}
              onFirstDataRendered={onFirstDataRendered}
              // NOTE: This might not be 100% necessary, because of how efficiently
              // we are managing the state updates to the data that flows into the table.
              // However, for now we will leave.  It is important to note that this will
              // cause the table renders to be slower for large datasets.
              rowDataChangeDetectionStrategy={ChangeDetectionStrategyType.DeepValueCheck}
              enterMovesDown={true}
              frameworkComponents={{
                ExpandCell: ExpandCell,
                IndexCell: IndexCell,
                ValueCell: IncludeErrorsInCell<R>(ValueCell),
                UnitCell: IncludeErrorsInCell<R>(UnitCell),
                IdentifierCell: IncludeErrorsInCell<R>(IdentifierCell),
                CalculatedCell: CalculatedCell,
                PaymentMethodsCell: HideCellForAllFooters<R>(PaymentMethodsCell),
                BudgetItemCell: HideCellForAllFooters<R>(BudgetItemCell),
                ...frameworkComponents
              }}
              onCellEditingStopped={onCellEditingStopped}
            />
          </div>
          <ShowHide show={!isNil(tableTotals)}>
            <div className={"table-footer-grid"}>
              <AgGridReact
                {...tableFooterGridOptions}
                columnDefs={colDefs}
                rowData={[tableFooter]}
                rowClass={"row--table-footer"}
                suppressRowClickSelection={true}
                onGridReady={onTableFooterGridReady}
                onFirstDataRendered={onTableFooterFirstDataRendered}
                headerHeight={0}
                frameworkComponents={{
                  IndexCell: IndexCell,
                  ExpandCell: ExpandCell,
                  ValueCell: IncludeErrorsInCell<R>(ValueCell),
                  UnitCell: IncludeErrorsInCell<R>(UnitCell),
                  IdentifierCell: IncludeErrorsInCell<R>(IdentifierCell),
                  CalculatedCell: CalculatedCell,
                  PaymentMethodsCell: HideCellForAllFooters<R>(PaymentMethodsCell),
                  BudgetItemCell: HideCellForAllFooters<R>(BudgetItemCell),
                  ...frameworkComponents
                }}
              />
            </div>
          </ShowHide>
          <ShowHide show={!isNil(budgetTotals)}>
            <div className={"budget-footer-grid"}>
              <AgGridReact
                {...budgetFooterGridOptions}
                columnDefs={colDefs}
                rowData={[budgetFooter]}
                rowClass={"row--budget-footer"}
                suppressRowClickSelection={true}
                onGridReady={onBudgetFooterGridReady}
                onFirstDataRendered={onBudgetFooterFirstDataRendered}
                headerHeight={0}
                rowHeight={28}
                frameworkComponents={{
                  IndexCell: IndexCell,
                  ExpandCell: ExpandCell,
                  ValueCell: IncludeErrorsInCell<R>(ValueCell),
                  UnitCell: IncludeErrorsInCell<R>(UnitCell),
                  IdentifierCell: IncludeErrorsInCell<R>(IdentifierCell),
                  CalculatedCell: CalculatedCell,
                  PaymentMethodsCell: HideCellForAllFooters<R>(PaymentMethodsCell),
                  BudgetItemCell: HideCellForAllFooters<R>(BudgetItemCell),
                  ...frameworkComponents
                }}
              />
            </div>
          </ShowHide>
        </div>
      </RenderWithSpinner>
    </React.Fragment>
  );
};

export default BudgetTable;
