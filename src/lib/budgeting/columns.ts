import { isNil, filter, map, findIndex, includes } from "lodash";
import { ValueGetterParams } from "@ag-grid-community/core";

import { tabling, budgeting } from "lib";

/* eslint-disable indent */
export const IdentifierColumn = <
  R extends Tables.BudgetRowData,
  M extends Model.RowHttpModel,
  PDFM extends Model.RowHttpModel = any
>(
  props: Partial<Table.Column<R, M, string | null, PDFM>>
): Table.Column<R, M, string | null, PDFM> => {
  return tabling.columns.BodyColumn<R, M, string | null, PDFM>({
    columnType: "number",
    ...props,
    footer: {
      // We always want the text in the identifier cell to be present, but the column
      // itself isn't always wide enough.  However, applying a colSpan conflicts with the
      // colSpan of the main data grid, causing weird behavior.
      cellStyle: { zIndex: 1000, overflow: "visible", whiteSpace: "unset", textAlign: "left" }
    },
    page: {
      // We always want the text in the identifier cell to be present, but the column
      // itself isn't always wide enough.  However, applying a colSpan conflicts with the
      // colSpan of the main data grid, causing weird behavior.
      cellStyle: { zIndex: 1000, overflow: "visible", whiteSpace: "unset", textAlign: "left" }
    },
    index: 0,
    // We only want to use IdentifierCell's in the Footer cells because it slows rendering
    // performance down dramatically.
    cellRenderer: { footer: "IdentifierCell", page: "IdentifierCell" },
    width: 100,
    suppressSizeToFit: true,
    cellStyle: { textAlign: "left" },
    valueGetter: (params: ValueGetterParams) => {
      if (!isNil(params.node)) {
        const row: Table.Row<R> = params.node.data;
        // If the row is a FooterRow, the value will be provided via footerRowSelectors.
        if (tabling.typeguards.isBodyRow(row)) {
          if (tabling.typeguards.isGroupRow(row)) {
            return row.groupData.name;
          }
          return row.data.identifier;
        }
      }
      return 0.0;
    },
    colSpan: (params: Table.ColSpanParams<R, M>) => {
      const row: Table.BodyRow<R> = params.data;
      if (tabling.typeguards.isGroupRow(row)) {
        /*
        Note: We have to look at all of the visible columns that are present up until
        the calculated columns.  This means we have to use the AG Grid ColumnApi (not our
        own columns).
        */
        const agColumns: Table.AgColumn[] | undefined = params.columnApi?.getAllDisplayedColumns();
        if (!isNil(agColumns)) {
          const originalCalculatedColumns = map(
            filter(params.columns, (c: Table.Column<R, M>) => c.tableColumnType === "calculated"),
            (c: Table.Column<R, M>) => tabling.columns.normalizedField(c)
          );
          const indexOfIdentifierColumn = findIndex(agColumns, (c: Table.AgColumn) => c.getColId() === "identifier");
          const indexOfFirstCalculatedColumn = findIndex(agColumns, (c: Table.AgColumn) =>
            includes(originalCalculatedColumns, c.getColId())
          );
          return indexOfFirstCalculatedColumn - indexOfIdentifierColumn;
        }
      }
      return 1;
    }
  });
};

export const EstimatedColumn = <
  R extends Tables.BudgetRowData,
  M extends Model.RowHttpModel,
  PDFM extends Model.RowHttpModel = any
>(
  props: Partial<Table.Column<R, M, number, PDFM>>
): Table.Column<R, M, number, PDFM> => {
  return tabling.columns.CalculatedColumn<R, M, PDFM>({
    ...props,
    headerName: "Estimated",
    valueGetter: (params: ValueGetterParams) => {
      if (!isNil(params.node)) {
        const row: Table.Row<R> = params.node.data;
        if (tabling.typeguards.isBodyRow(row)) {
          const rows = tabling.aggrid.getRows<R, Table.BodyRow<R>>(params.api);
          return budgeting.valueGetters.estimatedValueGetter(row, rows);
        }
      }
      return 0.0;
    }
  });
};

export const ActualColumn = <
  R extends Tables.BudgetRowData,
  M extends Model.RowHttpModel,
  PDFM extends Model.RowHttpModel = any
>(
  props: Partial<Table.Column<R, M, number, PDFM>>
): Table.Column<R, M, number, PDFM> => {
  return tabling.columns.CalculatedColumn<R, M, PDFM>({
    ...props,
    headerName: "Actual",
    valueGetter: (params: ValueGetterParams) => {
      if (!isNil(params.node)) {
        const row: Table.Row<R> = params.node.data;
        if (tabling.typeguards.isBodyRow(row)) {
          const rows = tabling.aggrid.getRows<R, Table.BodyRow<R>>(params.api);
          return budgeting.valueGetters.actualValueGetter(row, rows);
        }
      }
      return 0.0;
    }
  });
};

export const VarianceColumn = <
  R extends Tables.BudgetRowData,
  M extends Model.RowHttpModel,
  PDFM extends Model.RowHttpModel = any
>(
  props: Partial<Table.Column<R, M, number, PDFM>>
): Table.Column<R, M, number, PDFM> => {
  return tabling.columns.CalculatedColumn<R, M, PDFM>({
    ...props,
    headerName: "Variance",
    valueGetter: (params: ValueGetterParams) => {
      if (!isNil(params.node)) {
        const row: Table.Row<R> = params.node.data;
        if (tabling.typeguards.isBodyRow(row)) {
          const rows = tabling.aggrid.getRows<R, Table.BodyRow<R>>(params.api);
          return budgeting.valueGetters.varianceValueGetter(row, rows);
        }
      }
      return 0.0;
    }
  });
};
