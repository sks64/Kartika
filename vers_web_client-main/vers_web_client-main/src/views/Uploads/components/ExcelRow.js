import React, { memo, useEffect, useState } from "react";
import CustomContextMenu from "./ContextMenu";

const ExcelRow = (props) => {
  const { onDeleteData, onDataChange, value, rowIndex, colIndex, type = "text" } = props;

  const [updatedValue, setUpdatedValue] = useState(() => {
    if (value === null || value === undefined) {
      return "";
    } else {
      return value;
    }
  });

  useEffect(() => {
    setUpdatedValue(value);
  }, [props]);

  const handleChangeValue = (event) => {
    const updatedValue = event.target.value;
    setUpdatedValue(updatedValue);
  };

  const handleOnBlur = () => {
    return onDataChange?.({ rowIndex, colIndex, updatedValue });
  };

  const options = [
    {
      name: "Delete Row",
      onclick: () => {
        onDeleteData?.({ type: "row", rowIndex });
      },
      disabled: false
    },
    {
      name: "Find By",
      onclick: (e) => {
        console.log(e);
      },
      disabled: true
    },
  ];

  return (
    <CustomContextMenu
      options={options}
      rowIndex={rowIndex}
      colIndex={colIndex}
    >
      <input
        autoComplete="off"
        type={type}
        checked
        value={updatedValue?.toString()?.toUpperCase()}
        className="text-sm h-full p-1 outline-green-600 bg-emerald-50"
        onBlur={handleOnBlur}
        onChange={handleChangeValue}
      ></input>
    </CustomContextMenu>
  );
};

export default memo(ExcelRow);
