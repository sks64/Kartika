import React, { useEffect, useState } from "react";
import CustomContextMenu from "./ContextMenu";
const style = {
  height: "inherit",
  width: "calc(100% - 2px)",
  position: "relative",
  fontWeight: 600,
};

const OnlyNumAndCharAndTrim = (value) => {
  if (!value) return value;
  return value
    ?.toString()
    ?.replace(/[^a-zA-Z0-9\s]/g, "")
    ?.replace(/\s+/g, " ")
    ?.trim();
};

const checkValidHeaderValue = (value, headerOptions = []) => {
  let headerStatus = { key: value, status: false };
  for (let i = 0; i < headerOptions.length; i++) {
    if (
      Object.values(headerOptions[i])[0]?.includes(
        OnlyNumAndCharAndTrim(value)?.toLowerCase()?.split(" ").join("")
      )
    ) {
      headerStatus = { key: Object.keys(headerOptions[i])[0], status: true };
      break;
    }
  }
  return headerStatus;
};

const ExcelHeader = (props) => {
  const {
    onDataChange,
    onDeleteData,
    value,
    rowIndex,
    colIndex,
    header = [],
    headerOptions = [],
    defaultFileHeader = [],
    verifiedValidData = [],
  } = props;

  const [updatedValue, setUpdatedValue] = useState(() => {
    if (!value) {
      return "";
    } else {
      return checkValidHeaderValue(value, headerOptions).key;
    }
  });

  const options = [
    {
      name: "Delete Column",
      onclick: (props) => {
        onDeleteData?.({ ...props, type: "column" });
      },
      disabled: false,
    },
    {
      name: "Deselect Header",
      onclick: (props) => {
        onDeleteData?.({ ...props, type: "column" });
      },
      disabled: true,
    },
  ];

  const handleChangeValue = (event) => {
    setUpdatedValue(
      checkValidHeaderValue(event.target.value, headerOptions).key
    );
  };

  useEffect(() => {
    onDataChange?.({ rowIndex, colIndex, updatedValue });
  }, [updatedValue]);

  return (
    <div style={{ minWidth: "200px", maxWidth: "200px", height: "25px" }}>
      <CustomContextMenu
        options={options}
        colIndex={colIndex}
        rowIndex={rowIndex}
      >
        <select
          value={updatedValue || ""}
          onChange={handleChangeValue}
          disabled={verifiedValidData.length > 0}
          className="outline-blue-600 relative w-full font-normal text-sm"
          style={{
            ...style,
            background: checkValidHeaderValue(updatedValue, headerOptions)
              .status
              ? "yellow"
              : "",
          }}
        >
          <option value={updatedValue || ""}>
            {updatedValue?.toString().toUpperCase()}
          </option>
          <option
            style={{ color: "gray" }}
            value={defaultFileHeader?.[colIndex] || ""}
            disabled={header.includes(updatedValue)}
          >
            {defaultFileHeader?.[colIndex]?.toString().toUpperCase()}
          </option>
          {headerOptions.map((val, idx) => {
            const headerOptionKey = Object.keys(val)[0];
            if (!header.includes(headerOptionKey)) {
              return (
                <option key={idx} value={headerOptionKey}>
                  {headerOptionKey?.toString().toUpperCase()}
                </option>
              );
            }
            return null;
          })}
        </select>
      </CustomContextMenu>
    </div>
  );
};
export default ExcelHeader;
