-- Fix PvP stats by recalculating from games table

-- Reset all PvP stats to 0 first
UPDATE profiles SET
  pvp_wins = 0,
  pvp_losses = 0,
  pvp_draws = 0;

-- Calculate and update PvP wins
UPDATE profiles p SET pvp_wins = COALESCE(wins_count.count, 0)
FROM (
  SELECT winner::uuid as player_id, COUNT(*) as count
  FROM games
  WHERE status = 'completed'
    AND is_ai_game = false
    AND winner IS NOT NULL
    AND winner != 'ai'
  GROUP BY winner::uuid
) wins_count
WHERE p.id = wins_count.player_id;

-- Calculate and update PvP losses
UPDATE profiles p SET pvp_losses = COALESCE(losses_count.count, 0)
FROM (
  SELECT loser_id, COUNT(*) as count
  FROM (
    SELECT
      CASE
        WHEN winner::uuid = player_x THEN player_o
        ELSE player_x
      END as loser_id
    FROM games
    WHERE status = 'completed'
      AND is_ai_game = false
      AND winner IS NOT NULL
      AND winner != 'ai'
      AND player_o IS NOT NULL
  ) losers
  GROUP BY loser_id
) losses_count
WHERE p.id = losses_count.loser_id;

-- Calculate and update PvP draws
UPDATE profiles p SET pvp_draws = COALESCE(draws_count.count, 0)
FROM (
  SELECT player_id, COUNT(*) as count
  FROM (
    SELECT player_x as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = false AND winner IS NULL
    UNION ALL
    SELECT player_o as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = false AND winner IS NULL AND player_o IS NOT NULL
  ) draw_players
  GROUP BY player_id
) draws_count
WHERE p.id = draws_count.player_id;

-- Recalculate overall wins/losses/draws from all game types
-- First reset
UPDATE profiles SET wins = 0, losses = 0, draws = 0;

-- Update overall wins (PvP + AI)
UPDATE profiles p SET wins = COALESCE(total_wins.count, 0)
FROM (
  SELECT player_id, COUNT(*) as count
  FROM (
    -- PvP wins
    SELECT winner::uuid as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = false AND winner IS NOT NULL AND winner != 'ai'
    UNION ALL
    -- AI wins (player_x wins against AI)
    SELECT player_x as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = true AND winner = player_x::text
  ) all_wins
  GROUP BY player_id
) total_wins
WHERE p.id = total_wins.player_id;

-- Update overall losses (PvP + AI)
UPDATE profiles p SET losses = COALESCE(total_losses.count, 0)
FROM (
  SELECT player_id, COUNT(*) as count
  FROM (
    -- PvP losses
    SELECT
      CASE WHEN winner::uuid = player_x THEN player_o ELSE player_x END as player_id
    FROM games
    WHERE status = 'completed' AND is_ai_game = false AND winner IS NOT NULL AND winner != 'ai' AND player_o IS NOT NULL
    UNION ALL
    -- AI losses (player lost to AI)
    SELECT player_x as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = true AND winner = 'ai'
  ) all_losses
  GROUP BY player_id
) total_losses
WHERE p.id = total_losses.player_id;

-- Update overall draws
UPDATE profiles p SET draws = COALESCE(total_draws.count, 0)
FROM (
  SELECT player_id, COUNT(*) as count
  FROM (
    -- PvP draws (both players)
    SELECT player_x as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = false AND winner IS NULL
    UNION ALL
    SELECT player_o as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = false AND winner IS NULL AND player_o IS NOT NULL
    UNION ALL
    -- AI draws
    SELECT player_x as player_id FROM games
    WHERE status = 'completed' AND is_ai_game = true AND winner IS NULL
  ) all_draws
  GROUP BY player_id
) total_draws
WHERE p.id = total_draws.player_id;
