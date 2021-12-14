import { isNil, includes, filter, map } from "lodash";

import { NavigateToNextCellParams, TabToNextCellParams } from "@ag-grid-community/core";

import { hooks, tabling } from "lib";

export interface UseCellNavigationParams<R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel> {
  readonly apis: Table.GridApis | null;
  readonly columns: Table.Column<R, M>[];
  readonly includeRowInNavigation?: (row: Table.EditableRow<R>) => boolean;
  readonly onNewRowRequired?: (newRowIndex: number) => void;
}

type UseCellNavigationReturnType = [
  (p: NavigateToNextCellParams) => Table.CellPosition,
  (p: TabToNextCellParams) => Table.CellPosition,
  (loc: Table.CellPosition) => void,
  (loc: Table.CellPosition) => void
];

type FindNavigatableRowOptions<R extends Table.RowData> = {
  readonly direction?: "asc" | "desc";
  readonly includeRowInNavigation?: (row: Table.EditableRow<R>) => boolean;
};

const findNextNavigatableNodes = <R extends Table.RowData>(
  api: Table.GridApi,
  startingIndex: number,
  opts?: FindNavigatableRowOptions<R>
): [Table.RowNode[], number, number] => {
  const d = opts?.direction !== undefined ? opts.direction : "asc";
  const indexIsValid = (index: number) => {
    if (d === "desc" && index < 0) {
      return false;
    }
    return true;
  };

  const nextIndex = (runningIndex: number) =>
    d === "asc" ? startingIndex + runningIndex : startingIndex - runningIndex;

  const isNavigatableNode = (node: Table.RowNode) => {
    const row: Table.BodyRow<R> = node.data;
    const includeRowInNavigation = opts?.includeRowInNavigation;
    return (
      tabling.typeguards.isEditableRow(row) && (isNil(includeRowInNavigation) || includeRowInNavigation(row) !== false)
    );
  };

  let nodesAfterNavigatable: Table.RowNode[] = [];

  if (indexIsValid(startingIndex)) {
    let runningIndex = 0;
    let runningAllNodeIndex = 0;

    let nextRowNode: Table.RowNode | undefined = api.getDisplayedRowAtIndex(startingIndex);
    if (!isNil(nextRowNode)) {
      nodesAfterNavigatable = [nextRowNode];
    }
    while (!isNil(nextRowNode)) {
      /* The `runningIndex` is used to track the first index at which the node
         is navigatable, so if we already encountered a navigatable row we need
         to stop incrementing `runningIndex`. */
      if (nodesAfterNavigatable.length === 0) {
        runningIndex = runningIndex + 1;
      }
      runningAllNodeIndex = runningAllNodeIndex + 1;
      if (!indexIsValid(nextIndex(runningAllNodeIndex))) {
        break;
      }
      nextRowNode = api.getDisplayedRowAtIndex(nextIndex(runningAllNodeIndex));
      if (!isNil(nextRowNode)) {
        if (nodesAfterNavigatable.length === 0 && isNavigatableNode(nextRowNode)) {
          nodesAfterNavigatable = [nextRowNode];
        } else if (nodesAfterNavigatable.length !== 0) {
          /* If we already encountered a navigatable RowNode, start adding the
             RowNode(s) after it to the array. */
          nodesAfterNavigatable = [...nodesAfterNavigatable, nextRowNode];
        }
      }
    }
    return [nodesAfterNavigatable, startingIndex + runningIndex, runningIndex];
  } else {
    return [[], startingIndex, 0];
  }
};

/* eslint-disable indent */
const useCellNavigation = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  params: UseCellNavigationParams<R, M>
): UseCellNavigationReturnType => {
  const navigateToNextCell: (p: NavigateToNextCellParams) => Table.CellPosition = hooks.useDynamicCallback(
    (p: NavigateToNextCellParams): Table.CellPosition => {
      if (!isNil(p.nextCellPosition)) {
        const field = p.nextCellPosition.column.getColId();
        const column = tabling.columns.getColumn(params.columns, field);
        if (!isNil(column)) {
          const verticalAscend = p.previousCellPosition.rowIndex < p.nextCellPosition.rowIndex;
          const verticalDescend = p.previousCellPosition.rowIndex > p.nextCellPosition.rowIndex;

          if (verticalAscend === true || verticalDescend === true) {
            const direction: "asc" | "desc" = verticalAscend === true ? "asc" : "desc";
            /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
            const [rowNodes, _, additionalIndex] = findNextNavigatableNodes(p.api, p.nextCellPosition.rowIndex, {
              direction,
              includeRowInNavigation: params.includeRowInNavigation
            });
            if (rowNodes.length !== 0) {
              return {
                ...p.nextCellPosition,
                rowIndex:
                  verticalAscend === true
                    ? p.nextCellPosition.rowIndex + additionalIndex
                    : p.nextCellPosition.rowIndex - additionalIndex
              };
            }
            return p.nextCellPosition;
          } else if (column.tableColumnType === "action") {
            return p.previousCellPosition;
          } else {
            return p.nextCellPosition;
          }
        }
      }
      return p.previousCellPosition;
    }
  );

  const tabToNextCell: (p: TabToNextCellParams) => Table.CellPosition = hooks.useDynamicCallback(
    (p: TabToNextCellParams): Table.CellPosition => {
      /* TODO: We need to figure out how to add additional rows in the write
				 case when we are at the bottom right of the table. */
      if (!p.editing && p.nextCellPosition !== null) {
        const field = p.nextCellPosition.column.getColId();
        const column = tabling.columns.getColumn(params.columns, field);
        if (!isNil(column) && column.tableColumnType === "action") {
          let nextCellPosition = { ...p.nextCellPosition };
          /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
          const [rowNodes, _, additionalIndex] = findNextNavigatableNodes(p.api, p.nextCellPosition.rowIndex, {
            includeRowInNavigation: params.includeRowInNavigation
          });
          if (rowNodes.length !== 0) {
            nextCellPosition = {
              ...p.nextCellPosition,
              rowIndex: p.nextCellPosition.rowIndex + additionalIndex
            };
          }
          const agColumns = params.apis?.column.getAllColumns();
          if (!isNil(agColumns)) {
            const baseColumns = filter(agColumns, (c: Table.AgColumn) =>
              includes(
                map(
                  filter(params.columns, (ci: Table.Column<R, M>) => ci.tableColumnType === "action"),
                  (ci: Table.Column<R, M>) => tabling.columns.normalizedField<R, M>(ci)
                ),
                c.getColId()
              )
            );
            if (p.backwards === false && params.columns.length > baseColumns.length) {
              return { ...nextCellPosition, column: agColumns[baseColumns.length] };
            } else {
              return { ...nextCellPosition, column: agColumns[agColumns.length - 1] };
            }
          }
        }
      }
      return p.nextCellPosition === null ? p.previousCellPosition : p.nextCellPosition;
    }
  );

  const moveToLocation: (loc: Table.CellPosition) => void = hooks.useDynamicCallback((loc: Table.CellPosition) => {
    params.apis?.grid.setFocusedCell(loc.rowIndex, loc.column);
    params.apis?.grid.clearRangeSelection();
  });

  const moveToNextColumn: (loc: Table.CellPosition) => void = hooks.useDynamicCallback((loc: Table.CellPosition) => {
    const agColumns = params.apis?.column.getAllColumns();
    if (!isNil(agColumns)) {
      const index = agColumns.indexOf(loc.column);
      if (index !== -1) {
        if (index === agColumns.length - 1) {
          moveToNextRow({ rowIndex: loc.rowIndex, column: agColumns[0] });
        } else {
          moveToLocation({ rowIndex: loc.rowIndex, column: agColumns[index + 1] });
        }
      }
    }
  });

  const moveToNextRow: (loc: Table.CellPosition) => void = hooks.useDynamicCallback((loc: Table.CellPosition) => {
    if (!isNil(params.apis)) {
      const node: Table.RowNode | undefined = params.apis.grid.getDisplayedRowAtIndex(loc.rowIndex);
      if (!isNil(node)) {
        const row: Table.BodyRow<R> = node.data;
        /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
        const [nodes, rowIndex, _] = findNextNavigatableNodes(params.apis.grid, loc.rowIndex + 1, {
          includeRowInNavigation: params.includeRowInNavigation,
          direction: "asc"
        });

        const rows: Table.BodyRow<R>[] = map(nodes, (n: Table.RowNode) => n.data);

        /* We only want to add a new row if we are either at the last BodyRow of
					 the entire table or at the last ModelRow of the entire table (in which
					 case the only BodyRow(s) after it should be MarkupRow(s)). */
        const newRowRequired = (r: Table.BodyRow<R>, rws: Table.BodyRow<R>[]) => {
          if (rows.length === 0) {
            return true;
          } else if (
            tabling.typeguards.isModelRow(r) &&
            filter(rows, (ri: Table.BodyRow<R>) => tabling.typeguards.isModelRow(ri)).length === 0
          ) {
            return true;
          }
          return false;
        };

        if (!isNil(node)) {
          if (newRowRequired(row, rows)) {
            if (!isNil(params.onNewRowRequired)) {
              params.onNewRowRequired(loc.rowIndex);
            }
          } else {
            moveToLocation({ rowIndex, column: loc.column });
          }
        }
      }
    }
  });

  return [navigateToNextCell, tabToNextCell, moveToNextColumn, moveToNextRow];
};

export default useCellNavigation;