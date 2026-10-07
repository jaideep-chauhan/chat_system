INSERT INTO users (name, email) VALUES
  ('Jaideep', 'jaideep@example.com'),
  ('Rahul', 'rahul@example.com'),
  ('Priya', 'priya@example.com'),
  ('Amit', 'amit@example.com')
ON CONFLICT (email) DO NOTHING;
