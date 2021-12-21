import { useEffect, useState, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { isNil, map, filter } from "lodash";
import classNames from "classnames";

import * as api from "api";
import { ui, tabling, pdf } from "lib";

import { selectors } from "store";

import { ExportActualsPdfForm } from "components/forms";
import { PreviewModal } from "components/modals";
import { ActualsTable } from "tabling";

import ActualsPdf from "./ActualsPdf";

type M = Model.Actual;
type R = Tables.ActualRowData;
type C = Table.DataColumn<R, M>;

const ActualColumns = filter(
  ActualsTable.Columns,
  (c: Table.Column<R, M>) => tabling.typeguards.isDataColumn(c) && c.includeInPdf !== false
) as C[];

const DEFAULT_OPTIONS: ExportActualsPdfFormOptions = {
  excludeZeroTotals: false,
  columns: filter(
    map(ActualColumns, (column: C) => tabling.columns.normalizedField<R, M>(column)),
    (field: string | undefined) => !isNil(field)
  ) as string[],
  header: `<h2>Sample Title ${new Date().getFullYear()}</h2><p>Sample Subtitle</p>`
};

interface ActualsPdfFuncProps {
  readonly actuals: M[];
  readonly contacts: Model.Contact[];
  readonly options: PdfActualsTable.Options;
  readonly budget: Model.Budget;
}

const ActualsPdfFunc = (props: ActualsPdfFuncProps): JSX.Element => <ActualsPdf {...props} />;

interface ActualsPreviewModalProps extends ModalProps {
  readonly onSuccess?: () => void;
  readonly filename: string;
  readonly budgetId: number;
  readonly budget: Model.Budget;
}

const ActualsPreviewModal = ({
  budget,
  budgetId,
  filename,
  onSuccess,
  ...props
}: ActualsPreviewModalProps): JSX.Element => {
  const previewer = useRef<Pdf.IPreviewerRef>(null);
  const [getToken] = api.useCancelToken({ preserve: true, createOnInit: true });

  const contacts = useSelector(selectors.selectContacts);

  const [options, setOptions] = useState<ExportActualsPdfFormOptions>(DEFAULT_OPTIONS);
  const [actuals, setActuals] = useState<M[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const form = ui.hooks.useForm<ExportActualsPdfFormOptions>({ isInModal: true });
  const modal = ui.hooks.useModal();

  const convertOptions = useMemo(
    () =>
      (opts: ExportActualsPdfFormOptions): PdfActualsTable.Options => ({
        ...opts,
        header: pdf.parsers.convertHtmlIntoNodes(opts.header || "") || []
      }),
    []
  );

  useEffect(() => {
    setOptions({
      ...DEFAULT_OPTIONS,
      header: `<h2>${budget.name}</h2><p>Actuals Summary</p>`
    });
  }, [budget.name]);

  useEffect(() => {
    if (props.open === true) {
      api
        .getActuals(budgetId, {}, { cancelToken: getToken() })
        .then((response: Http.ListResponse<M>) => {
          setActuals(response.data);
          const pdfComponent = ActualsPdfFunc({
            budget,
            contacts,
            actuals: response.data,
            options: convertOptions(options)
          });
          previewer.current?.render(pdfComponent);
        }) /* TODO: We should probably display the error in the modal and not let
							the default toast package display it in the top right of the
							window. */
        .catch((e: Error) => modal.current.handleRequestError(e))
        .finally(() => setLoadingData(false));
    }
  }, [props.open]);

  const renderComponent = useMemo(
    () => () => {
      if (!isNil(actuals)) {
        return ActualsPdfFunc({
          budget,
          contacts,
          actuals,
          options: convertOptions(options)
        });
      }
    },
    [budget, contacts, actuals, options]
  );

  return (
    <PreviewModal
      {...props}
      modal={modal}
      previewer={previewer}
      loadingData={loadingData}
      renderComponent={renderComponent}
      filename={filename}
      onExportSuccess={onSuccess}
      className={classNames("actuals-preview-modal", props.className)}
    >
      <ExportActualsPdfForm
        form={form}
        initialValues={{
          ...DEFAULT_OPTIONS,
          header: `<h2>${budget.name}</h2><p>Actuals Summary</p>`
        }}
        disabled={isNil(actuals)}
        columns={ActualColumns}
        onValuesChange={(changedValues: Partial<ExportActualsPdfFormOptions>, values: ExportActualsPdfFormOptions) => {
          setOptions(values);
          previewer.current?.refreshRequired();
        }}
      />
    </PreviewModal>
  );
};

export default ActualsPreviewModal;
