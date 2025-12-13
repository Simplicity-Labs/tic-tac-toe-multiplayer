-- Allow users to delete games they created (for canceling waiting games)
DROP POLICY IF EXISTS "Users can delete their own waiting games" ON games;
CREATE POLICY "Users can delete their own waiting games"
ON games
FOR DELETE
USING (
  player_x = auth.uid() AND status = 'waiting'
);
