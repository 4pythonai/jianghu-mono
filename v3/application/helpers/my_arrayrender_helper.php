<?php

function checkarr($arr) {
    if (empty($arr)) {
        return 'empty_arr';
    }

    $isAssoc = array_keys($arr) !== range(0, count($arr) - 1);
    $isMultidimensional = false;

    foreach ($arr as $value) {
        if (is_array($value)) {
            $isMultidimensional = true;
            break;
        }
    }

    if ($isMultidimensional) {
        return 'MultidimensionalArray';
    } elseif ($isAssoc) {
        return 'AssociativeArray';
    } else {
        return 'IndexedArray';
    }
}

function renderArr($arr) {
    $arry_check = checkarr($arr);
    if ($arry_check == 'empty_arr') {
        return '';
    }

    // 类似表格的形式
    if ($arry_check == 'MultidimensionalArray') {
        return renderMultidimensionalArrayAsTable($arr);
    }

    // 渲染为 key/value 表格
    if ($arry_check == 'AssociativeArray') {
        return renderAssociativeArrayAsTable($arr);
    }

    if ($arry_check == 'IndexedArray') {
        return renderIndexedArrayAsTable($arr);
    }
}


function renderAssociativeArrayAsTable($arr) {

    // 开始生成表格
    $html = '<table  calss="arraytable"  border="1" cellspacing="0" cellpadding="5">';
    $html .= '<thead><tr><th>KEY</th><th>VALUE</th></tr></thead>';
    $html .= '<tbody>';

    foreach ($arr as $key => $value) {
        $html .= '<tr>';
        $html .= '<td>' . htmlspecialchars($key) . '</td>';
        $html .= '<td>' . htmlspecialchars($value) . '</td>';
        $html .= '</tr>';
    }

    $html .= '</tbody></table>';
    return $html;
}

function renderMultidimensionalArrayAsTable($arr) {
    $html = '<table  calss="arraytable" border="1" cellspacing="0" cellpadding="5">';
    $html .= '<thead><tr>';

    // 提取表头
    $firstRow = reset($arr);

    foreach ($firstRow as $key => $value) {
        $html .= '<th>' . htmlspecialchars($key) . '</th>';
    }
    $html .= '</tr></thead>';
    $html .= '<tbody>';

    // 填充表格内容
    foreach ($arr as $row) {

        $html .= '<tr>';
        foreach ($row as $value) {
            $html .= '<td>' . htmlspecialchars($value) . '</td>';
        }
        $html .= '</tr>';
    }

    $html .= '</tbody></table>';
    return $html;
}

function renderIndexedArrayAsTable($arr) {
    $html = '<table  calss="arraytable" border="1" cellspacing="0" cellpadding="5">';
    $html .= '<thead><tr><th>ID</th><th>Value</th></tr></thead>';
    $html .= '<tbody>';

    foreach ($arr as $index => $value) {
        $html .= '<tr>';
        $html .= '<td>' . ($index + 1) . '</td>'; // ID 从1开始
        $html .= '<td>' . htmlspecialchars($value) . '</td>';
        $html .= '</tr>';
    }
    $html .= '</tbody></table>';
    return $html;
}
