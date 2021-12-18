import { useEffect, useMemo, useCallback } from "react";
import { isNil, includes, reduce } from "lodash";

import { ui } from "lib";
import * as api from "api";

import Modal from "./Modal";

export interface EditModelModalProps<M extends Model.Model, R = M> extends ModalProps {
  readonly id: number;
  readonly onSuccess: (m: R) => void;
}

interface PrivateEditModelModalProps<M extends Model.Model, P extends Http.PayloadObj, V = P, R = M>
  extends EditModelModalProps<M, R> {
  readonly form?: FormInstance<V>;
  readonly title?: string | JSX.Element | ((m: M, form: FormInstance<V>) => JSX.Element | string);
  readonly autoFocusField?: number;
  readonly onModelLoaded?: (m: M) => void;
  readonly setFormData: (m: M, form: FormInstance<V>) => void;
  readonly request: (id: number) => Promise<M>;
  readonly update: (id: number, payload: P, options: Http.RequestOptions) => Promise<R>;
  readonly children: (m: M | null, form: FormInstance<V>) => JSX.Element;
  readonly interceptPayload?: (p: V) => P;
  readonly convertEmptyStringsToNull?: (keyof P)[] | boolean;
}

const EditModelModal = <M extends Model.Model, P extends Http.PayloadObj, V = P, R = M>({
  id,
  autoFocusField,
  form,
  onModelLoaded,
  onSuccess,
  request,
  update,
  children,
  interceptPayload,
  setFormData,
  convertEmptyStringsToNull,
  ...props
}: PrivateEditModelModalProps<M, P, V, R>): JSX.Element => {
  const Form = ui.hooks.useFormIfNotDefined<V>({ isInModal: true, autoFocusField }, form);
  const [getToken] = api.useCancelToken({ preserve: true, createOnInit: true });
  const isMounted = ui.hooks.useIsMounted();
  const [instance, loading, error] = api.useModel<M>(id, {
    request,
    onModelLoaded,
    conditional: () => props.open === true,
    getToken
  });

  useEffect(() => {
    if (props.open === true) {
      Form.setLoading(loading);
    }
  }, [loading]);

  useEffect(() => {
    if (!isNil(error) && props.open === true) {
      Form.handleRequestError(error);
    }
  }, [error, props.open]);

  useEffect(() => {
    if (!isNil(instance) && props.open === true) {
      setFormData(instance, Form);
    }
  }, [instance, props.open]);

  const title = useMemo(() => {
    if (typeof props.title === "function") {
      if (!isNil(instance)) {
        return props.title(instance, Form);
      }
      return "";
    } else {
      return props.title;
    }
  }, [instance, props.title]);

  const onOk = useCallback(async () => {
    Form.validateFields()
      .then((values: V) => {
        if (isMounted.current) {
          let payload = (!isNil(interceptPayload) ? interceptPayload(values) : values) as P;
          payload = reduce(
            payload,
            (curr: P, value: P[keyof P], k: string) =>
              ((Array.isArray(convertEmptyStringsToNull) && includes(convertEmptyStringsToNull, k as keyof P)) ||
                (!Array.isArray(convertEmptyStringsToNull) && convertEmptyStringsToNull !== false)) &&
              value === ("" as unknown as P[keyof P])
                ? { ...curr, [k]: null }
                : curr,
            payload
          );

          Form.setLoading(true);
          update(id, payload, { cancelToken: getToken() })
            .then((response: R) => {
              if (isMounted.current) {
                Form.resetFields();
              }
              onSuccess(response);
            })
            .catch((e: Error) => {
              Form.handleRequestError(e);
            })
            .finally(() => {
              if (isMounted.current) {
                Form.setLoading(false);
              }
            });
        }
      })
      .catch(() => {
        return;
      });
  }, [Form, update, getToken, interceptPayload]);

  return (
    <Modal
      {...props}
      okText={"Save"}
      cancelText={"Cancel"}
      title={title}
      okButtonProps={{ disabled: Form.loading || loading }}
      onOk={onOk}
    >
      {children(instance, Form)}
    </Modal>
  );
};

export default EditModelModal;
