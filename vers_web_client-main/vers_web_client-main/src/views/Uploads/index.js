import React, { useEffect, useState } from "react";
import FileReader from "./components/FileReader";
import { useVirtualizer } from "@tanstack/react-virtual";
import ExcelHeader from "./components/ExcelHeader";
import ExcelRow from "./components/ExcelRow";
import VerifyButton from "./components/VerifyButton";
import CountButton from "./components/CountButton";
import UploadData from "./components/UploadData";
import BranchSelect from "./components/BranchSelect";
import { apiGetHeader } from "../../services/VehicleServices";
import { injectReducer } from "../../store";
import OfficeReducer from "../Offices/store";
import { CgSpinner } from "react-icons/cg";
const WIDTH_SIZE = 10;
injectReducer("office", OfficeReducer);

const Uploads = () => {
  const [fileData, setFileData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [defaultFileHeader, setDefaultFileHeader] = useState([]);
  const [verifiedValidData, setVerifiedValidData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [headerOptions, setHeaderOptions] = useState([]);
  const [desc, setDesc] = useState(null);
  const [rawFile, setRawFile] = useState(null);

  const parentRef = React.useRef();

  const rowVirtualizer = useVirtualizer({
    count: fileData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 25,
  });

  const onDataChange = (props) => {
    const { rowIndex, colIndex, updatedValue } = props;
    const copyData = [...fileData];
    copyData[rowIndex][colIndex] = updatedValue;
    setFileData(copyData);
  };

  const onDeleteData = async (props) => {
    const { type, colIndex, rowIndex } = props;
    switch (type) {
      case "column":
        const copyDataColumn = [...fileData];
        const copyDefaultHeader = [...defaultFileHeader];
        setFileData([]);
        setDefaultFileHeader([]);
        await new Promise((resolve) => setTimeout(resolve, 10));
        setFileData(
          copyDataColumn?.map((innerArray) => {
            return innerArray?.filter((_, index) => index !== colIndex);
          })
        );
        setDefaultFileHeader(
          copyDefaultHeader.filter((_, index) => index !== colIndex)
        );
        break;
      case "row":
        const copyDataRow = [...fileData];
        setFileData([]);
        await new Promise((resolve) => setTimeout(resolve, 10));
        setFileData(copyDataRow.filter((_, index) => index !== rowIndex));
        break;
      default:
        break;
    }
  };

  const fetchHeader = async () => {
    try {
      const response = await apiGetHeader();
      if (response?.status === 200) {
        setHeaderOptions(
          Object.keys(response.data.data[0])
            .map((element) => {
              if (!["__v", "updatedAt", "createdAt", "_id"].includes(element))
                return {
                  [element.toString()?.split("_").join(" ")]:
                    response.data.data[0][element],
                };
            })
            .filter(Boolean)
        );
      }
    } catch (error) { }
  };

  useEffect(() => {
    fetchHeader();
  }, []);

  return (
    <>
      <div className="p-2 h-12 bg-blue-500 flex gap-2 text-white">
        <FileReader
          setLoading={setLoading}
          setDefaultFileHeader={setDefaultFileHeader}
          setFileData={setFileData}
          setVerifiedValidData={setVerifiedValidData}
          setRawFile={setRawFile}
        />
        {/* <CountButton label="Opening" data={`${count}`} /> */}
        <CountButton
          data={`Total: ${fileData.length > 0
              ? verifiedValidData.length + fileData.length - 1
              : 0
            }`}
        />
        <CountButton data={`Valid: ${verifiedValidData.length}`} />
        <CountButton
          data={`Invalid: ${fileData.length > 0 ? fileData.length - 1 : 0}`}
        />
        <VerifyButton
          data={fileData}
          setFileData={setFileData}
          setVerifiedValidData={setVerifiedValidData}
        />
        <BranchSelect setSelectedBranch={setSelectedBranch} />
        <UploadData
          fetchHeader={fetchHeader}
          defaultFileHeader={defaultFileHeader}
          selectedBranch={selectedBranch}
          setFileData={setFileData}
          verifiedValidData={verifiedValidData}
          setVerifiedValidData={setVerifiedValidData}
          header={fileData[0]}
          setDesc={setDesc}
          rawFile={rawFile}
        />
        <p style={{ padding: 0, margin: 0 }}>{desc}</p>
      </div>

      <div
        ref={parentRef}
        style={{
          height: `calc(100vh - 110px)`,
          overflow: "auto",
          width: `calc(100vw - ${WIDTH_SIZE}px)`,
        }}
      >
        {!loading ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            <table style={{ width: "100%" }} className="border-collapse">
              <tbody>
                {rowVirtualizer?.getVirtualItems()?.map((virtualItem) => {
                  return (
                    <tr
                      key={virtualItem.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        padding: 0,
                        width: "100%",
                        height: `${virtualItem.size - 2}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                        zIndex: virtualItem?.index === 0 ? 1 : 0,
                      }}
                    >
                      {fileData?.[virtualItem?.index]?.map((value, index) => {
                        return virtualItem.index === 0 ? (
                          <td
                            className=" border border-green-400"
                            style={{ maxWidth: "200px", minWidth: "200px" }}
                            key={index}
                          >
                            <ExcelHeader
                              headerOptions={headerOptions}
                              onDeleteData={onDeleteData}
                              defaultFileHeader={defaultFileHeader}
                              verifiedValidData={verifiedValidData}
                              header={fileData[0]?.map((value) =>
                                value?.toString()?.toLowerCase()
                              )}
                              onDataChange={onDataChange}
                              value={value}
                              rowIndex={virtualItem.index}
                              colIndex={index}
                            />
                          </td>
                        ) : (
                          <td
                            className="text-sm border border-gray-400"
                            style={{ maxWidth: "200px", minWidth: "200px" }}
                            key={index}
                          >
                            <ExcelRow
                              onDeleteData={onDeleteData}
                              onDataChange={onDataChange}
                              value={value}
                              rowIndex={virtualItem.index}
                              colIndex={index}
                              type="text"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-full w-full justify-center items-center flex flex-col">
            <CgSpinner
              className={`h-10 w-10 text-blue-500 ${loading ? "animate-spin" : ""
                }`}
            />
            <p>Reading file... Please wait...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Uploads;
