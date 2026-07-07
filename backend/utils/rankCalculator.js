function calculateRank(user) {
  const { points, totalSQLs, totalCloses } = user;
  if (points >= 200 || totalCloses >= 25) return 'champion';
  if (points >= 100 || totalCloses >= 10) return 'gold_closer';
  if (points >= 50 || totalCloses >= 5)  return 'elite_closer';
  if (points >= 20 || totalCloses >= 1)  return 'closer';
  if (points >= 10 || totalSQLs >= 2)    return 'hunter';
  return 'rookie';
}

function getPointsForEvent(event) {
  const pointsMap = {
    'lead_submitted': 1,
    'lead_became_warm': 2,
    'lead_became_sql': 4,
    'deal_closed': 13,            // for lead researcher
    'deal_closed_closer': 7,      // for sales closer
    'client_retained_3mo': 10,    // for closer
  };
  return pointsMap[event] || 0;
}

module.exports = { calculateRank, getPointsForEvent };
