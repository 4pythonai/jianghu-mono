<?php
// 引入数据处理文件
include_once(VIEWPATH . 'scorecard/scorecard_data.php');

// 引入头部文件
include_once(VIEWPATH . 'scorecard/header.php');
?>

<div class="scorecard-container">
    <!-- 头部信息 -->
    <div class="scorecard-header">
        <h1 class="scorecard-title"><?php echo htmlspecialchars($game_title); ?></h1>
        <div class="course-info">
            <?php echo htmlspecialchars($course_name); ?>
            <span class="game-date"><?php echo $game_date; ?></span>
        </div>
    </div>

    <div class="content-wrapper">
        <div class="table-container <?php echo $scorecard_config['is_nine_hole'] ? 'nine-hole' : 'eighteen-hole'; ?>">
            <table class="scorecard-table">
                <thead>
                    <tr class="header-row">
                        <th class="player-column sticky-left">球员</th>
                        <?php for ($i = 0; $i < $scorecard_config['front_nine_count']; $i++): ?>
                            <th class="hole-column hole-<?php echo $i + 1; ?>">
                                <div class="hole-info">
                                    <div class="hole-name"><?php echo isset($scorecard_config['hole_names'][$i]) ? $scorecard_config['hole_names'][$i] : ($i + 1); ?></div>
                                    <div class="hole-par"><?php echo $course_pars[$i]; ?></div>
                                </div>
                            </th>
                        <?php endfor; ?>
                        <th class="total-column sticky-total">
                            <?php echo $scorecard_config['is_nine_hole'] ? '总分' : 'OUT'; ?>
                        </th>
                        <?php if (!$scorecard_config['is_nine_hole']): ?>
                            <?php for ($i = 0; $i < $scorecard_config['back_nine_count']; $i++): ?>
                                <th class="hole-column hole-<?php echo $i + $scorecard_config['front_nine_count'] + 1; ?>">
                                    <div class="hole-info">
                                        <div class="hole-name"><?php echo isset($scorecard_config['hole_names'][$i + $scorecard_config['front_nine_count']]) ? $scorecard_config['hole_names'][$i + $scorecard_config['front_nine_count']] : ($i + 1); ?></div>
                                        <div class="hole-par"><?php echo $course_pars[$i + $scorecard_config['front_nine_count']]; ?></div>
                                    </div>
                                </th>
                            <?php endfor; ?>
                            <th class="total-column">IN</th>
                            <th class="total-column sticky-final">总分</th>
                        <?php endif; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($players_data as $player): ?>
                        <tr class="player-row">
                            <td class="player-info sticky-left">
                                <div class="user-column">
                                    <div class="player-avatar">
                                        <img src="<?php echo $player['avatar']; ?>" alt="<?php echo htmlspecialchars($player['name']); ?>"
                                            onerror="this.src='<?php echo $base_url; ?>/avatar/default.jpg'">
                                    </div>
                                    <div class="player-name"><?php echo htmlspecialchars($player['name']); ?></div>
                                </div>
                                <div class="tee-column">
                                    <div class="tee-indicator" data-tee="<?php echo strtolower($player['tee']); ?>"></div>
                                </div>
                            </td>

                            <?php for ($i = 0; $i < $scorecard_config['front_nine_count']; $i++): ?>
                                <td class="score-cell"
                                    data-score="<?php echo $player['scores'][$i]; ?>"
                                    data-par="<?php echo $course_pars[$i]; ?>">
                                    <span class="<?php echo getScoreClass($player['scores'][$i], $course_pars[$i]); ?>">
                                        <?php echo $player['scores'][$i] > 0 ? $player['scores'][$i] : ''; ?>
                                    </span>
                                </td>
                            <?php endfor; ?>

                            <td class="total-cell sticky-total">
                                <strong><?php echo $player['out'] > 0 ? $player['out'] : ''; ?></strong>
                            </td>

                            <?php if (!$scorecard_config['is_nine_hole']): ?>
                                <?php for ($i = $scorecard_config['front_nine_count']; $i < $scorecard_config['total_holes']; $i++): ?>
                                    <td class="score-cell"
                                        data-score="<?php echo $player['scores'][$i]; ?>"
                                        data-par="<?php echo $course_pars[$i]; ?>">
                                        <span class="<?php echo getScoreClass($player['scores'][$i], $course_pars[$i]); ?>">
                                            <?php echo $player['scores'][$i] > 0 ? $player['scores'][$i] : ''; ?>
                                        </span>
                                    </td>
                                <?php endfor; ?>

                                <td class="total-cell">
                                    <strong><?php echo $player['in'] > 0 ? $player['in'] : ''; ?></strong>
                                </td>

                                <td class="total-cell sticky-final">
                                    <strong class="final-score"><?php echo $player['total'] > 0 ? $player['total'] : ''; ?></strong>
                                </td>
                            <?php endif; ?>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>


    </div>

    <!-- 图例说明 -->
    <div class="legend" style="padding: 20px; background: #f8f9fa; border-top: 1px solid #ddd;">
        <div class="row text-center">
            <div class="col-6 col-md-2 mb-2">
                <div class="score-eagle" style="width: 20px; height: 20px; border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">E</div>
                <small>EAGLE</small>
            </div>
            <div class="col-6 col-md-2 mb-2">
                <div class="score-birdie" style="width: 20px; height: 20px; border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">B</div>
                <small>BIRDIE</small>
            </div>
            <div class="col-6 col-md-2 mb-2">
                <div class="score-par" style="width: 20px; height: 20px; border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; border: 1px solid #ddd;">P</div>
                <small>PAR</small>
            </div>
            <div class="col-6 col-md-2 mb-2">
                <div class="score-bogey" style="width: 20px; height: 20px; border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">+1</div>
                <small>BOGEY</small>
            </div>
            <div class="col-6 col-md-2 mb-2">
                <div class="score-double-bogey" style="width: 20px; height: 20px; border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">+2</div>
                <small>DOUBLE BOGEY+</small>
            </div>
        </div>
    </div>
</div>

<?php
// 引入底部文件
include_once(VIEWPATH . 'scorecard/footer.php');
?>