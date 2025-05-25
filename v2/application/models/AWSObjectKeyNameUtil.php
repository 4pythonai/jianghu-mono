<?php


class AWSObjectKeyNameUtil   extends CI_Model {


    private $web_root_dir = "/var/www/html/aws-data";



    // 获取完整路径 
    function buildAwsLocalPath($objectKey, $tierId) {
        // Extract the real name from the file name
        $pathParts = explode('/', $objectKey);
        // $month_folder 为倒数第二个元素

        $month_folder = $pathParts[count($pathParts) - 2];

        $realName = end($pathParts);
        $type = '';
        if (strpos($objectKey, 'CUR-REPORT-MONTHS')) {
            $type = 'CUR-REPORT-MONTHS';
        }
        if (strpos($objectKey, 'CUR-REPORT-DAYS')) {
            $type = 'CUR-REPORT-DAYS';
        }
        // Construct the saveAs path
        $saveAs =   sprintf('%s/%s/%s/%s/%s', $this->web_root_dir, $tierId, $type, $month_folder, $realName);
        $savePath = sprintf('%s/%s/%s/%s/', $this->web_root_dir, $tierId, $type, $month_folder);
        $csvname = str_replace('.gz', '',  $saveAs);
        $this->createDirectory($savePath);
        return [
            'realName' => $realName,
            'savePath' => $savePath,
            'SaveAs' => $saveAs,
            'csvname' => $csvname
        ];
    }

    public function createDirectory($path) {
        if (!is_dir($path)) {
            if (mkdir($path, 0777, true)) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }


    public  function getBillMonth($filename) {
        $directoryPath = dirname($filename);
        $lastLevelFolder = basename($directoryPath);
        $parts = explode('-', $lastLevelFolder);
        if (isset($parts[0]) && strlen($parts[0]) >= 6) {
            $yearMonth = substr($parts[0], 0, 4) . '-' . substr($parts[0], 4, 2);
            return $yearMonth;
        } else {
            return "BAD";
        }
    }

    function unzipGzFile($gzFilePath) {
        // Ensure the file exists
        if (!file_exists($gzFilePath)) {
            throw new Exception("File does not exist: $gzFilePath");
        }

        // Determine the output file path by removing the .gz extension
        $outputFilePath = preg_replace('/\.gz$/', '', $gzFilePath);

        // Open the gz file for reading
        $gzFile = gzopen($gzFilePath, 'rb');
        if (!$gzFile) {
            throw new Exception("Failed to open gz file: $gzFilePath");
        }

        // Open the output file for writing
        $outputFile = fopen($outputFilePath, 'wb');
        if (!$outputFile) {
            gzclose($gzFile);
            throw new Exception("Failed to open output file: $outputFilePath");
        }

        // Read from the gz file and write to the output file
        while (!gzeof($gzFile)) {
            fwrite($outputFile, gzread($gzFile, 4096));
        }

        // Close both files
        gzclose($gzFile);
        fclose($outputFile);
        return $outputFilePath;
    }


    function getBillMonthStartEndTimeStamp($billmonth) {
        // 创建 DateTime 对象
        $startDate = DateTime::createFromFormat('Y-m', $billmonth);

        if (!$startDate) {
            throw new Exception("Invalid bill month format. Expected format is YYYY-MM.");
        }

        // 克隆对象作为结束日期
        $endDate = clone $startDate;

        // 获取月份的第一天和最后一天
        $startDate->modify('first day of this month');
        $startDate->setTime(0, 0, 0);

        $endDate->modify('last day of this month');
        $endDate->setTime(23, 59, 59);

        // 返回结果数组
        return [
            'start' => $startDate->format('Y-m-d H:i:s'),
            'end' => $endDate->format('Y-m-d H:i:s')
        ];
    }



    // 获取类似  20240501-20240601 字符串
    public  function getMonthRangeString($dateStr) {
        $date = DateTime::createFromFormat('Y-m', $dateStr);
        if (!$date) {
            throw new Exception("Invalid date format. Expected 'YYYY-MM'.");
        }

        $currentMonthFirstDay = $date->format('Ym') . '01';
        $date->modify('first day of next month');
        $nextMonthFirstDay = $date->format('Ym') . '01';
        return $currentMonthFirstDay . '-' . $nextMonthFirstDay;
    }
}
