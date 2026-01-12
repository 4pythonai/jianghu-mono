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
