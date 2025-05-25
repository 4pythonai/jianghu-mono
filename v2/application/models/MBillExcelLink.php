<?php

require 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MBillExcelLink extends CI_Model {

    private function renderHeaderAndSummary($sheet, $data) {
        // 设置表头样式
        $headerStyle = [
            'font' => [
                'bold' => true,
                'size' => 11
            ]
        ];

        // 设置列宽
        $sheet->getColumnDimension('A')->setWidth(42);
        $sheet->getColumnDimension('B')->setWidth(23);
        $sheet->getColumnDimension('C')->setWidth(30);
        $sheet->getColumnDimension('D')->setWidth(44);
        $sheet->getColumnDimension('E')->setWidth(18);
        $sheet->getColumnDimension('F')->setWidth(16);

        // 插入logo
        $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
        $drawing->setName('Logo');
        $drawing->setDescription('Logo');
        $drawing->setPath('/var/www/html/v2/application/controllers/aws-logo.png');
        $drawing->setCoordinates('A1');
        $drawing->setHeight(60);
        $drawing->setWidth(80);
        $drawing->setOffsetX(5);
        $drawing->setOffsetY(5);
        $drawing->setWorksheet($sheet);

        // 设置第一行的高度
        $sheet->getRowDimension(1)->setRowHeight(48);

        // 合并B1-D1单元格并显示客户名称
        $sheet->mergeCells('B1:D1');
        $sheet->setCellValue('B1', $data['tiername']);
        $sheet->getStyle('B1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 14  // 可以调整字体大小
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
            ]
        ]);

        // 修改第4行的显示内容和格式
        $sheet->setCellValue('A4', 'Link Name:');
        $sheet->setCellValue('D4', 'Summary Request For Payment');

        // 为第4行设置粗体样式
        $sheet->getStyle('A4:D4')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ]);

        $sheet->setCellValue('A5', $data['linkname']);
        $sheet->setCellValue('D5', 'Request for Payment Summary Billing Statement');
        // E5,F5 合并,并且靠右对齐,且加粗
        $sheet->mergeCells('E5:F5');
        $sheet->setCellValue('E5', $data['firstlinkdate'] . "-" . $data['lastlinkdate']);
        $sheet->getStyle('E5')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('E5')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ]);
        // 为B5和C5(合并后的C5:D5)添加上下黑色实线边框
        $borderStyle = [
            'borders' => [
                'top' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
                'bottom' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ];

        $sheet->getStyle('D5:F5')->applyFromArray($borderStyle);
        $sheet->getStyle('A10:F10')->applyFromArray($borderStyle);

        $borderStyle1 = ['borders' => ['bottom' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => '000000'],],],];
        $sheet->getStyle('D7:F7')->applyFromArray($borderStyle1);

        // 保持原有的粗体和对齐方式
        $sheet->getStyle('C5')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ])->getAlignment()->setHorizontal(
            \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT
        );

        $sheet->setCellValue('A7', 'Account Number:');
        $sheet->getStyle('A7')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ]);

        $sheet->getStyle('A8')->getNumberFormat()->setFormatCode('@');
        $sheet->setCellValue('A8', ' ' . $data['linkid']);

        // Summary部分的数据填充

        $sheet->setCellValue('D7', 'Request for Payment Date:');
        //  E7,F7 合并,并且靠右对齐
        $sheet->mergeCells('E7:F7');
        $sheet->setCellValue('E7', $data['billCreateDate']);
        $sheet->getStyle('E7')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);

        $sheet->getStyle('E7')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ])->getAlignment()->setHorizontal(
            \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT
        );


        // 为B7和C7(合并后的C7:D7)添加下边框黑色实线
        $borderStyle = [
            'borders' => [
                'bottom' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ];

        $sheet->getStyle('D4:F4')->applyFromArray($borderStyle);
        // $sheet->getStyle('C7:D7')->applyFromArray($borderStyle);

        // 保持原有的粗体和对齐方式
        $sheet->getStyle('C7')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ])->getAlignment()->setHorizontal(
            \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT
        );

        $sheet->setCellValue('D8', 'Total:');
        $sheet->getStyle('D8')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ]);

        // link 总费用
        $sheet->mergeCells('E8:F8');  // 合并C8和D8单元格
        $sheet->setCellValue('E8', $data['totalCost']);
        $sheet->getStyle('E8')->applyFromArray([
            'font' => [
                'bold' => true
            ]
        ])->getAlignment()->setHorizontal(
            \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT
        );
    }


    private function renderUsageSection($sheet, $data) {
        $headerStyle = [
            'font' => [
                'bold' => true,
                'size' => 11
            ]
        ];

        // 添加明细数据表头
        $currentRow = 10;

        // 设置表头并应用粗体样式,设为白底黑字  
        $sheet->setCellValue('A' . $currentRow, 'ProductName');
        $sheet->setCellValue('B' . $currentRow, 'Region');
        $sheet->setCellValue('C' . $currentRow, 'UsageType');
        $sheet->setCellValue('D' . $currentRow, 'LineItemDescription');
        $sheet->setCellValue('E' . $currentRow, 'UsageAmount');
        $sheet->setCellValue('F' . $currentRow, 'Cost');

        // 为表头应用白底黑字和粗体样式
        $sheet->getStyle('A' . $currentRow . ':F' . $currentRow)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => '000000']
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'FFFFFF']
            ]
        ]);

        $realData =  $this->getRealUsageData($data['excelProdCostLogs']);

        // 添加明细数据
        $currentRow++;
        foreach ($realData  as $item) {


            $sheet->setCellValue('A' . $currentRow, $item['product_ProductName']);
            $sheet->setCellValue('B' . $currentRow, $item['product_region']);
            $sheet->setCellValue('C' . $currentRow, $item['lineItem_UsageType']);
            $sheet->setCellValue('D' . $currentRow, $item['lineItem_LineItemDescription']);
            $sheet->setCellValue('E' . $currentRow, $item['totalUsageAmount']);

            if (floatval($item['totalUnblendedCost']) > 0) {
                $sheet->setCellValue('F' . $currentRow, $item['totalUnblendedCost']);
            } else {
                // 设置单元格式为数值，使用自定义格式来显示负数为红色括号格式
                $sheet->getStyle('F' . $currentRow)->getNumberFormat()
                    ->setFormatCode('#,##0.00;[Red]"("#,##0.00")"');  // 使用引号明确括号的位置
                $sheet->setCellValue('F' . $currentRow, -abs($item['totalUnblendedCost']));  // 确保是负数
                $sheet->getStyle('F' . $currentRow)->getAlignment()
                    ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
            }


            $currentRow++;
        }

        // 置单元格对齐方式
        $sheet->getStyle('C10:D' . $currentRow)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT);
    }

    private function getRealUsageData($realData) {
        $realData = array_filter($realData, function ($item) {
            return  floatval($item['totalUnblendedCost'])  <> 0;
        });
        return $realData;
    }

    private function renderCostDiffSection($sheet, $data) {
        // Create a new worksheet for cost differences
        $newSheet = $sheet->getParent()->createSheet();
        $newSheet->setTitle('Cost Differences');

        // Set column widths
        $newSheet->getColumnDimension('A')->setWidth(30);
        $newSheet->getColumnDimension('B')->setWidth(15);
        $newSheet->getColumnDimension('C')->setWidth(15);
        $newSheet->getColumnDimension('D')->setWidth(15);

        // Set headers
        $headers = ['Product Code', 'Excel Cost', 'PDF Cost', 'Difference'];
        $newSheet->fromArray([$headers], NULL, 'A1');

        // Style headers
        $headerStyle = [
            'font' => ['bold' => true],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'ED7100']
            ]
        ];
        $newSheet->getStyle('A1:D1')->applyFromArray($headerStyle);

        // Add data rows
        $row = 2;
        foreach ($data['linkProdCostDiffArr'] as $diff) {
            $newSheet->setCellValue('A' . $row, $diff['productCode']);
            $newSheet->setCellValue('B' . $row, number_format($diff['excelCost'], 2));
            $newSheet->setCellValue('C' . $row, number_format($diff['pdfCost'], 2));
            $newSheet->setCellValue('D' . $row, number_format($diff['difference'], 3));
            $row++;
        }

        // Set number alignment to right for cost columns
        $newSheet->getStyle('B2:D' . ($row - 1))->getAlignment()
            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
    }

    function renderLinkExcel($data) {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 调用summary部分的渲染
        $this->renderHeaderAndSummary($sheet, $data);

        // 调用usage部分的渲染
        $this->renderUsageSection($sheet, $data);


        // 保存文件,区分文件名

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

        if ($data['pdfEqualExcel']) {
            $filename  = "/tmp/" . $data['billmonth'] . '-' . $data['tiername'] . '-' . $data['linkid'] . ".xlsx";
        } else {
            // 调用cost difference部分的渲染
            $this->renderCostDiffSection($sheet, $data);
            $filename = "/tmp/U" . $data['billmonth'] . '-' . $data['tiername'] . '-' . $data['linkid'] . ".xlsx";
        }
        // unlink first if exists
        if (file_exists($filename)) {
            unlink($filename);
        }
        $writer->save($filename);
        return $filename;
    }
}
