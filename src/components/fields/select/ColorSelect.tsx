import React from "react";

import { ColorGrid, ColorGridProps } from "deprecated/components/tagging";

const ColorSelect: React.FC<ColorGridProps> = props => (
  <ColorGrid colorSize={16} {...props} wrapped={true} />
);

export default React.memo(ColorSelect);
