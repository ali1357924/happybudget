import React, { useState, useImperativeHandle, forwardRef, ForwardedRef } from "react";

import { UploadUserImage } from "components/uploaders";
import { UploadUserImageProps } from "components/uploaders/UploadUserImage";

interface ContactModalHeaderProps
  extends StandardComponentProps,
    Omit<UploadUserImageProps, "firstName" | "lastName"> {}

export interface IContactModalHeaderRef {
  readonly setFirstName: (v: string | null) => void;
  readonly setLastName: (v: string | null) => void;
}

const ContactModalHeader = (props: ContactModalHeaderProps, ref: ForwardedRef<IContactModalHeaderRef>): JSX.Element => {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  useImperativeHandle(ref, () => ({
    setFirstName,
    setLastName
  }));
  return (
    <div className={"contact-modal-header"}>
      <UploadUserImage {...props} firstName={firstName} lastName={lastName} />
      <div className={"contact-name-wrapper"}>
        <div className={"contact-name"}>{firstName}</div>
        <div className={"contact-name"}>{lastName}</div>
      </div>
    </div>
  );
};

const Forwarded = forwardRef(ContactModalHeader);
export default React.memo(Forwarded);
