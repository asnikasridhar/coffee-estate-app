UPDATE users
SET username = 'estateuser1',
    modified_on = CURRENT_TIMESTAMP,
    modified_by = 'Migration 0021'
WHERE user_id = 1
  AND username = 'Asnika Sridhar';
