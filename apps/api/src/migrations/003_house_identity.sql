ALTER TABLE houses
  ADD COLUMN meaning text NOT NULL DEFAULT '',
  ADD COLUMN symbol text NOT NULL DEFAULT '',
  ADD COLUMN description text NOT NULL DEFAULT '';

UPDATE houses
SET
  name = CASE name
    WHEN 'Aster' THEN 'Curiositas'
    WHEN 'Cedar' THEN 'Humanitas'
    WHEN 'Ember' THEN 'Veritas'
    WHEN 'Sol' THEN 'Sapientia'
  END,
  color = CASE name
    WHEN 'Aster' THEN '#FFDE69'
    WHEN 'Cedar' THEN '#EE3F6C'
    WHEN 'Ember' THEN '#497EDF'
    WHEN 'Sol' THEN '#652B90'
  END,
  meaning = CASE name
    WHEN 'Aster' THEN 'Curiosity'
    WHEN 'Cedar' THEN 'Empathy'
    WHEN 'Ember' THEN 'Honesty'
    WHEN 'Sol' THEN 'Wisdom'
  END,
  symbol = CASE name
    WHEN 'Aster' THEN 'Set of keys'
    WHEN 'Cedar' THEN 'Hand'
    WHEN 'Ember' THEN 'Mirror'
    WHEN 'Sol' THEN 'Owl'
  END,
  description = CASE name
    WHEN 'Aster' THEN 'Illumination begins with questions, discovery and the courage to unlock new knowledge.'
    WHEN 'Cedar' THEN 'Empathy brings people together through care, understanding and shared humanity.'
    WHEN 'Ember' THEN 'Honesty asks us to reflect clearly, speak truthfully and act with integrity.'
    WHEN 'Sol' THEN 'Wisdom grows through thoughtful learning, perspective and purposeful choices.'
  END,
  icon_url = CASE name
    WHEN 'Aster' THEN '/house-emblems/curiositas.png'
    WHEN 'Cedar' THEN NULL
    WHEN 'Ember' THEN '/house-emblems/veritas.png'
    WHEN 'Sol' THEN '/house-emblems/sapientia.jpeg'
  END
WHERE name IN ('Aster', 'Cedar', 'Ember', 'Sol');
