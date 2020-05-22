namespace P.json {
  /**
   * This is a custom JSON parser to support certain older Scratch projects with non-standard JSON files.
   * This parser is not particularly fast, bug tested, or standards compliant. Always prefer JSON.parse
   * 
   * Non-standard extensions:
   *  - Support for Infinity
   *  - Support for NaN
   */
  class JSONParser {
    private index: number = 0;

    constructor(private readonly source: string) {

    }

    parse(): any {
      return this.parseValue();
    }

    private lineInfo() {
      let line = 0;
      let column = 0;
      for (var i = 0; i < this.index; i++) {
        if (this.source[i] === '\n') {
          line++;
          column = 0;
        } else {
          column++;
        }
      }
      return { line: line + 1, column: column + 1};
    }

    private error(message: string): never {
      const { line, column } = this.lineInfo();
      throw new Error(`JSONParser: ${message} (Line ${line} Column ${column})`);
    }

    private char(): string {
      return this.charAt(this.index);
    }

    private charAt(index: number): string {
      if (index >= this.source.length) {
        this.error('Unexpected end of input');
      }
      return this.source[index];
    }

    private next(): void {
      this.index++;
    }

    private expect(char: string): void {
      if (this.char() !== char) {
        this.error(`Expected '${char}' but found '${this.char()}'`);
      }
      this.next();
    }

    private peek(length=1, offset=1): string {
      if (length === 1) return this.charAt(this.index + offset);
      let result = '';
      for (var i = 0; i < length; i++) {
        result += this.charAt(this.index + offset + i);
      }
      return result;
    }

    private skipWhitespace() {
      while (/\s/.test(this.char())) {
        this.next();
      }
    }

    private parseValue(): any {
      this.skipWhitespace();
      const char = this.char();

      switch (char) {
        case '"': return this.parseString();
        case '{': return this.parseObject();
        case '[': return this.parseList();
        case 't':
        case 'f': return this.parseBoolean();
        case '0': case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9': case '-':
          return this.parseNumber();
        default: return this.parseWord();
      }
    }

    private parseWord(): any {
      if (this.peek(4, 0) === 'null') {
        for (var i = 0; i < 4; i++) this.next();
        return Infinity;
      }

      // Non-standard extensions
      if (this.peek(8, 0) === 'Infinity') {
        for (var i = 0; i < 8; i++) this.next();
        return Infinity;
      }
      if (this.peek(3, 0) === 'NaN') {
        for (var i = 0; i < 3; i++) this.next();
        return NaN;
      }

      this.error(`Unknown word (starts with ${this.char()})`);
    }

    private parseNumber(): number {
      let number = '';
      while (true) {
        number += this.char();
        if (/[\d\.e+-]/.test(this.peek())) {
          this.next();
        } else {
          break;
        }
      }
      this.next();

      const value = +number;
      if (Number.isNaN(value)) {
        this.error('Not a number: ' + number);
      }

      return value;
    }

    private parseBoolean(): boolean {
      if (this.peek(4, 0) === 'true') {
        for (var i = 0; i < 4; i++) this.next();
        return true;
      } else if (this.peek(5, 0) === 'false') {
        for (var i = 0; i < 5; i++) this.next();
        return false;
      } else {
        this.error('Unknown boolean: ' + this.char());
      }
    }

    private parseString(): string {
      this.expect('"');
      let result = '';

      if (this.char() === '"') {
        this.next();
        return '';
      }

      while (true) {
        const char = this.char();
        if (char === '\\') {
          this.next();
          switch (this.char()) {
            case 'r': result += '\r'; break;
            case 'n': result += '\n'; break;
            case 't': result += '\t'; break;
            case '/': result += '/'; break;
            case '\\': result += '\\'; break;
            default: this.error('Some escape codes are not supported by this JSON parser.');
          }
        } else {
          result += char;
        }
        if (this.peek() === '"') {
          break;
        }
        this.next();
      }

      this.next();
      this.expect('"');
      return result;
    }

    private parseList(): any[] {
      this.expect('[');

      this.skipWhitespace();
      if (this.char() === ']') {
        this.next();
        return [];
      }

      const result: any[] = [];
      while (true) {
        this.skipWhitespace();
        const value = this.parseValue();
        result.push(value);
        this.skipWhitespace();

        if (this.char() === ']') {
          break;
        }

        this.expect(',');
      }

      this.expect(']');
      return result;
    }

    private parseObject(): object {
      this.expect('{');

      this.skipWhitespace();
      if (this.char() === '}') {
        this.next();
        return {};
      }
      
      const result = {};
      while (true) {
        this.skipWhitespace();
        const key = this.parseString();

        this.skipWhitespace();
        this.expect(':');
        this.skipWhitespace();

        const value = this.parseValue();
        result[key] = value;

        this.skipWhitespace();
        if (this.char() === '}') {
          break;
        }

        this.expect(',');
      }

      this.expect('}');
      return result;
    }
  }

  /**
   * Parse a JSON string. Has special support for some of the non-standard things that some older Scratch projects contain.
   * @param source JSON-like string
   */
  export function parse(source: string): any {
    if (!/^\s*{/.test(source)) {
      // The file does not look like JSON so don't attempt to parse it
      throw new Error('The input does not seem to be a JSON object');
    }
    try {
      // Try JSON.parse
      return JSON.parse(source);
    } catch (firstError) {
      console.warn('JSON.parse failed. Trying alternative parser', firstError);
      const parser = new JSONParser(source);
      try {
        return parser.parse();
      } catch (secondError) {
        console.warn('Alternative parser failed', secondError);
        // Prefer to throw the JSON.parse error as our JSONParser error messages may not always make sense
        throw firstError;
      }
    }
  }
}