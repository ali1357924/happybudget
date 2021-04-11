import { isNil, map } from "lodash";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlusSquare, faPercentage } from "@fortawesome/free-solid-svg-icons";

import { Input, Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import { SearchOutlined } from "@ant-design/icons";

import { ColDef } from "ag-grid-community";

import { IconButton } from "components/buttons";
import { FieldsDropdown } from "components/dropdowns";
import { FieldMenuField } from "components/menus/FieldsMenu";
import { SavingChanges } from "components";
import { Portal } from "components/layout";

interface TableHeaderProps {
  saving?: boolean;
  selected?: boolean;
  search: string;
  deleteDisabled?: boolean;
  columns: ColDef[];
  setSearch: (value: string) => void;
  onDelete: () => void;
  onSelect: (checked: boolean) => void;
  onColumnsChange: (fields: Field[]) => void;
  onExport: (fields: Field[]) => void;
}

const TableHeader = ({
  search,
  selected = false,
  saving = false,
  columns,
  deleteDisabled = false,
  setSearch,
  onDelete,
  onSelect,
  onColumnsChange,
  onExport
}: TableHeaderProps): JSX.Element => {
  return (
    <Portal id={"supplementary-header"} visible={true}>
      <div className={"table-header"}>
        <div className={"table-header-left"}>
          <Checkbox checked={selected} onChange={(e: CheckboxChangeEvent) => onSelect(e.target.checked)} />
          <IconButton
            className={"dark"}
            size={"large"}
            icon={<FontAwesomeIcon icon={faTrash} />}
            onClick={() => onDelete()}
            disabled={deleteDisabled}
          />
          <IconButton
            className={"dark"}
            size={"large"}
            disabled={true}
            icon={<FontAwesomeIcon icon={faPlusSquare} />}
          />
          <IconButton
            className={"dark"}
            size={"large"}
            disabled={true}
            icon={<FontAwesomeIcon icon={faPercentage} />}
          />
          <Input
            placeholder={"Search Rows"}
            value={search}
            allowClear={true}
            prefix={<SearchOutlined />}
            style={{ maxWidth: 500, minWidth: 300 }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
          />
        </div>
        <div className={"table-header-right"}>
          {!isNil(saving) && <SavingChanges saving={saving} />}
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
        </div>
      </div>
    </Portal>
  );
};

export default TableHeader;
