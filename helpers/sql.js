const { BadRequestError } = require("../expressError");

// Function accepts an object of the data to be updated and converts it to a string
// that can be passed into the SQL database (JS names are in camelCase) in order to 
// update the data. For example, first_name=$1.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate)
  };
}

module.exports = { sqlForPartialUpdate };


