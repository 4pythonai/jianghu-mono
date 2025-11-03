#!/bin/bash

echo "=== 端口 2348 详细诊断脚本 ==="
echo ""

# 1. 检查主机端口监听状态（最关键的检查）
echo "【1】检查主机端口监听状态（关键）:"
echo "使用 ss 命令:"
ss -tlnp 2>/dev/null | grep 2348 || echo "⚠️  端口未在主机上监听"
echo ""

echo "使用 netstat 命令:"
netstat -tlnp 2>/dev/null | grep 2348 || echo "⚠️  端口未在主机上监听"
echo ""

echo "如果看到 127.0.0.1:2348 → Docker 只绑定到本地"
echo "如果看到 0.0.0.0:2348 → Docker 绑定正确"
echo "如果什么都没看到 → 端口可能没在监听"
echo ""

# 2. 检查 iptables INPUT 链（关键）
echo "【2】检查 iptables INPUT 链（关键）:"
echo "查看 INPUT 链的前20条规则:"
sudo iptables -L INPUT -n -v 2>/dev/null | head -20 || echo "需要 sudo 权限"
echo ""

echo "查看 INPUT 链的默认策略:"
sudo iptables -L INPUT -n --line-numbers 2>/dev/null | head -3 || echo "需要 sudo 权限"
echo ""

# 3. 检查 iptables DOCKER 链
echo "【3】检查 iptables DOCKER 链:"
sudo iptables -L DOCKER -n -v 2>/dev/null | grep -A 5 -B 5 2348 || echo "未找到 2348 端口的 DOCKER 链规则"
echo ""

# 4. 检查 DOCKER-USER 链（Docker 的新版本使用）
echo "【4】检查 iptables DOCKER-USER 链:"
sudo iptables -L DOCKER-USER -n -v 2>/dev/null | head -20 || echo "DOCKER-USER 链不存在或为空"
echo ""

# 5. 检查所有与 2348 相关的 iptables 规则
echo "【5】检查所有与 2348 相关的 iptables 规则:"
sudo iptables -L -n -v 2>/dev/null | grep -i 2348 || echo "未找到 2348 端口的规则"
echo ""

# 6. 检查 Docker 容器的实际端口绑定
echo "【6】检查 Docker 容器端口绑定:"
CONTAINER_ID=$(docker ps --filter "name=api-x" --format "{{.ID}}" | head -1)
if [ -n "$CONTAINER_ID" ]; then
    echo "容器 ID: $CONTAINER_ID"
    echo "端口映射详情:"
    docker inspect $CONTAINER_ID --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> HostIp:{{(index $conf 0).HostIp}} HostPort:{{(index $conf 0).HostPort}}{{"\n"}}{{end}}' 2>/dev/null | grep 2348
    echo ""
    docker port $CONTAINER_ID 2348 2>/dev/null || echo "无法获取端口映射"
else
    echo "未找到 api-x 容器"
fi
echo ""

# 7. 测试本地连接
echo "【7】本地连接测试:"
timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/2348" 2>/dev/null && echo "✓ 本地 127.0.0.1:2348 连接成功" || echo "✗ 本地 127.0.0.1:2348 连接失败"
timeout 2 bash -c "echo > /dev/tcp/0.0.0.0/2348" 2>/dev/null && echo "✓ 本地 0.0.0.0:2348 连接成功" || echo "✗ 本地 0.0.0.0:2348 连接失败"
echo ""

# 8. 检查容器内端口监听
echo "【8】检查容器内端口监听状态:"
if [ -n "$CONTAINER_ID" ]; then
    echo "容器内 netstat/ss 输出:"
    docker exec $CONTAINER_ID sh -c "netstat -tlnp 2>/dev/null | grep 2348 || ss -tlnp 2>/dev/null | grep 2348 || echo '无法检查（需要安装 netstat/ss）'"
else
    echo "未找到容器"
fi
echo ""

# 9. 检查进程监听
echo "【9】检查哪个进程在监听 2348 端口:"
sudo lsof -i :2348 2>/dev/null || sudo ss -tlnp | grep 2348 | awk '{print $NF}' || echo "无法检查进程"
echo ""

echo "=== 诊断结果和建议 ==="
echo ""
echo "【判断标准】"
echo "1. 如果 ss/netstat 显示 0.0.0.0:2348 → Docker 绑定正确"
echo "2. 如果 iptables INPUT 链默认策略是 DROP/REJECT → 需要添加允许规则"
echo "3. 如果 DOCKER-USER 链有规则 → 可能阻止了外部访问"
echo ""
echo "【可能的解决方案】"
echo ""
echo "方案 A: 添加 iptables 规则（如果 INPUT 链默认拒绝）"
echo "  sudo iptables -I INPUT -p tcp --dport 2348 -j ACCEPT"
echo "  sudo iptables-save > /etc/sysconfig/iptables"
echo ""
echo "方案 B: 在 DOCKER-USER 链添加规则（如果使用 Docker）"
echo "  sudo iptables -I DOCKER-USER -p tcp --dport 2348 -j ACCEPT"
echo "  sudo iptables-save > /etc/sysconfig/iptables"
echo ""
echo "方案 C: 检查安全组设置"
echo "  确认 VPS 控制台安全组已开放 2348 端口（TCP协议）"
echo ""
echo "方案 D: 临时测试（不推荐生产环境）"
echo "  sudo iptables -P INPUT ACCEPT  # 临时允许所有输入"
echo "  # 测试连接，如果成功则说明是 iptables 问题"
echo "  sudo iptables -P INPUT DROP   # 恢复（根据你的实际策略）"

