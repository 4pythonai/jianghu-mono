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
