INSERT INTO projects(name,repo,status,uptime)
VALUES ('Demo Production API','demo/reliability-api','Healthy',99.96)
ON CONFLICT (repo) DO NOTHING;
