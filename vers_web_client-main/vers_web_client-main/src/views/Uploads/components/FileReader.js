import React from "react";
import Papa from "papaparse";

const FileReader = (props) => {
  const {
    setFileData,
    setDefaultFileHeader,
    setVerifiedValidData,
    setLoading,
  } = props;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    setFileData?.([]);
    setVerifiedValidData?.([]);
    setLoading?.(true);

    const fileName = file.name.toLowerCase();

    // Process CSV using synchronous parsing without workers (safer for Webpack compilation targets)
    if (fileName.endsWith(".csv")) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          setLoading?.(false);
          setFileData?.(results.data);
          setDefaultFileHeader?.(
            results.data[0]?.map((value) =>
              value
                ?.toString()
                .toLowerCase()
                ?.replace(/[^a-zA-Z0-9\s]/g, "")
                ?.replace(/\s+/g, " ")
                ?.trim()
            )
          );
        },
        error: (err) => {
           setLoading?.(false);
           console.error("CSV Parse Error", err);
        }
      });
      return;
    }

    // Process Excel via dynamic script injection to bypass strict browser blob-worker CSP
    const parseExcel = async () => {
      if (typeof window.XLSX === "undefined") {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      try {
        const ab = await file.arrayBuffer();
        // Read file using sheetJS natively on main thread (fast enough for 50mb files)
        const workbook = window.XLSX.read(ab, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = window.XLSX.utils.sheet_to_csv(worksheet);

        Papa.parse(excelData, {
          header: false,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            setLoading?.(false);
            setFileData?.(results.data);
            setDefaultFileHeader?.(
              results.data[0]?.map((value) =>
                value
                  ?.toString()
                  .toLowerCase()
                  ?.replace(/[^a-zA-Z0-9\s]/g, "")
                  ?.replace(/\s+/g, " ")
                  ?.trim()
              )
            );
          },
        });
      } catch (error) {
        setLoading?.(false);
        console.error("Excel Parsing Error:", error);
      }
    };

    parseExcel();
  };

  return (
    <input
      className="text-sm h-14"
      accept=".csv, .xlsx, .xlsb"
      type="file"
      onChange={handleFileChange}
    />
  );
};

export default FileReader;
