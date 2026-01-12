package parser

import (
	"os"
	"path/filepath"
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
