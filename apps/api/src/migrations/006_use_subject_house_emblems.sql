UPDATE houses
SET icon_url = CASE name
  WHEN 'Curiositas' THEN '/house-emblems/curiositas-mark-v3.png'
  WHEN 'Veritas' THEN '/house-emblems/veritas-mark-v3.png'
  WHEN 'Sapientia' THEN '/house-emblems/sapientia-mark-v3.png'
  ELSE icon_url
END
WHERE name IN ('Curiositas', 'Veritas', 'Sapientia');
