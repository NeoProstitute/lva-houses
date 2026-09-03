UPDATE houses
SET icon_url = CASE name
  WHEN 'Curiositas' THEN '/house-emblems/curiositas-mark-v5.png'
  WHEN 'Veritas' THEN '/house-emblems/veritas-mark-v5.png'
  WHEN 'Sapientia' THEN '/house-emblems/sapientia-mark-v5.png'
  ELSE icon_url
END
WHERE name IN ('Curiositas', 'Veritas', 'Sapientia');
