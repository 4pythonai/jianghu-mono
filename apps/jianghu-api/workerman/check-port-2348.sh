#!/bin/bash

echo "=== 端口 2348 连通性诊断脚本 ==="
echo ""

# 1. 检查 Docker 容器端口映射
echo "1. 检查 Docker 容器端口映射:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "NAMES|2348"
echo ""

# 2. 检查端口是否在监听（在容器内）
echo "2. 检查容器内端口监听状态:"
CONTAINER_ID=$(docker ps --filter "publish=2348" --format "{{.ID}}" | head -1)
if [ -n "$CONTAINER_ID" ]; then
    echo "容器 ID: $CONTAINER_ID"
    echo "容器内 netstat 输出:"
    docker exec $CONTAINER_ID sh -c "netstat -tlnp 2>/dev/null | grep 2348 || ss -tlnp 2>/dev/null | grep 2348 || echo '无法检查（需要安装 netstat/ss）'"
else
    echo "未找到映射 2348 端口的容器"
fi
echo ""

# 3. 检查主机端口监听状态（关键：查看实际绑定的 IP）
echo "3. 检查主机端口监听状态（关键：查看实际绑定的 IP）:"
echo "使用 ss 命令:"
ss -tlnp 2>/dev/null | grep 2348 || echo "端口未在主机上监听"
echo ""
echo "使用 netstat 命令:"
netstat -tlnp 2>/dev/null | grep 2348 || echo "端口未在主机上监听"
echo ""
echo "⚠️  重要：如果看到 127.0.0.1:2348 而不是 0.0.0.0:2348，说明只绑定到了本地"
echo ""

# 4. 检查防火墙状态（firewalld）
echo "4. 检查 firewalld 状态:"
if command -v firewall-cmd &> /dev/null; then
    systemctl status firewalld --no-pager -l | head -5
    echo ""
    echo "检查 2348 端口是否开放:"
    firewall-cmd --list-ports 2>/dev/null | grep -q 2348 && echo "✓ 2348 端口已在 firewalld 中开放" || echo "✗ 2348 端口未在 firewalld 中开放"
    echo ""
    echo "当前开放的端口:"
    firewall-cmd --list-ports 2>/dev/null | tr ' ' '\n' | head -10
else
    echo "firewalld 未安装或未运行"
fi
echo ""

# 5. 检查 iptables 规则
echo "5. 检查 iptables 规则:"
echo "查看 INPUT 链规则:"
sudo iptables -L INPUT -n -v 2>/dev/null | head -20 || echo "无法查看 iptables（可能需要 sudo）"
echo ""
echo "查看 DOCKER 链规则:"
sudo iptables -L DOCKER -n -v 2>/dev/null | grep 2348 || echo "未找到 2348 端口的 DOCKER 链规则"
echo ""
echo "查看所有与 2348 相关的规则:"
sudo iptables -L -n -v 2>/dev/null | grep 2348 || echo "未找到 2348 端口的 iptables 规则"
echo ""

# 6. 检查 Docker 的端口映射详情（关键检查）
echo "6. 检查 Docker 端口映射详情（关键检查）:"
if [ -n "$CONTAINER_ID" ]; then
    echo "容器名: $(docker ps --filter "id=$CONTAINER_ID" --format "{{.Names}}")"
    echo "端口映射:"
    docker port $CONTAINER_ID 2348 2>/dev/null || echo "无法获取端口映射详情"
    echo ""
    echo "检查 Docker 网络绑定（HostIp 应该是 0.0.0.0）:"
    docker inspect $CONTAINER_ID --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> HostIp:{{(index $conf 0).HostIp}} HostPort:{{(index $conf 0).HostPort}}{{"\n"}}{{end}}' 2>/dev/null | grep 2348 || echo "无法获取端口绑定信息"
    echo ""
    echo "⚠️  如果 HostIp 是 127.0.0.1，说明只绑定到了本地，需要修改 docker-compose.yaml"
else
    echo "未找到映射 2348 端口的容器"
fi
echo ""

# 7. 本地连接测试
echo "7. 本地连接测试:"
timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/2348" 2>/dev/null && echo "✓ 本地 127.0.0.1:2348 连接成功" || echo "✗ 本地 127.0.0.1:2348 连接失败"
timeout 2 bash -c "echo > /dev/tcp/0.0.0.0/2348" 2>/dev/null && echo "✓ 本地 0.0.0.0:2348 连接成功" || echo "✗ 本地 0.0.0.0:2348 连接失败"
echo ""

# 8. 获取本机 IP 地址
echo "8. 本机 IP 地址:"
hostname -I 2>/dev/null | awk '{print $1}' || ip addr show | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}' | cut -d/ -f1
echo ""

echo "=== 问题诊断 ==="
echo ""
echo "【关键检查点】"
echo "1. 如果 'ss -tlnp | grep 2348' 显示 127.0.0.1:2348 → Docker 只绑定到本地"
echo "2. 如果显示 0.0.0.0:2348 → Docker 绑定正确，问题在 iptables 或安全组"
echo "3. 如果 Docker inspect 显示 HostIp 是 127.0.0.1 → 需要修改 docker-compose.yaml"
echo ""

echo "=== 建议的解决方案 ==="
echo ""
echo "【方案 1】如果 Docker 只绑定到 127.0.0.1（最可能）:"
echo "  修改 docker-compose.yaml，将端口映射改为："
echo "    ports:"
echo "      - \"0.0.0.0:2348:2348\""
echo "  然后重启："
echo "    docker-compose up -d api-x"
echo ""
echo "【方案 2】如果 Docker 绑定到 0.0.0.0，但仍有 iptables 规则阻止："
echo "  sudo iptables -L INPUT -n -v  # 查看 INPUT 链"
echo "  sudo iptables -A INPUT -p tcp --dport 2348 -j ACCEPT"
echo "  sudo iptables-save > /etc/sysconfig/iptables  # 保存规则"
echo ""
echo "【方案 3】检查 SELinux（如果启用）："
echo "  getenforce  # 查看状态"
echo "  sudo setenforce 0  # 临时禁用测试（不推荐生产环境）"
echo ""
echo "【方案 4】检查安全组设置："
echo "  确认 VPS 控制台的安全组规则："
echo "  - 协议: TCP"
echo "  - 端口: 2348"
echo "  - 来源: 0.0.0.0/0"
echo ""
echo "【验证步骤】"
echo "  1. 在 CentOS 主机执行: ss -tlnp | grep 2348  # 查看绑定地址"
echo "  2. 在 CentOS 主机执行: telnet 127.0.0.1 2348  # 本地测试"
echo "  3. 在 macOS 执行: telnet 39.105.159.105 2348  # 外部测试"
echo ""
echo "【快速修复命令】"
echo "  如果确认是 Docker 绑定问题，执行："
echo "    docker-compose stop api-x"
echo "    # 修改 docker-compose.yaml 中的端口映射为 '0.0.0.0:2348:2348'"
echo "    docker-compose up -d api-x"
echo "    ss -tlnp | grep 2348  # 验证已绑定到 0.0.0.0"

