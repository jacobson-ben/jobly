"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
  jobHolder
} = require("./_testCommon");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
      title: "Software Engineer",
      salary: 90000,
      equity: 0.0025,
      company_handle: "c2"
    };
  
    test("not ok for nonadmin", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("ok for admin", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        title: "Software Engineer",
        salary: 90000,
        equity: "0.0025",
        companyHandle: "c2",
        id: expect.anything()
      });
    });
  
    test("bad request with missing data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            salary: 40000,
            equity: "0.5",
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: "Software Engineer",
            salary: 90000,
            equity: "0.0025",
            companyHandle: "Not a company"
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  
  /************************************** GET /jobs */
  
  describe("GET /jobs", function () {
  
    test("ok for anon", async function () {
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs:
            [
                  {
                    id: expect.anything(),
                    title: "Software Engineer",
                    salary: 120000,
                    equity: "0.002",
                    companyHandle: "c1"
                  },

                  {
                    id: expect.anything(),  
                    title: "Scientist",
                    salary: 80000,
                    equity: "0.5",
                    companyHandle: "c2"
                  }
                  
            ],
      });
    });
  
    test("passes with query params", async function () {
      const resp = await request(app).get("/jobs/?hasEquity=true");
      expect(resp.body).toEqual({
        jobs:
            [
                {
                    id: expect.anything(),
                    title: "Software Engineer",
                    salary: 120000,
                    equity: "0.002",
                    companyHandle: "c1"
                  },

                  {
                    id: expect.anything(),  
                    title: "Scientist",
                    salary: 80000,
                    equity: "0.5",
                    companyHandle: "c2"
                  }
                  
            ],
      });
    });
  
  
    test("fails: test next() handler", async function () {
      // there's no normal failure event which will cause this route to fail ---
      // thus making it hard to test that the error-handler works with it. This
      // should cause an error, all right :)
      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .get("/jobs")
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });
  });
  
//   /************************************** GET /jobs/:handle */
  
  describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        console.log(jobHolder);
      const resp = await request(app).get(`/jobs/${jobHolder[0]}`);
      expect(resp.body).toEqual({
        id: expect.anything(),
        title: "Software Engineer",
        salary: 120000,
        equity: "0.002",
        companyHandle: "c1"
      });
    });
  
  
    test("not found or no such job", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
  });
  
  /************************************** PATCH /jobs/:handle */
  
  describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobHolder[0]}`)
          .send({
            salary: 90000,
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({
            id: expect.anything(),
            title: "Software Engineer",
            salary: 90000,
            equity: "0.002",
            companyHandle: "c1"
      });
    }); 
  
    test("unauth for non Admin", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobHolder[0]}`)
          .send({
            salary: 200000,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobHolder[1]}`)
          .send({
            title: "Superhero",
          });
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found or no such company", async function () {
      const resp = await request(app)
          .patch(`/jobs/0`)
          .send({
            equity: 0.99,
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request on company_handle change attempt", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobHolder[0]}`)
          .send({
            company_handle: "c10",
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request on invalid data", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobHolder[0]}`)
          .send({
            equity: 200,
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  
//   /************************************** DELETE /jobs/:handle */
  
  describe("DELETE /jobs/:id", function () {
    test("works for users", async function () {
      const resp = await request(app)
          .delete(`/jobs/${jobHolder[1]}`)
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({ deleted: `${jobHolder[1]}` });
    });
  
  
    test("doesn't work non Admin", async function () {
      const resp = await request(app)
          .delete(`/jobs/${jobHolder[0]}`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/${jobHolder[0]}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app)
          .delete(`/jobs/0`)
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
  