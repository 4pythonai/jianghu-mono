# Unused API Analyzer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Go tool that uses AST parsing to find unused Controller and Model methods in a PHP backend by comparing against WeChat mini-program API endpoint configurations.

**Architecture:** Parse JS API modules with esbuild to extract endpoints, parse PHP files with z7zmey/php-parser to extract class methods and method calls, compare to find unused methods, output text report.

**Tech Stack:** Go 1.21+, github.com/evanw/esbuild, github.com/z7zmey/php-parser/v4

---

## Task 1: Project Setup

**Files:**
- Create: `go.mod`
- Create: `main.go`

**Step 1: Initialize Go module**

```bash
cd /Users/alex/codebase/golf/jianghu-mono/apps/go-clean
go mod init go-clean
```

**Step 2: Add dependencies**

```bash
go get github.com/z7zmey/php-parser/v4
go get github.com/evanw/esbuild
```

**Step 3: Create minimal main.go**

```go
package main

import "fmt"

func main() {
	fmt.Println("go-clean: unused API analyzer")
}
```

**Step 4: Verify build**

Run: `go build -o go-clean .`
Expected: Binary created successfully

**Step 5: Commit**

```bash
git add go.mod go.sum main.go
git commit -m "feat: initialize go-clean project with dependencies"
```

---

## Task 2: Define Data Types

**Files:**
- Create: `types/types.go`

**Step 1: Create types package**

```go
package types

// Endpoint represents an API endpoint from JS config
type Endpoint struct {
	Controller     string // original: "course"
	ControllerNorm string // normalized: "Course"
	Method         string // "getDetail"
	SourceFile     string
	Line           int
}

// PHPMethod represents a method in a PHP class
type PHPMethod struct {
	Name       string
	Line       int
	Visibility string // public/private/protected
}

// PHPClass represents a PHP class definition
type PHPClass struct {
	Name    string
	File    string
	Methods []PHPMethod
	IsModel bool
}

// MethodCall represents a method call in PHP code
type MethodCall struct {
	Receiver string // "MGame", "MUser"
	Method   string // "getGameidByUUID"
	File     string
	Line     int
}

// AnalysisResult holds the final analysis results
type AnalysisResult struct {
	UnusedControllerMethods map[string][]PHPMethod // filename -> methods
	UnusedModelMethods      map[string][]PHPMethod // filename -> methods
}
```

**Step 2: Verify compilation**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add types/
git commit -m "feat: add data type definitions"
```

---

## Task 3: JS Parser - Extract Endpoints

**Files:**
- Create: `parser/js_parser.go`
- Create: `parser/js_parser_test.go`

**Step 1: Write the test**

```go
package parser

import (
	"testing"
)

func TestParseJSEndpoints(t *testing.T) {
	jsCode := `
import request from '../request-simple'

const game = {
    getGameDetail: (data, options) => request('/Game/gameDetail', data, options),
    cancelGame: (data, options) => request('/game/cancelGame', data, options),
}

export default game
`
	endpoints, err := ParseJSEndpoints(jsCode, "game.js")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(endpoints) != 2 {
		t.Fatalf("expected 2 endpoints, got %d", len(endpoints))
	}

	// Check first endpoint
	if endpoints[0].Controller != "Game" {
		t.Errorf("expected Controller 'Game', got '%s'", endpoints[0].Controller)
	}
	if endpoints[0].Method != "gameDetail" {
		t.Errorf("expected Method 'gameDetail', got '%s'", endpoints[0].Method)
	}

	// Check second endpoint (lowercase controller should be normalized)
	if endpoints[1].ControllerNorm != "Game" {
		t.Errorf("expected ControllerNorm 'Game', got '%s'", endpoints[1].ControllerNorm)
	}
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./parser/... -v`
Expected: FAIL - ParseJSEndpoints not defined

**Step 3: Implement JS parser**

```go
package parser

import (
	"regexp"
	"strings"

	"go-clean/types"
)

// ParseJSEndpoints extracts API endpoints from JS source code
// Uses regex to find request('/Controller/method', ...) patterns
func ParseJSEndpoints(code string, filename string) ([]types.Endpoint, error) {
	var endpoints []types.Endpoint

	// Pattern: request('/Controller/method'
	// Matches both single and double quotes
	pattern := regexp.MustCompile(`request\s*\(\s*['"]\/([^\/]+)\/([^'"]+)['"]`)

	lines := strings.Split(code, "\n")
	for lineNum, line := range lines {
		matches := pattern.FindAllStringSubmatch(line, -1)
		for _, match := range matches {
			if len(match) >= 3 {
				controller := match[1]
				method := match[2]

				endpoints = append(endpoints, types.Endpoint{
					Controller:     controller,
					ControllerNorm: normalizeControllerName(controller),
					Method:         method,
					SourceFile:     filename,
					Line:           lineNum + 1,
				})
			}
		}
	}

	return endpoints, nil
}

// normalizeControllerName converts controller name to PascalCase
func normalizeControllerName(name string) string {
	if len(name) == 0 {
		return name
	}
	return strings.ToUpper(name[:1]) + name[1:]
}

// ParseJSDirectory parses all .js files in a directory
func ParseJSDirectory(dir string) ([]types.Endpoint, error) {
	// Will be implemented in next step
	return nil, nil
}
```

**Step 4: Run test to verify it passes**

Run: `go test ./parser/... -v`
Expected: PASS

**Step 5: Commit**

```bash
git add parser/
git commit -m "feat: add JS endpoint parser with regex matching"
```

---

## Task 4: JS Parser - Directory Scanning

**Files:**
- Modify: `parser/js_parser.go`
- Modify: `parser/js_parser_test.go`

**Step 1: Add directory parsing implementation**

Add to `parser/js_parser.go`:

```go
import (
	"os"
	"path/filepath"
	// ... existing imports
)

// ParseJSDirectory parses all .js files in a directory
func ParseJSDirectory(dir string) ([]types.Endpoint, error) {
	var allEndpoints []types.Endpoint

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".js") {
			continue
		}

		filePath := filepath.Join(dir, entry.Name())
		content, err := os.ReadFile(filePath)
		if err != nil {
			return nil, err
		}

		endpoints, err := ParseJSEndpoints(string(content), entry.Name())
		if err != nil {
			return nil, err
		}

		allEndpoints = append(allEndpoints, endpoints...)
	}

	return allEndpoints, nil
}
```

**Step 2: Test with real files**

Run: `go build ./... && go run . 2>&1 | head -5`
Expected: Compiles successfully

**Step 3: Commit**

```bash
git add parser/js_parser.go
git commit -m "feat: add directory scanning for JS parser"
```

---

## Task 5: PHP Parser - Class and Method Extraction

**Files:**
- Create: `parser/php_parser.go`
- Create: `parser/php_parser_test.go`

**Step 1: Write the test**

```go
package parser

import (
	"testing"
)

func TestParsePHPClass(t *testing.T) {
	phpCode := `<?php
class Game extends MY_Controller {
    public function __construct() {
        parent::__construct();
    }

    private function isGameCreator($gameid, $userid) {
        return true;
    }

    public function getPlayerCombination() {
        echo "test";
    }

    public function createBlankGame() {
        $this->MGame->getGameidByUUID($uuid);
    }
}
`
	classes, calls, err := ParsePHPCode(phpCode, "Game.php", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(classes) != 1 {
		t.Fatalf("expected 1 class, got %d", len(classes))
	}

	class := classes[0]
	if class.Name != "Game" {
		t.Errorf("expected class name 'Game', got '%s'", class.Name)
	}

	// Should have 3 methods (excluding __construct)
	publicMethods := 0
	for _, m := range class.Methods {
		if m.Visibility == "public" && m.Name != "__construct" {
			publicMethods++
		}
	}
	if publicMethods != 2 {
		t.Errorf("expected 2 public methods, got %d", publicMethods)
	}

	// Should detect method call
	if len(calls) != 1 {
		t.Fatalf("expected 1 method call, got %d", len(calls))
	}
	if calls[0].Receiver != "MGame" || calls[0].Method != "getGameidByUUID" {
		t.Errorf("unexpected call: %+v", calls[0])
	}
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./parser/... -v -run TestParsePHPClass`
Expected: FAIL - ParsePHPCode not defined

**Step 3: Implement PHP parser**

```go
package parser

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/z7zmey/php-parser/v4/pkg/ast"
	"github.com/z7zmey/php-parser/v4/pkg/conf"
	"github.com/z7zmey/php-parser/v4/pkg/errors"
	"github.com/z7zmey/php-parser/v4/pkg/parser"
	"github.com/z7zmey/php-parser/v4/pkg/visitor"

	"go-clean/types"
)

// ParsePHPCode parses PHP source code and extracts classes, methods, and method calls
func ParsePHPCode(code string, filename string, isModel bool) ([]types.PHPClass, []types.MethodCall, error) {
	src := []byte(code)

	config := conf.Config{
		Version: &conf.Version{Major: 7, Minor: 4},
	}

	var parserErrors []*errors.Error
	errorHandler := func(e *errors.Error) {
		parserErrors = append(parserErrors, e)
	}

	rootNode, err := parser.Parse(src, config, errorHandler)
	if err != nil {
		return nil, nil, err
	}

	extractor := &phpExtractor{
		filename: filename,
		isModel:  isModel,
		code:     src,
	}

	traverser := visitor.NewTraverser(extractor)
	traverser.Traverse(rootNode)

	return extractor.classes, extractor.calls, nil
}

type phpExtractor struct {
	visitor.Null
	filename     string
	isModel      bool
	code         []byte
	classes      []types.PHPClass
	calls        []types.MethodCall
	currentClass *types.PHPClass
}

func (e *phpExtractor) EnterNode(n ast.Vertex) bool {
	switch node := n.(type) {
	case *ast.StmtClass:
		className := ""
		if node.Name != nil {
			if ident, ok := node.Name.(*ast.Identifier); ok {
				className = string(ident.Value)
			}
		}
		e.currentClass = &types.PHPClass{
			Name:    className,
			File:    e.filename,
			IsModel: e.isModel,
		}

	case *ast.StmtClassMethod:
		if e.currentClass == nil {
			return true
		}
		methodName := ""
		if node.Name != nil {
			if ident, ok := node.Name.(*ast.Identifier); ok {
				methodName = string(ident.Value)
			}
		}

		visibility := "public"
		for _, mod := range node.Modifiers {
			if ident, ok := mod.(*ast.Identifier); ok {
				v := strings.ToLower(string(ident.Value))
				if v == "private" || v == "protected" || v == "public" {
					visibility = v
				}
			}
		}

		line := 0
		if node.Position != nil {
			line = node.Position.StartLine
		}

		e.currentClass.Methods = append(e.currentClass.Methods, types.PHPMethod{
			Name:       methodName,
			Line:       line,
			Visibility: visibility,
		})

	case *ast.ExprMethodCall:
		// Handle $this->ModelName->method() calls
		e.extractMethodCall(node)
	}

	return true
}

func (e *phpExtractor) LeaveNode(n ast.Vertex) {
	if _, ok := n.(*ast.StmtClass); ok {
		if e.currentClass != nil {
			e.classes = append(e.classes, *e.currentClass)
			e.currentClass = nil
		}
	}
}

func (e *phpExtractor) extractMethodCall(node *ast.ExprMethodCall) {
	// We're looking for patterns like: $this->MGame->method()
	// The Var of ExprMethodCall could be another ExprPropertyFetch

	methodName := ""
	if node.Method != nil {
		if ident, ok := node.Method.(*ast.Identifier); ok {
			methodName = string(ident.Value)
		}
	}

	if methodName == "" {
		return
	}

	// Check if Var is a property fetch: $this->Something
	if propFetch, ok := node.Var.(*ast.ExprPropertyFetch); ok {
		// Check if it's $this->XXX
		if varNode, ok := propFetch.Var.(*ast.ExprVariable); ok {
			if ident, ok := varNode.Name.(*ast.Identifier); ok {
				if string(ident.Value) == "this" {
					// Get the property name (model name)
					if propName, ok := propFetch.Prop.(*ast.Identifier); ok {
						receiver := string(propName.Value)

						line := 0
						if node.Position != nil {
							line = node.Position.StartLine
						}

						e.calls = append(e.calls, types.MethodCall{
							Receiver: receiver,
							Method:   methodName,
							File:     e.filename,
							Line:     line,
						})
					}
				}
			}
		}
	}
}

// ParsePHPDirectory parses all PHP files in a directory
func ParsePHPDirectory(dir string, isModel bool) ([]types.PHPClass, []types.MethodCall, error) {
	var allClasses []types.PHPClass
	var allCalls []types.MethodCall

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() || !strings.HasSuffix(info.Name(), ".php") {
			return nil
		}

		// Skip index.html and similar
		if info.Name() == "index.html" {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		relPath, _ := filepath.Rel(dir, path)
		classes, calls, err := ParsePHPCode(string(content), relPath, isModel)
		if err != nil {
			// Log but continue on parse errors
			return nil
		}

		allClasses = append(allClasses, classes...)
		allCalls = append(allCalls, calls...)

		return nil
	})

	return allClasses, allCalls, err
}
```

**Step 4: Run test to verify it passes**

Run: `go test ./parser/... -v -run TestParsePHPClass`
Expected: PASS

**Step 5: Commit**

```bash
git add parser/php_parser.go parser/php_parser_test.go
git commit -m "feat: add PHP parser using z7zmey/php-parser"
```

---

## Task 6: Analyzer - Find Unused Methods

**Files:**
- Create: `analyzer/analyzer.go`
- Create: `analyzer/analyzer_test.go`

**Step 1: Write the test**

```go
package analyzer

import (
	"testing"

	"go-clean/types"
)

func TestAnalyze(t *testing.T) {
	endpoints := []types.Endpoint{
		{ControllerNorm: "Game", Method: "gameDetail"},
		{ControllerNorm: "Game", Method: "cancelGame"},
	}

	controllers := []types.PHPClass{
		{
			Name: "Game",
			File: "Game.php",
			Methods: []types.PHPMethod{
				{Name: "gameDetail", Visibility: "public", Line: 10},
				{Name: "cancelGame", Visibility: "public", Line: 20},
				{Name: "unusedMethod", Visibility: "public", Line: 30},
				{Name: "helperMethod", Visibility: "private", Line: 40},
			},
		},
	}

	models := []types.PHPClass{
		{
			Name:    "MGame",
			File:    "MGame.php",
			IsModel: true,
			Methods: []types.PHPMethod{
				{Name: "getById", Visibility: "public", Line: 10},
				{Name: "unusedQuery", Visibility: "public", Line: 20},
			},
		},
	}

	calls := []types.MethodCall{
		{Receiver: "MGame", Method: "getById", File: "Game.php", Line: 15},
	}

	result := Analyze(endpoints, controllers, models, calls)

	// Should find 1 unused controller method
	if len(result.UnusedControllerMethods["Game.php"]) != 1 {
		t.Errorf("expected 1 unused controller method, got %d", len(result.UnusedControllerMethods["Game.php"]))
	}

	// Should find 1 unused model method
	if len(result.UnusedModelMethods["MGame.php"]) != 1 {
		t.Errorf("expected 1 unused model method, got %d", len(result.UnusedModelMethods["MGame.php"]))
	}
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./analyzer/... -v`
Expected: FAIL - Analyze not defined

**Step 3: Implement analyzer**

```go
package analyzer

import (
	"strings"

	"go-clean/types"
)

// Analyze compares endpoints with PHP classes to find unused methods
func Analyze(
	endpoints []types.Endpoint,
	controllers []types.PHPClass,
	models []types.PHPClass,
	calls []types.MethodCall,
) types.AnalysisResult {
	result := types.AnalysisResult{
		UnusedControllerMethods: make(map[string][]types.PHPMethod),
		UnusedModelMethods:      make(map[string][]types.PHPMethod),
	}

	// Build set of used controller methods from endpoints
	usedControllerMethods := make(map[string]map[string]bool)
	for _, ep := range endpoints {
		key := strings.ToLower(ep.ControllerNorm)
		if usedControllerMethods[key] == nil {
			usedControllerMethods[key] = make(map[string]bool)
		}
		usedControllerMethods[key][strings.ToLower(ep.Method)] = true
	}

	// Find unused controller methods
	for _, class := range controllers {
		classKey := strings.ToLower(class.Name)
		usedMethods := usedControllerMethods[classKey]

		for _, method := range class.Methods {
			// Skip non-public and constructor
			if method.Visibility != "public" || method.Name == "__construct" {
				continue
			}

			methodKey := strings.ToLower(method.Name)
			if usedMethods == nil || !usedMethods[methodKey] {
				result.UnusedControllerMethods[class.File] = append(
					result.UnusedControllerMethods[class.File],
					method,
				)
			}
		}
	}

	// Build set of used model methods from calls
	usedModelMethods := make(map[string]map[string]bool)
	for _, call := range calls {
		key := strings.ToLower(call.Receiver)
		if usedModelMethods[key] == nil {
			usedModelMethods[key] = make(map[string]bool)
		}
		usedModelMethods[key][strings.ToLower(call.Method)] = true
	}

	// Find unused model methods
	for _, class := range models {
		classKey := strings.ToLower(class.Name)
		usedMethods := usedModelMethods[classKey]

		for _, method := range class.Methods {
			// Skip non-public and constructor
			if method.Visibility != "public" || method.Name == "__construct" {
				continue
			}

			methodKey := strings.ToLower(method.Name)
			if usedMethods == nil || !usedMethods[methodKey] {
				result.UnusedModelMethods[class.File] = append(
					result.UnusedModelMethods[class.File],
					method,
				)
			}
		}
	}

	return result
}
```

**Step 4: Run test to verify it passes**

Run: `go test ./analyzer/... -v`
Expected: PASS

**Step 5: Commit**

```bash
git add analyzer/
git commit -m "feat: add analyzer to find unused methods"
```

---

## Task 7: Reporter - Text Output

**Files:**
- Create: `reporter/text_reporter.go`

**Step 1: Implement text reporter**

```go
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
```

**Step 2: Verify compilation**

Run: `go build ./...`
Expected: No errors

**Step 3: Commit**

```bash
git add reporter/
git commit -m "feat: add text reporter for analysis results"
```

---

## Task 8: Main Entry Point

**Files:**
- Modify: `main.go`

**Step 1: Implement main with CLI flags**

```go
package main

import (
	"flag"
	"fmt"
	"os"

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
	fmt.Fprintf(os.Stderr, "  找到 %d 个类\n", len(controllerClasses))

	// Parse PHP models
	fmt.Fprintf(os.Stderr, "解析 PHP Models: %s\n", *models)
	modelClasses, modelCalls, err := parser.ParsePHPDirectory(*models, true)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing model files: %v\n", err)
		os.Exit(1)
	}
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
```

**Step 2: Build and test**

Run:
```bash
go build -o go-clean . && ./go-clean \
  --api-modules=/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-weixin/api/modules \
  --controllers=/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-api/v3/application/controllers \
  --models=/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-api/v3/application/models
```

Expected: Report output showing unused methods

**Step 3: Commit**

```bash
git add main.go
git commit -m "feat: add main entry point with CLI flags"
```

---

## Task 9: Handle Model Subdirectories

**Files:**
- Modify: `parser/php_parser.go`

**Step 1: Ensure subdirectory handling works**

The `filepath.Walk` in `ParsePHPDirectory` already handles subdirectories recursively. Verify it works with the `models/gamble/` and `models/sysrule/` directories.

Run test with real files to verify subdirectories are scanned.

**Step 2: Commit if changes needed**

```bash
git add parser/php_parser.go
git commit -m "fix: ensure model subdirectories are scanned"
```

---

## Task 10: Final Integration Test

**Step 1: Run full analysis on real codebase**

```bash
./go-clean \
  --api-modules=/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-weixin/api/modules \
  --controllers=/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-api/v3/application/controllers \
  --models=/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-api/v3/application/models
```

**Step 2: Review output for accuracy**

- Check that reported unused methods are truly unused
- Verify no false positives
- Check line numbers are correct

**Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete go-clean unused API analyzer"
```
