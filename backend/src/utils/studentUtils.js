
function isRollInRange(rollno, start, end) {
  if (!rollno || !start || !end) return false;
  return rollno.localeCompare(start) >= 0 && rollno.localeCompare(end) <= 0;
}

function isRollInStringRange(roll, rangeStr) {
  if (!roll || !rangeStr) return false;
  const parts = rangeStr.split("-").map((p) => p.trim().toUpperCase());
  if (parts.length !== 2) return false;
  return isRollInRange(roll.toUpperCase(), parts[0], parts[1]);
}

function excelDateToDDMMYYYY(excelDate) {
  if (!excelDate) return "";

  // If already string like 28-08-2005
  if (typeof excelDate === "string" && excelDate.includes("-")) {
    return excelDate;
  }

  // Excel serial number → JS date
  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);

  const day = String(jsDate.getDate()).padStart(2, "0");
  const month = String(jsDate.getMonth() + 1).padStart(2, "0");
  const year = jsDate.getFullYear();

  return `${day}-${month}-${year}`;
}

module.exports = {
  isRollInRange,
  isRollInStringRange,
  excelDateToDDMMYYYY,
};
