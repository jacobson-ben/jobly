"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, companyHandle  }
   *
   * Throws BadRequestError if company and job already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
          `SELECT company_handle, title
           FROM jobs
           WHERE 
           company_handle = $1
           AND title = $2`,
        [company_handle, title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${company_handle} & ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle )
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle as "companyHandle"`,
        [
          title,
          salary,
          equity,
          company_handle
        ],
    );
    const job = result.rows[0];
    return job;
  }

   /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const jobVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

 /** Delete given job from database; returns id.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job id: ${id}`);
  }

    /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  equity,
                  salary,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job id: ${id}`);

    return job;
  }

   /** Find all jobs.
   *
   * If query parameters passed in, adds them as SQL filters.
   * jobs/?minSalary=100000 -> only gets companies with minSalary >= $100k
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filters) {
    let sqlToAdd = "WHERE 1 = 1"
    let sqlValues = [];
    let minSalary, hasEquity, title;

    if (filters !== undefined) {
      minSalary = filters.minSalary;
      hasEquity = filters.hasEquity;
      title = filters.title;
    }

    if (minSalary !== undefined) {
      sqlValues.push(minSalary);
      sqlToAdd += ` AND salary >= $${sqlValues.length}`;
    } 

    if (hasEquity !== undefined) {
        
        
        if (hasEquity === "true") {
            hasEquity = 0;
            sqlValues.push(hasEquity);
            sqlToAdd += ` AND equity > $${sqlValues.length}`;
        } else {
            hasEquity = 0;
            sqlValues.push(hasEquity);
            sqlToAdd += ` AND equity is NULL OR equity = $${sqlValues.length}`
        }
        
    }

    
    if (title !== undefined) {
      title = title.toLowerCase();
      sqlValues.push(`%${title}%`);
      sqlToAdd += ` AND LOWER(title) LIKE $${sqlValues.length}`;
      console.log('sqlValues', sqlValues);
    } 
    
    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ${sqlToAdd}
           ORDER BY company_handle`, sqlValues );
    return jobsRes.rows;
  }


}


module.exports = Job;
