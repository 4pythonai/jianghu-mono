-- 球队测试数据
-- 用户 837590 作为两个球队的超级管理员

-- 创建球队
INSERT INTO t_team (team_name, team_avatar, sologan, description, creator, status, create_date) VALUES
('翠湖高尔夫俱乐部', '/assets/icons/icons8-team-48.png', '挥杆人生，乐在其中', '翠湖高尔夫俱乐部成立于2020年，汇聚了一群热爱高尔夫的球友。', 837590, 'active', NOW()),
('阳光高尔夫队', '/assets/icons/icons8-team-48.png', '阳光下挥杆，快乐每一天', '周末约球，轻松愉快的高尔夫爱好者社群。', 837590, 'active', NOW());

-- 为用户837590添加owner身份
INSERT INTO t_team_member (team_id, user_id, role, status, join_time) VALUES
((SELECT id FROM t_team WHERE team_name = '翠湖高尔夫俱乐部' LIMIT 1), 837590, 'owner', 'active', NOW()),
((SELECT id FROM t_team WHERE team_name = '阳光高尔夫队' LIMIT 1), 837590, 'owner', 'active', NOW());

-- 添加其他成员（唐昆、nice6、ecoeco、JoYa、阿咪阿咪红）
INSERT INTO t_team_member (team_id, user_id, role, status, join_time) VALUES
((SELECT id FROM t_team WHERE team_name = '翠湖高尔夫俱乐部' LIMIT 1), 59, 'admin', 'active', NOW()),
((SELECT id FROM t_team WHERE team_name = '翠湖高尔夫俱乐部' LIMIT 1), 122, 'member', 'active', NOW()),
((SELECT id FROM t_team WHERE team_name = '翠湖高尔夫俱乐部' LIMIT 1), 126, 'member', 'active', NOW()),
((SELECT id FROM t_team WHERE team_name = '阳光高尔夫队' LIMIT 1), 245, 'admin', 'active', NOW()),
((SELECT id FROM t_team WHERE team_name = '阳光高尔夫队' LIMIT 1), 246, 'member', 'active', NOW());

