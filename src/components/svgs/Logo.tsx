import { useMemo } from "react";

interface LogoProps {
  color?: "green" | "white";
}

const Logo = ({ color }: LogoProps): JSX.Element => {
  const fill = useMemo(() => (color === "green" || color === undefined ? "#10b767" : "#fff"), [color]);
  const foreground = useMemo(() => (color === "green" || color === undefined ? "#fff" : "#10b767"), []);

  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      width={"387.795"}
      height={"58.169"}
      viewBox={"0 0 387.795 58.169"}
      className={"logo"}
      fill={fill}
    >
      <g transform={"translate(6.024)"}>
        <g transform={"translate(-6.024 4.123)"}>
          <path
            d={
              "M3.2,0C1.781.019.835,1.277.409,3.061A15.045,15.045,0,0,0,.033,5.918c-.012.245-.02.488-.025.729S0,7.127,0,7.36c0,.467.009.916.023,1.335.211,3.475.269,6.088,1.793,8.816A15.959,15.959,0,0,0,7.28,22.785,93.486,93.486,0,0,0,18.716,28.8c2.927,1.394,5.361,2.583,7.259,3.472s3.381,1.574,4.472,2.085,1.87.89,2.392,1.189.914.513,1.2.659A8.258,8.258,0,0,1,37.371,42.3a14.135,14.135,0,0,1-.141,2.66c-.052.676.033.825.784.838.746-.057,1.571-.293,2.025-2.1a20.306,20.306,0,0,0,.5-3.826c.045-.821.068-1.727.066-2.71q0-.368-.006-.752t-.015-.781c-.012-.531-.03-1.082-.051-1.658-.267-3.484-.368-6.006-2.693-8.968a18.4,18.4,0,0,0-4.356-3.323,109.167,109.167,0,0,0-11.961-5.769c-3.9-1.677-7.247-3.225-9.822-4.459A62.206,62.206,0,0,1,6.085,8.519a5.758,5.758,0,0,1-2.1-5.763A12.214,12.214,0,0,0,4.177.714.75.75,0,0,0,3.926.173.741.741,0,0,0,3.635.039a1.383,1.383,0,0,0-.2-.031Q3.384,0,3.326,0T3.2,0Z"
            }
            transform={"translate(0 0)"}
          />
        </g>
        <g transform={"translate(200.834 0)"}>
          <path
            d={
              "M102.485,51.344a5.907,5.907,0,0,1-2.3-3.863,2.338,2.338,0,0,1,1.183-2.119c.56-.374,1.121-.5,1.183-.374,1.619,3.24,4.856,5.92,10.521,5.92,6.413,0,9.712-3.365,9.712-10.219V35.954c-2.117,3.676-5.728,5.982-10.833,5.982-7.907,0-13.7-5.795-13.7-14.83,0-8.661,5.977-15.017,13.883-15.017,5.292,0,9.152,2.617,10.771,5.733,0-.748.062-1.5.062-2.243.249-2.43,1.432-3.053,2.677-3.053a2.473,2.473,0,0,1,1.619.5V39.63c0,10.157-4.607,15.142-14.132,15.142C108.213,54.772,104.664,53.214,102.485,51.344Zm.249-24.3c0,6.792,3.984,11.216,10.023,11.216,5.479,0,9.961-3.926,10.023-9.409V22.868c-1.619-4.237-4.918-6.979-9.961-6.979C106.843,15.889,102.734,20.5,102.734,27.043Zm63.759,6.792V16.575h-2.926c-1.432,0-1.93-.623-1.93-1.682v-.436c0-1.059.5-1.682,1.93-1.682h2.926V7.54c0-1.558.809-2.181,1.992-2.181h.5c1.183,0,1.93.561,1.93,2.181v5.234h7.533c1.37,0,1.93.561,1.93,1.682v.374c0,1.122-.56,1.745-1.992,1.745h-7.533V33.15c0,4.362,1.307,6.231,4.42,6.231a5.17,5.17,0,0,0,4.42-2.306c.187-.125,1.245.5,1.245,2.056a3.116,3.116,0,0,1-1.121,2.306,7.309,7.309,0,0,1-5.167,1.745C169.17,43.182,166.493,40.128,166.493,33.835ZM131.5,27.791c0-9.035,6.163-15.7,14.693-15.7,8.28,0,13.634,5.857,13.634,14.643v.436c0,1.059-.436,1.433-1.556,1.433H135.8a4.415,4.415,0,0,0,.062.872c.56,5.982,4.856,9.97,10.833,9.97,5.541,0,8.156-2.617,9.65-5.483a2.54,2.54,0,0,1,2.553,2.368c0,.935-.747,2.368-2.366,3.676a15.254,15.254,0,0,1-9.9,3.178C137.6,43.182,131.5,36.888,131.5,27.791Zm4.42-2.43h19.486c-.249-5.795-3.8-9.658-9.214-9.658S136.731,19.69,135.921,25.361ZM64.38,27.6c0-9.222,5.852-15.516,13.821-15.516,5.292,0,9.027,2.679,10.708,5.733V.5c0-.187.685-.5,1.556-.5,1.494,0,2.926.748,2.926,3.988V40.565c0,1.62-.809,2.118-1.992,2.118h-.436c-1.121,0-1.93-.5-1.93-1.994-.062-1.246-.062-2.492-.062-3.863a11.821,11.821,0,0,1-10.895,6.356C70.232,43.182,64.38,36.951,64.38,27.6Zm4.482,0c0,6.917,4.171,11.777,10.023,11.777A9.76,9.76,0,0,0,88.91,29.66V22.993c-1.619-4.3-4.918-7.1-9.961-7.1C72.972,15.889,68.863,20.563,68.863,27.6Zm-35.3,2.617V14.643c0-1.62.809-2.119,1.992-2.119h.5c1.183,0,1.992.5,1.992,2.119V29.909c0,5.732,2.8,9.284,7.844,9.284a9.768,9.768,0,0,0,9.152-6.044V14.643c0-1.62.809-2.119,1.93-2.119h.56c1.183,0,1.992.5,1.992,2.119v27.6a2.319,2.319,0,0,1-1.619.5c-1.245,0-2.366-.623-2.615-2.929-.062-.81-.124-1.62-.124-2.43a11.57,11.57,0,0,1-10.21,5.8C37.3,43.182,33.56,37.885,33.56,30.221Zm-29.2,6.792v3.739c-.062,1.433-.809,1.932-1.868,1.932h-.5C.809,42.683,0,42.185,0,40.44V.5C0,.312.685,0,1.556,0,2.988,0,4.42.748,4.42,3.988V18.257a12.234,12.234,0,0,1,10.957-6.169c7.658,0,13.572,6.169,13.572,15.453s-5.79,15.64-13.821,15.64C9.65,43.182,5.914,40.315,4.358,37.013Zm0-13.958v6.73a9.774,9.774,0,0,0,10.023,9.6c6.039,0,10.148-4.736,10.148-11.777,0-6.917-4.3-11.714-10.023-11.714C9.463,15.889,6.039,18.756,4.358,23.055Z"
            }
            transform={"translate(0)"}
            fill={fill}
          />
        </g>
        <g transform={"translate(45.113 11.777)"}>
          <path
            d={
              "M5.292,40.44c-2.179-1.5-3.3-3.3-3.3-4.8a3.4,3.4,0,0,1,1.37-2.617c.685-.5,1.432-.685,1.494-.561,1.868,3.116,5.043,5.421,10.4,5.421,6.226,0,9.214-3.053,9.214-9.222V24.738a12,12,0,0,1-10.521,5.421C6.039,30.159,0,24.426,0,15.142,0,6.293,6.1,0,14.195,0c4.794,0,8.592,2.119,10.4,4.736l.187-1.246A3.452,3.452,0,0,1,28.389.436a3.2,3.2,0,0,1,2.241.685v23.99c0,12.151-3.362,18.008-15.191,18.008A18.289,18.289,0,0,1,5.292,40.44Zm.685-25.3c0,6.106,3.611,10.094,9.214,10.094,4.856,0,9.089-3.365,9.339-8.163V10.9a9.516,9.516,0,0,0-9.214-5.857C9.712,5.047,5.977,9.284,5.977,15.142Zm81.628.748C87.6,6.792,94.079,0,102.92,0,111.574,0,117.3,6.106,117.3,15.079v.5c0,1.309-.436,1.807-1.868,1.807h-22.1a6.873,6.873,0,0,0,.124,1.122c.872,4.923,4.794,8.163,10.086,8.163,5.23,0,7.844-2.306,9.4-4.985.125-.125,3.237.436,3.237,3.053,0,1.309-1.121,2.991-3.3,4.362a17.706,17.706,0,0,1-9.463,2.43C93.955,31.529,87.6,25.236,87.6,15.889Zm5.79-2.679h17.93c-.311-5.172-3.486-8.537-8.467-8.537C97.939,4.673,94.142,8.225,93.395,13.21ZM55.228,15.889C55.228,6.792,61.7,0,70.543,0,79.2,0,84.924,6.106,84.924,15.079v.5c0,1.309-.436,1.807-1.868,1.807h-22.1a6.862,6.862,0,0,0,.124,1.122c.872,4.923,4.794,8.163,10.086,8.163,5.23,0,7.844-2.306,9.4-4.985.124-.125,3.237.436,3.237,3.053,0,1.309-1.121,2.991-3.3,4.362a17.707,17.707,0,0,1-9.463,2.43C61.578,31.529,55.228,25.236,55.228,15.889Zm5.79-2.679h17.93c-.311-5.172-3.487-8.537-8.467-8.537C65.562,4.673,61.765,8.225,61.018,13.21Zm84.988,17.759c-1.619,0-2.739-.685-2.739-2.929V13.584c0-5.047-2.553-8.163-6.911-8.163a9.048,9.048,0,0,0-8.4,5.234V28.04c0,2.243-1.183,2.929-2.739,2.929h-.685c-1.619,0-2.739-.685-2.739-2.929V1.122a3.059,3.059,0,0,1,2.241-.685c1.681,0,3.736.872,3.86,4.86A11.614,11.614,0,0,1,137.85,0c7.907,0,11.58,5.421,11.58,12.836v15.2c0,2.243-1.183,2.929-2.739,2.929Zm-106.282,0c-1.619,0-2.739-.685-2.739-2.929V1.122A3.059,3.059,0,0,1,39.226.436a3.523,3.523,0,0,1,3.611,2.991,11.178,11.178,0,0,1,.249,2.243c1.307-3.676,3.8-5.67,7.6-5.67C53.794,0,55.6,1.5,55.6,3.988c0,2.368-1.743,3.3-1.868,3.178a5.8,5.8,0,0,0-3.8-1.309c-4.856,0-6.786,4.736-6.786,11.652V28.04c0,2.243-1.183,2.929-2.739,2.929Z"
            }
            transform={"translate(0 0)"}
            fill={fill}
          />
        </g>
        <path
          d={"M9,0H47.215a0,0,0,0,1,0,0V3.139a9,9,0,0,1-9,9H0a0,0,0,0,1,0,0V9A9,9,0,0,1,9,0Z"}
          transform={"translate(333.008 45.967)"}
          fill={fill}
        />
        <text
          transform={"translate(343.891 55.169)"}
          fill={foreground}
          fontSize={"9"}
          fontFamily={"AvenirNext-Bold, Avenir Next"}
          fontWeight={"700"}
          letterSpacing={"0.08em"}
        >
          <tspan x={"0"} y={"0"}>
            {"BETA"}
          </tspan>
        </text>
      </g>
    </svg>
  );
};

export default Logo;