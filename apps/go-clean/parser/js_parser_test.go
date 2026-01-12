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
