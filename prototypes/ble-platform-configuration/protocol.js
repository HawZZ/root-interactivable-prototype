(function attachBLEProto() {
  'use strict';

  var RESULT_SUCCESS = 100000;
  var MAX_PDU_BYTES = 2048;
  var MAX_VALUE_BYTES = 127;
  var CID_BY_OPERATION = Object.freeze({
    read: 0x01,
    write: 0x02,
    invoke: 0x03,
    report: 0x04,
    event: 0x05
  });
  var MESSAGE_TYPE = 0x7b;
  var SELECTOR_TYPE = 0x01;
  var RESULT_TYPE = 0x7f;
  var PROPERTY_MIN_ADDRESS = 0x01;
  var SELECTABLE_MAX_ADDRESS = 0x7a;
  var SELECTOR_FIELD_MIN_ADDRESS = 0x02;
  var INTEGER_TYPES = Object.freeze({
    u8: { signed: false, bits: 8, width: 1 },
    u16: { signed: false, bits: 16, width: 2 },
    u32: { signed: false, bits: 32, width: 4 },
    u64: { signed: false, bits: 64, width: 8 },
    i8: { signed: true, bits: 8, width: 1 },
    i16: { signed: true, bits: 16, width: 2 },
    i32: { signed: true, bits: 32, width: 4 },
    i64: { signed: true, bits: 64, width: 8 }
  });
  var FLOAT_TYPES = Object.freeze({
    f32: { bits: 32, width: 4 },
    f64: { bits: 64, width: 8 }
  });
  var DECIMAL_PATTERN = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
  var CONSTRAINT_RULE_KEYS = Object.freeze([
    'minimum',
    'maximum',
    'step',
    'stepOrigin',
    'allowedValues'
  ]);
  var hasOwn = Object.prototype.hasOwnProperty;

  function error(code, message, row) {
    var err = new Error(message);
    err.name = 'BLEProtoError';
    err.code = code;
    if (row !== undefined) err.row = row;
    return err;
  }

  function fail(code, message, row) {
    throw error(code, message, row);
  }

  function requireObject(value, code, message) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail(code, message);
    }
  }

  function requireInteger(value, min, max, code, message) {
    if (!Number.isInteger(value) || value < min || value > max) {
      fail(code, message);
    }
    return value;
  }

  function plainDecimalFromNumber(value) {
    var text = String(value);
    if (!/e/i.test(text)) return text;
    var negative = text.charAt(0) === '-';
    if (negative) text = text.slice(1);
    var exponentParts = text.toLowerCase().split('e');
    var mantissa = exponentParts[0];
    var exponent = Number(exponentParts[1]);
    var pieces = mantissa.split('.');
    var fractionLength = pieces.length === 2 ? pieces[1].length : 0;
    var digits = pieces.join('');
    var point = digits.length - fractionLength + exponent;
    var plain;
    if (point <= 0) {
      plain = '0.' + '0'.repeat(-point) + digits;
    } else if (point >= digits.length) {
      plain = digits + '0'.repeat(point - digits.length);
    } else {
      plain = digits.slice(0, point) + '.' + digits.slice(point);
    }
    return (negative ? '-' : '') + plain;
  }

  function parseDecimal(value, code, label) {
    var text;
    if (typeof value === 'bigint') {
      text = value.toString();
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail(code, label + ' must be a finite decimal value');
      text = plainDecimalFromNumber(value);
    } else if (typeof value === 'string') {
      text = value;
    } else {
      fail(code, label + ' must be a finite decimal number or string');
    }
    if (!DECIMAL_PATTERN.test(text)) {
      fail(code, label + ' must be a plain finite decimal string');
    }
    var negative = text.charAt(0) === '-';
    var unsigned = negative ? text.slice(1) : text;
    var pieces = unsigned.split('.');
    var fraction = pieces.length === 2 ? pieces[1] : '';
    var coefficient = BigInt(pieces[0] + fraction);
    if (negative) coefficient = -coefficient;
    return { coefficient: coefficient, scale: fraction.length };
  }

  function normalizeDecimal(decimal) {
    var coefficient = decimal.coefficient;
    var scale = decimal.scale;
    while (scale > 0 && coefficient % 10n === 0n) {
      coefficient /= 10n;
      scale -= 1;
    }
    if (coefficient === 0n) scale = 0;
    return { coefficient: coefficient, scale: scale };
  }

  function decimalToString(decimal) {
    var normalized = normalizeDecimal(decimal);
    var negative = normalized.coefficient < 0n;
    var digits = (negative ? -normalized.coefficient : normalized.coefficient).toString();
    if (normalized.scale === 0) return (negative ? '-' : '') + digits;
    while (digits.length <= normalized.scale) digits = '0' + digits;
    var split = digits.length - normalized.scale;
    return (negative ? '-' : '') + digits.slice(0, split) + '.' + digits.slice(split);
  }

  function alignDecimals(left, right) {
    var scale = Math.max(left.scale, right.scale);
    var leftFactor = 10n ** BigInt(scale - left.scale);
    var rightFactor = 10n ** BigInt(scale - right.scale);
    return {
      left: left.coefficient * leftFactor,
      right: right.coefficient * rightFactor,
      scale: scale
    };
  }

  function compareDecimals(left, right) {
    var aligned = alignDecimals(left, right);
    if (aligned.left < aligned.right) return -1;
    if (aligned.left > aligned.right) return 1;
    return 0;
  }

  function subtractDecimals(left, right) {
    var aligned = alignDecimals(left, right);
    return { coefficient: aligned.left - aligned.right, scale: aligned.scale };
  }

  function multiplyDecimals(left, right) {
    return {
      coefficient: left.coefficient * right.coefficient,
      scale: left.scale + right.scale
    };
  }

  function addDecimals(left, right) {
    var aligned = alignDecimals(left, right);
    return { coefficient: aligned.left + aligned.right, scale: aligned.scale };
  }

  function divideDecimals(numerator, denominator) {
    if (denominator.coefficient === 0n) {
      fail('FIELD_VALUE_TYPE', 'Decimal division by zero');
    }
    return {
      numerator: numerator.coefficient * (10n ** BigInt(denominator.scale)),
      denominator: denominator.coefficient * (10n ** BigInt(numerator.scale))
    };
  }

  function parseCSV(text) {
    if (typeof text !== 'string') {
      fail('CSV_TEXT_TYPE', 'CSV input must be a string', 0);
    }

    var source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    var records = [];
    var index = 0;
    var line = 1;

    while (index < source.length) {
      var startLine = line;
      var fields = [];
      var field = '';
      var state = 'start';
      var hadComma = false;
      var quotedAny = false;
      var ended = false;

      while (index < source.length && !ended) {
        var ch = source[index];

        if (state === 'quoted') {
          if (ch === '"') {
            if (source[index + 1] === '"') {
              field += '"';
              index += 2;
            } else {
              state = 'afterQuote';
              index += 1;
            }
          } else if (ch === '\r' && source[index + 1] === '\n') {
            field += '\r\n';
            index += 2;
            line += 1;
          } else {
            field += ch;
            index += 1;
            if (ch === '\n' || ch === '\r') line += 1;
          }
        } else if (state === 'afterQuote') {
          if (ch === ' ' || ch === '\t') {
            index += 1;
          } else if (ch === ',') {
            fields.push(field);
            field = '';
            state = 'start';
            hadComma = true;
            index += 1;
          } else if (ch === '\r' || ch === '\n') {
            fields.push(field);
            ended = true;
            if (ch === '\r' && source[index + 1] === '\n') index += 2;
            else index += 1;
            line += 1;
          } else {
            fail('CSV_QUOTE_SYNTAX', 'Unexpected character after a closing quote', startLine);
          }
        } else if (state === 'start') {
          if (ch === ' ' || ch === '\t') {
            index += 1;
          } else if (ch === '"') {
            quotedAny = true;
            state = 'quoted';
            index += 1;
          } else if (ch === ',') {
            fields.push('');
            hadComma = true;
            index += 1;
          } else if (ch === '\r' || ch === '\n') {
            fields.push('');
            ended = true;
            if (ch === '\r' && source[index + 1] === '\n') index += 2;
            else index += 1;
            line += 1;
          } else {
            field = ch;
            state = 'unquoted';
            index += 1;
          }
        } else {
          if (ch === '"') {
            fail('CSV_QUOTE_SYNTAX', 'A quote must begin a quoted field', startLine);
          } else if (ch === ',') {
            fields.push(field.trim());
            field = '';
            state = 'start';
            hadComma = true;
            index += 1;
          } else if (ch === '\r' || ch === '\n') {
            fields.push(field.trim());
            ended = true;
            if (ch === '\r' && source[index + 1] === '\n') index += 2;
            else index += 1;
            line += 1;
          } else {
            field += ch;
            index += 1;
          }
        }
      }

      if (state === 'quoted') {
        fail('CSV_UNCLOSED_QUOTE', 'Quoted field is not closed', startLine);
      }
      if (!ended) {
        fields.push(state === 'afterQuote' ? field : field.trim());
      }

      var blank = !quotedAny && !hadComma && fields.length === 1 && fields[0] === '';
      if (!blank) records.push({ fields: fields, line: startLine });
    }

    if (records.length === 0) {
      fail('CSV_NO_HEADER', 'CSV has no header row', 1);
    }

    var headers = records[0].fields.map(function (header) {
      return header.trim();
    });
    var headerSeen = Object.create(null);
    headers.forEach(function (header) {
      if (header === '') fail('CSV_EMPTY_HEADER', 'CSV header cannot be empty', 1);
      if (headerSeen[header]) fail('CSV_DUPLICATE_HEADER', 'Duplicate CSV header: ' + header, 1);
      headerSeen[header] = true;
    });

    var rows = [];
    for (var r = 1; r < records.length; r += 1) {
      var record = records[r];
      if (record.fields.length !== headers.length) {
        fail(
          'CSV_CELL_COUNT',
          'CSV row has ' + record.fields.length + ' cells; expected ' + headers.length,
          record.line
        );
      }
      var row = {};
      for (var c = 0; c < headers.length; c += 1) {
        Object.defineProperty(row, headers[c], {
          value: record.fields[c],
          enumerable: true,
          configurable: true,
          writable: true
        });
      }
      rows.push(row);
    }

    return { headers: headers, rows: rows };
  }

  function quoteCSVCell(value) {
    var text = String(value);
    if (/[",\r\n]/.test(text) || /^\s/.test(text) || /\s$/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function stringifyCSV(headers, rows) {
    if (!Array.isArray(headers)) {
      fail('CSV_HEADERS_TYPE', 'CSV headers must be an array', 0);
    }
    if (headers.length === 0) {
      fail('CSV_HEADERS_EMPTY', 'CSV headers cannot be empty', 1);
    }
    if (!Array.isArray(rows)) {
      fail('CSV_ROWS_TYPE', 'CSV rows must be an array', 0);
    }

    var normalizedHeaders = [];
    var headerSet = Object.create(null);
    headers.forEach(function (header) {
      if (typeof header !== 'string') {
        fail('CSV_HEADER_TYPE', 'CSV headers must be strings', 1);
      }
      var normalized = header.trim();
      if (normalized === '') fail('CSV_EMPTY_HEADER', 'CSV header cannot be empty', 1);
      if (headerSet[normalized]) {
        fail('CSV_DUPLICATE_HEADER', 'Duplicate CSV header: ' + normalized, 1);
      }
      headerSet[normalized] = true;
      normalizedHeaders.push(normalized);
    });

    var lines = [normalizedHeaders.map(quoteCSVCell).join(',')];
    rows.forEach(function (row, rowOffset) {
      var rowNumber = rowOffset + 2;
      requireObject(row, 'CSV_ROW_TYPE', 'CSV row ' + rowNumber + ' must be an object');
      Object.keys(row).forEach(function (key) {
        if (!headerSet[key]) {
          fail('CSV_ROW_EXTRA_CELL', 'CSV row contains an unknown column: ' + key, rowNumber);
        }
      });
      var cells = normalizedHeaders.map(function (header) {
        if (!hasOwn.call(row, header)) {
          fail('CSV_ROW_MISSING_CELL', 'CSV row is missing column: ' + header, rowNumber);
        }
        if (typeof row[header] !== 'string') {
          fail('CSV_CELL_TYPE', 'CSV cell must be a string: ' + header, rowNumber);
        }
        return quoteCSVCell(row[header]);
      });
      lines.push(cells.join(','));
    });

    return lines.join('\r\n');
  }

  function normalizeHexString(value, code, label) {
    if (typeof value !== 'string') {
      fail(code, label + ' must be a hex string');
    }
    var compact = value.replace(/\s+/g, '');
    if (/^0x/i.test(compact)) compact = compact.slice(2);
    if (!/^(?:[0-9a-fA-F]{2})*$/.test(compact)) {
      fail(code, label + ' must contain complete hex bytes');
    }
    var bytes = [];
    for (var i = 0; i < compact.length; i += 2) {
      bytes.push(parseInt(compact.slice(i, i + 2), 16));
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    return bytes.map(function (byte) {
      return byte.toString(16).padStart(2, '0').toUpperCase();
    }).join(' ');
  }

  function valueBytesToHex(bytes) {
    return bytes.map(function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  function validateRoute(operation, role) {
    if (!hasOwn.call(CID_BY_OPERATION, operation)) {
      fail('PDU_OPERATION_INVALID', 'Unsupported PDU operation: ' + String(operation));
    }
    if (['request', 'response', 'report'].indexOf(role) === -1) {
      fail('PDU_ROLE_INVALID', 'Unsupported PDU role: ' + String(role));
    }
    if (operation === 'report' || operation === 'event') {
      if (role !== 'report') {
        fail('PDU_ROLE_FORBIDDEN', operation + ' is a device report and has no request/response role');
      }
    } else if (role === 'report') {
      fail('PDU_ROLE_FORBIDDEN', operation + ' does not support the report role');
    }
  }

  function parseFieldType(typeName) {
    if (typeof typeName !== 'string' || typeName.trim() === '') {
      fail('FIELD_TYPE_INVALID', 'Field type must be a non-empty string');
    }
    var name = typeName.trim().toLowerCase();
    var isArray = false;
    if (/\[\]$/.test(name)) {
      isArray = true;
      name = name.slice(0, -2);
    }
    if (name.indexOf('[]') !== -1 || name.indexOf('[') !== -1 || name.indexOf(']') !== -1) {
      fail('FIELD_TYPE_NESTED_ARRAY', 'Nested arrays are not supported: ' + typeName);
    }
    if (name === 'utf8' || name === 'bytes') {
      if (isArray) {
        fail('FIELD_TYPE_VARIABLE_ARRAY', 'utf8[] and bytes[] are not supported');
      }
      return { declaration: typeName, name: name, kind: name, array: false, width: 0 };
    }
    if (name === 'bool') {
      return { declaration: typeName, name: name, kind: 'bool', array: isArray, width: 1 };
    }
    if (hasOwn.call(INTEGER_TYPES, name)) {
      var integer = INTEGER_TYPES[name];
      return {
        declaration: typeName,
        name: name,
        kind: 'integer',
        array: isArray,
        width: integer.width,
        signed: integer.signed,
        bits: integer.bits
      };
    }
    if (hasOwn.call(FLOAT_TYPES, name)) {
      var floating = FLOAT_TYPES[name];
      return {
        declaration: typeName,
        name: name,
        kind: 'float',
        array: isArray,
        width: floating.width,
        bits: floating.bits
      };
    }
    if (name.indexOf('enum:') === 0) {
      var underlying = name.slice(5);
      if (!hasOwn.call(INTEGER_TYPES, underlying)) {
        fail('FIELD_TYPE_INVALID', 'Enum underlying type must be an integer type: ' + typeName);
      }
      var enumInteger = INTEGER_TYPES[underlying];
      return {
        declaration: typeName,
        name: name,
        kind: 'enum',
        array: isArray,
        width: enumInteger.width,
        signed: enumInteger.signed,
        bits: enumInteger.bits,
        underlying: underlying
      };
    }
    fail('FIELD_TYPE_INVALID', 'Unsupported field type: ' + typeName);
  }

  function parseIntegerText(value, code, message) {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'string' && /^-?(?:0|[1-9][0-9]*)$/.test(value)) {
      return BigInt(value);
    }
    fail(code, message);
  }

  function normalizeEnums(enums, type) {
    requireObject(enums, 'FIELD_ENUMS_INVALID', 'enums must be an object');
    var values = Object.create(null);
    var keys = Object.keys(enums);
    if (keys.length === 0) {
      fail('FIELD_ENUMS_EMPTY', 'Enum types require at least one enum value');
    }
    keys.forEach(function (key) {
      if (!/^-?(?:0|[1-9][0-9]*)$/.test(key)) {
        fail('FIELD_ENUMS_INVALID', 'Enum keys must be decimal integers: ' + key);
      }
      var numeric = BigInt(key);
      ensureIntegerRange(numeric, type);
      var canonical = numeric.toString();
      if (values[canonical] !== undefined) {
        fail('FIELD_ENUMS_DUPLICATE', 'Duplicate enum value: ' + canonical);
      }
      values[canonical] = enums[key];
    });
    return values;
  }

  function ensureIntegerRange(raw, type) {
    var bits = BigInt(type.bits);
    var min = type.signed ? -(1n << (bits - 1n)) : 0n;
    var max = type.signed ? (1n << (bits - 1n)) - 1n : (1n << bits) - 1n;
    if (raw < min || raw > max) {
      fail('FIELD_VALUE_RANGE', 'Integer value is outside ' + type.declaration + ' range');
    }
  }

  function normalizeNumericOption(value, defaultValue, label) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      fail('FIELD_NUMERIC_OPTION', label + ' must be a finite number');
    }
    return value;
  }

  function normalizeBound(value, type, label) {
    if (value === undefined || value === null || value === '') return null;
    if (type.kind === 'float') {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        fail('FIELD_RANGE_INVALID', label + ' must be a finite number');
      }
      return value;
    }
    var raw;
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) {
        fail('FIELD_64BIT_PRECISION', label + ' must be a safe integer or decimal string');
      }
      raw = BigInt(value);
    } else if (typeof value === 'string') {
      raw = parseIntegerText(value, 'FIELD_RANGE_INVALID', label + ' must be an integer');
    } else if (typeof value === 'bigint') {
      raw = value;
    } else {
      fail('FIELD_RANGE_INVALID', label + ' must be an integer');
    }
    return raw;
  }

  function constraintDirection(operation, role) {
    if (operation === 'write' && role === 'request') return 'write';
    if (operation === 'invoke' && role === 'request') return 'write';
    if (operation === 'read' && role === 'response') return 'read';
    if (operation === 'invoke' && role === 'response') return 'read';
    if (operation === 'report' || operation === 'event') return 'read';
    return null;
  }

  function normalizeConstraintRule(rule, direction) {
    if (rule === undefined) return null;
    requireObject(rule, 'ENGINEERING_CONSTRAINT', direction + ' constraints must be an object');
    Object.keys(rule).forEach(function (key) {
      if (CONSTRAINT_RULE_KEYS.indexOf(key) === -1) {
        fail('ENGINEERING_CONSTRAINT', 'Unknown ' + direction + ' constraint key: ' + key);
      }
    });

    var output = {};
    ['minimum', 'maximum', 'step', 'stepOrigin'].forEach(function (key) {
      if (!hasOwn.call(rule, key)) return;
      if (typeof rule[key] !== 'string') {
        fail('ENGINEERING_CONSTRAINT', direction + '.' + key + ' must be a decimal string');
      }
      var parsed = parseDecimal(
        rule[key],
        'ENGINEERING_CONSTRAINT',
        direction + '.' + key
      );
      output[key] = decimalToString(parsed);
    });

    if (output.stepOrigin !== undefined && output.step === undefined) {
      fail('ENGINEERING_CONSTRAINT', direction + '.stepOrigin requires step');
    }
    if (output.step !== undefined) {
      if (compareDecimals(parseDecimal(output.step, 'ENGINEERING_CONSTRAINT', 'step'), {
        coefficient: 0n,
        scale: 0
      }) <= 0) {
        fail('ENGINEERING_CONSTRAINT', direction + '.step must be greater than zero');
      }
      if (output.stepOrigin === undefined) output.stepOrigin = '0';
    }
    if (output.minimum !== undefined && output.maximum !== undefined) {
      if (compareDecimals(
        parseDecimal(output.minimum, 'ENGINEERING_CONSTRAINT', 'minimum'),
        parseDecimal(output.maximum, 'ENGINEERING_CONSTRAINT', 'maximum')
      ) > 0) {
        fail('ENGINEERING_CONSTRAINT', direction + '.minimum must not exceed maximum');
      }
    }

    if (hasOwn.call(rule, 'allowedValues')) {
      if (!Array.isArray(rule.allowedValues) || rule.allowedValues.length === 0) {
        fail('ENGINEERING_CONSTRAINT', direction + '.allowedValues must be a non-empty array');
      }
      var allowedSeen = Object.create(null);
      output.allowedValues = rule.allowedValues.map(function (item, index) {
        if (typeof item !== 'string') {
          fail('ENGINEERING_CONSTRAINT', direction + '.allowedValues items must be decimal strings');
        }
        var parsed = parseDecimal(
          item,
          'ENGINEERING_CONSTRAINT',
          direction + '.allowedValues[' + index + ']'
        );
        var normalized = decimalToString(parsed);
        if (allowedSeen[normalized]) {
          fail('ENGINEERING_CONSTRAINT', direction + '.allowedValues contains a duplicate value: ' + normalized);
        }
        allowedSeen[normalized] = true;
        return normalized;
      });
    }

    return Object.keys(output).length ? output : null;
  }

  function normalizeEngineeringConstraints(value, type, selectedDirection) {
    var numeric = type.kind === 'integer' || type.kind === 'float';
    if (value === undefined) return { read: null, write: null, selected: null };
    requireObject(value, 'ENGINEERING_CONSTRAINT', 'constraints must be an object');
    Object.keys(value).forEach(function (key) {
      if (key !== 'read' && key !== 'write') {
        fail('ENGINEERING_CONSTRAINT', 'Unknown constraints key: ' + key);
      }
    });
    if (!numeric) {
      fail('ENGINEERING_CONSTRAINT', 'Engineering constraints are only valid for non-enum numeric fields');
    }
    var normalized = {
      read: normalizeConstraintRule(value.read, 'read'),
      write: normalizeConstraintRule(value.write, 'write'),
      selected: null
    };
    if (selectedDirection) normalized.selected = normalized[selectedDirection];
    return normalized;
  }

  function validateEngineeringRule(decimal, field) {
    var rule = field.constraints && field.constraints.selected;
    if (!rule) return;
    if (rule.minimum !== undefined &&
        compareDecimals(decimal, parseDecimal(rule.minimum, 'ENGINEERING_CONSTRAINT', 'minimum')) < 0) {
      fail('ENGINEERING_RANGE', 'Engineering value is below the minimum constraint');
    }
    if (rule.maximum !== undefined &&
        compareDecimals(decimal, parseDecimal(rule.maximum, 'ENGINEERING_CONSTRAINT', 'maximum')) > 0) {
      fail('ENGINEERING_RANGE', 'Engineering value is above the maximum constraint');
    }
    if (rule.step !== undefined) {
      var step = parseDecimal(rule.step, 'ENGINEERING_CONSTRAINT', 'step');
      var origin = parseDecimal(rule.stepOrigin, 'ENGINEERING_CONSTRAINT', 'stepOrigin');
      var quotient = divideDecimals(subtractDecimals(decimal, origin), step);
      if (quotient.numerator % quotient.denominator !== 0n) {
        fail('ENGINEERING_STEP', 'Engineering value does not lie on the declared step');
      }
    }
    if (rule.allowedValues !== undefined) {
      var matched = rule.allowedValues.some(function (item) {
        return compareDecimals(
          decimal,
          parseDecimal(item, 'ENGINEERING_CONSTRAINT', 'allowedValues')
        ) === 0;
      });
      if (!matched) fail('ENGINEERING_ALLOWED_VALUES', 'Engineering value is not an allowed value');
    }
  }

  function engineeringDecimal(value, field, code, message) {
    var decimal = parseDecimal(value, code, message);
    validateEngineeringRule(decimal, field);
    return decimal;
  }

  function normalizeField(field, index, minAddress, requireValue, selectedDirection) {
    requireObject(field, 'FIELD_INVALID', 'Field ' + index + ' must be an object');
    if (!Number.isInteger(field.address) || field.address < minAddress || field.address > SELECTABLE_MAX_ADDRESS) {
      fail(
        'FIELD_ADDRESS_INVALID',
        'Field address must be an integer from 0x' + minAddress.toString(16).padStart(2, '0') +
          ' to 0x7A; received ' + String(field.address)
      );
    }

    var type = parseFieldType(field.type);
    var scale = normalizeNumericOption(field.scale, 1, 'scale');
    var offset = normalizeNumericOption(field.offset, 0, 'offset');
    if (scale === 0) fail('FIELD_SCALE_INVALID', 'scale must be non-zero');
    if ((type.kind === 'enum' || type.kind === 'bool') && (scale !== 1 || offset !== 0)) {
      fail('FIELD_SCALING_FORBIDDEN', 'Enum and bool fields require scale=1 and offset=0');
    }
    if ((type.name === 'u64' || type.name === 'i64' || type.underlying === 'u64' || type.underlying === 'i64') &&
        (scale !== 1 || offset !== 0)) {
      fail('FIELD_64BIT_SCALING_UNSUPPORTED', '64-bit fields do not support non-default scaling');
    }
    var engineeringConstraints = normalizeEngineeringConstraints(
      field.constraints,
      type,
      selectedDirection
    );

    var enums = null;
    if (type.kind === 'enum') {
      enums = normalizeEnums(field.enums, type);
    } else if (field.enums !== undefined) {
      fail('FIELD_ENUMS_FORBIDDEN', 'enums is only valid for enum types');
    }

    var maxBytes = null;
    if (field.maxBytes !== undefined && field.maxBytes !== null) {
      if (!Number.isInteger(field.maxBytes) || field.maxBytes < 1 || field.maxBytes > MAX_VALUE_BYTES) {
        fail('FIELD_MAX_BYTES_INVALID', 'maxBytes must be an integer from 1 to 127');
      }
      maxBytes = field.maxBytes;
    }
    if (maxBytes !== null && type.kind !== 'utf8' && type.kind !== 'bytes') {
      fail('FIELD_MAX_BYTES_FORBIDDEN', 'maxBytes is only valid for utf8 and bytes fields');
    }

    var maxCount = null;
    if (field.maxCount !== undefined && field.maxCount !== null) {
      if (!Number.isInteger(field.maxCount) || field.maxCount < 0) {
        fail('FIELD_MAX_COUNT_INVALID', 'maxCount must be a non-negative integer');
      }
      if (type.array && field.maxCount * type.width > MAX_VALUE_BYTES) {
        fail('FIELD_WIDTH_UNSUPPORTED', 'Array maxCount multiplied by element width exceeds 127 bytes');
      }
      maxCount = field.maxCount;
    }
    if (maxCount !== null && !type.array) {
      fail('FIELD_MAX_COUNT_FORBIDDEN', 'maxCount is only valid for array fields');
    }

    var minRaw = normalizeBound(field.minRaw, type, 'minRaw');
    var maxRaw = normalizeBound(field.maxRaw, type, 'maxRaw');
    if ((type.kind === 'utf8' || type.kind === 'bytes') && (minRaw !== null || maxRaw !== null)) {
      fail('FIELD_RANGE_FORBIDDEN', 'Raw ranges are not valid for utf8 or bytes fields');
    }
    if (minRaw !== null && maxRaw !== null) {
      var reversed = type.kind === 'float' ? minRaw > maxRaw : minRaw > maxRaw;
      if (reversed) fail('FIELD_RANGE_INVALID', 'minRaw cannot exceed maxRaw');
    }

    if (requireValue && !hasOwn.call(field, 'value')) {
      fail('FIELD_VALUE_MISSING', 'Field 0x' + field.address.toString(16).padStart(2, '0') + ' has no value');
    }

    return {
      address: field.address,
      type: type,
      scale: scale,
      offset: offset,
      enums: enums,
      maxBytes: maxBytes,
      maxCount: maxCount,
      minRaw: minRaw,
      maxRaw: maxRaw,
      constraints: engineeringConstraints,
      value: field.value
    };
  }

  function normalizeFields(spec, minAddress, requireValues) {
    if (spec.fields === undefined) return [];
    if (!Array.isArray(spec.fields)) {
      fail('FIELDS_TYPE', 'fields must be an array');
    }
    var selectedDirection = constraintDirection(spec.operation, spec.role);
    var fields = spec.fields.map(function (field, index) {
      return normalizeField(field, index, minAddress, requireValues, selectedDirection);
    });
    var seen = Object.create(null);
    fields.forEach(function (field) {
      if (seen[field.address]) fail('FIELD_ADDRESS_DUPLICATE', 'Duplicate field address: ' + field.address);
      seen[field.address] = true;
    });
    fields.sort(function (left, right) { return left.address - right.address; });
    return fields;
  }

  function validateMessageId(messageId) {
    return requireInteger(messageId, 1, 65535, 'MESSAGE_ID_INVALID', 'messageId must be an integer from 1 to 65535');
  }

  function validateResultCode(resultCode) {
    return requireInteger(resultCode, 0, 0xffffffff, 'RESULT_CODE_INVALID', 'resultCode must be a u32 integer');
  }

  function validateSelectorId(value, code, label, max) {
    return requireInteger(value, 1, max, code, label);
  }

  function checkRawBounds(raw, field) {
    if (field.type.kind === 'float') {
      if (field.minRaw !== null && raw < field.minRaw) fail('FIELD_VALUE_RANGE', 'Raw value is below minRaw');
      if (field.maxRaw !== null && raw > field.maxRaw) fail('FIELD_VALUE_RANGE', 'Raw value is above maxRaw');
      return;
    }
    if (field.minRaw !== null && raw < field.minRaw) fail('FIELD_VALUE_RANGE', 'Raw value is below minRaw');
    if (field.maxRaw !== null && raw > field.maxRaw) fail('FIELD_VALUE_RANGE', 'Raw value is above maxRaw');
  }

  function writeInteger(raw, width) {
    var bits = BigInt(width * 8);
    var unsigned = raw;
    if (unsigned < 0n) unsigned += 1n << bits;
    var out = new Array(width);
    for (var i = width - 1; i >= 0; i -= 1) {
      out[i] = Number(unsigned & 0xffn);
      unsigned >>= 8n;
    }
    return out;
  }

  function readInteger(bytes, signed) {
    var raw = 0n;
    for (var i = 0; i < bytes.length; i += 1) {
      raw = (raw << 8n) | BigInt(bytes[i]);
    }
    if (signed) {
      var bits = BigInt(bytes.length * 8);
      if (raw >= (1n << (bits - 1n))) raw -= 1n << bits;
    }
    return raw;
  }

  function inputInteger(value, bits, code, message) {
    if (bits === 64) {
      if (typeof value === 'number') {
        if (!Number.isSafeInteger(value)) {
          fail('FIELD_64BIT_PRECISION', 'Unsafe 64-bit numbers must be supplied as decimal strings');
        }
        return BigInt(value);
      }
      return parseIntegerText(value, code, message);
    }
    if (typeof value === 'bigint') {
      if (value < BigInt(Number.MIN_SAFE_INTEGER) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
        fail('FIELD_VALUE_RANGE', 'Integer value exceeds JavaScript safe range');
      }
      return value;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      fail(code, message);
    }
    return null;
  }

  function engineeringToIntegerRaw(value, field) {
    var type = field.type;
    if (type.bits === 64 && typeof value === 'number' && !Number.isSafeInteger(value)) {
      fail('FIELD_64BIT_PRECISION', 'Unsafe 64-bit numbers must be supplied as decimal strings');
    }
    var decimal = engineeringDecimal(
      value,
      field,
      'FIELD_VALUE_TYPE',
      type.declaration + ' engineering value must be a finite decimal number or string'
    );
    var offset = parseDecimal(field.offset, 'FIELD_VALUE_TYPE', 'offset');
    var scale = parseDecimal(field.scale, 'FIELD_VALUE_TYPE', 'scale');
    var quotient = divideDecimals(subtractDecimals(decimal, offset), scale);
    if (quotient.numerator % quotient.denominator !== 0n) {
      fail('FIELD_VALUE_NOT_EXACT', 'Engineering value does not map exactly to an integer raw value');
    }
    var raw = quotient.numerator / quotient.denominator;
    ensureIntegerRange(raw, type);
    checkRawBounds(raw, field);
    return raw;
  }

  function rawInputToBigInt(value, field, label) {
    var raw;
    if (field.type.bits === 64) {
      raw = inputInteger(value, 64, 'FIELD_VALUE_TYPE', label + ' must be an integer or decimal string');
    } else {
      if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
        fail('FIELD_VALUE_TYPE', label + ' must be a safe integer');
      }
      raw = BigInt(value);
    }
    ensureIntegerRange(raw, field.type);
    checkRawBounds(raw, field);
    return raw;
  }

  function engineeringOutput(raw, field) {
    var rawDecimal = parseDecimal(raw, 'FIELD_VALUE_TYPE', 'raw value');
    var scale = parseDecimal(field.scale, 'FIELD_VALUE_TYPE', 'scale');
    var offset = parseDecimal(field.offset, 'FIELD_VALUE_TYPE', 'offset');
    var decimal = addDecimals(multiplyDecimals(rawDecimal, scale), offset);
    validateEngineeringRule(decimal, field);
    if (field.type.bits === 64) {
      var normalized = normalizeDecimal(decimal);
      if (normalized.scale === 0 &&
          normalized.coefficient <= BigInt(Number.MAX_SAFE_INTEGER) &&
          normalized.coefficient >= BigInt(Number.MIN_SAFE_INTEGER)) {
        return Number(normalized.coefficient);
      }
      return decimalToString(decimal);
    }
    var engineering = Number(decimalToString(decimal));
    if (!Number.isFinite(engineering)) fail('FIELD_VALUE_RANGE', 'Engineering value overflows');
    return engineering === 0 ? 0 : engineering;
  }

  function encodeBool(value, field) {
    if (typeof value !== 'boolean') fail('FIELD_VALUE_TYPE', 'bool value must be true or false');
    var raw = value ? 1n : 0n;
    checkRawBounds(raw, field);
    return [value ? 1 : 0];
  }

  function encodeEnum(value, field) {
    var raw = rawInputToBigInt(value, field, 'Enum value');
    if (field.enums[raw.toString()] === undefined) {
      fail('FIELD_ENUM_UNKNOWN', 'Enum value is not declared: ' + raw.toString());
    }
    return writeInteger(raw, field.type.width);
  }

  function encodeFloat(value, field) {
    var decimal = engineeringDecimal(
      value,
      field,
      'FIELD_VALUE_TYPE',
      'Float value must be a finite decimal number or string'
    );
    var offset = parseDecimal(field.offset, 'FIELD_VALUE_TYPE', 'offset');
    var scale = parseDecimal(field.scale, 'FIELD_VALUE_TYPE', 'scale');
    var quotient = divideDecimals(subtractDecimals(decimal, offset), scale);
    var raw = Number(quotient.numerator) / Number(quotient.denominator);
    if (!Number.isFinite(raw)) fail('FIELD_VALUE_TYPE', 'Float engineering value cannot be converted to raw');
    if (field.type.bits === 32) raw = Math.fround(raw);
    if (!Number.isFinite(raw)) fail('VALUE_RANGE', 'Float raw value is outside the target type range');
    checkRawBounds(raw, field);
    var buffer = new ArrayBuffer(field.type.width);
    var view = new DataView(buffer);
    if (field.type.bits === 32) view.setFloat32(0, raw, false);
    else view.setFloat64(0, raw, false);
    return Array.from(new Uint8Array(buffer));
  }

  function encodeScalar(value, field) {
    if (field.type.kind === 'bool') return encodeBool(value, field);
    if (field.type.kind === 'enum') return encodeEnum(value, field);
    if (field.type.kind === 'float') return encodeFloat(value, field);
    var raw = engineeringToIntegerRaw(value, field);
    return writeInteger(raw, field.type.width);
  }

  function encodeFieldValue(field) {
    var type = field.type;
    var bytes;
    if (type.kind === 'utf8') {
      if (typeof field.value !== 'string') fail('FIELD_VALUE_TYPE', 'utf8 value must be a string');
      bytes = Array.from(new TextEncoder().encode(field.value));
      if (field.maxBytes !== null && bytes.length > field.maxBytes) {
        fail('FIELD_LENGTH_EXCEEDED', 'utf8 byte length exceeds maxBytes');
      }
    } else if (type.kind === 'bytes') {
      bytes = normalizeHexString(field.value, 'FIELD_VALUE_TYPE', 'bytes value');
      if (field.maxBytes !== null && bytes.length > field.maxBytes) {
        fail('FIELD_LENGTH_EXCEEDED', 'bytes length exceeds maxBytes');
      }
    } else if (type.array) {
      if (!Array.isArray(field.value)) fail('FIELD_VALUE_TYPE', type.declaration + ' value must be an array');
      if (field.maxCount !== null && field.value.length > field.maxCount) {
        fail('FIELD_LENGTH_EXCEEDED', 'Array item count exceeds maxCount');
      }
      bytes = [];
      field.value.forEach(function (item) {
        bytes = bytes.concat(encodeScalar(item, field));
      });
    } else {
      bytes = encodeScalar(field.value, field);
    }

    if (bytes.length > MAX_VALUE_BYTES) {
      fail('FIELD_VALUE_TOO_LARGE', 'A single field Value cannot exceed 127 bytes');
    }
    return bytes;
  }

  function decodeFieldValue(field, bytes) {
    var type = field.type;
    if (type.kind === 'utf8') {
      if (field.maxBytes !== null && bytes.length > field.maxBytes) {
        fail('FIELD_LENGTH_EXCEEDED', 'utf8 byte length exceeds maxBytes');
      }
      try {
        return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
      } catch (err) {
        fail('FIELD_UTF8_INVALID', 'Field contains invalid UTF-8');
      }
    }
    if (type.kind === 'bytes') {
      if (field.maxBytes !== null && bytes.length > field.maxBytes) {
        fail('FIELD_LENGTH_EXCEEDED', 'bytes length exceeds maxBytes');
      }
      return valueBytesToHex(bytes);
    }

    if (type.array) {
      if (bytes.length % type.width !== 0) {
        fail('FIELD_WIDTH_INVALID', 'Array Value length is not divisible by element width');
      }
      var count = bytes.length / type.width;
      if (field.maxCount !== null && count > field.maxCount) {
        fail('FIELD_LENGTH_EXCEEDED', 'Array item count exceeds maxCount');
      }
      var values = [];
      for (var offset = 0; offset < bytes.length; offset += type.width) {
        values.push(decodeScalar(field, bytes.slice(offset, offset + type.width)));
      }
      return values;
    }

    if (bytes.length !== type.width) {
      fail('FIELD_WIDTH_INVALID', 'Field Value length does not equal ' + type.width + ' bytes');
    }
    return decodeScalar(field, bytes);
  }

  function decodeScalar(field, bytes) {
    var type = field.type;
    if (type.kind === 'bool') {
      if (bytes[0] !== 0 && bytes[0] !== 1) fail('FIELD_BOOL_INVALID', 'bool Value must be 00 or 01');
      var boolRaw = BigInt(bytes[0]);
      checkRawBounds(boolRaw, field);
      return bytes[0] === 1;
    }
    if (type.kind === 'enum') {
      var enumRaw = readInteger(bytes, type.signed);
      if (field.enums[enumRaw.toString()] === undefined) {
        fail('FIELD_ENUM_UNKNOWN', 'Enum value is not declared: ' + enumRaw.toString());
      }
      checkRawBounds(enumRaw, field);
      return engineeringOutput(enumRaw, field);
    }
    if (type.kind === 'float') {
      var view = new DataView(Uint8Array.from(bytes).buffer);
      var raw = type.bits === 32 ? view.getFloat32(0, false) : view.getFloat64(0, false);
      if (!Number.isFinite(raw)) fail('FIELD_FLOAT_INVALID', 'Float raw value must be finite');
      checkRawBounds(raw, field);
      var engineering = engineeringOutput(raw, field);
      if (!Number.isFinite(engineering)) fail('FIELD_FLOAT_INVALID', 'Float engineering value is not finite');
      return engineering;
    }
    var integerRaw = readInteger(bytes, type.signed);
    ensureIntegerRange(integerRaw, type);
    checkRawBounds(integerRaw, field);
    return engineeringOutput(integerRaw, field);
  }

  function pushTLV(target, type, valueBytes) {
    if (valueBytes.length > MAX_VALUE_BYTES) {
      fail('FIELD_VALUE_TOO_LARGE', 'A single TLV Value cannot exceed 127 bytes');
    }
    target.push(type, valueBytes.length);
    for (var i = 0; i < valueBytes.length; i += 1) target.push(valueBytes[i]);
  }

  function u16Bytes(value) {
    return [(value >>> 8) & 0xff, value & 0xff];
  }

  function u32Bytes(value) {
    return [Math.floor(value / 0x1000000) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
  }

  function requireNoSelection(spec) {
    if (spec.selection !== undefined) fail('SELECTION_FORBIDDEN', 'selection is only valid for a read request');
  }

  function addEncodedFields(target, fields) {
    fields.forEach(function (field) {
      pushTLV(target, field.address, encodeFieldValue(field));
    });
  }

  function encodePDU(spec) {
    requireObject(spec, 'PDU_SPEC_INVALID', 'PDU spec must be an object');
    var operation = spec.operation;
    var role = spec.role;
    validateRoute(operation, role);
    var sid = requireInteger(spec.sid, 0, 255, 'SID_INVALID', 'sid must be a byte');
    var messageId = validateMessageId(spec.messageId);
    if (operation !== 'invoke' && spec.actionId !== undefined) {
      fail('ACTION_CONTEXT_FORBIDDEN', 'actionId is only valid for invoke operation context');
    }
    if (operation !== 'event' && spec.eventId !== undefined) {
      fail('EVENT_CONTEXT_FORBIDDEN', 'eventId is only valid for event operation context');
    }
    if ((operation === 'report' || operation === 'event') && spec.resultCode !== undefined) {
      fail('RESULT_FORBIDDEN', 'Device reports cannot contain a result code');
    }
    var isReadRequest = operation === 'read' && role === 'request';
    var minAddress = operation === 'invoke' || operation === 'event' ? SELECTOR_FIELD_MIN_ADDRESS : PROPERTY_MIN_ADDRESS;
    var fields = normalizeFields(spec, minAddress, !isReadRequest);
    var out = [sid, CID_BY_OPERATION[operation]];
    pushTLV(out, MESSAGE_TYPE, u16Bytes(messageId));

    if (operation === 'read') {
      if (role === 'request') {
        if (spec.resultCode !== undefined) fail('RESULT_FORBIDDEN', 'read request cannot contain a result code');
        var selections = [];
        if (spec.selection !== undefined) {
          if (!Array.isArray(spec.selection)) fail('SELECTION_INVALID', 'selection must be an array');
          var selected = Object.create(null);
          spec.selection.forEach(function (address) {
            requireInteger(address, 1, SELECTABLE_MAX_ADDRESS, 'SELECTION_INVALID', 'selection addresses must be 0x01 to 0x7A');
            if (selected[address]) fail('SELECTION_DUPLICATE', 'Duplicate selection address: ' + address);
            selected[address] = true;
            selections.push(address);
          });
          selections.sort(function (left, right) { return left - right; });
          if (fields.length > 0) {
            var declared = Object.create(null);
            fields.forEach(function (field) { declared[field.address] = true; });
            selections.forEach(function (address) {
              if (!declared[address]) fail('SELECTION_UNKNOWN', 'Selection address is not declared: ' + address);
            });
          }
        }
        selections.forEach(function (address) { pushTLV(out, address, []); });
      } else {
        requireNoSelection(spec);
        if (spec.resultCode !== undefined) {
          if (fields.length > 0) fail('READ_RESULT_WITH_FIELDS', 'A read failure response cannot contain fields');
          var readResult = validateResultCode(spec.resultCode);
          if (readResult === RESULT_SUCCESS) {
            fail('READ_SUCCESS_RESULT_FORBIDDEN', 'A successful read response carries fields instead of result 100000');
          }
          pushTLV(out, RESULT_TYPE, u32Bytes(readResult));
        } else {
          if (fields.length === 0) fail('READ_FIELDS_REQUIRED', 'A successful read response requires at least one field');
          addEncodedFields(out, fields);
        }
      }
    } else if (operation === 'write') {
      requireNoSelection(spec);
      if (role === 'request') {
        if (spec.resultCode !== undefined) fail('RESULT_FORBIDDEN', 'write request cannot contain a result code');
        if (fields.length === 0) fail('WRITE_FIELDS_REQUIRED', 'Write request requires at least one field');
        addEncodedFields(out, fields);
      } else {
        validateResultCode(spec.resultCode);
        if (fields.length > 0) fail('WRITE_RESPONSE_FIELDS_FORBIDDEN', 'Write response cannot contain fields');
        pushTLV(out, RESULT_TYPE, u32Bytes(spec.resultCode));
      }
    } else if (operation === 'invoke') {
      requireNoSelection(spec);
      if (role === 'request') {
        if (spec.resultCode !== undefined) fail('RESULT_FORBIDDEN', 'invoke request cannot contain a result code');
        var actionId = validateSelectorId(spec.actionId, 'ACTION_ID_INVALID', 'actionId must be 1 to 255', 255);
        pushTLV(out, SELECTOR_TYPE, [actionId]);
        addEncodedFields(out, fields);
      } else {
        validateResultCode(spec.resultCode);
        if (spec.actionId !== undefined) {
          validateSelectorId(spec.actionId, 'ACTION_ID_INVALID', 'actionId must be 1 to 255', 255);
        }
        pushTLV(out, RESULT_TYPE, u32Bytes(spec.resultCode));
        if (spec.resultCode !== RESULT_SUCCESS && fields.length > 0) {
          fail('INVOKE_FAILURE_FIELDS_FORBIDDEN', 'A failed action response cannot contain output fields');
        }
        if (spec.resultCode === RESULT_SUCCESS) addEncodedFields(out, fields);
      }
    } else if (operation === 'report') {
      requireNoSelection(spec);
      if (fields.length === 0) fail('REPORT_FIELDS_REQUIRED', 'Property report requires at least one field');
      addEncodedFields(out, fields);
    } else {
      requireNoSelection(spec);
      var eventId = validateSelectorId(spec.eventId, 'EVENT_ID_INVALID', 'eventId must be 1 to 65535', 65535);
      pushTLV(out, SELECTOR_TYPE, u16Bytes(eventId));
      addEncodedFields(out, fields);
    }

    if (out.length > MAX_PDU_BYTES) {
      fail('PDU_TOO_LARGE', 'Application PDU exceeds 2048 bytes');
    }
    return bytesToHex(out);
  }

  function decodeHexPDU(hex) {
    var bytes = normalizeHexString(hex, 'PDU_HEX_INVALID', 'PDU hex');
    if (bytes.length === 0) fail('PDU_HEX_EMPTY', 'PDU hex cannot be empty');
    if (bytes.length > MAX_PDU_BYTES) fail('PDU_TOO_LARGE', 'Application PDU exceeds 2048 bytes');
    return bytes;
  }

  function parseTLVs(bytes) {
    var tlvs = [];
    var position = 2;
    while (position < bytes.length) {
      if (position + 2 > bytes.length) fail('PDU_TRUNCATED', 'Incomplete TLV header');
      var type = bytes[position];
      var length = bytes[position + 1];
      if ((type & 0x80) !== 0) {
        fail('PDU_CONTAINER_UNSUPPORTED', 'Container TLVs are not supported in the flat template');
      }
      if (length >= 0x80) {
        fail('PDU_LENGTH_UNSUPPORTED', 'TLV Value length cannot exceed 127 bytes');
      }
      position += 2;
      if (position + length > bytes.length) fail('PDU_TRUNCATED', 'TLV Value is shorter than its Length');
      tlvs.push({ type: type, value: bytes.slice(position, position + length) });
      position += length;
    }
    if (tlvs.length === 0) fail('PDU_MESSAGE_MISSING', 'PDU requires a message-id TLV');
    return tlvs;
  }

  function ensureUniqueTLVs(tlvs) {
    var seen = Object.create(null);
    tlvs.forEach(function (tlv) {
      if (seen[tlv.type]) fail('PDU_DUPLICATE_FIELD', 'Duplicate TLV Type: 0x' + tlv.type.toString(16).toUpperCase());
      seen[tlv.type] = true;
    });
  }

  function decodeMessage(tlvs) {
    if (tlvs[0].type !== MESSAGE_TYPE) fail('PDU_MESSAGE_ORDER', 'message_id must be the first TLV');
    if (tlvs[0].value.length !== 2) fail('PDU_MESSAGE_WIDTH', 'message_id must have a 2-byte Value');
    var messageId = (tlvs[0].value[0] << 8) | tlvs[0].value[1];
    if (messageId < 1) fail('MESSAGE_ID_INVALID', 'messageId must be from 1 to 65535');
    return messageId;
  }

  function readResultCode(tlv) {
    if (!tlv || tlv.type !== RESULT_TYPE) fail('PDU_RESULT_MISSING', 'result_code TLV is required');
    if (tlv.value.length !== 4) fail('PDU_RESULT_WIDTH', 'result_code must have a 4-byte Value');
    return ((tlv.value[0] << 24) >>> 0) + (tlv.value[1] << 16) + (tlv.value[2] << 8) + tlv.value[3];
  }

  function decodeBusinessFields(tlvs, fieldMap, minAddress) {
    var values = {};
    var previous = 0;
    for (var i = 0; i < tlvs.length; i += 1) {
      var tlv = tlvs[i];
      if (tlv.type < minAddress || tlv.type > SELECTABLE_MAX_ADDRESS) {
        fail('PDU_UNKNOWN_FIELD', 'TLV Type is not a business field: 0x' + tlv.type.toString(16).toUpperCase());
      }
      if (!fieldMap[tlv.type]) {
        fail('PDU_UNKNOWN_FIELD', 'TLV Type is not declared: 0x' + tlv.type.toString(16).toUpperCase());
      }
      if (tlv.type <= previous) fail('PDU_FIELD_ORDER', 'Business fields must be in ascending Type order');
      previous = tlv.type;
      values[String(tlv.type)] = decodeFieldValue(fieldMap[tlv.type], tlv.value);
    }
    return values;
  }

  function decodePDU(spec, hex) {
    requireObject(spec, 'PDU_SPEC_INVALID', 'PDU spec must be an object');
    var operation = spec.operation;
    var role = spec.role;
    validateRoute(operation, role);
    var sid = requireInteger(spec.sid, 0, 255, 'SID_INVALID', 'sid must be a byte');
    var minAddress = operation === 'invoke' || operation === 'event' ? SELECTOR_FIELD_MIN_ADDRESS : PROPERTY_MIN_ADDRESS;
    var fields = normalizeFields(spec, minAddress, false);
    var fieldMap = Object.create(null);
    fields.forEach(function (field) { fieldMap[field.address] = field; });

    var bytes = decodeHexPDU(hex);
    if (bytes[0] !== sid) {
      fail('PDU_SID_MISMATCH', 'PDU SID 0x' + bytes[0].toString(16).toUpperCase() + ' does not match spec');
    }
    var expectedCid = CID_BY_OPERATION[operation];
    if (bytes[1] !== expectedCid) {
      fail('PDU_CID_MISMATCH', 'PDU CID 0x' + bytes[1].toString(16).toUpperCase() + ' does not match operation');
    }

    var tlvs = parseTLVs(bytes);
    ensureUniqueTLVs(tlvs);
    var messageId = decodeMessage(tlvs);
    var body = tlvs.slice(1);
    var output = { messageId: messageId };
    var values = {};

    if (operation === 'read') {
      if (role === 'request') {
        var selection = [];
        var previous = 0;
        body.forEach(function (tlv) {
          if (tlv.type < SELECTOR_FIELD_MIN_ADDRESS - 1 || tlv.type > SELECTABLE_MAX_ADDRESS) {
            fail('SELECTION_INVALID', 'Read selector has an invalid Type');
          }
          if (tlv.value.length !== 0) fail('SELECTOR_WIDTH_INVALID', 'Read selector Length must be zero');
          if (tlv.type <= previous) fail('SELECTION_ORDER', 'Read selectors must be in ascending Type order');
          previous = tlv.type;
          if (fields.length > 0 && !fieldMap[tlv.type]) {
            fail('SELECTION_UNKNOWN', 'Read selector is not declared');
          }
          selection.push(tlv.type);
        });
        if (selection.length > 0) output.selection = selection;
      } else if (body.length === 1 && body[0].type === RESULT_TYPE) {
        var readResult = readResultCode(body[0]);
        if (readResult === RESULT_SUCCESS) {
          fail('READ_SUCCESS_RESULT_FORBIDDEN', 'Read success must carry fields, not result 100000');
        }
        output.resultCode = readResult;
      } else {
        if (body.length === 0) fail('READ_FIELDS_REQUIRED', 'Read success response requires at least one field');
        values = decodeBusinessFields(body, fieldMap, PROPERTY_MIN_ADDRESS);
      }
    } else if (operation === 'write') {
      if (role === 'request') {
        if (body.length === 0) fail('WRITE_FIELDS_REQUIRED', 'Write request requires at least one field');
        values = decodeBusinessFields(body, fieldMap, PROPERTY_MIN_ADDRESS);
      } else {
        if (body.length !== 1) fail('PDU_LAYOUT', 'Write response must contain exactly message_id and result_code');
        output.resultCode = readResultCode(body[0]);
      }
    } else if (operation === 'invoke') {
      if (role === 'request') {
        if (body.length === 0 || body[0].type !== SELECTOR_TYPE) {
          fail('ACTION_ID_MISSING', 'Invoke request requires action_code as the first business TLV');
        }
        if (body[0].value.length !== 1) fail('ACTION_ID_WIDTH', 'action_code must have a 1-byte Value');
        var actionId = body[0].value[0];
        if (actionId < 1) fail('ACTION_ID_INVALID', 'actionId must be from 1 to 255');
        output.actionId = actionId;
        values = decodeBusinessFields(body.slice(1), fieldMap, SELECTOR_FIELD_MIN_ADDRESS);
      } else {
        if (body.length === 0) fail('PDU_RESULT_MISSING', 'Invoke response requires result_code');
        output.resultCode = readResultCode(body[0]);
        if (spec.actionId !== undefined) {
          output.actionId = validateSelectorId(spec.actionId, 'ACTION_ID_INVALID', 'actionId must be 1 to 255', 255);
        }
        if (output.resultCode !== RESULT_SUCCESS && body.length > 1) {
          fail('INVOKE_FAILURE_FIELDS_FORBIDDEN', 'Failed action response cannot contain output fields');
        }
        if (output.resultCode === RESULT_SUCCESS) {
          values = decodeBusinessFields(body.slice(1), fieldMap, SELECTOR_FIELD_MIN_ADDRESS);
        }
      }
    } else if (operation === 'report') {
      if (body.length === 0) fail('REPORT_FIELDS_REQUIRED', 'Property report requires at least one field');
      values = decodeBusinessFields(body, fieldMap, PROPERTY_MIN_ADDRESS);
    } else {
      if (body.length === 0 || body[0].type !== SELECTOR_TYPE) {
        fail('EVENT_ID_MISSING', 'Event report requires event_code as the first business TLV');
      }
      if (body[0].value.length !== 2) fail('EVENT_ID_WIDTH', 'event_code must have a 2-byte Value');
      var eventId = (body[0].value[0] << 8) | body[0].value[1];
      if (eventId < 1) fail('EVENT_ID_INVALID', 'eventId must be from 1 to 65535');
      if (spec.eventId !== undefined && spec.eventId !== eventId) {
        fail('EVENT_ID_MISMATCH', 'Decoded eventId does not match the supplied dictionary context');
      }
      output.eventId = eventId;
      values = decodeBusinessFields(body.slice(1), fieldMap, SELECTOR_FIELD_MIN_ADDRESS);
    }

    output.values = values;
    return output;
  }

  var api = {
    parseCSV: parseCSV,
    stringifyCSV: stringifyCSV,
    encodePDU: encodePDU,
    decodePDU: decodePDU
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.BLEProto = api;
})();
