import React, { useMemo } from "react";

import { SelectionChangedEvent } from "ag-grid-community";
import { map, isNil, reduce } from "lodash";

import { tabling, hooks } from "lib";
import { framework as generic } from "components/tabling/generic";

import Grid, { GridProps } from "./Grid";

export interface AuthenticatedGridProps<
  R extends Table.RowData,
  M extends model.RowTypedApiModel = model.RowTypedApiModel,
> extends GridProps<R, M> {
  readonly apis: Table.GridApis | null;
  readonly framework?: Table.Framework;
  readonly onEvent: (event: Table.Event<R, M>) => void;
  readonly onRowSelectionChanged?: (rows: Table.EditableRow<R>[]) => void;
}

const AuthenticatedGrid = <
  R extends Table.RowData,
  M extends model.RowTypedApiModel = model.RowTypedApiModel,
>({
  framework,
  ...props
}: AuthenticatedGridProps<R, M>): JSX.Element => {
  const frameworkComponents = useMemo<Table.FrameworkGroup>((): Table.FrameworkGroup => {
    const combinedFramework = tabling.aggrid.combineFrameworks(generic.Framework, framework);
    return {
      ...reduce(
        combinedFramework.cells?.[props.id],
        (
          prev: Table.FrameworkGroup,
          cell: React.ComponentType<Record<string, unknown>>,
          name: string,
        ) => ({
          ...prev,
          [name]: cell,
        }),
        {},
      ),
      ...reduce(
        combinedFramework.editors,
        (
          prev: Table.FrameworkGroup,
          editor: React.ComponentType<Record<string, unknown>>,
          name: string,
        ) => ({ ...prev, [name]: editor }),
        {},
      ),
    };
  }, [framework, props.id]);

  const columns = useMemo<Table.Column<R, M>[]>(
    (): Table.Column<R, M>[] =>
      map(
        props.columns,
        (col: Table.Column<R, M>): Table.Column<R, M> =>
          tabling.columns.isRealColumn(col)
            ? {
                ...col,
                cellRendererParams: { ...col.cellRendererParams, onEvent: props.onEvent },
              }
            : col,
      ),
    [hooks.useDeepEqualMemo(props.columns)],
  );

  const onSelectionChanged: (e: SelectionChangedEvent) => void = hooks.useDynamicCallback(() => {
    if (!isNil(props.apis)) {
      const selected: Table.EditableRow<R>[] = props.apis.grid.getSelectedRows();
      props.onRowSelectionChanged?.(selected);
    }
  });
  return (
    <Grid
      {...props}
      columns={columns}
      frameworkComponents={frameworkComponents}
      onSelectionChanged={onSelectionChanged}
      // Required to get processCellFromClipboard to work with column spanning.
      suppressCopyRowsToClipboard={true}
    />
  );
};

export default React.memo(AuthenticatedGrid) as typeof AuthenticatedGrid;
