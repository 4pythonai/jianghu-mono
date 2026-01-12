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
