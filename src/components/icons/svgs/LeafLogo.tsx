import React from "react";

import { icons } from "lib/ui";

import { createSVG } from "./createSVG";

export const LeafLogo = createSVG(
  <path
    /* eslint-disable-next-line max-len */
    d="M3.611,0C2.009.022.941,1.44.462,3.452A16.964,16.964,0,0,0,.037,6.673c-.013.276-.023.551-.028.822S0,8.035,0,8.3c0,.527.01,1.033.025,1.5.238,3.918.3,6.865,2.022,9.94.974,1.747,2.812,3.763,6.161,5.946A105.407,105.407,0,0,0,21.1,32.475c3.3,1.571,6.045,2.912,8.185,3.914s3.812,1.775,5.042,2.351,2.108,1,2.7,1.341,1.03.578,1.353.743a9.311,9.311,0,0,1,3.757,6.869,15.938,15.938,0,0,1-.159,3c-.058.762.037.93.884.945.842-.064,1.771-.331,2.284-2.372a22.9,22.9,0,0,0,.564-4.314c.051-.926.077-1.948.074-3.055q0-.415-.007-.847t-.016-.881c-.014-.6-.034-1.22-.058-1.869-.3-3.928-.415-6.771-3.037-10.111a20.74,20.74,0,0,0-4.912-3.747,123.087,123.087,0,0,0-13.486-6.5c-4.4-1.891-8.171-3.637-11.074-5.028a70.138,70.138,0,0,1-6.333-3.3C4.262,7.63,4.27,5,4.5,3.108A13.772,13.772,0,0,0,4.71.805a.846.846,0,0,0-.284-.61A.835.835,0,0,0,4.1.044,1.559,1.559,0,0,0,3.876.009Q3.816,0,3.75,0T3.611,0Z"
  />,
  {
    defaultColor: icons.IconColors.BRAND,
    name: "leaf-logo",
  },
);
