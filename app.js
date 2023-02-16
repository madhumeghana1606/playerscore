const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const changePlayers = (eObj) => {
  return {
    playerId: eObj.player_id,
    playerName: eObj.player_name,
  };
};

const changeMatch = (eObj) => {
  return {
    matchId: eObj.match_id,
    match: eObj.match,
    year: eObj.year,
  };
};

app.get("/players/", async (request, response) => {
  const getAllQuery = `SELECT * FROM player_details;`;
  const allPlayers = await db.all(getAllQuery);
  response.send(allPlayers.map((eachObject) => changePlayers(eachObject)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSingleQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const singlePlayer = await db.get(getSingleQuery);
  response.send(changePlayers(singlePlayer));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putPlayerQuery = `UPDATE player_details SET player_name = '${playerName}';`;
  const putPlayer = await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const getMatch = await db.get(getMatchQuery);
  response.send(changeMatch(getMatch));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = ` SELECT match_details.match_id AS matchId, match_details.match AS match, match_details.year AS year
    FROM (player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id) AS T INNER JOIN match_details ON match_details.match_id=T.match_id
    WHERE T.player_id=${playerId};`;
  const playerMatchArr = await db.all(playerMatchQuery);
  response.send(playerMatchArr.map((eachObje) => changeMatch(eachObje)));
});

app.get(" /matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName
                          FROM (match_details INNER JOIN player_match_score ON match_details.match_id=player_match_score.match_id) AS T INNER JOIN player_details ON player_deatils.player_id=T.player_id
                          WHERE T.match_id = ${matchId};`;
  const matches = await db.all(matchQuery);
  response.send(matches.map((eachOb) => changePlayers(eachOb)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const scoreQuery = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName, SUM(player_match_score.score) AS totalScore,SUM(player_match_score.fours) AS totalFours, SUM(player_match_score.sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const scores = await db.get(scoreQuery);
  response.send({
    playerID: scores.player_id,
    playerName: scores.player_name,
    totalScore: scores.totalScore,
    totalFours: scores.totalFours,
    totalSixes: scores.totalSixes,
  });
});

module.exports = app;
