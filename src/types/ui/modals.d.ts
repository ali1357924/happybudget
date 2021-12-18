declare type RootModalProps = import("antd/lib/modal").ModalProps;

declare interface ModalInstance extends UINotificationsHandler {
  readonly setLoading: (value: boolean) => void;
  readonly loading: boolean | undefined;
}

declare interface ModalProps extends Omit<RootModalProps, "visible"> {
  readonly open?: boolean;
  readonly titleIcon?: IconOrElement;
  readonly onCancel?: () => void;
  readonly okButtonClass?: string;
  readonly modal?: NonNullRef<ModalInstance>;
  readonly buttonSpinnerOnLoad?: boolean;
}
