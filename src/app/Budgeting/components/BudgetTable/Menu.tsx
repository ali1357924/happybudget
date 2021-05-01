import { isNil, map } from "lodash";
import classNames from "classnames";

import { Input, Checkbox, Tooltip } from "antd";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import { SearchOutlined } from "@ant-design/icons";

import { ColDef } from "@ag-grid-community/core";

import { SavingChanges, ShowHide } from "components";
import { IconButton } from "components/buttons";
import { FieldsDropdown } from "components/dropdowns";
import { FieldMenuField } from "components/menus/FieldsMenu";
import { PortalOrRender } from "components/layout";
import { BudgetTableMenuProps, BudgetTableMenuAction } from "./model";

const BudgetTableMenu = <R extends Table.Row<G>, G extends Model.Group = Model.Group>({
  actions,
  search,
  selected = false,
  saving = false,
  canSearch = true,
  canExport = true,
  canToggleColumns = true,
  detached = false,
  columns,
  selectedRows,
  onSearch,
  onDelete,
  onSelectAll,
  onColumnsChange,
  onExport
}: BudgetTableMenuProps<R, G>) => {
  return (
    <PortalOrRender id={"supplementary-header"} visible={true} portal={!detached}>
      <div className={classNames("table-header", { detached })}>
        <div className={"table-header-left"}>
          <Tooltip title={"Select All"}>
            <Checkbox checked={selected} onChange={(e: CheckboxChangeEvent) => onSelectAll(e.target.checked)} />
          </Tooltip>
          {!isNil(actions) && (
            <div className={"toolbar-buttons"}>
              {map(
                Array.isArray(actions) ? actions : actions({ onDelete: onDelete, selectedRows }),
                (action: BudgetTableMenuAction) => {
                  return (
                    <IconButton
                      className={"dark"}
                      size={"large"}
                      onClick={() => !isNil(action.onClick) && action.onClick()}
                      disabled={action.disabled}
                      icon={action.icon}
                      tooltip={
                        /* eslint-disable indent */
                        !isNil(action.tooltip)
                          ? typeof action.tooltip === "string"
                            ? {
                                title: action.tooltip,
                                placement: "bottom",
                                overlayClassName: classNames({ disabled: action.disabled === true })
                              }
                            : {
                                placement: "bottom",
                                ...action.tooltip,
                                overlayClassName: classNames(
                                  { disabled: action.disabled === true },
                                  action.tooltip.overlayClassName
                                )
                              }
                          : {}
                      }
                    />
                  );
                }
              )}
            </div>
          )}
          <ShowHide show={canSearch}>
            <Input
              placeholder={"Search Rows"}
              value={search}
              allowClear={true}
              prefix={<SearchOutlined />}
              style={{ maxWidth: 300, minWidth: 100 }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                !isNil(onSearch) && onSearch(event.target.value)
              }
            />
          </ShowHide>
        </div>
        <div className={"table-header-right"}>
          {!isNil(saving) && <SavingChanges saving={saving} />}
          <ShowHide show={canToggleColumns}>
            <FieldsDropdown
              fields={map(
                columns,
                (col: ColDef): FieldMenuField => {
                  return {
                    id: col.field as string,
                    label: col.headerName as string,
                    defaultChecked: true
                  };
                }
              )}
              buttonProps={{ style: { minWidth: 90 } }}
              onChange={(fields: Field[]) => onColumnsChange(fields)}
            >
              {"Columns"}
            </FieldsDropdown>
          </ShowHide>
          <ShowHide show={canExport}>
            <FieldsDropdown
              fields={map(
                columns,
                (col: ColDef): FieldMenuField => {
                  return {
                    id: col.field as string,
                    label: col.headerName as string,
                    defaultChecked: true
                  };
                }
              )}
              buttons={[
                {
                  onClick: (fields: Field[]) => onExport(fields),
                  text: "Download",
                  className: "btn--primary"
                }
              ]}
              buttonProps={{ style: { minWidth: 90 } }}
            >
              {"Export"}
            </FieldsDropdown>
          </ShowHide>
        </div>
      </div>
    </PortalOrRender>
  );
};

export default BudgetTableMenu;