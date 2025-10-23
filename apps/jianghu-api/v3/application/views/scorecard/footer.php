    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- 自定义 JavaScript -->
    <script>
        // 防止页面缩放
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        });

        var lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            var now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // 页面加载完成后的处理
        document.addEventListener('DOMContentLoaded', function() {
            // 可以在这里添加页面交互逻辑
            console.log('记分卡页面加载完成');

            // 如果需要动态更新数据，可以在这里添加AJAX调用
            // updateScoreCard();
        });

        // 示例：动态更新记分卡数据的函数
        function updateScoreCard(gameId) {
            // 这里可以添加AJAX请求来实时更新记分卡数据
            /*
            fetch('/v3/index.php/ScoreCard/getData/' + gameId)
                .then(response => response.json())
                .then(data => {
                    // 更新页面数据
                    console.log('数据更新:', data);
                })
                .catch(error => {
                    console.error('数据更新失败:', error);
                });
            */
        }

        // 页面方向变化处理
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                // 横屏/竖屏切换后重新计算布局
                window.scrollTo(0, 0);
            }, 100);
        });
    </script>
    </body>

    </html>