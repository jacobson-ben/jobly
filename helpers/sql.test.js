const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("updateSQL", function () {
  test("returns expected SQL columns and $pairs", function () {
    const data = {firstName: "Ben", email: "testing@gmail.com"};
    const jsToSQL = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };
    let response = sqlForPartialUpdate(data, jsToSQL);
    expect(response).toEqual({
      setCols: "\"first_name\"=$1, \"email\"=$2",
      values: ["Ben", "testing@gmail.com"]
    })
  })

  test("nothing passed in", function () {
    const data = {};
    const jsToSQL = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };
    expect(() => sqlForPartialUpdate(data, jsToSQL)).toThrow("No data")
  })
})