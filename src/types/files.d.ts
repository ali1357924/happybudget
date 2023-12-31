declare type CSVRow = (string | number | null | undefined)[];
declare type CSVData = CSVRow[];

// Image data that is received from the API.
declare type SavedImage = {
  readonly url: string;
  readonly size: number;
  readonly height: number;
  readonly width: number;
  /*
	The extension will be null if the file name is corrupted and the extension
  cannot be determined.
	*/
  readonly extension: string | null;
};

// Image data that is received from an upload, but not saved to the API.
declare type UploadedImage = {
  readonly file: File | Blob;
  readonly size?: number;
  readonly name: string;
  readonly fileName?: string;
  readonly url: string;
  readonly data: string | ArrayBuffer;
};

declare type UploadError = Error | string;
declare type UploadFile = import("antd/lib/upload/interface").UploadFile<Http.FileUploadResponse>;

declare type UploadImageParamsNoImage = { loading: boolean; onClear: () => void; error?: UploadError | null };
declare type UploadImageParamsWithImage = UploadImageParamsNoImage & { image: UploadedImage | SavedImage };
declare type UploadImageParams = UploadImageParamsWithImage | UploadImageParamsNoImage;

declare type IUploaderRef = {
  readonly clear: () => void;
};
