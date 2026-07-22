var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/jmespath/jmespath.js
var require_jmespath = __commonJS({
  "node_modules/jmespath/jmespath.js"(exports) {
    (function(exports2) {
      "use strict";
      function isArray(obj) {
        if (obj !== null) {
          return Object.prototype.toString.call(obj) === "[object Array]";
        } else {
          return false;
        }
      }
      function isObject(obj) {
        if (obj !== null) {
          return Object.prototype.toString.call(obj) === "[object Object]";
        } else {
          return false;
        }
      }
      function strictDeepEqual(first, second) {
        if (first === second) {
          return true;
        }
        var firstType = Object.prototype.toString.call(first);
        if (firstType !== Object.prototype.toString.call(second)) {
          return false;
        }
        if (isArray(first) === true) {
          if (first.length !== second.length) {
            return false;
          }
          for (var i = 0; i < first.length; i++) {
            if (strictDeepEqual(first[i], second[i]) === false) {
              return false;
            }
          }
          return true;
        }
        if (isObject(first) === true) {
          var keysSeen = {};
          for (var key in first) {
            if (hasOwnProperty.call(first, key)) {
              if (strictDeepEqual(first[key], second[key]) === false) {
                return false;
              }
              keysSeen[key] = true;
            }
          }
          for (var key2 in second) {
            if (hasOwnProperty.call(second, key2)) {
              if (keysSeen[key2] !== true) {
                return false;
              }
            }
          }
          return true;
        }
        return false;
      }
      function isFalse(obj) {
        if (obj === "" || obj === false || obj === null) {
          return true;
        } else if (isArray(obj) && obj.length === 0) {
          return true;
        } else if (isObject(obj)) {
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              return false;
            }
          }
          return true;
        } else {
          return false;
        }
      }
      function objValues(obj) {
        var keys = Object.keys(obj);
        var values = [];
        for (var i = 0; i < keys.length; i++) {
          values.push(obj[keys[i]]);
        }
        return values;
      }
      function merge(a, b) {
        var merged = {};
        for (var key in a) {
          merged[key] = a[key];
        }
        for (var key2 in b) {
          merged[key2] = b[key2];
        }
        return merged;
      }
      var trimLeft;
      if (typeof String.prototype.trimLeft === "function") {
        trimLeft = function(str) {
          return str.trimLeft();
        };
      } else {
        trimLeft = function(str) {
          return str.match(/^\s*(.*)/)[1];
        };
      }
      var TYPE_NUMBER = 0;
      var TYPE_ANY = 1;
      var TYPE_STRING = 2;
      var TYPE_ARRAY = 3;
      var TYPE_OBJECT = 4;
      var TYPE_BOOLEAN = 5;
      var TYPE_EXPREF = 6;
      var TYPE_NULL = 7;
      var TYPE_ARRAY_NUMBER = 8;
      var TYPE_ARRAY_STRING = 9;
      var TYPE_NAME_TABLE = {
        0: "number",
        1: "any",
        2: "string",
        3: "array",
        4: "object",
        5: "boolean",
        6: "expression",
        7: "null",
        8: "Array<number>",
        9: "Array<string>"
      };
      var TOK_EOF = "EOF";
      var TOK_UNQUOTEDIDENTIFIER = "UnquotedIdentifier";
      var TOK_QUOTEDIDENTIFIER = "QuotedIdentifier";
      var TOK_RBRACKET = "Rbracket";
      var TOK_RPAREN = "Rparen";
      var TOK_COMMA = "Comma";
      var TOK_COLON = "Colon";
      var TOK_RBRACE = "Rbrace";
      var TOK_NUMBER = "Number";
      var TOK_CURRENT = "Current";
      var TOK_EXPREF = "Expref";
      var TOK_PIPE = "Pipe";
      var TOK_OR = "Or";
      var TOK_AND = "And";
      var TOK_EQ = "EQ";
      var TOK_GT = "GT";
      var TOK_LT = "LT";
      var TOK_GTE = "GTE";
      var TOK_LTE = "LTE";
      var TOK_NE = "NE";
      var TOK_FLATTEN = "Flatten";
      var TOK_STAR = "Star";
      var TOK_FILTER = "Filter";
      var TOK_DOT = "Dot";
      var TOK_NOT = "Not";
      var TOK_LBRACE = "Lbrace";
      var TOK_LBRACKET = "Lbracket";
      var TOK_LPAREN = "Lparen";
      var TOK_LITERAL = "Literal";
      var basicTokens = {
        ".": TOK_DOT,
        "*": TOK_STAR,
        ",": TOK_COMMA,
        ":": TOK_COLON,
        "{": TOK_LBRACE,
        "}": TOK_RBRACE,
        "]": TOK_RBRACKET,
        "(": TOK_LPAREN,
        ")": TOK_RPAREN,
        "@": TOK_CURRENT
      };
      var operatorStartToken = {
        "<": true,
        ">": true,
        "=": true,
        "!": true
      };
      var skipChars = {
        " ": true,
        "	": true,
        "\n": true
      };
      function isAlpha(ch) {
        return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
      }
      function isNum(ch) {
        return ch >= "0" && ch <= "9" || ch === "-";
      }
      function isAlphaNum(ch) {
        return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch === "_";
      }
      function Lexer() {
      }
      Lexer.prototype = {
        tokenize: function(stream) {
          var tokens = [];
          this._current = 0;
          var start;
          var identifier;
          var token;
          while (this._current < stream.length) {
            if (isAlpha(stream[this._current])) {
              start = this._current;
              identifier = this._consumeUnquotedIdentifier(stream);
              tokens.push({
                type: TOK_UNQUOTEDIDENTIFIER,
                value: identifier,
                start
              });
            } else if (basicTokens[stream[this._current]] !== void 0) {
              tokens.push({
                type: basicTokens[stream[this._current]],
                value: stream[this._current],
                start: this._current
              });
              this._current++;
            } else if (isNum(stream[this._current])) {
              token = this._consumeNumber(stream);
              tokens.push(token);
            } else if (stream[this._current] === "[") {
              token = this._consumeLBracket(stream);
              tokens.push(token);
            } else if (stream[this._current] === '"') {
              start = this._current;
              identifier = this._consumeQuotedIdentifier(stream);
              tokens.push({
                type: TOK_QUOTEDIDENTIFIER,
                value: identifier,
                start
              });
            } else if (stream[this._current] === "'") {
              start = this._current;
              identifier = this._consumeRawStringLiteral(stream);
              tokens.push({
                type: TOK_LITERAL,
                value: identifier,
                start
              });
            } else if (stream[this._current] === "`") {
              start = this._current;
              var literal = this._consumeLiteral(stream);
              tokens.push({
                type: TOK_LITERAL,
                value: literal,
                start
              });
            } else if (operatorStartToken[stream[this._current]] !== void 0) {
              tokens.push(this._consumeOperator(stream));
            } else if (skipChars[stream[this._current]] !== void 0) {
              this._current++;
            } else if (stream[this._current] === "&") {
              start = this._current;
              this._current++;
              if (stream[this._current] === "&") {
                this._current++;
                tokens.push({ type: TOK_AND, value: "&&", start });
              } else {
                tokens.push({ type: TOK_EXPREF, value: "&", start });
              }
            } else if (stream[this._current] === "|") {
              start = this._current;
              this._current++;
              if (stream[this._current] === "|") {
                this._current++;
                tokens.push({ type: TOK_OR, value: "||", start });
              } else {
                tokens.push({ type: TOK_PIPE, value: "|", start });
              }
            } else {
              var error = new Error("Unknown character:" + stream[this._current]);
              error.name = "LexerError";
              throw error;
            }
          }
          return tokens;
        },
        _consumeUnquotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          while (this._current < stream.length && isAlphaNum(stream[this._current])) {
            this._current++;
          }
          return stream.slice(start, this._current);
        },
        _consumeQuotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== '"' && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === '"')) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          this._current++;
          return JSON.parse(stream.slice(start, this._current));
        },
        _consumeRawStringLiteral: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== "'" && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "'")) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          this._current++;
          var literal = stream.slice(start + 1, this._current - 1);
          return literal.replace("\\'", "'");
        },
        _consumeNumber: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (isNum(stream[this._current]) && this._current < maxLength) {
            this._current++;
          }
          var value = parseInt(stream.slice(start, this._current));
          return { type: TOK_NUMBER, value, start };
        },
        _consumeLBracket: function(stream) {
          var start = this._current;
          this._current++;
          if (stream[this._current] === "?") {
            this._current++;
            return { type: TOK_FILTER, value: "[?", start };
          } else if (stream[this._current] === "]") {
            this._current++;
            return { type: TOK_FLATTEN, value: "[]", start };
          } else {
            return { type: TOK_LBRACKET, value: "[", start };
          }
        },
        _consumeOperator: function(stream) {
          var start = this._current;
          var startingChar = stream[start];
          this._current++;
          if (startingChar === "!") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_NE, value: "!=", start };
            } else {
              return { type: TOK_NOT, value: "!", start };
            }
          } else if (startingChar === "<") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_LTE, value: "<=", start };
            } else {
              return { type: TOK_LT, value: "<", start };
            }
          } else if (startingChar === ">") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_GTE, value: ">=", start };
            } else {
              return { type: TOK_GT, value: ">", start };
            }
          } else if (startingChar === "=") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_EQ, value: "==", start };
            }
          }
        },
        _consumeLiteral: function(stream) {
          this._current++;
          var start = this._current;
          var maxLength = stream.length;
          var literal;
          while (stream[this._current] !== "`" && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "`")) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          var literalString = trimLeft(stream.slice(start, this._current));
          literalString = literalString.replace("\\`", "`");
          if (this._looksLikeJSON(literalString)) {
            literal = JSON.parse(literalString);
          } else {
            literal = JSON.parse('"' + literalString + '"');
          }
          this._current++;
          return literal;
        },
        _looksLikeJSON: function(literalString) {
          var startingChars = '[{"';
          var jsonLiterals = ["true", "false", "null"];
          var numberLooking = "-0123456789";
          if (literalString === "") {
            return false;
          } else if (startingChars.indexOf(literalString[0]) >= 0) {
            return true;
          } else if (jsonLiterals.indexOf(literalString) >= 0) {
            return true;
          } else if (numberLooking.indexOf(literalString[0]) >= 0) {
            try {
              JSON.parse(literalString);
              return true;
            } catch (ex) {
              return false;
            }
          } else {
            return false;
          }
        }
      };
      var bindingPower = {};
      bindingPower[TOK_EOF] = 0;
      bindingPower[TOK_UNQUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_QUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_RBRACKET] = 0;
      bindingPower[TOK_RPAREN] = 0;
      bindingPower[TOK_COMMA] = 0;
      bindingPower[TOK_RBRACE] = 0;
      bindingPower[TOK_NUMBER] = 0;
      bindingPower[TOK_CURRENT] = 0;
      bindingPower[TOK_EXPREF] = 0;
      bindingPower[TOK_PIPE] = 1;
      bindingPower[TOK_OR] = 2;
      bindingPower[TOK_AND] = 3;
      bindingPower[TOK_EQ] = 5;
      bindingPower[TOK_GT] = 5;
      bindingPower[TOK_LT] = 5;
      bindingPower[TOK_GTE] = 5;
      bindingPower[TOK_LTE] = 5;
      bindingPower[TOK_NE] = 5;
      bindingPower[TOK_FLATTEN] = 9;
      bindingPower[TOK_STAR] = 20;
      bindingPower[TOK_FILTER] = 21;
      bindingPower[TOK_DOT] = 40;
      bindingPower[TOK_NOT] = 45;
      bindingPower[TOK_LBRACE] = 50;
      bindingPower[TOK_LBRACKET] = 55;
      bindingPower[TOK_LPAREN] = 60;
      function Parser() {
      }
      Parser.prototype = {
        parse: function(expression) {
          this._loadTokens(expression);
          this.index = 0;
          var ast = this.expression(0);
          if (this._lookahead(0) !== TOK_EOF) {
            var t = this._lookaheadToken(0);
            var error = new Error(
              "Unexpected token type: " + t.type + ", value: " + t.value
            );
            error.name = "ParserError";
            throw error;
          }
          return ast;
        },
        _loadTokens: function(expression) {
          var lexer = new Lexer();
          var tokens = lexer.tokenize(expression);
          tokens.push({ type: TOK_EOF, value: "", start: expression.length });
          this.tokens = tokens;
        },
        expression: function(rbp) {
          var leftToken = this._lookaheadToken(0);
          this._advance();
          var left = this.nud(leftToken);
          var currentToken = this._lookahead(0);
          while (rbp < bindingPower[currentToken]) {
            this._advance();
            left = this.led(currentToken, left);
            currentToken = this._lookahead(0);
          }
          return left;
        },
        _lookahead: function(number) {
          return this.tokens[this.index + number].type;
        },
        _lookaheadToken: function(number) {
          return this.tokens[this.index + number];
        },
        _advance: function() {
          this.index++;
        },
        nud: function(token) {
          var left;
          var right;
          var expression;
          switch (token.type) {
            case TOK_LITERAL:
              return { type: "Literal", value: token.value };
            case TOK_UNQUOTEDIDENTIFIER:
              return { type: "Field", name: token.value };
            case TOK_QUOTEDIDENTIFIER:
              var node = { type: "Field", name: token.value };
              if (this._lookahead(0) === TOK_LPAREN) {
                throw new Error("Quoted identifier not allowed for function names.");
              }
              return node;
            case TOK_NOT:
              right = this.expression(bindingPower.Not);
              return { type: "NotExpression", children: [right] };
            case TOK_STAR:
              left = { type: "Identity" };
              right = null;
              if (this._lookahead(0) === TOK_RBRACKET) {
                right = { type: "Identity" };
              } else {
                right = this._parseProjectionRHS(bindingPower.Star);
              }
              return { type: "ValueProjection", children: [left, right] };
            case TOK_FILTER:
              return this.led(token.type, { type: "Identity" });
            case TOK_LBRACE:
              return this._parseMultiselectHash();
            case TOK_FLATTEN:
              left = { type: TOK_FLATTEN, children: [{ type: "Identity" }] };
              right = this._parseProjectionRHS(bindingPower.Flatten);
              return { type: "Projection", children: [left, right] };
            case TOK_LBRACKET:
              if (this._lookahead(0) === TOK_NUMBER || this._lookahead(0) === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice({ type: "Identity" }, right);
              } else if (this._lookahead(0) === TOK_STAR && this._lookahead(1) === TOK_RBRACKET) {
                this._advance();
                this._advance();
                right = this._parseProjectionRHS(bindingPower.Star);
                return {
                  type: "Projection",
                  children: [{ type: "Identity" }, right]
                };
              }
              return this._parseMultiselectList();
            case TOK_CURRENT:
              return { type: TOK_CURRENT };
            case TOK_EXPREF:
              expression = this.expression(bindingPower.Expref);
              return { type: "ExpressionReference", children: [expression] };
            case TOK_LPAREN:
              var args = [];
              while (this._lookahead(0) !== TOK_RPAREN) {
                if (this._lookahead(0) === TOK_CURRENT) {
                  expression = { type: TOK_CURRENT };
                  this._advance();
                } else {
                  expression = this.expression(0);
                }
                args.push(expression);
              }
              this._match(TOK_RPAREN);
              return args[0];
            default:
              this._errorToken(token);
          }
        },
        led: function(tokenName, left) {
          var right;
          switch (tokenName) {
            case TOK_DOT:
              var rbp = bindingPower.Dot;
              if (this._lookahead(0) !== TOK_STAR) {
                right = this._parseDotRHS(rbp);
                return { type: "Subexpression", children: [left, right] };
              }
              this._advance();
              right = this._parseProjectionRHS(rbp);
              return { type: "ValueProjection", children: [left, right] };
            case TOK_PIPE:
              right = this.expression(bindingPower.Pipe);
              return { type: TOK_PIPE, children: [left, right] };
            case TOK_OR:
              right = this.expression(bindingPower.Or);
              return { type: "OrExpression", children: [left, right] };
            case TOK_AND:
              right = this.expression(bindingPower.And);
              return { type: "AndExpression", children: [left, right] };
            case TOK_LPAREN:
              var name = left.name;
              var args = [];
              var expression, node;
              while (this._lookahead(0) !== TOK_RPAREN) {
                if (this._lookahead(0) === TOK_CURRENT) {
                  expression = { type: TOK_CURRENT };
                  this._advance();
                } else {
                  expression = this.expression(0);
                }
                if (this._lookahead(0) === TOK_COMMA) {
                  this._match(TOK_COMMA);
                }
                args.push(expression);
              }
              this._match(TOK_RPAREN);
              node = { type: "Function", name, children: args };
              return node;
            case TOK_FILTER:
              var condition = this.expression(0);
              this._match(TOK_RBRACKET);
              if (this._lookahead(0) === TOK_FLATTEN) {
                right = { type: "Identity" };
              } else {
                right = this._parseProjectionRHS(bindingPower.Filter);
              }
              return { type: "FilterProjection", children: [left, right, condition] };
            case TOK_FLATTEN:
              var leftNode = { type: TOK_FLATTEN, children: [left] };
              var rightNode = this._parseProjectionRHS(bindingPower.Flatten);
              return { type: "Projection", children: [leftNode, rightNode] };
            case TOK_EQ:
            case TOK_NE:
            case TOK_GT:
            case TOK_GTE:
            case TOK_LT:
            case TOK_LTE:
              return this._parseComparator(left, tokenName);
            case TOK_LBRACKET:
              var token = this._lookaheadToken(0);
              if (token.type === TOK_NUMBER || token.type === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice(left, right);
              }
              this._match(TOK_STAR);
              this._match(TOK_RBRACKET);
              right = this._parseProjectionRHS(bindingPower.Star);
              return { type: "Projection", children: [left, right] };
            default:
              this._errorToken(this._lookaheadToken(0));
          }
        },
        _match: function(tokenType) {
          if (this._lookahead(0) === tokenType) {
            this._advance();
          } else {
            var t = this._lookaheadToken(0);
            var error = new Error("Expected " + tokenType + ", got: " + t.type);
            error.name = "ParserError";
            throw error;
          }
        },
        _errorToken: function(token) {
          var error = new Error("Invalid token (" + token.type + '): "' + token.value + '"');
          error.name = "ParserError";
          throw error;
        },
        _parseIndexExpression: function() {
          if (this._lookahead(0) === TOK_COLON || this._lookahead(1) === TOK_COLON) {
            return this._parseSliceExpression();
          } else {
            var node = {
              type: "Index",
              value: this._lookaheadToken(0).value
            };
            this._advance();
            this._match(TOK_RBRACKET);
            return node;
          }
        },
        _projectIfSlice: function(left, right) {
          var indexExpr = { type: "IndexExpression", children: [left, right] };
          if (right.type === "Slice") {
            return {
              type: "Projection",
              children: [indexExpr, this._parseProjectionRHS(bindingPower.Star)]
            };
          } else {
            return indexExpr;
          }
        },
        _parseSliceExpression: function() {
          var parts = [null, null, null];
          var index = 0;
          var currentToken = this._lookahead(0);
          while (currentToken !== TOK_RBRACKET && index < 3) {
            if (currentToken === TOK_COLON) {
              index++;
              this._advance();
            } else if (currentToken === TOK_NUMBER) {
              parts[index] = this._lookaheadToken(0).value;
              this._advance();
            } else {
              var t = this._lookahead(0);
              var error = new Error("Syntax error, unexpected token: " + t.value + "(" + t.type + ")");
              error.name = "Parsererror";
              throw error;
            }
            currentToken = this._lookahead(0);
          }
          this._match(TOK_RBRACKET);
          return {
            type: "Slice",
            children: parts
          };
        },
        _parseComparator: function(left, comparator) {
          var right = this.expression(bindingPower[comparator]);
          return { type: "Comparator", name: comparator, children: [left, right] };
        },
        _parseDotRHS: function(rbp) {
          var lookahead = this._lookahead(0);
          var exprTokens = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER, TOK_STAR];
          if (exprTokens.indexOf(lookahead) >= 0) {
            return this.expression(rbp);
          } else if (lookahead === TOK_LBRACKET) {
            this._match(TOK_LBRACKET);
            return this._parseMultiselectList();
          } else if (lookahead === TOK_LBRACE) {
            this._match(TOK_LBRACE);
            return this._parseMultiselectHash();
          }
        },
        _parseProjectionRHS: function(rbp) {
          var right;
          if (bindingPower[this._lookahead(0)] < 10) {
            right = { type: "Identity" };
          } else if (this._lookahead(0) === TOK_LBRACKET) {
            right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_FILTER) {
            right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_DOT) {
            this._match(TOK_DOT);
            right = this._parseDotRHS(rbp);
          } else {
            var t = this._lookaheadToken(0);
            var error = new Error("Sytanx error, unexpected token: " + t.value + "(" + t.type + ")");
            error.name = "ParserError";
            throw error;
          }
          return right;
        },
        _parseMultiselectList: function() {
          var expressions = [];
          while (this._lookahead(0) !== TOK_RBRACKET) {
            var expression = this.expression(0);
            expressions.push(expression);
            if (this._lookahead(0) === TOK_COMMA) {
              this._match(TOK_COMMA);
              if (this._lookahead(0) === TOK_RBRACKET) {
                throw new Error("Unexpected token Rbracket");
              }
            }
          }
          this._match(TOK_RBRACKET);
          return { type: "MultiSelectList", children: expressions };
        },
        _parseMultiselectHash: function() {
          var pairs = [];
          var identifierTypes = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER];
          var keyToken, keyName, value, node;
          for (; ; ) {
            keyToken = this._lookaheadToken(0);
            if (identifierTypes.indexOf(keyToken.type) < 0) {
              throw new Error("Expecting an identifier token, got: " + keyToken.type);
            }
            keyName = keyToken.value;
            this._advance();
            this._match(TOK_COLON);
            value = this.expression(0);
            node = { type: "KeyValuePair", name: keyName, value };
            pairs.push(node);
            if (this._lookahead(0) === TOK_COMMA) {
              this._match(TOK_COMMA);
            } else if (this._lookahead(0) === TOK_RBRACE) {
              this._match(TOK_RBRACE);
              break;
            }
          }
          return { type: "MultiSelectHash", children: pairs };
        }
      };
      function TreeInterpreter(runtime) {
        this.runtime = runtime;
      }
      TreeInterpreter.prototype = {
        search: function(node, value) {
          return this.visit(node, value);
        },
        visit: function(node, value) {
          var matched, current, result, first, second, field, left, right, collected, i;
          switch (node.type) {
            case "Field":
              if (value !== null && isObject(value)) {
                field = value[node.name];
                if (field === void 0) {
                  return null;
                } else {
                  return field;
                }
              }
              return null;
            case "Subexpression":
              result = this.visit(node.children[0], value);
              for (i = 1; i < node.children.length; i++) {
                result = this.visit(node.children[1], result);
                if (result === null) {
                  return null;
                }
              }
              return result;
            case "IndexExpression":
              left = this.visit(node.children[0], value);
              right = this.visit(node.children[1], left);
              return right;
            case "Index":
              if (!isArray(value)) {
                return null;
              }
              var index = node.value;
              if (index < 0) {
                index = value.length + index;
              }
              result = value[index];
              if (result === void 0) {
                result = null;
              }
              return result;
            case "Slice":
              if (!isArray(value)) {
                return null;
              }
              var sliceParams = node.children.slice(0);
              var computed = this.computeSliceParams(value.length, sliceParams);
              var start = computed[0];
              var stop = computed[1];
              var step = computed[2];
              result = [];
              if (step > 0) {
                for (i = start; i < stop; i += step) {
                  result.push(value[i]);
                }
              } else {
                for (i = start; i > stop; i += step) {
                  result.push(value[i]);
                }
              }
              return result;
            case "Projection":
              var base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              collected = [];
              for (i = 0; i < base.length; i++) {
                current = this.visit(node.children[1], base[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "ValueProjection":
              base = this.visit(node.children[0], value);
              if (!isObject(base)) {
                return null;
              }
              collected = [];
              var values = objValues(base);
              for (i = 0; i < values.length; i++) {
                current = this.visit(node.children[1], values[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "FilterProjection":
              base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              var filtered = [];
              var finalResults = [];
              for (i = 0; i < base.length; i++) {
                matched = this.visit(node.children[2], base[i]);
                if (!isFalse(matched)) {
                  filtered.push(base[i]);
                }
              }
              for (var j = 0; j < filtered.length; j++) {
                current = this.visit(node.children[1], filtered[j]);
                if (current !== null) {
                  finalResults.push(current);
                }
              }
              return finalResults;
            case "Comparator":
              first = this.visit(node.children[0], value);
              second = this.visit(node.children[1], value);
              switch (node.name) {
                case TOK_EQ:
                  result = strictDeepEqual(first, second);
                  break;
                case TOK_NE:
                  result = !strictDeepEqual(first, second);
                  break;
                case TOK_GT:
                  result = first > second;
                  break;
                case TOK_GTE:
                  result = first >= second;
                  break;
                case TOK_LT:
                  result = first < second;
                  break;
                case TOK_LTE:
                  result = first <= second;
                  break;
                default:
                  throw new Error("Unknown comparator: " + node.name);
              }
              return result;
            case TOK_FLATTEN:
              var original = this.visit(node.children[0], value);
              if (!isArray(original)) {
                return null;
              }
              var merged = [];
              for (i = 0; i < original.length; i++) {
                current = original[i];
                if (isArray(current)) {
                  merged.push.apply(merged, current);
                } else {
                  merged.push(current);
                }
              }
              return merged;
            case "Identity":
              return value;
            case "MultiSelectList":
              if (value === null) {
                return null;
              }
              collected = [];
              for (i = 0; i < node.children.length; i++) {
                collected.push(this.visit(node.children[i], value));
              }
              return collected;
            case "MultiSelectHash":
              if (value === null) {
                return null;
              }
              collected = {};
              var child;
              for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                collected[child.name] = this.visit(child.value, value);
              }
              return collected;
            case "OrExpression":
              matched = this.visit(node.children[0], value);
              if (isFalse(matched)) {
                matched = this.visit(node.children[1], value);
              }
              return matched;
            case "AndExpression":
              first = this.visit(node.children[0], value);
              if (isFalse(first) === true) {
                return first;
              }
              return this.visit(node.children[1], value);
            case "NotExpression":
              first = this.visit(node.children[0], value);
              return isFalse(first);
            case "Literal":
              return node.value;
            case TOK_PIPE:
              left = this.visit(node.children[0], value);
              return this.visit(node.children[1], left);
            case TOK_CURRENT:
              return value;
            case "Function":
              var resolvedArgs = [];
              for (i = 0; i < node.children.length; i++) {
                resolvedArgs.push(this.visit(node.children[i], value));
              }
              return this.runtime.callFunction(node.name, resolvedArgs);
            case "ExpressionReference":
              var refNode = node.children[0];
              refNode.jmespathType = TOK_EXPREF;
              return refNode;
            default:
              throw new Error("Unknown node type: " + node.type);
          }
        },
        computeSliceParams: function(arrayLength, sliceParams) {
          var start = sliceParams[0];
          var stop = sliceParams[1];
          var step = sliceParams[2];
          var computed = [null, null, null];
          if (step === null) {
            step = 1;
          } else if (step === 0) {
            var error = new Error("Invalid slice, step cannot be 0");
            error.name = "RuntimeError";
            throw error;
          }
          var stepValueNegative = step < 0 ? true : false;
          if (start === null) {
            start = stepValueNegative ? arrayLength - 1 : 0;
          } else {
            start = this.capSliceRange(arrayLength, start, step);
          }
          if (stop === null) {
            stop = stepValueNegative ? -1 : arrayLength;
          } else {
            stop = this.capSliceRange(arrayLength, stop, step);
          }
          computed[0] = start;
          computed[1] = stop;
          computed[2] = step;
          return computed;
        },
        capSliceRange: function(arrayLength, actualValue, step) {
          if (actualValue < 0) {
            actualValue += arrayLength;
            if (actualValue < 0) {
              actualValue = step < 0 ? -1 : 0;
            }
          } else if (actualValue >= arrayLength) {
            actualValue = step < 0 ? arrayLength - 1 : arrayLength;
          }
          return actualValue;
        }
      };
      function Runtime(interpreter) {
        this._interpreter = interpreter;
        this.functionTable = {
          // name: [function, <signature>]
          // The <signature> can be:
          //
          // {
          //   args: [[type1, type2], [type1, type2]],
          //   variadic: true|false
          // }
          //
          // Each arg in the arg list is a list of valid types
          // (if the function is overloaded and supports multiple
          // types.  If the type is "any" then no type checking
          // occurs on the argument.  Variadic is optional
          // and if not provided is assumed to be false.
          abs: { _func: this._functionAbs, _signature: [{ types: [TYPE_NUMBER] }] },
          avg: { _func: this._functionAvg, _signature: [{ types: [TYPE_ARRAY_NUMBER] }] },
          ceil: { _func: this._functionCeil, _signature: [{ types: [TYPE_NUMBER] }] },
          contains: {
            _func: this._functionContains,
            _signature: [
              { types: [TYPE_STRING, TYPE_ARRAY] },
              { types: [TYPE_ANY] }
            ]
          },
          "ends_with": {
            _func: this._functionEndsWith,
            _signature: [{ types: [TYPE_STRING] }, { types: [TYPE_STRING] }]
          },
          floor: { _func: this._functionFloor, _signature: [{ types: [TYPE_NUMBER] }] },
          length: {
            _func: this._functionLength,
            _signature: [{ types: [TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT] }]
          },
          map: {
            _func: this._functionMap,
            _signature: [{ types: [TYPE_EXPREF] }, { types: [TYPE_ARRAY] }]
          },
          max: {
            _func: this._functionMax,
            _signature: [{ types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING] }]
          },
          "merge": {
            _func: this._functionMerge,
            _signature: [{ types: [TYPE_OBJECT], variadic: true }]
          },
          "max_by": {
            _func: this._functionMaxBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          sum: { _func: this._functionSum, _signature: [{ types: [TYPE_ARRAY_NUMBER] }] },
          "starts_with": {
            _func: this._functionStartsWith,
            _signature: [{ types: [TYPE_STRING] }, { types: [TYPE_STRING] }]
          },
          min: {
            _func: this._functionMin,
            _signature: [{ types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING] }]
          },
          "min_by": {
            _func: this._functionMinBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          type: { _func: this._functionType, _signature: [{ types: [TYPE_ANY] }] },
          keys: { _func: this._functionKeys, _signature: [{ types: [TYPE_OBJECT] }] },
          values: { _func: this._functionValues, _signature: [{ types: [TYPE_OBJECT] }] },
          sort: { _func: this._functionSort, _signature: [{ types: [TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER] }] },
          "sort_by": {
            _func: this._functionSortBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          join: {
            _func: this._functionJoin,
            _signature: [
              { types: [TYPE_STRING] },
              { types: [TYPE_ARRAY_STRING] }
            ]
          },
          reverse: {
            _func: this._functionReverse,
            _signature: [{ types: [TYPE_STRING, TYPE_ARRAY] }]
          },
          "to_array": { _func: this._functionToArray, _signature: [{ types: [TYPE_ANY] }] },
          "to_string": { _func: this._functionToString, _signature: [{ types: [TYPE_ANY] }] },
          "to_number": { _func: this._functionToNumber, _signature: [{ types: [TYPE_ANY] }] },
          "not_null": {
            _func: this._functionNotNull,
            _signature: [{ types: [TYPE_ANY], variadic: true }]
          }
        };
      }
      Runtime.prototype = {
        callFunction: function(name, resolvedArgs) {
          var functionEntry = this.functionTable[name];
          if (functionEntry === void 0) {
            throw new Error("Unknown function: " + name + "()");
          }
          this._validateArgs(name, resolvedArgs, functionEntry._signature);
          return functionEntry._func.call(this, resolvedArgs);
        },
        _validateArgs: function(name, args, signature) {
          var pluralized;
          if (signature[signature.length - 1].variadic) {
            if (args.length < signature.length) {
              pluralized = signature.length === 1 ? " argument" : " arguments";
              throw new Error("ArgumentError: " + name + "() takes at least" + signature.length + pluralized + " but received " + args.length);
            }
          } else if (args.length !== signature.length) {
            pluralized = signature.length === 1 ? " argument" : " arguments";
            throw new Error("ArgumentError: " + name + "() takes " + signature.length + pluralized + " but received " + args.length);
          }
          var currentSpec;
          var actualType;
          var typeMatched;
          for (var i = 0; i < signature.length; i++) {
            typeMatched = false;
            currentSpec = signature[i].types;
            actualType = this._getTypeName(args[i]);
            for (var j = 0; j < currentSpec.length; j++) {
              if (this._typeMatches(actualType, currentSpec[j], args[i])) {
                typeMatched = true;
                break;
              }
            }
            if (!typeMatched) {
              var expected = currentSpec.map(function(typeIdentifier) {
                return TYPE_NAME_TABLE[typeIdentifier];
              }).join(",");
              throw new Error("TypeError: " + name + "() expected argument " + (i + 1) + " to be type " + expected + " but received type " + TYPE_NAME_TABLE[actualType] + " instead.");
            }
          }
        },
        _typeMatches: function(actual, expected, argValue) {
          if (expected === TYPE_ANY) {
            return true;
          }
          if (expected === TYPE_ARRAY_STRING || expected === TYPE_ARRAY_NUMBER || expected === TYPE_ARRAY) {
            if (expected === TYPE_ARRAY) {
              return actual === TYPE_ARRAY;
            } else if (actual === TYPE_ARRAY) {
              var subtype;
              if (expected === TYPE_ARRAY_NUMBER) {
                subtype = TYPE_NUMBER;
              } else if (expected === TYPE_ARRAY_STRING) {
                subtype = TYPE_STRING;
              }
              for (var i = 0; i < argValue.length; i++) {
                if (!this._typeMatches(
                  this._getTypeName(argValue[i]),
                  subtype,
                  argValue[i]
                )) {
                  return false;
                }
              }
              return true;
            }
          } else {
            return actual === expected;
          }
        },
        _getTypeName: function(obj) {
          switch (Object.prototype.toString.call(obj)) {
            case "[object String]":
              return TYPE_STRING;
            case "[object Number]":
              return TYPE_NUMBER;
            case "[object Array]":
              return TYPE_ARRAY;
            case "[object Boolean]":
              return TYPE_BOOLEAN;
            case "[object Null]":
              return TYPE_NULL;
            case "[object Object]":
              if (obj.jmespathType === TOK_EXPREF) {
                return TYPE_EXPREF;
              } else {
                return TYPE_OBJECT;
              }
          }
        },
        _functionStartsWith: function(resolvedArgs) {
          return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
        },
        _functionEndsWith: function(resolvedArgs) {
          var searchStr = resolvedArgs[0];
          var suffix = resolvedArgs[1];
          return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
        },
        _functionReverse: function(resolvedArgs) {
          var typeName = this._getTypeName(resolvedArgs[0]);
          if (typeName === TYPE_STRING) {
            var originalStr = resolvedArgs[0];
            var reversedStr = "";
            for (var i = originalStr.length - 1; i >= 0; i--) {
              reversedStr += originalStr[i];
            }
            return reversedStr;
          } else {
            var reversedArray = resolvedArgs[0].slice(0);
            reversedArray.reverse();
            return reversedArray;
          }
        },
        _functionAbs: function(resolvedArgs) {
          return Math.abs(resolvedArgs[0]);
        },
        _functionCeil: function(resolvedArgs) {
          return Math.ceil(resolvedArgs[0]);
        },
        _functionAvg: function(resolvedArgs) {
          var sum = 0;
          var inputArray = resolvedArgs[0];
          for (var i = 0; i < inputArray.length; i++) {
            sum += inputArray[i];
          }
          return sum / inputArray.length;
        },
        _functionContains: function(resolvedArgs) {
          return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
        },
        _functionFloor: function(resolvedArgs) {
          return Math.floor(resolvedArgs[0]);
        },
        _functionLength: function(resolvedArgs) {
          if (!isObject(resolvedArgs[0])) {
            return resolvedArgs[0].length;
          } else {
            return Object.keys(resolvedArgs[0]).length;
          }
        },
        _functionMap: function(resolvedArgs) {
          var mapped = [];
          var interpreter = this._interpreter;
          var exprefNode = resolvedArgs[0];
          var elements = resolvedArgs[1];
          for (var i = 0; i < elements.length; i++) {
            mapped.push(interpreter.visit(exprefNode, elements[i]));
          }
          return mapped;
        },
        _functionMerge: function(resolvedArgs) {
          var merged = {};
          for (var i = 0; i < resolvedArgs.length; i++) {
            var current = resolvedArgs[i];
            for (var key in current) {
              merged[key] = current[key];
            }
          }
          return merged;
        },
        _functionMax: function(resolvedArgs) {
          if (resolvedArgs[0].length > 0) {
            var typeName = this._getTypeName(resolvedArgs[0][0]);
            if (typeName === TYPE_NUMBER) {
              return Math.max.apply(Math, resolvedArgs[0]);
            } else {
              var elements = resolvedArgs[0];
              var maxElement = elements[0];
              for (var i = 1; i < elements.length; i++) {
                if (maxElement.localeCompare(elements[i]) < 0) {
                  maxElement = elements[i];
                }
              }
              return maxElement;
            }
          } else {
            return null;
          }
        },
        _functionMin: function(resolvedArgs) {
          if (resolvedArgs[0].length > 0) {
            var typeName = this._getTypeName(resolvedArgs[0][0]);
            if (typeName === TYPE_NUMBER) {
              return Math.min.apply(Math, resolvedArgs[0]);
            } else {
              var elements = resolvedArgs[0];
              var minElement = elements[0];
              for (var i = 1; i < elements.length; i++) {
                if (elements[i].localeCompare(minElement) < 0) {
                  minElement = elements[i];
                }
              }
              return minElement;
            }
          } else {
            return null;
          }
        },
        _functionSum: function(resolvedArgs) {
          var sum = 0;
          var listToSum = resolvedArgs[0];
          for (var i = 0; i < listToSum.length; i++) {
            sum += listToSum[i];
          }
          return sum;
        },
        _functionType: function(resolvedArgs) {
          switch (this._getTypeName(resolvedArgs[0])) {
            case TYPE_NUMBER:
              return "number";
            case TYPE_STRING:
              return "string";
            case TYPE_ARRAY:
              return "array";
            case TYPE_OBJECT:
              return "object";
            case TYPE_BOOLEAN:
              return "boolean";
            case TYPE_EXPREF:
              return "expref";
            case TYPE_NULL:
              return "null";
          }
        },
        _functionKeys: function(resolvedArgs) {
          return Object.keys(resolvedArgs[0]);
        },
        _functionValues: function(resolvedArgs) {
          var obj = resolvedArgs[0];
          var keys = Object.keys(obj);
          var values = [];
          for (var i = 0; i < keys.length; i++) {
            values.push(obj[keys[i]]);
          }
          return values;
        },
        _functionJoin: function(resolvedArgs) {
          var joinChar = resolvedArgs[0];
          var listJoin = resolvedArgs[1];
          return listJoin.join(joinChar);
        },
        _functionToArray: function(resolvedArgs) {
          if (this._getTypeName(resolvedArgs[0]) === TYPE_ARRAY) {
            return resolvedArgs[0];
          } else {
            return [resolvedArgs[0]];
          }
        },
        _functionToString: function(resolvedArgs) {
          if (this._getTypeName(resolvedArgs[0]) === TYPE_STRING) {
            return resolvedArgs[0];
          } else {
            return JSON.stringify(resolvedArgs[0]);
          }
        },
        _functionToNumber: function(resolvedArgs) {
          var typeName = this._getTypeName(resolvedArgs[0]);
          var convertedValue;
          if (typeName === TYPE_NUMBER) {
            return resolvedArgs[0];
          } else if (typeName === TYPE_STRING) {
            convertedValue = +resolvedArgs[0];
            if (!isNaN(convertedValue)) {
              return convertedValue;
            }
          }
          return null;
        },
        _functionNotNull: function(resolvedArgs) {
          for (var i = 0; i < resolvedArgs.length; i++) {
            if (this._getTypeName(resolvedArgs[i]) !== TYPE_NULL) {
              return resolvedArgs[i];
            }
          }
          return null;
        },
        _functionSort: function(resolvedArgs) {
          var sortedArray = resolvedArgs[0].slice(0);
          sortedArray.sort();
          return sortedArray;
        },
        _functionSortBy: function(resolvedArgs) {
          var sortedArray = resolvedArgs[0].slice(0);
          if (sortedArray.length === 0) {
            return sortedArray;
          }
          var interpreter = this._interpreter;
          var exprefNode = resolvedArgs[1];
          var requiredType = this._getTypeName(
            interpreter.visit(exprefNode, sortedArray[0])
          );
          if ([TYPE_NUMBER, TYPE_STRING].indexOf(requiredType) < 0) {
            throw new Error("TypeError");
          }
          var that = this;
          var decorated = [];
          for (var i = 0; i < sortedArray.length; i++) {
            decorated.push([i, sortedArray[i]]);
          }
          decorated.sort(function(a, b) {
            var exprA = interpreter.visit(exprefNode, a[1]);
            var exprB = interpreter.visit(exprefNode, b[1]);
            if (that._getTypeName(exprA) !== requiredType) {
              throw new Error(
                "TypeError: expected " + requiredType + ", received " + that._getTypeName(exprA)
              );
            } else if (that._getTypeName(exprB) !== requiredType) {
              throw new Error(
                "TypeError: expected " + requiredType + ", received " + that._getTypeName(exprB)
              );
            }
            if (exprA > exprB) {
              return 1;
            } else if (exprA < exprB) {
              return -1;
            } else {
              return a[0] - b[0];
            }
          });
          for (var j = 0; j < decorated.length; j++) {
            sortedArray[j] = decorated[j][1];
          }
          return sortedArray;
        },
        _functionMaxBy: function(resolvedArgs) {
          var exprefNode = resolvedArgs[1];
          var resolvedArray = resolvedArgs[0];
          var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
          var maxNumber = -Infinity;
          var maxRecord;
          var current;
          for (var i = 0; i < resolvedArray.length; i++) {
            current = keyFunction(resolvedArray[i]);
            if (current > maxNumber) {
              maxNumber = current;
              maxRecord = resolvedArray[i];
            }
          }
          return maxRecord;
        },
        _functionMinBy: function(resolvedArgs) {
          var exprefNode = resolvedArgs[1];
          var resolvedArray = resolvedArgs[0];
          var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
          var minNumber = Infinity;
          var minRecord;
          var current;
          for (var i = 0; i < resolvedArray.length; i++) {
            current = keyFunction(resolvedArray[i]);
            if (current < minNumber) {
              minNumber = current;
              minRecord = resolvedArray[i];
            }
          }
          return minRecord;
        },
        createKeyFunction: function(exprefNode, allowedTypes) {
          var that = this;
          var interpreter = this._interpreter;
          var keyFunc = function(x) {
            var current = interpreter.visit(exprefNode, x);
            if (allowedTypes.indexOf(that._getTypeName(current)) < 0) {
              var msg = "TypeError: expected one of " + allowedTypes + ", received " + that._getTypeName(current);
              throw new Error(msg);
            }
            return current;
          };
          return keyFunc;
        }
      };
      function compile(stream) {
        var parser = new Parser();
        var ast = parser.parse(stream);
        return ast;
      }
      function tokenize(stream) {
        var lexer = new Lexer();
        return lexer.tokenize(stream);
      }
      function search(data, expression) {
        var parser = new Parser();
        var runtime = new Runtime();
        var interpreter = new TreeInterpreter(runtime);
        runtime._interpreter = interpreter;
        var node = parser.parse(expression);
        return interpreter.search(node, data);
      }
      exports2.tokenize = tokenize;
      exports2.compile = compile;
      exports2.search = search;
      exports2.strictDeepEqual = strictDeepEqual;
    })(typeof exports === "undefined" ? exports.jmespath = {} : exports);
  }
});

// node_modules/@upstash/core-analytics/dist/index.js
var require_dist = __commonJS({
  "node_modules/@upstash/core-analytics/dist/index.js"(exports, module) {
    "use strict";
    var g = Object.defineProperty;
    var k = Object.getOwnPropertyDescriptor;
    var _ = Object.getOwnPropertyNames;
    var y = Object.prototype.hasOwnProperty;
    var w = (l, e) => {
      for (var t in e) g(l, t, { get: e[t], enumerable: true });
    };
    var A = (l, e, t, i) => {
      if (e && typeof e == "object" || typeof e == "function") for (let s of _(e)) !y.call(l, s) && s !== t && g(l, s, { get: () => e[s], enumerable: !(i = k(e, s)) || i.enumerable });
      return l;
    };
    var x = (l) => A(g({}, "__esModule", { value: true }), l);
    var S = {};
    w(S, { Analytics: () => b });
    module.exports = x(S);
    var p = `
local key = KEYS[1]
local field = ARGV[1]

local data = redis.call("ZRANGE", key, 0, -1, "WITHSCORES")
local count = {}

for i = 1, #data, 2 do
  local json_str = data[i]
  local score = tonumber(data[i + 1])
  local obj = cjson.decode(json_str)

  local fieldValue = obj[field]

  if count[fieldValue] == nil then
    count[fieldValue] = score
  else
    count[fieldValue] = count[fieldValue] + score
  end
end

local result = {}
for k, v in pairs(count) do
  table.insert(result, {k, v})
end

return result
`;
    var f = `
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1]) -- First timestamp to check
local increment = tonumber(ARGV[2])       -- Increment between each timestamp
local num_timestamps = tonumber(ARGV[3])  -- Number of timestampts to check (24 for a day and 24 * 7 for a week)
local num_elements = tonumber(ARGV[4])    -- Number of elements to fetch in each category
local check_at_most = tonumber(ARGV[5])   -- Number of elements to check at most.

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

-- select num_elements many items
local true_group = {}
local false_group = {}
local denied_group = {}
local true_count = 0
local false_count = 0
local denied_count = 0
local i = #result - 1

-- index to stop at after going through "checkAtMost" many items:
local cutoff_index = #result - 2 * check_at_most

-- iterate over the results
while (true_count + false_count + denied_count) < (num_elements * 3) and 1 <= i and i >= cutoff_index do
  local score = tonumber(result[i + 1])
  if score > 0 then
    local element = result[i]
    if string.find(element, "success\\":true") and true_count < num_elements then
      table.insert(true_group, {score, element})
      true_count = true_count + 1
    elseif string.find(element, "success\\":false") and false_count < num_elements then
      table.insert(false_group, {score, element})
      false_count = false_count + 1
    elseif string.find(element, "success\\":\\"denied") and denied_count < num_elements then
      table.insert(denied_group, {score, element})
      denied_count = denied_count + 1
    end
  end
  i = i - 2
end

return {true_group, false_group, denied_group}
`;
    var h = `
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1])
local increment = tonumber(ARGV[2])
local num_timestamps = tonumber(ARGV[3])

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

return result
`;
    var b = class {
      redis;
      prefix;
      bucketSize;
      constructor(e) {
        this.redis = e.redis, this.prefix = e.prefix ?? "@upstash/analytics", this.bucketSize = this.parseWindow(e.window);
      }
      validateTableName(e) {
        if (!/^[a-zA-Z0-9_-]+$/.test(e)) throw new Error(`Invalid table name: ${e}. Table names can only contain letters, numbers, dashes and underscores.`);
      }
      parseWindow(e) {
        if (typeof e == "number") {
          if (e <= 0) throw new Error(`Invalid window: ${e}`);
          return e;
        }
        let t = /^(\d+)([smhd])$/;
        if (!t.test(e)) throw new Error(`Invalid window: ${e}`);
        let [, i, s] = e.match(t), n = parseInt(i);
        switch (s) {
          case "s":
            return n * 1e3;
          case "m":
            return n * 1e3 * 60;
          case "h":
            return n * 1e3 * 60 * 60;
          case "d":
            return n * 1e3 * 60 * 60 * 24;
          default:
            throw new Error(`Invalid window unit: ${s}`);
        }
      }
      getBucket(e) {
        let t = e ?? Date.now();
        return Math.floor(t / this.bucketSize) * this.bucketSize;
      }
      async ingest(e, ...t) {
        this.validateTableName(e), await Promise.all(t.map(async (i) => {
          let s = this.getBucket(i.time), n = [this.prefix, e, s].join(":");
          await this.redis.zincrby(n, 1, JSON.stringify({ ...i, time: void 0 }));
        }));
      }
      formatBucketAggregate(e, t, i) {
        let s = {};
        return e.forEach(([n, r]) => {
          t == "success" && (n = n === 1 ? "true" : n === null ? "false" : n), s[t] = s[t] || {}, s[t][(n ?? "null").toString()] = r;
        }), { time: i, ...s };
      }
      async aggregateBucket(e, t, i) {
        this.validateTableName(e);
        let s = this.getBucket(i), n = [this.prefix, e, s].join(":"), r = await this.redis.eval(p, [n], [t]);
        return this.formatBucketAggregate(r, t, s);
      }
      async aggregateBuckets(e, t, i, s) {
        this.validateTableName(e);
        let n = this.getBucket(s), r = [];
        for (let o = 0; o < i; o += 1) r.push(this.aggregateBucket(e, t, n)), n = n - this.bucketSize;
        return Promise.all(r);
      }
      async aggregateBucketsWithPipeline(e, t, i, s, n) {
        this.validateTableName(e), n = n ?? 48;
        let r = this.getBucket(s), o = [], c = this.redis.pipeline(), u = [];
        for (let a = 1; a <= i; a += 1) {
          let d = [this.prefix, e, r].join(":");
          c.eval(p, [d], [t]), o.push(r), r = r - this.bucketSize, (a % n == 0 || a == i) && (u.push(c.exec()), c = this.redis.pipeline());
        }
        return (await Promise.all(u)).flat().map((a, d) => this.formatBucketAggregate(a, t, o[d]));
      }
      async getAllowedBlocked(e, t, i) {
        this.validateTableName(e);
        let s = [this.prefix, e].join(":"), n = this.getBucket(i), r = await this.redis.eval(h, [s], [n, this.bucketSize, t]), o = {};
        for (let c = 0; c < r.length; c += 2) {
          let u = r[c], m = u.identifier, a = +r[c + 1];
          o[m] || (o[m] = { success: 0, blocked: 0 }), o[m][u.success ? "success" : "blocked"] = a;
        }
        return o;
      }
      async getMostAllowedBlocked(e, t, i, s, n) {
        this.validateTableName(e);
        let r = [this.prefix, e].join(":"), o = this.getBucket(s), c = n ?? i * 5, [u, m, a] = await this.redis.eval(f, [r], [o, this.bucketSize, t, i, c]);
        return { allowed: this.toDicts(u), ratelimited: this.toDicts(m), denied: this.toDicts(a) };
      }
      toDicts(e) {
        let t = [];
        for (let i = 0; i < e.length; i += 1) {
          let s = +e[i][0], n = e[i][1];
          t.push({ identifier: n.identifier, count: s });
        }
        return t;
      }
    };
  }
});

// node_modules/@upstash/ratelimit/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@upstash/ratelimit/dist/index.js"(exports, module) {
    "use strict";
    var __defProp3 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp3(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp3(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp3({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      Analytics: () => Analytics2,
      IpDenyList: () => ip_deny_list_exports,
      MultiRegionRatelimit: () => MultiRegionRatelimit,
      Ratelimit: () => RegionRatelimit
    });
    module.exports = __toCommonJS(src_exports);
    var import_core_analytics = require_dist();
    var Analytics2 = class {
      analytics;
      table = "events";
      constructor(config) {
        this.analytics = new import_core_analytics.Analytics({
          // @ts-expect-error we need to fix the types in core-analytics, it should only require the methods it needs, not the whole sdk
          redis: config.redis,
          window: "1h",
          prefix: config.prefix ?? "@upstash/ratelimit",
          retention: "90d"
        });
      }
      /**
       * Try to extract the geo information from the request
       *
       * This handles Vercel's `req.geo` and  and Cloudflare's `request.cf` properties
       * @param req
       * @returns
       */
      extractGeo(req) {
        if (req.geo !== void 0) {
          return req.geo;
        }
        if (req.cf !== void 0) {
          return req.cf;
        }
        return {};
      }
      async record(event) {
        await this.analytics.ingest(this.table, event);
      }
      async series(filter, cutoff) {
        const timestampCount = Math.min(
          (this.analytics.getBucket(Date.now()) - this.analytics.getBucket(cutoff)) / (60 * 60 * 1e3),
          256
        );
        return this.analytics.aggregateBucketsWithPipeline(this.table, filter, timestampCount);
      }
      async getUsage(cutoff = 0) {
        const timestampCount = Math.min(
          (this.analytics.getBucket(Date.now()) - this.analytics.getBucket(cutoff)) / (60 * 60 * 1e3),
          256
        );
        const records = await this.analytics.getAllowedBlocked(this.table, timestampCount);
        return records;
      }
      async getUsageOverTime(timestampCount, groupby) {
        const result = await this.analytics.aggregateBucketsWithPipeline(this.table, groupby, timestampCount);
        return result;
      }
      async getMostAllowedBlocked(timestampCount, getTop, checkAtMost) {
        getTop = getTop ?? 5;
        const timestamp = void 0;
        return this.analytics.getMostAllowedBlocked(this.table, timestampCount, getTop, timestamp, checkAtMost);
      }
    };
    var Cache = class {
      /**
       * Stores identifier -> reset (in milliseconds)
       */
      cache;
      constructor(cache) {
        this.cache = cache;
      }
      isBlocked(identifier) {
        if (!this.cache.has(identifier)) {
          return { blocked: false, reset: 0 };
        }
        const reset = this.cache.get(identifier);
        if (reset < Date.now()) {
          this.cache.delete(identifier);
          return { blocked: false, reset: 0 };
        }
        return { blocked: true, reset };
      }
      blockUntil(identifier, reset) {
        this.cache.set(identifier, reset);
      }
      set(key, value) {
        this.cache.set(key, value);
      }
      get(key) {
        return this.cache.get(key) || null;
      }
      incr(key, incrementAmount = 1) {
        let value = this.cache.get(key) ?? 0;
        value += incrementAmount;
        this.cache.set(key, value);
        return value;
      }
      pop(key) {
        this.cache.delete(key);
      }
      empty() {
        this.cache.clear();
      }
      size() {
        return this.cache.size;
      }
    };
    var DYNAMIC_LIMIT_KEY_SUFFIX = ":dynamic:global";
    var DEFAULT_PREFIX = "@upstash/ratelimit";
    function ms(d) {
      const match = d.match(/^(\d+)\s?(ms|s|m|h|d)$/);
      if (!match) {
        throw new Error(`Unable to parse window size: ${d}`);
      }
      const time = Number.parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case "ms": {
          return time;
        }
        case "s": {
          return time * 1e3;
        }
        case "m": {
          return time * 1e3 * 60;
        }
        case "h": {
          return time * 1e3 * 60 * 60;
        }
        case "d": {
          return time * 1e3 * 60 * 60 * 24;
        }
        default: {
          throw new Error(`Unable to parse window size: ${d}`);
        }
      }
    }
    var safeEval = async (ctx, script, keys, args) => {
      try {
        return await ctx.redis.evalsha(script.hash, keys, args);
      } catch (error) {
        if (`${error}`.includes("NOSCRIPT")) {
          return await ctx.redis.eval(script.script, keys, args);
        }
        throw error;
      }
    };
    var fixedWindowLimitScript = `
  local key           = KEYS[1]
  local dynamicLimitKey = KEYS[2]  -- optional: key for dynamic limit in redis
  local tokens        = tonumber(ARGV[1])  -- default limit
  local window        = ARGV[2]
  local incrementBy   = ARGV[3] -- increment rate per request at a given value, default is 1

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local r = redis.call("INCRBY", key, incrementBy)
  if r == tonumber(incrementBy) then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end

  return {r, effectiveLimit}
`;
    var fixedWindowRemainingTokensScript = `
  local key = KEYS[1]
  local dynamicLimitKey = KEYS[2]  -- optional: key for dynamic limit in redis
  local tokens = tonumber(ARGV[1])  -- default limit

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local value = redis.call('GET', key)
  local usedTokens = 0
  if value then
    usedTokens = tonumber(value)
  end
  
  return {effectiveLimit - usedTokens, effectiveLimit}
`;
    var slidingWindowLimitScript = `
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local dynamicLimitKey = KEYS[3]       -- optional: key for dynamic limit in redis
  local tokens      = tonumber(ARGV[1]) -- default tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds
  local incrementBy = tonumber(ARGV[4]) -- increment rate per request at a given value, default is 1

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end
  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  -- Only check limit if not refunding (negative rate)
  if incrementBy > 0 and requestsInPreviousWindow + requestsInCurrentWindow >= effectiveLimit then
    return {-1, effectiveLimit}
  end

  local newValue = redis.call("INCRBY", currentKey, incrementBy)
  if newValue == incrementBy then
    -- The first time this key is set, the value will be equal to incrementBy.
    -- So we only need the expire command once
    redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
  end
  return {effectiveLimit - ( newValue + requestsInPreviousWindow ), effectiveLimit}
`;
    var slidingWindowRemainingTokensScript = `
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local dynamicLimitKey = KEYS[3]       -- optional: key for dynamic limit in redis
  local tokens      = tonumber(ARGV[1]) -- default tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end

  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  local usedTokens = requestsInPreviousWindow + requestsInCurrentWindow
  return {effectiveLimit - usedTokens, effectiveLimit}
`;
    var tokenBucketLimitScript = `
  local key         = KEYS[1]           -- identifier including prefixes
  local dynamicLimitKey = KEYS[2]       -- optional: key for dynamic limit in redis
  local maxTokens   = tonumber(ARGV[1]) -- default maximum number of tokens
  local interval    = tonumber(ARGV[2]) -- size of the window in milliseconds
  local refillRate  = tonumber(ARGV[3]) -- how many tokens are refilled after each interval
  local now         = tonumber(ARGV[4]) -- current timestamp in milliseconds
  local incrementBy = tonumber(ARGV[5]) -- how many tokens to consume, default is 1

  -- Check for dynamic limit
  local effectiveLimit = maxTokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")
        
  local refilledAt
  local tokens

  if bucket[1] == false then
    refilledAt = now
    tokens = effectiveLimit
  else
    refilledAt = tonumber(bucket[1])
    tokens = tonumber(bucket[2])
  end
        
  if now >= refilledAt + interval then
    local numRefills = math.floor((now - refilledAt) / interval)
    tokens = math.min(effectiveLimit, tokens + numRefills * refillRate)

    refilledAt = refilledAt + numRefills * interval
  end

  -- Only reject if tokens are 0 and we're consuming (not refunding)
  if tokens == 0 and incrementBy > 0 then
    return {-1, refilledAt + interval, effectiveLimit}
  end

  local remaining = tokens - incrementBy
  local expireAt = math.ceil(((effectiveLimit - remaining) / refillRate)) * interval
        
  redis.call("HSET", key, "refilledAt", refilledAt, "tokens", remaining)

  if (expireAt > 0) then
    redis.call("PEXPIRE", key, expireAt)
  end
  return {remaining, refilledAt + interval, effectiveLimit}
`;
    var tokenBucketIdentifierNotFound = -1;
    var tokenBucketRemainingTokensScript = `
  local key         = KEYS[1]
  local dynamicLimitKey = KEYS[2]       -- optional: key for dynamic limit in redis
  local maxTokens   = tonumber(ARGV[1]) -- default maximum number of tokens

  -- Check for dynamic limit
  local effectiveLimit = maxTokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")

  if bucket[1] == false then
    return {effectiveLimit, ${tokenBucketIdentifierNotFound}, effectiveLimit}
  end
        
  return {tonumber(bucket[2]), tonumber(bucket[1]), effectiveLimit}
`;
    var cachedFixedWindowLimitScript = `
  local key     = KEYS[1]
  local window  = ARGV[1]
  local incrementBy   = ARGV[2] -- increment rate per request at a given value, default is 1

  local r = redis.call("INCRBY", key, incrementBy)
  if r == incrementBy then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end
      
  return r
`;
    var cachedFixedWindowRemainingTokenScript = `
  local key = KEYS[1]
  local tokens = 0

  local value = redis.call('GET', key)
  if value then
      tokens = value
  end
  return tokens
`;
    var fixedWindowLimitScript2 = `
	local key           = KEYS[1]
	local id            = ARGV[1]
	local window        = ARGV[2]
	local incrementBy   = tonumber(ARGV[3])

	redis.call("HSET", key, id, incrementBy)
	local fields = redis.call("HGETALL", key)
	if #fields == 2 and tonumber(fields[2])==incrementBy then
	-- The first time this key is set, and the value will be equal to incrementBy.
	-- So we only need the expire command once
	  redis.call("PEXPIRE", key, window)
	end

	return fields
`;
    var fixedWindowRemainingTokensScript2 = `
      local key = KEYS[1]
      local tokens = 0

      local fields = redis.call("HGETALL", key)

      return fields
    `;
    var slidingWindowLimitScript2 = `
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local tokens        = tonumber(ARGV[1]) -- tokens per window
	local now           = ARGV[2]           -- current timestamp in milliseconds
	local window        = ARGV[3]           -- interval in milliseconds
	local requestId     = ARGV[4]           -- uuid for this request
	local incrementBy   = tonumber(ARGV[5]) -- custom rate, default is  1

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window

	-- Only check limit if not refunding (negative rate)
	if incrementBy > 0 and requestsInPreviousWindow * (1 - percentageInCurrent ) + requestsInCurrentWindow + incrementBy > tokens then
	  return {currentFields, previousFields, false}
	end

	redis.call("HSET", currentKey, requestId, incrementBy)

	if requestsInCurrentWindow == 0 then 
	  -- The first time this key is set, the value will be equal to incrementBy.
	  -- So we only need the expire command once
	  redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
	end
	return {currentFields, previousFields, true}
`;
    var slidingWindowRemainingTokensScript2 = `
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local now         	= ARGV[1]           -- current timestamp in milliseconds
  	local window      	= ARGV[2]           -- interval in milliseconds

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window
  	requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)
	
	return requestsInCurrentWindow + requestsInPreviousWindow
`;
    var resetScript = `
      local pattern = KEYS[1]

      -- Initialize cursor to start from 0
      local cursor = "0"

      repeat
          -- Scan for keys matching the pattern
          local scan_result = redis.call('SCAN', cursor, 'MATCH', pattern)

          -- Extract cursor for the next iteration
          cursor = scan_result[1]

          -- Extract keys from the scan result
          local keys = scan_result[2]

          for i=1, #keys do
          redis.call('DEL', keys[i])
          end

      -- Continue scanning until cursor is 0 (end of keyspace)
      until cursor == "0"
    `;
    var SCRIPTS = {
      singleRegion: {
        fixedWindow: {
          limit: {
            script: fixedWindowLimitScript,
            hash: "472e55443b62f60d0991028456c57815a387066d"
          },
          getRemaining: {
            script: fixedWindowRemainingTokensScript,
            hash: "40515c9dd0a08f8584f5f9b593935f6a87c1c1c3"
          }
        },
        slidingWindow: {
          limit: {
            script: slidingWindowLimitScript,
            hash: "977fb636fb5ceb7e98a96d1b3a1272ba018efdae"
          },
          getRemaining: {
            script: slidingWindowRemainingTokensScript,
            hash: "ee3a3265fad822f83acad23f8a1e2f5c0b156b03"
          }
        },
        tokenBucket: {
          limit: {
            script: tokenBucketLimitScript,
            hash: "b35c5bc0b7fdae7dd0573d4529911cabaf9d1d89"
          },
          getRemaining: {
            script: tokenBucketRemainingTokensScript,
            hash: "deb03663e8af5a968deee895dd081be553d2611b"
          }
        },
        cachedFixedWindow: {
          limit: {
            script: cachedFixedWindowLimitScript,
            hash: "c26b12703dd137939b9a69a3a9b18e906a2d940f"
          },
          getRemaining: {
            script: cachedFixedWindowRemainingTokenScript,
            hash: "8e8f222ccae68b595ee6e3f3bf2199629a62b91a"
          }
        }
      },
      multiRegion: {
        fixedWindow: {
          limit: {
            script: fixedWindowLimitScript2,
            hash: "a8c14f3835aa87bd70e5e2116081b81664abcf5c"
          },
          getRemaining: {
            script: fixedWindowRemainingTokensScript2,
            hash: "8ab8322d0ed5fe5ac8eb08f0c2e4557f1b4816fd"
          }
        },
        slidingWindow: {
          limit: {
            script: slidingWindowLimitScript2,
            hash: "1e7ca8dcd2d600a6d0124a67a57ea225ed62921b"
          },
          getRemaining: {
            script: slidingWindowRemainingTokensScript2,
            hash: "558c9306b7ec54abb50747fe0b17e5d44bd24868"
          }
        }
      }
    };
    var RESET_SCRIPT = {
      script: resetScript,
      hash: "54bd274ddc59fb3be0f42deee2f64322a10e2b50"
    };
    var DenyListExtension = "denyList";
    var IpDenyListKey = "ipDenyList";
    var IpDenyListStatusKey = "ipDenyListStatus";
    var checkDenyListScript = `
  -- Checks if values provideed in ARGV are present in the deny lists.
  -- This is done using the allDenyListsKey below.

  -- Additionally, checks the status of the ip deny list using the
  -- ipDenyListStatusKey below. Here are the possible states of the
  -- ipDenyListStatusKey key:
  -- * status == -1: set to "disabled" with no TTL
  -- * status == -2: not set, meaning that is was set before but expired
  -- * status  >  0: set to "valid", with a TTL
  --
  -- In the case of status == -2, we set the status to "pending" with
  -- 30 second ttl. During this time, the process which got status == -2
  -- will update the ip deny list.

  local allDenyListsKey     = KEYS[1]
  local ipDenyListStatusKey = KEYS[2]

  local results = redis.call('SMISMEMBER', allDenyListsKey, unpack(ARGV))
  local status  = redis.call('TTL', ipDenyListStatusKey)
  if status == -2 then
    redis.call('SETEX', ipDenyListStatusKey, 30, "pending")
  end

  return { results, status }
`;
    var ip_deny_list_exports = {};
    __export2(ip_deny_list_exports, {
      ThresholdError: () => ThresholdError,
      disableIpDenyList: () => disableIpDenyList,
      updateIpDenyList: () => updateIpDenyList
    });
    var MILLISECONDS_IN_HOUR = 60 * 60 * 1e3;
    var MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR;
    var MILLISECONDS_TO_2AM = 2 * MILLISECONDS_IN_HOUR;
    var getIpListTTL = (time) => {
      const now = time || Date.now();
      const timeSinceLast2AM = (now - MILLISECONDS_TO_2AM) % MILLISECONDS_IN_DAY;
      return MILLISECONDS_IN_DAY - timeSinceLast2AM;
    };
    var baseUrl = "https://raw.githubusercontent.com/stamparm/ipsum/master/levels";
    var ThresholdError = class extends Error {
      constructor(threshold) {
        super(`Allowed threshold values are from 1 to 8, 1 and 8 included. Received: ${threshold}`);
        this.name = "ThresholdError";
      }
    };
    var getIpDenyList = async (threshold) => {
      if (typeof threshold !== "number" || threshold < 1 || threshold > 8) {
        throw new ThresholdError(threshold);
      }
      try {
        const response = await fetch(`${baseUrl}/${threshold}.txt`);
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const data = await response.text();
        const lines = data.split("\n");
        return lines.filter((value) => value.length > 0);
      } catch (error) {
        throw new Error(`Failed to fetch ip deny list: ${error}`);
      }
    };
    var updateIpDenyList = async (redis, prefix, threshold, ttl) => {
      const allIps = await getIpDenyList(threshold);
      const allDenyLists = [prefix, DenyListExtension, "all"].join(":");
      const ipDenyList = [prefix, DenyListExtension, IpDenyListKey].join(":");
      const statusKey = [prefix, IpDenyListStatusKey].join(":");
      const transaction = redis.multi();
      transaction.sdiffstore(allDenyLists, allDenyLists, ipDenyList);
      transaction.del(ipDenyList);
      transaction.sadd(ipDenyList, allIps.at(0), ...allIps.slice(1));
      transaction.sdiffstore(ipDenyList, ipDenyList, allDenyLists);
      transaction.sunionstore(allDenyLists, allDenyLists, ipDenyList);
      transaction.set(statusKey, "valid", { px: ttl ?? getIpListTTL() });
      return await transaction.exec();
    };
    var disableIpDenyList = async (redis, prefix) => {
      const allDenyListsKey = [prefix, DenyListExtension, "all"].join(":");
      const ipDenyListKey = [prefix, DenyListExtension, IpDenyListKey].join(":");
      const statusKey = [prefix, IpDenyListStatusKey].join(":");
      const transaction = redis.multi();
      transaction.sdiffstore(allDenyListsKey, allDenyListsKey, ipDenyListKey);
      transaction.del(ipDenyListKey);
      transaction.set(statusKey, "disabled");
      return await transaction.exec();
    };
    var denyListCache = new Cache(/* @__PURE__ */ new Map());
    var checkDenyListCache = (members) => {
      return members.find(
        (member) => denyListCache.isBlocked(member).blocked
      );
    };
    var blockMember = (member) => {
      if (denyListCache.size() > 1e3)
        denyListCache.empty();
      denyListCache.blockUntil(member, Date.now() + 6e4);
    };
    var checkDenyList = async (redis, prefix, members) => {
      const [deniedValues, ipDenyListStatus] = await redis.eval(
        checkDenyListScript,
        [
          [prefix, DenyListExtension, "all"].join(":"),
          [prefix, IpDenyListStatusKey].join(":")
        ],
        members
      );
      let deniedValue = void 0;
      deniedValues.map((memberDenied, index) => {
        if (memberDenied) {
          blockMember(members[index]);
          deniedValue = members[index];
        }
      });
      return {
        deniedValue,
        invalidIpDenyList: ipDenyListStatus === -2
      };
    };
    var resolveLimitPayload = (redis, prefix, [ratelimitResponse, denyListResponse], threshold) => {
      if (denyListResponse.deniedValue) {
        ratelimitResponse.success = false;
        ratelimitResponse.remaining = 0;
        ratelimitResponse.reason = "denyList";
        ratelimitResponse.deniedValue = denyListResponse.deniedValue;
      }
      if (denyListResponse.invalidIpDenyList) {
        const updatePromise = updateIpDenyList(redis, prefix, threshold);
        ratelimitResponse.pending = Promise.all([
          ratelimitResponse.pending,
          updatePromise
        ]);
      }
      return ratelimitResponse;
    };
    var defaultDeniedResponse = (deniedValue) => {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: 0,
        pending: Promise.resolve(),
        reason: "denyList",
        deniedValue
      };
    };
    var Ratelimit2 = class {
      limiter;
      ctx;
      prefix;
      timeout;
      primaryRedis;
      analytics;
      enableProtection;
      denyListThreshold;
      dynamicLimits;
      constructor(config) {
        this.ctx = config.ctx;
        this.limiter = config.limiter;
        this.timeout = config.timeout ?? 5e3;
        this.prefix = config.prefix ?? DEFAULT_PREFIX;
        this.dynamicLimits = config.dynamicLimits ?? false;
        this.enableProtection = config.enableProtection ?? false;
        this.denyListThreshold = config.denyListThreshold ?? 6;
        this.primaryRedis = "redis" in this.ctx ? this.ctx.redis : this.ctx.regionContexts[0].redis;
        if ("redis" in this.ctx) {
          this.ctx.dynamicLimits = this.dynamicLimits;
          this.ctx.prefix = this.prefix;
        }
        this.analytics = config.analytics ? new Analytics2({
          redis: this.primaryRedis,
          prefix: this.prefix
        }) : void 0;
        if (config.ephemeralCache instanceof Map) {
          this.ctx.cache = new Cache(config.ephemeralCache);
        } else if (config.ephemeralCache === void 0) {
          this.ctx.cache = new Cache(/* @__PURE__ */ new Map());
        }
      }
      /**
       * Determine if a request should pass or be rejected based on the identifier and previously chosen ratelimit.
       *
       * Use this if you want to reject all requests that you can not handle right now.
       *
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(10, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.limit(id)
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       *
       * @param req.rate - The rate at which tokens will be added or consumed from the token bucket. A higher rate allows for more requests to be processed. Defaults to 1 token per interval if not specified.
       *
       * Usage with `req.rate`
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(100, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.limit(id, {rate: 10})
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       */
      limit = async (identifier, req) => {
        let timeoutId = null;
        try {
          const response = this.getRatelimitResponse(identifier, req);
          const { responseArray, newTimeoutId } = this.applyTimeout(response);
          timeoutId = newTimeoutId;
          const timedResponse = await Promise.race(responseArray);
          const finalResponse = this.submitAnalytics(timedResponse, identifier, req);
          return finalResponse;
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      };
      /**
       * Block until the request may pass or timeout is reached.
       *
       * This method returns a promise that resolves as soon as the request may be processed
       * or after the timeout has been reached.
       *
       * Use this if you want to delay the request until it is ready to get processed.
       *
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(10, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.blockUntilReady(id, 60_000)
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       */
      blockUntilReady = async (identifier, timeout) => {
        if (timeout <= 0) {
          throw new Error("timeout must be positive");
        }
        let res;
        const deadline = Date.now() + timeout;
        while (true) {
          res = await this.limit(identifier);
          if (res.success) {
            break;
          }
          if (res.reset === 0) {
            throw new Error("This should not happen");
          }
          const wait = Math.min(res.reset, deadline) - Date.now();
          await new Promise((r) => setTimeout(r, wait));
          if (Date.now() > deadline) {
            break;
          }
        }
        return res;
      };
      resetUsedTokens = async (identifier) => {
        const pattern = [this.prefix, identifier].join(":");
        await this.limiter().resetTokens(this.ctx, pattern);
      };
      /**
       * Returns the remaining token count together with a reset timestamps
       * 
       * @param identifier identifir to check
       * @returns object with `remaining`, `reset`, and `limit` fields. `remaining` denotes
       *          the remaining tokens, `limit` is the effective limit (considering dynamic
       *          limits if enabled), and `reset` denotes the timestamp when the tokens reset.
       */
      getRemaining = async (identifier) => {
        const pattern = [this.prefix, identifier].join(":");
        return await this.limiter().getRemaining(this.ctx, pattern);
      };
      /**
       * Checks if the identifier or the values in req are in the deny list cache.
       * If so, returns the default denied response.
       * 
       * Otherwise, calls redis to check the rate limit and deny list. Returns after
       * resolving the result. Resolving is overriding the rate limit result if
       * the some value is in deny list.
       * 
       * @param identifier identifier to block
       * @param req options with ip, user agent, country, rate and geo info
       * @returns rate limit response
       */
      getRatelimitResponse = async (identifier, req) => {
        const key = this.getKey(identifier);
        const definedMembers = this.getDefinedMembers(identifier, req);
        const deniedValue = checkDenyListCache(definedMembers);
        const result = deniedValue ? [defaultDeniedResponse(deniedValue), { deniedValue, invalidIpDenyList: false }] : await Promise.all([
          this.limiter().limit(this.ctx, key, req?.rate),
          this.enableProtection ? checkDenyList(this.primaryRedis, this.prefix, definedMembers) : { deniedValue: void 0, invalidIpDenyList: false }
        ]);
        return resolveLimitPayload(this.primaryRedis, this.prefix, result, this.denyListThreshold);
      };
      /**
       * Creates an array with the original response promise and a timeout promise
       * if this.timeout > 0.
       * 
       * @param response Ratelimit response promise
       * @returns array with the response and timeout promise. also includes the timeout id
       */
      applyTimeout = (response) => {
        let newTimeoutId = null;
        const responseArray = [response];
        if (this.timeout > 0) {
          const timeoutResponse = new Promise((resolve) => {
            newTimeoutId = setTimeout(() => {
              resolve({
                success: true,
                limit: 0,
                remaining: 0,
                reset: 0,
                pending: Promise.resolve(),
                reason: "timeout"
              });
            }, this.timeout);
          });
          responseArray.push(timeoutResponse);
        }
        return {
          responseArray,
          newTimeoutId
        };
      };
      /**
       * submits analytics if this.analytics is set
       * 
       * @param ratelimitResponse final rate limit response
       * @param identifier identifier to submit
       * @param req limit options
       * @returns rate limit response after updating the .pending field
       */
      submitAnalytics = (ratelimitResponse, identifier, req) => {
        if (this.analytics) {
          try {
            const geo = req ? this.analytics.extractGeo(req) : void 0;
            const analyticsP = this.analytics.record({
              identifier: ratelimitResponse.reason === "denyList" ? ratelimitResponse.deniedValue : identifier,
              time: Date.now(),
              success: ratelimitResponse.reason === "denyList" ? "denied" : ratelimitResponse.success,
              ...geo
            }).catch((error) => {
              let errorMessage = "Failed to record analytics";
              if (`${error}`.includes("WRONGTYPE")) {
                errorMessage = `
    Failed to record analytics. See the information below:

    This can occur when you uprade to Ratelimit version 1.1.2
    or later from an earlier version.

    This occurs simply because the way we store analytics data
    has changed. To avoid getting this error, disable analytics
    for *an hour*, then simply enable it back.

    `;
              }
              console.warn(errorMessage, error);
            });
            ratelimitResponse.pending = Promise.all([ratelimitResponse.pending, analyticsP]);
          } catch (error) {
            console.warn("Failed to record analytics", error);
          }
          ;
        }
        ;
        return ratelimitResponse;
      };
      getKey = (identifier) => {
        return [this.prefix, identifier].join(":");
      };
      /**
       * returns a list of defined values from
       * [identifier, req.ip, req.userAgent, req.country]
       * 
       * @param identifier identifier
       * @param req limit options
       * @returns list of defined values
       */
      getDefinedMembers = (identifier, req) => {
        const members = [identifier, req?.ip, req?.userAgent, req?.country];
        return members.filter(Boolean);
      };
      /**
       * Set a dynamic rate limit globally.
       * 
       * When dynamicLimits is enabled, this limit will override the default limit
       * set in the constructor for all requests.
       * 
       * @example
       * ```ts
       * const ratelimit = new Ratelimit({
       *   redis: Redis.fromEnv(),
       *   limiter: Ratelimit.slidingWindow(10, "10 s"),
       *   dynamicLimits: true
       * });
       * 
       * // Set global dynamic limit to 120 requests
       * await ratelimit.setDynamicLimit({ limit: 120 });
       * 
       * // Disable dynamic limit (falls back to default)
       * await ratelimit.setDynamicLimit({ limit: false });
       * ```
       * 
       * @param options.limit - The new rate limit to apply globally, or false to disable
       */
      setDynamicLimit = async (options) => {
        if (!this.dynamicLimits) {
          throw new Error(
            "dynamicLimits must be enabled in the Ratelimit constructor to use setDynamicLimit()"
          );
        }
        const globalKey = `${this.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}`;
        await (options.limit === false ? this.primaryRedis.del(globalKey) : this.primaryRedis.set(globalKey, options.limit));
      };
      /**
       * Get the current global dynamic rate limit.
       * 
       * @example
       * ```ts
       * const { dynamicLimit } = await ratelimit.getDynamicLimit();
       * console.log(dynamicLimit); // 120 or null if not set
       * ```
       * 
       * @returns Object containing the current global dynamic limit, or null if not set
       */
      getDynamicLimit = async () => {
        if (!this.dynamicLimits) {
          throw new Error(
            "dynamicLimits must be enabled in the Ratelimit constructor to use getDynamicLimit()"
          );
        }
        const globalKey = `${this.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}`;
        const result = await this.primaryRedis.get(globalKey);
        return { dynamicLimit: result === null ? null : Number(result) };
      };
    };
    function randomId() {
      let result = "";
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const charactersLength = characters.length;
      for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
    var MultiRegionRatelimit = class extends Ratelimit2 {
      /**
       * Create a new Ratelimit instance by providing a `@upstash/redis` instance and the algorithn of your choice.
       */
      constructor(config) {
        super({
          prefix: config.prefix,
          limiter: config.limiter,
          timeout: config.timeout,
          analytics: config.analytics,
          dynamicLimits: config.dynamicLimits,
          ctx: {
            regionContexts: config.redis.map((redis) => ({
              redis,
              prefix: config.prefix ?? DEFAULT_PREFIX
            })),
            cache: config.ephemeralCache ? new Cache(config.ephemeralCache) : void 0
          }
        });
        if (config.dynamicLimits) {
          console.warn(
            "Warning: Dynamic limits are not yet supported for multi-region rate limiters. The dynamicLimits option will be ignored."
          );
        }
      }
      /**
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static fixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const requestId = randomId();
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.fixedWindow.limit,
                [key],
                [requestId, windowDuration, incrementBy]
              )
            }));
            const firstResponse = await Promise.any(dbs.map((s) => s.request));
            const usedTokens = firstResponse.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const remaining = tokens - usedTokens;
            async function sync() {
              const individualIDs = await Promise.all(dbs.map((s) => s.request));
              const allIDs = [
                ...new Set(
                  individualIDs.flat().reduce((acc, curr, index) => {
                    if (index % 2 === 0) {
                      acc.push(curr);
                    }
                    return acc;
                  }, [])
                ).values()
              ];
              for (const db of dbs) {
                const usedDbTokensRequest = await db.request;
                const usedDbTokens = usedDbTokensRequest.reduce(
                  (accTokens, usedToken, index) => {
                    let parsedToken = 0;
                    if (index % 2) {
                      parsedToken = Number.parseInt(usedToken);
                    }
                    return accTokens + parsedToken;
                  },
                  0
                );
                const dbIdsRequest = await db.request;
                const dbIds = dbIdsRequest.reduce(
                  (ids, currentId, index) => {
                    if (index % 2 === 0) {
                      ids.push(currentId);
                    }
                    return ids;
                  },
                  []
                );
                if (usedDbTokens >= tokens) {
                  continue;
                }
                const diff = allIDs.filter((id) => !dbIds.includes(id));
                if (diff.length === 0) {
                  continue;
                }
                for (const requestId2 of diff) {
                  await db.redis.hset(key, { [requestId2]: incrementBy });
                }
              }
            }
            const success = remaining >= 0;
            const reset = (bucket + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: tokens,
              remaining,
              reset,
              pending: sync()
            };
          },
          async getRemaining(ctx, identifier) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.fixedWindow.getRemaining,
                [key],
                [null]
              )
            }));
            const firstResponse = await Promise.any(dbs.map((s) => s.request));
            const usedTokens = firstResponse.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (bucket + 1) * windowDuration,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await Promise.all(
              ctx.regionContexts.map((regionContext) => {
                safeEval(regionContext, RESET_SCRIPT, [pattern], [null]);
              })
            );
          }
        });
      }
      /**
       * Combined approach of `slidingLogs` and `fixedWindow` with lower storage
       * costs than `slidingLogs` and improved boundary behavior by calculating a
       * weighted score between two windows.
       *
       * **Pro:**
       *
       * Good performance allows this to scale to very high loads.
       *
       * **Con:**
       *
       * Nothing major.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - The duration in which the user can max X requests.
       */
      static slidingWindow(tokens, window) {
        const windowSize = ms(window);
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const requestId = randomId();
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.slidingWindow.limit,
                [currentKey, previousKey],
                [tokens, now, windowDuration, requestId, incrementBy]
                // lua seems to return `1` for true and `null` for false
              )
            }));
            const percentageInCurrent = now % windowDuration / windowDuration;
            const [current, previous, success] = await Promise.any(
              dbs.map((s) => s.request)
            );
            if (success) {
              current.push(requestId, incrementBy.toString());
            }
            const previousUsedTokens = previous.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const currentUsedTokens = current.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const previousPartialUsed = Math.ceil(
              previousUsedTokens * (1 - percentageInCurrent)
            );
            const usedTokens = previousPartialUsed + currentUsedTokens;
            const remaining = tokens - usedTokens;
            async function sync() {
              const res = await Promise.all(dbs.map((s) => s.request));
              const allCurrentIds = [
                ...new Set(
                  res.flatMap(([current2]) => current2).reduce((acc, curr, index) => {
                    if (index % 2 === 0) {
                      acc.push(curr);
                    }
                    return acc;
                  }, [])
                ).values()
              ];
              for (const db of dbs) {
                const [current2, _previous, _success] = await db.request;
                const dbIds = current2.reduce((ids, currentId, index) => {
                  if (index % 2 === 0) {
                    ids.push(currentId);
                  }
                  return ids;
                }, []);
                const usedDbTokens = current2.reduce(
                  (accTokens, usedToken, index) => {
                    let parsedToken = 0;
                    if (index % 2) {
                      parsedToken = Number.parseInt(usedToken);
                    }
                    return accTokens + parsedToken;
                  },
                  0
                );
                if (usedDbTokens >= tokens) {
                  continue;
                }
                const diff = allCurrentIds.filter((id) => !dbIds.includes(id));
                if (diff.length === 0) {
                  continue;
                }
                for (const requestId2 of diff) {
                  await db.redis.hset(currentKey, { [requestId2]: incrementBy });
                }
              }
            }
            const reset = (currentWindow + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success: Boolean(success),
              limit: tokens,
              remaining: Math.max(0, remaining),
              reset,
              pending: sync()
            };
          },
          async getRemaining(ctx, identifier) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.slidingWindow.getRemaining,
                [currentKey, previousKey],
                [now, windowSize]
                // lua seems to return `1` for true and `null` for false
              )
            }));
            const usedTokens = await Promise.any(dbs.map((s) => s.request));
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (currentWindow + 1) * windowSize,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await Promise.all(
              ctx.regionContexts.map((regionContext) => {
                safeEval(regionContext, RESET_SCRIPT, [pattern], [null]);
              })
            );
          }
        });
      }
    };
    var RegionRatelimit = class extends Ratelimit2 {
      /**
       * Create a new Ratelimit instance by providing a `@upstash/redis` instance and the algorithm of your choice.
       */
      constructor(config) {
        super({
          prefix: config.prefix,
          limiter: config.limiter,
          timeout: config.timeout,
          analytics: config.analytics,
          ctx: {
            redis: config.redis,
            prefix: config.prefix ?? DEFAULT_PREFIX
          },
          ephemeralCache: config.ephemeralCache,
          enableProtection: config.enableProtection,
          denyListThreshold: config.denyListThreshold,
          dynamicLimits: config.dynamicLimits
        });
      }
      /**
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static fixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [usedTokensAfterUpdate, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.fixedWindow.limit,
              [key, dynamicLimitKey],
              [tokens, windowDuration, incrementBy]
            );
            const success = usedTokensAfterUpdate <= effectiveLimit;
            const remainingTokens = Math.max(0, effectiveLimit - usedTokensAfterUpdate);
            const reset = (bucket + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: remainingTokens,
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.fixedWindow.getRemaining,
              [key, dynamicLimitKey],
              [tokens]
            );
            return {
              remaining: Math.max(0, remaining),
              reset: (bucket + 1) * windowDuration,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * Combined approach of `slidingLogs` and `fixedWindow` with lower storage
       * costs than `slidingLogs` and improved boundary behavior by calculating a
       * weighted score between two windows.
       *
       * **Pro:**
       *
       * Good performance allows this to scale to very high loads.
       *
       * **Con:**
       *
       * Nothing major.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - The duration in which the user can max X requests.
       */
      static slidingWindow(tokens, window) {
        const windowSize = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remainingTokens, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.slidingWindow.limit,
              [currentKey, previousKey, dynamicLimitKey],
              [tokens, now, windowSize, incrementBy]
            );
            const success = remainingTokens >= 0;
            const reset = (currentWindow + 1) * windowSize;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: Math.max(0, remainingTokens),
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.slidingWindow.getRemaining,
              [currentKey, previousKey, dynamicLimitKey],
              [tokens, now, windowSize]
            );
            return {
              remaining: Math.max(0, remaining),
              reset: (currentWindow + 1) * windowSize,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * You have a bucket filled with `{maxTokens}` tokens that refills constantly
       * at `{refillRate}` per `{interval}`.
       * Every request will remove one token from the bucket and if there is no
       * token to take, the request is rejected.
       *
       * **Pro:**
       *
       * - Bursts of requests are smoothed out and you can process them at a constant
       * rate.
       * - Allows to set a higher initial burst limit by setting `maxTokens` higher
       * than `refillRate`
       */
      static tokenBucket(refillRate, interval, maxTokens) {
        const intervalDuration = ms(interval);
        return () => ({
          async limit(ctx, identifier, rate) {
            const now = Date.now();
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: maxTokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, reset, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.tokenBucket.limit,
              [identifier, dynamicLimitKey],
              [maxTokens, intervalDuration, refillRate, now, incrementBy]
            );
            const success = remaining >= 0;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: Math.max(0, remaining),
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remainingTokens, refilledAt, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.tokenBucket.getRemaining,
              [identifier, dynamicLimitKey],
              [maxTokens]
            );
            const freshRefillAt = Date.now() + intervalDuration;
            const identifierRefillsAt = refilledAt + intervalDuration;
            return {
              remaining: Math.max(0, remainingTokens),
              reset: refilledAt === tokenBucketIdentifierNotFound ? freshRefillAt : identifierRefillsAt,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = identifier;
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * cachedFixedWindow first uses the local cache to decide if a request may pass and then updates
       * it asynchronously.
       * This is experimental and not yet recommended for production use.
       *
       * @experimental
       *
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static cachedFixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            if (ctx.dynamicLimits) {
              console.warn(
                "Warning: Dynamic limits are not yet supported for cachedFixedWindow algorithm. The dynamicLimits option will be ignored."
              );
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const reset = (bucket + 1) * windowDuration;
            const incrementBy = rate ?? 1;
            const hit = typeof ctx.cache.get(key) === "number";
            if (hit) {
              const cachedTokensAfterUpdate = ctx.cache.incr(key, incrementBy);
              const success = cachedTokensAfterUpdate < tokens;
              const pending = success ? safeEval(
                ctx,
                SCRIPTS.singleRegion.cachedFixedWindow.limit,
                [key],
                [windowDuration, incrementBy]
              ) : Promise.resolve();
              return {
                success,
                limit: tokens,
                remaining: tokens - cachedTokensAfterUpdate,
                reset,
                pending
              };
            }
            const usedTokensAfterUpdate = await safeEval(
              ctx,
              SCRIPTS.singleRegion.cachedFixedWindow.limit,
              [key],
              [windowDuration, incrementBy]
            );
            ctx.cache.set(key, usedTokensAfterUpdate);
            const remaining = tokens - usedTokensAfterUpdate;
            return {
              success: remaining >= 0,
              limit: tokens,
              remaining,
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const hit = typeof ctx.cache.get(key) === "number";
            if (hit) {
              const cachedUsedTokens = ctx.cache.get(key) ?? 0;
              return {
                remaining: Math.max(0, tokens - cachedUsedTokens),
                reset: (bucket + 1) * windowDuration,
                limit: tokens
              };
            }
            const usedTokens = await safeEval(
              ctx,
              SCRIPTS.singleRegion.cachedFixedWindow.getRemaining,
              [key],
              [null]
            );
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (bucket + 1) * windowDuration,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            ctx.cache.pop(key);
            const pattern = [identifier, "*"].join(":");
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
    };
  }
});

// api/_seed-envelope.js
function unwrapEnvelope(raw) {
  if (raw == null) return { _seed: null, data: null };
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return { _seed: null, data: raw };
    }
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { _seed: null, data: value };
  }
  const seed = value._seed;
  if (seed && typeof seed === "object" && typeof seed.fetchedAt === "number") {
    return { _seed: seed, data: value.data };
  }
  return { _seed: null, data: value };
}

// api/_upstash-json.js
async function readJsonFromUpstash(key, timeoutMs = 3e3) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.result) return null;
  try {
    return unwrapEnvelope(JSON.parse(data.result)).data;
  } catch {
    return null;
  }
}

// api/_sentry-common.js
var _key = "";
var _envelopeUrl = "";
(function parseDsn() {
  if (process.env.NODE_TEST_CONTEXT) return;
  const dsn = process.env.VITE_SENTRY_DSN ?? "";
  if (!dsn) return;
  try {
    const u = new URL(dsn);
    _key = u.username;
    const projectId = u.pathname.replace(/^\//, "");
    _envelopeUrl = `${u.protocol}//${u.host}/api/${projectId}/envelope/`;
  } catch {
  }
})();
function parseStack(stack) {
  const lines = stack.split("\n").slice(1, 30);
  const frames = [];
  for (const line of lines) {
    const m = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (!m) continue;
    frames.push({
      function: m[1] || "<anonymous>",
      filename: m[2],
      lineno: Number(m[3]),
      colno: Number(m[4])
    });
  }
  return frames.reverse();
}
function buildEnvelope(err, ctx, runtimeCfg) {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errType = err instanceof Error ? err.constructor.name : "Error";
  const stack = err instanceof Error && err.stack ? err.stack : void 0;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const level = ctx?.level === "warning" || ctx?.level === "info" || ctx?.level === "fatal" ? ctx.level : "error";
  const event = {
    event_id: eventId,
    timestamp,
    level,
    platform: runtimeCfg.platform,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "production",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: {
      values: [
        {
          type: errType,
          value: errMsg,
          ...stack ? { stacktrace: { frames: parseStack(stack) } } : {}
        }
      ]
    },
    tags: { surface: "api", runtime: runtimeCfg.runtime, ...ctx?.tags ?? {} },
    extra: ctx?.extra,
    // Caller-supplied fingerprint overrides Sentry's default grouping.
    // Use when the error message contains a high-cardinality token (request id,
    // ephemeral hash) that would otherwise split one logical issue into many.
    ...Array.isArray(ctx?.fingerprint) && ctx.fingerprint.length > 0 ? { fingerprint: ctx.fingerprint } : {}
  };
  const header = JSON.stringify({ event_id: eventId, sent_at: timestamp });
  const itemHeader = JSON.stringify({ type: "event" });
  const itemPayload = JSON.stringify(event);
  return `${header}
${itemHeader}
${itemPayload}
`;
}
async function deliver(body, logPrefix) {
  if (!_envelopeUrl || !_key) return;
  try {
    const res = await fetch(_envelopeUrl, {
      method: "POST",
      keepalive: true,
      signal: AbortSignal.timeout(2e3),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${_key}`
      },
      body
    });
    if (!res.ok) {
      const hint = res.status === 401 || res.status === 403 ? " \u2014 check VITE_SENTRY_DSN and auth key" : res.status === 429 ? " \u2014 rate limited by Sentry" : " \u2014 Sentry outage or transient error";
      console.warn(`${logPrefix} non-2xx response ${res.status}${hint}`);
    }
  } catch (fetchErr) {
    console.warn(
      `${logPrefix} failed to deliver event:`,
      fetchErr instanceof Error ? fetchErr.message : fetchErr
    );
  }
}
function makeCaptureSilentError({ runtime, platform, logPrefix }) {
  const runtimeCfg = { runtime, platform };
  return function captureSilentError2(err, opts) {
    if (!_envelopeUrl || !_key) return Promise.resolve();
    const promise = deliver(buildEnvelope(err, opts, runtimeCfg), logPrefix);
    if (opts?.ctx && typeof opts.ctx.waitUntil === "function") {
      opts.ctx.waitUntil(promise);
    } else {
      promise.catch(() => {
      });
    }
    return promise;
  };
}

// api/_sentry-edge.js
var captureSilentError = makeCaptureSilentError({
  runtime: "edge",
  platform: "javascript",
  logPrefix: "[sentry-edge]"
});

// server/_shared/usage.ts
var AXIOM_DATASET = "wm_api_usage";
var AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
var CB_WINDOW_MS = 5 * 60 * 1e3;

// server/_shared/redis.ts
function parseTimeoutEnv(raw, defaultMs) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return parsed > 0 ? parsed : defaultMs;
}
var REDIS_OP_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_OP_TIMEOUT_MS, 1500);
var REDIS_PIPELINE_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_PIPELINE_TIMEOUT_MS, 5e3);

// server/_shared/pro-mcp-token.ts
function dailyCounterKey(userId, date) {
  if (!userId) return "";
  const d = date ?? /* @__PURE__ */ new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const base = `mcp:pro-usage:${userId}:${yyyy}-${mm}-${dd}`;
  return `${envPrefix()}${base}`;
}
function envPrefix() {
  const env = process.env.VERCEL_ENV;
  if (!env || env === "production") return "";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev";
  return `${env}:${sha}:`;
}
function secondsUntilUtcMidnight(now) {
  const d = now ?? /* @__PURE__ */ new Date();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(1, Math.ceil((next.getTime() - d.getTime()) / 1e3));
}
var PRO_DAILY_QUOTA_LIMIT = 50;
var PRO_DAILY_QUOTA_TTL_SECONDS = 172800;

// api/mcp/error-fingerprint.ts
function mcpErrorFingerprint(step, toolName, err) {
  const message = err instanceof Error ? err.message : String(err);
  const siblingHttp = message.match(/^([A-Za-z0-9_-]+) HTTP (\d{3})\b/);
  const signature = siblingHttp ? `${siblingHttp[1]}:${siblingHttp[2]}` : err instanceof Error ? err.name || err.constructor.name : "non-error";
  return [`mcp-${step}`, toolName, signature];
}

// api/mcp/filters.ts
function argStrList(v) {
  const raw = Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
  return raw.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
}
function argNum(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
function argStr(v) {
  return typeof v === "string" ? v.toLowerCase().trim() : "";
}
function argBool(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}
function compact(arr) {
  return arr.filter((v) => typeof v === "string" && v.length > 0);
}
function ciIncludes(hay, needle) {
  return typeof hay === "string" && hay.toLowerCase().includes(needle);
}
function matchesCode(value, codes) {
  if (codes.length === 0) return true;
  const pool = Array.isArray(value) ? value : [value];
  return pool.some((v) => typeof v === "string" && codes.includes(v.toLowerCase()));
}
function narrowArray(data, label, pred) {
  const arr = data[label];
  if (Array.isArray(arr)) data[label] = arr.filter(pred);
}
function narrowNested(data, label, child, pred) {
  const parent = data[label];
  if (parent && typeof parent === "object" && !Array.isArray(parent)) {
    const arr = parent[child];
    if (Array.isArray(arr)) {
      parent[child] = arr.filter(pred);
    }
  }
}
function pickMapKeys(obj, codes) {
  if (codes.length === 0 || !obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, val] of Object.entries(obj)) {
    if (codes.includes(k.toLowerCase())) out[k] = val;
  }
  return Object.keys(out).length > 0 ? out : obj;
}
function pickNestedMap(data, label, child, codes) {
  const node = data[label];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    node[child] = pickMapKeys(node[child], codes);
  }
}
function capNestedMap(data, label, child, n) {
  if (n == null || n <= 0) return;
  const parent = data[label];
  if (parent && typeof parent === "object" && !Array.isArray(parent)) {
    const map = parent[child];
    if (map && typeof map === "object" && !Array.isArray(map)) {
      const entries = Object.entries(map);
      if (entries.length > n) {
        parent[child] = Object.fromEntries(entries.slice(0, n));
      }
    }
  }
}
function mapNested(data, label, child, fn) {
  const node = data[label];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const n = node;
    n[child] = fn(n[child]);
  }
}
function filterMapValues(obj, pred) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && pred(v)) out[k] = v;
  }
  return out;
}
function pickMapKeysLike(obj, needle) {
  if (!needle || !obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase().includes(needle)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : obj;
}
function selectDatasets(data, labels) {
  if (labels.length === 0) return data;
  const out = {};
  for (const k of Object.keys(data)) {
    if (labels.includes(k.toLowerCase())) out[k] = data[k];
  }
  return Object.keys(out).length > 0 ? out : data;
}
function capArrays(data, n) {
  if (n == null || n <= 0) return;
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (Array.isArray(v)) data[k] = v.slice(0, n);
  }
}
function capNested(data, label, child, n) {
  if (n == null || n <= 0) return;
  const parent = data[label];
  if (parent && typeof parent === "object" && !Array.isArray(parent)) {
    const arr = parent[child];
    if (Array.isArray(arr)) parent[child] = arr.slice(0, n);
  }
}
var SUMMARY_SAMPLE_SIZE = 3;
var SUMMARY_MAP_THRESHOLD = 5;
function summarizeMap(obj) {
  const keys = Object.keys(obj);
  return { count: keys.length, sample_keys: keys.slice(0, SUMMARY_SAMPLE_SIZE) };
}
function summarizeField(v) {
  if (Array.isArray(v)) return { count: v.length, sample: v.slice(0, SUMMARY_SAMPLE_SIZE) };
  if (v && typeof v === "object") {
    const inner = Object.keys(v);
    if (inner.length > SUMMARY_MAP_THRESHOLD) return summarizeMap(v);
  }
  return v;
}
function summarizeData(data) {
  const out = {};
  for (const [label, payload] of Object.entries(data)) {
    if (Array.isArray(payload)) {
      out[label] = { count: payload.length, sample: payload.slice(0, SUMMARY_SAMPLE_SIZE) };
    } else if (payload && typeof payload === "object") {
      const keys = Object.keys(payload);
      const allObjValues = keys.length > 0 && keys.every((k) => {
        const v = payload[k];
        return v != null && typeof v === "object";
      });
      if (keys.length > SUMMARY_MAP_THRESHOLD && allObjValues) {
        out[label] = summarizeMap(payload);
      } else {
        const recursed = {};
        for (const [k, v] of Object.entries(payload)) {
          recursed[k] = summarizeField(v);
        }
        out[label] = recursed;
      }
    } else {
      out[label] = payload;
    }
  }
  return out;
}
function cacheEnvelope(dataProperties) {
  return {
    type: "object",
    required: ["cached_at", "stale", "data"],
    properties: {
      cached_at: {
        type: ["string", "null"],
        description: "ISO-8601 timestamp of the OLDEST contributing cache key, or null when no valid seed-meta is present."
      },
      stale: {
        type: "boolean",
        description: "True when any contributing cache key is older than its per-key maxStaleMin freshness budget."
      },
      data: { type: "object", properties: dataProperties }
    }
  };
}

// api/mcp/freshness.ts
function parseFiniteRecordCount(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function evaluateFreshness(checks, metas, now = Date.now()) {
  let stale = false;
  let oldestFetchedAt = Number.POSITIVE_INFINITY;
  let hasAnyValidMeta = false;
  let hasAllValidMeta = true;
  for (const [i, check] of checks.entries()) {
    const meta = metas[i];
    const fetchedAt = meta && typeof meta === "object" && "fetchedAt" in meta ? Number(meta.fetchedAt) : Number.NaN;
    if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) {
      hasAllValidMeta = false;
      stale = true;
      continue;
    }
    hasAnyValidMeta = true;
    oldestFetchedAt = Math.min(oldestFetchedAt, fetchedAt);
    stale ||= (now - fetchedAt) / 6e4 > check.maxStaleMin;
    if (check.minRecordCount != null) {
      const recordCount = meta && typeof meta === "object" && "recordCount" in meta ? parseFiniteRecordCount(meta.recordCount) : null;
      stale ||= recordCount == null || recordCount < check.minRecordCount;
    }
  }
  return {
    cached_at: hasAnyValidMeta && hasAllValidMeta ? new Date(oldestFetchedAt).toISOString() : null,
    stale
  };
}

// api/mcp/jmespath.ts
var import_jmespath = __toESM(require_jmespath(), 1);

// api/mcp/constants.ts
var JMESPATH_MAX_EXPR_BYTES = 1024;
var JMESPATH_MAX_OUTPUT_BYTES = 256 * 1024;
var TOOL_DESCRIPTION_MAX_BYTES = 120;
var SERVER_INSTRUCTIONS = [
  "Every tool accepts an optional `jmespath` string. Server-side projection applied AFTER per-tool filter/summary; typical 80-95% token reduction. Grammar: https://jmespath.org/specification.html. Guide + 12 worked examples: https://www.worldmonitor.app/docs/mcp-jmespath.",
  "",
  `Limits: expr \u2264 ${JMESPATH_MAX_EXPR_BYTES}B, output \u2264 ${JMESPATH_MAX_OUTPUT_BYTES}B. Bad expressions soft-fail via {_jmespath_error, original_keys} envelope (consumes one Pro/OAuth daily quota unit on retry when that quota path applies \u2014 self-correct from original_keys). Full envelope reference: https://www.worldmonitor.app/docs/mcp-error-catalog.`,
  "",
  `tools/list ships compressed tool descriptions (\u2264${TOOL_DESCRIPTION_MAX_BYTES}B). Call describe_tool({tool_name}) for the full uncompressed definition \u2014 quota-exempt (still counts toward the 60/min rate limit), so use freely while exploring. describe_tool({tool_name: 'nonexistent'}) returns {error: 'unknown_tool', available: [...]} so you can self-correct. Full reference: https://www.worldmonitor.app/docs/mcp-tools-reference.`,
  "",
  "Issue prompts/list to discover pre-built workflow templates (country-briefing, energy-shock-watch, market-open-prep, conflict-pulse, route-risk-check, freshness-audit). Each prompt pre-bakes a JMESPath projection per step so the first execution lands on the right shape. prompts/list + prompts/get are quota-exempt (per-minute limit only).",
  "",
  "Issue resources/list for concrete read-only resources (v1: seed-meta freshness \u2014 anonymous + quota-free) and resources/templates/list for parameterised URI templates (country risk, chokepoint status, market quote). Substitute the template placeholder, then resources/read the concrete URI; a template read consumes the Pro daily quota IDENTICALLY to the equivalent tools/call \u2014 there is no free path around the cap via those resources."
].join("\n");
var SUPPORTED_CONSUMER_PRICES_COUNTRIES = /* @__PURE__ */ new Set(["ae"]);
var DEFAULT_LIST_LIMIT = 30;

// api/mcp/utils.ts
function utf8ByteLength(s) {
  return new TextEncoder().encode(s).length;
}
function compressDescription(text, maxBytes) {
  if (typeof text !== "string" || text.length === 0) return text;
  if (utf8ByteLength(text) <= maxBytes) return text;
  const sentenceMatch = text.match(/^[\s\S]+?[.!?](?:\s|$)/);
  const candidate = sentenceMatch ? sentenceMatch[0].trim() : text;
  if (utf8ByteLength(candidate) <= maxBytes) return candidate;
  const encoder = new TextEncoder();
  let out = "";
  let used = 0;
  for (const ch of candidate) {
    const chBytes = encoder.encode(ch).length;
    if (used + chBytes > maxBytes) break;
    out += ch;
    used += chBytes;
  }
  return out;
}

// api/mcp/jmespath.ts
var JMESPATH_SCHEMA = {
  type: "string",
  description: "Optional JMESPath projection applied to the response. See initialize.instructions for grammar and examples."
};
function jmespathOriginalKeys(v) {
  if (Array.isArray(v)) return [`<array length=${v.length}>`];
  if (v !== null && typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length <= 50) return keys;
    return [...keys.slice(0, 50), `...<${keys.length - 50} more>`];
  }
  return [`<${typeof v}>`];
}
function applyJmespath(value, exprArg) {
  if (typeof exprArg !== "string" || exprArg.length === 0) {
    const text2 = JSON.stringify(value);
    return { text: text2 === void 0 ? "null" : text2 };
  }
  const exprBytes = utf8ByteLength(exprArg);
  if (exprBytes > JMESPATH_MAX_EXPR_BYTES) {
    const envelope = {
      _jmespath_error: `expression_too_long: ${exprBytes} > ${JMESPATH_MAX_EXPR_BYTES}`,
      original_keys: jmespathOriginalKeys(value)
    };
    return { text: JSON.stringify(envelope), failed: "expression_too_long" };
  }
  let projected;
  try {
    projected = import_jmespath.default.search(value, exprArg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const envelope = {
      _jmespath_error: `invalid_expression: ${message}`,
      original_keys: jmespathOriginalKeys(value)
    };
    return { text: JSON.stringify(envelope), failed: "invalid_expression" };
  }
  const text = JSON.stringify(projected);
  const safeText = text === void 0 ? "null" : text;
  const outputBytes = utf8ByteLength(safeText);
  if (outputBytes > JMESPATH_MAX_OUTPUT_BYTES) {
    const envelope = {
      _jmespath_error: `projection_too_large: ${outputBytes} > ${JMESPATH_MAX_OUTPUT_BYTES}`,
      original_keys: jmespathOriginalKeys(value)
    };
    return { text: JSON.stringify(envelope), failed: "projection_too_large" };
  }
  return { text: safeText };
}

// api/mcp/quota.ts
async function reserveQuota(userId, pipeline) {
  const key = dailyCounterKey(userId);
  if (!key) return { ok: false, reason: "redis-unavailable" };
  let pipeResult;
  try {
    pipeResult = await pipeline([
      ["INCR", key],
      ["EXPIRE", key, PRO_DAILY_QUOTA_TTL_SECONDS]
    ]);
  } catch {
    pipeResult = null;
  }
  if (!pipeResult || !Array.isArray(pipeResult) || pipeResult.length === 0) {
    return { ok: false, reason: "redis-unavailable" };
  }
  const incrRaw = pipeResult[0]?.result;
  const newCount = typeof incrRaw === "number" ? incrRaw : Number(incrRaw);
  if (!Number.isFinite(newCount) || newCount < 1) {
    return { ok: false, reason: "redis-unavailable" };
  }
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    try {
      await pipeline([["DECR", key]]);
    } catch {
    }
  };
  if (newCount > PRO_DAILY_QUOTA_LIMIT) {
    await rollback();
    if (newCount > PRO_DAILY_QUOTA_LIMIT + 1) {
      try {
        const probe = await pipeline([["INCR", key], ["DECR", key]]);
        const probeIncrRaw = probe?.[0]?.result;
        const postRollbackCount = typeof probeIncrRaw === "number" ? probeIncrRaw - 1 : Number.NaN;
        if (Number.isFinite(postRollbackCount) && postRollbackCount > PRO_DAILY_QUOTA_LIMIT) {
          const overshoot = postRollbackCount - PRO_DAILY_QUOTA_LIMIT;
          const decrs = Math.min(overshoot, 100);
          const clamp = Array.from({ length: decrs }, () => ["DECR", key]);
          await pipeline(clamp).catch(() => {
          });
        }
      } catch {
      }
    }
    return { ok: false, reason: "cap-exceeded", floor: PRO_DAILY_QUOTA_LIMIT };
  }
  return { ok: true, newCount, rollback };
}

// shared/iso2-to-iso3.js
var ISO2_TO_ISO3 = {
  "AD": "AND",
  "AE": "ARE",
  "AF": "AFG",
  "AG": "ATG",
  "AI": "AIA",
  "AL": "ALB",
  "AM": "ARM",
  "AO": "AGO",
  "AQ": "ATA",
  "AR": "ARG",
  "AS": "ASM",
  "AT": "AUT",
  "AU": "AUS",
  "AW": "ABW",
  "AX": "ALA",
  "AZ": "AZE",
  "BA": "BIH",
  "BB": "BRB",
  "BD": "BGD",
  "BE": "BEL",
  "BF": "BFA",
  "BG": "BGR",
  "BH": "BHR",
  "BI": "BDI",
  "BJ": "BEN",
  "BL": "BLM",
  "BM": "BMU",
  "BN": "BRN",
  "BO": "BOL",
  "BR": "BRA",
  "BS": "BHS",
  "BT": "BTN",
  "BW": "BWA",
  "BY": "BLR",
  "BZ": "BLZ",
  "CA": "CAN",
  "CD": "COD",
  "CF": "CAF",
  "CG": "COG",
  "CH": "CHE",
  "CI": "CIV",
  "CK": "COK",
  "CL": "CHL",
  "CM": "CMR",
  "CN": "CHN",
  "CO": "COL",
  "CR": "CRI",
  "CU": "CUB",
  "CV": "CPV",
  "CW": "CUW",
  "CY": "CYP",
  "CZ": "CZE",
  "DE": "DEU",
  "DJ": "DJI",
  "DK": "DNK",
  "DM": "DMA",
  "DO": "DOM",
  "DZ": "DZA",
  "EC": "ECU",
  "EE": "EST",
  "EG": "EGY",
  "EH": "ESH",
  "ER": "ERI",
  "ES": "ESP",
  "ET": "ETH",
  "FI": "FIN",
  "FJ": "FJI",
  "FK": "FLK",
  "FM": "FSM",
  "FO": "FRO",
  "FR": "FRA",
  "GA": "GAB",
  "GB": "GBR",
  "GD": "GRD",
  "GE": "GEO",
  "GG": "GGY",
  "GH": "GHA",
  "GI": "GIB",
  "GL": "GRL",
  "GM": "GMB",
  "GN": "GIN",
  "GQ": "GNQ",
  "GR": "GRC",
  "GS": "SGS",
  "GT": "GTM",
  "GU": "GUM",
  "GW": "GNB",
  "GY": "GUY",
  "HK": "HKG",
  "HM": "HMD",
  "HN": "HND",
  "HR": "HRV",
  "HT": "HTI",
  "HU": "HUN",
  "ID": "IDN",
  "IE": "IRL",
  "IL": "ISR",
  "IM": "IMN",
  "IN": "IND",
  "IO": "IOT",
  "IQ": "IRQ",
  "IR": "IRN",
  "IS": "ISL",
  "IT": "ITA",
  "JE": "JEY",
  "JM": "JAM",
  "JO": "JOR",
  "JP": "JPN",
  "KE": "KEN",
  "KG": "KGZ",
  "KH": "KHM",
  "KI": "KIR",
  "KM": "COM",
  "KN": "KNA",
  "KP": "PRK",
  "KR": "KOR",
  "KW": "KWT",
  "KY": "CYM",
  "KZ": "KAZ",
  "LA": "LAO",
  "LB": "LBN",
  "LC": "LCA",
  "LI": "LIE",
  "LK": "LKA",
  "LR": "LBR",
  "LS": "LSO",
  "LT": "LTU",
  "LU": "LUX",
  "LV": "LVA",
  "LY": "LBY",
  "MA": "MAR",
  "MC": "MCO",
  "MD": "MDA",
  "ME": "MNE",
  "MF": "MAF",
  "MG": "MDG",
  "MH": "MHL",
  "MK": "MKD",
  "ML": "MLI",
  "MM": "MMR",
  "MN": "MNG",
  "MO": "MAC",
  "MP": "MNP",
  "MR": "MRT",
  "MS": "MSR",
  "MT": "MLT",
  "MU": "MUS",
  "MV": "MDV",
  "MW": "MWI",
  "MX": "MEX",
  "MY": "MYS",
  "MZ": "MOZ",
  "NA": "NAM",
  "NC": "NCL",
  "NE": "NER",
  "NF": "NFK",
  "NG": "NGA",
  "NI": "NIC",
  "NL": "NLD",
  "NO": "NOR",
  "NP": "NPL",
  "NR": "NRU",
  "NU": "NIU",
  "NZ": "NZL",
  "OM": "OMN",
  "PA": "PAN",
  "PE": "PER",
  "PF": "PYF",
  "PG": "PNG",
  "PH": "PHL",
  "PK": "PAK",
  "PL": "POL",
  "PM": "SPM",
  "PN": "PCN",
  "PR": "PRI",
  "PS": "PSE",
  "PT": "PRT",
  "PW": "PLW",
  "PY": "PRY",
  "QA": "QAT",
  "RO": "ROU",
  "RS": "SRB",
  "RU": "RUS",
  "RW": "RWA",
  "SA": "SAU",
  "SB": "SLB",
  "SC": "SYC",
  "SD": "SDN",
  "SE": "SWE",
  "SG": "SGP",
  "SH": "SHN",
  "SI": "SVN",
  "SK": "SVK",
  "SL": "SLE",
  "SM": "SMR",
  "SN": "SEN",
  "SO": "SOM",
  "SR": "SUR",
  "SS": "SSD",
  "ST": "STP",
  "SV": "SLV",
  "SX": "SXM",
  "SY": "SYR",
  "SZ": "SWZ",
  "TC": "TCA",
  "TD": "TCD",
  "TF": "ATF",
  "TG": "TGO",
  "TH": "THA",
  "TJ": "TJK",
  "TL": "TLS",
  "TM": "TKM",
  "TN": "TUN",
  "TO": "TON",
  "TR": "TUR",
  "TT": "TTO",
  "TV": "TUV",
  "TW": "TWN",
  "TZ": "TZA",
  "UA": "UKR",
  "UG": "UGA",
  "UM": "UMI",
  "US": "USA",
  "UY": "URY",
  "UZ": "UZB",
  "VA": "VAT",
  "VC": "VCT",
  "VE": "VEN",
  "VG": "VGB",
  "VI": "VIR",
  "VN": "VNM",
  "VU": "VUT",
  "WF": "WLF",
  "WS": "WSM",
  "XK": "XKX",
  "YE": "YEM",
  "ZA": "ZAF",
  "ZM": "ZMB",
  "ZW": "ZWE"
};
var iso2_to_iso3_default = ISO2_TO_ISO3;

// api/_cii-risk-cache-keys.js
var CII_RISK_SCORE_CACHE_KEYS = Object.freeze({
  live: "risk:scores:sebuf:v8",
  stale: "risk:scores:sebuf:stale:v8",
  trendHistoryPrefix: "risk:scores:sebuf:trend-history:v8"
});

// api/_json-response.js
function sanitizeJsonValue(value, depth = 0) {
  if (depth > 20) return "[truncated]";
  if (value instanceof Error) {
    return { error: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clone = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "stack" || key === "stackTrace" || key === "cause") continue;
      clone[key] = sanitizeJsonValue(nested, depth + 1);
    }
    return clone;
  }
  return value;
}
function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(sanitizeJsonValue(body)), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

// api/mcp/rpc.ts
function withMcpNoStore(extraHeaders = {}) {
  return { ...extraHeaders, "Cache-Control": "no-store" };
}
function rpcOk(id, result, extraHeaders = {}) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, result }, 200, withMcpNoStore(extraHeaders));
}
function rpcError(id, code, message, extraHeaders = {}) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, 200, withMcpNoStore(extraHeaders));
}

// api/mcp/ui/shell.ts
var UI_PROTOCOL_VERSION = "2026-01-26";
var UI_RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
var UI_CONNECT_DOMAINS = ["https://worldmonitor.app", "https://www.worldmonitor.app"];
var UI_FRAME_ANCESTORS = ["https://chatgpt.com", "https://claude.ai", "https://claude.com"];
function buildUiMeta() {
  return {
    ui: {
      csp: {
        connectDomains: [...UI_CONNECT_DOMAINS],
        resourceDomains: [],
        frameDomains: [],
        baseUriDomains: []
      },
      prefersBorder: true
    }
  };
}
var SHARED_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self' " + UI_CONNECT_DOMAINS.join(" ") + "; frame-ancestors " + UI_FRAME_ANCESTORS.join(" ") + "; form-action 'none'; base-uri 'none'";
var SHARED_STYLE_TOKENS = `
  :root {
    --bg: #ffffff; --fg: #0f172a; --muted: #64748b; --card: #f8fafc;
    --border: #e2e8f0; --accent: #2563eb;
    --low: #16a34a; --moderate: #ca8a04; --high: #ea580c; --severe: #dc2626;
    --up: #16a34a; --down: #dc2626;
  }
  [data-theme="dark"] {
    --bg: #0b1220; --fg: #e5e7eb; --muted: #94a3b8; --card: #131c2e;
    --border: #1e293b; --accent: #60a5fa;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { padding: 16px; max-width: 560px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .title { font-size: 20px; font-weight: 650; letter-spacing: 0.2px; }
  .badge { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  .empty { color: var(--muted); padding: 8px 0; }
  .foot { margin-top: 14px; font-size: 11px; color: var(--muted); }
  a { color: var(--accent); text-decoration: none; }
  .pbar { height: 6px; border-radius: 999px; background: var(--border); overflow: hidden; margin-top: 5px; }
  .pbar > span { display: block; height: 100%; width: 0%; background: var(--accent); }
`;
var SHARED_BRIDGE_HEAD = `
(function () {
  "use strict";
  var parentWin = window.parent;

  function post(msg) {
    try { parentWin.postMessage(msg, "*"); } catch (e) { /* host gone */ }
  }
  function notify(method, params) {
    post({ jsonrpc: "2.0", method: method, params: params || {} });
  }

  // ---- shared render helpers (widget renderBody uses these) ----
  function q(id) { return document.getElementById(id); }
  function num(v) {
    if (v == null) return null;
    var n = typeof v === "number" ? v : Number(v);
    return isFinite(n) ? n : null;
  }
  // Normalise both full array fields and summary:true fields shaped as
  // { count, sample }. The available flag remains false for absent/null/malformed
  // fields so widgets can distinguish a partial cache miss from a real empty
  // array (including { count: 0, sample: [] }).
  function listState(v) {
    if (Array.isArray(v)) return { available: true, items: v };
    if (v && typeof v === "object" && Array.isArray(v.sample)) {
      return { available: true, items: v.sample };
    }
    return { available: false, items: [] };
  }
  function clampPct(n) { return Math.max(0, Math.min(100, n)); }
  function setText(id, text) { var e = q(id); if (e) e.textContent = text == null ? "\u2014" : String(text); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = String(text);
    return e;
  }
  // Shared 0-100 probability bar: a .pbar node with a filled span, or null when
  // pct is not a finite number. Callers pass an already-0-100 value and append
  // the returned node under a market / forecast row.
  function probabilityBar(pct) {
    if (typeof pct !== "number" || !isFinite(pct)) return null;
    var bar = el("div", "pbar");
    var fill = el("span");
    fill.style.width = clampPct(pct) + "%";
    bar.appendChild(fill);
    return bar;
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function pctText(v) {
    var n = num(v);
    if (n == null) return "\u2014";
    return (n > 0 ? "+" : "") + n.toFixed(2) + "%";
  }
  function levelFor(score) {
    if (typeof score !== "number" || isNaN(score)) return { label: "Unknown", varName: "--muted" };
    if (score >= 75) return { label: "Severe", varName: "--severe" };
    if (score >= 50) return { label: "High", varName: "--high" };
    if (score >= 25) return { label: "Moderate", varName: "--moderate" };
    return { label: "Low", varName: "--low" };
  }
  // Text helpers centralised here so widget renderBody stays regex/escape-free.
  function collapseWs(s) { return String(s == null ? "" : s).replace(/\\s+/g, " ").trim(); }
  function paragraphs(s) {
    return String(s == null ? "" : s)
      .split(/\\n\\s*\\n/)
      .map(function (p) { return collapseWs(p); })
      .filter(Boolean);
  }
  function httpUrl(u) {
    if (typeof u !== "string") return "";
    try {
      var parsed = new URL(u.trim());
      return (parsed.protocol === "http:" || parsed.protocol === "https:") ? parsed.href : "";
    } catch (e) { return ""; }
  }
  function countryName(code) {
    var c = String(code == null ? "" : code).toUpperCase().slice(0, 2);
    if (!c) return "";
    try {
      var n = new Intl.DisplayNames(["en"], { type: "region" }).of(c);
      return n || c;
    } catch (e) { return c; }
  }

  function reportSize() {
    var root = q("root");
    if (!root) return;
    var h = Math.ceil(root.getBoundingClientRect().height) + 8;
    notify("ui/notifications/size-changed", { height: h });
  }

  function extractToolData(result) {
    if (!result || typeof result !== "object") return null;
    if (result.structuredContent && typeof result.structuredContent === "object") {
      return result.structuredContent;
    }
    if (Array.isArray(result.content)) {
      for (var i = 0; i < result.content.length; i++) {
        var c = result.content[i];
        if (c && c.type === "text" && typeof c.text === "string") {
          try { return JSON.parse(c.text); } catch (e) { /* not JSON */ }
        }
      }
    }
    return null;
  }

  function applyTheme(hostContext) {
    var theme = hostContext && hostContext.theme;
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  // Soft-error envelopes are SUCCESSFUL tools/call results (HTTP 200, valid
  // JSON) that carry an error sentinel instead of renderable data \u2014 the
  // dispatcher returns { _budget_exceeded, ... } when the tool output exceeds
  // its byte budget, and a bad jmespath projection returns { _jmespath_error,
  // ... }. A few tools also surface user-input faults as a result-level
  // { error: "..." } string. Rendering any of these through renderData() shows
  // a blank / empty-success dashboard, so detect them and surface a visible
  // message instead. Returns the message string, or null when data is genuinely
  // renderable.
  function softError(data) {
    if (!data || typeof data !== "object") return null;
    if (data._budget_exceeded === true) {
      return "This response is too large to display here. Narrow the request (fewer items, or a jmespath projection) and try again.";
    }
    if (data._jmespath_error) {
      return "The response projection could not be applied, so there is nothing to render. Remove the jmespath argument and retry.";
    }
    if (typeof data.error === "string" && data.error) return data.error;
    return null;
  }
  // Every fleet widget owns an #empty placeholder and an #card body; on a soft
  // error we reuse #empty as the error slot (hide the card) so the message is
  // visible regardless of which widget is mounted.
  function showError(msg) {
    var card = q("card");
    if (card) card.style.display = "none";
    var empty = q("empty");
    if (empty) { empty.textContent = msg; empty.style.display = "block"; }
  }

  function safeRender(data) {
    var errMsg = softError(data);
    if (errMsg) { showError(errMsg); reportSize(); return; }
    try { renderData(data); } catch (e) { /* never break the host on a bad payload */ }
    reportSize();
  }
`;
function renderBridgeTail(appName) {
  return `
  window.addEventListener("message", function (event) {
    if (event.source !== parentWin) return;
    var msg = event.data;
    if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return;

    if (msg.id === 1 && msg.result) {
      applyTheme(msg.result.hostContext);
      notify("ui/notifications/initialized", {});
      reportSize();
      return;
    }

    switch (msg.method) {
      case "ui/notifications/tool-result": {
        var data = extractToolData(msg.params && msg.params.result ? msg.params.result : msg.params);
        if (data) safeRender(data);
        break;
      }
      case "ui/notifications/tool-input":
        break;
      case "ui/notifications/host-context-changed":
        applyTheme(msg.params && msg.params.hostContext ? msg.params.hostContext : msg.params);
        break;
      default:
        break;
    }
  });

  applyTheme(null);

  post({
    jsonrpc: "2.0",
    id: 1,
    method: "ui/initialize",
    params: {
      protocolVersion: "${UI_PROTOCOL_VERSION}",
      appInfo: { name: ${JSON.stringify(appName)}, version: "1.0.0" },
      appCapabilities: {}
    }
  });
})();
`;
}
function buildAppHtml(spec) {
  const bridge = SHARED_BRIDGE_HEAD + "\n  function renderData(data) {\n" + spec.renderBody + "\n  }\n" + renderBridgeTail(spec.appName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- MCP Apps view quality: uppercase DOCTYPE + color-scheme so the host renders
     light/dark correctly (orank mcp-apps-ui-quality + mcp-view-domain checks). -->
<meta name="color-scheme" content="light dark">
<!-- MCP Apps view CSP (orank mcp-view-csp): all 4 required directive categories
     scoped. Shared across the widget fleet via api/mcp/ui/shell.ts. -->
<meta http-equiv="Content-Security-Policy" content="${SHARED_CSP}">
<title>${spec.title}</title>
<style>${SHARED_STYLE_TOKENS}${spec.styles}</style>
</head>
<body>
<div class="wrap" id="root">
${spec.body}
</div>
<script>${bridge}</script>
</body>
</html>`;
}

// api/mcp/ui/chokepoint-monitor-app.ts
var STYLES = `
  .crow { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
  .crow:first-child { border-top: none; }
  .crow-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .cname { font-size: 15px; font-weight: 600; }
  .risk { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
    padding: 1px 8px; border-radius: 999px; border: 1px solid var(--border); }
  .cstats { display: flex; gap: 18px; margin-top: 6px; flex-wrap: wrap; }
  .cstat { display: flex; flex-direction: column; }
  .cstat .k { font-size: 11px; color: var(--muted); }
  .cstat .v { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .csum { margin-top: 6px; font-size: 12px; color: var(--muted); }
`;
var BODY = `
  <div class="head">
    <div class="title">Chokepoint Monitor</div>
    <div class="badge">WorldMonitor Maritime</div>
  </div>
  <div class="empty" id="empty">Waiting for chokepoint data\u2026</div>
  <div id="card" style="display:none">
    <div id="rows"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    function prettyName(key) {
      var s = String(key == null ? "" : key).split("_").join(" ").trim();
      if (!s) return "\u2014";
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function riskColor(r) {
      if (r === "critical" || r === "severe") return cssVar("--severe");
      if (r === "high" || r === "elevated") return cssVar("--high");
      if (r === "moderate" || r === "warning") return cssVar("--moderate");
      return cssVar("--low");
    }
    function stat(k, v, color) {
      var wrap = el("div", "cstat");
      wrap.appendChild(el("span", "k", k));
      var val = el("span", "v", v);
      if (color) val.style.color = color;
      wrap.appendChild(val);
      return wrap;
    }

    var ts = d["transit-summaries"];
    var summaries = ts && typeof ts === "object" ? ts.summaries : null;
    var host = q("rows");
    host.textContent = "";
    var count = 0;
    if (summaries && typeof summaries === "object") {
      var keys = Object.keys(summaries);
      for (var i = 0; i < keys.length && count < 20; i++) {
        var s = summaries[keys[i]];
        if (!s || typeof s !== "object" || s.dataAvailable === false) continue;
        var row = el("div", "crow");
        var head = el("div", "crow-head");
        head.appendChild(el("span", "cname", prettyName(keys[i])));
        var risk = collapseWs(s.riskLevel).toLowerCase() || "normal";
        var badge = el("span", "risk", risk);
        var rc = riskColor(risk);
        badge.style.color = rc;
        badge.style.borderColor = rc;
        head.appendChild(badge);
        row.appendChild(head);

        var stats = el("div", "cstats");
        var total = num(s.todayTotal);
        stats.appendChild(stat("Transits today", total == null ? "\u2014" : String(Math.round(total))));
        var wow = num(s.wowChangePct);
        var wowColor = wow == null ? null : (wow >= 0 ? cssVar("--up") : cssVar("--down"));
        stats.appendChild(stat("Week over week", pctText(wow), wowColor));
        var tanker = num(s.todayTanker);
        if (tanker != null) stats.appendChild(stat("Tanker", String(Math.round(tanker))));
        row.appendChild(stats);

        if (s.riskSummary) row.appendChild(el("div", "csum", collapseWs(s.riskSummary)));
        host.appendChild(row);
        count++;
      }
    }
    if (!count) host.appendChild(el("div", "empty", "No chokepoint transit data available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var CHOKEPOINT_MONITOR_APP_HTML = buildAppHtml({
  title: "Chokepoint Monitor \u2014 WorldMonitor",
  appName: "worldmonitor-chokepoint-monitor",
  styles: STYLES,
  body: BODY,
  renderBody: RENDER
});

// api/mcp/ui/country-brief-app.ts
var STYLES2 = `
  .lens { display: inline-block; margin: 4px 0 0; font-size: 11px; color: var(--muted); }
  .lens b { color: var(--fg); font-weight: 600; }
  .brief { margin: 14px 0 4px; }
  .brief .para { margin: 0 0 10px; font-size: 14px; line-height: 1.6; }
  .section { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
  .src-row { display: flex; flex-direction: column; gap: 1px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .src-row:last-child { border-bottom: none; }
  .src-name { font-size: 11px; color: var(--accent); font-weight: 600; }
  .src-title { font-size: 12px; color: var(--fg); }
`;
var BODY2 = `
  <div class="head">
    <div class="title" id="title">Country Brief</div>
    <div class="badge">WorldMonitor Intelligence</div>
  </div>
  <div class="lens" id="lens" style="display:none"></div>
  <div class="empty" id="empty">Waiting for country-brief data\u2026</div>
  <div id="card" style="display:none">
    <div class="brief" id="brief"></div>
    <div class="section" id="src-sec" style="display:none">
      <div class="sec-label">Sources</div>
      <div class="sources" id="sources"></div>
    </div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER2 = `
    if (!data || typeof data !== "object") return;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var name = collapseWs(data.countryName) || countryName(data.countryCode || data.country_code);
    setText("title", name ? name + " Brief" : "Country Brief");

    var fw = collapseWs(data.framework);
    if (fw) {
      var lens = q("lens");
      lens.textContent = "";
      lens.appendChild(el("span", null, "Lens: "));
      lens.appendChild(el("b", null, fw));
      lens.style.display = "block";
    } else {
      q("lens").style.display = "none";
    }

    var brief = typeof data.brief === "string" ? data.brief
      : (typeof data.summary === "string" ? data.summary : "");
    var briefEl = q("brief");
    briefEl.textContent = "";
    var paras = paragraphs(brief);
    for (var i = 0; i < paras.length; i++) briefEl.appendChild(el("p", "para", paras[i]));
    if (!briefEl.childNodes.length) briefEl.appendChild(el("div", "empty", "No brief text available."));

    var srcs = Array.isArray(data.sources) ? data.sources : [];
    var srcHost = q("sources");
    srcHost.textContent = "";
    for (var k = 0; k < srcs.length && srcHost.childNodes.length < 8; k++) {
      var s = srcs[k];
      if (!s || typeof s !== "object") continue;
      var row = el("div", "src-row");
      row.appendChild(el("span", "src-name", collapseWs(s.source) || "source"));
      var url = httpUrl(s.url);
      if (s.title) {
        var titleText = collapseWs(s.title);
        if (url) {
          var a = el("a", "src-title", titleText);
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          row.appendChild(a);
        } else {
          row.appendChild(el("span", "src-title", titleText));
        }
      }
      srcHost.appendChild(row);
    }
    q("src-sec").style.display = srcHost.childNodes.length ? "block" : "none";

    var prov = [data.provider, data.model].filter(Boolean).map(collapseWs).filter(Boolean).join(" \xB7 ");
    var gen = data.generatedAt != null ? "Generated " + collapseWs(data.generatedAt) : "";
    q("foot").textContent = [prov, gen].filter(Boolean).join(" \xB7 ");
`;
var COUNTRY_BRIEF_APP_HTML = buildAppHtml({
  title: "Country Brief \u2014 WorldMonitor",
  appName: "worldmonitor-country-brief",
  styles: STYLES2,
  body: BODY2,
  renderBody: RENDER2
});

// api/mcp/ui/country-risk-app.ts
var COUNTRY_RISK_APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- MCP Apps view quality: uppercase DOCTYPE + color-scheme so the host renders
     light/dark correctly (orank mcp-apps-ui-quality + mcp-view-domain checks). -->
<meta name="color-scheme" content="light dark">
<!-- MCP Apps view CSP (orank mcp-view-csp). Scopes all 4 required directive
     categories: connect-src pins the MCP origin; frame-ancestors allowlists the
     agent hosts that embed this shell; form-action is locked ('none' \u2014 no forms);
     img/script/style-src are specific ('unsafe-inline' keeps the inline bridge +
     styles working) rather than '*'. default-src 'none' earns full credit over a
     permissive default. frame-ancestors is advisory in a <meta> CSP (browsers honor
     it only via HTTP header) but the static scanner reads it here. -->
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://worldmonitor.app https://www.worldmonitor.app; frame-ancestors https://chatgpt.com https://claude.ai https://claude.com; form-action 'none'; base-uri 'none'">
<title>Country Risk \u2014 WorldMonitor</title>
<style>
  :root {
    --bg: #ffffff; --fg: #0f172a; --muted: #64748b; --card: #f8fafc;
    --border: #e2e8f0; --accent: #2563eb;
    --low: #16a34a; --moderate: #ca8a04; --high: #ea580c; --severe: #dc2626;
  }
  [data-theme="dark"] {
    --bg: #0b1220; --fg: #e5e7eb; --muted: #94a3b8; --card: #131c2e;
    --border: #1e293b; --accent: #60a5fa;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { padding: 16px; max-width: 520px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .country { font-size: 20px; font-weight: 650; letter-spacing: 0.2px; }
  .badge { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--muted); }
  .cii-row { display: flex; align-items: center; gap: 14px; margin: 14px 0 4px; }
  .cii-score { font-size: 40px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .cii-of { color: var(--muted); font-size: 13px; }
  .level { font-weight: 600; font-size: 13px; padding: 2px 10px; border-radius: 999px;
    background: var(--card); border: 1px solid var(--border); }
  .bar { height: 8px; border-radius: 999px; background: var(--border); overflow: hidden; margin: 6px 0 18px; }
  .bar > span { display: block; height: 100%; background: var(--accent); width: 0%; transition: width .3s ease; }
  .components { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .comp { }
  .comp-top { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
  .comp-name { text-transform: capitalize; color: var(--fg); font-weight: 550; }
  .comp-bar { height: 6px; border-radius: 999px; background: var(--border); overflow: hidden; margin-top: 4px; }
  .comp-bar > span { display: block; height: 100%; width: 0%; }
  .meta { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border);
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; font-size: 12px; }
  .meta .k { color: var(--muted); }
  .meta .v { font-weight: 600; }
  .foot { margin-top: 14px; font-size: 11px; color: var(--muted); }
  .empty { color: var(--muted); padding: 8px 0; }
  a { color: var(--accent); text-decoration: none; }
</style>
</head>
<body>
<div class="wrap" id="root">
  <div class="empty" id="empty">Waiting for country-risk data\u2026</div>
  <div id="card" style="display:none">
    <div class="head">
      <div class="country" id="country">\u2014</div>
      <div class="badge" id="badge">Composite Instability Index</div>
    </div>
    <div class="cii-row">
      <div class="cii-score" id="cii">\u2014</div>
      <div class="cii-of">/ 100</div>
      <div class="level" id="level">\u2014</div>
    </div>
    <div class="bar"><span id="ciibar"></span></div>
    <div class="components" id="components"></div>
    <div class="meta">
      <div class="k">Travel advisory</div><div class="v" id="advisory">\u2014</div>
      <div class="k">Sanctions exposure</div><div class="v" id="sanctions">\u2014</div>
    </div>
    <div class="foot" id="foot"></div>
  </div>
</div>
<script>
(function () {
  "use strict";
  var parentWin = window.parent;

  function post(msg) {
    // Opaque sandbox origin: the host expects "*" and validates on its side.
    try { parentWin.postMessage(msg, "*"); } catch (e) { /* host gone */ }
  }
  function notify(method, params) {
    post({ jsonrpc: "2.0", method: method, params: params || {} });
  }

  function levelFor(score) {
    if (typeof score !== "number" || isNaN(score)) return { label: "Unknown", varName: "--muted" };
    if (score >= 75) return { label: "Severe", varName: "--severe" };
    if (score >= 50) return { label: "High", varName: "--high" };
    if (score >= 25) return { label: "Moderate", varName: "--moderate" };
    return { label: "Low", varName: "--low" };
  }
  function num(v) {
    var n = typeof v === "number" ? v : Number(v);
    return isFinite(n) ? n : null;
  }
  function clampPct(n) { return Math.max(0, Math.min(100, n)); }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text == null ? "\u2014" : String(text);
  }

  function describeAdvisory(a) {
    if (a == null) return "\u2014";
    if (typeof a === "string") return a;
    if (typeof a === "object" && a.level != null) {
      var lvl = num(a.level);
      return lvl == null ? "\u2014" : "Level " + lvl;
    }
    return "\u2014";
  }
  function describeSanctions(s) {
    if (s == null) return "None";
    if (Array.isArray(s)) return s.length === 0 ? "None" : String(s.length) + " listed";
    if (typeof s === "object") {
      var keys = Object.keys(s);
      return keys.length === 0 ? "None" : String(keys.length) + " field(s)";
    }
    if (typeof s === "number") return String(s);
    return String(s);
  }

  function render(data) {
    if (!data || typeof data !== "object") return;
    document.getElementById("empty").style.display = "none";
    document.getElementById("card").style.display = "block";

    setText("country", data.country_code || data.country || "\u2014");

    var cii = num(data.cii);
    setText("cii", cii == null ? "\u2014" : String(Math.round(cii)));
    var lv = levelFor(cii);
    var levelEl = document.getElementById("level");
    levelEl.textContent = lv.label;
    if (cii != null) {
      var color = getComputedStyle(document.documentElement).getPropertyValue(lv.varName).trim();
      levelEl.style.color = color;
      var bar = document.getElementById("ciibar");
      bar.style.width = clampPct(cii) + "%";
      bar.style.background = color || "var(--accent)";
    }

    var comps = (data.components && typeof data.components === "object") ? data.components : {};
    var order = ["unrest", "conflict", "security", "news"];
    var host = document.getElementById("components");
    host.textContent = "";
    var any = false;
    order.forEach(function (key) {
      var val = num(comps[key]);
      if (val == null) return;
      any = true;
      var wrap = document.createElement("div");
      wrap.className = "comp";
      var top = document.createElement("div");
      top.className = "comp-top";
      var name = document.createElement("span");
      name.className = "comp-name";
      name.textContent = key;
      var v = document.createElement("span");
      v.textContent = String(Math.round(val));
      top.appendChild(name); top.appendChild(v);
      var cbar = document.createElement("div");
      cbar.className = "comp-bar";
      var fill = document.createElement("span");
      var cl = levelFor(val);
      var ccolor = getComputedStyle(document.documentElement).getPropertyValue(cl.varName).trim();
      fill.style.width = clampPct(val) + "%";
      fill.style.background = ccolor || "var(--accent)";
      cbar.appendChild(fill);
      wrap.appendChild(top); wrap.appendChild(cbar);
      host.appendChild(wrap);
    });
    if (!any) {
      var none = document.createElement("div");
      none.className = "empty";
      none.textContent = "No component breakdown available.";
      host.appendChild(none);
    }

    setText("advisory", describeAdvisory(data.travelAdvisory));
    setText("sanctions", describeSanctions(data.sanctionsExposure));

    var foot = document.getElementById("foot");
    if (data.cached_at) {
      foot.textContent = "Snapshot: " + String(data.cached_at) + (data.stale ? " (stale)" : "");
    } else {
      foot.textContent = "";
    }
    reportSize();
  }

  function applyTheme(hostContext) {
    var theme = hostContext && hostContext.theme;
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  function extractToolData(result) {
    if (!result || typeof result !== "object") return null;
    if (result.structuredContent && typeof result.structuredContent === "object") {
      return result.structuredContent;
    }
    if (Array.isArray(result.content)) {
      for (var i = 0; i < result.content.length; i++) {
        var c = result.content[i];
        if (c && c.type === "text" && typeof c.text === "string") {
          try { return JSON.parse(c.text); } catch (e) { /* not JSON */ }
        }
      }
    }
    return null;
  }

  function reportSize() {
    var h = Math.ceil(document.getElementById("root").getBoundingClientRect().height) + 8;
    notify("ui/notifications/size-changed", { height: h });
  }

  window.addEventListener("message", function (event) {
    // Trust boundary: only the embedding host (window.parent) may drive us.
    if (event.source !== parentWin) return;
    var msg = event.data;
    if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") return;

    // Response to our ui/initialize request.
    if (msg.id === 1 && msg.result) {
      applyTheme(msg.result.hostContext);
      notify("ui/notifications/initialized", {});
      reportSize();
      return;
    }

    switch (msg.method) {
      case "ui/notifications/tool-result": {
        var data = extractToolData(msg.params && msg.params.result ? msg.params.result : msg.params);
        if (data) render(data);
        break;
      }
      case "ui/notifications/tool-input":
        // Arguments (e.g. country_code) arrive before the result; no-op \u2014
        // the header country is populated from the result payload.
        break;
      case "ui/notifications/host-context-changed":
        applyTheme(msg.params && msg.params.hostContext ? msg.params.hostContext : msg.params);
        break;
      default:
        break;
    }
  });

  // Apply the OS/browser color preference up front so the theme is correct
  // from first paint regardless of host message ordering; the host's
  // ui/initialize result (hostContext.theme) overrides it if provided.
  applyTheme(null);

  // Kick off the handshake.
  post({
    jsonrpc: "2.0",
    id: 1,
    method: "ui/initialize",
    params: {
      protocolVersion: "2026-01-26",
      appInfo: { name: "worldmonitor-country-risk", version: "1.0.0" },
      appCapabilities: {}
    }
  });
})();
</script>
</body>
</html>`;

// api/mcp/ui/market-radar-app.ts
var STYLES3 = `
  .fg { display: none; align-items: center; gap: 12px; margin: 14px 0 4px; }
  .fg-score { font-size: 34px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .fg-meta { flex: 1; }
  .fg-cap { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  .fg-label { font-size: 13px; font-weight: 600; }
  .fg-track { height: 8px; border-radius: 999px; background: var(--border); overflow: hidden; margin-top: 6px; }
  .fg-track > span { display: block; height: 100%; width: 0%; transition: width .3s ease; }
  .mgroup { margin-top: 16px; }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  .qtbl { display: grid; grid-template-columns: 1fr auto auto; gap: 4px 14px; align-items: baseline; }
  .qsym { font-weight: 600; font-size: 13px; }
  .qprice { font-variant-numeric: tabular-nums; color: var(--muted); text-align: right; }
  .qchg { font-variant-numeric: tabular-nums; text-align: right; min-width: 68px; }
`;
var BODY3 = `
  <div class="head">
    <div class="title">Market Radar</div>
    <div class="badge">WorldMonitor Markets</div>
  </div>
  <div class="empty" id="empty">Waiting for market data\u2026</div>
  <div id="card" style="display:none">
    <div class="fg" id="fg">
      <div class="fg-score" id="fg-score">\u2014</div>
      <div class="fg-meta">
        <div class="fg-cap">Fear &amp; Greed</div>
        <div class="fg-label" id="fg-label">\u2014</div>
        <div class="fg-track"><span id="fg-bar"></span></div>
      </div>
    </div>
    <div id="groups"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER3 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var fg = d["fear-greed"];
    var comp = fg && typeof fg === "object" ? fg.composite : null;
    var score = null, label = "";
    if (comp && typeof comp === "object") { score = num(comp.score); label = collapseWs(comp.label); }
    else if (typeof comp === "number") { score = num(comp); }
    if (score != null) {
      q("fg").style.display = "flex";
      setText("fg-score", String(Math.round(score)));
      setText("fg-label", label || "");
      var col = score >= 55 ? cssVar("--up") : (score <= 45 ? cssVar("--down") : cssVar("--moderate"));
      var fgBar = q("fg-bar");
      fgBar.style.width = clampPct(score) + "%";
      fgBar.style.background = col || "var(--accent)";
      q("fg-score").style.color = col || "";
    } else {
      q("fg").style.display = "none";
    }

    var groups = [
      { key: "stocks-bootstrap", list: "quotes", label: "Equities" },
      { key: "commodities-bootstrap", list: "quotes", label: "Commodities" },
      { key: "crypto", list: "quotes", label: "Crypto" },
      { key: "gulf-quotes", list: "quotes", label: "Gulf" },
      { key: "sectors", list: "sectors", label: "Sectors" }
    ];
    var host = q("groups");
    host.textContent = "";
    var rendered = 0;
    for (var g = 0; g < groups.length; g++) {
      var cfg = groups[g];
      var node = d[cfg.key];
      var items = node && typeof node === "object" ? node[cfg.list] : null;
      if (!Array.isArray(items) || !items.length) continue;
      var sec = el("div", "mgroup");
      sec.appendChild(el("div", "sec-label", cfg.label));
      var tbl = el("div", "qtbl");
      for (var i = 0; i < items.length && i < 8; i++) {
        var it = items[i];
        if (!it || typeof it !== "object") continue;
        tbl.appendChild(el("span", "qsym", collapseWs(it.symbol || it.name || it.ticker) || "\u2014"));
        var price = num(it.price);
        tbl.appendChild(el("span", "qprice",
          price == null ? "\u2014" : price.toLocaleString(undefined, { maximumFractionDigits: 2 })));
        var chg = num(it.changePercent);
        var cell = el("span", "qchg", pctText(chg));
        if (chg != null) cell.style.color = chg >= 0 ? cssVar("--up") : cssVar("--down");
        tbl.appendChild(cell);
      }
      sec.appendChild(tbl);
      host.appendChild(sec);
      rendered++;
    }
    if (!rendered) host.appendChild(el("div", "empty", "No market data available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var MARKET_RADAR_APP_HTML = buildAppHtml({
  title: "Market Radar \u2014 WorldMonitor",
  appName: "worldmonitor-market-radar",
  styles: STYLES3,
  body: BODY3,
  renderBody: RENDER3
});

// api/mcp/ui/world-brief-app.ts
var STYLES4 = `
  .brief { margin: 14px 0 4px; }
  .brief .para { margin: 0 0 10px; font-size: 14px; line-height: 1.6; }
  .section { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
  ul.headlines { margin: 0; padding-left: 18px; }
  ul.headlines li { margin: 4px 0; font-size: 13px; }
  .src-row { display: flex; flex-direction: column; gap: 1px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .src-row:last-child { border-bottom: none; }
  .src-name { font-size: 11px; color: var(--accent); font-weight: 600; }
  .src-title { font-size: 12px; color: var(--fg); }
  .src-date { font-size: 11px; color: var(--muted); }
`;
var BODY4 = `
  <div class="head">
    <div class="title" id="title">World Brief</div>
    <div class="badge">WorldMonitor Intelligence</div>
  </div>
  <div class="empty" id="empty">Waiting for world-brief data\u2026</div>
  <div id="card" style="display:none">
    <div class="brief" id="brief"></div>
    <div class="section" id="hl-sec" style="display:none">
      <div class="sec-label">Grounding headlines</div>
      <ul class="headlines" id="headlines"></ul>
    </div>
    <div class="section" id="src-sec" style="display:none">
      <div class="sec-label">Sources</div>
      <div class="sources" id="sources"></div>
    </div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER4 = `
    if (!data || typeof data !== "object") return;
    var brief = typeof data.brief === "string" && data.brief ? data.brief
      : (typeof data.summary === "string" ? data.summary : "");
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var briefEl = q("brief");
    briefEl.textContent = "";
    var paras = paragraphs(brief);
    for (var i = 0; i < paras.length; i++) briefEl.appendChild(el("p", "para", paras[i]));
    if (!briefEl.childNodes.length) briefEl.appendChild(el("div", "empty", "No brief text available."));

    var hls = Array.isArray(data.headlines) ? data.headlines : [];
    var hlHost = q("headlines");
    hlHost.textContent = "";
    for (var j = 0; j < hls.length && hlHost.childNodes.length < 12; j++) {
      var h = hls[j];
      if (typeof h !== "string" || !h) continue;
      hlHost.appendChild(el("li", null, collapseWs(h)));
    }
    q("hl-sec").style.display = hlHost.childNodes.length ? "block" : "none";

    var srcs = Array.isArray(data.sources) ? data.sources : [];
    var srcHost = q("sources");
    srcHost.textContent = "";
    for (var k = 0; k < srcs.length && srcHost.childNodes.length < 8; k++) {
      var s = srcs[k];
      if (!s || typeof s !== "object") continue;
      var row = el("div", "src-row");
      row.appendChild(el("span", "src-name", collapseWs(s.source) || "source"));
      var url = httpUrl(s.url);
      if (s.title) {
        var titleText = collapseWs(s.title);
        if (url) {
          var a = el("a", "src-title", titleText);
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          row.appendChild(a);
        } else {
          row.appendChild(el("span", "src-title", titleText));
        }
      }
      if (s.publishedAt) row.appendChild(el("span", "src-date", collapseWs(s.publishedAt)));
      srcHost.appendChild(row);
    }
    q("src-sec").style.display = srcHost.childNodes.length ? "block" : "none";

    var prov = [data.provider, data.model].filter(Boolean).map(collapseWs).filter(Boolean).join(" \xB7 ");
    var gen = data.generatedAt != null ? "Generated " + collapseWs(data.generatedAt) : "";
    q("foot").textContent = [prov, gen].filter(Boolean).join(" \xB7 ");
`;
var WORLD_BRIEF_APP_HTML = buildAppHtml({
  title: "World Brief \u2014 WorldMonitor",
  appName: "worldmonitor-world-brief",
  styles: STYLES4,
  body: BODY4,
  renderBody: RENDER4
});

// api/mcp/ui/news-intelligence-app.ts
var STYLES5 = `
  .story { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .story:last-child { border-bottom: none; }
  .story-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .story-title { font-size: 14px; font-weight: 600; color: var(--fg); }
  .chip { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
    border: 1px solid var(--border); border-radius: 999px; padding: 1px 7px; }
  .chip.alert { color: #fff; background: var(--severe); border-color: var(--severe); font-weight: 600; }
  .story-country { font-size: 11px; color: var(--muted); }
  .story-src { margin-top: 4px; font-size: 12px; color: var(--muted); }
`;
var BODY5 = `
  <div class="head">
    <div class="title">News Intelligence</div>
    <div class="badge">WorldMonitor Intelligence</div>
  </div>
  <div class="empty" id="empty">Waiting for news intelligence\u2026</div>
  <div id="card" style="display:none">
    <div id="list"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER5 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var ins = d.insights && typeof d.insights === "object" ? d.insights : null;
    var storyState = listState(ins && ins.topStories);
    var stories = storyState.items;
    var host = q("list");
    host.textContent = "";
    for (var i = 0; i < stories.length && i < 12; i++) {
      var s = stories[i];
      if (!s || typeof s !== "object") continue;
      var row = el("div", "story");
      var head = el("div", "story-head");
      head.appendChild(el("span", "story-title", collapseWs(s.primaryTitle) || "Untitled story"));
      var cat = collapseWs(s.category);
      if (cat) head.appendChild(el("span", "chip", cat));
      if (s.isAlert === true) head.appendChild(el("span", "chip alert", "Alert"));
      var cn = countryName(s.countryCode);
      if (cn) head.appendChild(el("span", "story-country", cn));
      row.appendChild(head);
      var src = collapseWs(s.primarySource);
      if (src) row.appendChild(el("div", "story-src", src));
      host.appendChild(row);
    }
    if (!host.childNodes.length) {
      host.appendChild(el("div", "empty", storyState.available
        ? "No news stories available."
        : "News intelligence is temporarily unavailable."));
    }

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var NEWS_INTELLIGENCE_APP_HTML = buildAppHtml({
  title: "News Intelligence \u2014 WorldMonitor",
  appName: "worldmonitor-news-intelligence",
  styles: STYLES5,
  body: BODY5,
  renderBody: RENDER5
});

// api/mcp/ui/conflict-events-app.ts
var STYLES6 = `
  .evt { display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
    padding: 9px 0; border-bottom: 1px solid var(--border); }
  .evt:last-child { border-bottom: none; }
  .evt-main { min-width: 0; }
  .evt-sides { font-size: 13px; font-weight: 600; color: var(--fg); }
  .evt-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .evt-deaths { font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 600; white-space: nowrap; }
`;
var BODY6 = `
  <div class="head">
    <div class="title">Conflict Events</div>
    <div class="badge">WorldMonitor Conflict</div>
  </div>
  <div class="empty" id="empty">Waiting for conflict data\u2026</div>
  <div id="card" style="display:none">
    <div id="list"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER6 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var uc = d["ucdp-events"] && typeof d["ucdp-events"] === "object" ? d["ucdp-events"] : null;
    var eventState = listState(uc && uc.events);
    var evs = eventState.items;
    var vtMap = {
      UCDP_VIOLENCE_TYPE_STATE_BASED: "State-based",
      UCDP_VIOLENCE_TYPE_NON_STATE: "Non-state",
      UCDP_VIOLENCE_TYPE_ONE_SIDED: "One-sided"
    };
    var host = q("list");
    host.textContent = "";
    for (var i = 0; i < evs.length && i < 14; i++) {
      var ev = evs[i];
      if (!ev || typeof ev !== "object") continue;
      var row = el("div", "evt");
      var main = el("div", "evt-main");
      var a = collapseWs(ev.sideA);
      var b = collapseWs(ev.sideB);
      var vt = vtMap[collapseWs(ev.violenceType)] || "";
      var sides = a && b ? a + " vs " + b : (a || b || vt || "Event");
      main.appendChild(el("div", "evt-sides", sides));
      var metaParts = [];
      var ct = collapseWs(ev.country);
      if (ct) metaParts.push(ct);
      if (vt && a && b) metaParts.push(vt);
      var dv = ev.dateStart;
      var dt = dv != null ? new Date(typeof dv === "number" ? dv : String(dv)) : null;
      if (dt && !isNaN(dt.getTime())) metaParts.push(dt.toISOString().slice(0, 10));
      main.appendChild(el("div", "evt-meta", metaParts.join(" \xB7 ")));
      row.appendChild(main);
      var deaths = num(ev.deathsBest);
      if (deaths != null) {
        var badge = el("span", "evt-deaths", deaths.toLocaleString() + (deaths === 1 ? " death" : " deaths"));
        var dcol = deaths >= 100 ? cssVar("--severe") : (deaths >= 10 ? cssVar("--high") : (deaths >= 1 ? cssVar("--moderate") : cssVar("--muted")));
        badge.style.color = dcol || "";
        row.appendChild(badge);
      }
      host.appendChild(row);
    }
    if (!host.childNodes.length) {
      host.appendChild(el("div", "empty", eventState.available
        ? "No conflict events available."
        : "Conflict event data is temporarily unavailable."));
    }

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var CONFLICT_EVENTS_APP_HTML = buildAppHtml({
  title: "Conflict Events \u2014 WorldMonitor",
  appName: "worldmonitor-conflict-events",
  styles: STYLES6,
  body: BODY6,
  renderBody: RENDER6
});

// api/mcp/ui/natural-disasters-app.ts
var STYLES7 = `
  .dgroup { margin-top: 14px; }
  .dgroup:first-child { margin-top: 4px; }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  .drow { display: flex; align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .drow:last-child { border-bottom: none; }
  .mag { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; min-width: 52px; }
  .dplace { flex: 1; font-size: 13px; color: var(--fg); min-width: 0; }
  .dtime { font-size: 11px; color: var(--muted); white-space: nowrap; }
`;
var BODY7 = `
  <div class="head">
    <div class="title">Natural Disasters</div>
    <div class="badge">WorldMonitor Hazards</div>
  </div>
  <div class="empty" id="empty">Waiting for hazard data\u2026</div>
  <div id="card" style="display:none">
    <div id="groups"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER7 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var host = q("groups");
    host.textContent = "";

    var quakeNode = d.earthquakes && typeof d.earthquakes === "object" ? d.earthquakes : null;
    var quakeState = listState(quakeNode && quakeNode.earthquakes);
    var quakes = quakeState.items;
    if (quakes.length) {
      var sec = el("div", "dgroup");
      sec.appendChild(el("div", "sec-label", "Earthquakes"));
      for (var i = 0; i < quakes.length && i < 8; i++) {
        var eq = quakes[i];
        if (!eq || typeof eq !== "object") continue;
        var row = el("div", "drow");
        var m = num(eq.magnitude);
        var mag = el("span", "mag", m == null ? "\u2014" : "M" + m.toFixed(1));
        var col = m == null ? cssVar("--muted") : (m >= 6 ? cssVar("--severe") : (m >= 5 ? cssVar("--high") : (m >= 4 ? cssVar("--moderate") : cssVar("--low"))));
        mag.style.color = col || "";
        row.appendChild(mag);
        row.appendChild(el("span", "dplace", collapseWs(eq.place) || "Unknown location"));
        var tv = eq.occurredAt;
        var dt = tv != null ? new Date(typeof tv === "number" ? tv : String(tv)) : null;
        row.appendChild(el("span", "dtime", dt && !isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : ""));
        sec.appendChild(row);
      }
      host.appendChild(sec);
    } else if (!quakeState.available) {
      var quakeMissing = el("div", "dgroup");
      quakeMissing.appendChild(el("div", "sec-label", "Earthquakes"));
      quakeMissing.appendChild(el("div", "empty", "Earthquake data is temporarily unavailable."));
      host.appendChild(quakeMissing);
    }

    var fireNode = d.fires && typeof d.fires === "object" ? d.fires : null;
    var fireState = listState(fireNode && fireNode.fireDetections);
    var fires = fireState.items;
    if (fires.length) {
      var fsec = el("div", "dgroup");
      var fireShown = Math.min(fires.length, 6);
      var fireLabel = fires.length > fireShown
        ? "Active Wildfires (" + fireShown + " of " + fires.length + ")"
        : "Active Wildfires (" + fires.length + ")";
      fsec.appendChild(el("div", "sec-label", fireLabel));
      var confMap = {
        FIRE_CONFIDENCE_HIGH: "High",
        FIRE_CONFIDENCE_NOMINAL: "Nominal",
        FIRE_CONFIDENCE_LOW: "Low"
      };
      for (var k = 0; k < fireShown; k++) {
        var fr = fires[k];
        if (!fr || typeof fr !== "object") continue;
        var frow = el("div", "drow");
        var confLabel = confMap[collapseWs(fr.confidence)] || "";
        frow.appendChild(el("span", "mag", confLabel || "Fire"));
        var loc = fr.location && typeof fr.location === "object" ? fr.location : null;
        var lat = loc ? num(loc.latitude) : null;
        var lng = loc ? num(loc.longitude) : null;
        var place = collapseWs(fr.region) || (lat != null && lng != null ? lat.toFixed(2) + ", " + lng.toFixed(2) : "detection");
        frow.appendChild(el("span", "dplace", place));
        var bright = num(fr.brightness);
        frow.appendChild(el("span", "dtime", bright != null ? "brightness " + Math.round(bright) : ""));
        fsec.appendChild(frow);
      }
      host.appendChild(fsec);
    } else if (!fireState.available) {
      var fireMissing = el("div", "dgroup");
      fireMissing.appendChild(el("div", "sec-label", "Active Wildfires"));
      fireMissing.appendChild(el("div", "empty", "Wildfire data is temporarily unavailable."));
      host.appendChild(fireMissing);
    }

    if (!host.childNodes.length) host.appendChild(el("div", "empty", "No natural-hazard events available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var NATURAL_DISASTERS_APP_HTML = buildAppHtml({
  title: "Natural Disasters \u2014 WorldMonitor",
  appName: "worldmonitor-natural-disasters",
  styles: STYLES7,
  body: BODY7,
  renderBody: RENDER7
});

// api/mcp/ui/prediction-markets-app.ts
var STYLES8 = `
  .mgroup { margin-top: 14px; }
  .mgroup:first-child { margin-top: 4px; }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  .mkt { padding: 7px 0; border-bottom: 1px solid var(--border); }
  .mkt:last-child { border-bottom: none; }
  .mkt-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .mkt-title { font-size: 13px; color: var(--fg); min-width: 0; }
  .mkt-prob { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; white-space: nowrap; }
  .mkt-src { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-top: 2px; }
`;
var BODY8 = `
  <div class="head">
    <div class="title">Prediction Markets</div>
    <div class="badge">WorldMonitor Markets</div>
  </div>
  <div class="empty" id="empty">Waiting for market odds\u2026</div>
  <div id="card" style="display:none">
    <div id="groups"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER8 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var mb = d["markets-bootstrap"] && typeof d["markets-bootstrap"] === "object" ? d["markets-bootstrap"] : null;
    var buckets = [
      { key: "geopolitical", label: "Geopolitical" },
      { key: "tech", label: "Tech" },
      { key: "finance", label: "Finance" }
    ];
    var host = q("groups");
    host.textContent = "";
    for (var g = 0; g < buckets.length; g++) {
      var cfg = buckets[g];
      var list = listState(mb && mb[cfg.key]).items;
      if (!list || !list.length) continue;
      var sec = el("div", "mgroup");
      sec.appendChild(el("div", "sec-label", cfg.label));
      for (var i = 0; i < list.length && i < 6; i++) {
        var m = list[i];
        if (!m || typeof m !== "object") continue;
        var mkt = el("div", "mkt");
        var head = el("div", "mkt-head");
        head.appendChild(el("span", "mkt-title", collapseWs(m.title) || "Market"));
        var p = num(m.yesPrice);
        var pct = p == null ? null : p; // yesPrice is already a 0-100 percentage \u2014 no scaling
        head.appendChild(el("span", "mkt-prob", pct == null ? "\u2014" : Math.round(pct) + "%"));
        mkt.appendChild(head);
        var bar = probabilityBar(pct);
        if (bar) mkt.appendChild(bar);
        var src = collapseWs(m.source);
        if (src) mkt.appendChild(el("div", "mkt-src", src));
        sec.appendChild(mkt);
      }
      host.appendChild(sec);
    }
    if (!host.childNodes.length) host.appendChild(el("div", "empty", "No prediction markets available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var PREDICTION_MARKETS_APP_HTML = buildAppHtml({
  title: "Prediction Markets \u2014 WorldMonitor",
  appName: "worldmonitor-prediction-markets",
  styles: STYLES8,
  body: BODY8,
  renderBody: RENDER8
});

// api/mcp/ui/forecasts-app.ts
var STYLES9 = `
  .fc { padding: 8px 0; border-bottom: 1px solid var(--border); }
  .fc:last-child { border-bottom: none; }
  .fc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .fc-title { font-size: 13px; color: var(--fg); min-width: 0; }
  .fc-prob { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; white-space: nowrap; }
  .fc-meta { margin-top: 3px; display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
    border: 1px solid var(--border); border-radius: 999px; padding: 1px 7px; }
`;
var BODY9 = `
  <div class="head">
    <div class="title">Forecasts</div>
    <div class="badge">WorldMonitor Forecasts</div>
  </div>
  <div class="empty" id="empty">Waiting for forecasts\u2026</div>
  <div id="card" style="display:none">
    <div id="list"></div>
    <div class="foot" id="foot"></div>
  </div>
`;
var RENDER9 = `
    if (!data || typeof data !== "object") return;
    var d = data.data && typeof data.data === "object" ? data.data : data;
    q("empty").style.display = "none";
    q("card").style.display = "block";

    var node = d.predictions && typeof d.predictions === "object" ? d.predictions : null;
    var preds = listState(node && node.predictions).items;
    var host = q("list");
    host.textContent = "";
    for (var i = 0; i < preds.length && i < 12; i++) {
      var p = preds[i];
      if (!p || typeof p !== "object") continue;
      var fc = el("div", "fc");
      var head = el("div", "fc-head");
      head.appendChild(el("span", "fc-title", collapseWs(p.title) || "Forecast"));
      var pr = num(p.probability);
      var pct = pr == null ? null : (pr <= 1 ? pr * 100 : pr);
      head.appendChild(el("span", "fc-prob", pct == null ? "\u2014" : Math.round(pct) + "%"));
      fc.appendChild(head);
      var meta = el("div", "fc-meta");
      var dom = collapseWs(p.domain);
      if (dom) meta.appendChild(el("span", "chip", dom));
      var reg = collapseWs(p.region);
      if (reg) meta.appendChild(el("span", "chip", reg));
      if (meta.childNodes.length) fc.appendChild(meta);
      var bar = probabilityBar(pct);
      if (bar) fc.appendChild(bar);
      host.appendChild(fc);
    }
    if (!host.childNodes.length) host.appendChild(el("div", "empty", "No forecasts available."));

    q("foot").textContent = data.cached_at
      ? "Snapshot: " + collapseWs(data.cached_at) + (data.stale ? " (stale)" : "")
      : "";
`;
var FORECASTS_APP_HTML = buildAppHtml({
  title: "Forecasts \u2014 WorldMonitor",
  appName: "worldmonitor-forecasts",
  styles: STYLES9,
  body: BODY9,
  renderBody: RENDER9
});

// api/mcp/ui/registry.ts
var UI_RESOURCE_MIME_TYPE2 = UI_RESOURCE_MIME_TYPE;
var COUNTRY_RISK_UI_URI = "ui://worldmonitor/country-risk.html";
var WORLD_BRIEF_UI_URI = "ui://worldmonitor/world-brief.html";
var COUNTRY_BRIEF_UI_URI = "ui://worldmonitor/country-brief.html";
var MARKET_RADAR_UI_URI = "ui://worldmonitor/market-radar.html";
var CHOKEPOINT_MONITOR_UI_URI = "ui://worldmonitor/chokepoint-monitor.html";
var NEWS_INTELLIGENCE_UI_URI = "ui://worldmonitor/news-intelligence.html";
var CONFLICT_EVENTS_UI_URI = "ui://worldmonitor/conflict-events.html";
var NATURAL_DISASTERS_UI_URI = "ui://worldmonitor/natural-disasters.html";
var PREDICTION_MARKETS_UI_URI = "ui://worldmonitor/prediction-markets.html";
var FORECASTS_UI_URI = "ui://worldmonitor/forecasts.html";
var UI_RESOURCE_REGISTRY = [
  {
    uri: COUNTRY_RISK_UI_URI,
    name: "Country Risk (interactive)",
    description: "Interactive in-conversation app shell for get_country_risk: renders the Composite Instability Index (CII 0-100), the unrest/conflict/security/news component breakdown, travel-advisory level, and sanctions exposure. Linked from the get_country_risk tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: COUNTRY_RISK_APP_HTML
  },
  {
    uri: WORLD_BRIEF_UI_URI,
    name: "World Brief (interactive)",
    description: "Interactive in-conversation app shell for get_world_brief: renders the AI-summarised global intelligence brief as readable paragraphs, the grounding headlines, and the source feed articles. Linked from the get_world_brief tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: WORLD_BRIEF_APP_HTML
  },
  {
    uri: COUNTRY_BRIEF_UI_URI,
    name: "Country Brief (interactive)",
    description: "Interactive in-conversation app shell for get_country_brief: renders the AI-synthesised per-country intelligence brief as paragraphs, the analytical framework lens, and the grounding sources. Linked from the get_country_brief tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: COUNTRY_BRIEF_APP_HTML
  },
  {
    uri: MARKET_RADAR_UI_URI,
    name: "Market Radar (interactive)",
    description: "Interactive in-conversation app shell for get_market_data: renders the Fear & Greed composite plus per-asset-class quote tables (equities, commodities, crypto, Gulf, sectors) with signed, colour-coded change. Linked from the get_market_data tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: MARKET_RADAR_APP_HTML
  },
  {
    uri: CHOKEPOINT_MONITOR_UI_URI,
    name: "Chokepoint Monitor (interactive)",
    description: "Interactive in-conversation app shell for get_chokepoint_status: renders per-chokepoint rolling transit summaries (today's transit count, week-over-week change, tanker split) with a risk-level badge. Linked from the get_chokepoint_status tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: CHOKEPOINT_MONITOR_APP_HTML
  },
  {
    uri: NEWS_INTELLIGENCE_UI_URI,
    name: "News Intelligence (interactive)",
    description: "Interactive in-conversation app shell for get_news_intelligence: renders AI-classified top stories (title, category, alert flag, country, source) from WorldMonitor's intelligence layer. Linked from the get_news_intelligence tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: NEWS_INTELLIGENCE_APP_HTML
  },
  {
    uri: CONFLICT_EVENTS_UI_URI,
    name: "Conflict Events (interactive)",
    description: "Interactive in-conversation app shell for get_conflict_events: renders active armed-conflict events (belligerents, violence type, country, fatalities, date) from the UCDP feed. Linked from the get_conflict_events tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: CONFLICT_EVENTS_APP_HTML
  },
  {
    uri: NATURAL_DISASTERS_UI_URI,
    name: "Natural Disasters (interactive)",
    description: "Interactive in-conversation app shell for get_natural_disasters: groups recent earthquakes (USGS magnitude, place, time) and active wildfires (NASA FIRMS). Linked from the get_natural_disasters tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: NATURAL_DISASTERS_APP_HTML
  },
  {
    uri: PREDICTION_MARKETS_UI_URI,
    name: "Prediction Markets (interactive)",
    description: "Interactive in-conversation app shell for get_prediction_markets: renders active event-contract odds grouped by category (geopolitical, tech, finance) with a probability bar per market. Linked from the get_prediction_markets tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: PREDICTION_MARKETS_APP_HTML
  },
  {
    uri: FORECASTS_UI_URI,
    name: "Forecasts (interactive)",
    description: "Interactive in-conversation app shell for get_forecast_predictions: renders WorldMonitor's AI-generated geopolitical and economic forecasts as probability cards (title, domain, region). Linked from the get_forecast_predictions tool via _meta.ui.resourceUri; an MCP-Apps host renders it inline and streams the tool result in via postMessage. Static, data-free template \u2014 public and quota-exempt.",
    mimeType: UI_RESOURCE_MIME_TYPE2,
    _meta: buildUiMeta(),
    html: FORECASTS_APP_HTML
  }
];
var UI_RESOURCE_BY_URI = new Map(UI_RESOURCE_REGISTRY.map((r) => [r.uri, r]));
var UI_RESOURCE_LIST_RESPONSE = UI_RESOURCE_REGISTRY.map((r) => ({
  uri: r.uri,
  name: r.name,
  description: r.description,
  mimeType: r.mimeType,
  _meta: r._meta
}));

// api/mcp/registry/cache-tools.ts
var IRAN_EVENTS_ENABLED = (process.env.IRAN_EVENTS_ENABLED ?? "false").toLowerCase() === "true";
var CACHE_TOOLS = [
  {
    name: "get_market_data",
    _outputBudgetBytes: 131072,
    description: "Real-time equity quotes, commodity prices (including gold futures GC=F), crypto prices, forex FX rates (USD/EUR, USD/JPY etc.), sector performance, ETF flows, and Gulf market quotes from WorldMonitor's curated bootstrap cache.",
    inputSchema: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: 'Tickers to keep, e.g. ["AAPL","GC=F","BTC"]. Case-insensitive; matches equity/commodity/crypto/gulf quotes, sector ETFs, and ETF-flow tickers. Omit for the full snapshot.'
        },
        asset_class: {
          type: "array",
          items: { type: "string", enum: ["equity", "commodity", "crypto", "sectors", "etf", "gulf", "sentiment"] },
          description: "Restrict the response to one or more asset classes. Omit for all."
        },
        limit: { type: "number", description: "Cap each per-class quote list (stocks/commodities/crypto/gulf/sectors/ETF flows) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "stocks-bootstrap": {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } },
          finnhubSkipped: { type: "boolean" },
          skipReason: { type: "string" },
          rateLimited: { type: "boolean" }
        }
      },
      "commodities-bootstrap": {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } }
        }
      },
      crypto: {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } }
        }
      },
      sectors: {
        type: ["object", "null"],
        properties: {
          sectors: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, name: { type: "string" }, changePercent: { type: "number" } } } },
          valuations: { type: ["object", "array", "null"] }
        }
      },
      "etf-flows": {
        type: ["object", "null"],
        properties: {
          timestamp: { type: ["string", "number", "null"] },
          summary: { type: ["object", "null"] },
          etfs: { type: "array", items: { type: "object", properties: { ticker: { type: "string" }, flow: { type: "number" } } } },
          rateLimited: { type: "boolean" }
        }
      },
      "gulf-quotes": {
        type: ["object", "null"],
        properties: {
          quotes: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "number" }, changePercent: { type: "number" } } } },
          rateLimited: { type: "boolean" }
        }
      },
      "fear-greed": {
        type: ["object", "null"],
        properties: {
          timestamp: { type: ["string", "number", "null"] },
          composite: { type: ["object", "number", "null"], properties: {
            score: { type: "number" },
            label: { type: "string" },
            previous: { type: ["number", "null"] }
          } },
          categories: { type: ["object", "array", "null"] },
          headerMetrics: { type: ["object", "array", "null"] },
          sectorPerformance: { type: ["object", "array", "null"] },
          unavailable: { type: "boolean" }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const symbols = argStrList(params.symbols);
      if (symbols.length > 0) {
        for (const label of ["stocks-bootstrap", "commodities-bootstrap", "crypto", "gulf-quotes"]) {
          narrowNested(data, label, "quotes", (q) => matchesCode(q.symbol, symbols));
        }
        narrowNested(data, "sectors", "sectors", (s) => matchesCode(s.symbol, symbols));
        narrowNested(data, "etf-flows", "etfs", (e) => matchesCode(e.ticker, symbols));
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      for (const label of ["stocks-bootstrap", "commodities-bootstrap", "crypto", "gulf-quotes"]) {
        capNested(data, label, "quotes", limit);
      }
      capNested(data, "sectors", "sectors", limit);
      capNested(data, "etf-flows", "etfs", limit);
      const cls = argStrList(params.asset_class);
      if (cls.length > 0) {
        const map = {
          equity: "stocks-bootstrap",
          commodity: "commodities-bootstrap",
          crypto: "crypto",
          sectors: "sectors",
          etf: "etf-flows",
          gulf: "gulf-quotes",
          sentiment: "fear-greed"
        };
        return selectDatasets(data, compact(cls.map((c) => map[c])));
      }
      return data;
    },
    // MCP Apps (`io.modelcontextprotocol/ui`): links the tool to its interactive
    // ui:// app shell. Single source of truth — registered in ../ui/registry.ts.
    _uiResourceUri: MARKET_RADAR_UI_URI,
    _cacheKeys: [
      "market:stocks-bootstrap:v1",
      "market:commodities-bootstrap:v1",
      "market:crypto:v1",
      "market:sectors:v2",
      "market:etf-flows:v1",
      "market:gulf-quotes:v1",
      "market:fear-greed:v1"
    ],
    _seedMetaKey: "seed-meta:market:stocks",
    _maxStaleMin: 30,
    // NOTE: `GET /api/market/v1/get-gold-intelligence` is NOT covered here.
    // The audit-time cross-reference matched on the single `market:commodities-bootstrap:v1`
    // key shared between this tool and the gold-intel handler, but the handler also reads 4
    // gold-specific keys (COT, gold-extended, gold-ETF-flows, gold-CB-reserves) that this
    // tool's `_cacheKeys` does NOT expose. Excluded as `deferred-to-future-tool` in
    // tests/mcp-api-parity.test.mjs until a future commodities-expansion tool bundles those.
    _apiPaths: [
      "GET /api/market/v1/get-fear-greed-index",
      "GET /api/market/v1/get-sector-summary",
      "GET /api/market/v1/list-commodity-quotes",
      "GET /api/market/v1/list-crypto-quotes",
      "GET /api/market/v1/list-etf-flows",
      "GET /api/market/v1/list-gulf-quotes",
      "GET /api/market/v1/list-market-quotes"
    ]
  },
  {
    name: "get_conflict_events",
    _uiResourceUri: CONFLICT_EVENTS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "Active armed conflict events (UCDP, Iran), unrest events with geo-coordinates, and country risk scores. Covers ongoing conflicts, protests, and instability indices worldwide.",
    inputSchema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Filter to one country \u2014 matches the country name on conflict/unrest events and the ISO 3166-1 alpha-2 region code on risk scores (case-insensitive)."
        },
        min_fatalities: {
          type: "number",
          description: "Drop events below this fatality count (UCDP deathsBest / unrest fatalities)."
        },
        limit: { type: "number", description: "Cap each event list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "ucdp-events": {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            dateStart: { type: ["number", "string"] },
            dateEnd: { type: ["number", "string"] },
            location: { type: "object", properties: { latitude: { type: "number" }, longitude: { type: "number" } } },
            country: { type: "string" },
            sideA: { type: "string" },
            sideB: { type: "string" },
            deathsBest: { type: "number" },
            deathsLow: { type: "number" },
            deathsHigh: { type: "number" },
            violenceType: { type: "string" },
            sourceOriginal: { type: "string" }
          } } },
          fetchedAt: { type: ["number", "string"] },
          version: { type: ["string", "number"] },
          totalRaw: { type: "number" },
          filteredCount: { type: "number" }
        }
      },
      "iran-events": {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            country: { type: "string" },
            location: { type: "object", properties: { latitude: { type: "number" }, longitude: { type: "number" } } }
          } } },
          scrapedAt: { type: ["number", "string"] }
        }
      },
      events: {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            country: { type: "string" },
            fatalities: { type: "number" },
            location: { type: "object", properties: { latitude: { type: "number" }, longitude: { type: "number" } } }
          } } },
          clusters: { type: ["array", "object", "null"] }
        }
      },
      scores: {
        type: ["object", "null"],
        properties: {
          ciiScores: { type: "array", items: { type: "object", properties: { region: { type: "string" }, score: { type: "number" } } } },
          strategicRisks: { type: ["array", "object", "null"] }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      const minFatal = argNum(params.min_fatalities);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (country) {
        narrowNested(data, "ucdp-events", "events", (e) => ciIncludes(e.country, country));
        narrowNested(data, "events", "events", (e) => ciIncludes(e.country, country));
        narrowNested(data, "scores", "ciiScores", (s) => matchesCode(s.region, [country]));
      }
      if (minFatal != null) {
        narrowNested(data, "ucdp-events", "events", (e) => (argNum(e.deathsBest) ?? 0) >= minFatal);
        narrowNested(data, "events", "events", (e) => (argNum(e.fatalities) ?? 0) >= minFatal);
      }
      for (const label of ["ucdp-events", "iran-events", "events"]) capNested(data, label, "events", limit);
      return data;
    },
    _cacheKeys: [
      "conflict:ucdp-events:v1",
      ...IRAN_EVENTS_ENABLED ? ["conflict:iran-events:v1"] : [],
      "unrest:events:v1",
      CII_RISK_SCORE_CACHE_KEYS.stale
    ],
    _seedMetaKey: "seed-meta:conflict:ucdp-events",
    _maxStaleMin: 30,
    // NOTE: `GET /api/intelligence/v1/get-risk-scores` is NOT covered here.
    // The audit-time hint matched only this tool's conflict/risk cache keys,
    // but the handler at server/worldmonitor/intelligence/v1/get-risk-scores.ts
    // reads a broader cross-domain set (infra outages, climate anomalies,
    // cyber threats, wildfires, GPS jamming, OREF history, security
    // advisories, displacement, news insights, news threats, aviation,
    // earthquakes, sanctions, temporal anomalies, and military CII). Excluded
    // as `deferred-to-future-tool` -
    // belongs in a future expanded_risk_scores composite tool, not here.
    _apiPaths: [
      "GET /api/conflict/v1/list-iran-events",
      "GET /api/conflict/v1/list-ucdp-events",
      "GET /api/unrest/v1/list-unrest-events"
    ]
  },
  {
    name: "get_aviation_status",
    _outputBudgetBytes: 131072,
    description: "Airport delays, NOTAM airspace closures, and tracked military aircraft. Covers FAA delay data and active airspace restrictions.",
    inputSchema: {
      type: "object",
      properties: {
        disrupted_only: {
          type: "boolean",
          description: 'Drop airports with severity "normal" \u2014 keep only airports actually experiencing delays/closures. The bootstrap lists every monitored airport, so most rows are non-events without this.'
        },
        country: { type: "string", description: 'Filter to one country by name (case-insensitive substring, e.g. "united states").' },
        iata: { type: "string", description: 'Filter to a single airport by IATA code (e.g. "JFK").' },
        limit: { type: "number", description: "Cap the alert list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "delays-bootstrap": {
        type: ["object", "null"],
        properties: {
          alerts: { type: "array", items: { type: "object", properties: {
            iata: { type: "string" },
            country: { type: "string" },
            severity: { type: "string" },
            name: { type: "string" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      const iata = argStr(params.iata);
      if (argBool(params.disrupted_only)) {
        narrowNested(data, "delays-bootstrap", "alerts", (a) => argStr(a.severity) !== "normal");
      }
      if (country) narrowNested(data, "delays-bootstrap", "alerts", (a) => ciIncludes(a.country, country));
      if (iata) narrowNested(data, "delays-bootstrap", "alerts", (a) => argStr(a.iata) === iata);
      capNested(data, "delays-bootstrap", "alerts", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["aviation:delays-bootstrap:v2"],
    _seedMetaKey: "seed-meta:aviation:faa",
    _maxStaleMin: 90,
    _apiPaths: []
  },
  {
    name: "get_news_intelligence",
    _uiResourceUri: NEWS_INTELLIGENCE_UI_URI,
    _outputBudgetBytes: 131072,
    description: "AI-classified geopolitical threat news summaries, GDELT intelligence signals, cross-source signals, and security advisories from WorldMonitor's intelligence layer.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["conflict", "economy", "cyber", "nuclear", "intelligence", "maritime"],
          description: "Filter GDELT intelligence to a single topic."
        },
        category: { type: "string", description: 'Filter top news stories to one category (e.g. "conflict", "economy"; fallback is "general").' },
        country: { type: "string", description: "Filter top stories and travel advisories to one ISO 3166-1 alpha-2 country code (case-insensitive)." },
        alerts_only: { type: "boolean", description: "Keep only top stories flagged as alerts." },
        limit: { type: "number", description: "Cap each list (top stories, signals, advisories) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      insights: {
        type: ["object", "null"],
        properties: {
          topStories: { type: "array", items: { type: "object", properties: {
            primaryTitle: { type: "string" },
            primarySource: { type: "string" },
            primaryLink: { type: "string" },
            pubDate: { type: "string" },
            sourceCount: { type: "number" },
            importanceScore: { type: "number" },
            velocity: { type: "object", properties: {
              level: { type: "string" },
              sourcesPerHour: { type: "number" }
            } },
            category: { type: "string" },
            threatLevel: { type: "string" },
            countryCode: { type: ["string", "null"] },
            isAlert: { type: "boolean" }
          } } }
        }
      },
      "gdelt-intel": {
        type: ["object", "null"],
        properties: {
          topics: { type: "array", items: { type: "object", properties: { id: { type: "string" }, signals: { type: ["array", "object"] } } } }
        }
      },
      "cross-source-signals": {
        type: ["object", "null"],
        properties: { signals: { type: "array", items: { type: "object" } } }
      },
      "advisories-bootstrap": {
        type: ["object", "null"],
        properties: {
          advisories: { type: "array", items: { type: "object", properties: { country: { type: "string" }, level: { type: ["string", "number"] } } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const topic = argStr(params.topic);
      const category = argStr(params.category);
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (topic) narrowNested(data, "gdelt-intel", "topics", (t) => argStr(t.id) === topic);
      if (category) narrowNested(data, "insights", "topStories", (s) => argStr(s.category) === category);
      if (countries.length > 0) {
        narrowNested(data, "insights", "topStories", (s) => matchesCode(s.countryCode, countries));
        narrowNested(data, "advisories-bootstrap", "advisories", (a) => matchesCode(a.country, countries));
      }
      if (argBool(params.alerts_only)) narrowNested(data, "insights", "topStories", (s) => s.isAlert === true);
      capNested(data, "insights", "topStories", limit);
      capNested(data, "cross-source-signals", "signals", limit);
      capNested(data, "advisories-bootstrap", "advisories", limit);
      return data;
    },
    _cacheKeys: [
      "news:insights:v1",
      "intelligence:gdelt-intel:v1",
      "intelligence:cross-source-signals:v1",
      "intelligence:advisories-bootstrap:v1"
    ],
    _seedMetaKey: "seed-meta:news:insights",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/intelligence/v1/list-cross-source-signals",
      "GET /api/intelligence/v1/search-gdelt-documents"
    ]
  },
  {
    name: "get_natural_disasters",
    _uiResourceUri: NATURAL_DISASTERS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "Recent earthquakes (USGS), active wildfires (NASA FIRMS), and natural hazard events. Includes magnitude, location, and threat severity.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: { type: "string", enum: ["earthquakes", "wildfires", "other"] },
          description: "Restrict to one or more hazard datasets (earthquakes / wildfires / other natural events). Omit for all."
        },
        min_magnitude: { type: "number", description: "Drop earthquakes and natural events below this magnitude." },
        active_only: { type: "boolean", description: "Keep only natural events that are still active (not closed)." },
        limit: { type: "number", description: "Cap each hazard list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      earthquakes: {
        type: ["object", "null"],
        properties: {
          earthquakes: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            place: { type: "string" },
            magnitude: { type: "number" },
            depthKm: { type: "number" },
            occurredAt: { type: "number" },
            sourceUrl: { type: "string" },
            location: { type: "object", properties: {
              latitude: { type: "number" },
              longitude: { type: "number" }
            } },
            nearTestSite: { type: "boolean" },
            testSiteName: { type: "string" },
            concernScore: { type: "number" },
            concernLevel: { type: "string" }
          } } }
        }
      },
      fires: {
        type: ["object", "null"],
        properties: {
          fireDetections: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            location: { type: "object", properties: {
              latitude: { type: "number" },
              longitude: { type: "number" }
            } },
            brightness: { type: "number" },
            frp: { type: "number" },
            confidence: { type: "string", enum: [
              "FIRE_CONFIDENCE_HIGH",
              "FIRE_CONFIDENCE_NOMINAL",
              "FIRE_CONFIDENCE_LOW",
              "FIRE_CONFIDENCE_UNSPECIFIED"
            ] },
            satellite: { type: "string" },
            detectedAt: { type: "number" },
            region: { type: "string" },
            dayNight: { type: "string" },
            possibleExplosion: { type: "boolean" }
          } } }
        }
      },
      events: {
        type: ["object", "null"],
        properties: {
          events: { type: "array", items: { type: "object", properties: {
            magnitude: { type: ["number", "null"] },
            closed: { type: "boolean" },
            country: { type: "string" },
            type: { type: "string" },
            title: { type: "string" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const minMag = argNum(params.min_magnitude);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (minMag != null) {
        narrowNested(data, "earthquakes", "earthquakes", (q) => (argNum(q.magnitude) ?? 0) >= minMag);
        narrowNested(data, "events", "events", (e) => (argNum(e.magnitude) ?? 0) >= minMag);
      }
      if (argBool(params.active_only)) narrowNested(data, "events", "events", (e) => e.closed === false);
      capNested(data, "earthquakes", "earthquakes", limit);
      capNested(data, "fires", "fireDetections", limit);
      capNested(data, "events", "events", limit);
      const ds = argStrList(params.dataset);
      if (ds.length > 0) {
        const map = { earthquakes: "earthquakes", wildfires: "fires", other: "events" };
        return selectDatasets(data, compact(ds.map((d) => map[d])));
      }
      return data;
    },
    _cacheKeys: [
      "seismology:earthquakes:v1",
      "wildfire:fires:v1",
      "natural:events:v1"
    ],
    _seedMetaKey: "seed-meta:seismology:earthquakes",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/natural/v1/list-natural-events",
      "GET /api/seismology/v1/list-earthquakes",
      "GET /api/wildfire/v1/list-fire-detections"
    ]
  },
  {
    name: "get_military_posture",
    _outputBudgetBytes: 131072,
    description: "Theater posture assessment and military risk scores. Reflects aggregated military positioning and escalation signals across global theaters.",
    inputSchema: {
      type: "object",
      properties: {
        theater: { type: "string", description: 'Filter to one theater by id (case-insensitive substring, e.g. "iran", "taiwan", "baltic", "korea").' },
        posture_level: { type: "string", description: "Filter to a single posture level." },
        limit: { type: "number", description: "Cap the theaters list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      theater_posture: {
        type: ["object", "null"],
        properties: {
          theaters: { type: "array", items: { type: "object", properties: {
            theater: { type: "string" },
            postureLevel: { type: "string" },
            summary: { type: "string" },
            signals: { type: ["array", "object", "null"] }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const theater = argStr(params.theater);
      const level = argStr(params.posture_level);
      if (theater) narrowNested(data, "theater_posture", "theaters", (t) => ciIncludes(t.theater, theater));
      if (level) narrowNested(data, "theater_posture", "theaters", (t) => argStr(t.postureLevel) === level);
      capNested(data, "theater_posture", "theaters", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["theater_posture:sebuf:stale:v1"],
    _seedMetaKey: "seed-meta:intelligence:risk-scores",
    _maxStaleMin: 120,
    // CASCADE-MIRROR EQUIVALENCE: the API handler at
    // server/worldmonitor/military/v1/get-theater-posture.ts:23 reads 3 cascade
    // variants (live + stale + backup) and returns the freshest available.
    // This MCP tool reads only the stale variant; PR #3658's U7 already
    // documents `theater-posture:sebuf:v1` and `theater-posture:sebuf:backup:v1`
    // as `cascade-mirror: covered by get_military_posture` exclusions in the
    // bootstrap-parity test — they share the same payload shape, only freshness
    // differs. Coverage is intentional. The audit script's partial-overlap
    // warning for this op is suppressed via CASCADE_MIRROR_EXEMPT in
    // scripts/audit-mcp-api-coverage.mjs.
    _apiPaths: [
      "GET /api/military/v1/get-theater-posture"
    ]
  },
  {
    name: "get_cyber_threats",
    _outputBudgetBytes: 131072,
    description: "Active cyber threat intelligence: malware IOCs (URLhaus, Feodotracker), CISA known exploited vulnerabilities, and active command-and-control infrastructure.",
    inputSchema: {
      type: "object",
      properties: {
        threat_type: { type: "string", description: 'Filter to one threat type (case-insensitive substring, e.g. "malware", "vulnerability", "c2").' },
        min_severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Drop threats below this severity level."
        },
        country: { type: "string", description: "Filter to one ISO 3166-1 alpha-2 country code (many threats have no country and are dropped by this filter)." },
        limit: { type: "number", description: "Cap the threat list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "threats-bootstrap": {
        type: ["object", "null"],
        properties: {
          threats: { type: "array", items: { type: "object", properties: {
            type: { type: "string" },
            severity: { type: "string" },
            country: { type: "string" },
            indicator: { type: "string" },
            description: { type: "string" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const type = argStr(params.threat_type);
      const countries = argStrList(params.country);
      const minSev = argStr(params.min_severity).replace("criticality_level_", "");
      const ranks = { low: 1, medium: 2, high: 3, critical: 4 };
      const minRank = ranks[minSev];
      if (type) narrowNested(data, "threats-bootstrap", "threats", (t) => ciIncludes(t.type, type));
      if (countries.length > 0) {
        narrowNested(data, "threats-bootstrap", "threats", (t) => matchesCode(t.country, countries));
      }
      if (minRank != null) {
        narrowNested(data, "threats-bootstrap", "threats", (t) => {
          const tok = argStr(t.severity).replace("criticality_level_", "");
          const r = ranks[tok];
          return r == null || r >= minRank;
        });
      }
      capNested(data, "threats-bootstrap", "threats", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["cyber:threats-bootstrap:v2"],
    _seedMetaKey: "seed-meta:cyber:threats",
    _maxStaleMin: 240,
    _apiPaths: []
  },
  {
    name: "get_economic_data",
    _outputBudgetBytes: 131072,
    description: "Macro economic indicators: Fed Funds rate (FRED), economic calendar events, the normalized China macro snapshot plus official NBS/PBoC release calendar, fuel prices, ECB FX rates, EU yield curve, earnings calendar, COT positioning, energy storage data, BIS household debt service ratio (DSR, quarterly, leading indicator of household financial stress across ~40 advanced economies), and BIS residential + commercial property price indices (real, quarterly).",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["fedfunds", "econ-calendar", "china-macro", "china-release-calendar", "fuel-prices", "ecb-fx-rates", "yield-curve-eu", "spending", "earnings-calendar", "cot", "dsr", "property-residential", "property-commercial"]
          },
          description: "Restrict the response to one or more sub-datasets. Omit for the full economic bundle."
        },
        country: {
          type: "string",
          description: "Filter the country-keyed datasets (fuel-prices, BIS DSR/property, economic calendar) to one ISO 3166-1 alpha-2 code."
        },
        limit: { type: "number", description: "Cap each list dataset (calendar, spending, earnings) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // FRED key is `economic:fred:v1:FEDFUNDS:0` — the label-walk skips the
    // `0` suffix (NON_LABEL regex matches bare digits) and the `v1` segment,
    // landing on `FEDFUNDS`.
    outputSchema: cacheEnvelope({
      FEDFUNDS: { type: ["object", "array", "null"] },
      "econ-calendar": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          country: { type: "string" },
          event: { type: "string" },
          time: { type: ["string", "number"] }
        } } } }
      },
      "china-macro": {
        type: ["object", "null"],
        properties: {
          countryCode: { type: "string" },
          launchReady: { type: "boolean" },
          status: { type: "string" },
          indicators: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            label: { type: "string" },
            category: { type: "string" },
            value: { type: ["number", "null"] },
            priorValue: { type: ["number", "null"] },
            unit: { type: "string" },
            observationDate: { type: "string" },
            source: { type: "string" },
            stale: { type: "boolean" },
            unavailableReason: { type: "string" }
          } } }
        }
      },
      "china-release-calendar": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          event: { type: "string" },
          countryCode: { type: "string" },
          releaseDate: { type: "string" },
          status: { type: "string" },
          source: { type: "string" }
        } } } }
      },
      "fuel-prices": {
        type: ["object", "null"],
        properties: { countries: { type: "array", items: { type: "object", properties: { code: { type: "string" }, price: { type: "number" }, currency: { type: "string" } } } } }
      },
      "ecb-fx-rates": { type: ["object", "null"] },
      "yield-curve-eu": { type: ["object", "null"] },
      spending: {
        type: ["object", "null"],
        properties: { awards: { type: "array", items: { type: "object" } } }
      },
      "earnings-calendar": {
        type: ["object", "null"],
        properties: { earnings: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, date: { type: "string" } } } } }
      },
      cot: { type: ["object", "null"] },
      dsr: {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: { countryCode: { type: "string" }, value: { type: "number" } } } } }
      },
      "property-residential": {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: { countryCode: { type: "string" }, value: { type: "number" } } } } }
      },
      "property-commercial": {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: { countryCode: { type: "string" }, value: { type: "number" } } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "fuel-prices", "countries", (c) => matchesCode(c.code, countries));
        narrowNested(data, "econ-calendar", "events", (e) => matchesCode(e.country, countries));
        narrowNested(data, "china-release-calendar", "events", (e) => matchesCode(e.countryCode, countries));
        if (!countries.some((code) => code.toUpperCase() === "CN")) data["china-macro"] = null;
        for (const label of ["dsr", "property-residential", "property-commercial"]) {
          narrowNested(data, label, "entries", (e) => matchesCode(e.countryCode, countries));
        }
      }
      capNested(data, "econ-calendar", "events", limit);
      capNested(data, "china-release-calendar", "events", limit);
      capNested(data, "spending", "awards", limit);
      capNested(data, "earnings-calendar", "earnings", limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    _cacheKeys: [
      "economic:fred:v1:FEDFUNDS:0",
      "economic:econ-calendar:v1",
      "economic:china:macro:v1",
      "economic:china:release-calendar:v1",
      "economic:fuel-prices:v1",
      "economic:ecb-fx-rates:v1",
      "economic:yield-curve-eu:v1",
      "economic:spending:v1",
      "market:earnings-calendar:v1",
      "market:cot:v1",
      "economic:bis:dsr:v1",
      "economic:bis:property-residential:v1",
      "economic:bis:property-commercial:v1"
    ],
    _seedMetaKey: "seed-meta:economic:econ-calendar",
    _maxStaleMin: 1440,
    _freshnessChecks: [
      { key: "seed-meta:economic:econ-calendar", maxStaleMin: 1440 },
      { key: "seed-meta:economic:china-macro", maxStaleMin: 4320 },
      { key: "seed-meta:economic:china-release-calendar", maxStaleMin: 4320 },
      // Per-dataset BIS seed-meta keys — the aggregate
      // `seed-meta:economic:bis-extended` would report "fresh" even if only
      // one of the three datasets (DSR / SPP / CPP) is current, matching the
      // false-freshness bug already fixed for /api/health and resilience.
      { key: "seed-meta:economic:bis-dsr", maxStaleMin: 1440 },
      // 12h cron × 2
      { key: "seed-meta:economic:bis-property-residential", maxStaleMin: 1440 },
      { key: "seed-meta:economic:bis-property-commercial", maxStaleMin: 1440 }
    ],
    _apiPaths: [
      "GET /api/economic/v1/get-ecb-fx-rates",
      "GET /api/economic/v1/get-economic-calendar",
      "GET /api/economic/v1/get-china-macro-snapshot",
      "GET /api/economic/v1/get-eu-yield-curve",
      "GET /api/economic/v1/list-fuel-prices",
      "GET /api/market/v1/get-cot-positioning",
      "GET /api/market/v1/list-earnings-calendar"
    ]
  },
  {
    name: "get_country_macro",
    _outputBudgetBytes: 131072,
    description: "Per-country macroeconomic indicators from IMF WEO (~210 countries, monthly cadence). Bundles fiscal/external balance (inflation, current account, gov revenue/expenditure/primary balance, CPI), growth & per-capita (real GDP growth, GDP/capita USD & PPP, savings & investment rates, savings-investment gap), labor & demographics (unemployment, population), and external trade (current account USD, import/export volume % changes). Latest available year per series. Use for country-level economic screening, peer benchmarking, and stagflation/imbalance flags. NOTE: export/import LEVELS in USD (exportsUsd, importsUsd, tradeBalanceUsd) are returned as null \u2014 WEO retracted broad coverage for BX/BM indicators in 2026-04; use currentAccountUsd or volume changes (import/exportVolumePctChg) instead.",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'ISO 3166-1 alpha-2 country codes to keep across all four IMF datasets (e.g. ["US","DE","CN"]). Omit for all ~210 countries.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap each IMF dataset country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // Each IMF label maps to `{ countries: { [iso2]: { ... per-series metrics ... } } }`.
    outputSchema: cacheEnvelope({
      macro: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      growth: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      labor: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      external: { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        for (const label of ["macro", "growth", "labor", "external"]) pickNestedMap(data, label, "countries", codes);
        return data;
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      for (const label of ["macro", "growth", "labor", "external"]) capNestedMap(data, label, "countries", limit);
      return data;
    },
    _cacheKeys: [
      "economic:imf:macro:v2",
      "economic:imf:growth:v1",
      "economic:imf:labor:v1",
      "economic:imf:external:v1"
    ],
    _seedMetaKey: "seed-meta:economic:imf-macro",
    _maxStaleMin: 100800,
    // monthly WEO release; 70d = 2× interval (absorbs one missed run)
    _freshnessChecks: [
      { key: "seed-meta:economic:imf-macro", maxStaleMin: 100800 },
      { key: "seed-meta:economic:imf-growth", maxStaleMin: 100800 },
      { key: "seed-meta:economic:imf-labor", maxStaleMin: 100800 },
      { key: "seed-meta:economic:imf-external", maxStaleMin: 100800 }
    ],
    _apiPaths: []
  },
  {
    name: "get_eu_housing_cycle",
    _outputBudgetBytes: 131072,
    description: "Eurostat annual house price index (prc_hpi_a, base 2015=100) for all 27 EU members plus EA20 and EU27_2020 aggregates. Each country entry includes the latest value, prior value, date, unit, and a 10-year sparkline series. Complements BIS WS_SPP with broader EU coverage for the Housing cycle tile.",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Eurostat geo codes to keep \u2014 ISO 3166-1 alpha-2, but "EL" for Greece, plus aggregates "EA20" and "EU27_2020". Omit for all.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap the country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "house-prices": {
        type: ["object", "null"],
        properties: { countries: { type: "object", additionalProperties: { type: "object", properties: {
          latest: { type: ["number", "null"] },
          prior: { type: ["number", "null"] },
          date: { type: "string" },
          unit: { type: "string" },
          series: { type: "array", items: { type: "object" } }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        pickNestedMap(data, "house-prices", "countries", codes);
        return data;
      }
      capNestedMap(data, "house-prices", "countries", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["economic:eurostat:house-prices:v1"],
    _seedMetaKey: "seed-meta:economic:eurostat-house-prices",
    _maxStaleMin: 60 * 24 * 50,
    // weekly cron, annual data
    _apiPaths: []
  },
  {
    name: "get_eu_quarterly_gov_debt",
    _outputBudgetBytes: 131072,
    description: "Eurostat quarterly general government gross debt (gov_10q_ggdebt, %GDP) for all 27 EU members plus EA20 and EU27_2020 aggregates. Each country entry includes latest value, prior value, quarter label, and an 8-quarter sparkline series. Provides fresher debt-trajectory signal than annual IMF GGXWDG_NGDP for EU panels.",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Eurostat geo codes to keep \u2014 ISO 3166-1 alpha-2, but "EL" for Greece, plus aggregates "EA20" and "EU27_2020". Omit for all.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap the country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "gov-debt-q": {
        type: ["object", "null"],
        properties: { countries: { type: "object", additionalProperties: { type: "object", properties: {
          latest: { type: ["number", "null"] },
          prior: { type: ["number", "null"] },
          quarter: { type: "string" },
          series: { type: "array", items: { type: "object" } }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        pickNestedMap(data, "gov-debt-q", "countries", codes);
        return data;
      }
      capNestedMap(data, "gov-debt-q", "countries", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["economic:eurostat:gov-debt-q:v1"],
    _seedMetaKey: "seed-meta:economic:eurostat-gov-debt-q",
    _maxStaleMin: 60 * 24 * 14,
    // quarterly data, 2-day cron
    _apiPaths: []
  },
  {
    name: "get_eu_industrial_production",
    _outputBudgetBytes: 131072,
    description: 'Eurostat monthly industrial production index (sts_inpr_m, NACE B-D industry excl. construction, SCA, base 2021=100) for all 27 EU members plus EA20 and EU27_2020 aggregates. Each country entry includes latest value, prior value, month label, and a 12-month sparkline series. Leading indicator of real-economy activity used by the "Real economy pulse" sparkline.',
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Eurostat geo codes to keep \u2014 ISO 3166-1 alpha-2, but "EL" for Greece, plus aggregates "EA20" and "EU27_2020". Omit for all.'
        },
        limit: { type: "integer", minimum: 0, description: "Cap the country map to at most this many entries when no countries filter is supplied (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "industrial-production": {
        type: ["object", "null"],
        properties: { countries: { type: "object", additionalProperties: { type: "object", properties: {
          latest: { type: ["number", "null"] },
          prior: { type: ["number", "null"] },
          month: { type: "string" },
          series: { type: "array", items: { type: "object" } }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      if (codes.length > 0) {
        pickNestedMap(data, "industrial-production", "countries", codes);
        return data;
      }
      capNestedMap(data, "industrial-production", "countries", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["economic:eurostat:industrial-production:v1"],
    _seedMetaKey: "seed-meta:economic:eurostat-industrial-production",
    _maxStaleMin: 60 * 24 * 5,
    // monthly data, daily cron
    _apiPaths: []
  },
  {
    name: "get_prediction_markets",
    _uiResourceUri: PREDICTION_MARKETS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "Active Polymarket event contracts with current probabilities. Covers geopolitical, economic, and election prediction markets.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["geopolitical", "tech", "finance"],
          description: "Restrict to one market category bucket. Omit for all three."
        },
        query: { type: "string", description: "Keep only markets whose title contains this text (case-insensitive)." },
        source: { type: "string", enum: ["kalshi", "polymarket"], description: "Filter to one prediction-market source." },
        limit: { type: "number", description: "Cap each category bucket to at most this many markets (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "markets-bootstrap": {
        type: ["object", "null"],
        properties: {
          geopolitical: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            yesPrice: { type: "number", minimum: 0, maximum: 100 },
            source: { type: "string" },
            volume: { type: "number" },
            url: { type: "string" },
            endDate: { type: "string" },
            regions: { type: "array", items: { type: "string" } }
          } } },
          tech: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            yesPrice: { type: "number", minimum: 0, maximum: 100 },
            source: { type: "string" },
            volume: { type: "number" },
            url: { type: "string" },
            endDate: { type: "string" },
            regions: { type: "array", items: { type: "string" } }
          } } },
          finance: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            yesPrice: { type: "number", minimum: 0, maximum: 100 },
            source: { type: "string" },
            volume: { type: "number" },
            url: { type: "string" },
            endDate: { type: "string" },
            regions: { type: "array", items: { type: "string" } }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const category = argStr(params.category);
      const query = argStr(params.query);
      const source = argStr(params.source);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      const buckets = ["geopolitical", "tech", "finance"];
      for (const b of buckets) {
        if (query) narrowNested(data, "markets-bootstrap", b, (m) => ciIncludes(m.title, query));
        if (source) narrowNested(data, "markets-bootstrap", b, (m) => argStr(m.source) === source);
        capNested(data, "markets-bootstrap", b, limit);
      }
      if (category && buckets.includes(category)) {
        const node = data["markets-bootstrap"];
        if (node && typeof node === "object" && !Array.isArray(node)) {
          const n = node;
          for (const b of buckets) if (b !== category) n[b] = [];
        }
      }
      return data;
    },
    _cacheKeys: ["prediction:markets-bootstrap:v1"],
    _seedMetaKey: "seed-meta:prediction:markets",
    _maxStaleMin: 90,
    _apiPaths: [
      "GET /api/prediction/v1/list-prediction-markets"
    ]
  },
  {
    name: "get_sanctions_data",
    _outputBudgetBytes: 131072,
    description: "OFAC SDN sanctioned entities list and sanctions pressure scores by country. Useful for compliance screening and geopolitical pressure analysis.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Filter sanctioned entities and pressure scores to one ISO 3166-1 alpha-2 country code." },
        entity_type: { type: "string", description: 'Filter to one entity type (case-insensitive substring, e.g. "vessel", "aircraft", "person", "entity").' },
        query: { type: "string", description: "Keep only sanctioned entities whose name contains this text (case-insensitive)." },
        limit: { type: "number", description: "Cap the entity list and recent pressure entries to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // `_postFilter` calls `narrowArray(data, 'entities', ...)` on the
    // entities slot, so that label's value is itself an array (not an object
    // with a child array). The pressure label is the usual `{entries, countries}` shape.
    outputSchema: cacheEnvelope({
      entities: {
        type: ["array", "object", "null"],
        items: { type: "object", properties: {
          name: { type: "string" },
          cc: { type: "string" },
          et: { type: "string" },
          addr: { type: "string" }
        } }
      },
      pressure: {
        type: ["object", "null"],
        properties: {
          entries: { type: "array", items: { type: "object", properties: {
            countryCodes: { type: ["array", "string"] },
            entityType: { type: "string" }
          } } },
          countries: { type: "array", items: { type: "object", properties: {
            countryCode: { type: "string" },
            pressureScore: { type: "number" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const etype = argStr(params.entity_type);
      const query = argStr(params.query);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowArray(data, "entities", (e) => matchesCode(e.cc, countries));
        narrowNested(data, "pressure", "entries", (e) => matchesCode(e.countryCodes, countries));
        narrowNested(data, "pressure", "countries", (c) => matchesCode(c.countryCode, countries));
      }
      if (etype) {
        narrowArray(data, "entities", (e) => ciIncludes(e.et, etype));
        narrowNested(data, "pressure", "entries", (e) => ciIncludes(e.entityType, etype));
      }
      if (query) narrowArray(data, "entities", (e) => ciIncludes(e.name, query));
      capArrays(data, limit);
      capNested(data, "pressure", "entries", limit);
      return data;
    },
    _cacheKeys: ["sanctions:entities:v1", "sanctions:pressure:v1"],
    _seedMetaKey: "seed-meta:sanctions:entities",
    _maxStaleMin: 1440,
    _apiPaths: [
      "GET /api/sanctions/v1/list-sanctions-pressure",
      "GET /api/sanctions/v1/lookup-sanction-entity"
    ]
  },
  {
    name: "get_displacement_data",
    _outputBudgetBytes: 131072,
    description: "Refugee and IDP counts by country (UNHCR annual data).",
    inputSchema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'ISO 3166-1 alpha-3 country codes to keep (e.g. ["SYR","UKR","AFG"]). Matches both per-country totals and origin/asylum flows. Omit for all.'
        },
        limit: { type: "number", description: "Cap the per-country and top-flow lists to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      summary: {
        type: ["object", "null"],
        properties: {
          countries: { type: "array", items: { type: "object", properties: {
            code: { type: "string" },
            total: { type: ["number", "null"] },
            year: { type: ["number", "string"] }
          } } },
          topFlows: { type: "array", items: { type: "object", properties: {
            originCode: { type: "string" },
            asylumCode: { type: "string" },
            value: { type: ["number", "null"] }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const codes = argStrList(params.countries);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (codes.length > 0) {
        narrowNested(data, "summary", "countries", (c) => matchesCode(c.code, codes));
        narrowNested(data, "summary", "topFlows", (f) => matchesCode(f.originCode, codes) || matchesCode(f.asylumCode, codes));
      }
      capNested(data, "summary", "countries", limit);
      capNested(data, "summary", "topFlows", limit);
      return data;
    },
    // Dynamic-year key resolved once at module evaluation — mirrors the
    // STANDALONE_KEYS pattern in api/health.js:147. The UNHCR seeder publishes
    // a single current-year key; the prior year exists at the same prefix but
    // is intentionally excluded — the executeTool label-walk would strip the
    // year segment from both keys and collide on the same `summary` label,
    // causing the second result to overwrite the first.
    _cacheKeys: [`displacement:summary:v1:${(/* @__PURE__ */ new Date()).getUTCFullYear()}`],
    _seedMetaKey: "seed-meta:displacement:summary",
    _maxStaleMin: 3600,
    // Audit miss: handler uses cachedFetchJson with a year-suffixed key the
    // audit's regex couldn't statically resolve. The op IS covered by this
    // tool — same underlying displacement:summary:v1:<year> cache.
    _apiPaths: [
      "GET /api/displacement/v1/get-displacement-summary"
    ]
  },
  {
    name: "get_health_signals",
    _outputBudgetBytes: 131072,
    description: "Active disease outbreaks (WHO/ECDC etc.) and global air-quality station readings (OpenAQ/WAQI PM2.5). For health-risk screening.",
    inputSchema: {
      type: "object",
      properties: {
        signal_type: {
          type: "array",
          items: { type: "string", enum: ["outbreaks", "air-quality"] },
          description: "Restrict to disease outbreaks, air-quality stations, or both. Omit for both."
        },
        country: { type: "string", description: "Filter outbreaks and air-quality stations to one ISO 3166-1 alpha-2 country code." },
        disease: { type: "string", description: "Keep only outbreaks whose disease name contains this text (case-insensitive)." },
        min_aqi: { type: "number", description: "Drop air-quality stations below this AQI value." },
        limit: { type: "number", description: "Cap the outbreak and station lists to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "disease-outbreaks": {
        type: ["object", "null"],
        properties: {
          outbreaks: { type: "array", items: { type: "object", properties: {
            disease: { type: "string" },
            country: { type: "string" },
            countryCode: { type: "string" },
            cases: { type: ["number", "null"] },
            deaths: { type: ["number", "null"] },
            date: { type: "string" }
          } } }
        }
      },
      "air-quality": {
        type: ["object", "null"],
        properties: {
          stations: { type: "array", items: { type: "object", properties: {
            country_code: { type: "string" },
            city: { type: "string" },
            aqi: { type: ["number", "null"] },
            pm25: { type: ["number", "null"] },
            latitude: { type: "number" },
            longitude: { type: "number" }
          } } }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const disease = argStr(params.disease);
      const minAqi = argNum(params.min_aqi);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "disease-outbreaks", "outbreaks", (o) => matchesCode(o.countryCode, countries));
        narrowNested(data, "air-quality", "stations", (s) => matchesCode(s.country_code, countries));
      }
      if (disease) narrowNested(data, "disease-outbreaks", "outbreaks", (o) => ciIncludes(o.disease, disease));
      if (minAqi != null) narrowNested(data, "air-quality", "stations", (s) => (argNum(s.aqi) ?? 0) >= minAqi);
      capNested(data, "disease-outbreaks", "outbreaks", limit);
      capNested(data, "air-quality", "stations", limit);
      const st = argStrList(params.signal_type);
      if (st.length > 0) {
        const map = { outbreaks: "disease-outbreaks", "air-quality": "air-quality" };
        return selectDatasets(data, compact(st.map((s) => map[s])));
      }
      return data;
    },
    // Uses the health-domain canonical key health:air-quality:v1 (NOT the
    // climate-domain mirror climate:air-quality:v1, which stays exclusively
    // in get_climate_data). Both are written by the same seeder
    // (scripts/seed-health-air-quality.mjs exports HEALTH_AIR_QUALITY_KEY +
    // CLIMATE_AIR_QUALITY_KEY) so no duplicate seed work.
    _cacheKeys: ["health:disease-outbreaks:v1", "health:air-quality:v1"],
    _seedMetaKey: "seed-meta:health:disease-outbreaks",
    _maxStaleMin: 2880,
    _freshnessChecks: [
      { key: "seed-meta:health:disease-outbreaks", maxStaleMin: 2880 },
      // daily cron; 48h budget
      { key: "seed-meta:health:air-quality", maxStaleMin: 180 }
      // hourly cron; 3h budget
    ],
    _apiPaths: [
      "GET /api/health/v1/list-air-quality-alerts",
      "GET /api/health/v1/list-disease-outbreaks"
    ]
  },
  {
    name: "get_energy_intelligence",
    _outputBudgetBytes: 131072,
    description: "Energy supply, prices, storage, disruptions, and policy: EIA petroleum stocks, electricity prices (Ember), gas storage (GIE), fuel shortages, fossil & renewable shares, active energy disruptions, government crisis policies.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["eia-petroleum", "electricity", "ember", "gas-storage", "fuel-shortages", "disruptions", "crisis-policies", "fossil-share", "renewable"]
          },
          description: "Restrict the response to one or more energy sub-datasets. Omit for the full bundle."
        },
        country: {
          type: "string",
          description: "Filter the country-keyed datasets (Ember electricity mix, gas storage, fuel shortages, energy disruptions, fossil-share) to one ISO 3166-1 alpha-2 code."
        },
        limit: { type: "number", description: "Cap each list-bearing energy slice (crisis-policies, electricity regions, gas-storage countries, World Bank renewable history/regions) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // Labels derived from each cache key's last informative segment:
    //   energy:eia-petroleum:v1                  -> eia-petroleum
    //   energy:electricity:v1:index              -> index
    //   energy:ember:v1:_all                     -> _all
    //   energy:gas-storage:v1:_countries         -> _countries
    //   energy:fuel-shortages:v1                 -> fuel-shortages
    //   energy:disruptions:v1                    -> disruptions
    //   energy:crisis-policies:v1                -> crisis-policies
    //   resilience:fossil-electricity-share:v1   -> fossil-electricity-share
    //   economic:worldbank-renewable:v1          -> worldbank-renewable
    outputSchema: cacheEnvelope({
      "eia-petroleum": { type: ["object", "null"] },
      index: { type: ["object", "null"], properties: { regions: { type: "array", items: { type: "object" } } } },
      _all: { type: ["object", "null"] },
      _countries: { type: ["array", "object", "null"] },
      "fuel-shortages": { type: ["object", "null"], properties: { shortages: { type: ["object", "array", "null"] } } },
      disruptions: { type: ["object", "null"], properties: { events: { type: ["object", "array", "null"] } } },
      "crisis-policies": { type: ["object", "null"], properties: { policies: { type: "array", items: { type: "object" } } } },
      "fossil-electricity-share": { type: ["object", "null"], properties: { countries: { type: "object", additionalProperties: { type: "object" } } } },
      "worldbank-renewable": { type: ["object", "null"], properties: {
        historicalData: { type: "array", items: { type: "object" } },
        regions: { type: "array", items: { type: "object" } }
      } }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      if (countries.length > 0) {
        data._all = pickMapKeys(data._all, countries);
        pickNestedMap(data, "fossil-electricity-share", "countries", countries);
        narrowArray(data, "_countries", (c) => matchesCode(c, countries) || matchesCode(c?.iso2, countries));
        mapNested(data, "fuel-shortages", "shortages", (m) => filterMapValues(m, (s) => matchesCode(s.country, countries)));
        mapNested(data, "disruptions", "events", (m) => filterMapValues(m, (e) => matchesCode(e.countries, countries)));
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      capNested(data, "crisis-policies", "policies", limit);
      capNested(data, "index", "regions", limit);
      capNested(data, "worldbank-renewable", "historicalData", limit);
      capNested(data, "worldbank-renewable", "regions", limit);
      capArrays(data, limit);
      const ds = argStrList(params.dataset);
      if (ds.length > 0) {
        const map = {
          "eia-petroleum": "eia-petroleum",
          electricity: "index",
          ember: "_all",
          "gas-storage": "_countries",
          "fuel-shortages": "fuel-shortages",
          disruptions: "disruptions",
          "crisis-policies": "crisis-policies",
          "fossil-share": "fossil-electricity-share",
          renewable: "worldbank-renewable"
        };
        return selectDatasets(data, compact(ds.map((d) => map[d])));
      }
      return data;
    },
    // Broad 9-key energy bundle mirroring get_economic_data. Cadences span
    // hourly (electricity prices) to annual (World Bank renewable share); use
    // _freshnessChecks with per-key maxStaleMin pulled from
    // api/health.js::SEED_META so a slow-cadence key doesn't drag the
    // aggregate stale flag unnecessarily.
    _cacheKeys: [
      "energy:eia-petroleum:v1",
      // STANDALONE_KEYS::eiaPetroleum
      "energy:electricity:v1:index",
      // BOOTSTRAP_KEYS::electricityPrices
      "energy:ember:v1:_all",
      // STANDALONE_KEYS::emberElectricity
      "energy:gas-storage:v1:_countries",
      // BOOTSTRAP_KEYS::gasStorageCountries
      "energy:fuel-shortages:v1",
      // STANDALONE_KEYS::fuelShortages
      "energy:disruptions:v1",
      // STANDALONE_KEYS::energyDisruptions
      "energy:crisis-policies:v1",
      // STANDALONE_KEYS::energyCrisisPolicies
      "resilience:fossil-electricity-share:v1",
      // STANDALONE_KEYS::fossilElectricityShare
      "economic:worldbank-renewable:v1"
      // BOOTSTRAP_KEYS::renewableEnergy
    ],
    _seedMetaKey: "seed-meta:energy:eia-petroleum",
    _maxStaleMin: 4320,
    // EIA petroleum daily-bundle baseline; per-key budgets via _freshnessChecks below
    _freshnessChecks: [
      { key: "seed-meta:energy:eia-petroleum", maxStaleMin: 4320 },
      // daily bundle; 72h = 3× interval
      { key: "seed-meta:energy:electricity-prices", maxStaleMin: 2880 },
      // daily cron (14:00 UTC); 48h = 2× interval
      { key: "seed-meta:energy:ember", maxStaleMin: 2880 },
      // daily cron (08:00 UTC); 48h = 2× interval
      { key: "seed-meta:energy:gas-storage-countries", maxStaleMin: 2880 },
      // daily cron at 10:30 UTC; 48h = 2× interval
      { key: "seed-meta:energy:fuel-shortages", maxStaleMin: 2880 },
      // 2d — daily cron × 2 headroom
      { key: "seed-meta:energy:disruptions", maxStaleMin: 20160 },
      // 14d — weekly cron × 2 headroom
      { key: "seed-meta:energy:crisis-policies", maxStaleMin: 60 * 24 * 400 },
      // ~400d static registry
      { key: "seed-meta:resilience:fossil-electricity-share", maxStaleMin: 11520 },
      // ~8d (annual WB-style cadence)
      { key: "seed-meta:economic:worldbank-renewable:v1", maxStaleMin: 10080 }
      // 7d WB weekly-cron annual data
    ],
    _apiPaths: [
      "GET /api/economic/v1/get-energy-crisis-policies",
      "GET /api/supply-chain/v1/get-fuel-shortage-detail",
      "GET /api/supply-chain/v1/list-energy-disruptions",
      "GET /api/supply-chain/v1/list-fuel-shortages"
    ]
  },
  {
    name: "get_climate_data",
    _outputBudgetBytes: 131072,
    description: "Climate intelligence: temperature/precipitation anomalies (vs 30-year WMO normals), climate-relevant disaster alerts (ReliefWeb/GDACS/FIRMS), atmospheric CO2 trend (NOAA Mauna Loa), air quality (OpenAQ/WAQI PM2.5 stations), Arctic sea ice extent and ocean heat indicators (NSIDC/NOAA), weather alerts, and climate news.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["anomalies", "disasters", "co2-monitoring", "air-quality", "ocean-ice", "news-intelligence", "alerts"]
          },
          description: "Restrict the response to one or more climate sub-datasets. Omit for the full bundle."
        },
        country: {
          type: "string",
          description: "Filter the country-tagged datasets (climate disasters, air-quality stations) to one ISO 3166-1 alpha-2 code."
        },
        limit: { type: "number", description: "Cap each list dataset (anomalies, disasters, stations, news, alerts) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      anomalies: { type: ["object", "null"], properties: { anomalies: { type: "array", items: { type: "object" } } } },
      disasters: { type: ["object", "null"], properties: { disasters: { type: "array", items: { type: "object", properties: {
        countryCode: { type: "string" },
        type: { type: "string" },
        severity: { type: "string" }
      } } } } },
      "co2-monitoring": { type: ["object", "null"] },
      "air-quality": { type: ["object", "null"], properties: { stations: { type: "array", items: { type: "object", properties: {
        country_code: { type: "string" },
        city: { type: "string" },
        aqi: { type: ["number", "null"] }
      } } } } },
      "ocean-ice": { type: ["object", "null"] },
      "news-intelligence": { type: ["object", "null"], properties: { items: { type: "array", items: { type: "object" } } } },
      alerts: { type: ["object", "null"], properties: { alerts: { type: "array", items: { type: "object" } } } }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "disasters", "disasters", (d) => matchesCode(d.countryCode, countries));
        narrowNested(data, "air-quality", "stations", (s) => matchesCode(s.country_code, countries));
      }
      capNested(data, "anomalies", "anomalies", limit);
      capNested(data, "disasters", "disasters", limit);
      capNested(data, "air-quality", "stations", limit);
      capNested(data, "news-intelligence", "items", limit);
      capNested(data, "alerts", "alerts", limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    _cacheKeys: ["climate:anomalies:v2", "climate:disasters:v1", "climate:co2-monitoring:v1", "climate:air-quality:v1", "climate:ocean-ice:v1", "climate:news-intelligence:v1", "weather:alerts:v1"],
    _seedMetaKey: "seed-meta:climate:co2-monitoring",
    _maxStaleMin: 2880,
    _freshnessChecks: [
      { key: "seed-meta:climate:anomalies", maxStaleMin: 120 },
      { key: "seed-meta:climate:disasters", maxStaleMin: 720 },
      { key: "seed-meta:climate:co2-monitoring", maxStaleMin: 2880 },
      { key: "seed-meta:health:air-quality", maxStaleMin: 180 },
      { key: "seed-meta:climate:ocean-ice", maxStaleMin: 1440 },
      { key: "seed-meta:climate:news-intelligence", maxStaleMin: 90 },
      { key: "seed-meta:weather:alerts", maxStaleMin: 45 }
    ],
    _apiPaths: [
      "GET /api/climate/v1/get-co2-monitoring",
      "GET /api/climate/v1/get-ocean-ice-data",
      "GET /api/climate/v1/list-air-quality-data",
      "GET /api/climate/v1/list-climate-anomalies",
      "GET /api/climate/v1/list-climate-disasters",
      "GET /api/climate/v1/list-climate-news"
    ]
  },
  {
    name: "get_infrastructure_status",
    _outputBudgetBytes: 131072,
    description: "Internet infrastructure health: Cloudflare Radar outages and service status for major cloud providers and internet services.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Filter to one country by name (case-insensitive substring)." },
        severity: { type: "string", description: "Filter to one outage severity (case-insensitive substring)." },
        limit: { type: "number", description: "Cap the outage list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      outages: {
        type: ["object", "null"],
        properties: { outages: { type: "array", items: { type: "object", properties: {
          country: { type: "string" },
          severity: { type: "string" },
          asn: { type: ["number", "string"] },
          startTime: { type: "string" },
          description: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      const severity = argStr(params.severity);
      if (country) narrowNested(data, "outages", "outages", (o) => ciIncludes(o.country, country));
      if (severity) narrowNested(data, "outages", "outages", (o) => ciIncludes(o.severity, severity));
      capNested(data, "outages", "outages", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["infra:outages:v1"],
    _seedMetaKey: "seed-meta:infra:outages",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/infrastructure/v1/list-internet-outages"
    ]
  },
  {
    name: "get_supply_chain_data",
    _outputBudgetBytes: 131072,
    description: "Dry bulk shipping stress index, customs revenue flows, and COMTRADE bilateral trade data. Tracks global supply chain pressure and trade disruptions.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: { type: "string", enum: ["shipping_stress", "customs-revenue", "flows"] },
          description: "Restrict the response to one or more sub-datasets (dry-bulk shipping stress / customs revenue / COMTRADE flows). Omit for all."
        },
        commodity: {
          type: "string",
          description: 'Filter COMTRADE flows to one commodity \u2014 matches the HS code exactly or the commodity description by substring (e.g. "2709" or "crude").'
        },
        reporter: {
          type: "string",
          description: 'Filter COMTRADE flows to one reporter by numeric reporter code or reporter name (e.g. "156" or "China").'
        },
        limit: { type: "number", description: "Cap each list dataset (carriers, months, flows) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      shipping_stress: {
        type: ["object", "null"],
        properties: { carriers: { type: "array", items: { type: "object", properties: {
          name: { type: "string" },
          stressScore: { type: ["number", "null"] }
        } } } }
      },
      "customs-revenue": {
        type: ["object", "null"],
        properties: { months: { type: "array", items: { type: "object", properties: {
          month: { type: "string" },
          revenueUsd: { type: ["number", "null"] }
        } } } }
      },
      flows: {
        type: ["object", "null"],
        properties: { flows: { type: "array", items: { type: "object", properties: {
          cmdCode: { type: "string" },
          cmdDesc: { type: "string" },
          reporter: { type: "string" },
          partner: { type: "string" },
          value: { type: ["number", "null"] }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const commodity = argStr(params.commodity);
      const reporter = argStr(params.reporter);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (commodity) {
        narrowNested(data, "flows", "flows", (f) => argStr(f.cmdCode) === commodity || ciIncludes(f.cmdDesc, commodity));
      }
      if (reporter) {
        narrowNested(data, "flows", "flows", (f) => argStr(f.reporterCode) === reporter || ciIncludes(f.reporterName ?? f.reporter, reporter));
      }
      capNested(data, "shipping_stress", "carriers", limit);
      capNested(data, "customs-revenue", "months", limit);
      capNested(data, "flows", "flows", limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    _cacheKeys: [
      "supply_chain:shipping_stress:v1",
      "trade:customs-revenue:v1",
      "comtrade:flows:v1"
    ],
    _seedMetaKey: "seed-meta:trade:customs-revenue",
    _maxStaleMin: 2880,
    _apiPaths: [
      "GET /api/supply-chain/v1/get-shipping-stress",
      "GET /api/trade/v1/get-customs-revenue"
    ]
  },
  {
    name: "get_tariff_trends",
    _outputBudgetBytes: 131072,
    description: "Global trade and pricing indicators: US tariff trends (HTS-coded), BigMac index, FAO Food Price Index, and per-country national debt levels.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: {
          type: "array",
          items: { type: "string", enum: ["tariffs", "bigmac", "fao-ffpi", "national-debt"] },
          description: "Restrict the response to one or more sub-datasets. Omit for the full bundle."
        },
        country: {
          type: "string",
          description: 'Filter the per-country datasets to one ISO 3166-1 alpha-2 country code (e.g. "US"). It is translated to alpha-3 internally for the national-debt dataset; passing an alpha-3 code directly also works.'
        },
        limit: { type: "number", description: "Cap each list dataset (tariff datapoints, BigMac countries, debt entries) to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    // First cache key `trade:tariffs:v1:840:all:10` — NON_LABEL drops bare digits
    // (840, 10) and `v1`, lands on `all`.
    outputSchema: cacheEnvelope({
      all: {
        type: ["object", "null"],
        properties: { datapoints: { type: "array", items: { type: "object", properties: {
          hsCode: { type: "string" },
          rate: { type: ["number", "null"] },
          country: { type: "string" }
        } } } }
      },
      bigmac: {
        type: ["object", "null"],
        properties: { countries: { type: "array", items: { type: "object", properties: {
          code: { type: "string" },
          priceLocal: { type: ["number", "null"] },
          priceUsd: { type: ["number", "null"] }
        } } } }
      },
      "fao-ffpi": { type: ["object", "null"] },
      "national-debt": {
        type: ["object", "null"],
        properties: { entries: { type: "array", items: { type: "object", properties: {
          iso3: { type: "string" },
          value: { type: ["number", "null"] },
          year: { type: ["number", "string"] }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const countries = argStrList(params.country);
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      if (countries.length > 0) {
        narrowNested(data, "bigmac", "countries", (c) => matchesCode(c.code, countries));
        const debtCodes = [
          ...countries,
          ...compact(countries.map((c) => iso2_to_iso3_default[c.toUpperCase()]?.toLowerCase()))
        ];
        narrowNested(data, "national-debt", "entries", (e) => matchesCode(e.iso3, debtCodes));
      }
      capNested(data, "all", "datapoints", limit);
      capNested(data, "bigmac", "countries", limit);
      capNested(data, "national-debt", "entries", limit);
      const ds = argStrList(params.dataset);
      if (ds.length > 0) {
        const map = { tariffs: "all", bigmac: "bigmac", "fao-ffpi": "fao-ffpi", "national-debt": "national-debt" };
        return selectDatasets(data, compact(ds.map((d) => map[d])));
      }
      return data;
    },
    // 4-key bundle spanning trade + economic domains. Cadences span hourly-ish
    // (tariffs co-pinned to 8h TARIFF_TTL) to monthly (FAO / national debt).
    // Per-key _freshnessChecks pulled from api/health.js::SEED_META so a slow
    // monthly key doesn't drag the aggregate stale flag and a fast tariff
    // outage isn't masked by a long FAO budget.
    _cacheKeys: [
      "trade:tariffs:v1:840:all:10",
      // STANDALONE_KEYS::tariffTrendsUs
      "economic:bigmac:v1",
      // BOOTSTRAP_KEYS::bigmac
      "economic:fao-ffpi:v1",
      // BOOTSTRAP_KEYS::faoFoodPriceIndex
      "economic:national-debt:v1"
      // BOOTSTRAP_KEYS::nationalDebt
    ],
    _seedMetaKey: "seed-meta:trade:tariffs:v1:840:all:10",
    _maxStaleMin: 540,
    // tariff cron baseline; per-key budgets via _freshnessChecks below
    _freshnessChecks: [
      { key: "seed-meta:trade:tariffs:v1:840:all:10", maxStaleMin: 540 },
      // TARIFF_TTL 8h + 60min grace
      { key: "seed-meta:economic:bigmac", maxStaleMin: 10080 },
      // weekly seed; 7d
      { key: "seed-meta:economic:fao-ffpi", maxStaleMin: 86400 },
      // monthly seed; 60d (2× interval)
      { key: "seed-meta:economic:national-debt", maxStaleMin: 86400 }
      // monthly seed; 60d (2× interval)
    ],
    _apiPaths: [
      "GET /api/economic/v1/get-fao-food-price-index",
      "GET /api/economic/v1/get-national-debt",
      "GET /api/economic/v1/list-bigmac-prices"
    ]
  },
  {
    name: "get_chokepoint_status",
    _outputBudgetBytes: 131072,
    description: "Live maritime chokepoint status: per-chokepoint vessel transit counts (10-min cadence), rolling transit summaries, per-port activity, plus static reference data (chokepoint geometry, canonical 13-chokepoint registry) and flow aggregates. Covers Suez, Hormuz, Malacca, Bab-el-Mandeb, Panama, etc.",
    inputSchema: {
      type: "object",
      properties: {
        chokepoint: {
          type: "string",
          description: 'Filter to one chokepoint \u2014 matches by case-insensitive substring across the differing identifiers used by each dataset (e.g. "hormuz" matches "hormuz_strait", "Strait of Hormuz").'
        },
        dataset: {
          type: "array",
          items: {
            type: "string",
            enum: ["transit-summaries", "chokepoint_transits", "_countries", "chokepoint-baselines", "ref", "chokepoint-flows"]
          },
          description: "Restrict the response to one or more sub-datasets. Omit for the full bundle."
        },
        limit: { type: "number", description: "Cap the chokepoint-baselines list and the _countries ISO2 index to at most this many items (default 30, pass 0 for no cap). Keyed-object maps (transit-summaries, chokepoint_transits, ref, chokepoint-flows) are intentionally not capped \u2014 use the `chokepoint` filter instead." }
      },
      required: []
    },
    // Schema validated against tests/fixtures/jmespath-samples/thin-get-chokepoint-status.response.json.
    outputSchema: cacheEnvelope({
      "transit-summaries": {
        type: ["object", "null"],
        properties: {
          summaries: { type: "object", additionalProperties: { type: "object", properties: {
            todayTotal: { type: ["number", "null"] },
            todayTanker: { type: ["number", "null"] },
            todayCargo: { type: ["number", "null"] },
            todayOther: { type: ["number", "null"] },
            wowChangePct: { type: ["number", "null"] },
            riskLevel: { type: "string" },
            incidentCount7d: { type: ["number", "null"] },
            disruptionPct: { type: ["number", "null"] },
            riskSummary: { type: "string" },
            riskReportAction: { type: "string" },
            anomaly: { type: "object" },
            dataAvailable: { type: "boolean" }
          } } },
          fetchedAt: { type: ["number", "string"] }
        }
      },
      chokepoint_transits: {
        type: ["object", "null"],
        properties: {
          transits: { type: "object", additionalProperties: { type: "object" } },
          fetchedAt: { type: ["number", "string"] }
        }
      },
      _countries: {
        type: ["array", "object", "null"],
        items: { type: "string" }
      },
      "chokepoint-baselines": {
        type: ["object", "null"],
        properties: {
          source: { type: "string" },
          referenceYear: { type: ["number", "string"] },
          updatedAt: { type: "string" },
          chokepoints: { type: "array", items: { type: "object", properties: {
            id: { type: "string" },
            relayId: { type: "string" },
            name: { type: "string" }
          } } }
        }
      },
      ref: {
        type: ["object", "null"],
        additionalProperties: { type: "object" }
      },
      "chokepoint-flows": {
        type: ["object", "null"],
        additionalProperties: { type: "object" }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const cp = argStr(params.chokepoint);
      if (cp) {
        mapNested(data, "transit-summaries", "summaries", (m) => pickMapKeysLike(m, cp));
        mapNested(data, "chokepoint_transits", "transits", (m) => pickMapKeysLike(m, cp));
        data["chokepoint-flows"] = pickMapKeysLike(data["chokepoint-flows"], cp);
        narrowNested(data, "chokepoint-baselines", "chokepoints", (c) => ciIncludes(c.id, cp) || ciIncludes(c.relayId, cp) || ciIncludes(c.name, cp));
      }
      const limit = argNum(params.limit) ?? DEFAULT_LIST_LIMIT;
      capNested(data, "chokepoint-baselines", "chokepoints", limit);
      capArrays(data, limit);
      return selectDatasets(data, argStrList(params.dataset));
    },
    // Maritime chokepoint bundle distinct from get_supply_chain_data (which keeps
    // shipping-stress + customs + comtrade). Cadences span 10-minute relay
    // (transit-summaries, chokepoint_transits) to ~400-day static registries
    // (chokepoint-baselines), so per-key _freshnessChecks pulled from
    // api/health.js::SEED_META — a fast transit outage isn't masked by the
    // slow chokepoint-baselines budget, and the long-cadence portwatch keys
    // don't drag aggregate stale flagging.
    //
    // Payload measurement (PR pre-merge, fun-toad-55127.upstash.io 2026-05-11):
    //   transit-summaries:v1                        — 6.8 KB
    //   chokepoint_transits:v1                      — 1.1 KB
    //   portwatch-ports:v1:_countries               — 0.9 KB
    //   energy:chokepoint-baselines:v1              — 0.6 KB
    //   portwatch:chokepoints:ref:v1                — 7.9 KB
    //   energy:chokepoint-flows:v1                  — 1.2 KB
    //   ────────────────────────────────────────────────────
    //   Total: 18.5 KB (well under the 200KB/single-key and 500KB/aggregate
    //   thresholds that historically tripped handler timeouts —
    //   see tests/transit-summaries.test.mjs:539-545).
    //
    // EXCLUDED on purpose: supply_chain:corridorrisk:v1 is an intermediate
    // key whose data flows through supply_chain:transit-summaries:v1
    // (api/health.js:461). U7 will add corridorrisk to EXCLUDED_FROM_MCP.
    // MCP Apps (`io.modelcontextprotocol/ui`): links the tool to its interactive
    // ui:// app shell. Single source of truth — registered in ../ui/registry.ts.
    _uiResourceUri: CHOKEPOINT_MONITOR_UI_URI,
    _cacheKeys: [
      "supply_chain:transit-summaries:v1",
      // STANDALONE_KEYS::transitSummaries
      "supply_chain:chokepoint_transits:v1",
      // STANDALONE_KEYS::chokepointTransits
      "supply_chain:portwatch-ports:v1:_countries",
      // STANDALONE_KEYS::portwatchPortActivity
      "energy:chokepoint-baselines:v1",
      // STANDALONE_KEYS::chokepointBaselines
      "portwatch:chokepoints:ref:v1",
      // STANDALONE_KEYS::portwatchChokepointsRef
      "energy:chokepoint-flows:v1"
      // STANDALONE_KEYS::chokepointFlows
    ],
    _seedMetaKey: "seed-meta:supply_chain:transit-summaries",
    _maxStaleMin: 30,
    // transit-summaries 10-min relay baseline; per-key budgets via _freshnessChecks below
    _freshnessChecks: [
      { key: "seed-meta:supply_chain:transit-summaries", maxStaleMin: 30 },
      // 10-min relay; 30min = 3× interval
      { key: "seed-meta:supply_chain:chokepoint_transits", maxStaleMin: 30 },
      // 10-min relay; 30min = 3× interval
      { key: "seed-meta:supply_chain:portwatch-ports", maxStaleMin: 2160, minRecordCount: 174 },
      // 12h cron; 36h = 3× interval; #3613 requires full country coverage
      { key: "seed-meta:energy:chokepoint-baselines", maxStaleMin: 60 * 24 * 400 },
      // ~400d static registry
      { key: "seed-meta:portwatch:chokepoints-ref", maxStaleMin: 60 * 24 * 14 },
      // weekly cron; 14d = 2× interval
      { key: "seed-meta:energy:chokepoint-flows", maxStaleMin: 720 }
      // 6h cron; 12h = 2× interval
    ],
    _apiPaths: [
      "GET /api/intelligence/v1/get-country-port-activity",
      "GET /api/supply-chain/v1/get-chokepoint-status"
    ]
  },
  {
    name: "get_positive_events",
    _outputBudgetBytes: 131072,
    description: "Positive geopolitical events: diplomatic agreements, humanitarian aid, development milestones, and peace initiatives worldwide.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["science-health", "nature-wildlife", "climate-wins", "innovation-tech", "humanity-kindness", "culture-community"],
          description: "Filter to one positive-event category."
        },
        limit: { type: "number", description: "Cap the event list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "geo-bootstrap": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          category: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          date: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const category = argStr(params.category);
      if (category) narrowNested(data, "geo-bootstrap", "events", (e) => argStr(e.category) === category);
      capNested(data, "geo-bootstrap", "events", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["positive_events:geo-bootstrap:v1"],
    _seedMetaKey: "seed-meta:positive-events:geo",
    _maxStaleMin: 60,
    _apiPaths: [
      "GET /api/positive-events/v1/list-positive-geo-events"
    ]
  },
  {
    name: "get_radiation_data",
    _outputBudgetBytes: 131072,
    description: "Radiation observation levels from global monitoring stations. Flags anomalous readings that may indicate nuclear incidents.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Filter to one country by name (case-insensitive substring)." },
        anomalous_only: {
          type: "boolean",
          description: 'Drop observations with severity "normal" \u2014 keep only elevated/spike readings.'
        },
        limit: { type: "number", description: "Cap the observation list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      observations: {
        type: ["object", "null"],
        properties: { observations: { type: "array", items: { type: "object", properties: {
          country: { type: "string" },
          severity: { type: "string" },
          stationName: { type: "string" },
          value: { type: ["number", "null"] },
          unit: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const country = argStr(params.country);
      if (country) narrowNested(data, "observations", "observations", (o) => ciIncludes(o.country, country));
      if (argBool(params.anomalous_only)) {
        narrowNested(data, "observations", "observations", (o) => !argStr(o.severity).endsWith("normal"));
      }
      capNested(data, "observations", "observations", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["radiation:observations:v1"],
    _seedMetaKey: "seed-meta:radiation:observations",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/radiation/v1/list-radiation-observations"
    ]
  },
  {
    name: "get_research_signals",
    _outputBudgetBytes: 131072,
    description: "Tech and research event signals: emerging technology events bootstrap data from curated research feeds.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["conference", "earnings", "ipo", "other"],
          description: "Filter to one tech-event type."
        },
        source: { type: "string", description: 'Filter to one source feed (e.g. "techmeme", "dev.events", "curated").' },
        limit: { type: "number", description: "Cap the event list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      "tech-events-bootstrap": {
        type: ["object", "null"],
        properties: { events: { type: "array", items: { type: "object", properties: {
          type: { type: "string" },
          source: { type: "string" },
          title: { type: "string" },
          date: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const type = argStr(params.type);
      const source = argStr(params.source);
      if (type) narrowNested(data, "tech-events-bootstrap", "events", (e) => argStr(e.type) === type);
      if (source) narrowNested(data, "tech-events-bootstrap", "events", (e) => argStr(e.source) === source);
      capNested(data, "tech-events-bootstrap", "events", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["research:tech-events-bootstrap:v1"],
    _seedMetaKey: "seed-meta:research:tech-events",
    _maxStaleMin: 480,
    _apiPaths: [
      "GET /api/research/v1/list-tech-events"
    ]
  },
  {
    name: "get_forecast_predictions",
    _uiResourceUri: FORECASTS_UI_URI,
    _outputBudgetBytes: 131072,
    description: "AI-generated geopolitical and economic forecasts from WorldMonitor's predictive models. Covers upcoming risk events and probability assessments.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: 'Filter to one forecast domain (exact, case-insensitive \u2014 e.g. "shipping", "energy", "macro").' },
        region: { type: "string", description: "Filter to one region/theater (case-insensitive substring)." },
        limit: { type: "number", description: "Cap the forecast list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      predictions: {
        type: ["object", "null"],
        properties: { predictions: { type: "array", items: { type: "object", properties: {
          domain: { type: "string" },
          region: { type: "string" },
          probability: { type: ["number", "null"] },
          title: { type: "string" }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const domain = argStr(params.domain);
      const region = argStr(params.region);
      if (domain) narrowNested(data, "predictions", "predictions", (p) => argStr(p.domain) === domain);
      if (region) narrowNested(data, "predictions", "predictions", (p) => ciIncludes(p.region, region));
      capNested(data, "predictions", "predictions", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["forecast:predictions:v2"],
    _seedMetaKey: "seed-meta:forecast:predictions",
    _maxStaleMin: 90,
    _apiPaths: [
      "GET /api/forecast/v1/get-forecasts"
    ]
  },
  {
    name: "get_forecast_scorecard",
    _outputBudgetBytes: 65536,
    description: "Forecast resolution scorecard with calibration, Brier/log score, domain and generation-origin breakdowns, and pending/judged resolution counts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    },
    outputSchema: cacheEnvelope({
      scorecard: {
        type: ["object", "null"],
        properties: {
          generatedAt: { type: ["number", "null"] },
          rollingWindowDays: { type: ["number", "null"] },
          totals: { type: ["object", "null"] },
          overall: { type: ["object", "null"] },
          skill: { type: ["object", "null"] },
          byDomain: { type: "array", items: { type: "object" } },
          byGenerationOrigin: { type: "array", items: { type: "object" } },
          calibration: { type: "array", items: { type: "object" } },
          vsMarketSkill: { type: ["object", "null"] }
        }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _cacheKeys: ["forecast:scorecard:v1"],
    _seedMetaKey: "seed-meta:forecast:scorecard",
    _maxStaleMin: 2160,
    _apiPaths: [
      "GET /api/forecast/v1/get-forecast-scorecard"
    ]
  },
  // -------------------------------------------------------------------------
  // Social velocity — cache read (Reddit signals, seeded by relay)
  // -------------------------------------------------------------------------
  {
    name: "get_social_velocity",
    _outputBudgetBytes: 131072,
    description: "Reddit geopolitical social velocity: top posts from worldnews, geopolitics, and related subreddits with engagement scores and trend signals.",
    inputSchema: {
      type: "object",
      properties: {
        subreddit: { type: "string", description: 'Filter to one subreddit (e.g. "worldnews", "geopolitics").' },
        limit: { type: "number", description: "Cap the post list to at most this many items (default 30, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: cacheEnvelope({
      reddit: {
        type: ["object", "null"],
        properties: { posts: { type: "array", items: { type: "object", properties: {
          subreddit: { type: "string" },
          title: { type: "string" },
          score: { type: ["number", "null"] },
          url: { type: "string" },
          createdAt: { type: ["string", "number"] }
        } } } }
      }
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _postFilter: (data, params) => {
      const sub = argStr(params.subreddit);
      if (sub) narrowNested(data, "reddit", "posts", (p) => argStr(p.subreddit) === sub);
      capNested(data, "reddit", "posts", argNum(params.limit) ?? DEFAULT_LIST_LIMIT);
      return data;
    },
    _cacheKeys: ["intelligence:social:reddit:v1"],
    _seedMetaKey: "seed-meta:intelligence:social-reddit",
    _maxStaleMin: 30,
    _apiPaths: [
      "GET /api/intelligence/v1/get-social-velocity"
    ]
  }
];

// shared/country-bboxes.js
var COUNTRY_BBOXES = {
  "AE": [22.62, 51.57, 26.06, 56.38],
  "AF": [29.39, 60.49, 38.47, 74.89],
  "AL": [39.69, 19.31, 42.55, 20.97],
  "AM": [38.86, 43.44, 41.29, 46.6],
  "AO": [-18.03, 11.74, -4.39, 24],
  "AQ": [-90, -180, -64.38, 180],
  "AR": [-54.91, -73.47, -21.79, -53.67],
  "AT": [46.42, 9.52, 49.01, 17.15],
  "AU": [-43.63, 113.39, -10.93, 153.61],
  "AZ": [38.43, 44.77, 41.89, 49.59],
  "BA": [42.56, 15.72, 45.28, 19.62],
  "BD": [21.06, 88.02, 26.42, 92.58],
  "BE": [49.54, 2.52, 51.38, 6.12],
  "BF": [9.49, -5.52, 15.07, 2.39],
  "BG": [41.24, 22.35, 44.23, 28.58],
  "BI": [-4.45, 29.02, -2.4, 30.83],
  "BJ": [6.21, 0.77, 12.4, 3.84],
  "BN": [4.02, 114, 4.89, 114.98],
  "BO": [-22.83, -69.58, -9.83, -57.55],
  "BR": [-33.74, -73.77, 5.2, -34.8],
  "BT": [26.7, 88.89, 28.34, 92.04],
  "BW": [-26.86, 19.98, -17.79, 29.35],
  "BY": [51.48, 23.49, 56.14, 32.72],
  "BZ": [15.89, -89.24, 18.48, -88.09],
  "CA": [41.68, -141.01, 83.05, -52.63],
  "CD": [-13.43, 12.21, 5.37, 31.24],
  "CF": [2.24, 14.52, 11, 27.44],
  "CG": [-5.02, 11.11, 3.62, 18.63],
  "CH": [45.91, 6.06, 47.8, 10.45],
  "CI": [4.35, -8.57, 10.43, -2.51],
  "CL": [-55.63, -75.7, -17.51, -67.01],
  "CM": [1.91, 8.59, 13.08, 16.2],
  "CN": [18.29, 73.63, 53.55, 134.77],
  "CO": [-4.24, -78.83, 12.47, -66.88],
  "CR": [8.03, -85.86, 11.08, -82.57],
  "CU": [19.86, -84.02, 23.2, -74.27],
  "CY": [34.63, 32.58, 35.19, 34.02],
  "CZ": [48.59, 12.34, 50.92, 18.83],
  "DE": [47.3, 5.99, 54.9, 14.81],
  "DJ": [10.97, 41.75, 12.71, 43.41],
  "DK": [54.81, 8.29, 57.59, 12.6],
  "DO": [18.04, -71.91, 19.94, -68.74],
  "DZ": [18.98, -8.68, 37.08, 11.97],
  "EC": [-4.96, -80.85, 1.43, -75.28],
  "EE": [57.52, 23.47, 59.63, 28.02],
  "EG": [21.99, 24.69, 31.66, 36.88],
  "EH": [20.77, -17.06, 27.66, -8.68],
  "ER": [12.47, 36.42, 18, 43.12],
  "ES": [36.14, -9.22, 43.71, 3.18],
  "ET": [3.46, 33.05, 14.88, 47.98],
  "FI": [59.9, 20.62, 70.08, 31.57],
  "FJ": [-18.25, 177.34, -16.15, 180],
  "FR": [2.11, -54.62, 51.09, 9.55],
  "GA": [-3.94, 8.8, 2.3, 14.5],
  "GB": [50.23, -8.16, 58.66, 1.77],
  "GE": [41.11, 39.99, 43.54, 46.43],
  "GH": [4.74, -3.26, 11.13, 1.19],
  "GL": [60.19, -72.78, 83.63, -11.64],
  "GN": [7.25, -15.02, 12.67, -7.69],
  "GQ": [1, 9.41, 2.34, 11.34],
  "GR": [34.93, 20, 41.71, 26.64],
  "GT": [13.73, -92.25, 17.81, -88.22],
  "GW": [10.97, -16.73, 12.68, -13.73],
  "GY": [1.27, -61.38, 8.56, -56.48],
  "HN": [12.98, -89.36, 15.98, -83.13],
  "HR": [42.42, 13.59, 46.5, 19.02],
  "HT": [18.04, -72.89, 19.94, -71.64],
  "HU": [45.74, 16.09, 48.53, 22.88],
  "ID": [-10.34, 95.2, 5.55, 140.98],
  "IE": [51.59, -10.23, 55.16, -6],
  "IL": [29.49, 34.25, 33.41, 35.82],
  "IN": [8.08, 68.18, 35.5, 97.32],
  "IQ": [29.1, 38.77, 37.37, 48.53],
  "IR": [25.2, 44.06, 39.69, 62.75],
  "IS": [63.4, -24.2, 66.47, -13.53],
  "IT": [36.79, 7.02, 46.99, 18.01],
  "JM": [17.72, -78.08, 18.52, -76.26],
  "JO": [29.19, 34.95, 33.37, 39.15],
  "JP": [31.11, 129.85, 45.51, 145.77],
  "KE": [-4.68, 33.89, 4.98, 41.89],
  "KG": [39.33, 69.29, 43.22, 80.21],
  "KH": [10.42, 102.33, 14.7, 107.6],
  "KP": [37.83, 124.37, 42.53, 130.7],
  "KR": [34.44, 126.27, 38.62, 129.45],
  "KW": [28.53, 46.53, 29.99, 48.43],
  "KZ": [40.58, 46.48, 55.35, 87.32],
  "LA": [14.32, 100.1, 22.4, 107.66],
  "LB": [33.09, 35.11, 34.65, 36.6],
  "LK": [5.92, 79.76, 9.5, 81.88],
  "LR": [4.35, -11.48, 8.49, -7.45],
  "LS": [-30.65, 27.01, -28.6, 29.44],
  "LT": [53.94, 21.05, 56.42, 26.59],
  "LU": [49.46, 5.79, 50.12, 6.35],
  "LV": [55.67, 21.05, 58.06, 28.15],
  "LY": [19.5, 9.4, 33.18, 25.15],
  "MA": [21.42, -17.01, 35.92, -1.25],
  "MD": [45.46, 26.62, 48.45, 29.73],
  "ME": [41.85, 18.44, 43.53, 20.35],
  "MG": [-25.57, 43.22, -12.3, 50.5],
  "MK": [40.85, 20.48, 42.31, 22.92],
  "ML": [10.16, -12.26, 25, 4.23],
  "MM": [10.35, 92.27, 28.53, 101.16],
  "MN": [41.6, 87.82, 52.11, 119.7],
  "MR": [14.77, -17.06, 27.29, -4.82],
  "MW": [-16.48, 32.72, -9.41, 35.85],
  "MX": [14.55, -117.13, 32.53, -86.74],
  "MY": [0.85, 100.13, 6.71, 119.16],
  "MZ": [-26.85, 30.21, -10.47, 40.84],
  "NA": [-28.96, 11.77, -16.96, 25.26],
  "NC": [-22.29, 164.37, -20.3, 167.03],
  "NE": [11.7, 0.15, 23.52, 15.95],
  "NG": [4.28, 2.67, 13.87, 14.67],
  "NI": [10.72, -87.31, 15, -83.13],
  "NL": [50.75, 4.14, 53.41, 7.19],
  "NO": [58.03, 4.96, 80.33, 31.06],
  "NP": [26.35, 80.04, 30.41, 88.12],
  "NZ": [-46.68, 166.49, -35.01, 178.29],
  "OM": [16.64, 51.98, 24.98, 59.79],
  "PA": [7.21, -82.9, 9.63, -77.2],
  "PE": [-18.34, -81.25, -0.11, -68.68],
  "PG": [-10.35, 140.97, -2.6, 155.93],
  "PH": [5.8, 119.88, 18.54, 126.57],
  "PK": [23.8, 60.84, 37.02, 77.05],
  "PL": [49.07, 14.2, 54.82, 24.11],
  "PR": [17.93, -67.21, 18.52, -65.63],
  "PS": [31.21, 34.2, 32.38, 35.56],
  "PT": [37.12, -9.49, 41.97, -6.21],
  "PY": [-27.49, -62.65, -19.29, -54.25],
  "QA": [24.63, 50.75, 26.05, 51.62],
  "RO": [43.65, 20.24, 48.26, 29.66],
  "RS": [42.25, 18.9, 46.11, 22.94],
  "RU": [41.21, -180, 81.29, 180],
  "RW": [-2.81, 28.86, -1.07, 30.83],
  "SA": [16.37, 34.63, 32.12, 55.64],
  "SD": [8.69, 22.07, 22, 38.6],
  "SE": [55.4, 11.22, 69.04, 24.16],
  "SI": [45.49, 13.59, 46.86, 16.52],
  "SK": [47.75, 16.95, 49.51, 22.54],
  "SL": [6.92, -13.3, 10, -10.28],
  "SN": [12.31, -17.18, 16.64, -11.39],
  "SO": [-1.7, 40.97, 11.99, 51.14],
  "SR": [1.94, -58.07, 6.01, -53.99],
  "SS": [3.49, 24.17, 11.71, 35.92],
  "SV": [13.25, -90.1, 14.42, -87.82],
  "SY": [32.32, 35.76, 37.11, 42.36],
  "SZ": [-27.32, 30.79, -25.91, 32.11],
  "TD": [7.52, 13.45, 23.44, 23.98],
  "TG": [6.1, -0.17, 11.13, 1.62],
  "TH": [5.64, 97.77, 20.32, 105.65],
  "TJ": [36.7, 67.76, 40.88, 75.16],
  "TL": [-9.49, 124.92, -8.31, 127.01],
  "TM": [35.22, 52.44, 42.78, 66.55],
  "TN": [30.23, 7.48, 37.34, 11.51],
  "TR": [35.92, 26.04, 42.09, 44.81],
  "TZ": [-11.72, 29.4, -1, 40.44],
  "UA": [45.22, 22.13, 52.35, 40.14],
  "UG": [-1.39, 29.58, 4.22, 34.98],
  "US": [19.03, -168.08, 71.31, -66.98],
  "UY": [-34.97, -58.39, -30.1, -53.13],
  "UZ": [37.19, 55.98, 45.56, 72.62],
  "VE": [0.76, -73.01, 11.85, -59.82],
  "VN": [8.82, 102.12, 23.32, 109.47],
  "XK": [41.87, 20.06, 43.17, 21.56],
  "YE": [12.62, 42.7, 19, 53.09],
  "ZA": [-34.81, 16.49, -22.19, 32.89],
  "ZM": [-17.94, 21.98, -8.19, 33.67],
  "ZW": [-22.4, 25.26, -15.64, 33.03]
};
var country_bboxes_default = COUNTRY_BBOXES;

// shared/mining-sites.js
var MINING_SITES = [
  {
    "id": "carlin-trend",
    "name": "Carlin Trend",
    "lat": 40.73,
    "lon": -116.12,
    "mineral": "Gold",
    "country": "USA",
    "operator": "Nevada Gold Mines (Barrick/Newmont JV)",
    "status": "producing",
    "significance": "Largest gold mining district in Western Hemisphere. ~3.5Moz/yr combined output.",
    "productionRank": "Western Hemisphere #1",
    "openPitOrUnderground": "both"
  },
  {
    "id": "super-pit",
    "name": "Super Pit (KCGM)",
    "lat": -30.784,
    "lon": 121.498,
    "mineral": "Gold",
    "country": "Australia",
    "operator": "Northern Star Resources",
    "status": "producing",
    "significance": "One of Australia's largest open-pit gold mines. ~600koz/yr.",
    "productionRank": "Australia #2",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "boddington",
    "name": "Boddington",
    "lat": -32.795,
    "lon": 116.48,
    "mineral": "Gold",
    "country": "Australia",
    "operator": "Newmont",
    "status": "producing",
    "significance": "Australia's largest gold mine. Also significant copper by-product.",
    "productionRank": "Australia #1",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "mponeng",
    "name": "Mponeng",
    "lat": -26.486,
    "lon": 27.445,
    "mineral": "Gold",
    "country": "South Africa",
    "operator": "AngloGold Ashanti",
    "status": "producing",
    "significance": "World's deepest gold mine (4km). High-grade underground operation.",
    "productionRank": "World deepest mine",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "olimpiada",
    "name": "Olimpiada",
    "lat": 59.03,
    "lon": 93.37,
    "mineral": "Gold",
    "country": "Russia",
    "operator": "Polyus",
    "status": "producing",
    "significance": "Russia's largest gold mine, among world's top 5. Siberian deposit.",
    "productionRank": "World top 5",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "lihir",
    "name": "Lihir",
    "lat": -3.12,
    "lon": 152.65,
    "mineral": "Gold",
    "country": "Papua New Guinea",
    "operator": "Newcrest/Newmont",
    "status": "producing",
    "significance": "Active volcanic island gold mine. ~950koz/yr.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "obuasi",
    "name": "Obuasi",
    "lat": 6.2,
    "lon": -1.67,
    "mineral": "Gold",
    "country": "Ghana",
    "operator": "AngloGold Ashanti",
    "status": "producing",
    "significance": "High-grade West African gold mine. Historically one of Africa's largest producers.",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "pueblo-viejo",
    "name": "Pueblo Viejo",
    "lat": 19.33,
    "lon": -70.06,
    "mineral": "Gold",
    "country": "Dominican Republic",
    "operator": "Barrick Gold / Newmont JV",
    "status": "producing",
    "significance": "Largest gold mine in the Caribbean. ~800koz/yr.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "detour-lake",
    "name": "Detour Lake",
    "lat": 50.05,
    "lon": -79.7,
    "mineral": "Gold",
    "country": "Canada",
    "operator": "Agnico Eagle",
    "status": "producing",
    "significance": "Canada's largest open-pit gold mine by land area. ~700koz/yr.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "cortez",
    "name": "Cortez (Pipeline)",
    "lat": 40.26,
    "lon": -116.35,
    "mineral": "Gold",
    "country": "USA",
    "operator": "Nevada Gold Mines (Barrick)",
    "status": "producing",
    "significance": "Major Tier One gold mine in Nevada. Part of Nevada Gold Mines complex.",
    "openPitOrUnderground": "both"
  },
  {
    "id": "donlin-gold",
    "name": "Donlin Gold",
    "lat": 61.98,
    "lon": -158.08,
    "mineral": "Gold",
    "country": "USA",
    "operator": "Barrick / NovaGold JV",
    "status": "development",
    "significance": "One of the world's largest undeveloped gold deposits. Remote Alaska site.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "muruntau",
    "name": "Muruntau",
    "lat": 41.56,
    "lon": 64.58,
    "mineral": "Gold",
    "country": "Uzbekistan",
    "operator": "Navoi Mining & Metallurgy Combinat",
    "status": "producing",
    "significance": "World's largest open-pit gold mine by area. ~2.8Moz/yr. State-owned.",
    "productionRank": "World #2 gold mine",
    "annualOutput": "2.8 Moz/yr",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "kibali",
    "name": "Kibali",
    "lat": 3.07,
    "lon": 29.76,
    "mineral": "Gold",
    "country": "DRC",
    "operator": "Barrick Gold / AngloGold Ashanti JV",
    "status": "producing",
    "significance": "Largest gold mine in DRC. ~800koz/yr. Underground and open-pit hybrid.",
    "annualOutput": "800 Koz/yr",
    "openPitOrUnderground": "both"
  },
  {
    "id": "sukhoi-log",
    "name": "Sukhoi Log",
    "lat": 58.29,
    "lon": 115.22,
    "mineral": "Gold",
    "country": "Russia",
    "operator": "Polyus (under development)",
    "status": "development",
    "significance": "One of the world's largest undeveloped gold deposits. Est. ~2.3Moz/yr at full capacity.",
    "annualOutput": "~2.3 Moz/yr (projected)",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "ahafo",
    "name": "Ahafo",
    "lat": 7.06,
    "lon": -2.34,
    "mineral": "Gold",
    "country": "Ghana",
    "operator": "Newmont",
    "status": "producing",
    "significance": "Major Newmont operation in Ghana's prolific Ashanti Belt. ~800koz/yr.",
    "annualOutput": "800 Koz/yr",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "loulo-gounkoto",
    "name": "Loulo-Gounkoto",
    "lat": 14.85,
    "lon": -11.41,
    "mineral": "Gold",
    "country": "Mali",
    "operator": "Barrick Gold",
    "status": "producing",
    "significance": "Key Barrick operation in West Africa. ~700koz/yr. Subject to Malian mining code pressure.",
    "annualOutput": "700 Koz/yr",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "south-deep",
    "name": "South Deep",
    "lat": -26.52,
    "lon": 27.54,
    "mineral": "Gold",
    "country": "South Africa",
    "operator": "Gold Fields",
    "status": "producing",
    "significance": "One of the world's largest gold mines by reserves. Deep underground operation (~3km).",
    "annualOutput": "300 Koz/yr",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "kumtor",
    "name": "Kumtor",
    "lat": 41.81,
    "lon": 78.19,
    "mineral": "Gold",
    "country": "Kyrgyzstan",
    "operator": "Centerra Gold (state-nationalized)",
    "status": "producing",
    "significance": "Largest gold mine in Central Asia. ~500koz/yr. Nationalized by Kyrgyzstan in 2022.",
    "annualOutput": "500 Koz/yr",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "yanacocha",
    "name": "Yanacocha",
    "lat": -6.94,
    "lon": -78.56,
    "mineral": "Gold",
    "country": "Peru",
    "operator": "Newmont / Buenaventura / IFC JV",
    "status": "producing",
    "significance": "Largest gold mine in South America. ~400koz/yr. Transitioning to Yanacocha Sulfides project.",
    "annualOutput": "400 Koz/yr",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "cerro-negro",
    "name": "Cerro Negro",
    "lat": -46.75,
    "lon": -67.5,
    "mineral": "Gold",
    "country": "Argentina",
    "operator": "Newmont",
    "status": "producing",
    "significance": "High-grade Patagonian gold mine. ~300koz/yr. One of the highest-grade operations globally.",
    "annualOutput": "300 Koz/yr",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "tropicana",
    "name": "Tropicana",
    "lat": -29.3,
    "lon": 124.8,
    "mineral": "Gold",
    "country": "Australia",
    "operator": "AngloGold Ashanti / Regis Resources",
    "status": "producing",
    "significance": "Remote Western Australian gold mine in the Great Victoria Desert. ~500koz/yr.",
    "annualOutput": "500 Koz/yr",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "fresnillo-mine",
    "name": "Fresnillo Mine",
    "lat": 23.17,
    "lon": -102.87,
    "mineral": "Silver",
    "country": "Mexico",
    "operator": "Fresnillo plc",
    "status": "producing",
    "significance": "World's largest primary silver mine. >50Moz/yr silver output.",
    "productionRank": "World #1 silver mine",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "penasquito",
    "name": "Pe\xF1asquito",
    "lat": 25.18,
    "lon": -101.81,
    "mineral": "Silver",
    "country": "Mexico",
    "operator": "Newmont",
    "status": "producing",
    "significance": "Mexico's largest open-pit mine. World's largest silver producer by output. Gold/zinc/lead by-products.",
    "productionRank": "World #2 silver mine",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "kghm-silver",
    "name": "KGHM Copper/Silver Complex",
    "lat": 51.62,
    "lon": 16.24,
    "mineral": "Silver",
    "country": "Poland",
    "operator": "KGHM Polska Mied\u017A",
    "status": "producing",
    "significance": "Europe's largest copper and silver producer. World's second-largest silver producer.",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "escondida",
    "name": "Escondida",
    "lat": -24.27,
    "lon": -69.07,
    "mineral": "Copper",
    "country": "Chile",
    "operator": "BHP / Rio Tinto / JECO",
    "status": "producing",
    "significance": "World's largest copper mine. ~1.2Mt Cu/yr. Atacama Desert, Chile.",
    "productionRank": "World #1 copper mine",
    "openPitOrUnderground": "open-pit",
    "productionCapacity": "1.2Mt Cu/yr"
  },
  {
    "id": "chuquicamata",
    "name": "Chuquicamata",
    "lat": -22.3,
    "lon": -68.93,
    "mineral": "Copper",
    "country": "Chile",
    "operator": "Codelco",
    "status": "producing",
    "significance": "World's largest open-pit copper mine by volume. Transitioning to underground.",
    "productionRank": "World largest open pit by volume",
    "openPitOrUnderground": "both"
  },
  {
    "id": "el-teniente",
    "name": "El Teniente",
    "lat": -34.08,
    "lon": -70.36,
    "mineral": "Copper",
    "country": "Chile",
    "operator": "Codelco",
    "status": "producing",
    "significance": "World's largest underground copper mine. ~430kt Cu/yr.",
    "productionRank": "World #1 underground copper mine",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "grasberg",
    "name": "Grasberg",
    "lat": -4.05,
    "lon": 137.12,
    "mineral": "Copper",
    "country": "Indonesia",
    "operator": "Freeport-McMoRan / Inalum",
    "status": "producing",
    "significance": "World's second-largest copper mine. Also world's largest gold mine by contained gold.",
    "productionRank": "World #2 copper, #1 gold",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "cerro-verde",
    "name": "Cerro Verde",
    "lat": -16.52,
    "lon": -71.6,
    "mineral": "Copper",
    "country": "Peru",
    "operator": "Freeport-McMoRan / Buenaventura / SMM",
    "status": "producing",
    "significance": "Major Peruvian copper producer. ~500kt Cu/yr.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "antamina",
    "name": "Antamina",
    "lat": -9.53,
    "lon": -77.04,
    "mineral": "Copper",
    "country": "Peru",
    "operator": "BHP / Glencore / Teck / Mitsubishi",
    "status": "producing",
    "significance": "World-class copper-zinc mine in the Andes. ~460kt Cu/yr.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "morenci",
    "name": "Morenci",
    "lat": 33.08,
    "lon": -109.36,
    "mineral": "Copper",
    "country": "USA",
    "operator": "Freeport-McMoRan",
    "status": "producing",
    "significance": "Largest copper mine in North America. ~500kt Cu/yr.",
    "productionRank": "North America #1 copper mine",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "kamoa-kakula",
    "name": "Kamoa-Kakula",
    "lat": -5.54,
    "lon": 25.96,
    "mineral": "Copper",
    "country": "DRC",
    "operator": "Ivanhoe Mines / Zijin Mining",
    "status": "producing",
    "significance": "Highest-grade major copper mine discovered in 30 years. Fastest-growing producer.",
    "productionRank": "World #3 copper mine (growing)",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "oyu-tolgoi",
    "name": "Oyu Tolgoi",
    "lat": 43,
    "lon": 107,
    "mineral": "Copper",
    "country": "Mongolia",
    "operator": "Rio Tinto / Turquoise Hill",
    "status": "producing",
    "significance": "World's third-largest copper-gold deposit. Underground expansion ramping up.",
    "openPitOrUnderground": "both"
  },
  {
    "id": "lumwana",
    "name": "Lumwana",
    "lat": -12.52,
    "lon": 25.36,
    "mineral": "Copper",
    "country": "Zambia",
    "operator": "Barrick Gold",
    "status": "producing",
    "significance": "One of Africa's largest copper mines. ~140kt Cu/yr. Major Zambian producer.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "greenbushes",
    "name": "Greenbushes",
    "lat": -33.86,
    "lon": 116.01,
    "mineral": "Lithium",
    "country": "Australia",
    "operator": "Talison Lithium (Albemarle / Tianqi)",
    "status": "producing",
    "significance": "World's largest hard-rock lithium mine. Highest-grade spodumene deposit.",
    "productionRank": "World #1 hard-rock lithium",
    "openPitOrUnderground": "open-pit",
    "productionCapacity": "~1.5Mt spodumene/yr"
  },
  {
    "id": "salar-atacama",
    "name": "Salar de Atacama",
    "lat": -23.5,
    "lon": -68.33,
    "mineral": "Lithium",
    "country": "Chile",
    "operator": "SQM / Albemarle",
    "status": "producing",
    "significance": "World's largest and lowest-cost lithium brine source. ~150kt LCE/yr.",
    "productionRank": "World #1 lithium brine",
    "openPitOrUnderground": "in-situ",
    "productionCapacity": "150kt LCE/yr"
  },
  {
    "id": "pilgangoora",
    "name": "Pilgangoora",
    "lat": -21.03,
    "lon": 118.91,
    "mineral": "Lithium",
    "country": "Australia",
    "operator": "Pilbara Minerals",
    "status": "producing",
    "significance": "Major hard-rock lithium mine. World's largest spodumene project after Greenbushes.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "olaroz",
    "name": "Olaroz",
    "lat": -23.47,
    "lon": -66.81,
    "mineral": "Lithium",
    "country": "Argentina",
    "operator": "Allkem / Toyota Tsusho",
    "status": "producing",
    "significance": "Key Argentina lithium brine operation. Part of the Lithium Triangle.",
    "openPitOrUnderground": "in-situ"
  },
  {
    "id": "cauchari-olaroz",
    "name": "Cauchari-Olaroz",
    "lat": -23.82,
    "lon": -66.89,
    "mineral": "Lithium",
    "country": "Argentina",
    "operator": "Lithium Americas / Ganfeng",
    "status": "producing",
    "significance": "One of Argentina's largest lithium brine projects. Recently commenced production.",
    "openPitOrUnderground": "in-situ"
  },
  {
    "id": "silver-peak",
    "name": "Silver Peak",
    "lat": 37.75,
    "lon": -117.65,
    "mineral": "Lithium",
    "country": "USA",
    "operator": "Albemarle",
    "status": "producing",
    "significance": "Only active US lithium mine. Nevada brine operation since 1966.",
    "openPitOrUnderground": "in-situ"
  },
  {
    "id": "thacker-pass",
    "name": "Thacker Pass",
    "lat": 41.85,
    "lon": -118.15,
    "mineral": "Lithium",
    "country": "USA",
    "operator": "Lithium Americas",
    "status": "development",
    "significance": "Largest known lithium deposit in the US. Under development in Nevada.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "manono",
    "name": "Manono",
    "lat": -7.3,
    "lon": 27.41,
    "mineral": "Lithium",
    "country": "DRC",
    "operator": "AVZ Minerals",
    "status": "development",
    "significance": "World's largest hard-rock lithium deposit. DRC asset under development.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "mutanda",
    "name": "Mutanda",
    "lat": -10.78,
    "lon": 25.8,
    "mineral": "Cobalt",
    "country": "DRC",
    "operator": "Glencore",
    "status": "producing",
    "significance": "World's largest cobalt mine. ~25kt Co/yr when at full capacity.",
    "productionRank": "World #1 cobalt mine",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "tenke-fungurume",
    "name": "Tenke Fungurume",
    "lat": -10.61,
    "lon": 26.16,
    "mineral": "Cobalt",
    "country": "DRC",
    "operator": "CMOC",
    "status": "producing",
    "significance": "Major cobalt-copper producer. Chinese-owned. ~17kt Co/yr.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "kamoto",
    "name": "Kamoto (KOV)",
    "lat": -10.87,
    "lon": 25.55,
    "mineral": "Cobalt",
    "country": "DRC",
    "operator": "Glencore / Katanga Mining",
    "status": "producing",
    "significance": "Major DRC cobalt-copper underground mine.",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "bayan-obo",
    "name": "Bayan Obo",
    "lat": 41.76,
    "lon": 109.95,
    "mineral": "Rare Earths",
    "country": "China",
    "operator": "China Northern Rare Earth Group",
    "status": "producing",
    "significance": "World's largest rare earth mine. ~45% of global REE production from this single site.",
    "productionRank": "World #1 REE mine",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "mountain-pass",
    "name": "Mountain Pass",
    "lat": 35.47,
    "lon": -115.53,
    "mineral": "Rare Earths",
    "country": "USA",
    "operator": "MP Materials",
    "status": "producing",
    "significance": "Only significant rare earth mine and processor in the US. Strategic national asset.",
    "productionRank": "US #1 REE mine",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "mount-weld",
    "name": "Mount Weld",
    "lat": -28.86,
    "lon": 122.17,
    "mineral": "Rare Earths",
    "country": "Australia",
    "operator": "Lynas Rare Earths",
    "status": "producing",
    "significance": "Highest-grade rare earth deposit outside China. Key non-Chinese REE source.",
    "productionRank": "World #2 REE mine",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "southern-ion-adsorption",
    "name": "Southern China REE",
    "lat": 25.85,
    "lon": 114.93,
    "mineral": "Rare Earths",
    "country": "China",
    "operator": "Multiple Chinese operators",
    "status": "producing",
    "significance": "Jiangxi/Guangdong ion-adsorption clay deposits. Key source of heavy rare earths (dysprosium, terbium) critical for EV motors.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "kvanefjeld",
    "name": "Kvanefjeld",
    "lat": 60.96,
    "lon": -47,
    "mineral": "Rare Earths",
    "country": "Greenland",
    "operator": "Energy Transition Minerals",
    "status": "exploration",
    "significance": "World-class REE + uranium deposit in Greenland. Subject to Greenland political debate."
  },
  {
    "id": "weda-bay",
    "name": "Weda Bay / Halmahera",
    "lat": 0.47,
    "lon": 127.94,
    "mineral": "Nickel",
    "country": "Indonesia",
    "operator": "Tsingshan / Eramet",
    "status": "producing",
    "significance": "Largest nickel pig iron (NPI) production hub. Core of Indonesia's nickel dominance.",
    "productionRank": "Indonesia nickel #1 region",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "morowali",
    "name": "Morowali Industrial Park",
    "lat": -2.1,
    "lon": 121.9,
    "mineral": "Nickel",
    "country": "Indonesia",
    "operator": "Tsingshan Group (various)",
    "status": "producing",
    "significance": "Largest integrated nickel production hub globally. Drives ~50% of world's battery-grade nickel.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "norilsk-mine",
    "name": "Norilsk Complex",
    "lat": 69.33,
    "lon": 88.21,
    "mineral": "Nickel",
    "country": "Russia",
    "operator": "Nornickel",
    "status": "producing",
    "significance": "World's largest palladium mine and top nickel producer. Arctic Siberian site.",
    "productionRank": "World #1 palladium, #2 nickel",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "voiseys-bay",
    "name": "Voisey's Bay",
    "lat": 56.37,
    "lon": -62.08,
    "mineral": "Nickel",
    "country": "Canada",
    "operator": "Vale",
    "status": "producing",
    "significance": "High-grade nickel-cobalt-copper mine in Labrador. Strategic Canadian deposit.",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "goro",
    "name": "Goro (Vale Nouvelle-Cal\xE9donie)",
    "lat": -22.27,
    "lon": 167,
    "mineral": "Nickel",
    "country": "New Caledonia",
    "operator": "Prony Resources",
    "status": "producing",
    "significance": "Major laterite nickel operation. Battery-grade nickel and cobalt production.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "taganito",
    "name": "Taganito",
    "lat": 9.15,
    "lon": 125.77,
    "mineral": "Nickel",
    "country": "Philippines",
    "operator": "Sumitomo / DMCI",
    "status": "producing",
    "significance": "Key Philippine nickel laterite mine. Major Japanese nickel supply source.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "mogalakwena",
    "name": "Mogalakwena",
    "lat": -24.05,
    "lon": 28.76,
    "mineral": "Platinum",
    "country": "South Africa",
    "operator": "Anglo American Platinum",
    "status": "producing",
    "significance": "World's largest open-pit platinum mine. Bushveld Igneous Complex.",
    "productionRank": "World #1 open-pit PGM mine",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "marikana",
    "name": "Marikana / Rustenburg",
    "lat": -25.68,
    "lon": 27.38,
    "mineral": "Platinum",
    "country": "South Africa",
    "operator": "Sibanye-Stillwater",
    "status": "producing",
    "significance": "Major Bushveld Complex platinum operations. Historically significant labor site.",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "zimplats",
    "name": "Zimplats",
    "lat": -18.12,
    "lon": 30.45,
    "mineral": "Platinum",
    "country": "Zimbabwe",
    "operator": "Impala Platinum",
    "status": "producing",
    "significance": "Zimbabwe's largest mining company. World's third-largest PGM producer.",
    "openPitOrUnderground": "both"
  },
  {
    "id": "stillwater",
    "name": "Stillwater",
    "lat": 45.37,
    "lon": -109.93,
    "mineral": "Palladium",
    "country": "USA",
    "operator": "Sibanye-Stillwater",
    "status": "producing",
    "significance": "Only significant PGM mine in North America. Primary US palladium source.",
    "productionRank": "North America #1 PGM",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "pilbara",
    "name": "Pilbara Iron Ore (BHP)",
    "lat": -22.5,
    "lon": 119,
    "mineral": "Iron Ore",
    "country": "Australia",
    "operator": "BHP",
    "status": "producing",
    "significance": "BHP's Pilbara hub \u2014 world's most productive iron ore mining region. ~280Mt/yr.",
    "productionRank": "BHP Pilbara iron ore hub",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "pilbara-rio",
    "name": "Pilbara Iron Ore (Rio Tinto)",
    "lat": -22.7,
    "lon": 118.6,
    "mineral": "Iron Ore",
    "country": "Australia",
    "operator": "Rio Tinto",
    "status": "producing",
    "significance": "Rio Tinto's Pilbara operations \u2014 16 mines feeding 4 port facilities. ~330Mt/yr.",
    "productionRank": "World #1 iron ore producer (Rio)",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "carajas",
    "name": "Caraj\xE1s",
    "lat": -5.83,
    "lon": -50.61,
    "mineral": "Iron Ore",
    "country": "Brazil",
    "operator": "Vale",
    "status": "producing",
    "significance": "World's largest iron ore mine by proven reserves. Highest grade iron ore (~67% Fe).",
    "productionRank": "World #1 iron ore reserve",
    "openPitOrUnderground": "open-pit",
    "productionCapacity": "~180Mt/yr"
  },
  {
    "id": "sishen",
    "name": "Sishen",
    "lat": -27.79,
    "lon": 22.98,
    "mineral": "Iron Ore",
    "country": "South Africa",
    "operator": "Kumba Iron Ore (Anglo American)",
    "status": "producing",
    "significance": "Africa's largest iron ore mine. Major export source for European and Asian steel mills.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "kiruna",
    "name": "Kiruna",
    "lat": 67.85,
    "lon": 20.32,
    "mineral": "Iron Ore",
    "country": "Sweden",
    "operator": "LKAB",
    "status": "producing",
    "significance": "Europe's largest iron ore mine. Undergoing city relocation due to mine expansion.",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "mcarthur-river",
    "name": "McArthur River",
    "lat": 57.76,
    "lon": -105.03,
    "mineral": "Uranium",
    "country": "Canada",
    "operator": "Cameco",
    "status": "producing",
    "significance": "World's highest-grade uranium mine. 25x average uranium ore grade. Saskatchewan, Canada.",
    "productionRank": "World #1 by grade",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "cigar-lake",
    "name": "Cigar Lake",
    "lat": 57.67,
    "lon": -105.61,
    "mineral": "Uranium",
    "country": "Canada",
    "operator": "Cameco / Orano",
    "status": "producing",
    "significance": "World's largest high-grade uranium deposit currently in production.",
    "productionRank": "World #1 by production volume (high-grade)",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "kazakh-isu",
    "name": "Kazakhstan ISL Fields",
    "lat": 43.6,
    "lon": 65.4,
    "mineral": "Uranium",
    "country": "Kazakhstan",
    "operator": "Kazatomprom",
    "status": "producing",
    "significance": "Cluster of in-situ leaching uranium operations. Kazakhstan produces ~40% of world supply.",
    "productionRank": "World #1 uranium producer country",
    "openPitOrUnderground": "in-situ"
  },
  {
    "id": "olympic-dam",
    "name": "Olympic Dam",
    "lat": -30.44,
    "lon": 136.89,
    "mineral": "Uranium",
    "country": "Australia",
    "operator": "BHP",
    "status": "producing",
    "significance": "World's largest known uranium ore body. Also produces copper, gold, silver.",
    "productionRank": "World #1 uranium ore body",
    "openPitOrUnderground": "underground"
  },
  {
    "id": "rossing",
    "name": "R\xF6ssing",
    "lat": -22.45,
    "lon": 14.99,
    "mineral": "Uranium",
    "country": "Namibia",
    "operator": "China National Uranium Corp",
    "status": "producing",
    "significance": "One of the world's largest open-pit uranium mines. Chinese-owned since 2019.",
    "openPitOrUnderground": "open-pit"
  },
  {
    "id": "husab",
    "name": "Husab",
    "lat": -22.46,
    "lon": 15.18,
    "mineral": "Uranium",
    "country": "Namibia",
    "operator": "China General Nuclear Power",
    "status": "producing",
    "significance": "Second-largest uranium mine globally by production. 100% Chinese-owned.",
    "productionRank": "World #2 uranium mine",
    "openPitOrUnderground": "open-pit"
  }
];
var mining_sites_default = MINING_SITES;

// api/mcp/auth.ts
var import_ratelimit = __toESM(require_dist2(), 1);

// node_modules/@upstash/redis/chunk-IH7W44G6.mjs
var __defProp2 = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
var error_exports = {};
__export(error_exports, {
  UpstashError: () => UpstashError,
  UpstashJSONParseError: () => UpstashJSONParseError,
  UrlError: () => UrlError
});
var UpstashError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "UpstashError";
  }
};
var UrlError = class extends Error {
  constructor(url) {
    super(
      `Upstash Redis client was passed an invalid URL. You should pass a URL starting with https. Received: "${url}". `
    );
    this.name = "UrlError";
  }
};
var UpstashJSONParseError = class extends UpstashError {
  constructor(body, options) {
    const truncatedBody = body.length > 200 ? body.slice(0, 200) + "..." : body;
    super(`Unable to parse response body: ${truncatedBody}`, options);
    this.name = "UpstashJSONParseError";
  }
};
var MAX_BUFFER_SIZE = 1024 * 1024;

// node_modules/@upstash/redis/nodejs.mjs
var BUILD = /* @__PURE__ */ Symbol("build");
var TextFieldBuilder = class _TextFieldBuilder {
  _noTokenize;
  _noStem;
  _from;
  constructor(noTokenize = { noTokenize: false }, noStem = { noStem: false }, from = { from: null }) {
    this._noTokenize = noTokenize;
    this._noStem = noStem;
    this._from = from;
  }
  noTokenize() {
    return new _TextFieldBuilder({ noTokenize: true }, this._noStem, this._from);
  }
  noStem() {
    return new _TextFieldBuilder(this._noTokenize, { noStem: true }, this._from);
  }
  from(field) {
    return new _TextFieldBuilder(this._noTokenize, this._noStem, { from: field });
  }
  [BUILD]() {
    return {
      type: "TEXT",
      ...this._noTokenize.noTokenize ? { noTokenize: true } : {},
      ...this._noStem.noStem ? { noStem: true } : {},
      ...this._from.from ? { from: this._from.from } : {}
    };
  }
};
var NumericFieldBuilder = class _NumericFieldBuilder {
  type;
  _from;
  constructor(type, from = { from: null }) {
    this.type = type;
    this._from = from;
  }
  from(field) {
    return new _NumericFieldBuilder(this.type, { from: field });
  }
  [BUILD]() {
    return this._from.from ? {
      type: this.type,
      fast: true,
      from: this._from.from
    } : {
      type: this.type,
      fast: true
    };
  }
};
var BoolFieldBuilder = class _BoolFieldBuilder {
  _fast;
  _from;
  constructor(fast = { fast: false }, from = { from: null }) {
    this._fast = fast;
    this._from = from;
  }
  fast() {
    return new _BoolFieldBuilder({ fast: true }, this._from);
  }
  from(field) {
    return new _BoolFieldBuilder(this._fast, { from: field });
  }
  [BUILD]() {
    const hasFast = this._fast.fast;
    const hasFrom = Boolean(this._from.from);
    if (hasFast && hasFrom) {
      return {
        type: "BOOL",
        fast: true,
        from: this._from.from
      };
    }
    if (hasFast) {
      return {
        type: "BOOL",
        fast: true
      };
    }
    if (hasFrom) {
      return {
        type: "BOOL",
        from: this._from.from
      };
    }
    return { type: "BOOL" };
  }
};
var DateFieldBuilder = class _DateFieldBuilder {
  _fast;
  _from;
  constructor(fast = { fast: false }, from = { from: null }) {
    this._fast = fast;
    this._from = from;
  }
  fast() {
    return new _DateFieldBuilder({ fast: true }, this._from);
  }
  from(field) {
    return new _DateFieldBuilder(this._fast, { from: field });
  }
  [BUILD]() {
    const hasFast = this._fast.fast;
    const hasFrom = Boolean(this._from.from);
    if (hasFast && hasFrom) {
      return {
        type: "DATE",
        fast: true,
        from: this._from.from
      };
    }
    if (hasFast) {
      return {
        type: "DATE",
        fast: true
      };
    }
    if (hasFrom) {
      return {
        type: "DATE",
        from: this._from.from
      };
    }
    return { type: "DATE" };
  }
};
var KeywordFieldBuilder = class {
  [BUILD]() {
    return { type: "KEYWORD" };
  }
};
var FacetFieldBuilder = class {
  [BUILD]() {
    return { type: "FACET" };
  }
};
if (typeof atob === "undefined") {
  global.atob = (b64) => Buffer.from(b64, "base64").toString("utf8");
}

// api/_client-ip.js
var RATE_LIMIT_DEGRADED_HEADERS = Object.freeze({
  "X-RateLimit-Mode": "degraded",
  "Retry-After": "5"
});

// server/_shared/entitlement-check.ts
var ENV_PREFIX = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live" : "test";

// server/_shared/mcp-internal-hmac.ts
var INTERNAL_MCP_SIG_HEADER = "X-WM-MCP-Internal";
var INTERNAL_MCP_USER_ID_HEADER = "X-WM-MCP-User-Id";
var INTERNAL_MCP_NONCE_HEADER = "X-WM-MCP-Nonce";
var INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS = 30;
var INTERNAL_MCP_REPLAY_CACHE_TTL_SECONDS = 2 * INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS + 5;
async function sha256Hex2(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function canonicalQueryString(searchOrUrl) {
  let search;
  if (searchOrUrl instanceof URL) {
    search = searchOrUrl.search;
  } else if (typeof searchOrUrl === "string") {
    if (searchOrUrl.startsWith("http://") || searchOrUrl.startsWith("https://")) {
      try {
        search = new URL(searchOrUrl).search;
      } catch {
        return "";
      }
    } else {
      search = searchOrUrl;
    }
  } else {
    return "";
  }
  if (!search || search === "?") return "";
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  if (!trimmed) return "";
  const params = new URLSearchParams(trimmed);
  const entries = [];
  for (const [k, v] of params) entries.push([k, v]);
  entries.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}
function buildHmacPayload(args) {
  return `${args.ts}:${args.method.toUpperCase()}:${args.pathname}:${args.queryHash}:${args.bodyHash}:${args.userId}:${args.nonce}`;
}
async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmacSha256Base64Url(secret, payload) {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bufferToBase64Url(sig);
}
function makeInternalMcpNonce() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isValidInternalMcpNonce(nonce) {
  return /^[A-Za-z0-9_-]{16,128}$/.test(nonce);
}
async function signInternalMcpRequest(args) {
  if (!args.userId) throw new Error("signInternalMcpRequest: userId is required");
  if (!args.secret) throw new Error("signInternalMcpRequest: secret is required");
  const nonce = args.nonce ?? makeInternalMcpNonce();
  if (!isValidInternalMcpNonce(nonce)) throw new Error("signInternalMcpRequest: nonce must be 16-128 URL-safe characters");
  const url = args.url instanceof URL ? args.url : new URL(args.url);
  const ts = Math.floor(args.now ?? Date.now() / 1e3);
  const queryHash = await sha256Hex2(canonicalQueryString(url));
  const bodyHash = await sha256Hex2(await coerceBodyToString(args.body));
  const payload = buildHmacPayload({
    ts,
    method: args.method,
    pathname: url.pathname,
    queryHash,
    bodyHash,
    userId: args.userId,
    nonce
  });
  const sig = await hmacSha256Base64Url(args.secret, payload);
  return { signature: `${ts}.${sig}`, userId: args.userId, nonce, ts };
}
async function coerceBodyToString(body) {
  if (body == null) return "";
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return new TextDecoder().decode(body);
  if (body instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(body));
  if (body instanceof URLSearchParams) return body.toString();
  const G = globalThis;
  if (G.Blob && body instanceof G.Blob) {
    throw new Error("signInternalMcpRequest: unsupported body shape (Blob); pre-stringify before signing");
  }
  if (G.FormData && body instanceof G.FormData) {
    throw new Error("signInternalMcpRequest: unsupported body shape (FormData); pre-stringify before signing");
  }
  if (G.ReadableStream && body instanceof G.ReadableStream) {
    throw new Error("signInternalMcpRequest: unsupported body shape (ReadableStream); pre-stringify before signing");
  }
  throw new Error("signInternalMcpRequest: unsupported body shape; pre-stringify before signing");
}
function buildInternalMcpHeaders(signed) {
  return {
    [INTERNAL_MCP_SIG_HEADER]: signed.signature,
    [INTERNAL_MCP_USER_ID_HEADER]: signed.userId,
    [INTERNAL_MCP_NONCE_HEADER]: signed.nonce
  };
}

// server/_shared/usage-identity.ts
function hashKeySync(key) {
  let h1 = 2166136261;
  let h2 = 2166136261 ^ 2746401236;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 ^= c + 2654435761;
    h2 = Math.imul(h2, 16777619);
  }
  const lo = (h1 >>> 0).toString(36);
  const hi = (h2 >>> 0).toString(36);
  return `${hi}${lo}`;
}

// api/mcp/telemetry.ts
function telemetryEnabled() {
  const v = process.env.MCP_TELEMETRY;
  return v !== "false" && v !== "0";
}
function emitTelemetry(event, payload) {
  if (!telemetryEnabled()) return;
  try {
    console.log({ tag: event, ts: (/* @__PURE__ */ new Date()).toISOString(), ...payload });
  } catch {
  }
}
var MCP_TOOLCALL_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "tool",
  "auth_kind",
  "user_id",
  "latency_ms",
  "bytes_pre_jmespath",
  "bytes_post_jmespath",
  "jmespath_used",
  "jmespath_failed",
  "ok",
  "error_kind",
  "budget_exceeded"
]);
var MCP_TOOLS_LIST_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "tools_array_bytes",
  "tool_count",
  "client_user_agent"
]);
var MCP_RATE_LIMIT_HIT_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "principal_id",
  "dimension",
  "limit",
  "window_seconds"
]);
function principalIdForLog(context) {
  return context.kind === "env_key" ? hashKeySync(context.apiKey) : context.userId;
}

// api/mcp/auth.ts
async function buildAuthHeaders(context, method, url, body) {
  if (context.kind === "env_key" || context.kind === "user_key") {
    return { "X-WorldMonitor-Key": context.apiKey };
  }
  const secret = process.env.MCP_INTERNAL_HMAC_SECRET ?? "";
  if (!secret) {
    throw new Error("MCP_INTERNAL_HMAC_SECRET not configured");
  }
  const signed = await signInternalMcpRequest({
    method,
    url,
    body,
    userId: context.userId,
    secret
  });
  return buildInternalMcpHeaders(signed);
}

// api/mcp/registry/rpc-tools.ts
function clipBriefText(value, maxLen) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trim()}...` : text;
}
function normalizeBriefUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}
function normalizeBriefDate(value) {
  if (typeof value !== "string" && typeof value !== "number") return void 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : void 0;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function countryTermIndex(text, term) {
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) return -1;
  const match = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}(?=$|[^a-z0-9])`, "i").exec(text);
  return match ? match.index + (match[1] ?? "").length : -1;
}
function includesCountryTerm(text, term) {
  return countryTermIndex(text, term) !== -1;
}
function collectMcpBriefSources(items, maxSources = 6) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of items) {
    const url = normalizeBriefUrl(item.link ?? item.url);
    const title = clipBriefText(item.title, 160);
    const source = clipBriefText(item.source, 80);
    if (!url || !title || !source || seen.has(url)) continue;
    const publishedAt = normalizeBriefDate(item.publishedAt ?? item.pubDate ?? item.date);
    out.push(publishedAt ? { title, source, url, publishedAt } : { title, source, url });
    seen.add(url);
    if (out.length >= maxSources) break;
  }
  return out;
}
function briefSourceContextLines(sources) {
  return sources.map((source, index) => {
    const payload = source.publishedAt ? { title: source.title, source: source.source, url: source.url, publishedAt: source.publishedAt } : { title: source.title, source: source.source, url: source.url };
    return `Source [${index + 1}]: ${JSON.stringify(payload)}`;
  });
}
function countryBriefSearchTerms(countryCode) {
  const terms = [countryCode.toLowerCase()];
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode);
    if (name) terms.push(name.toLowerCase());
  } catch {
  }
  return [...new Set(terms.filter(Boolean))];
}
var PROCUREMENT_TOOL_DEFAULT_PAGE_SIZE = 10;
var PROCUREMENT_TOOL_MAX_PAGE_SIZE = 25;
function addProcurementStringParam(query, name, value) {
  if (typeof value === "string" && value.trim()) query.set(name, value.trim());
}
function procurementPageSize(value) {
  return Number.isInteger(value) && value > 0 ? Math.min(PROCUREMENT_TOOL_MAX_PAGE_SIZE, value) : PROCUREMENT_TOOL_DEFAULT_PAGE_SIZE;
}
function procurementAutomationThreshold(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}
function compactProcurementOpportunity(tender) {
  return {
    id: tender.id,
    source: tender.source,
    officialUrl: tender.officialUrl,
    countryCode: tender.countryCode,
    region: tender.region,
    title: tender.title,
    buyer: tender.buyer,
    publishedAt: tender.publishedAt,
    deadline: tender.deadline,
    status: tender.status,
    noticeType: tender.noticeType,
    money: tender.money,
    categoryCodes: tender.categoryCodes,
    sectors: tender.sectors,
    // This remains upstream evidence, not a claim about a caller's legal
    // ability to participate in a procurement process.
    participationMode: tender.participationMode,
    automationFit: tender.automationFit && {
      score: tender.automationFit.score,
      level: tender.automationFit.level,
      classificationVersion: tender.automationFit.classificationVersion,
      matchReasons: tender.automationFit.matchReasons
    }
  };
}
var RPC_TOOLS = [
  {
    name: "get_procurement_opportunities",
    _outputBudgetBytes: 65536,
    description: 'Search open global public-procurement opportunities through the canonical Pro route. Default output is 10 compact records (maximum 25), without descriptions or submission/eligibility payloads. automationFit is keyword relevance evidence only, never bidding eligibility; participationMode "unknown" remains unknown.',
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "One ISO 3166-1 alpha-2 country code." },
        countries: { type: "array", items: { type: "string" }, description: "Additional ISO 3166-1 alpha-2 country codes. Combined with country." },
        source: { type: "string", description: "Official source adapter, such as sam, ted, contracts-finder, canada-buys, gets, or world-bank." },
        query: { type: "string", description: "Case-insensitive text search across procurement titles and descriptions." },
        buyer: { type: "string", description: "Case-insensitive buyer or contracting-authority text." },
        deadline_from: { type: "string", description: "Include deadlines on or after this ISO-8601 timestamp." },
        deadline_to: { type: "string", description: "Include deadlines on or before this ISO-8601 timestamp." },
        sort: { type: "string", enum: ["newest", "closing_soon", "estimated_value", "relevance"], description: "Result ordering. Defaults to newest." },
        min_automation_score: { type: "integer", minimum: 1, description: "Optional positive keyword-relevance threshold. Non-integer or non-positive values are ignored; the canonical route clamps values above 100. This is not bidding-eligibility evidence." },
        page_size: { type: "integer", minimum: 1, maximum: PROCUREMENT_TOOL_MAX_PAGE_SIZE, description: "Records per call. Defaults to 10; capped at 25 to protect agent context." },
        cursor: { type: "string", description: "Opaque nextCursor from the prior result; keep the same filters and sort when continuing." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      required: ["opportunities", "nextCursor", "fetchedAt", "dataAvailable", "availability", "sourceStatuses", "total", "appliedFilters", "countryCoverage"],
      properties: {
        opportunities: { type: "array", items: { type: "object", properties: {
          id: { type: "string" },
          source: { type: "string" },
          officialUrl: { type: "string" },
          countryCode: { type: "string" },
          region: { type: "string" },
          title: { type: "string" },
          buyer: { type: "string" },
          publishedAt: { type: "string" },
          deadline: { type: "string" },
          status: { type: "string" },
          noticeType: { type: "string" },
          money: { type: "object", properties: { amount: { type: "number" }, currency: { type: "string" } } },
          categoryCodes: { type: "array", items: { type: "string" } },
          sectors: { type: "array", items: { type: "string" } },
          participationMode: { type: "string" },
          automationFit: { type: "object", properties: { score: { type: "number" }, level: { type: "string" }, classificationVersion: { type: "string" }, matchReasons: { type: "array", items: { type: "string" } } } }
        } } },
        nextCursor: { type: "string", description: "Opaque pagination cursor. An empty string means no further pages are available." },
        fetchedAt: { type: "string" },
        dataAvailable: { type: "boolean" },
        availability: { type: "string" },
        sourceStatuses: { type: "array", items: { type: "object" } },
        total: { type: "number" },
        appliedFilters: { type: "array", items: { type: "string" } },
        countryCoverage: { type: "string", description: "unknown means the requested country has not been observed in this snapshot, not that there are confirmed zero results." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params, base, context) => {
      const query = new URLSearchParams();
      addProcurementStringParam(query, "country", params.country);
      if (Array.isArray(params.countries)) {
        for (const country of params.countries) {
          if (typeof country === "string" && country.trim()) query.append("countries", country.trim());
        }
      }
      for (const [name, value] of Object.entries({
        source: params.source,
        query: params.query,
        buyer: params.buyer,
        deadline_from: params.deadline_from,
        deadline_to: params.deadline_to,
        sort: params.sort,
        cursor: params.cursor
      })) addProcurementStringParam(query, name, value);
      query.set("page_size", String(procurementPageSize(params.page_size)));
      const threshold = procurementAutomationThreshold(params.min_automation_score);
      if (threshold !== null) query.set("min_automation_score", String(threshold));
      const url = `${base}/api/economic/v1/list-global-tenders?${query}`;
      const auth = await buildAuthHeaders(context, "GET", url, null);
      const response = await fetch(url, {
        headers: { ...auth, "User-Agent": "worldmonitor-mcp-edge/1.0" },
        signal: AbortSignal.timeout(8e3)
      });
      if (!response.ok) throw new Error(`list-global-tenders HTTP ${response.status}`);
      const result = await response.json();
      return {
        opportunities: (result.tenders || []).map(compactProcurementOpportunity),
        nextCursor: result.nextCursor || "",
        fetchedAt: result.fetchedAt || "",
        dataAvailable: result.dataAvailable === true,
        availability: result.availability || "unavailable",
        sourceStatuses: result.sourceStatuses || [],
        total: typeof result.total === "number" ? result.total : 0,
        appliedFilters: result.appliedFilters || [],
        countryCoverage: result.countryCoverage || "unknown"
      };
    },
    _apiPaths: [
      "GET /api/economic/v1/list-global-tenders"
    ]
  },
  {
    name: "get_world_brief",
    _outputBudgetBytes: 65536,
    description: "AI-generated world intelligence brief. Fetches the latest geopolitical headlines along with their RSS article bodies and produces a grounded LLM-summarized brief. Supply an optional geo_context to focus on a region or topic.",
    inputSchema: {
      type: "object",
      properties: {
        geo_context: { type: "string", description: 'Optional focus context (e.g. "Middle East tensions", "US-China trade war")' }
      },
      required: []
    },
    // RPC tool: returns the raw body of /api/news/v1/summarize-article (LLM brief).
    outputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", description: "LLM-summarized geopolitical brief." },
        summary: { type: "string", description: "Alternate naming used by some upstream variants." },
        headlines: { type: "array", items: { type: "string" } },
        provider: { type: "string" },
        model: { type: "string" },
        generatedAt: { type: ["string", "number", "null"] },
        sources: {
          type: "array",
          description: "Original feed articles used as grounding inputs for this brief.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              source: { type: "string" },
              publishedAt: { type: "string" }
            }
          }
        }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    // MCP Apps (`io.modelcontextprotocol/ui`): links the tool to its interactive
    // ui:// app shell (rendered inline by an MCP-Apps host). Single source of
    // truth — the ui:// resource is registered in ../ui/registry.ts.
    _uiResourceUri: WORLD_BRIEF_UI_URI,
    _execute: async (params, base, context) => {
      const UA = "worldmonitor-mcp-edge/1.0";
      const digestUrl = `${base}/api/news/v1/list-feed-digest?variant=full&lang=en`;
      const digestAuth = await buildAuthHeaders(context, "GET", digestUrl, null);
      const digestRes = await fetch(digestUrl, {
        headers: { ...digestAuth, "User-Agent": UA },
        signal: AbortSignal.timeout(6e3)
      });
      if (!digestRes.ok) throw new Error(`feed-digest HTTP ${digestRes.status}`);
      const digest = await digestRes.json();
      const pairs = Object.values(digest.categories ?? {}).flatMap((cat) => cat.items ?? []).map((item) => ({
        title: item.title ?? "",
        snippet: item.snippet ?? "",
        source: item.source ?? "",
        link: item.link ?? item.url ?? "",
        publishedAt: item.publishedAt ?? item.pubDate ?? item.date
      })).filter((p) => p.title.length > 0).slice(0, 10);
      const headlines = pairs.map((p) => p.title);
      const bodies = pairs.map((p) => p.snippet);
      const sources = collectMcpBriefSources(pairs, 6);
      const briefUrl = `${base}/api/news/v1/summarize-article`;
      const briefBody = JSON.stringify({
        provider: "openrouter",
        headlines,
        bodies,
        mode: "brief",
        geoContext: String(params.geo_context ?? ""),
        variant: "full",
        lang: "en"
      });
      const briefAuth = await buildAuthHeaders(context, "POST", briefUrl, briefBody);
      const briefRes = await fetch(briefUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...briefAuth, "User-Agent": UA },
        body: briefBody,
        signal: AbortSignal.timeout(18e3)
      });
      if (!briefRes.ok) throw new Error(`summarize-article HTTP ${briefRes.status}`);
      const result = await briefRes.json();
      return { ...result, headlines, sources };
    },
    _apiPaths: [
      "GET /api/news/v1/list-feed-digest",
      "POST /api/news/v1/summarize-article"
    ]
  },
  {
    name: "get_country_brief",
    _outputBudgetBytes: 65536,
    description: "AI-generated per-country intelligence brief. Produces an LLM-analyzed geopolitical and economic assessment for the given country. Supports analytical frameworks for structured lenses.",
    inputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string", description: 'ISO 3166-1 alpha-2 country code, e.g. "US", "DE", "CN", "IR"' },
        framework: { type: "string", description: "Optional analytical framework instructions to shape the analysis lens (e.g. Ray Dalio debt cycle, PMESII-PT)" }
      },
      required: ["country_code"]
    },
    outputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string" },
        brief: { type: "string", description: "LLM-synthesized country intelligence brief." },
        framework: { type: "string" },
        generatedAt: { type: ["string", "number", "null"] },
        provider: { type: "string" },
        model: { type: "string" },
        sources: {
          type: "array",
          description: "Original feed articles used as grounding inputs for this brief.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              source: { type: "string" },
              publishedAt: { type: "string" }
            }
          }
        }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    // MCP Apps (`io.modelcontextprotocol/ui`): links the tool to its interactive
    // ui:// app shell. Single source of truth — registered in ../ui/registry.ts.
    _uiResourceUri: COUNTRY_BRIEF_UI_URI,
    _execute: async (params, base, context) => {
      const UA = "worldmonitor-mcp-edge/1.0";
      const countryCode = String(params.country_code ?? "").toUpperCase().slice(0, 2);
      let contextSnapshot = "";
      let sources = [];
      try {
        const digestUrl = `${base}/api/news/v1/list-feed-digest?variant=full&lang=en`;
        const digestAuth = await buildAuthHeaders(context, "GET", digestUrl, null);
        const digestRes = await fetch(digestUrl, {
          headers: { ...digestAuth, "User-Agent": UA },
          signal: AbortSignal.timeout(2e3)
        });
        if (digestRes.ok) {
          const digest = await digestRes.json();
          const allItems = Object.values(digest.categories ?? {}).flatMap((cat) => cat.items ?? []).filter((item) => typeof item.title === "string" && item.title.length > 0);
          const terms = countryBriefSearchTerms(countryCode);
          const countryItems = allItems.filter((item) => {
            const text = `${item.title ?? ""} ${item.snippet ?? ""}`.toLowerCase();
            return terms.some((term) => includesCountryTerm(text, term));
          });
          const groundingItems = (countryItems.length > 0 ? countryItems : allItems).slice(0, 15);
          sources = collectMcpBriefSources(groundingItems, 6);
          const sourceLines = sources.length > 0 ? ["Brief source articles:", ...briefSourceContextLines(sources)] : [];
          const headlineLines = groundingItems.map((item) => item.title ?? "").filter(Boolean);
          const contextLines = [...sourceLines, "Headlines:", ...headlineLines].join("\n");
          if (contextLines.trim()) contextSnapshot = contextLines.slice(0, 4e3);
        }
      } catch {
      }
      const briefUrl = `${base}/api/intelligence/v1/get-country-intel-brief`;
      const briefPayload = {
        country_code: countryCode,
        framework: String(params.framework ?? "")
      };
      if (contextSnapshot) briefPayload.context = contextSnapshot;
      const briefBody = JSON.stringify(briefPayload);
      const briefAuth = await buildAuthHeaders(context, "POST", briefUrl, briefBody);
      const res = await fetch(briefUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...briefAuth, "User-Agent": UA },
        body: briefBody,
        signal: AbortSignal.timeout(22e3)
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        let code = "";
        try {
          const error = JSON.parse(detail).error ?? "";
          code = (typeof error === "string" ? error : JSON.stringify(error)).slice(0, 120);
        } catch {
          code = detail.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
        }
        throw new Error(`get-country-intel-brief HTTP ${res.status}${code ? `: ${code}` : ""}`);
      }
      const result = await res.json();
      const resultSources = collectMcpBriefSources(Array.isArray(result.sources) ? result.sources : [], 6);
      return { ...result, sources: resultSources.length > 0 ? resultSources : sources };
    },
    // METHOD DRIFT: _execute POSTs above but OpenAPI declares only GET on this
    // path (verified against docs/api/IntelligenceService.openapi.json). The
    // gateway routes by path, not method, so POST works at runtime. We declare
    // GET here because OpenAPI is the parity test's source-of-truth — fixing
    // the spec to add POST (or migrating the handler to GET) is out of scope.
    _apiPaths: [
      "GET /api/intelligence/v1/get-country-intel-brief"
    ]
  },
  {
    name: "get_country_risk",
    _outputBudgetBytes: 262144,
    description: 'Structured risk intelligence for a specific country: Composite Instability Index (CII) score 0-100, component breakdown (unrest/conflict/security/news), travel advisory level, and OFAC sanctions exposure. Fast Redis read \u2014 no LLM. Use for quantitative risk screening or to answer "how risky is X right now?"',
    inputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string", description: 'ISO 3166-1 alpha-2 country code, e.g. "RU", "IR", "CN", "UA"' }
      },
      required: ["country_code"]
    },
    outputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string" },
        cii: { type: ["number", "null"], description: "Composite Instability Index 0-100." },
        components: {
          type: "object",
          properties: {
            unrest: { type: ["number", "null"] },
            conflict: { type: ["number", "null"] },
            security: { type: ["number", "null"] },
            news: { type: ["number", "null"] }
          }
        },
        travelAdvisory: { type: ["object", "string", "null"] },
        sanctionsExposure: { type: ["object", "array", "null"] }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    // MCP Apps (`io.modelcontextprotocol/ui`): buildPublicTool emits
    // _meta.ui.resourceUri from this, linking the tool to its interactive
    // ui:// app shell (rendered inline by an MCP-Apps host). Single source of
    // truth — the ui:// resource is registered in ../ui/registry.ts.
    _uiResourceUri: COUNTRY_RISK_UI_URI,
    _execute: async (params, base, context) => {
      const code = String(params.country_code ?? "").toUpperCase().slice(0, 2);
      const url = `${base}/api/intelligence/v1/get-country-risk?country_code=${encodeURIComponent(code)}`;
      const auth = await buildAuthHeaders(context, "GET", url, null);
      const res = await fetch(url, {
        headers: { ...auth, "User-Agent": "worldmonitor-mcp-edge/1.0" },
        signal: AbortSignal.timeout(8e3)
      });
      if (!res.ok) throw new Error(`get-country-risk HTTP ${res.status}`);
      return res.json();
    },
    _apiPaths: [
      "GET /api/intelligence/v1/get-country-risk"
    ]
  },
  {
    name: "get_consumer_prices",
    _outputBudgetBytes: 262144,
    description: "Per-country consumer-prices intelligence: 30-day overview, category-level inflation, retailer spread (essentials basket), top movers, and source freshness. Requires country_code (currently only 'ae' is seeded).",
    inputSchema: {
      type: "object",
      properties: {
        country_code: {
          type: "string",
          description: "ISO 3166-1 alpha-2 country code. Currently supported: AE (case-insensitive)."
        }
      },
      required: ["country_code"]
    },
    // Hybrid _execute — success path returns the envelope below; missing/unknown
    // country_code returns `{error: "..."}` instead (result-level user-input error).
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"] },
        stale: { type: "boolean" },
        country_code: { type: "string" },
        data: {
          type: "object",
          properties: {
            overview: { type: ["object", "null"] },
            categories: { type: ["object", "array", "null"] },
            movers: { type: ["object", "array", "null"] },
            retailerSpread: { type: ["object", "array", "null"] },
            freshness: { type: ["object", "null"] }
          }
        },
        error: { type: "string", description: "Present only on user-input failure (missing/unknown country_code)." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    // Hybrid _execute (not a pure cache tool) because the cache keys are
    // parameterised by country. Mirrors api/health.js::BOOTSTRAP_KEYS:55-59
    // exactly so the U7 Tier-3 parity test treats every key as covered.
    _coverageKeys: [
      "consumer-prices:overview:ae",
      "consumer-prices:categories:ae:30d",
      "consumer-prices:movers:ae:30d",
      "consumer-prices:retailer-spread:ae:essentials-ae",
      "consumer-prices:freshness:ae"
    ],
    _execute: async (params) => {
      if (!params.country_code || typeof params.country_code !== "string") {
        return { error: "country_code is required" };
      }
      const code = params.country_code.toLowerCase();
      if (!/^[a-z]{2}$/.test(code)) {
        return { error: 'country_code must be a two-letter ISO code (e.g. "ae")' };
      }
      if (!SUPPORTED_CONSUMER_PRICES_COUNTRIES.has(code)) {
        return { error: "Country not yet supported. Available: ae" };
      }
      const dataKeys = [
        `consumer-prices:overview:${code}`,
        `consumer-prices:categories:${code}:30d`,
        `consumer-prices:movers:${code}:30d`,
        `consumer-prices:retailer-spread:${code}:essentials-${code}`,
        `consumer-prices:freshness:${code}`
      ];
      const freshnessChecks = [
        { key: `seed-meta:consumer-prices:overview:${code}`, maxStaleMin: 1500 },
        // 25h = 24h cron + 1h grace
        { key: `seed-meta:consumer-prices:categories:${code}:30d`, maxStaleMin: 1500 },
        { key: `seed-meta:consumer-prices:movers:${code}:30d`, maxStaleMin: 1500 },
        { key: `seed-meta:consumer-prices:spread:${code}`, maxStaleMin: 1500 },
        // producer's actual key shape
        { key: `seed-meta:consumer-prices:freshness:${code}`, maxStaleMin: 1500 }
      ];
      const [dataResults, metaResults] = await Promise.all([
        Promise.all(dataKeys.map((k) => readJsonFromUpstash(k))),
        Promise.all(freshnessChecks.map((c) => readJsonFromUpstash(c.key)))
      ]);
      if (dataResults.every((v) => v === null || v === void 0)) {
        throw new Error("cache_all_null");
      }
      const { cached_at, stale } = evaluateFreshness(freshnessChecks, metaResults);
      return {
        cached_at,
        stale,
        country_code: code,
        data: {
          overview: dataResults[0],
          categories: dataResults[1],
          movers: dataResults[2],
          retailerSpread: dataResults[3],
          freshness: dataResults[4]
        }
      };
    },
    // Hybrid tool covers the consumer-prices domain via direct Redis reads
    // of the same keys the per-method handlers expose via the API. The
    // OpenAPI ops listed here read parameterized keys (the audit's
    // manual-mapping case); this MCP tool wraps the 'ae'-instance equivalent.
    //
    // NOTE: `get-consumer-price-basket-series` is NOT covered here — that
    // handler reads `consumer-prices:basket-series:${market}:${basket}:${range}`
    // which is a separate parameterized time-series key, NOT in this tool's
    // `_coverageKeys`. Excluded as `deferred-to-future-tool` in
    // tests/mcp-api-parity.test.mjs until a future expanded_consumer_prices
    // tool exposes the basket-series time series.
    _apiPaths: [
      "GET /api/consumer-prices/v1/get-consumer-price-freshness",
      "GET /api/consumer-prices/v1/get-consumer-price-overview",
      "GET /api/consumer-prices/v1/list-consumer-price-categories",
      "GET /api/consumer-prices/v1/list-consumer-price-movers",
      "GET /api/consumer-prices/v1/list-retailer-price-spreads"
    ]
  },
  {
    name: "get_airspace",
    _outputBudgetBytes: 262144,
    description: 'Live ADS-B aircraft over a country. Returns civilian flights (OpenSky) and identified military aircraft with callsigns, positions, altitudes, and headings. Answers questions like "how many planes are over the UAE right now?" or "are there military aircraft over Taiwan?"',
    inputSchema: {
      type: "object",
      properties: {
        country_code: {
          type: "string",
          description: 'ISO 3166-1 alpha-2 country code (e.g. "AE", "US", "GB", "JP")'
        },
        type: {
          type: "string",
          enum: ["all", "civilian", "military"],
          description: "Filter: all flights (default), civilian only, or military only"
        }
      },
      required: ["country_code"]
    },
    outputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string" },
        bounding_box: { type: "object", properties: {
          sw_lat: { type: "number" },
          sw_lon: { type: "number" },
          ne_lat: { type: "number" },
          ne_lon: { type: "number" }
        } },
        civilian_count: { type: "number" },
        military_count: { type: "number" },
        civilian_flights: { type: "array", items: { type: "object", properties: {
          callsign: { type: "string" },
          icao24: { type: "string" },
          lat: { type: "number" },
          lon: { type: "number" },
          altitude_m: { type: ["number", "null"] },
          speed_kts: { type: ["number", "null"] },
          heading_deg: { type: ["number", "null"] },
          on_ground: { type: "boolean" }
        } } },
        military_flights: { type: "array", items: { type: "object", properties: {
          callsign: { type: "string" },
          hex_code: { type: "string" },
          aircraft_type: { type: "string" },
          aircraft_model: { type: "string" },
          operator: { type: "string" },
          operator_country: { type: "string" },
          lat: { type: ["number", "null"] },
          lon: { type: ["number", "null"] },
          altitude: { type: ["number", "null"] },
          heading: { type: ["number", "null"] },
          speed: { type: ["number", "null"] },
          is_interesting: { type: "boolean" },
          note: { type: "string" }
        } } },
        partial: { type: "boolean", description: "True if one of the two upstream sources failed." },
        warnings: { type: "array", items: { type: "string" } },
        source: { type: "string" },
        updated_at: { type: "string" },
        error: { type: "string", description: "Present only on unknown country_code." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _execute: async (params, base, context) => {
      const code = String(params.country_code ?? "").toUpperCase().slice(0, 2);
      const bbox = country_bboxes_default[code];
      if (!bbox) return { error: `Unknown country code: ${code}. Use ISO 3166-1 alpha-2 (e.g. "AE", "US", "GB").` };
      const [sw_lat, sw_lon, ne_lat, ne_lon] = bbox;
      const type = String(params.type ?? "all");
      const UA = "worldmonitor-mcp-edge/1.0";
      const bboxQ = `sw_lat=${sw_lat}&sw_lon=${sw_lon}&ne_lat=${ne_lat}&ne_lon=${ne_lon}`;
      const civUrl = `${base}/api/aviation/v1/track-aircraft?${bboxQ}`;
      const milUrl = `${base}/api/military/v1/list-military-flights?${bboxQ}&page_size=100`;
      const civAuth = type === "military" ? null : await buildAuthHeaders(context, "GET", civUrl, null);
      const milAuth = type === "civilian" ? null : await buildAuthHeaders(context, "GET", milUrl, null);
      const [civResult, milResult] = await Promise.allSettled([
        type === "military" || !civAuth ? Promise.resolve(null) : fetch(civUrl, { headers: { ...civAuth, "User-Agent": UA }, signal: AbortSignal.timeout(8e3) }).then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))),
        type === "civilian" || !milAuth ? Promise.resolve(null) : fetch(milUrl, { headers: { ...milAuth, "User-Agent": UA }, signal: AbortSignal.timeout(8e3) }).then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      ]);
      const civOk = type === "military" || civResult.status === "fulfilled";
      const milOk = type === "civilian" || milResult.status === "fulfilled";
      if (!civOk && !milOk) throw new Error("Airspace data unavailable: both civilian and military sources failed");
      const civ = civResult.status === "fulfilled" ? civResult.value : null;
      const mil = milResult.status === "fulfilled" ? milResult.value : null;
      const warnings = [];
      if (!civOk) warnings.push("civilian ADS-B data unavailable");
      if (!milOk) warnings.push("military flight data unavailable");
      const civilianFlights = (civ?.positions ?? []).slice(0, 100).map((p) => ({
        callsign: p.callsign,
        icao24: p.icao24,
        lat: p.lat,
        lon: p.lon,
        altitude_m: p.altitude_m,
        speed_kts: p.ground_speed_kts,
        heading_deg: p.track_deg,
        on_ground: p.on_ground
      }));
      const militaryFlights = (mil?.flights ?? []).slice(0, 100).map((f) => ({
        callsign: f.callsign,
        hex_code: f.hex_code,
        aircraft_type: f.aircraft_type,
        aircraft_model: f.aircraft_model,
        operator: f.operator,
        operator_country: f.operator_country,
        lat: f.location?.latitude,
        lon: f.location?.longitude,
        altitude: f.altitude,
        heading: f.heading,
        speed: f.speed,
        is_interesting: f.is_interesting,
        ...f.note ? { note: f.note } : {}
      }));
      return {
        country_code: code,
        bounding_box: { sw_lat, sw_lon, ne_lat, ne_lon },
        civilian_count: civilianFlights.length,
        military_count: militaryFlights.length,
        ...type !== "military" && { civilian_flights: civilianFlights },
        ...type !== "civilian" && { military_flights: militaryFlights },
        ...warnings.length > 0 && { partial: true, warnings },
        source: civ?.source ?? "opensky",
        updated_at: civ?.updated_at ? new Date(civ.updated_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
      };
    },
    _apiPaths: [
      "GET /api/aviation/v1/track-aircraft",
      "GET /api/military/v1/list-military-flights"
    ]
  },
  {
    name: "get_maritime_activity",
    _outputBudgetBytes: 262144,
    description: "Live vessel traffic and maritime disruptions for a country's waters. Returns AIS density zones (ships-per-day, intensity score), dark ship events, and chokepoint congestion from AIS tracking.",
    inputSchema: {
      type: "object",
      properties: {
        country_code: {
          type: "string",
          description: 'ISO 3166-1 alpha-2 country code (e.g. "AE", "SA", "JP", "EG")'
        }
      },
      required: ["country_code"]
    },
    outputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string" },
        bounding_box: { type: "object", properties: {
          sw_lat: { type: "number" },
          sw_lon: { type: "number" },
          ne_lat: { type: "number" },
          ne_lon: { type: "number" }
        } },
        snapshot_at: { type: "string" },
        total_zones: { type: "number" },
        total_disruptions: { type: "number" },
        density_zones: { type: "array", items: { type: "object", properties: {
          name: { type: "string" },
          intensity: { type: ["number", "null"] },
          ships_per_day: { type: ["number", "null"] },
          delta_pct: { type: ["number", "null"] },
          note: { type: "string" }
        } } },
        disruptions: { type: "array", items: { type: "object", properties: {
          name: { type: "string" },
          type: { type: "string" },
          severity: { type: "string" },
          dark_ships: { type: ["number", "null"] },
          vessel_count: { type: ["number", "null"] },
          region: { type: "string" },
          description: { type: "string" }
        } } },
        error: { type: "string", description: "Present only on unknown country_code." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _execute: async (params, base, context) => {
      const code = String(params.country_code ?? "").toUpperCase().slice(0, 2);
      const bbox = country_bboxes_default[code];
      if (!bbox) return { error: `Unknown country code: ${code}. Use ISO 3166-1 alpha-2 (e.g. "AE", "SA", "JP").` };
      const [sw_lat, sw_lon, ne_lat, ne_lon] = bbox;
      const url = `${base}/api/maritime/v1/get-vessel-snapshot`;
      const auth = await buildAuthHeaders(context, "GET", url, null);
      const res = await fetch(url, {
        headers: { ...auth, "User-Agent": "worldmonitor-mcp-edge/1.0" },
        signal: AbortSignal.timeout(8e3)
      });
      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 200);
        throw new Error(`get-vessel-snapshot HTTP ${res.status}${detail ? ` \u2014 ${detail}` : ""}`);
      }
      const data = await res.json();
      const snap = data.snapshot ?? {};
      const PAD_DEG = 3;
      const inCountryBbox = (loc) => {
        const lat = loc?.latitude ?? 0;
        const lon = loc?.longitude ?? 0;
        if (lat === 0 && lon === 0) return false;
        if (lat < sw_lat - PAD_DEG || lat > ne_lat + PAD_DEG) return false;
        const lo = sw_lon - PAD_DEG;
        const hi = (sw_lon > ne_lon ? ne_lon + 360 : ne_lon) + PAD_DEG;
        if (hi - lo >= 360) return true;
        const wraps = lo < -180 || hi > 180;
        const loN = lo < -180 ? lo + 360 : lo;
        const hiN = hi > 180 ? hi - 360 : hi;
        return wraps ? lon >= loN || lon <= hiN : lon >= loN && lon <= hiN;
      };
      const zones = (snap.densityZones ?? []).filter((z) => inCountryBbox(z.location));
      const disruptions = (snap.disruptions ?? []).filter((d) => inCountryBbox(d.location));
      return {
        country_code: code,
        bounding_box: { sw_lat, sw_lon, ne_lat, ne_lon },
        snapshot_at: snap.snapshotAt ? new Date(snap.snapshotAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
        total_zones: zones.length,
        total_disruptions: disruptions.length,
        density_zones: zones.map((z) => ({
          name: z.name,
          intensity: z.intensity,
          ships_per_day: z.shipsPerDay,
          delta_pct: z.deltaPct,
          ...z.note ? { note: z.note } : {}
        })),
        disruptions: disruptions.map((d) => ({
          name: d.name,
          type: d.type,
          severity: d.severity,
          dark_ships: d.darkShips,
          vessel_count: d.vesselCount,
          region: d.region,
          description: d.description
        }))
      };
    },
    _apiPaths: [
      "GET /api/maritime/v1/get-vessel-snapshot"
    ]
  },
  {
    name: "analyze_situation",
    _outputBudgetBytes: 65536,
    description: "AI geopolitical situation analysis (DeductionPanel). Provide a query and optional geo-political context; returns an LLM-powered analytical deduction with confidence and supporting signals.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: 'The question or situation to analyze, e.g. "What are the implications of the Taiwan strait escalation for semiconductor supply chains?"' },
        context: { type: "string", description: "Optional additional geo-political context to include in the analysis" },
        framework: { type: "string", description: "Optional analytical framework instructions to shape the analysis lens (e.g. Ray Dalio debt cycle, PMESII-PT, Porter's Five Forces)" }
      },
      required: ["query"]
    },
    outputSchema: {
      type: "object",
      properties: {
        deduction: { type: "string", description: "LLM-generated analytical deduction." },
        analysis: { type: "string", description: "Alternate naming for the body." },
        confidence: { type: ["number", "string", "null"] },
        signals: { type: ["array", "object", "null"] },
        framework: { type: "string" },
        generatedAt: { type: ["string", "number", "null"] },
        provider: { type: "string" },
        model: { type: "string" }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _execute: async (params, base, context) => {
      const url = `${base}/api/intelligence/v1/deduct-situation`;
      const body = JSON.stringify({ query: String(params.query ?? ""), geoContext: String(params.context ?? ""), framework: String(params.framework ?? "") });
      const auth = await buildAuthHeaders(context, "POST", url, body);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth, "User-Agent": "worldmonitor-mcp-edge/1.0" },
        body,
        signal: AbortSignal.timeout(25e3)
      });
      if (!res.ok) throw new Error(`deduct-situation HTTP ${res.status}`);
      return res.json();
    },
    _apiPaths: [
      "POST /api/intelligence/v1/deduct-situation"
    ]
  },
  {
    name: "generate_forecasts",
    _outputBudgetBytes: 65536,
    description: "Generate live AI geopolitical and economic forecasts. Unlike get_forecast_predictions (pre-computed cache), this calls the forecasting model directly for fresh probability estimates. Note: slower than cache tools.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: 'Forecast domain: "geopolitical", "economic", "military", "climate", or empty for all domains' },
        region: { type: "string", description: 'Geographic region filter, e.g. "Middle East", "Europe", "Asia Pacific", or empty for global' }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        forecasts: { type: "array", items: { type: "object", properties: {
          domain: { type: "string" },
          region: { type: "string" },
          probability: { type: ["number", "null"] },
          title: { type: "string" },
          rationale: { type: "string" }
        } } },
        generatedAt: { type: ["string", "number", "null"] },
        provider: { type: "string" },
        model: { type: "string" }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _execute: async (params, base, context) => {
      const url = `${base}/api/forecast/v1/get-forecasts`;
      const body = JSON.stringify({ domain: String(params.domain ?? ""), region: String(params.region ?? "") });
      const auth = await buildAuthHeaders(context, "POST", url, body);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth, "User-Agent": "worldmonitor-mcp-edge/1.0" },
        body,
        signal: AbortSignal.timeout(25e3)
      });
      if (!res.ok) throw new Error(`get-forecasts HTTP ${res.status}`);
      return res.json();
    },
    _apiPaths: []
  },
  {
    name: "search_flights",
    _outputBudgetBytes: 262144,
    description: 'Search Google Flights for real-time flight options between two airports on a specific date. Returns available flights with prices, stops, airline, and segment details. Use IATA airport codes (e.g. "JFK", "LHR", "DXB").',
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: 'IATA code for the departure airport, e.g. "JFK"' },
        destination: { type: "string", description: 'IATA code for the arrival airport, e.g. "LHR"' },
        departure_date: { type: "string", description: "Departure date in YYYY-MM-DD format" },
        return_date: { type: "string", description: "Return date in YYYY-MM-DD format for round trips (optional)" },
        cabin_class: { type: "string", description: 'Cabin class: "economy", "premium_economy", "business", or "first" (optional, default economy)' },
        max_stops: { type: "string", description: 'Max stops: "0" or "non_stop" for nonstop, "1" or "one_stop" for max one stop, or omit for any (optional)' },
        passengers: { type: "number", description: "Number of passengers (1-9, default 1)" },
        sort_by: { type: "string", description: 'Sort order: "price" (cheapest), "duration", "departure", or "arrival" (optional)' }
      },
      required: ["origin", "destination", "departure_date"]
    },
    // Proxies SerpAPI Google Flights. Shape mirrors that upstream's JSON
    // envelope — keep schema permissive on field types since SerpAPI rotates.
    outputSchema: {
      type: "object",
      properties: {
        flights: { type: "array", items: { type: "object", properties: {
          price: { type: ["number", "string", "null"] },
          currency: { type: "string" },
          stops: { type: ["number", "null"] },
          airline: { type: "string" },
          total_duration: { type: ["number", "string", "null"] },
          segments: { type: "array", items: { type: "object" } }
        } } },
        search_metadata: { type: ["object", "null"] },
        error: { type: "string", description: "Present when upstream returned a usable error message." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _execute: async (params, base, context) => {
      const qs = new URLSearchParams({
        origin: String(params.origin ?? ""),
        destination: String(params.destination ?? ""),
        departure_date: String(params.departure_date ?? ""),
        ...params.return_date ? { return_date: String(params.return_date) } : {},
        // Default to economy when the LLM omits cabin_class. The relay /
        // upstream SerpAPI returns ZERO flights for some popular routes
        // (e.g. JFK→LHR) when cabin_class is unset, even though the tool
        // description advertises "default economy". Diagnosis: live probe
        // showed empty `flights` with no error AND no degraded flag; adding
        // `cabin_class=economy` to the same call returned 10+ real flights.
        // This restores the advertised contract.
        cabin_class: String(params.cabin_class ?? "economy"),
        ...params.max_stops ? { max_stops: String(params.max_stops) } : {},
        ...params.sort_by ? { sort_by: String(params.sort_by) } : {},
        passengers: String(Math.max(1, Math.min(Number(params.passengers ?? 1), 9)))
      });
      const url = `${base}/api/aviation/v1/search-google-flights?${qs}`;
      const auth = await buildAuthHeaders(context, "GET", url, null);
      const res = await fetch(url, {
        headers: { ...auth, "User-Agent": "worldmonitor-mcp-edge/1.0" },
        signal: AbortSignal.timeout(25e3)
      });
      if (!res.ok) throw new Error(`search-google-flights HTTP ${res.status}`);
      return res.json();
    },
    _apiPaths: [
      "GET /api/aviation/v1/search-google-flights"
    ]
  },
  {
    name: "search_flight_prices_by_date",
    _outputBudgetBytes: 262144,
    description: "Search Google Flights date-grid pricing across a date range. Returns cheapest prices for each departure date between two airports. Useful for finding the cheapest day to fly. Use IATA airport codes.",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: 'IATA code for the departure airport, e.g. "JFK"' },
        destination: { type: "string", description: 'IATA code for the arrival airport, e.g. "LHR"' },
        start_date: { type: "string", description: "Start of the date range in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End of the date range in YYYY-MM-DD format" },
        is_round_trip: { type: "boolean", description: "Whether to search round-trip prices (default false). Requires trip_duration when true." },
        trip_duration: { type: "number", description: "Trip duration in days \u2014 required when is_round_trip is true (e.g. 7 for a one-week trip)" },
        cabin_class: { type: "string", description: 'Cabin class: "economy", "premium_economy", "business", or "first" (optional, default economy)' },
        passengers: { type: "number", description: "Number of passengers (1-9, default 1)" },
        sort_by_price: { type: "boolean", description: "Sort results by price ascending (default false, sorts by date)" }
      },
      required: ["origin", "destination", "start_date", "end_date"]
    },
    outputSchema: {
      type: "object",
      properties: {
        prices: { type: "array", items: { type: "object", properties: {
          date: { type: "string" },
          price: { type: ["number", "string", "null"] },
          currency: { type: "string" }
        } } },
        search_metadata: { type: ["object", "null"] },
        error: { type: "string" }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _execute: async (params, base, context) => {
      const qs = new URLSearchParams({
        origin: String(params.origin ?? ""),
        destination: String(params.destination ?? ""),
        start_date: String(params.start_date ?? ""),
        end_date: String(params.end_date ?? ""),
        is_round_trip: String(params.is_round_trip ?? false),
        ...params.trip_duration ? { trip_duration: String(params.trip_duration) } : {},
        // Mirror search_flights: default to economy when omitted. Same
        // upstream-empty-on-missing-cabin-class issue.
        cabin_class: String(params.cabin_class ?? "economy"),
        sort_by_price: String(params.sort_by_price ?? false),
        passengers: String(Math.max(1, Math.min(Number(params.passengers ?? 1), 9)))
      });
      const url = `${base}/api/aviation/v1/search-google-dates?${qs}`;
      const auth = await buildAuthHeaders(context, "GET", url, null);
      const res = await fetch(url, {
        headers: { ...auth, "User-Agent": "worldmonitor-mcp-edge/1.0" },
        signal: AbortSignal.timeout(25e3)
      });
      if (!res.ok) throw new Error(`search-google-dates HTTP ${res.status}`);
      return res.json();
    },
    _apiPaths: [
      "GET /api/aviation/v1/search-google-dates"
    ]
  },
  {
    name: "get_commodity_geo",
    _outputBudgetBytes: 262144,
    description: "Global mining sites with coordinates, operator, mineral type, and production status. Covers 71 major mines spanning gold, silver, copper, lithium, uranium, coal, and other minerals worldwide.",
    inputSchema: {
      type: "object",
      properties: {
        mineral: { type: "string", description: 'Filter by mineral type (e.g. "Gold", "Copper", "Lithium")' },
        country: { type: "string", description: 'Filter by country name (e.g. "Australia", "Chile")' }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      required: ["sites", "total"],
      properties: {
        sites: { type: "array", items: { type: "object", properties: {
          id: { type: "string" },
          name: { type: "string" },
          lat: { type: "number" },
          lon: { type: "number" },
          mineral: { type: "string" },
          country: { type: "string" },
          operator: { type: "string" },
          status: { type: "string" },
          significance: { type: "string" },
          annualOutput: { type: "string" },
          productionRank: { type: "number" },
          openPitOrUnderground: { type: "string" }
        } } },
        total: { type: "number" }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      let sites = mining_sites_default;
      if (params.mineral) sites = sites.filter((s) => s.mineral === String(params.mineral));
      if (params.country) sites = sites.filter((s) => s.country.toLowerCase().includes(String(params.country).toLowerCase()));
      return { sites, total: sites.length };
    },
    _apiPaths: []
  },
  {
    // describe_tool (v1.5.0) — on-demand escape hatch for the full
    // uncompressed tool definition. tools/list (default) emits each tool's
    // description compressed to ≤TOOL_DESCRIPTION_MAX_BYTES (first sentence
    // or byte-truncated); the LLM calls describe_tool with a tool_name to
    // get the full v1.4.0-shape tool object — same public shape, just with
    // long-form text in `description`. Uses the SAME buildPublicTool helper
    // as tools/list so the two surfaces can never drift.
    name: "describe_tool",
    _outputBudgetBytes: 8192,
    description: "Return the full uncompressed definition of one tool by name. Use when the compressed tools/list entry is ambiguous about behaviour or argument semantics.",
    inputSchema: {
      type: "object",
      properties: {
        tool_name: { type: "string", description: "Exact tool name from tools/list." }
      },
      required: ["tool_name"]
    },
    // Returns either the public Tool shape (see PublicToolShape) or one of the
    // two structured error envelopes — both are tools/call results, not JSON-RPC errors.
    outputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
        annotations: { type: "object" },
        error: { type: "string", enum: ["missing_tool_name", "unknown_tool"], description: "Present only on user-input failure." },
        hint: { type: "string" },
        requested: { type: "string" },
        available: { type: "array", items: { type: "string" } }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const name = params.tool_name;
      if (typeof name !== "string" || name.length === 0) {
        return { error: "missing_tool_name", hint: "Pass tool_name as a non-empty string matching a tool from tools/list." };
      }
      const tool = TOOL_REGISTRY.find((t) => t.name === name);
      if (!tool) {
        return {
          error: "unknown_tool",
          requested: name,
          available: TOOL_REGISTRY.map((t) => t.name).sort()
        };
      }
      return buildPublicTool(tool, { compressDescriptions: false });
    },
    _apiPaths: []
  }
];

// api/mcp/registry/index.ts
var TOOL_REGISTRY = [...CACHE_TOOLS, ...RPC_TOOLS];
var SUMMARY_SCHEMA = {
  type: "boolean",
  description: "Return counts + 3-item samples instead of full lists. Useful when you only need shape/size or want to budget context before drilling in."
};
for (const tool of TOOL_REGISTRY) {
  const props = tool.inputSchema.properties;
  if (props && "jmespath" in props) {
    throw new Error(`api/mcp/registry/index.ts: tool "${tool.name}" declares its own 'jmespath' property \u2014 collides with universal JMESPATH_SCHEMA injection. Remove the per-tool declaration.`);
  }
  if (tool._execute === void 0 && props && "summary" in props) {
    throw new Error(`api/mcp/registry/index.ts: cache tool "${tool.name}" declares its own 'summary' property \u2014 collides with universal SUMMARY_SCHEMA injection. Remove the per-tool declaration.`);
  }
}
function buildPublicTool(tool, opts) {
  const isCacheTool = tool._execute === void 0;
  const clonedProperties = {};
  for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
    clonedProperties[key] = structuredClone(value);
  }
  if (isCacheTool) {
    clonedProperties.summary = structuredClone(SUMMARY_SCHEMA);
  }
  clonedProperties.jmespath = structuredClone(JMESPATH_SCHEMA);
  const description = opts.compressDescriptions ? compressDescription(tool.description, TOOL_DESCRIPTION_MAX_BYTES) : tool.description;
  const publicTool = {
    name: tool.name,
    description,
    inputSchema: {
      type: tool.inputSchema.type,
      properties: clonedProperties,
      required: [...tool.inputSchema.required]
    },
    // Deep-clone for the same reason as inputSchema.properties — mutating the
    // returned object must not corrupt the module-level outputSchema literal.
    outputSchema: structuredClone(tool.outputSchema),
    // Per-tool annotations declared on each registry entry (v1.7.0).
    // Deep-cloned so a mutating client can't poison the registry literal —
    // matches the inputSchema.properties + outputSchema treatment above.
    annotations: structuredClone(tool.annotations)
  };
  if (tool._uiResourceUri) {
    publicTool._meta = {
      ui: { resourceUri: tool._uiResourceUri },
      "ui/resourceUri": tool._uiResourceUri
    };
  }
  return publicTool;
}
var TOOL_LIST_RESPONSE = TOOL_REGISTRY.map((tool) => buildPublicTool(tool, { compressDescriptions: true }));
var TOOL_LIST_BYTES = utf8ByteLength(JSON.stringify(TOOL_LIST_RESPONSE));

// api/mcp/dispatch.ts
async function executeTool(tool, params = {}) {
  const reads = tool._cacheKeys.map((k) => readJsonFromUpstash(k));
  const freshnessChecks = tool._freshnessChecks?.length ? tool._freshnessChecks : [{ key: tool._seedMetaKey, maxStaleMin: tool._maxStaleMin }];
  const metaReads = freshnessChecks.map((check) => readJsonFromUpstash(check.key));
  const [results, metas] = await Promise.all([Promise.all(reads), Promise.all(metaReads)]);
  const { cached_at, stale } = evaluateFreshness(freshnessChecks, metas);
  if (tool._cacheKeys.length > 0 && results.every((v) => v === null || v === void 0)) {
    throw new Error("cache_all_null");
  }
  const data = {};
  const NON_LABEL = /^(v\d+|\d+|stale|sebuf)$/;
  tool._cacheKeys.forEach((key, i) => {
    const parts = key.split(":");
    let label = "";
    for (let idx = parts.length - 1; idx >= 0; idx--) {
      const seg = parts[idx] ?? "";
      if (!NON_LABEL.test(seg)) {
        label = seg;
        break;
      }
    }
    data[label || (parts[0] ?? key)] = results[i];
  });
  let result = data;
  if (tool._postFilter) {
    try {
      result = tool._postFilter(structuredClone(data), params);
    } catch (err) {
      captureSilentError(err, {
        tags: { route: "api/mcp", step: "post-filter", tool: tool.name },
        fingerprint: mcpErrorFingerprint("post-filter", tool.name, err)
      });
      result = data;
    }
  }
  if (argBool(params.summary)) result = summarizeData(result);
  return { cached_at, stale, data: result };
}
async function dispatchToolsCall(req, context, deps, body, corsHeaders, ctx) {
  const id = body.id ?? null;
  const p = body.params;
  if (!p || typeof p.name !== "string") {
    return rpcError(id, -32602, "Invalid params: missing tool name", corsHeaders);
  }
  const tool = TOOL_REGISTRY.find((t) => t.name === p.name);
  if (!tool) {
    return rpcError(id, -32602, `Unknown tool: ${p.name}`, corsHeaders);
  }
  const isMetadataTool = p.name === "describe_tool";
  if ((context.kind === "pro" || context.kind === "user_key") && !isMetadataTool) {
    const reservation = await reserveQuota(context.userId, deps.redisPipeline);
    if (!reservation.ok) {
      if (reservation.reason === "cap-exceeded") {
        return new Response(
          JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32029, message: `Daily MCP quota exceeded (${PRO_DAILY_QUOTA_LIMIT}/day). Resets at next UTC midnight.` } }),
          { status: 429, headers: withMcpNoStore({ "Content-Type": "application/json", "Retry-After": String(secondsUntilUtcMidnight()), ...corsHeaders }) }
        );
      }
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32603, message: "Service temporarily unavailable, retry in a moment." } }),
        { status: 503, headers: withMcpNoStore({ "Content-Type": "application/json", "Retry-After": "5", ...corsHeaders }) }
      );
    }
  }
  const jmespathArg = p.arguments?.jmespath;
  const jmespathUsed = typeof jmespathArg === "string" && jmespathArg.length > 0;
  const tStart = Date.now();
  try {
    let result;
    if (tool._execute) {
      const baseUrl = new URL(req.url).origin;
      result = await tool._execute(p.arguments ?? {}, baseUrl, context);
    } else {
      result = await executeTool(tool, p.arguments ?? {});
    }
    const { text, failed } = applyJmespath(result, jmespathArg);
    const latencyMs = Date.now() - tStart;
    const textBytes = utf8ByteLength(text);
    const budget = tool._outputBudgetBytes;
    const budgetExceeded = textBytes > budget;
    if (telemetryEnabled()) {
      let bytesPre;
      if (jmespathUsed) {
        try {
          const preStr = JSON.stringify(result);
          bytesPre = utf8ByteLength(preStr === void 0 ? "null" : preStr);
        } catch {
          bytesPre = -1;
        }
      } else {
        bytesPre = textBytes;
      }
      emitTelemetry("mcp.toolcall", {
        tool: tool.name,
        auth_kind: context.kind,
        user_id: principalIdForLog(context),
        latency_ms: latencyMs,
        bytes_pre_jmespath: bytesPre,
        bytes_post_jmespath: textBytes,
        jmespath_used: jmespathUsed,
        jmespath_failed: failed ?? null,
        ok: true,
        budget_exceeded: budgetExceeded
      });
    }
    if (budgetExceeded) {
      const hint = jmespathUsed ? "Response still exceeds tool output budget after JMESPath projection. Use a more selective expression to project fewer fields, or apply tool-level filters to narrow the result set." : "Response exceeds tool output budget. Use the jmespath argument to project only the fields you need, or apply filters to narrow the result set.";
      return rpcOk(id, { content: [{ type: "text", text: JSON.stringify({
        _budget_exceeded: true,
        budget_bytes: budget,
        actual_bytes: textBytes,
        hint
      }) }] }, corsHeaders);
    }
    return rpcOk(id, { content: [{ type: "text", text }] }, corsHeaders);
  } catch (err) {
    const latencyMs = Date.now() - tStart;
    const message = err instanceof Error ? err.message : String(err);
    const isClient4xx = /HTTP 4\d\d\b/.test(message);
    const log = isClient4xx ? console.warn : console.error;
    log("[mcp] tool execution error:", err);
    captureSilentError(err, {
      tags: { route: "api/mcp", step: "tool-execution", tool: tool.name },
      ctx,
      // Split the api/mcp catch-all (WORLDMONITOR-T8) into per-tool,
      // per-status groups — see api/mcp/error-fingerprint.ts.
      fingerprint: mcpErrorFingerprint("tool-execution", tool.name, err),
      ...isClient4xx ? { level: "warning" } : {}
    });
    emitTelemetry("mcp.toolcall", {
      tool: tool.name,
      auth_kind: context.kind,
      user_id: principalIdForLog(context),
      latency_ms: latencyMs,
      bytes_pre_jmespath: 0,
      bytes_post_jmespath: 0,
      jmespath_used: jmespathUsed,
      jmespath_failed: null,
      ok: false,
      error_kind: isClient4xx ? "client_4xx" : "server_error",
      budget_exceeded: false
    });
    return rpcError(id, -32603, "Internal error: data fetch failed", corsHeaders);
  }
}

// api/mcp/resources/slugs.ts
var CHOKEPOINT_SLUGS = Object.freeze({
  "suez": "suez",
  "strait-of-malacca": "malacca",
  "strait-of-hormuz": "hormuz",
  "bab-el-mandeb": "bab",
  "panama-canal": "panama",
  "taiwan-strait": "taiwan",
  "cape-of-good-hope": "cape",
  "strait-of-gibraltar": "gibraltar",
  "bosphorus": "bosphorus",
  "korea-strait": "korea",
  "dover-strait": "dover",
  "kerch-strait": "kerch",
  "lombok-strait": "lombok"
});

// api/mcp/resources/index.ts
var MARKET_FRESHNESS_CHECK = { key: "seed-meta:market:stocks", maxStaleMin: 30 };
async function readMarketFreshness() {
  const meta = await readJsonFromUpstash(MARKET_FRESHNESS_CHECK.key).catch(() => null);
  const { cached_at, stale } = evaluateFreshness([MARKET_FRESHNESS_CHECK], [meta]);
  return JSON.stringify({ cached_at, stale });
}
var PUBLIC_RESOURCE_REGISTRY = [
  {
    uri: "worldmonitor://seed-meta/freshness",
    name: "Seed-Meta Freshness",
    description: "Cache-freshness probe for the high-cadence market-data bootstrap pipeline. Returns ONLY the envelope (cached_at + stale) \u2014 no quote payload, no auth, no quota. Use this as a cheap health check to detect a stuck seeder. v1 covers market freshness only; an aggregate freshness resource spanning energy + maritime + risk feeds is a follow-up if customers ask.",
    mimeType: "application/json",
    read: readMarketFreshness
  }
];
var TEMPLATE_RESOURCE_REGISTRY = [
  {
    uriTemplate: "worldmonitor://countries/{iso2}/risk",
    name: "Country Risk",
    description: 'Composite Instability Index (CII) score 0\u2013100 with unrest/conflict/security/news components, travel-advisory level, and OFAC sanctions exposure for a single ISO 3166-1 alpha-2 country. URI param {iso2} is lowercase alpha-2 (e.g. "de", "us", "ir").',
    mimeType: "application/json",
    tool: "get_country_risk",
    // RPC tool — wrap freshness against the regional-snapshot-canonical
    // risk-scores seed-meta key (30min budget matches the upstream cadence).
    freshnessWrap: { seedMetaKey: "seed-meta:intelligence:risk-scores", maxStaleMin: 30 },
    paramExtractor: (uri) => {
      if (!uri.startsWith("worldmonitor://countries/")) return null;
      const m = /^worldmonitor:\/\/countries\/([a-z]{2})\/risk$/.exec(uri);
      const iso2 = m?.[1];
      if (!iso2) {
        return {
          ok: false,
          reason: "Expected worldmonitor://countries/{iso2}/risk where {iso2} is lowercase ISO 3166-1 alpha-2."
        };
      }
      return { ok: true, args: { country_code: iso2.toUpperCase() } };
    }
  },
  {
    uriTemplate: "worldmonitor://chokepoints/{slug}/status",
    name: "Chokepoint Status",
    description: "Maritime chokepoint transit summary: today total / tanker / cargo counts, week-over-week change, risk level, incident count, disruption percentage, and risk narrative. URI param {slug} is one of the hand-curated kebab-case identifiers (suez, strait-of-malacca, strait-of-hormuz, bab-el-mandeb, panama-canal, taiwan-strait, cape-of-good-hope, strait-of-gibraltar, bosphorus, korea-strait, dover-strait, kerch-strait, lombok-strait).",
    mimeType: "application/json",
    tool: "get_chokepoint_status",
    paramExtractor: (uri) => {
      if (!uri.startsWith("worldmonitor://chokepoints/")) return null;
      const m = /^worldmonitor:\/\/chokepoints\/([a-z][a-z0-9-]*)\/status$/.exec(uri);
      const slug = m?.[1];
      if (!slug) {
        return {
          ok: false,
          reason: "Expected worldmonitor://chokepoints/{slug}/status where {slug} is a hand-curated kebab-case identifier."
        };
      }
      const matcher = CHOKEPOINT_SLUGS[slug];
      if (!matcher) {
        const known = Object.keys(CHOKEPOINT_SLUGS).join(", ");
        return { ok: false, reason: `Unknown chokepoint slug "${slug}". Known slugs: [${known}].` };
      }
      return { ok: true, args: { chokepoint: matcher } };
    }
  },
  {
    uriTemplate: "worldmonitor://markets/{symbol}/quote",
    name: "Market Quote",
    description: 'Single-symbol quote slice from the market-data bootstrap cache. URI param {symbol} is the uppercase ticker (e.g. "AAPL", "GC=F", "BTC-USD"). Matches equity / commodity / crypto / Gulf / sector / ETF-flow tickers \u2014 same case-insensitive matcher as get_market_data({symbols: [...]}).',
    mimeType: "application/json",
    tool: "get_market_data",
    paramExtractor: (uri) => {
      if (!uri.startsWith("worldmonitor://markets/")) return null;
      const m = /^worldmonitor:\/\/markets\/([A-Z][A-Z0-9.=-]{0,15})\/quote$/.exec(uri);
      const symbol = m?.[1];
      if (!symbol) {
        return {
          ok: false,
          reason: 'Expected worldmonitor://markets/{symbol}/quote where {symbol} is an uppercase ticker (e.g. "AAPL", "GC=F", "BTC-USD").'
        };
      }
      return { ok: true, args: { symbols: [symbol], asset_class: ["equity", "commodity", "crypto", "gulf", "etf", "sectors"] } };
    }
  }
];
var RESOURCE_LIST_RESPONSE = PUBLIC_RESOURCE_REGISTRY.map((r) => ({
  uri: r.uri,
  name: r.name,
  description: r.description,
  mimeType: r.mimeType
}));
var RESOURCE_TEMPLATE_LIST_RESPONSE = TEMPLATE_RESOURCE_REGISTRY.map((r) => ({
  uriTemplate: r.uriTemplate,
  name: r.name,
  description: r.description,
  mimeType: r.mimeType
}));
var PUBLIC_RESOURCE_URIS = new Set(PUBLIC_RESOURCE_REGISTRY.map((r) => r.uri));
function isPublicResourceUri(uri) {
  return typeof uri === "string" && PUBLIC_RESOURCE_URIS.has(uri);
}
async function buildPublicResourceResponse(body, corsHeaders) {
  const outerId = body.id ?? null;
  const params = body.params;
  if (!params || typeof params.uri !== "string") {
    return rpcError(outerId, -32602, "Invalid params: missing resource uri", corsHeaders);
  }
  const def = PUBLIC_RESOURCE_REGISTRY.find((r) => r.uri === params.uri);
  if (!def) {
    return rpcError(outerId, -32602, `Unknown public resource uri "${params.uri}".`, corsHeaders);
  }
  let text;
  try {
    text = await def.read();
  } catch {
    return rpcError(outerId, -32603, "Internal error: resource reader failed", corsHeaders);
  }
  return rpcOk(
    outerId,
    { contents: [{ uri: def.uri, mimeType: def.mimeType, text }] },
    corsHeaders
  );
}
async function buildResourceResponse(req, context, deps, body, corsHeaders, ctx) {
  const outerId = body.id ?? null;
  const params = body.params;
  if (!params || typeof params.uri !== "string") {
    return rpcError(outerId, -32602, "Invalid params: missing resource uri", corsHeaders);
  }
  const uri = params.uri;
  let matched = null;
  let lastReason = null;
  for (const def of TEMPLATE_RESOURCE_REGISTRY) {
    const r = def.paramExtractor(uri);
    if (r === null) continue;
    if (!r.ok) {
      lastReason = r.reason;
      break;
    }
    matched = { def, args: r.args };
    break;
  }
  if (!matched) {
    const msg = lastReason ?? `Unknown resource uri "${uri}". Issue resources/list (concrete resources) and resources/templates/list (parameterised URI templates) to discover the supported URI shapes.`;
    return rpcError(outerId, -32602, msg, corsHeaders);
  }
  const innerBody = {
    id: "__resources_read__",
    params: { name: matched.def.tool, arguments: matched.args }
  };
  const dispatched = await dispatchToolsCall(req, context, deps, innerBody, corsHeaders, ctx);
  const innerBodyParsed = await dispatched.json();
  if (innerBodyParsed.error) {
    const errorHeaders = withMcpNoStore({ "Content-Type": "application/json", ...corsHeaders });
    const retryAfter = dispatched.headers.get("Retry-After");
    if (retryAfter !== null) errorHeaders["Retry-After"] = retryAfter;
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id: outerId, error: innerBodyParsed.error }),
      { status: dispatched.status, headers: errorHeaders }
    );
  }
  const innerText = innerBodyParsed.result?.content?.[0]?.text;
  if (typeof innerText !== "string") {
    return rpcError(outerId, -32603, "Internal error: resource dispatcher returned no text payload", corsHeaders);
  }
  let wrappedText;
  if (matched.def.freshnessWrap) {
    let rawPayload;
    try {
      rawPayload = JSON.parse(innerText);
    } catch {
      return rpcError(outerId, -32603, "Internal error: resource payload was not valid JSON", corsHeaders);
    }
    if (rawPayload !== null && typeof rawPayload === "object" && !Array.isArray(rawPayload) && ("_budget_exceeded" in rawPayload || "_jmespath_error" in rawPayload)) {
      wrappedText = innerText;
    } else {
      const { seedMetaKey, maxStaleMin } = matched.def.freshnessWrap;
      const meta = await readJsonFromUpstash(seedMetaKey).catch(() => null);
      const { cached_at, stale } = evaluateFreshness(
        [{ key: seedMetaKey, maxStaleMin }],
        [meta]
      );
      const merged = rawPayload !== null && typeof rawPayload === "object" && !Array.isArray(rawPayload) ? { cached_at, stale, ...rawPayload } : { cached_at, stale, data: rawPayload };
      wrappedText = JSON.stringify(merged);
    }
  } else {
    wrappedText = innerText;
  }
  return rpcOk(
    outerId,
    {
      contents: [{ uri, mimeType: matched.def.mimeType, text: wrappedText }]
    },
    corsHeaders
  );
}
export {
  PUBLIC_RESOURCE_REGISTRY,
  RESOURCE_LIST_RESPONSE,
  RESOURCE_TEMPLATE_LIST_RESPONSE,
  TEMPLATE_RESOURCE_REGISTRY,
  buildPublicResourceResponse,
  buildResourceResponse,
  isPublicResourceUri
};
