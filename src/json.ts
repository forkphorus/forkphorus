namespace P.json {
  /**
   * This is a custom JSON parser to support certain older Scratch projects with non-standard JSON files.
   * This parser is not particularly fast, bug tested, or standards compliant.
   * Use JSON.parse first.
   * 
   * The choice not to use `eval()` here is intentional.
   * 
   * Non-standard extensions:
   *  - Support for [-]Infinity
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
      throw new SyntaxError(`JSONParser: ${message} (Line ${line} Column ${column})`);
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
        case '0': case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9': case '-':
          return this.parseNumber();
        default: return this.parseWord();
      }
    }

    private parseWord(): any {
      if (this.peek(4, 0) === 'null') {
        for (var i = 0; i < 4; i++) this.next();
        return null;
      }
      if (this.peek(4, 0) === 'true') {
        for (var i = 0; i < 4; i++) this.next();
        return true;
      }
      if (this.peek(5, 0) === 'false') {
        for (var i = 0; i < 5; i++) this.next();
        return false;
      }

      // Non-standard extensions
      if (this.peek(8, 0) === 'Infinity') {
        for (var i = 0; i < 8; i++) this.next();
        return Infinity;
      }
      if (this.peek(9, 0) === '-Infinity') {
        for (var i = 0; i < 9; i++) this.next();
        return -Infinity;
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
        if (/[\d\.e+-]/i.test(this.peek())) {
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
            case '"': result += '"'; break;
            case '/': result += '/'; break;
            case '\\': result += '\\'; break;
            case 'b': result += '\b'; break;
            case 'f': result += '\f'; break;
            case 'n': result += '\n'; break;
            case 'r': result += '\r'; break;
            case 't': result += '\t'; break;
            case 'u': {
              let hexString = '';
              for (var i = 0; i < 4; i++) {
                this.next();
                const char = this.char();
                if (!/[0-9a-f]/i.test(char)) {
                  this.error('Invalid hex code: ' + char);
                }
                hexString += char;
              }
              const hexNumber = Number.parseInt(hexString, 16);
              const letter = String.fromCharCode(hexNumber);
              result += letter;
              break;
            }
            default: this.error('Invalid escape code: \\' + this.char());
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
      
      const result = Object.create(null);
      while (true) {
        this.skipWhitespace();
        const key = this.parseString();

        this.skipWhitespace();
        this.expect(':');

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
   * Parse a JSON string. Has special support for the non-standard things that some Scratch 2 Scratch projects contain.
   * @param source JSON-like string
   */
  export function parse(source: string): any {
    if (!/^\s*{/.test(source)) {
      throw new Error('The input does not seem to be a JSON object');
    }
    try {
      return JSON.parse(source);
    } catch (firstError) {
      console.warn('JSON.parse failed. Trying alternative parser', firstError);
      try {
        const parser = new JSONParser(source);
        return parser.parse();
      } catch (secondError) {
        console.warn('Alternative parser failed', secondError);
        // Prefer to throw the JSON.parse error as our JSONParser error messages may not always make sense
        throw firstError;
      }
    }
  }
}