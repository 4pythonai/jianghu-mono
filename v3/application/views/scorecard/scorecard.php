<?php
// 引入数据处理文件
include_once(VIEWPATH . 'scorecard/scorecard_data.php');
?>

<div class="scorecard-container">
    <!-- 头部信息 -->
    <div class="scorecard-header">
        <h1 class="scorecard-title"><?php echo htmlspecialchars($game_title); ?></h1>
        <div class="course-info"><?php echo htmlspecialchars($course_name); ?></div>
        <div class="course-info"><?php echo $game_date; ?></div>
    </div>

    <div class="content-wrapper">
        <div class="table-container <?php echo $scorecard_config['is_nine_hole'] ? 'nine-hole' : 'eighteen-hole'; ?>">
            <table class="scorecard-table">
                <thead>
                    <tr class="header-row">
                        <th class="player-column sticky-left">球员</th>
                        <?php for ($i = 0; $i < $scorecard_config['front_nine_count']; $i++): ?>
                            <th class="hole-column hole-<?php echo $i + 1; ?>">
                                <?php echo $i + 1; ?>
                            </th>
                        <?php endfor; ?>
                        <th class="total-column sticky-total">
                            <?php echo $scorecard_config['is_nine_hole'] ? '总分' : 'OUT'; ?>
                        </th>
                        <?php if (!$scorecard_config['is_nine_hole']): ?>
                            <?php for ($i = 0; $i < $scorecard_config['back_nine_count']; $i++): ?>
                                <th class="hole-column hole-<?php echo $i + $scorecard_config['front_nine_count'] + 1; ?>">
                                    <?php echo $i + 1; ?>
                                </th>
                            <?php endfor; ?>
                            <th class="total-column">IN</th>
                            <th class="total-column sticky-final">总分</th>
                        <?php endif; ?>
                    </tr>
                    <tr class="par-row">
                        <td class="sticky-left"><strong>标准杆</strong></td>
                        <?php for ($i = 0; $i < $scorecard_config['front_nine_count']; $i++): ?>
                            <td class="par-cell"><?php echo $course_pars[$i]; ?></td>
                        <?php endfor; ?>
                        <td class="sticky-total par-total"><?php echo $scorecard_config['out_par']; ?></td>
                        <?php if (!$scorecard_config['is_nine_hole']): ?>
                            <?php for ($i = $scorecard_config['front_nine_count']; $i < $scorecard_config['total_holes']; $i++): ?>
                                <td class="par-cell"><?php echo $course_pars[$i]; ?></td>
                            <?php endfor; ?>
                            <td class="par-total"><?php echo $scorecard_config['in_par']; ?></td>
                            <td class="sticky-final par-total"><?php echo $scorecard_config['total_par']; ?></td>
                        <?php endif; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($players_data as $player): ?>
                        <tr class="player-row">
                            <td class="player-info sticky-left">
                                <div class="player-avatar">
                                    <img src="<?php echo $player['avatar']; ?>" alt="<?php echo htmlspecialchars($player['name']); ?>"
                                        onerror="this.src='<?php echo $base_url; ?>/avatar/default.jpg'">
                                </div>
                                <div class="player-name"><?php echo htmlspecialchars($player['name']); ?></div>
                            </td>

                            <?php for ($i = 0; $i < $scorecard_config['front_nine_count']; $i++): ?>
                                <td class="score-cell <?php echo getScoreClass($player['scores'][$i], $course_pars[$i]); ?>"
                                    data-score="<?php echo $player['scores'][$i]; ?>"
                                    data-par="<?php echo $course_pars[$i]; ?>">
                                    <?php echo $player['scores'][$i] > 0 ? $player['scores'][$i] : ''; ?>
                                </td>
                            <?php endfor; ?>

                            <td class="total-cell sticky-total">
                                <strong><?php echo $player['out'] > 0 ? $player['out'] : ''; ?></strong>
                            </td>

                            <?php if (!$scorecard_config['is_nine_hole']): ?>
                                <?php for ($i = $scorecard_config['front_nine_count']; $i < $scorecard_config['total_holes']; $i++): ?>
                                    <td class="score-cell <?php echo getScoreClass($player['scores'][$i], $course_pars[$i]); ?>"
                                        data-score="<?php echo $player['scores'][$i]; ?>"
                                        data-par="<?php echo $course_pars[$i]; ?>">
                                        <?php echo $player['scores'][$i] > 0 ? $player['scores'][$i] : ''; ?>
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