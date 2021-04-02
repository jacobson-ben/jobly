"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "First Job",
    salary: 70000,
    equity: "0",
    company_handle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(
      {
        id: expect.anything(),
        title: "First Job",
        salary: 70000,
        equity: "0",
        companyHandle: "c1",
      }
    );

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      newJob,
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {

  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.anything(),
        title: "Software Engineer",
        salary: 120000,
        equity: "0.002",
        companyHandle: "c1",
      },
      {
        id: expect.anything(),
        title: "Scientist",
        salary: 80000,
        equity: "0.5",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: with min salary filter", async function () {
    let jobs = await Job.findAll({minSalary:90000});
    expect(jobs).toEqual([
      {
        id: expect.anything(),
        title: "Software Engineer",
        salary: 120000,
        equity: "0.002",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: equity filter", async function () {
    let jobs = await Job.findAll({hasEquity: "false"});
    expect(jobs).toEqual([
    ]);
  });

  //test non existent prop find all min employees

  test("not working:name like filter", async function () {
    let jobs = await Job.findAll({ title:"Engineer"});
    expect(jobs).toEqual([
      {
        id: expect.anything(),
        title: "Software Engineer",
        salary: 120000,
        equity: "0.002",
        companyHandle: "c1",
      },
    ]);
  });


});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(jobIds[0]);
    expect(job).toEqual({
        id: jobIds[0],
        title: "Software Engineer",
        salary: 120000,
        equity: "0.002",
        companyHandle: "c1",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(2000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Software Engineer",
    salary: 80000,
    equity: "0.005",
  };

  test("works", async function () {
    let job = await Job.update(jobIds[0], updateData);
    expect(job).toEqual({
      id: jobIds[0],
      ...updateData,
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${jobIds[0]}`);
    expect(result.rows).toEqual([{
      id: jobIds[0],
      ...updateData,
      company_handle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New Software Engineer",
      salary: null,
      equity: null,
    };

    let job = await Job.update(jobIds[0], updateDataSetNulls);
    expect(job).toEqual({
      id: jobIds[0],
      ...updateDataSetNulls,
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = ${jobIds[0]}`);
    expect(result.rows).toEqual([{
      id: jobIds[0],
      ...updateDataSetNulls,
      company_handle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(-1, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(jobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIds[0]);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${jobIds[0]}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
