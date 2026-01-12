package reporter

import (
	"fmt"
	"io"
	"sort"

	"go-clean/types"
)

// PrintTextReport outputs the analysis result as human-readable text
func PrintTextReport(w io.Writer, result types.AnalysisResult) {
	fmt.Fprintln(w, "================================================")
	fmt.Fprintln(w, "           未使用的后端方法分析报告")
	fmt.Fprintln(w, "================================================")
	fmt.Fprintln(w)

	controllerCount := 0
	modelCount := 0

	// Sort files for consistent output
	controllerFiles := sortedKeys(result.UnusedControllerMethods)
	modelFiles := sortedKeys(result.UnusedModelMethods)

	fmt.Fprintln(w, "=== 未使用的 Controller 方法 ===")
	fmt.Fprintln(w)

	if len(controllerFiles) == 0 {
		fmt.Fprintln(w, "(无)")
	} else {
		for _, file := range controllerFiles {
			methods := result.UnusedControllerMethods[file]
			if len(methods) == 0 {
				continue
			}
			fmt.Fprintf(w, "%s:\n", file)
			for _, m := range methods {
				fmt.Fprintf(w, "  - %-30s (line %d)\n", m.Name, m.Line)
				controllerCount++
			}
			fmt.Fprintln(w)
		}
	}

	fmt.Fprintln(w, "=== 未使用的 Model 方法 ===")
	fmt.Fprintln(w)

	if len(modelFiles) == 0 {
		fmt.Fprintln(w, "(无)")
	} else {
		for _, file := range modelFiles {
			methods := result.UnusedModelMethods[file]
			if len(methods) == 0 {
				continue
			}
			fmt.Fprintf(w, "%s:\n", file)
			for _, m := range methods {
				fmt.Fprintf(w, "  - %-30s (line %d)\n", m.Name, m.Line)
				modelCount++
			}
			fmt.Fprintln(w)
		}
	}

	fmt.Fprintln(w, "================================================")
	fmt.Fprintf(w, "统计: Controller %d个方法, Model %d个方法\n", controllerCount, modelCount)
	fmt.Fprintln(w, "================================================")
}

func sortedKeys(m map[string][]types.PHPMethod) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
