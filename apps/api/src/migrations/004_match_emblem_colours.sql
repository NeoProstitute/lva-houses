UPDATE houses
SET color = CASE name
  WHEN 'Curiositas' THEN '#FFDA61'
  WHEN 'Humanitas' THEN '#EE3F6C'
  WHEN 'Veritas' THEN '#4677E6'
  WHEN 'Sapientia' THEN '#602889'
  ELSE color
END
WHERE name IN ('Curiositas', 'Humanitas', 'Veritas', 'Sapientia');
