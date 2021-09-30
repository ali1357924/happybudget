import { useMemo } from "react";
import { map, isNil, includes, find, filter } from "lodash";

import { tabling, hooks, util } from "lib";

export type UseContextMenuParams<R extends Table.RowData> = {
  readonly apis: Table.GridApis | null;
  readonly data: Table.BodyRow<R>[];
  readonly getModelRowLabel?: Table.RowStringGetter<Table.ModelRow<R>>;
  readonly getModelRowName?: Table.RowStringGetter<Table.ModelRow<R>>;
  readonly getGroupRowLabel?: Table.RowStringGetter<Table.GroupRow<R>>;
  readonly getGroupRowName?: Table.RowStringGetter<Table.GroupRow<R>>;
  readonly getPlaceholderRowLabel?: Table.RowStringGetter<Table.PlaceholderRow<R>>;
  readonly getPlaceholderRowName?: Table.RowStringGetter<Table.PlaceholderRow<R>>;
  readonly getMarkupRowLabel?: Table.RowStringGetter<Table.MarkupRow<R>>;
  readonly getMarkupRowName?: Table.RowStringGetter<Table.MarkupRow<R>>;
  readonly onChangeEvent: (event: Table.ChangeEvent<R>) => void;
  readonly getGroupRowContextMenuItems?: (row: Table.GroupRow<R>, node: Table.RowNode) => Table.MenuItemDef[];
  readonly getModelRowContextMenuItems?: (row: Table.ModelRow<R>, node: Table.RowNode) => Table.MenuItemDef[];
  readonly getMarkupRowContextMenuItems?: (row: Table.MarkupRow<R>, node: Table.RowNode) => Table.MenuItemDef[];
  readonly rowCanDelete?: (row: Table.ModelRow<R> | Table.MarkupRow<R>) => boolean;
  readonly onGroupRows?: (rows: Table.ModelRow<R>[]) => void;
  readonly onMarkupRows?: (rows: Table.ModelRow<R>[]) => void;
};

const evaluateRowStringGetter = <R extends Table.BodyRow>(
  value: Table.RowStringGetter<R> | undefined,
  row: R
): Table.RowNameLabelType | undefined => (typeof value === "function" ? value(row) : value);

/* eslint-disable indent */
const useContextMenu = <R extends Table.RowData>(
  params: UseContextMenuParams<R>
): [(row: Table.BodyRow<R>, node: Table.RowNode) => Table.MenuItemDef[]] => {
  const getRowName = useMemo(
    () => (row: Table.BodyRow<R>) => {
      if (tabling.typeguards.isModelRow(row)) {
        return evaluateRowStringGetter(params.getModelRowName, row);
      } else if (tabling.typeguards.isMarkupRow(row)) {
        return evaluateRowStringGetter(params.getMarkupRowName, row);
      } else if (tabling.typeguards.isPlaceholderRow(row)) {
        return evaluateRowStringGetter(params.getPlaceholderRowName, row);
      } else if (tabling.typeguards.isGroupRow(row)) {
        return evaluateRowStringGetter(params.getGroupRowName, row);
      }
      return undefined;
    },
    [params.getModelRowName, params.getMarkupRowName, params.getPlaceholderRowName, params.getGroupRowName]
  );

  const getRowLabel = useMemo(
    () => (row: Table.BodyRow<R>) => {
      if (tabling.typeguards.isModelRow(row)) {
        return evaluateRowStringGetter(params.getModelRowLabel, row);
      } else if (tabling.typeguards.isMarkupRow(row)) {
        return evaluateRowStringGetter(params.getMarkupRowLabel, row);
      } else if (tabling.typeguards.isPlaceholderRow(row)) {
        return evaluateRowStringGetter(params.getPlaceholderRowLabel, row);
      } else if (tabling.typeguards.isGroupRow(row)) {
        return evaluateRowStringGetter(params.getGroupRowLabel, row);
      }
      return undefined;
    },
    [params.getModelRowLabel, params.getMarkupRowLabel, params.getPlaceholderRowLabel, params.getGroupRowLabel]
  );

  const getFullRowName = useMemo(
    () => (row: Table.BodyRow<R>) => {
      return util.conditionalJoinString(getRowLabel(row), getRowName(row), { replaceMissing: "Row" });
    },
    [getRowLabel, getRowName]
  );

  const findGroupableRowsAbove = hooks.useDynamicCallback((node: Table.RowNode): Table.ModelRow<R>[] => {
    const firstRow: Table.BodyRow<R> = node.data;
    if (tabling.typeguards.isModelRow(firstRow)) {
      const rows: Table.ModelRow<R>[] = [firstRow];
      if (!isNil(params.apis)) {
        let currentNode: Table.RowNode | undefined = node;
        while (!isNil(currentNode) && !isNil(currentNode.rowIndex) && currentNode.rowIndex >= 1) {
          currentNode = params.apis.grid.getDisplayedRowAtIndex(currentNode.rowIndex - 1);
          if (!isNil(currentNode)) {
            const row: Table.BodyRow<R> = currentNode.data;
            if (tabling.typeguards.isGroupRow(row)) {
              break;
            } else if (tabling.typeguards.isModelRow(row)) {
              rows.push(row);
            }
          }
        }
      }
      return rows;
    }
    return [];
  });

  const findMarkupableRowsAbove = hooks.useDynamicCallback((node: Table.RowNode): Table.ModelRow<R>[] => {
    const firstRow: Table.BodyRow<R> = node.data;
    if (tabling.typeguards.isModelRow(firstRow)) {
      const rows: Table.ModelRow<R>[] = [firstRow];
      if (!isNil(params.apis)) {
        let currentNode: Table.RowNode | undefined = node;
        while (!isNil(currentNode) && !isNil(currentNode.rowIndex) && currentNode.rowIndex >= 1) {
          currentNode = params.apis.grid.getDisplayedRowAtIndex(currentNode.rowIndex - 1);
          if (!isNil(currentNode)) {
            const row: Table.BodyRow<R> = currentNode.data;
            if (tabling.typeguards.isModelRow(row)) {
              rows.push(row);
            }
          }
        }
      }
      return rows;
    }
    return [];
  });

  const getModelRowGroupContextMenuItems: (row: Table.ModelRow<R>, node: Table.RowNode) => Table.MenuItemDef[] =
    hooks.useDynamicCallback((row: Table.ModelRow<R>, node: Table.RowNode): Table.MenuItemDef[] => {
      let contextMenuItems: Table.MenuItemDef[] = [];

      const onGroupRows = params.onGroupRows;
      if (!isNil(onGroupRows)) {
        const groupRows: Table.GroupRow<R>[] = filter(params.data, (r: Table.BodyRow<R>) =>
          tabling.typeguards.isGroupRow(r)
        ) as Table.GroupRow<R>[];

        // The GroupRow that the ModelRow already potentially belongs to.
        const groupRow: Table.GroupRow<R> | undefined = find(groupRows, (r: Table.GroupRow<R>) =>
          includes(r.children, row.id)
        );
        if (!isNil(groupRow)) {
          contextMenuItems = [
            ...contextMenuItems,
            {
              name: `Remove ${getRowLabel(row) || "Row"} from Group ${getRowName(groupRow) || groupRow.groupData.name}`,
              action: () =>
                params.onChangeEvent({
                  type: "rowRemoveFromGroup",
                  payload: { rows: [row.id], group: groupRow.id }
                })
            }
          ];
        } else {
          const groupableRowsAbove = findGroupableRowsAbove(node);
          if (groupableRowsAbove.length !== 0) {
            let label: string;
            if (groupableRowsAbove.length === 1) {
              label = `Group ${getFullRowName(groupableRowsAbove[0])}`;
            } else {
              label = `Group ${getRowLabel(row) || "Row"}s Above`;
              const lastRow: Table.ModelRow<R> | Table.MarkupRow<R> | undefined =
                groupableRowsAbove[groupableRowsAbove.length - 1];
              if (!isNil(lastRow)) {
                const endpoints = [getRowName(row), getRowName(lastRow)];
                if (!(endpoints[0] === undefined && endpoints[1] === undefined)) {
                  label = `Group ${getRowLabel(row) || "Row"}s ${util.conditionalJoinString(
                    endpoints[1],
                    endpoints[0],
                    {
                      delimeter: " - ",
                      replaceMissing: ""
                    }
                  )}`;
                }
              }
            }
            contextMenuItems = [
              ...contextMenuItems,
              {
                name: label,
                action: () => onGroupRows(groupableRowsAbove)
              }
            ];
          }
          if (groupRows.length !== 0) {
            contextMenuItems = [
              ...contextMenuItems,
              {
                name: "Add to Group",
                subMenu: map(groupRows, (gr: Table.GroupRow<R>) => ({
                  name: `${getRowName(gr) || gr.groupData.name}`,
                  action: () =>
                    params.onChangeEvent({
                      type: "rowAddToGroup",
                      payload: { rows: [row.id], group: gr.id }
                    })
                }))
              }
            ];
          }
        }
      }
      return contextMenuItems;
    });

  const getModelRowMarkupContextMenuItems: (row: Table.ModelRow<R>, node: Table.RowNode) => Table.MenuItemDef[] =
    hooks.useDynamicCallback((row: Table.ModelRow<R>, node: Table.RowNode): Table.MenuItemDef[] => {
      let contextMenuItems: Table.MenuItemDef[] = [];
      const onMarkupRows = params.onMarkupRows;
      if (!isNil(onMarkupRows)) {
        const markupableRowsAbove: Table.ModelRow<R>[] = findMarkupableRowsAbove(node);
        if (markupableRowsAbove.length !== 0) {
          contextMenuItems = [
            ...contextMenuItems,
            {
              name: "Insert Markup",
              action: () => onMarkupRows(markupableRowsAbove)
            }
          ];
        }
      }
      return contextMenuItems;
    });

  const getMarkupRowContextMenuItems: (row: Table.MarkupRow<R>, node: Table.RowNode) => Table.MenuItemDef[] =
    hooks.useDynamicCallback((row: Table.MarkupRow<R>, node: Table.RowNode): Table.MenuItemDef[] => {
      let contextMenuItems: Table.MenuItemDef[] = !isNil(params.getMarkupRowContextMenuItems)
        ? params.getMarkupRowContextMenuItems(row, node)
        : [];
      if (isNil(params.rowCanDelete) || params.rowCanDelete(row) === true) {
        contextMenuItems = [
          ...contextMenuItems,
          {
            name: `Delete ${getRowLabel(row)}`,
            action: () => params.onChangeEvent({ payload: { rows: row.id }, type: "rowDelete" })
          }
        ];
      }
      return contextMenuItems;
    });

  const getModelRowContextMenuItems: (row: Table.ModelRow<R>, node: Table.RowNode) => Table.MenuItemDef[] =
    hooks.useDynamicCallback((row: Table.ModelRow<R>, node: Table.RowNode): Table.MenuItemDef[] => {
      let contextMenuItems: Table.MenuItemDef[] = !isNil(params.getModelRowContextMenuItems)
        ? params.getModelRowContextMenuItems(row, node)
        : [];
      if (isNil(params.rowCanDelete) || params.rowCanDelete(row) === true) {
        contextMenuItems = [
          ...contextMenuItems,
          {
            name: `Delete ${getRowLabel(row)}`,
            action: () => params.onChangeEvent({ payload: { rows: row.id }, type: "rowDelete" })
          }
        ];
      }
      return [
        ...contextMenuItems,
        ...getModelRowGroupContextMenuItems(row, node),
        ...getModelRowMarkupContextMenuItems(row, node)
      ];
    });

  const getGroupRowContextMenuItems: (row: Table.GroupRow<R>, node: Table.RowNode) => Table.MenuItemDef[] =
    hooks.useDynamicCallback((row: Table.GroupRow<R>, node: Table.RowNode): Table.MenuItemDef[] => {
      return [
        ...(!isNil(params.getGroupRowContextMenuItems) ? params.getGroupRowContextMenuItems(row, node) : []),
        {
          name: `Ungroup ${getRowName(row) || row.groupData.name}`,
          action: () =>
            params.onChangeEvent({
              type: "rowDelete",
              payload: { rows: row.id }
            })
        }
      ];
    });

  const getContextMenuItems: (row: Table.BodyRow<R>, node: Table.RowNode) => Table.MenuItemDef[] =
    hooks.useDynamicCallback((row: Table.BodyRow<R>, node: Table.RowNode): Table.MenuItemDef[] => {
      if (tabling.typeguards.isModelRow(row)) {
        return getModelRowContextMenuItems(row, node);
      } else if (tabling.typeguards.isGroupRow(row)) {
        return getGroupRowContextMenuItems(row, node);
      } else if (tabling.typeguards.isMarkupRow(row)) {
        return getMarkupRowContextMenuItems(row, node);
      }
      return [];
    });

  return [getContextMenuItems];
};

export default useContextMenu;
