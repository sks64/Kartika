import React, { useState } from "react";
import BaseService from "../../../services/BaseService";
import appConfig from "../../../configs/app.config";
import { toast } from "react-toastify";
import { headerOptionsOfServer } from "../constants";
import { apiUpdateHeader } from "../../../services/VehicleServices";
import { CgSpinner } from "react-icons/cg";

import Papa from "papaparse";

const notify = (message, type = "error") => toast[type](message);

const updateHeader = async (header) => {
  try {
    await apiUpdateHeader({ header });
    return;
  } catch (error) {
    return;
  }
};

const UploadData = (props) => {
  const {
    setDesc,
    verifiedValidData = [],
    setVerifiedValidData,
    header = [],
    defaultFileHeader = [],
    setFileData,
    fetchHeader,
    selectedBranch,
  } = props;

  const [loading, setLoading] = useState(false);

  let percent = 0;
  const onUploadToServer = async () => {
    if (loading) return;
    
    if (verifiedValidData.length < 1) {
      return notify("Please verify data");
    }
    if (!selectedBranch) {
      return notify("Please select branch");
    }
    setLoading(true);
    setDesc("Updating Header...");
    const newUpdateHeaderToServer = {};
    for (let i = 0; i < header.length; i++) {
      const headerKey = header[i]
        ?.toString()
        ?.replace(/[^a-zA-Z0-9]/g, " ")
        .toLowerCase()
        .trim()
        .split(" ")
        .join("_");
      if (headerOptionsOfServer.includes(headerKey)) {
        const valueKey = defaultFileHeader[i]
          ?.toString()
          ?.replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase()
          .trim();
        newUpdateHeaderToServer[headerKey] = valueKey;
      }
    }
    await updateHeader(newUpdateHeaderToServer);
    
    setDesc?.("Processing Data...");
    try {
      const formattedHeaders = header.map((value) =>
        value
          ?.toString()
          ?.toLowerCase()
          ?.replace(/[^a-zA-Z0-9\s]/g, "")
          ?.replace(/\s+/g, " ")
          ?.trim()
          ?.split(" ")
          ?.join("_")
      );

      // Formatting the payload optimally: mapping to an array of arrays to physically compress the file size parameter
      const payloadObj = {
        headers: formattedHeaders,
        data: verifiedValidData
      };

      const jsonFile = JSON.stringify(payloadObj);
      const formData = new FormData();
      const jsonBlob = new Blob([jsonFile], { type: "application/json" });
      formData.append("csv_file", jsonBlob, "data.json");
      formData.append("branchId", selectedBranch);

      const res = await BaseService.post(`v1/vehicle/admin/insert`, formData);
      
      if (res.status === 200) {
        setDesc?.("");
        notify("Upload Successful", "success");
        setFileData?.([]);
        setVerifiedValidData?.([]);
        fetchHeader();
      } else {
        notify("Failed");
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      notify("Failed");
      setDesc?.("");
      setLoading(false);
    }
  };

  return (
    <button
      className="text-md pe-3 ps-3 h-full bg-gray-50 text-black border-0 rounded-sm flex justify-start items-center hover:bg-gray-200"
      onClick={onUploadToServer}
    >
        {loading ? (
        <CgSpinner
          className={`${loading ? "animate-spin" : ""}`}
        />
      ) : null}
      Upload
    </button>
  );
};

export default UploadData;
