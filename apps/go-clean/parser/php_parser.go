package parser

import (
	"os"
	"path/filepath"
	"strings"

	"go-clean/types"

	"github.com/z7zmey/php-parser/node"
	"github.com/z7zmey/php-parser/node/expr"
	"github.com/z7zmey/php-parser/node/stmt"
	"github.com/z7zmey/php-parser/parser"
	"github.com/z7zmey/php-parser/walker"
)

// phpVisitor implements walker.Visitor to extract class information
type phpVisitor struct {
	classes      []types.PHPClass
	calls        []types.MethodCall
	currentClass *types.PHPClass
	filename     string
	isModel      bool
}

// EnterNode is called when entering a node
func (v *phpVisitor) EnterNode(w walker.Walkable) bool {
	switch n := w.(type) {
	case *stmt.Class:
		// Extract class name
		className := ""
		if id, ok := n.ClassName.(*node.Identifier); ok {
			className = id.Value
		}

		v.currentClass = &types.PHPClass{
			Name:    className,
			File:    v.filename,
			Methods: []types.PHPMethod{},
			IsModel: v.isModel,
		}

	case *stmt.ClassMethod:
		if v.currentClass == nil {
			return true
		}

		// Extract method name
		methodName := ""
		if id, ok := n.MethodName.(*node.Identifier); ok {
			methodName = id.Value
		}

		// Extract visibility from modifiers
		visibility := "public" // default in PHP
		for _, mod := range n.Modifiers {
			if id, ok := mod.(*node.Identifier); ok {
				switch id.Value {
				case "public", "private", "protected":
					visibility = id.Value
				}
			}
		}

		// Get line number
		line := 0
		if n.Position != nil {
			line = n.Position.StartLine
		}

		v.currentClass.Methods = append(v.currentClass.Methods, types.PHPMethod{
			Name:       methodName,
			Line:       line,
			Visibility: visibility,
		})

	case *expr.MethodCall:
		// Pattern 1: $this->method() - direct method call on same class
		if variable, ok := n.Variable.(*expr.Variable); ok {
			if id, ok := variable.VarName.(*node.Identifier); ok {
				if id.Value == "this" && v.currentClass != nil {
					// Get the method name
					methodName := ""
					if methodId, ok := n.Method.(*node.Identifier); ok {
						methodName = methodId.Value
					}

					if methodName != "" {
						line := 0
						if n.Position != nil {
							line = n.Position.StartLine
						}

						// Use current class name as receiver for $this->method() calls
						v.calls = append(v.calls, types.MethodCall{
							Receiver: v.currentClass.Name,
							Method:   methodName,
							File:     v.filename,
							Line:     line,
						})
					}
				}
			}
		}

		// Pattern 2: $this->SomeProperty->method() - method call via property
		if propFetch, ok := n.Variable.(*expr.PropertyFetch); ok {
			// Check if the variable is $this
			if variable, ok := propFetch.Variable.(*expr.Variable); ok {
				if id, ok := variable.VarName.(*node.Identifier); ok {
					if id.Value == "this" {
						// Get the property name (e.g., MGame)
						receiver := ""
						if propId, ok := propFetch.Property.(*node.Identifier); ok {
							receiver = propId.Value
						}

						// Get the method name
						methodName := ""
						if methodId, ok := n.Method.(*node.Identifier); ok {
							methodName = methodId.Value
						}

						if receiver != "" && methodName != "" {
							line := 0
							if n.Position != nil {
								line = n.Position.StartLine
							}

							v.calls = append(v.calls, types.MethodCall{
								Receiver: receiver,
								Method:   methodName,
								File:     v.filename,
								Line:     line,
							})
						}
					}
				}
			}
		}
	}

	return true
}

// LeaveNode is called when leaving a node
func (v *phpVisitor) LeaveNode(w walker.Walkable) {
	if _, ok := w.(*stmt.Class); ok {
		if v.currentClass != nil {
			v.classes = append(v.classes, *v.currentClass)
			v.currentClass = nil
		}
	}
}

// EnterChildNode is called when entering a child node
func (v *phpVisitor) EnterChildNode(key string, w walker.Walkable) {}

// LeaveChildNode is called when leaving a child node
func (v *phpVisitor) LeaveChildNode(key string, w walker.Walkable) {}

// EnterChildList is called when entering a child list
func (v *phpVisitor) EnterChildList(key string, w walker.Walkable) {}

// LeaveChildList is called when leaving a child list
func (v *phpVisitor) LeaveChildList(key string, w walker.Walkable) {}

// ParsePHPCode parses PHP source code and extracts class and method information
func ParsePHPCode(code string, filename string, isModel bool) ([]types.PHPClass, []types.MethodCall, error) {
	p, err := parser.NewParser([]byte(code), "7.4")
	if err != nil {
		return nil, nil, err
	}

	p.Parse()

	rootNode := p.GetRootNode()
	if rootNode == nil {
		return nil, nil, nil
	}

	v := &phpVisitor{
		filename: filename,
		isModel:  isModel,
	}

	rootNode.Walk(v)

	return v.classes, v.calls, nil
}

// ParsePHPDirectory parses all PHP files in a directory recursively
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

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		classes, calls, err := ParsePHPCode(string(content), path, isModel)
		if err != nil {
			// Log error but continue processing other files
			return nil
		}

		allClasses = append(allClasses, classes...)
		allCalls = append(allCalls, calls...)

		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return allClasses, allCalls, nil
}
