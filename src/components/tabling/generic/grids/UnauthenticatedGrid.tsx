import React, { useMemo } from "react";
import { map, reduce } from "lodash";

import { tabling, hooks } from "lib";
import { framework as generic } from "components/tabling/generic";
import Grid, { GridProps } from "./Grid";

export interface UnauthenticatedGridProps<R extends Table.RowData, M extends Model.HttpModel = Model.HttpModel>
  extends GridProps<R, M> {
  readonly framework?: Table.Framework;
  readonly footerRowSelectors?: Partial<Table.FooterGridSet<Table.RowDataSelector<R>>>;
}

/* eslint-disable indent */
const UnauthenticatedGrid = <R extends Table.RowData, M extends Model.HttpModel = Model.HttpModel>({
  framework,
  footerRowSelectors,
  ...props
}: UnauthenticatedGridProps<R, M>): JSX.Element => {
  const frameworkComponents = useMemo<Table.FrameworkGroup>((): Table.FrameworkGroup => {
    const combinedFramework = tabling.aggrid.combineFrameworks(generic.Framework, framework);
    return {
      ...reduce(
        combinedFramework.cells?.[props.id],
        (prev: Table.FrameworkGroup, cell: React.ComponentType<any>, name: string) => ({
          ...prev,
          [name]: cell
          // [name]: generic.connectCellToStore({ gridId: props.id, footerRowSelectors })(cell)
        }),
        {}
      )
    };
  }, [framework, props.id]);

  const columns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
    return map(
      props.columns,
      (col: Table.Column<R, M>): Table.Column<R, M> =>
        ({
          ...col,
          cellRendererParams: { ...col.cellRendererParams, readOnly: true }
        } as Table.Column<R, M>)
    );
  }, [hooks.useDeepEqualMemo(props.columns)]);

  return <Grid {...props} columns={columns} frameworkComponents={frameworkComponents} />;
};

export default UnauthenticatedGrid;
