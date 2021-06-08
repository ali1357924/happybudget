import { useMemo } from "react";
import { isNil, reduce } from "lodash";

import { GridReadyEvent, FirstDataRenderedEvent } from "@ag-grid-community/core";

import { useDynamicCallback, useDeepEqualMemo } from "lib/hooks";
import { hashString } from "lib/util";

import { TableFooterGridProps, CustomColDef } from "../model";
import Grid from "./Grid";

const TableFooterGrid = <R extends Table.Row<G>, G extends Model.Group = Model.Group>({
  identifierField,
  identifierValue,
  options,
  columns,
  colDefs,
  sizeColumnsToFit,
  setColumnApi
}: TableFooterGridProps<R, G>): JSX.Element => {
  const rowData = useMemo((): R | null => {
    // TODO: Loop over the colDef's after we attribute the Base Columns with isBase = true, so
    // we can weed those out here.
    return reduce(
      columns,
      (obj: { [key: string]: any }, col: CustomColDef<R, G>) => {
        if (!isNil(col.field)) {
          if (col.isCalculated === true) {
            if (!isNil(col.tableTotal)) {
              obj[col.field] = col.tableTotal;
            } else {
              obj[col.field] = null;
            }
          } else {
            obj[col.field] = null;
          }
        }
        return obj;
      },
      {
        id: hashString("tablefooter"),
        [identifierField]: identifierValue,
        meta: {
          isPlaceholder: false,
          isGroupFooter: false,
          isTableFooter: true,
          isBudgetFooter: false,
          selected: false,
          children: [],
          errors: []
        }
      }
    ) as R;
  }, [useDeepEqualMemo(columns), identifierValue]);

  const onFirstDataRendered = useDynamicCallback((event: FirstDataRenderedEvent): void => {
    if (sizeColumnsToFit === true) {
      event.api.sizeColumnsToFit();
    }
  });

  const onGridReady = useDynamicCallback((event: GridReadyEvent): void => {
    setColumnApi(event.columnApi);
  });

  return (
    <div className={"table-footer-grid"}>
      <Grid
        {...options}
        columnDefs={colDefs}
        rowData={[rowData]}
        rowHeight={38}
        rowClass={"row--table-footer"}
        suppressRowClickSelection={true}
        onGridReady={onGridReady}
        onFirstDataRendered={onFirstDataRendered}
        headerHeight={0}
      />
    </div>
  );
};

export default TableFooterGrid;
