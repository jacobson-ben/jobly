const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
const Job = require("./job.js");

let jobIds = []

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM users");
  await db.query("DELETE from jobs")
  await db.query("DELETE from applications")

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  let result = await db.query(`
  INSERT INTO jobs(title, salary, equity, company_handle)
  VALUES ('Software Engineer', 120000, 0.002, 'c1'),
         ('Scientist', 80000, 0.5, 'c2')
  RETURNING id`);
  let jobs = result.rows
  jobs.map(r => jobIds.push(r.id))

  
  await db.query(`
  INSERT INTO users(username,
    password,
    first_name,
    last_name,
    email)
    VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
    ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
    RETURNING username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]);

    await db.query(`
      INSERT into applications(username, job_id, state)
      VALUES ('u1', ${jobIds[0]}, 'applied'),
             ('u2', ${jobIds[1]}, 'applied')`);

  }

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds
};