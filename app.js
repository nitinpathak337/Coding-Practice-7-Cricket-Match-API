const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDB();

//list of players API

app.get("/players/", async (request, response) => {
  const getPlayersListQuery = `
    select player_id as playerId,
    player_name as playerName 
    from player_details;`;
  const getPlayersList = await db.all(getPlayersListQuery);
  response.send(getPlayersList);
});

//get player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select player_id as playerId,
    player_name as playerName
    from player_details
    where player_id=${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(getPlayer);
});

//update player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    Update player_details
    set player_name='${playerName}'
    where player_id=${playerId};`;
  const updatePlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//get match details API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select  match_id as matchId,
    match, year from 
    match_details where
    match_id=${matchId};`;
  const getMatch = await db.get(getMatchQuery);
  response.send(getMatch);
});

//match of a player API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `
    select match_id as matchId,
    match,year from 
    match_details where
    match_id in (select match_id
        from player_match_score
        where player_id=${playerId});`;
  const playerMatch = await db.all(playerMatchesQuery);
  response.send(playerMatch);
});

//players of a match  API

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const playersInMatchQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersInMatch = await db.all(playersInMatchQuery);
  response.send(
    playersInMatch.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//stats of a player API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const statsQuery = `
    select player_details.player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_details

    inner join player_match_score
    on player_details.player_id
    =player_match_score.player_id
    where player_details.player_id=${playerId}
    group by player_details.player_id;`;
  const stats = await db.get(statsQuery);
  response.send(stats);
});

module.exports = app;
