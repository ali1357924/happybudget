import React, { useMemo, useRef, useState, useImperativeHandle } from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import { Subtract } from "utility-types";
import { map, isNil, includes, find, filter, flatten, reduce, uniq, isEqual, difference, findIndex } from "lodash";

import {
  CellKeyDownEvent,
  ProcessCellForExportParams,
  ValueSetterParams,
  SuppressKeyboardEventParams,
  CellRange,
  CellEditingStoppedEvent,
  CellValueChangedEvent,
  CellEditingStartedEvent,
  PasteEndEvent,
  PasteStartEvent,
  ProcessDataFromClipboardParams,
  CellDoubleClickedEvent,
  NavigateToNextCellParams,
  TabToNextCellParams,
  RangeSelectionChangedEvent,
  CheckboxSelectionCallbackParams,
  RowDragEvent,
  RowDataUpdatedEvent
} from "@ag-grid-community/core";
import { FillOperationParams } from "@ag-grid-community/core/dist/cjs/entities/gridOptions";

import { tabling, hooks, util } from "lib";
import { useCellNavigation, useAuthenticatedClipboard, useContextMenu, UseContextMenuParams } from "../hooks";
import makeDataGrid, { InjectedDataGridProps, DataGridProps, InternalDataGridProps } from "./makeDataGrid";

type InjectedAuthenticatedDataGridProps = InjectedDataGridProps & {
  readonly processCellForClipboard: (params: ProcessCellForExportParams) => string;
  readonly onCellDoubleClicked: (e: CellDoubleClickedEvent) => void;
  readonly processDataFromClipboard: (params: ProcessDataFromClipboardParams) => string[][];
  readonly processCellFromClipboard: (params: ProcessCellForExportParams) => Table.RawRowValue;
  readonly onCellEditingStarted: (event: CellEditingStartedEvent) => void;
  readonly onPasteStart: (event: PasteStartEvent) => void;
  readonly onPasteEnd: (event: PasteEndEvent) => void;
  readonly onCellValueChanged: (e: CellValueChangedEvent) => void;
  readonly fillOperation: (params: FillOperationParams) => boolean;
  readonly onCellKeyDown: (event: CellKeyDownEvent) => void;
  readonly navigateToNextCell: (params: NavigateToNextCellParams) => Table.CellPosition;
  readonly tabToNextCell: (params: TabToNextCellParams) => Table.CellPosition;
  readonly onRangeSelectionChanged: (e: RangeSelectionChangedEvent) => void;
  readonly onRowDragEnd: (event: RowDragEvent) => void;
  readonly onRowDragMove: (event: RowDragEvent) => void;
  readonly onRowDataUpdated: (event: RowDataUpdatedEvent) => void;
};

export type AuthenticateDataGridProps<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel
> = UseContextMenuParams<R, M> &
  DataGridProps<R, M> & {
    readonly pinFirstColumn?: boolean;
    readonly pinActionColumns?: boolean;
  };

export type InternalAuthenticateDataGridProps<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel
> = AuthenticateDataGridProps<R, M> &
  InternalDataGridProps<R, M> & {
    readonly grid: NonNullRef<Table.DataGridInstance>;
    readonly columns: Table.Column<R, M>[];
    readonly onGroupRowsAdded?: (ids: Table.GroupRowId[], rows: Table.BodyRow<R>[]) => void;
    readonly onMarkupRowsAdded?: (ids: Table.MarkupRowId[], rows: Table.BodyRow<R>[]) => void;
    readonly onModelRowsAdded?: (ids: (Table.ModelRowId | Table.PlaceholderRowId)[], rows: Table.BodyRow<R>[]) => void;
    readonly rowHasCheckboxSelection?: ((row: Table.EditableRow<R>) => boolean) | undefined;
  };

const getCellChangeForClear = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  RW extends Table.EditableRow<R> = Table.EditableRow<R>
>(
  row: RW,
  col: Table.BodyColumn<R, M>
): Table.SoloCellChange<R, RW> | null => {
  if (tabling.rows.isMarkupRow(row)) {
    if (!isNil(col.markupField)) {
      const v = row.data[col.markupField];
      if (v === undefined) {
        return null;
      }
      return {
        oldValue: v,
        newValue: col.nullValue,
        id: row.id,
        field: col.markupField
      };
    }
    return null;
  } else if (row.data[col.field] === undefined) {
    console.error(`Encountered undefined field for column ${col.field}, row ${row.id}`);
    return null;
  } else {
    if (!isEqual(row.data[col.field], col.nullValue)) {
      return {
        oldValue: row.data[col.field],
        newValue: col.nullValue,
        id: row.id,
        field: col.field as keyof RW["data"]
      };
    } else {
      return null;
    }
  }
};

const getTableChangesFromRangeClear = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  api: Table.GridApi,
  columns: Table.RealColumn<R, M>[],
  range: CellRange
): Table.SoloCellChange<R>[] => {
  const changes: Table.SoloCellChange<R>[] = [];
  if (!isNil(range.startRow) && !isNil(range.endRow)) {
    const colIds: string[] = map(range.columns, (col: Table.AgColumn) => col.getColId());
    const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
    const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
    for (let i = startRowIndex; i <= endRowIndex; i++) {
      const node: Table.RowNode | undefined = api.getDisplayedRowAtIndex(i);
      if (!isNil(node)) {
        const row: Table.BodyRow<R> = node.data;
        if (tabling.rows.isEditableRow(row)) {
          for (let j = 0; j < colIds.length; j++) {
            const column = tabling.columns.getBodyColumn(columns, colIds[j]);
            if (!isNil(column)) {
              if (tabling.columns.isEditable<R, M>(column, row)) {
                const change = getCellChangeForClear(row, column);
                if (!isNil(change)) {
                  changes.push(change);
                }
              }
            }
          }
        }
      }
    }
  }
  return changes;
};

const getCellChangesFromEvent = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  RW extends Table.EditableRow<R> = Table.EditableRow<R>
>(
  columns: Table.RealColumn<R, M>[],
  event: CellEditingStoppedEvent | CellValueChangedEvent
): Table.SoloCellChange<R, RW>[] => {
  const row: RW = event.node.data;
  if (tabling.rows.isEditableRow(row)) {
    const column = tabling.columns.getBodyColumn(columns, event.column.getColId());
    if (!isNil(column)) {
      /*
			AG Grid treats cell values as undefined when they are cleared via edit,
			so we need to translate that back into a null representation.

			Note: Converting undefined values back to the column's corresponding null
			values may now be handled by the valueSetter on the Table.Column object.
			We may be able to remove - but leave now for safety.
			*/
      const oldValue = event.oldValue === undefined ? column.nullValue : event.oldValue;
      let newValue = event.newValue === undefined ? column.nullValue : event.newValue;

      let changes: Table.SoloCellChange<R, RW>[];
      if (!isNil(column.parseIntoFields) && tabling.rows.isModelRow(row)) {
        const oldParsed = column.parseIntoFields(oldValue);
        const parsed = column.parseIntoFields(newValue);
        // The fields for the parsed values of each value should be the same.
        const fields: string[] = uniq([
          ...map(oldParsed, (p: Table.ParsedColumnField) => p.field),
          ...map(parsed, (p: Table.ParsedColumnField) => p.field)
        ]);
        changes = reduce(
          fields,
          (chs: Table.SoloCellChange<R, Table.ModelRow<R>>[], fld: keyof R) => {
            const oldParsedForField: Table.ParsedColumnField | undefined = find(oldParsed, {
              field: fld
            }) as Table.ParsedColumnField;
            const parsedForField: Table.ParsedColumnField | undefined = find(parsed, {
              field: fld
            }) as Table.ParsedColumnField;
            /* Since the fields for each set of parsed field-value pairs will
						   be the same, the null check here is mostly just a check to
							 satisfy TS. */
            if (!isNil(oldParsedForField) && !isNil(parsedForField)) {
              return [
                ...chs,
                {
                  id: row.id,
                  field: fld,
                  oldValue: oldParsedForField.value,
                  newValue: parsedForField.value
                }
              ];
            }
            return chs;
          },
          []
        ) as Table.SoloCellChange<R, RW>[];
      } else {
        /*
				The logic inside this conditional is 100% a HACK - and this type of
				programming should not be encouraged.  However, in this case, it is
				a HACK to get around AG Grid nonsense.  It appears to be a bug with
				AG Grid, but if you have data stored for a cell that is an Array of
				length 1, when you drag the cell contents to fill other cells, AG Grid
				will pass the data to the onCellValueChanged handler as only the
				first element (i.e. [4] becomes 4).  This is problematic for Fringes,
				since the cell value corresponds to a list of Fringe IDs, so we need
				to make that adjustment here.
				*/
        if (event.column.getColId() === "fringes" && !Array.isArray(newValue)) {
          newValue = [newValue];
        }
        changes = [
          {
            oldValue,
            newValue,
            field: event.column.getColId() as keyof RW["data"],
            id: event.data.id
          }
        ];
      }
      return filter(changes, (ch: Table.SoloCellChange<R, RW>) => !isEqual(ch.oldValue, ch.newValue));
    }
  }
  return [];
};

type RowState = {
  readonly markupRow: Table.MarkupRowId[];
  readonly groupRow: Table.GroupRowId[];
  readonly modelRow: (Table.ModelRowId | Table.PlaceholderRowId)[];
};

type RowStateCallback<R extends Table.RowData, ID extends Table.BodyRowId = Table.BodyRowId> = (
  api: Table.GridApi,
  diff: ID[],
  rows: Table.BodyRow<R>[]
) => void;

type RowMap<R extends Table.RowData, ID extends Table.BodyRowId = Table.BodyRowId> = {
  id: keyof RowState;
  callback: RowStateCallback<R, ID>;
};

type InferRowMapId<MP> = MP extends RowMap<infer ID> ? ID : never;

/* We have to use the Partial form of the injected props because these props
   are all optional in the <Grid> component, with the exception of the ID. */
type HOCProps = Partial<Omit<InjectedAuthenticatedDataGridProps, "id">> &
  Pick<InjectedAuthenticatedDataGridProps, "id">;

const authenticateDataGrid = <
  T extends HOCProps,
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel
>(
  Component: React.FunctionComponent<T>
): React.FunctionComponent<Subtract<T, HOCProps> & InternalAuthenticateDataGridProps<R, M>> => {
  const DG = makeDataGrid<T, R, M>(Component);

  function WithAuthenticatedDataGrid(props: Subtract<T, HOCProps> & InternalAuthenticateDataGridProps<R, M>) {
    const [processCellForClipboard, getCSVData, processCellFromClipboard, processDataFromClipboard, setCellCutChange] =
      useAuthenticatedClipboard<R, M>({
        columns: props.columns,
        apis: props.apis,
        onEvent: props.onEvent
      });
    const [cellChangeEvents, setCellChangeEvents] = useState<CellValueChangedEvent[]>([]);
    const oldRow = useRef<Table.ModelRow<R> | null>(null); // TODO: Figure out a better way to do this.
    const lastSelectionFromRange = useRef<boolean>(false);
    const rowState = useRef<RowState>({
      markupRow: [],
      groupRow: [],
      modelRow: []
    });

    /*
      Note: The behavior of the column suppression in the subsequent column
			memorization relies on the column transformations applied here - so they
			cannot be applied together as it would lead to a recursion.
      */
    const unsuppressedColumns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
      /*
        When the cell editor finishes editing, the AG Grid callback
				(onCellDoneEditing) does not have any context about what event triggered
				the completion.  This is problematic because we need to focus either the
				cell to the right (on Tab completion) or the cell below (on Enter
				completion).  To accomplish this, we use a custom hook to the Editor(s)
				that is manually called inside the Editor.
        */
      return tabling.columns.normalizeColumns(
        props.columns,
        {
          checkbox: {
            checkboxSelection: (params: CheckboxSelectionCallbackParams) => {
              const row: Table.BodyRow<R> = params.data;
              if (tabling.rows.isEditableRow(row)) {
                return isNil(props.rowHasCheckboxSelection) || props.rowHasCheckboxSelection(row);
              }
              return false;
            }
          }
        },
        {
          body: (col: Table.BodyColumn<R, M>) => ({
            editable: (params: Table.ColumnCallbackParams<R>) => {
              if (!tabling.rows.isEditableRow(params.row)) {
                return false;
              }
              return col.editable === undefined ? true : tabling.columns.isEditable<R, M>(col, params.row);
            },
            valueSetter: (params: ValueSetterParams) => {
              /* By default, AG Grid treats clearing the cell via the Backspace
								   key as setting the value to undefined - for god knows what
									 reason.  Since we do not allow values to take on undefined,
									 we need to set it to the nullValue of the column. */
              if (params.newValue === undefined || params.newValue === "") {
                params.newValue = col.nullValue;
              }
              if (!isNil(col.valueSetter) && typeof col.valueSetter === "function") {
                return col.valueSetter(params);
              }
              /* We can apply this mutation to the immutable data from the store
							   because we deep clone each row before feeding it into the AG
								 Grid tables. */
              params.data.data[params.column.getColId()] = params.newValue;
              return true;
            }
          })
        }
      );
    }, []);

    const partialColumns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
      return tabling.columns.normalizeColumns(
        unsuppressedColumns,
        {},
        {
          body: (col: Table.BodyColumn<R, M>) => ({
            suppressKeyboardEvent: (params: SuppressKeyboardEventParams) => {
              if (!isNil(col.suppressKeyboardEvent) && col.suppressKeyboardEvent(params) === true) {
                return true;
              } else if (params.editing && includes(["Tab"], params.event.code)) {
                /* Our custom cell editors have built in functionality that
									   when editing is terminated via a TAB key, we move one cell
										 to the right without continuing in edit mode.  This however
										 does not work for the bland text cells, where we do not
										 have cell editors controlling the edit behavior.  So we need
										 to suppress the TAB behavior when editing, and manually move
										 the cell over. */
                return true;
              } else if (!params.editing && includes(["Backspace", "Delete"], params.event.code)) {
                /* Suppress Backspace/Delete events when multiple cells are
                     selected in a range. */
                const ranges = params.api.getCellRanges();
                if (
                  !isNil(ranges) &&
                  ranges.length !== 0 &&
                  (ranges.length !== 1 || !tabling.aggrid.rangeSelectionIsSingleCell(ranges[0]))
                ) {
                  const changes: Table.SoloCellChange<R>[] = flatten(
                    map(ranges, (rng: CellRange) =>
                      getTableChangesFromRangeClear(
                        params.api,
                        tabling.columns.filterRealColumns(unsuppressedColumns),
                        rng
                      )
                    )
                  );
                  if (changes.length !== 0) {
                    props.onEvent({
                      type: "dataChange",
                      payload: tabling.events.consolidateCellChanges(changes)
                    });
                  }
                  return true;
                } else {
                  /*
										For custom Cell Editor(s) with a Pop-Up, we do not want
									  Backspace/Delete to go into edit mode but instead want to
										clear the values of the cells - so we prevent those key
										presses from triggering edit mode in the Cell Editor and
										clear the value at this level. */
                  const row: Table.BodyRow<R> = params.node.data;
                  if (tabling.rows.isEditableRow(row) && col.cellEditorPopup === true) {
                    const change = getCellChangeForClear(row, col);
                    if (!isNil(change)) {
                      props.onEvent({
                        type: "dataChange",
                        payload: tabling.events.cellChangeToRowChange(change)
                      });
                    }
                    return true;
                  }
                  return false;
                }
              } else if (
                /* We need to suppress CMD + Arrow KeyboardEvent(s) because this
                   is how we navigate through the nested/sibling tables in the
                   BudgetTable case. */
                includes(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"], params.event.key) &&
                (params.event.ctrlKey || params.event.metaKey)
              ) {
                return true;
              }
              return false;
            }
          })
        }
      );
    }, []);

    const [navigateToNextCell, tabToNextCell, moveToNextColumn, moveToNextRow] = useCellNavigation<R, M>({
      apis: props.apis,
      columns: partialColumns,
      onNewRowRequired: (newRowIndex: number) => {
        const gridApi: Table.GridApi | undefined = props.apis?.grid;
        if (!isNil(gridApi)) {
          props.onEvent({
            type: "rowAdd",
            placeholderIds: [tabling.rows.placeholderRowId()],
            payload: { newIndex: newRowIndex }
          });
        }
      }
    });

    const onDoneEditing = hooks.useDynamicCallback((e: Table.CellDoneEditingEvent) => {
      if (tabling.events.isKeyboardEvent(e)) {
        const focusedCell = props.apis?.grid.getFocusedCell();
        if (!isNil(focusedCell) && !isNil(focusedCell.rowIndex)) {
          if (e.code === "Enter") {
            moveToNextRow({ rowIndex: focusedCell.rowIndex, column: focusedCell.column });
          } else if (e.code === "Tab") {
            moveToNextColumn({ rowIndex: focusedCell.rowIndex, column: focusedCell.column });
          }
        }
      }
    });

    const columns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
      return tabling.columns.normalizeColumns(
        partialColumns,
        {},
        {
          body: (col: Table.BodyColumn<R, M>) => ({
            cellEditorParams: { ...col.cellEditorParams, onDoneEditing }
          })
        }
      );
    }, []);

    const [getContextMenuItems] = useContextMenu<R, M>(props);

    const onCellSpaceKey = useMemo(
      () => (event: CellKeyDownEvent) => {
        if (!isNil(event.rowIndex)) {
          event.api.startEditingCell({
            rowIndex: event.rowIndex,
            colKey: event.column.getColId(),
            charPress: " "
          });
        }
      },
      []
    );

    const onCellCut: (e: CellKeyDownEvent, local: Table.GridApi) => void = hooks.useDynamicCallback(
      (e: CellKeyDownEvent, local: Table.GridApi) => {
        const focusedCell = local.getFocusedCell();
        if (!isNil(focusedCell)) {
          const node = local.getDisplayedRowAtIndex(focusedCell.rowIndex);
          if (!isNil(node)) {
            const row: Table.BodyRow<R> = node.data;
            if (tabling.rows.isEditableRow(row)) {
              const c = tabling.columns.getBodyColumn(columns, focusedCell.column.getColId());
              if (!isNil(c)) {
                const change = getCellChangeForClear(row, c);
                local.flashCells({ columns: [focusedCell.column], rowNodes: [node] });
                if (!isNil(change)) {
                  setCellCutChange(change);
                }
              }
            }
          }
        }
      }
    );

    const onCellKeyDown: (event: CellKeyDownEvent) => void = hooks.useDynamicCallback((event: CellKeyDownEvent) => {
      if (!isNil(event.event)) {
        /* AG Grid only enters Edit mode in a cell when a character is pressed,
						 not the Space key - so we have to do that manually here. */
        const ev = event.event as KeyboardEvent; // AG Grid's Event Object is Wrong
        if (ev.code === "Space") {
          onCellSpaceKey(event);
        } else if (ev.key === "x" && (ev.ctrlKey || ev.metaKey)) {
          onCellCut(event, event.api);
        } else if (ev.code === "Enter" && !isNil(event.rowIndex)) {
          /* If Enter is clicked inside the cell popout, this doesn't get
               triggered. */
          const editing = event.api.getEditingCells();
          if (editing.length === 0) {
            moveToNextRow({ rowIndex: event.rowIndex, column: event.column });
          }
        } else if (ev.code === "Tab" && !isNil(event.rowIndex)) {
          moveToNextColumn({ rowIndex: event.rowIndex, column: event.column });
        }
      }
    });

    const onPasteStart: (event: PasteStartEvent) => void = hooks.useDynamicCallback(() => {
      setCellChangeEvents([]);
    });

    const onPasteEnd: (event: PasteEndEvent) => void = hooks.useDynamicCallback(() => {
      const changes: Table.SoloCellChange<R>[] = reduce(
        cellChangeEvents,
        (curr: Table.SoloCellChange<R>[], e: CellValueChangedEvent) => [
          ...curr,
          ...getCellChangesFromEvent(tabling.columns.filterRealColumns(columns), e)
        ],
        []
      );
      if (changes.length !== 0) {
        props.onEvent({
          type: "dataChange",
          payload: tabling.events.consolidateCellChanges(changes)
        });
      }
    });

    const onCellValueChanged: (e: CellValueChangedEvent) => void = hooks.useDynamicCallback(
      (e: CellValueChangedEvent) => {
        const row: Table.BodyRow<R> = e.node.data;
        /* Note: If this is a placeholder row, the data will not persist.
						 This is because the row is not yet persisted in the backend
						 database.  While this is an EDGE case, because the placeholder rows
						 only exist for a very short period of time, these scenarios need to
						 be more concretely established. */
        if (tabling.rows.isEditableRow(row)) {
          if (e.source === "paste") {
            setCellChangeEvents([...cellChangeEvents, e]);
          } else {
            const changes = getCellChangesFromEvent(tabling.columns.filterRealColumns(columns), e);
            if (changes.length !== 0) {
              props.onEvent({ type: "dataChange", payload: tabling.events.consolidateCellChanges(changes) });
              const expandConfig = !isNil(props.editColumnConfig)
                ? tabling.columns.getEditColumnRowConfig(props.editColumnConfig, row, "expand")
                : null;
              if (!isNil(expandConfig)) {
                const col = props.apis?.column.getColumn("edit");
                if (!isNil(col) && isNil(oldRow.current)) {
                  props.apis?.grid.refreshCells({ force: true, rowNodes: [e.node], columns: [col] });
                }
              }
            }
          }
        }
      }
    );

    const onCellEditingStarted = hooks.useDynamicCallback((event: CellEditingStartedEvent) => {
      const row: Table.BodyRow<R> = event.node.data;
      if (tabling.rows.isModelRow(row)) {
        oldRow.current = row;
      }
    });

    const onCellDoubleClicked = hooks.useDynamicCallback((e: CellDoubleClickedEvent) => {
      const row: Table.BodyRow<R> = e.data;
      if (tabling.rows.isModelRow(row)) {
        const c = tabling.columns.getBodyColumn(columns, e.column.getColId());
        if (!isNil(c)) {
          c.onCellDoubleClicked?.(row);
        }
      }
    });

    const onRangeSelectionChanged = hooks.useDynamicCallback((e: RangeSelectionChangedEvent) => {
      const ranges = e.api.getCellRanges();

      const indices: [number | null, number | null] = tabling.aggrid.collapseRangeSelectionVertically(ranges || []);
      if (indices[0] !== null && indices[1] !== null && indices[0] !== indices[1]) {
        e.api.forEachNode((node: Table.RowNode) => {
          const row: Table.Row<R> = node.data;
          if (
            !isNil(node.rowIndex) &&
            tabling.rows.isEditableRow(row) &&
            (isNil(props.rowHasCheckboxSelection) || props.rowHasCheckboxSelection(row))
          ) {
            lastSelectionFromRange.current = true;
            if (node.rowIndex >= (indices[0] as number) && node.rowIndex <= (indices[1] as number)) {
              node.setSelected(true);
            } else {
              node.setSelected(false);
            }
          }
        });
      } else if (indices[0] === indices[1] && lastSelectionFromRange.current === true) {
        lastSelectionFromRange.current = false;
        e.api.forEachNode((node: Table.RowNode) => {
          node.setSelected(false);
        });
      }
    });

    const onRowDragEnd = hooks.useDynamicCallback((e: RowDragEvent) => {
      const row: Table.ModelRow<R> = e.node.data;
      const rows: Table.BodyRow<R>[] = tabling.aggrid.getRows(e.api);
      let groupRow: Table.GroupRow<R> | null = null;
      let foundMovedRow = false;
      let previous: Table.ModelRow<R> | null = null;

      for (let i = 0; i < rows.length; i++) {
        const iteratedRow: Table.BodyRow<R> = rows[i];
        if (tabling.rows.isModelRow(iteratedRow)) {
          if (iteratedRow.id === row.id) {
            foundMovedRow = true;
          } else if (foundMovedRow === false) {
            previous = iteratedRow;
          }
        } else if (tabling.rows.isGroupRow(iteratedRow)) {
          /* If we previously found the ModelRow that was moved, and we hit
               a GroupRow, then that means that the GroupRow is the first GroupRow
               underneath that ModelRow - which means that the ModelRow should now
               belong to that GroupRow. */
          if (foundMovedRow) {
            groupRow = iteratedRow;
            break;
          }
        }
      }
      props.onEvent({
        type: "rowPositionChanged",
        payload: {
          previous: !isNil(previous) ? previous.id : null,
          id: row.id,
          newGroup: !isNil(groupRow) ? groupRow.id : null
        }
      });
    });

    const onRowDragMove = hooks.useDynamicCallback((e: RowDragEvent) => {
      const moveInArray = (arr: Table.BodyRow<R>[], row: Table.ModelRow<R>, index: number) => {
        const removed = filter(arr.slice(), (r: Table.BodyRow<R>) => r.id !== row.id);
        return [...removed.slice(0, index), row, ...removed.slice(index)];
      };

      const rows: Table.BodyRow<R>[] = tabling.aggrid.getRows(e.api);
      const movingRow: Table.ModelRow<R> = e.node.data;

      /* Accessing the `overNode` property on RowDragEvent does not give the
           "true" `overNode` because it does not take into consideration where
           you might have scrolled to in the table.  The `overIndex` also does
           not take into account scrolling.  In order to determine where we are
           in the table, we need to calculate how many rows are off the viewport
           by calculating the scroll position of the viewport and the height of
           the rows in the viewport. */
      const viewports = document.getElementsByClassName("ag-body-viewport");
      if (viewports.length !== 0) {
        const rowElements = document.getElementsByClassName("ag-row row row--data");
        if (rowElements.length !== 0) {
          /* At this point, I do not fully understand why clientHeight seems
						   to be returning 0 in some cases (particularly for the Contacts
							 table).  So, in the case that it does we have to try a fallback
							 option to get the row height. */
          let rowHeight: number | null = null;
          if (rowElements[0].clientHeight !== 0) {
            rowHeight = rowElements[0].clientHeight;
          } else {
            const style: string | null = rowElements[0].getAttribute("style");
            if (!isNil(style)) {
              const styleObj = util.html.parseStyleString(style);
              if (!isNil(styleObj.height) && String(styleObj.height).endsWith("px")) {
                const height = parseInt(String(styleObj.height).split("px")[0]);
                if (!isNaN(height)) {
                  rowHeight = height;
                }
              }
            }
          }
          if (!isNil(rowHeight)) {
            const numHiddenRows = Math.floor(viewports[0].scrollTop / rowHeight);
            const overRow: Table.BodyRow<R> = rows[e.overIndex + numHiddenRows];
            if (
              !isNil(overRow) &&
              overRow.id !== movingRow.id &&
              (tabling.rows.isModelRow(overRow) || tabling.rows.isGroupRow(overRow))
            ) {
              const store: Table.BodyRow<R>[] = moveInArray(rows, movingRow, e.overIndex + numHiddenRows);
              e.api.setRowData(store);
              e.api.clearFocusedCell();
            }
          } else {
            console.warn("Could not determine row height from DOM, reordering rows will not function properly.");
          }
        }
      }
    });

    useImperativeHandle(props.grid, () => ({
      getCSVData
    }));

    const fillOperation = hooks.useDynamicCallback((params: FillOperationParams) => {
      const inferredValue = tabling.rows.inferFillCellValue(params, tabling.columns.filterBodyColumns(columns));
      if (!isNil(inferredValue)) {
        return inferredValue;
      }
      if (params.initialValues.length === 1) {
        return false;
      }
      /* eslint-disable-next-line  @typescript-eslint/no-unsafe-return */
      return params.initialValues[(params.values.length - params.initialValues.length) % params.initialValues.length];
    });

    const onMarkupRowsAdded = useMemo(
      () => (api: Table.GridApi, diff: Table.MarkupRowId[], rows: Table.BodyRow<R>[]) => {
        props.onMarkupRowsAdded?.(diff, rows);
      },
      [props.onMarkupRowsAdded]
    );

    const onGroupRowsAdded = useMemo(
      () => (api: Table.GridApi, diff: Table.GroupRowId[], rows: Table.BodyRow<R>[]) => {
        props.onGroupRowsAdded?.(diff, rows);
      },
      [props.onGroupRowsAdded]
    );

    const onModelRowsAdded = useMemo(
      () => (api: Table.GridApi, diff: (Table.ModelRowId | Table.PlaceholderRowId)[], rows: Table.BodyRow<R>[]) => {
        /* Find the row index of the newly added ModelRow in the set of
						 only the existing ModelRow(s) and PlaceholderRow(s) in the table. */
        const modelAndPlaceholderRows: Table.DataRow<R>[] = filter(rows, (r: Table.BodyRow<R>) =>
          tabling.rows.isDataRow(r)
        ) as Table.DataRow<R>[];
        const modelRowModelIndex = findIndex(modelAndPlaceholderRows, (r: Table.DataRow<R>) => r.id === diff[0]);

        /* Scroll the table to the bottom in the case that rows have been
             added to the end of the table. */
        if (modelRowModelIndex === modelAndPlaceholderRows.length - 1) {
          api.ensureIndexVisible(modelAndPlaceholderRows.length - 1, "bottom");
        }
        /*
					The diff will always be one, even if adding new rows one-by-one at an
					extremely quick rate, unless we are bulk pasting information
					into the table and the bulk paste operation requires the addition of
					several rows.  In the case that multiple rows are being added from a
					paste operation, we do not want to refocus the index of the table to
					the row at the bottom.
					*/
        if (diff.length === 1) {
          /* Find the row index of the newly added ModelRow in the set of all
               rows in the table. */
          const modelRowIndex = findIndex(rows, (r: Table.BodyRow<R>) => tabling.rows.isDataRow(r) && r.id === diff[0]);
          if (modelRowIndex !== -1) {
            const focusedCell = api.getFocusedCell();
            /* Only refocus the row to the newly created row if there is already
                 a focused cell in the table. */
            if (!isNil(focusedCell) && !isNil(focusedCell.rowIndex) && rows[focusedCell.rowIndex + 1] !== undefined) {
              /*
								The intended logic here is to refocus the cell to the newly added
								ModelRow if we were previously on the last ModelRow in the table
								(i.e. at the bottom of the table, before the MarkupRow(s)). This
								logic has to account for the timing with the fact that the
								`focusedCell` `rowIndex` is relative to the table rows before the
								ModelRow was added, whereas the `modelRowIndex` is relative to the
								table rows after the ModelRow was added.

								When we are on the last ModelRow in the table, before any
								potential MarkupRow(s), the `modelRowIndex` is greater than the
								`rowIndex` of the `focusedCell`.

								If the `rowIndex` of the `focusedCell` is greater than or equal
								to the `modelRowIndex`, this means we are in a MarkupRow
								underneath the newly added ModelRow - and we do not want to
								change the row we are focused on.

								In order to not change the row we are focused on, we actually need
								to move the focused cell down 1 row, as this index will account
								for the fact that the `focusedCell`'s `rowIndex` is relative to
								the new row not being in the table yet.
								*/
              if (modelRowIndex > focusedCell.rowIndex) {
                api.setFocusedCell(modelRowIndex, focusedCell.column);
                api.clearRangeSelection();
              } else {
                api.setFocusedCell(focusedCell.rowIndex + 1, focusedCell.column);
                api.clearRangeSelection();
              }
            }
          } else {
            console.warn(
              `Model row ${diff[0]} was added to the table, but it does not
								appear to be in the set of rows returned from the Grid Api.`
            );
          }
        }
        props.onModelRowsAdded?.(diff, rows);
      },
      [props.onModelRowsAdded]
    );

    const onRowDataUpdated = hooks.useDynamicCallback((e: RowDataUpdatedEvent) => {
      const rows: Table.BodyRow<R>[] = tabling.aggrid.getRows(e.api);
      const newRowState: RowState = {
        groupRow: map(
          filter(rows, (r: Table.BodyRow<R>) => tabling.rows.isGroupRow(r)) as Table.GroupRow<R>[],
          (g: Table.GroupRow<R>) => g.id
        ),
        modelRow: map(
          filter(rows, (r: Table.BodyRow<R>) => tabling.rows.isModelRow(r) || tabling.rows.isPlaceholderRow(r)) as (
            | Table.ModelRow<R>
            | Table.PlaceholderRow<R>
          )[],
          (g: Table.ModelRow<R> | Table.PlaceholderRow<R>) => g.id
        ),
        markupRow: map(
          filter(rows, (r: Table.BodyRow<R>) => tabling.rows.isMarkupRow(r)) as Table.MarkupRow<R>[],
          (g: Table.MarkupRow<R>) => g.id
        )
      };

      const Mapping: [
        RowMap<R, Table.GroupRowId>,
        RowMap<R, Table.ModelRowId | Table.PlaceholderRowId>,
        RowMap<R, Table.MarkupRowId>
      ] = [
        { id: "groupRow", callback: onGroupRowsAdded },
        { id: "modelRow", callback: onModelRowsAdded },
        { id: "markupRow", callback: onMarkupRowsAdded }
      ];

      for (let i = 0; i < Mapping.length; i++) {
        const mp = Mapping[i];
        type IDType = InferRowMapId<typeof mp>;
        const cb = mp.callback as RowStateCallback<R, IDType>;
        if (newRowState[mp.id].length > rowState.current[mp.id].length) {
          const diff = difference(newRowState[mp.id] as IDType[], rowState.current[mp.id] as IDType[]);
          cb(e.api, diff, rows);
        }
      }
      rowState.current = newRowState;
    });

    const undoKeyListeners = hooks.useDynamicCallback((localApi: Table.GridApi, e: KeyboardEvent) => {
      const ctrlCmdPressed = e.ctrlKey || e.metaKey;
      if (e.key === "z" && ctrlCmdPressed && !e.shiftKey) {
        e.preventDefault();
        props.onEvent({ type: "reverse", payload: null });
      }
    });

    const redoKeyListeners = hooks.useDynamicCallback((localApi: Table.GridApi, e: KeyboardEvent) => {
      const ctrlCmdPressed = e.ctrlKey || e.metaKey;
      if (e.key === "z" && ctrlCmdPressed && e.shiftKey) {
        e.preventDefault();
        props.onEvent({ type: "forward", payload: null });
      }
    });

    return (
      <DG
        {...(props as T & InternalAuthenticateDataGridProps<R, M>)}
        columns={columns}
        keyListeners={[undoKeyListeners, redoKeyListeners]}
        onRowDataUpdated={onRowDataUpdated}
        getCSVData={getCSVData}
        onCellKeyDown={onCellKeyDown}
        onCellCut={onCellCut}
        onCellSpaceKey={onCellSpaceKey}
        moveToNextRow={moveToNextRow}
        onCellDoubleClicked={onCellDoubleClicked}
        processDataFromClipboard={processDataFromClipboard}
        processCellFromClipboard={processCellFromClipboard}
        processCellForClipboard={processCellForClipboard}
        onCellEditingStarted={onCellEditingStarted}
        onPasteStart={onPasteStart}
        onPasteEnd={onPasteEnd}
        onCellValueChanged={onCellValueChanged}
        navigateToNextCell={navigateToNextCell}
        tabToNextCell={tabToNextCell}
        onRangeSelectionChanged={onRangeSelectionChanged}
        fillOperation={fillOperation}
        getContextMenuItems={getContextMenuItems}
        onRowDragEnd={onRowDragEnd}
        onRowDragMove={onRowDragMove}
      />
    );
  }
  return hoistNonReactStatics(WithAuthenticatedDataGrid, React.memo(Component));
};

export default authenticateDataGrid;
