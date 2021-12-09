import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import classNames from "classnames";
import { map, isNil, includes, find, filter } from "lodash";
import hoistNonReactStatics from "hoist-non-react-statics";

import { CellMouseOverEvent, CellFocusedEvent } from "@ag-grid-community/core";

import { tabling, hooks, model } from "lib";

interface InjectedDataGridProps {
  readonly id: Table.GridId;
  readonly onCellMouseOver?: (e: CellMouseOverEvent) => void;
  readonly onCellFocused?: (e: CellFocusedEvent) => void;
}

export interface DataGridProps<R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel> {
  readonly apis: Table.GridApis | null;
  readonly className?: Table.GeneralClassName;
  readonly rowClass?: Table.RowClassName;
  readonly hasEditColumn: boolean;
  readonly columns: Table.Column<R, M>[];
  readonly search?: string;
  readonly cookieNames?: Table.CookieNames;
  readonly onCellFocusChanged?: (params: Table.CellFocusChangedParams<R, M>) => void;
  readonly onFirstDataRendered: (e: Table.FirstDataRenderedEvent) => void;
}

export type WithDataGridProps<T> = T & InjectedDataGridProps;

const getRowColorDef = <R extends Table.RowData>(row: Table.BodyRow<R>): Table.RowColorDef => {
  if (tabling.typeguards.isGroupRow(row)) {
    const colorDef = model.util.getGroupColorDefinition(row);
    if (!isNil(colorDef?.color) && !isNil(colorDef?.backgroundColor)) {
      return {
        color: colorDef?.color,
        backgroundColor: colorDef?.backgroundColor
      };
    } else if (!isNil(colorDef?.backgroundColor)) {
      return {
        backgroundColor: colorDef?.backgroundColor
      };
    } else if (!isNil(colorDef?.color)) {
      return {
        color: colorDef?.color
      };
    }
  }
  return {};
};

/* eslint-disable indent */
const DataGrid =
  <
    R extends Table.RowData,
    M extends Model.RowHttpModel = Model.RowHttpModel,
    T extends DataGridProps<R, M> = DataGridProps<R, M>
  >(
    config?: Table.DataGridConfig<R>
  ) =>
  (
    Component: React.ComponentClass<WithDataGridProps<T>, {}> | React.FunctionComponent<WithDataGridProps<T>>
  ): React.FunctionComponent<T> => {
    function WithDataGrid(props: T) {
      const [focused, setFocused] = useState(false);
      const oldFocusedEvent = useRef<CellFocusedEvent | null>(null);
      const location = useLocation();

      const columns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
        return map(props.columns, (col: Table.Column<R, M>) => ({
          ...col,
          cellRendererParams: { ...col.cellRendererParams, getRowColorDef }
        }));
      }, [hooks.useDeepEqualMemo(props.columns)]);

      const onFirstDataRendered: (e: Table.FirstDataRenderedEvent) => void = useMemo(
        () =>
          (e: Table.FirstDataRenderedEvent): void => {
            props.onFirstDataRendered(e);

            const handleQuery = (rows: Table.BodyRow<R>[]) => {
              if (rows.length !== 0) {
                e.api.ensureIndexVisible(0);

                const query = new URLSearchParams(location.search);
                const rowId = query.get("row");
                const cols = e.columnApi.getAllColumns();

                const actionColumns = filter(props.columns, (c: Table.Column<R, M>) => c.tableColumnType === "action");

                if (!isNil(cols) && cols.length > actionColumns.length) {
                  let firstColumn = cols[actionColumns.length];
                  let focusedOnQuery = false;
                  if (!isNil(rowId) && !isNaN(parseInt(rowId))) {
                    const node = e.api.getRowNode(String(rowId));
                    if (!isNil(node) && !isNil(node.rowIndex) && !isNil(firstColumn)) {
                      e.api.setFocusedCell(node.rowIndex, firstColumn);
                      focusedOnQuery = true;
                    }
                  }
                  if (focusedOnQuery === false) {
                    e.api.setFocusedCell(0, firstColumn);
                  }
                }
              }
            };
            /*
						At the time of this writing, we are not exactly sure why this is
						happening - but for whatever reason (most like an AG Grid internal
						discrepancy) when migrating to the previous table with CMD + ArrowUp,
						the table initially triggers onFirstDataRendered when there are no
						nodes in the table yet - which is strange.  In order to avoid this
						situation, if we notice that there are no rows in the table when
						this is triggered, we will attempt to handle the query 100ms later -
						so that the nodes are populated in the table.
						*/
            let rows: Table.BodyRow<R>[] = tabling.aggrid.getRows(e.api);
            if (rows.length === 0) {
              setTimeout(() => {
                rows = tabling.aggrid.getRows(e.api);
                handleQuery(rows);
              }, 100);
            } else {
              handleQuery(rows);
            }
          },
        [hooks.useDeepEqualMemo(props.columns), props.onFirstDataRendered]
      );

      const getRowClass: Table.GetRowClassName = useMemo(
        () => (params: Table.RowClassParams) => {
          const row: Table.BodyRow<R> = params.node.data;
          if (tabling.typeguards.isGroupRow(row)) {
            return classNames("row--data", "row--group", props.rowClass);
          }
          return classNames("row--data", props.rowClass);
        },
        [props.rowClass]
      );

      const getRowStyle: Table.GetRowStyle = useMemo(
        () =>
          (params: Table.RowClassParams): { [key: string]: any } => {
            const row: Table.BodyRow<R> = params.node.data;
            return getRowColorDef(row);
          },
        []
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
              const row: Table.BodyRow<R> = rowNode.data;
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
          if (props.hasEditColumn) {
            if (
              includes(
                map(columns, (col: Table.Column<R, M>) => col.field),
                e.colDef.field as keyof R
              )
            ) {
              const nodes: Table.RowNode[] = [];
              const firstRow = e.api.getFirstDisplayedRow();
              const lastRow = e.api.getLastDisplayedRow();
              e.api.forEachNodeAfterFilter((node: Table.RowNode, index: number) => {
                if (index >= firstRow && index <= lastRow) {
                  const row: Table.BodyRow<R> = node.data;
                  if (
                    isNil(config?.refreshRowExpandColumnOnCellHover) ||
                    config?.refreshRowExpandColumnOnCellHover(row) === true
                  ) {
                    nodes.push(node);
                  }
                }
              });
              e.api.refreshCells({ force: true, rowNodes: nodes, columns: ["edit"] });
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
            props.apis?.grid.ensureIndexVisible(1);
            props.apis?.grid.ensureColumnVisible(firstEditableCol);
            setTimeout(() => props.apis?.grid.setFocusedCell(0, firstEditableCol), 0);
            /* TODO: Investigate if there is a better way to do this - currently,
               this hook is getting triggered numerous times when it shouldn't be.
               It is because the of the `columns` in the dependency array, which
               are necessary to get a situation when `firstEditCol` is not null,
               but also shouldn't be triggering this hook so many times. */
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
          columns={columns}
          className={classNames("grid--data", props.className)}
          domLayout={"autoHeight"}
          rowSelection={"multiple"}
          rowClass={getRowClass}
          getRowStyle={getRowStyle}
          onFirstDataRendered={onFirstDataRendered}
          onCellFocused={onCellFocused}
          onCellMouseOver={onCellMouseOver}
        />
      );
    }
    return hoistNonReactStatics(WithDataGrid, React.memo(Component));
  };

export default DataGrid;
