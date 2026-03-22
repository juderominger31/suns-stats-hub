export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Get date from query param or use yesterday
    var dateStr = req.query.date;
    if (!dateStr) {
      var d = new Date();
      d.setDate(d.getDate() - 1);
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      var dd = String(d.getDate()).padStart(2, '0');
      var yyyy = d.getFullYear();
      dateStr = mm + '/' + dd + '/' + yyyy;
    }

    var url = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';

    // Try live scoreboard first
    var response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com'
      }
    });

    if (!response.ok) throw new Error('NBA API returned ' + response.status);

    var data = await response.json();
    var games = data.scoreboard ? data.scoreboard.games : [];

    var results = games.map(function(g) {
      var homeTeam = g.homeTeam;
      var awayTeam = g.awayTeam;
      var status = g.gameStatusText || '';
      var homeScore = homeTeam.score !== undefined ? homeTeam.score : '';
      var awayScore = awayTeam.score !== undefined ? awayTeam.score : '';
      return {
        home: homeTeam.teamTricode,
        homeName: homeTeam.teamName,
        homeScore: homeScore,
        away: awayTeam.teamTricode,
        awayName: awayTeam.teamName,
        awayScore: awayScore,
        status: status,
        gameId: g.gameId
      };
    });

    return res.status(200).json({ games: results, date: dateStr });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
