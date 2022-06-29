const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let databaseObject = null;
const databaseAndServerInitialization = async () => {
  try {
    databaseObject = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
databaseAndServerInitialization();

const convertStateDbObjectToResponseObject = (input) => {
  return {
    stateId: input.state_id,
    stateName: input.state_name,
    population: input.population,
  };
};

const convertDistrictList = (input) => {
  return {
    districtId: input.district_id,
    districtName: input.district_name,
    stateId: input.state_id,
    cases: input.cases,
    cured: input.cured,
    active: input.active,
    deaths: input.deaths,
  };
};

const convertStatsList = (input) => {
  return {
    totalCases: input.cases,
    totalCured: input.cured,
    totalActive: input.active,
    totalDeaths: input.deaths,
  };
};
// LIST OF ALL STATES 1

app.get("/states/", async (request, response) => {
  const allStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await databaseObject.all(allStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

// STATES BY ID 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateByIdQuery = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const resultStateById = await databaseObject.get(stateByIdQuery);
  response.send(convertStateDbObjectToResponseObject(resultStateById));
});

//NEW DISTRICT POST IN STATE 3

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const newDistrictQuery = `
    INSERT INTO
      district (state_id, district_name, cases, cured, active, deaths)
    VALUES
      ( ${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await databaseObject.run(newDistrictQuery);
  response.send("District Successfully Added");
});

//DISTRICT BY ID 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtByIdQuery = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id= ${districtId};`;
  const resultDistrictById = await databaseObject.get(districtByIdQuery);
  response.send(convertDistrictList(resultDistrictById));
});

// DELETE DISTRICT BY ID 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const delDistrictQuery = `
    DELETE FROM
      district
    WHERE
      district_id= ${districtId};`;
  const delDistrictResult = await databaseObject.run(delDistrictQuery);
  response.send("District Removed");
});

// UPDATE DISTRICT BY ID 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictByQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = '${cases}',
    cured = ${cured},
    active = '${active}', 
    deaths = ${deaths}
  WHERE
    district_id= ${districtId};`;
  await databaseObject.run(updateDistrictByQuery);
  response.send("District Details Updated");
});

// STATE STATS BY STATE ID 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await databaseObject.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//STATE NAME BY DISTRICT ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateByQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE
      district_id= ${districtId};`;
  const stateBy = await databaseObject.get(stateByQuery);
  response.send({ stateName: stateBy.state_name });
});

module.exports = app;
