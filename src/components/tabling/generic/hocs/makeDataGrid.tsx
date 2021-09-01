import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import classNames from "classnames";
import { map, isNil, includes, find } from "lodash";
import hoistNonReactStatics from "hoist-non-react-statics";

import { FirstDataRenderedEvent, CellMouseOverEvent, CellFocusedEvent } from "@ag-grid-community/core";

import { tabling, hooks } from "lib";

interface InjectedDataGridProps {
  readonly id: Table.GridId;
  readonly onCellMouseOver?: (e: CellMouseOverEvent) => void;
  readonly onCellFocused?: (e: CellFocusedEvent) => void;
}

export interface DataGridProps<R extends Table.Row = any, M extends Model.Model = any> {
  readonly apis: Table.GridApis | null;
  readonly className?: Table.GeneralClassName;
  readonly rowClass?: Table.RowClassName;
  readonly hasExpandColumn: boolean;
  readonly columns: Table.Column<R, M>[];
  readonly search?: string;
  readonly cookieNames?: Table.CookieNames;
  readonly onCellFocusChanged?: (params: Table.CellFocusChangedParams<R, M>) => void;
  readonly isCellSelectable?: (params: Table.SelectableCallbackParams<R, M>) => boolean;
  readonly rowCanExpand?: (row: R) => boolean;
  readonly onRowExpand?: null | ((id: number) => void);
  readonly onFirstDataRendered: (e: FirstDataRenderedEvent) => void;
}

export type WithDataGridProps<T> = T & InjectedDataGridProps;

/* eslint-disable indent */
const DataGrid =
  <T extends DataGridProps<R, M> = DataGridProps<any, any>, R extends Table.Row = any, M extends Model.Model = any>(
    config?: TableUi.DataGridConfig<R>
  ) =>
  (
    Component: React.ComponentClass<WithDataGridProps<T>, {}> | React.FunctionComponent<WithDataGridProps<T>>
  ): React.FunctionComponent<T> => {
    function WithDataGrid(props: T) {
      const [focused, setFocused] = useState(false);
      const oldFocusedEvent = useRef<CellFocusedEvent | null>(null);
      const location = useLocation();
      const [ordering, updateOrdering] = tabling.hooks.useOrdering({
        cookie: props.cookieNames?.ordering,
        columns: props.columns
      });

      const columns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
        return map(
          tabling.util.updateColumnsOfTableType<Table.Column<R, M>, R, M>(props.columns, "body", {
            headerComponentParams: {
              onSort: (order: Order, field: keyof R) => updateOrdering(order, field as string),
              ordering
            }
          }),
          (col: Table.Column<R, M>) => ({
            ...col,
            selectable: col.selectable || props.isCellSelectable
          })
        );
      }, [hooks.useDeepEqualMemo(props.columns)]);

      const onFirstDataRendered: (e: FirstDataRenderedEvent) => void = hooks.useDynamicCallback(
        (e: FirstDataRenderedEvent): void => {
          props.onFirstDataRendered(e);
          e.api.ensureIndexVisible(0);

          const query = new URLSearchParams(location.search);
          const rowId = query.get("row");
          const cols = e.columnApi.getAllColumns();

          if (!isNil(cols) && cols.length >= 3) {
            let identifierCol = cols[2];
            let focusedOnQuery = false;
            if (!isNil(rowId) && !isNaN(parseInt(rowId))) {
              const node = e.api.getRowNode(String(rowId));
              if (!isNil(node) && !isNil(node.rowIndex) && !isNil(identifierCol)) {
                e.api.setFocusedCell(node.rowIndex, identifierCol);
                focusedOnQuery = true;
              }
            }
            if (focusedOnQuery === false) {
              e.api.setFocusedCell(0, identifierCol);
            }
          }
        }
      );

      const onCellFocused: (e: CellFocusedEvent) => void = hooks.useDynamicCallback((e: CellFocusedEvent) => {
        const getCellFromFocusedEvent = (
          event: CellFocusedEvent,
          col?: Table.Column<R, M>
        ): Table.Cell<R, M> | null => {
          if (!isNil(props.apis) && !isNil(event.rowIndex) && !isNil(event.column)) {
            const rowNode: Table.RowNode | undefined = props.apis.grid.getDisplayedRowAtIndex(event.rowIndex);
            const column: Table.Column<R, M> | undefined = !isNil(col)
              ? col
              : find(columns, { field: event.column.getColId() } as any);
            if (!isNil(rowNode) && !isNil(column)) {
              const row: R = rowNode.data;
              return { rowNode, column, row };
            }
          }
          return null;
        };

        const cellsTheSame = (cell1: Table.Cell<R, M>, cell2: Table.Cell<R, M>): boolean => {
          return cell1.column.field === cell2.column.field && cell1.row.id === cell2.row.id;
        };

        if (!isNil(e.column) && !isNil(props.apis)) {
          const previousFocusEvent = !isNil(oldFocusedEvent.current) ? { ...oldFocusedEvent.current } : null;
          oldFocusedEvent.current = e;

          const col: Table.Column<R, M> | undefined = find(columns, { field: e.column.getColId() } as any);
          if (!isNil(col)) {
            const cell: Table.Cell<R, M> | null = getCellFromFocusedEvent(e);
            const previousCell = !isNil(previousFocusEvent) ? getCellFromFocusedEvent(previousFocusEvent) : null;
            if (!isNil(cell)) {
              if (previousCell === null || !cellsTheSame(cell, previousCell)) {
                if (!isNil(col.onCellFocus)) {
                  col.onCellFocus({ apis: props.apis, cell });
                }
                if (!isNil(props.onCellFocusChanged)) {
                  props.onCellFocusChanged({ apis: props.apis, previousCell, cell });
                }
                if (!isNil(previousCell) && !isNil(col.onCellUnfocus)) {
                  col.onCellUnfocus({ apis: props.apis, cell: previousCell });
                }
              }
            }
          }
        }
      });

      const onCellMouseOver: (e: CellMouseOverEvent) => void = useMemo(
        () => (e: CellMouseOverEvent) => {
          /*
          In order to hide/show the expand button under certain conditions,
          we always need to refresh the expand column whenever another cell
          is hovered.  We should figure out if there is a way to optimize
          this to only refresh under certain circumstances.
          */
          if (props.hasExpandColumn) {
            if (
              includes(
                map(columns, (col: Table.Column<R, M>) => col.field),
                e.colDef.field
              )
            ) {
              const nodes: Table.RowNode[] = [];
              const firstRow = e.api.getFirstDisplayedRow();
              const lastRow = e.api.getLastDisplayedRow();
              e.api.forEachNodeAfterFilter((node: Table.RowNode, index: number) => {
                if (index >= firstRow && index <= lastRow) {
                  const row: R = node.data;
                  if (
                    isNil(config?.refreshRowExpandColumnOnCellHover) ||
                    config?.refreshRowExpandColumnOnCellHover(row) === true
                  ) {
                    nodes.push(node);
                  }
                }
              });
              e.api.refreshCells({ force: true, rowNodes: nodes, columns: ["expand"] });
            }
          }
        },
        []
      );

      useEffect(() => {
        const getFirstEditableDisplayedColumn = (): Table.AgColumn | null => {
          const displayedColumns = props.apis?.column.getAllDisplayedColumns();
          if (!isNil(displayedColumns)) {
            for (let i = 0; i < displayedColumns.length; i++) {
              const displayedColumn = displayedColumns[i];
              const field = displayedColumn.getColDef().field;
              if (!isNil(field)) {
                const customCol = find(columns, { field } as any);
                if (!isNil(customCol) && customCol.editable !== false) {
                  return displayedColumn;
                }
              }
            }
          }
          return null;
        };
        if (focused === false) {
          const firstEditableCol = getFirstEditableDisplayedColumn();
          if (!isNil(firstEditableCol)) {
            props.apis?.grid.ensureIndexVisible(0);
            props.apis?.grid.ensureColumnVisible(firstEditableCol);
            setTimeout(() => props.apis?.grid.setFocusedCell(0, firstEditableCol), 0);
            // TODO: Investigate if there is a better way to do this - currently,
            // this hook is getting triggered numerous times when it shouldn't be.
            // It is because the of the `columns` in the dependency array, which
            // are necessary to get a situation when `firstEditCol` is not null,
            // but also shouldn't be triggering this hook so many times.
            setFocused(true);
          }
        }
      }, [focused]);

      useEffect(() => {
        props.apis?.grid.setQuickFilter(props.search);
      }, [props.search]);

      return (
        <Component
          {...props}
          id={"data"}
          style={{ flex: "1 1 auto" }}
          className={classNames("grid--data", props.className)}
          rowClass={["row--data", props.rowClass]}
          domLayout={"autoHeight"}
          rowSelection={"multiple"}
          onFirstDataRendered={onFirstDataRendered}
          onCellFocused={onCellFocused}
          onCellMouseOver={onCellMouseOver}
        />
      );
    }
    return hoistNonReactStatics(WithDataGrid, Component);
  };

export default DataGrid;
