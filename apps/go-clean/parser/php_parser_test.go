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
