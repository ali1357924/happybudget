import React, { useState } from "react";
import { useSelector } from "react-redux";
import { isNil } from "lodash";

import { model, tabling } from "lib";
import { selectors } from "store";
import { EditContactModal, CreateContactModal } from "components/modals";
import { SubAccountsTable as GenericSubAccountsTable } from "components/tabling";

import PreviewModal from "./PreviewModal";

type PreContactCreate = Omit<Table.SoloCellChange<Tables.SubAccountRowData>, "newValue">;

type OmitTableProps = "contacts" | "onEditContact" | "onNewContact" | "menuPortalId" | "columns" | "onExportPdf";

export interface BudgetSubAccountsTableProps
  extends Omit<GenericSubAccountsTable.AuthenticatedBudgetProps, OmitTableProps> {
  readonly budgetId: number;
  readonly budget: Model.Budget | null;
}

const SubAccountsTable = ({ budget, budgetId, ...props }: BudgetSubAccountsTableProps): JSX.Element => {
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [preContactCreate, setPreContactCreate] = useState<PreContactCreate | null>(null);
  const [initialContactFormValues, setInitialContactFormValues] = useState<any>(null);
  const [contactToEdit, setContactToEdit] = useState<number | null>(null);
  const [createContactModalVisible, setCreateContactModalVisible] = useState(false);

  const contacts = useSelector(selectors.selectContacts);
  const table = tabling.hooks.useTableIfNotDefined<Tables.SubAccountRowData>(props.table);

  return (
    <React.Fragment>
      <GenericSubAccountsTable.AuthenticatedBudget
        {...props}
        table={table}
        contacts={contacts}
        menuPortalId={"supplementary-header"}
        savingChangesPortalId={"saving-changes"}
        onEditContact={(contact: number) => setContactToEdit(contact)}
        onExportPdf={() => setPreviewModalVisible(true)}
        onNewContact={(params: { name?: string; change: PreContactCreate }) => {
          setPreContactCreate(params.change);
          setInitialContactFormValues(null);
          if (!isNil(params.name)) {
            const [firstName, lastName] = model.util.parseFirstAndLastName(params.name);
            setInitialContactFormValues({
              first_name: firstName,
              last_name: lastName
            });
          }
          setCreateContactModalVisible(true);
        }}
      />
      {!isNil(contactToEdit) && (
        <EditContactModal
          open={true}
          id={contactToEdit}
          onSuccess={() => setContactToEdit(null)}
          onCancel={() => setContactToEdit(null)}
        />
      )}
      {createContactModalVisible && (
        <CreateContactModal
          visible={true}
          initialValues={initialContactFormValues}
          onSuccess={(contact: Model.Contact) => {
            setPreContactCreate(null);
            setInitialContactFormValues(null);
            setCreateContactModalVisible(false);
            // If we have enough information from before the contact was created in the specific
            // cell, combine that information with the new value to perform a table update, showing
            // the created contact in the new cell.
            if (!isNil(preContactCreate)) {
              const cellChange: Table.SoloCellChange<Tables.SubAccountRowData> = {
                ...preContactCreate,
                newValue: contact.id
              };
              table.current.applyTableChange({
                type: "dataChange",
                payload: tabling.events.cellChangeToRowChange(cellChange)
              });
            }
          }}
          onCancel={() => setCreateContactModalVisible(false)}
        />
      )}
      <PreviewModal
        autoRenderPdf={false}
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        budgetId={budgetId}
        budgetName={!isNil(budget) ? `${budget.name}` : `Sample Budget ${new Date().getFullYear()}`}
        filename={!isNil(budget) ? `${budget.name}.pdf` : "budget.pdf"}
      />
    </React.Fragment>
  );
};

export default SubAccountsTable;
