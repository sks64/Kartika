const responseError = require("../../../../errors/responseError");
const checkObjectId = require("../../utils/checkObjectId");
const path = require("path");
const CSVToJSON = require("csvtojson");
const fs = require("fs");
const dayjs = require("dayjs");
const mongoose = require("mongoose");
const keyOfDocuments = require("./constants/keyOfDocuments");
const Branch = require("../../../../models/branch.model");
const Vehicle = require("../../../../models/vehicle.model");

// Helper to safely delete a file without throwing
const safeUnlink = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.error("Could not delete temp file:", filePath, e.message);
  }
};

const getLastFourChar = (value = "") => {
  if (!value) return "0";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "0";
  return String(parseInt(digits.slice(-4), 10) || 0);
};

const processRow = (row, dateObj, branchIdObj) => {
  let newRow = {
    branch_id: branchIdObj,
    is_released: false,
    createdAt: dateObj,
    updatedAt: dateObj,
    __v: 0
  };
  for (let i = 0; i < keyOfDocuments.length; i++) {
    const key = keyOfDocuments[i];
    const val = row[key];
    if (val) {
      if (key === "rc_no") {
        const clean = String(val).trim().replace(/[^a-zA-Z0-9]/g, "");
        newRow[key] = clean;
        newRow["last_four_digit_rc"] = getLastFourChar(clean);
      } else if (key === "chassis_no") {
        const clean = String(val).trim().replace(/[^a-zA-Z0-9]/g, "");
        newRow[key] = clean;
        newRow["last_four_digit_chassis"] = getLastFourChar(clean);
      } else {
        newRow[key] = val;
      }
    }
  }
  return newRow;
};

const newBulkVehicleRegistration = async (req, res, next) => {
  // Resolve file path once — multer already saves relative to cwd
  const filePath = req.file ? path.resolve(req.file.path) : null;

  try {
    if (!req.file || !filePath) {
      return next(responseError(406, "File not uploaded"));
    }

    const { branchId } = req.body;

    if (!branchId || !checkObjectId(branchId)) {
      safeUnlink(filePath);
      return next(responseError(406, "Invalid branch Id"));
    }

    const uploadDateObj = new Date();
    const branchIdObj = new mongoose.Types.ObjectId(branchId);
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    let processedData = [];

    if (fileExt === ".json") {
      console.log(`[Reg] Reading JSON file: ${filePath}`);
      // Use async readFile — NEVER use readFileSync for large files in Node!
      const fileContent = await fs.promises.readFile(filePath, "utf8");
      console.log(`[Reg] File read complete. Size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
      
      console.log(`[Reg] Parsing JSON...`);
      const parsedContent = JSON.parse(fileContent);
      console.log(`[Reg] JSON parsed successfully.`);

      if (Array.isArray(parsedContent)) {
        console.log(`[Reg] Processing as array of ${parsedContent.length} rows`);
        processedData = parsedContent.map((row) =>
          processRow(row, uploadDateObj, branchIdObj)
        );
      } else if (parsedContent.headers && parsedContent.data) {
        const headers = parsedContent.headers;
        console.log(`[Reg] Processing as {headers, data} object with ${headers.length} headers and ${parsedContent.data.length} rows`);
        
        // Pre-calculate mapped index structures for direct extraction
        const indices = keyOfDocuments
          .map((key) => ({ key, idx: headers.indexOf(key) }))
          .filter((item) => item.idx !== -1);

        const dataLen = parsedContent.data.length;
        console.log(`[Reg] Extracting data based on ${indices.length} matched columns...`);

        const processedDataList = [];
        for (let r = 0; r < dataLen; r++) {
          const rowArr = parsedContent.data[r];
          if (!rowArr || !Array.isArray(rowArr)) continue;

          let newRow = {
            branch_id: branchIdObj,
            is_released: false,
            createdAt: uploadDateObj,
            updatedAt: uploadDateObj,
            __v: 0,
          };

          for (let j = 0; j < indices.length; j++) {
            const { key, idx } = indices[j];
            const val = rowArr[idx];
            if (val) {
              if (key === "rc_no") {
                const clean = String(val).trim().replace(/[^a-zA-Z0-9]/g, "");
                newRow[key] = clean;
                newRow["last_four_digit_rc"] = getLastFourChar(clean);
              } else if (key === "chassis_no") {
                const clean = String(val).trim().replace(/[^a-zA-Z0-9]/g, "");
                newRow[key] = clean;
                newRow["last_four_digit_chassis"] = getLastFourChar(clean);
              } else {
                newRow[key] = val;
              }
            }
          }
          processedDataList.push(newRow);
          
          if (r > 0 && r % 20000 === 0) {
            console.log(`[Reg] Processed ${r} rows...`);
          }
        }
        processedData = processedDataList;
      }
    } else {
      console.log(`[Reg] Processing as CSV file via legacy stream: ${filePath}`);
      // Legacy fallback for CSV
      const jsonArray = await CSVToJSON().fromFile(filePath);
      processedData = jsonArray.map((row) =>
        processRow(row, uploadDateObj, branchIdObj)
      );
    }

    console.log(`[Reg] Data transformation complete. Final count: ${processedData.length}`);

    // Always clean up the uploaded file after reading
    safeUnlink(filePath);

    if (!processedData || processedData.length === 0) {
      console.log(`[Reg] No data to insert, returning success.`);
      return res.status(200).json({
        message: "Data successfully inserted",
        numDocumentsInserted: 0,
      });
    }

    // Batch insert — bypass Mongo's 16.7MB BSON payload limit
    const BATCH_SIZE = 5000;
    const CHUNK_SIZE = 2;
    const batches = [];

    for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
      batches.push(processedData.slice(i, i + BATCH_SIZE));
    }

    console.log(`[Reg] Starting batch insertion of ${batches.length} batches (${BATCH_SIZE} docs/batch)...`);

    for (let i = 0; i < batches.length; i += CHUNK_SIZE) {
      const chunk = batches.slice(i, i + CHUNK_SIZE);
      console.log(`[Reg] Inserting chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(batches.length / CHUNK_SIZE)}...`);
      
      await Promise.all(
        chunk.map((batch, idx) =>
          Vehicle.collection.insertMany(batch, { ordered: false }).then(result => {
             // console.log(`[Reg] Batch ${i + idx + 1} inserted successfully.`);
             return result;
          }).catch((err) => {
            if (err.name !== "BulkWriteError" && err.code !== 11000) {
              console.error(`[Reg] Batch error:`, err.message || err);
              throw err;
            }
          })
        )
      );
    }
    
    console.log(`[Reg] All batches inserted. Updating branch stats...`);

    // Update branch record count
    await Branch.findByIdAndUpdate(branchId, {
      records: processedData.length,
    });

    console.log(`Successfully inserted ${processedData.length} records.`);

    return res.status(200).json({
      message: "Data successfully inserted",
      numDocumentsInserted: processedData.length,
    });
  } catch (error) {
    // Always clean up the file even if an error occurs
    if (filePath) safeUnlink(filePath);
    console.error("Bulk Registration Error:", error.message || error);
    return next(responseError(500, "Internal server error: " + (error.message || "")));
  }
};

module.exports = { newBulkVehicleRegistration };
