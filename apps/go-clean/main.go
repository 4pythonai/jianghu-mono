package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"go-clean/analyzer"
	"go-clean/parser"
	"go-clean/reporter"
	"go-clean/types"
)

func main() {
	apiModules := flag.String("api-modules", "", "Path to jianghu-weixin/api/modules directory")
	controllers := flag.String("controllers", "", "Path to jianghu-api/v3/application/controllers directory")
	models := flag.String("models", "", "Path to jianghu-api/v3/application/models directory")
	flag.Parse()

	if *apiModules == "" || *controllers == "" || *models == "" {
		fmt.Fprintln(os.Stderr, "Usage: go-clean --api-modules=<path> --controllers=<path> --models=<path>")
		flag.PrintDefaults()
		os.Exit(1)
	}

	skipper := newPathSkipper([]string{
		filepath.Join(*controllers, "Audit.php"),
		filepath.Join(*controllers, "Gamble.php"),
		filepath.Join(*controllers, "Jianghu.php"),
		filepath.Join(*models, "GamblePipe.php"),
		filepath.Join(*models, "GamblePipeRunner.php"),
		filepath.Join(*models, "gamble"),
		filepath.Join(*models, "sysrule"),
	})

	// Parse JS endpoints
	fmt.Fprintf(os.Stderr, "解析 JS API 端点配置: %s\n", *apiModules)
	endpoints, err := parser.ParseJSDirectory(*apiModules)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing JS files: %v\n", err)
		os.Exit(1)
	}
	fmt.Fprintf(os.Stderr, "  找到 %d 个端点\n", len(endpoints))

	// Parse PHP controllers
	fmt.Fprintf(os.Stderr, "解析 PHP Controllers: %s\n", *controllers)
	controllerClasses, controllerCalls, err := parser.ParsePHPDirectory(*controllers, false)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing controller files: %v\n", err)
		os.Exit(1)
	}
	controllerClasses = filterClasses(controllerClasses, skipper)
	controllerCalls = filterCalls(controllerCalls, skipper)
	fmt.Fprintf(os.Stderr, "  找到 %d 个类\n", len(controllerClasses))

	// Parse PHP models
	fmt.Fprintf(os.Stderr, "解析 PHP Models: %s\n", *models)
	modelClasses, modelCalls, err := parser.ParsePHPDirectory(*models, true)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing model files: %v\n", err)
		os.Exit(1)
	}
	modelClasses = filterClasses(modelClasses, skipper)
	modelCalls = filterCalls(modelCalls, skipper)
	fmt.Fprintf(os.Stderr, "  找到 %d 个类\n", len(modelClasses))

	// Combine all method calls
	allCalls := append(controllerCalls, modelCalls...)

	// Run analysis
	fmt.Fprintln(os.Stderr, "分析中...")
	result := analyzer.Analyze(endpoints, controllerClasses, modelClasses, allCalls)

	// Print report
	fmt.Fprintln(os.Stderr)
	reporter.PrintTextReport(os.Stdout, result)
}

type pathSkipper struct {
	paths []string
}

func newPathSkipper(paths []string) pathSkipper {
	cleaned := make([]string, 0, len(paths))
	for _, path := range paths {
		cleaned = append(cleaned, filepath.Clean(path))
	}
	return pathSkipper{paths: cleaned}
}

func (s pathSkipper) shouldSkip(path string) bool {
	if path == "" {
		return false
	}
	cleaned := filepath.Clean(path)
	for _, skip := range s.paths {
		if cleaned == skip || strings.HasPrefix(cleaned, skip+string(os.PathSeparator)) {
			return true
		}
	}
	return false
}

func filterClasses(classes []types.PHPClass, skipper pathSkipper) []types.PHPClass {
	filtered := classes[:0]
	for _, class := range classes {
		if skipper.shouldSkip(class.File) {
			continue
		}
		filtered = append(filtered, class)
	}
	return filtered
}

func filterCalls(calls []types.MethodCall, skipper pathSkipper) []types.MethodCall {
	filtered := calls[:0]
	for _, call := range calls {
		if skipper.shouldSkip(call.File) {
			continue
		}
		filtered = append(filtered, call)
	}
	return filtered
}
