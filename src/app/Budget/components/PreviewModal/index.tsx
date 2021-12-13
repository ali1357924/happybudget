import { useEffect, useState, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { isNil, map, filter } from "lodash";

import * as api from "api";
import { registerFonts } from "style/pdf";
import { redux, ui, tabling, notifications, pdf } from "lib";

import { Modal } from "components";
import { ExportPdfForm } from "components/forms";
import { Previewer } from "components/pdf";
import { SubAccountsTable } from "components/tabling";

import { actions } from "../../store";
import BudgetPdf from "../BudgetPdf";

import "./index.scss";

const SubAccountColumns = filter(
  SubAccountsTable.Columns,
  (c: Table.PdfColumn<Tables.SubAccountRowData, Model.PdfSubAccount>) => c.includeInPdf !== false
) as Table.PdfColumn<Tables.SubAccountRowData, Model.PdfSubAccount>[];

const DEFAULT_OPTIONS: ExportFormOptions = {
  excludeZeroTotals: false,
  header: {
    header: `<h2>Sample Budget ${new Date().getFullYear()}</h2><p>Cost Summary</p>`,
    left_image: null,
    right_image: null,
    left_info: "<h6>Production Company</h6><p>Address:</p><p>Phone:</p>",
    right_info: "<h6>Client / Agency</h6><p>Address:</p><p>Phone:</p>"
  },
  includeNotes: false,
  columns: filter(
    map(SubAccountColumns, (column: Table.PdfColumn<Tables.SubAccountRowData, Model.PdfSubAccount>) =>
      tabling.columns.normalizedField<Tables.SubAccountRowData, Model.PdfSubAccount>(column)
    ),
    (field: string | undefined) => !isNil(field)
  ) as string[]
};

interface BudgetPdfFuncProps {
  readonly budget: Model.PdfBudget;
  readonly contacts: Model.Contact[];
  readonly options: PdfBudgetTable.Options;
}

const BudgetPdfFunc = (props: BudgetPdfFuncProps): JSX.Element => <BudgetPdf {...props} />;

interface PreviewModalProps {
  readonly onSuccess?: () => void;
  readonly onCancel: () => void;
  readonly visible: boolean;
  readonly budgetId: number;
  readonly budgetName: string;
  readonly filename: string;
}

const selectHeaderTemplatesLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.headerTemplates.loading
);
const selectHeaderTemplates = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.headerTemplates.data
);
const selectDisplayedHeaderTemplate = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.headerTemplates.displayedTemplate
);
const selectHeaderTemplateLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.headerTemplates.loadingDetail
);

const PreviewModal = ({
  budgetId,
  budgetName,
  visible,
  filename,
  onSuccess,
  onCancel
}: PreviewModalProps): JSX.Element => {
  const previewer = useRef<Pdf.IPreviewerRef>(null);
  const [loadingData, setLoadingData] = useState(false);

  const [contactsResponse, setContactsResponse] = useState<Http.ListResponse<Model.Contact> | null>(null);
  const [budgetResponse, setBudgetResponse] = useState<Model.PdfBudget | null>(null);
  const [options, setOptions] = useState<ExportFormOptions>(DEFAULT_OPTIONS);

  const form = ui.hooks.useForm<ExportFormOptions>({ isInModal: true });
  const dispatch = useDispatch();

  const headerTemplatesLoading = useSelector(selectHeaderTemplatesLoading);
  const headerTemplates = useSelector(selectHeaderTemplates);
  const displayedHeaderTemplate = useSelector(selectDisplayedHeaderTemplate);
  const headerTemplateLoading = useSelector(selectHeaderTemplateLoading);

  useEffect(() => {
    setOptions({
      ...DEFAULT_OPTIONS,
      header: {
        ...DEFAULT_OPTIONS.header,
        header: `<h2>${budgetName}</h2><p>Cost Summary</p>`
      }
    });
  }, [budgetName]);

  useEffect(() => {
    if (visible === true) {
      dispatch(actions.pdf.requestHeaderTemplatesAction(null));
      registerFonts().then(() => {
        const promises: [Promise<Model.PdfBudget>, Promise<Http.ListResponse<Model.Contact>>] = [
          api.getBudgetPdf(budgetId),
          api.getContacts()
        ];
        setLoadingData(true);
        Promise.all(promises)
          .then(([b, cs]: [Model.PdfBudget, Http.ListResponse<Model.Contact>]) => {
            setContactsResponse(cs);
            setBudgetResponse(b);
            const pdfComponent = BudgetPdfFunc({
              budget: b,
              contacts: cs.data,
              options: convertOptions(options)
            });
            previewer.current?.render(pdfComponent);
          })
          /* TODO: We should probably display the error in the modal and not let
						 the default toast package display it in the top right of the
						 window. */
          .catch((e: Error) => notifications.requestError(e))
          .finally(() => setLoadingData(false));
      });
    }
  }, [visible]);

  const convertOptions = useMemo(
    () =>
      (opts: ExportFormOptions): PdfBudgetTable.Options => ({
        ...opts,
        notes: pdf.parsers.convertHtmlIntoNodes(opts.notes || "") || [],
        header: {
          ...opts.header,
          header: pdf.parsers.convertHtmlIntoNodes(opts.header.header || "") || [],
          left_info: pdf.parsers.convertHtmlIntoNodes(opts.header.left_info || "") || [],
          right_info: pdf.parsers.convertHtmlIntoNodes(opts.header.right_info || "") || []
        }
      }),
    []
  );

  const renderComponent = useMemo(
    () => () => {
      if (!isNil(budgetResponse) && !isNil(contactsResponse)) {
        return BudgetPdfFunc({
          budget: budgetResponse,
          contacts: contactsResponse.data,
          options: convertOptions(options)
        });
      }
    },
    [budgetResponse, contactsResponse, options]
  );

  return (
    <Modal
      className={"export-preview-modal"}
      title={"Export"}
      visible={visible}
      onCancel={() => onCancel()}
      getContainer={false}
      footer={null}
    >
      <div className={"export-form-container"}>
        <ExportPdfForm
          form={form}
          initialValues={{
            ...DEFAULT_OPTIONS,
            header: {
              ...DEFAULT_OPTIONS.header,
              header: `<h2>${budgetName}</h2><p>Cost Summary</p>`
            }
          }}
          loading={headerTemplateLoading}
          headerTemplates={headerTemplates}
          headerTemplatesLoading={headerTemplatesLoading}
          accountsLoading={loadingData}
          accounts={!isNil(budgetResponse) ? budgetResponse.children : []}
          disabled={isNil(budgetResponse) || isNil(contactsResponse)}
          columns={SubAccountColumns}
          onValuesChange={(changedValues: Partial<ExportFormOptions>, values: ExportFormOptions) => {
            setOptions(values);
            previewer.current?.refreshRequired();
          }}
          displayedHeaderTemplate={displayedHeaderTemplate}
          onClearHeaderTemplate={() => dispatch(actions.pdf.clearHeaderTemplateAction(null))}
          onLoadHeaderTemplate={(id: number) => dispatch(actions.pdf.loadHeaderTemplateAction(id))}
          onHeaderTemplateDeleted={(id: number) => {
            if (!isNil(displayedHeaderTemplate) && displayedHeaderTemplate.id === id) {
              dispatch(actions.pdf.clearHeaderTemplateAction(null));
            }
            dispatch(actions.pdf.removeHeaderTemplateFromStateAction(id));
          }}
          onHeaderTemplateCreated={(template: Model.HeaderTemplate) => {
            dispatch(actions.pdf.addHeaderTemplateToStateAction(template));
            dispatch(actions.pdf.displayHeaderTemplateAction(template));
          }}
        />
      </div>
      <Previewer
        ref={previewer}
        loadingData={loadingData}
        renderComponent={renderComponent}
        onExport={() => previewer.current?.export(filename, onSuccess)}
      />
    </Modal>
  );
};

export default PreviewModal;
