/* Pure SID/CID/TLV codec for public device-management commands. No transport or timers. */
(function attachBLEPublicCommands(root) {
  'use strict';

  var MAX_VALUE_BYTES = 16383;
  var MAX_PDU_BYTES = 2048;
  var RESULT_SUCCESS = 100000;
  var SID = 1;
  var COMMAND = Object.freeze({
    CAPABILITY: 'capability.negotiate',
    BATTERY: 'battery.get',
    BROADCAST: 'broadcast.set',
    PROVISION: 'provision.send',
    PROVISION_STATUS: 'provision.status',
    DEVICE_INFO: 'deviceInfo.get'
  });
  var CID_BY_COMMAND = Object.freeze({
    'capability.negotiate': 0x03,
    'battery.get': 0x0b,
    'broadcast.set': 0x0c,
    'provision.send': 0x0d,
    'provision.status': 0x0e,
    'deviceInfo.get': 0x04
  });
  var PROVISION_STATUS_NAMES = Object.freeze(['idle', 'connecting', 'success', 'failed', 'unknown']);
  var PROVISION_ERROR_CODES = Object.freeze({
    0x00: 'none',
    0x01: 'ap_not_found',
    0x02: 'auth_failed',
    0x03: 'incompatible',
    0x04: 'ap_rejected',
    0x05: 'link_lost',
    0x06: 'disconnected',
    0x07: 'other',
    0x08: 'hal',
    0x09: 'dhcp',
    0x0a: 'timeout',
    0x0b: 'user_cancel',
    0x0c: 'busy',
    0x0d: 'invalid_param'
  });
  var hasOwn = Object.prototype.hasOwnProperty;
  var textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  var textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }) : null;

  function error(code, message, field) {
    var err = new Error(message);
    err.name = 'BLEPublicCommandError';
    err.code = code;
    if (field !== undefined) err.field = field;
    return err;
  }

  function fail(code, message, field) {
    throw error(code, message, field);
  }

  function requireObject(value, field) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Uint8Array) {
      fail('PUBLIC_DATA_INVALID', String(field || 'data') + ' must be an object', field);
    }
    return value;
  }

  function requireInteger(value, min, max, field) {
    if (!Number.isInteger(value) || value < min || value > max) {
      fail('PUBLIC_FIELD_RANGE', String(field) + ' must be an integer from ' + min + ' to ' + max, field);
    }
    return value;
  }

  function requirePresent(data, key) {
    if (!hasOwn.call(data, key) || data[key] === undefined) {
      fail('PUBLIC_FIELD_REQUIRED', 'Missing required field: ' + key, key);
    }
    return data[key];
  }

  function rejectUnknownKeys(data, allowed, fieldPrefix) {
    Object.keys(data).forEach(function (key) {
      if (allowed.indexOf(key) === -1) {
        fail('PUBLIC_FIELD_UNKNOWN', 'Unknown field: ' + (fieldPrefix ? fieldPrefix + '.' : '') + key, fieldPrefix ? fieldPrefix + '.' + key : key);
      }
    });
  }

  function utf8Bytes(value, field) {
    if (typeof value !== 'string') fail('PUBLIC_FIELD_TYPE', field + ' must be a string', field);
    if (!textEncoder) fail('PUBLIC_UTF8_UNAVAILABLE', 'TextEncoder is unavailable');
    for (var si = 0; si < value.length; si += 1) {
      var unit = value.charCodeAt(si);
      if (unit >= 0xd800 && unit <= 0xdbff) {
        var next = value.charCodeAt(si + 1);
        if (!(next >= 0xdc00 && next <= 0xdfff)) fail('PUBLIC_UTF8_INVALID', field + ' contains an unpaired surrogate', field);
        si += 1;
      } else if (unit >= 0xdc00 && unit <= 0xdfff) fail('PUBLIC_UTF8_INVALID', field + ' contains an unpaired surrogate', field);
    }
    return Array.from(textEncoder.encode(value));
  }

  function utf8String(bytes, field) {
    if (!textDecoder) fail('PUBLIC_UTF8_UNAVAILABLE', 'TextDecoder is unavailable');
    try {
      return textDecoder.decode(Uint8Array.from(bytes));
    } catch (err) {
      fail('PUBLIC_UTF8_INVALID', field + ' contains invalid UTF-8', field);
    }
  }

  function normalizeBytes(value, field) {
    if (value instanceof Uint8Array) return Array.from(value);
    if (Array.isArray(value)) {
      return value.map(function (byte, index) {
        if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
          fail('PUBLIC_FIELD_RANGE', field + '[' + index + '] must be a byte', field);
        }
        return byte;
      });
    }
    if (typeof value === 'string') {
      var compact = value.replace(/\s+/g, '');
      if (/^0x/i.test(compact)) compact = compact.slice(2);
      if (!/^(?:[0-9a-fA-F]{2})*$/.test(compact)) {
        fail('PUBLIC_HEX_INVALID', field + ' must contain complete hex bytes', field);
      }
      var out = [];
      for (var i = 0; i < compact.length; i += 2) out.push(parseInt(compact.slice(i, i + 2), 16));
      return out;
    }
    fail('PUBLIC_FIELD_TYPE', field + ' must be a byte array, Uint8Array, or hex string', field);
  }

  function rawHex(bytes) {
    return bytes.map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
  }

  function rawFieldBytes(value, field) {
    if (typeof value === 'string') return utf8Bytes(value, field);
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Uint8Array)) {
      var keys = Object.keys(value);
      if (keys.length === 1 && hasOwn.call(value, 'hex')) return normalizeBytes(value.hex, field);
      if (keys.length === 1 && hasOwn.call(value, 'bytes')) return normalizeBytes(value.bytes, field);
      fail('PUBLIC_FIELD_TYPE', field + ' raw-byte object must contain exactly hex or bytes', field);
    }
    return normalizeBytes(value, field);
  }

  function wireHex(bytes) {
    return bytes.map(function (byte) { return byte.toString(16).padStart(2, '0').toUpperCase(); }).join(' ');
  }

  function parseInputBytes(input, field) {
    if (input instanceof Uint8Array || Array.isArray(input)) return normalizeBytes(input, field || 'bytes');
    if (typeof input === 'string') return normalizeBytes(input, field || 'wire');
    fail('PUBLIC_FIELD_TYPE', (field || 'input') + ' must be bytes or a hex string', field);
  }

  function encodeLength(value) {
    requireInteger(value, 0, MAX_VALUE_BYTES, 'length');
    if (value <= 0x7f) return [value];
    return [0x80 | ((value >>> 7) & 0x7f), value & 0x7f];
  }

  function decodeLength(input, offset) {
    var bytes = parseInputBytes(input, 'length');
    offset = offset === undefined ? 0 : offset;
    if (!Number.isInteger(offset) || offset < 0 || offset >= bytes.length) {
      fail('PUBLIC_LENGTH_TRUNCATED', 'No Length byte exists at offset ' + String(offset));
    }
    var first = bytes[offset];
    if (first < 0x80) return { value: first, width: 1, nextOffset: offset + 1 };
    if (offset + 1 >= bytes.length) fail('PUBLIC_LENGTH_TRUNCATED', 'Two-byte Length is truncated');
    var second = bytes[offset + 1];
    if (second & 0x80) fail('PUBLIC_LENGTH_ENCODING', 'The second Length byte cannot request another byte');
    var value = ((first & 0x7f) << 7) | second;
    if (value < 0x80) fail('PUBLIC_LENGTH_NONCANONICAL', 'Two-byte Length encodes a value below 128');
    return { value: value, width: 2, nextOffset: offset + 2 };
  }

  function encodeTLV(type, value) {
    if (!Number.isInteger(type) || type < 0 || type > 0xff) fail('PUBLIC_FIELD_RANGE', 'TLV Type must be 0..255');
    var lengthBytes = encodeLength(value.length);
    return [type].concat(lengthBytes, value);
  }

  function encodeContainer(type, children) {
    if (!Number.isInteger(type) || type < 0 || type > 0x7f) fail('PUBLIC_FIELD_RANGE', 'TLV Type must be 0..127');
    var value = [];
    children.forEach(function (child) { value = value.concat(child); });
    return encodeTLV(type | 0x80, value);
  }

  function parseSequence(bytes, start, end) {
    var parsed = [];
    var position = start;
    while (position < end) {
      if (position + 2 > end) fail('PUBLIC_PDU_TRUNCATED', 'Incomplete TLV header');
      var wireType = bytes[position];
      var lengthInfo = decodeLength(bytes, position + 1);
      if (lengthInfo.nextOffset > end) fail('PUBLIC_PDU_TRUNCATED', 'TLV Length header crosses its parent boundary');
      var valueStart = lengthInfo.nextOffset;
      var valueEnd = valueStart + lengthInfo.value;
      if (valueEnd > end) fail('PUBLIC_PDU_TRUNCATED', 'TLV Value is shorter than its Length');
      var value = bytes.slice(valueStart, valueEnd);
      var item = {
        wireType: wireType,
        type: wireType & 0x7f,
        container: (wireType & 0x80) !== 0,
        value: value,
        children: (wireType & 0x80) !== 0 ? parseSequence(bytes, valueStart, valueEnd) : null
      };
      parsed.push(item);
      position = valueEnd;
    }
    return parsed;
  }

  function ensureScalar(item, field) {
    if (item.container) fail('PUBLIC_TLV_CONTAINER_INVALID', field + ' must be a scalar TLV', field);
    return item;
  }

  function ensureContainer(item, field) {
    if (!item.container) fail('PUBLIC_TLV_CONTAINER_REQUIRED', field + ' must be a container TLV', field);
    return item;
  }

  function uniqueByType(items, field) {
    var seen = Object.create(null);
    items.forEach(function (item) {
      if (seen[item.type]) fail('PUBLIC_TLV_DUPLICATE', field + ' contains duplicate Type 0x' + item.type.toString(16).toUpperCase(), field);
      seen[item.type] = true;
    });
  }

  function mapByType(items, allowedTypes, field) {
    var map = Object.create(null);
    items.forEach(function (item) {
      ensureScalar(item, field);
      if (allowedTypes.indexOf(item.type) === -1) {
        fail('PUBLIC_TLV_UNKNOWN', field + ' contains unknown Type 0x' + item.type.toString(16).toUpperCase(), field);
      }
      if (map[item.type]) fail('PUBLIC_TLV_DUPLICATE', field + ' contains duplicate Type 0x' + item.type.toString(16).toUpperCase(), field);
      map[item.type] = item;
    });
    return map;
  }

  function requireValue(map, type, expectedWidth, field) {
    var item = map[type];
    if (!item) fail('PUBLIC_FIELD_REQUIRED', 'Missing required Type 0x' + type.toString(16).toUpperCase(), field);
    if (expectedWidth !== null && item.value.length !== expectedWidth) {
      fail('PUBLIC_FIELD_LENGTH', 'Type 0x' + type.toString(16).toUpperCase() + ' must have Length ' + expectedWidth, field);
    }
    return item.value;
  }

  function u32(value) {
    return [
      Math.floor(value / 0x1000000) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    ];
  }

  function readU32(value) {
    return ((value[0] << 24) >>> 0) + (value[1] << 16) + (value[2] << 8) + value[3];
  }

  function frame(command, parts) {
    var bytes = [SID, CID_BY_COMMAND[command]];
    parts.forEach(function (part) { bytes.push.apply(bytes, part); });
    if (bytes.length > MAX_PDU_BYTES) fail('PUBLIC_PDU_TOO_LARGE', 'Public application PDU exceeds 2048 bytes');
    return bytes;
  }

  function encodeFailureResult(command, data) {
    requireObject(data, 'data');
    rejectUnknownKeys(data, ['resultCode'], '');
    var resultCode = requireInteger(requirePresent(data, 'resultCode'), 0, 0xffffffff, 'resultCode');
    if (resultCode === RESULT_SUCCESS) {
      fail('PUBLIC_RESULT_SUCCESS_FORBIDDEN', 'A success response must use its command success payload');
    }
    return frame(command, [encodeTLV(0x7f, u32(resultCode))]);
  }

  function isFailureResult(items) {
    return items.length === 1 && items[0].type === 0x7f;
  }

  function decodeFailureResult(items, field) {
    var item = ensureScalar(items[0], field);
    var value = requireValue(mapByType([item], [0x7f], field), 0x7f, 4, field);
    var resultCode = readU32(value);
    if (resultCode === RESULT_SUCCESS) {
      fail('PUBLIC_RESULT_SUCCESS_FORBIDDEN', 'A success response must use its command success payload', 'resultCode');
    }
    return { resultCode: resultCode };
  }

  function encodedResult(command, role, bytes) {
    return {
      command: command,
      sid: SID,
      cid: CID_BY_COMMAND[command],
      role: role,
      bytes: bytes,
      hex: wireHex(bytes),
      byteLength: bytes.length
    };
  }

  function assertRole(command, role, allowed) {
    if (allowed.indexOf(role) === -1) {
      fail('PUBLIC_ROLE_UNSUPPORTED', command + ' does not support role ' + String(role), 'role');
    }
  }

  function normalizeCapabilityServices(data) {
    requireObject(data, 'data');
    rejectUnknownKeys(data, ['services'], '');
    if (!Array.isArray(data.services) || data.services.length === 0) {
      fail('PUBLIC_FIELD_REQUIRED', 'capability services must be a non-empty array', 'services');
    }
    var seenServices = Object.create(null);
    var normalized = data.services.map(function (service, index) {
      var path = 'services[' + index + ']';
      requireObject(service, path);
      rejectUnknownKeys(service, ['serviceId', 'commandIds'], path);
      var serviceId = requireInteger(requirePresent(service, 'serviceId'), 0, 255, path + '.serviceId');
      if (seenServices[serviceId]) fail('PUBLIC_FIELD_DUPLICATE', 'Duplicate serviceId: ' + serviceId, path + '.serviceId');
      seenServices[serviceId] = true;
      if (!Array.isArray(service.commandIds) || service.commandIds.length === 0) {
        fail('PUBLIC_FIELD_REQUIRED', 'commandIds must be a non-empty array', path + '.commandIds');
      }
      var seenCommands = Object.create(null);
      var commandIds = service.commandIds.map(function (commandId, commandIndex) {
        commandId = requireInteger(commandId, 0, 255, path + '.commandIds[' + commandIndex + ']');
        if (seenCommands[commandId]) {
          fail('PUBLIC_FIELD_DUPLICATE', 'Duplicate commandId: ' + commandId, path + '.commandIds');
        }
        seenCommands[commandId] = true;
        return commandId;
      });
      return { serviceId: serviceId, commandIds: commandIds };
    });
    normalized.sort(function (left, right) { return left.serviceId - right.serviceId; });
    normalized.forEach(function (service) { service.commandIds.sort(function (a, b) { return a - b; }); });
    return normalized;
  }

  function encodeCapability(role, data) {
    assertRole(COMMAND.CAPABILITY, role, ['request', 'response']);
    if (role === 'response' && hasOwn.call(data, 'resultCode')) return encodeFailureResult(COMMAND.CAPABILITY, data);
    var services = normalizeCapabilityServices(data);
    var structs = services.map(function (service) {
      return encodeContainer(0x02, [
        encodeTLV(0x03, [service.serviceId]),
        encodeTLV(0x04, service.commandIds)
      ]);
    });
    return frame(COMMAND.CAPABILITY, [encodeContainer(0x01, structs)]);
  }

  function decodeCapability(role, bytes) {
    assertRole(COMMAND.CAPABILITY, role, ['request', 'response']);
    var top = parseSequence(bytes, 2, bytes.length);
    if (role === 'response' && isFailureResult(top)) return decodeFailureResult(top, 'capability failure response');
    if (top.length !== 1) fail('PUBLIC_TLV_LAYOUT', 'capability.negotiate requires one Type 0x01 container');
    var list = ensureContainer(top[0], 'capability list');
    if (list.type !== 0x01) fail('PUBLIC_TLV_UNKNOWN', 'capability.negotiate requires Type 0x01');
    var services = list.children.map(function (item) {
      var struct = ensureContainer(item, 'capability service');
      if (struct.type !== 0x02) fail('PUBLIC_TLV_UNKNOWN', 'capability service must use Type 0x02');
      var map = mapByType(struct.children, [0x03, 0x04], 'capability service');
      var serviceBytes = requireValue(map, 0x03, 1, 'capability service');
      var commandBytes = requireValue(map, 0x04, null, 'capability service');
      if (commandBytes.length === 0) fail('PUBLIC_FIELD_LENGTH', 'command_list cannot be empty', 'commandIds');
      var seen = Object.create(null);
      var commandIds = commandBytes.map(function (commandId) {
        if (seen[commandId]) fail('PUBLIC_FIELD_DUPLICATE', 'Duplicate commandId: ' + commandId, 'commandIds');
        seen[commandId] = true;
        return commandId;
      });
      return { serviceId: serviceBytes[0], commandIds: commandIds };
    });
    var seenServices = Object.create(null);
    services.forEach(function (service) {
      if (seenServices[service.serviceId]) fail('PUBLIC_FIELD_DUPLICATE', 'Duplicate serviceId: ' + service.serviceId, 'services');
      seenServices[service.serviceId] = true;
    });
    return { services: services };
  }

  function intersectCapabilities(local, remote) {
    var left = normalizeCapabilityServices(local);
    var right = normalizeCapabilityServices(remote);
    var rightMap = Object.create(null);
    right.forEach(function (service) {
      var commands = Object.create(null);
      service.commandIds.forEach(function (commandId) { commands[commandId] = true; });
      rightMap[service.serviceId] = commands;
    });
    var services = [];
    left.forEach(function (service) {
      if (!rightMap[service.serviceId]) return;
      var commandIds = service.commandIds.filter(function (commandId) {
        return rightMap[service.serviceId][commandId];
      }).sort(function (a, b) { return a - b; });
      if (commandIds.length > 0) services.push({ serviceId: service.serviceId, commandIds: commandIds });
    });
    return { services: services };
  }

  function encodeBattery(role, data) {
    assertRole(COMMAND.BATTERY, role, ['request', 'response', 'report']);
    requireObject(data, 'data');
    if (role === 'response' && hasOwn.call(data, 'resultCode')) return encodeFailureResult(COMMAND.BATTERY, data);
    if (role === 'request') {
      rejectUnknownKeys(data, ['side'], '');
      if (!hasOwn.call(data, 'side') || data.side === undefined) return frame(COMMAND.BATTERY, []);
      var side = requireInteger(data.side, 0, 3, 'side');
      return frame(COMMAND.BATTERY, [encodeTLV(0x03, [side])]);
    }
    rejectUnknownKeys(data, ['batteries'], '');
    if (!Array.isArray(data.batteries) || data.batteries.length === 0) {
      fail('PUBLIC_FIELD_REQUIRED', 'batteries must be a non-empty array', 'batteries');
    }
    var normalized = data.batteries.map(function (battery, index) {
      var path = 'batteries[' + index + ']';
      requireObject(battery, path);
      rejectUnknownKeys(battery, ['side', 'batteryPercent'], path);
      return {
        side: requireInteger(requirePresent(battery, 'side'), 0, 3, path + '.side'),
        batteryPercent: requireInteger(requirePresent(battery, 'batteryPercent'), 0, 100, path + '.batteryPercent')
      };
    });
    normalized.sort(function (left, right) { return left.side - right.side; });
    var groups = normalized.map(function (battery) {
      return encodeContainer(0x02, [encodeTLV(0x03, [battery.side]), encodeTLV(0x04, [battery.batteryPercent])]);
    });
    return frame(COMMAND.BATTERY, [encodeContainer(0x01, groups)]);
  }

  function decodeBattery(role, bytes) {
    assertRole(COMMAND.BATTERY, role, ['request', 'response', 'report']);
    var top = parseSequence(bytes, 2, bytes.length);
    if (role === 'response' && isFailureResult(top)) return decodeFailureResult(top, 'battery failure response');
    if (role === 'request') {
      if (top.length === 0) return {};
      var map = mapByType(top, [0x03], 'battery request');
      return { side: requireValue(map, 0x03, 1, 'battery request')[0] };
    }
    if (top.length !== 1) fail('PUBLIC_TLV_LAYOUT', 'battery response requires one Type 0x01 container');
    var list = ensureContainer(top[0], 'battery list');
    if (list.type !== 0x01) fail('PUBLIC_TLV_UNKNOWN', 'battery response requires Type 0x01');
    if (list.children.length === 0) fail('PUBLIC_FIELD_REQUIRED', 'battery list cannot be empty', 'batteries');
    var batteries = list.children.map(function (item) {
      var struct = ensureContainer(item, 'battery entry');
      if (struct.type !== 0x02) fail('PUBLIC_TLV_UNKNOWN', 'battery entry must use Type 0x02');
      var map = mapByType(struct.children, [0x03, 0x04], 'battery entry');
      var side = requireValue(map, 0x03, 1, 'battery entry')[0];
      var batteryPercent = requireValue(map, 0x04, 1, 'battery entry')[0];
      if (side > 3) fail('PUBLIC_FIELD_RANGE', 'battery side must be 0..3', 'side');
      if (batteryPercent > 100) fail('PUBLIC_FIELD_RANGE', 'batteryPercent must be 0..100', 'batteryPercent');
      return { side: side, batteryPercent: batteryPercent };
    });
    return { batteries: batteries };
  }

  function encodeBroadcast(role, data) {
    assertRole(COMMAND.BROADCAST, role, ['request', 'response']);
    requireObject(data, 'data');
    if (role === 'request') {
      rejectUnknownKeys(data, ['enabled'], '');
      var enabled = requirePresent(data, 'enabled');
      if (typeof enabled !== 'boolean') fail('PUBLIC_FIELD_TYPE', 'enabled must be boolean', 'enabled');
      return frame(COMMAND.BROADCAST, [encodeTLV(0x01, [enabled ? 1 : 0])]);
    }
    rejectUnknownKeys(data, ['resultCode'], '');
    var resultCode = requireInteger(requirePresent(data, 'resultCode'), 0, 0xffffffff, 'resultCode');
    return frame(COMMAND.BROADCAST, [encodeTLV(0x7f, u32(resultCode))]);
  }

  function decodeBroadcast(role, bytes) {
    assertRole(COMMAND.BROADCAST, role, ['request', 'response']);
    var top = parseSequence(bytes, 2, bytes.length);
    if (role === 'request') {
      var requestMap = mapByType(top, [0x01], 'broadcast request');
      var value = requireValue(requestMap, 0x01, 1, 'broadcast request')[0];
      if (value > 1) fail('PUBLIC_FIELD_RANGE', 'device_pairing_enable must be 0 or 1', 'enabled');
      return { enabled: value === 1 };
    }
    var responseMap = mapByType(top, [0x7f], 'broadcast response');
    return { resultCode: readU32(requireValue(responseMap, 0x7f, 4, 'broadcast response')) };
  }

  var PROVISION_WIFI_KEYS = ['remoteType', 'ssid', 'password', 'token', 'encryptionType', 'cipher', 'mqttUrl'];
  var PROVISION_HALOW_KEYS = ['remoteType', 'ssid', 'password', 'token', 'channelList', 'bandwidth', 'txPower', 'superpower', 'cameraIp'];

  function encodeProvision(role, data) {
    assertRole(COMMAND.PROVISION, role, ['request']);
    requireObject(data, 'data');
    var remoteType = requireInteger(requirePresent(data, 'remoteType'), 0, 1, 'remoteType');
    var keys = remoteType === 0 ? PROVISION_WIFI_KEYS : PROVISION_HALOW_KEYS;
    rejectUnknownKeys(data, keys, '');
    keys.forEach(function (key) { requirePresent(data, key); });
    var parts = [encodeTLV(0x01, [remoteType])];
    parts.push(encodeTLV(0x02, rawFieldBytes(data.ssid, 'ssid')));
    parts.push(encodeTLV(0x03, rawFieldBytes(data.password, 'password')));
    parts.push(encodeTLV(0x04, rawFieldBytes(data.token, 'token')));
    if (remoteType === 0) {
      parts.push(encodeTLV(0x05, [requireInteger(data.encryptionType, 0, 8, 'encryptionType')]));
      parts.push(encodeTLV(0x06, [requireInteger(data.cipher, 0, 3, 'cipher')]));
      parts.push(encodeTLV(0x07, rawFieldBytes(data.mqttUrl, 'mqttUrl')));
    } else {
      parts.push(encodeTLV(0x08, rawFieldBytes(data.channelList, 'channelList')));
      var bandwidth = requireInteger(data.bandwidth, 1, 8, 'bandwidth');
      if ([1, 2, 4, 8].indexOf(bandwidth) === -1) fail('PUBLIC_FIELD_RANGE', 'bandwidth must be 1, 2, 4, or 8', 'bandwidth');
      parts.push(encodeTLV(0x09, [bandwidth]));
      parts.push(encodeTLV(0x0a, [requireInteger(data.txPower, 1, 20, 'txPower')]));
      parts.push(encodeTLV(0x0b, [requireInteger(data.superpower, 0, 2, 'superpower')]));
      parts.push(encodeTLV(0x0c, [requireInteger(data.cameraIp, 0, 255, 'cameraIp')]));
    }
    return frame(COMMAND.PROVISION, parts);
  }

  function decodeProvision(role, bytes) {
    assertRole(COMMAND.PROVISION, role, ['request']);
    var top = parseSequence(bytes, 2, bytes.length);
    var allTypes = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c];
    var map = mapByType(top, allTypes, 'provision request');
    var remoteType = requireValue(map, 0x01, 1, 'provision request')[0];
    if (remoteType > 1) fail('PUBLIC_FIELD_RANGE', 'remoteType must be 0 or 1', 'remoteType');
    var required = remoteType === 0 ? [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07] : [0x01, 0x02, 0x03, 0x04, 0x08, 0x09, 0x0a, 0x0b, 0x0c];
    required.forEach(function (type) { requireValue(map, type, null, 'provision request'); });
    var forbidden = remoteType === 0 ? [0x08, 0x09, 0x0a, 0x0b, 0x0c] : [0x05, 0x06, 0x07];
    forbidden.forEach(function (type) {
      if (map[type]) fail('PUBLIC_TLV_UNKNOWN', 'Unexpected Type 0x' + type.toString(16).toUpperCase() + ' for remoteType ' + remoteType);
    });
    var data = {
      remoteType: remoteType,
      ssid: rawHex(map[0x02].value),
      password: rawHex(map[0x03].value),
      token: rawHex(map[0x04].value)
    };
    if (remoteType === 0) {
      if (map[0x05].value.length !== 1) fail('PUBLIC_FIELD_LENGTH', 'encryptionType must have Length 1', 'encryptionType');
      if (map[0x06].value.length !== 1) fail('PUBLIC_FIELD_LENGTH', 'cipher must have Length 1', 'cipher');
      data.encryptionType = map[0x05].value[0];
      data.cipher = map[0x06].value[0];
      if (data.encryptionType > 8) fail('PUBLIC_FIELD_RANGE', 'encryptionType must be 0..8', 'encryptionType');
      if (data.cipher > 3) fail('PUBLIC_FIELD_RANGE', 'cipher must be 0..3', 'cipher');
      data.mqttUrl = rawHex(map[0x07].value);
    } else {
      if (map[0x09].value.length !== 1) fail('PUBLIC_FIELD_LENGTH', 'bandwidth must have Length 1', 'bandwidth');
      if (map[0x0a].value.length !== 1) fail('PUBLIC_FIELD_LENGTH', 'txPower must have Length 1', 'txPower');
      if (map[0x0b].value.length !== 1) fail('PUBLIC_FIELD_LENGTH', 'superpower must have Length 1', 'superpower');
      if (map[0x0c].value.length !== 1) fail('PUBLIC_FIELD_LENGTH', 'cameraIp must have Length 1', 'cameraIp');
      data.channelList = rawHex(map[0x08].value);
      data.bandwidth = map[0x09].value[0];
      data.txPower = map[0x0a].value[0];
      data.superpower = map[0x0b].value[0];
      data.cameraIp = map[0x0c].value[0];
      if ([1, 2, 4, 8].indexOf(data.bandwidth) === -1) fail('PUBLIC_FIELD_RANGE', 'bandwidth must be 1, 2, 4, or 8', 'bandwidth');
      if (data.txPower < 1 || data.txPower > 20) fail('PUBLIC_FIELD_RANGE', 'txPower must be 1..20', 'txPower');
      if (data.superpower > 2) fail('PUBLIC_FIELD_RANGE', 'superpower must be 0..2', 'superpower');
    }
    return data;
  }

  function encodeProvisionStatus(role, data) {
    assertRole(COMMAND.PROVISION_STATUS, role, ['query', 'response', 'report']);
    requireObject(data, 'data');
    if (role === 'response' && hasOwn.call(data, 'resultCode')) {
      return encodeFailureResult(COMMAND.PROVISION_STATUS, data);
    }
    if (role === 'query') {
      rejectUnknownKeys(data, ['remoteType', 'selectors'], '');
      if (!hasOwn.call(data, 'remoteType') || data.remoteType === undefined) {
        if (data.selectors !== undefined) {
          fail('PUBLIC_FIELD_REQUIRED', 'remoteType is required when selectors are supplied', 'remoteType');
        }
        return frame(COMMAND.PROVISION_STATUS, []);
      }
      var queryRemote = requireInteger(data.remoteType, 0, 1, 'remoteType');
      var selectors = [0x02, 0x03, 0x04];
      if (data.selectors !== undefined) {
        if (!Array.isArray(data.selectors)) fail('PUBLIC_FIELD_TYPE', 'selectors must be an array', 'selectors');
        var seenSelectors = Object.create(null);
        selectors = data.selectors.map(function (selector, index) {
          if ([0x02, 0x03, 0x04].indexOf(selector) === -1) {
            fail('PUBLIC_FIELD_RANGE', 'selectors[' + index + '] must be 2, 3, or 4', 'selectors');
          }
          if (seenSelectors[selector]) fail('PUBLIC_FIELD_DUPLICATE', 'Duplicate status selector: ' + selector, 'selectors');
          seenSelectors[selector] = true;
          return selector;
        }).sort(function (a, b) { return a - b; });
      }
      var queryParts = [encodeTLV(0x01, [queryRemote])];
      selectors.forEach(function (selector) { queryParts.push(encodeTLV(selector, [])); });
      return frame(COMMAND.PROVISION_STATUS, queryParts);
    }
    rejectUnknownKeys(data, ['remoteType', 'connectionStatus', 'errorCode', 'devBindStatus'], '');
    var remoteType = requireInteger(requirePresent(data, 'remoteType'), 0, 1, 'remoteType');
    var connectionStatus = requireInteger(requirePresent(data, 'connectionStatus'), 0, 4, 'connectionStatus');
    var errorCode = requireInteger(requirePresent(data, 'errorCode'), 0, 255, 'errorCode');
    var devBindStatus = requireInteger(requirePresent(data, 'devBindStatus'), 0, 6, 'devBindStatus');
    return frame(COMMAND.PROVISION_STATUS, [
      encodeTLV(0x01, [remoteType]),
      encodeTLV(0x02, [connectionStatus]),
      encodeTLV(0x03, [errorCode]),
      encodeTLV(0x04, [devBindStatus])
    ]);
  }

  function decodeProvisionStatus(role, bytes) {
    assertRole(COMMAND.PROVISION_STATUS, role, ['query', 'response', 'report']);
    var top = parseSequence(bytes, 2, bytes.length);
    if (role === 'response' && isFailureResult(top)) {
      return decodeFailureResult(top, 'provisioning status failure response');
    }
    if (role === 'query' && top.length === 0) return {};
    var map = mapByType(top, [0x01, 0x02, 0x03, 0x04], 'provision status');
    if (role === 'query' && !map[0x01]) {
      fail('PUBLIC_TLV_LAYOUT', 'A nonempty status query requires remoteType');
    }
    var remoteType = requireValue(map, 0x01, 1, 'provision status')[0];
    if (remoteType > 1) fail('PUBLIC_FIELD_RANGE', 'remoteType must be 0 or 1', 'remoteType');
    if (role === 'query') {
      var selectors = [];
      [0x02, 0x03, 0x04].forEach(function (type) {
        if (!map[type]) return;
        if (map[type].value.length !== 0) fail('PUBLIC_FIELD_LENGTH', 'Query status Type 0x' + type.toString(16).toUpperCase() + ' must have Length 0');
        selectors.push(type);
      });
      return { remoteType: remoteType, selectors: selectors };
    }
    var connectionStatus = requireValue(map, 0x02, 1, 'provision status')[0];
    var errorCode = requireValue(map, 0x03, 1, 'provision status')[0];
    var devBindStatus = requireValue(map, 0x04, 1, 'provision status')[0];
    if (connectionStatus > 4) fail('PUBLIC_FIELD_RANGE', 'connectionStatus must be 0..4', 'connectionStatus');
    if (devBindStatus > 6) fail('PUBLIC_FIELD_RANGE', 'devBindStatus must be 0..6', 'devBindStatus');
    return {
      remoteType: remoteType,
      connectionStatus: connectionStatus,
      errorCode: errorCode,
      devBindStatus: devBindStatus
    };
  }

  var DEVICE_INFO_FIELDS = Object.freeze([
    { name: 'btVersion', type: 0x01, kind: 'utf8' },
    { name: 'deviceType', type: 0x02, kind: 'u8', min: 0, max: 255 },
    { name: 'deviceVersion', type: 0x03, kind: 'utf8' },
    { name: 'deviceFwVersion', type: 0x04, kind: 'utf8' },
    { name: 'deviceMac', type: 0x05, kind: 'bytes' },
    { name: 'deviceSn', type: 0x06, kind: 'utf8' },
    { name: 'deviceModel', type: 0x07, kind: 'utf8' },
    { name: 'deviceName', type: 0x08, kind: 'utf8' },
    { name: 'deviceSignType', type: 0x09, kind: 'u8', min: 0, max: 255 },
    { name: 'deviceSign', type: 0x0a, kind: 'bytes' },
    { name: 'productKey', type: 0x0b, kind: 'bytes' },
    { name: 'uid', type: 0x0c, kind: 'bytes' },
    { name: 'userAccount', type: 0x0d, kind: 'bytes' }
  ]);
  var DEVICE_INFO_DEFAULT_REQUIRED = ['btVersion', 'deviceType', 'deviceFwVersion'];

  function deviceInfoFieldByName(name) {
    for (var i = 0; i < DEVICE_INFO_FIELDS.length; i += 1) {
      if (DEVICE_INFO_FIELDS[i].name === name) return DEVICE_INFO_FIELDS[i];
    }
    return null;
  }

  function deviceInfoFieldByType(type) {
    for (var i = 0; i < DEVICE_INFO_FIELDS.length; i += 1) {
      if (DEVICE_INFO_FIELDS[i].type === type) return DEVICE_INFO_FIELDS[i];
    }
    return null;
  }

  function normalizeRequiredFields(options) {
    var required = DEVICE_INFO_DEFAULT_REQUIRED.slice();
    if (!options || options.requiredFields === undefined) return required;
    if (!Array.isArray(options.requiredFields)) fail('PUBLIC_FIELD_TYPE', 'options.requiredFields must be an array', 'requiredFields');
    options.requiredFields.forEach(function (name) {
      if (!deviceInfoFieldByName(name)) fail('PUBLIC_FIELD_UNKNOWN', 'Unknown required deviceInfo field: ' + name, 'requiredFields');
      if (required.indexOf(name) === -1) required.push(name);
    });
    return required;
  }

  function productByteLength(field, options) {
    if (!options || options.fieldLengths === undefined) return undefined;
    requireObject(options.fieldLengths, 'fieldLengths');
    Object.keys(options.fieldLengths).forEach(function (name) {
      var definition = deviceInfoFieldByName(name);
      if (!definition || definition.kind !== 'bytes') fail('PUBLIC_FIELD_UNKNOWN', 'fieldLengths must name a raw-byte field');
      requireInteger(options.fieldLengths[name], 0, MAX_VALUE_BYTES, 'fieldLengths.' + name);
    });
    return options.fieldLengths[field.name];
  }

  function encodeDeviceInfo(role, data, options) {
    assertRole(COMMAND.DEVICE_INFO, role, ['request', 'response']);
    requireObject(data, 'data');
    if (role === 'response' && hasOwn.call(data, 'resultCode')) return encodeFailureResult(COMMAND.DEVICE_INFO, data);
    var selected;
    if (role === 'request') {
      rejectUnknownKeys(data, ['fields'], '');
      selected = data.fields;
      if (selected === undefined || selected === null) selected = [];
      if (!Array.isArray(selected)) {
        fail('PUBLIC_FIELD_TYPE', 'deviceInfo fields must be an array', 'fields');
      }
      if (selected.length === 0) return frame(COMMAND.DEVICE_INFO, []);
      var seenRequestFields = Object.create(null);
      selected = selected.map(function (name) {
        var field = deviceInfoFieldByName(name);
        if (!field) fail('PUBLIC_FIELD_UNKNOWN', 'Unknown deviceInfo field: ' + String(name), 'fields');
        if (seenRequestFields[name]) fail('PUBLIC_FIELD_DUPLICATE', 'Duplicate deviceInfo field: ' + name, 'fields');
        seenRequestFields[name] = true;
        return field;
      }).sort(function (a, b) { return a.type - b.type; });
      return frame(COMMAND.DEVICE_INFO, selected.map(function (field) { return encodeTLV(field.type, []); }));
    }

    var allowedNames = DEVICE_INFO_FIELDS.map(function (field) { return field.name; });
    rejectUnknownKeys(data, allowedNames, '');
    var required = normalizeRequiredFields(options);
    required.forEach(function (name) {
      if (!hasOwn.call(data, name) || data[name] === undefined) {
        fail('PUBLIC_FIELD_REQUIRED', 'Missing required deviceInfo field: ' + name, name);
      }
    });
    var parts = [];
    DEVICE_INFO_FIELDS.forEach(function (field) {
      if (!hasOwn.call(data, field.name) || data[field.name] === undefined) return;
      var value;
      if (field.kind === 'utf8') value = utf8Bytes(data[field.name], field.name);
      else if (field.kind === 'bytes') {
        value = normalizeBytes(data[field.name], field.name);
        var requiredWidth = productByteLength(field, options);
        if (requiredWidth !== undefined && value.length !== requiredWidth) {
          fail('PUBLIC_FIELD_LENGTH', field.name + ' violates the explicitly adopted product byte length', field.name);
        }
      } else value = [requireInteger(data[field.name], field.min, field.max, field.name)];
      parts.push(encodeTLV(field.type, value));
    });
    return frame(COMMAND.DEVICE_INFO, parts);
  }

  function decodeDeviceInfo(role, bytes, options) {
    assertRole(COMMAND.DEVICE_INFO, role, ['request', 'response']);
    var top = parseSequence(bytes, 2, bytes.length);
    if (role === 'response' && isFailureResult(top)) return decodeFailureResult(top, 'deviceInfo failure response');
    var knownTypes = DEVICE_INFO_FIELDS.map(function (field) { return field.type; });
    var map = mapByType(top, knownTypes, 'deviceInfo');
    if (role === 'request') {
      var fields = top.map(function (item) {
        if (item.value.length !== 0) fail('PUBLIC_FIELD_LENGTH', 'deviceInfo request fields must have Length 0', deviceInfoFieldByType(item.type).name);
        return deviceInfoFieldByType(item.type).name;
      });
      return { fields: fields };
    }
    var required = normalizeRequiredFields(options);
    required.forEach(function (name) {
      var field = deviceInfoFieldByName(name);
      if (!map[field.type]) fail('PUBLIC_FIELD_REQUIRED', 'Missing required deviceInfo field: ' + name, name);
    });
    var data = {};
    Object.keys(map).map(Number).sort(function (a, b) { return a - b; }).forEach(function (type) {
      var field = deviceInfoFieldByType(type);
      var value = map[type].value;
      if (field.kind === 'utf8') data[field.name] = utf8String(value, field.name);
      else if (field.kind === 'bytes') {
        var requiredWidth = productByteLength(field, options);
        if (requiredWidth !== undefined && value.length !== requiredWidth) {
          fail('PUBLIC_FIELD_LENGTH', field.name + ' violates the explicitly adopted product byte length', field.name);
        }
        data[field.name] = rawHex(value);
      } else {
        if (value.length !== 1) fail('PUBLIC_FIELD_LENGTH', field.name + ' must have Length 1', field.name);
        if (value[0] < field.min || value[0] > field.max) fail('PUBLIC_FIELD_RANGE', field.name + ' is outside its declared range', field.name);
        data[field.name] = value[0];
      }
    });
    return data;
  }

  function encode(command, role, data, options) {
    if (!hasOwn.call(CID_BY_COMMAND, command)) fail('PUBLIC_COMMAND_UNKNOWN', 'Unknown public command: ' + String(command), 'command');
    data = data === undefined ? {} : data;
    switch (command) {
      case COMMAND.CAPABILITY: return encodedResult(command, role, encodeCapability(role, data));
      case COMMAND.BATTERY: return encodedResult(command, role, encodeBattery(role, data));
      case COMMAND.BROADCAST: return encodedResult(command, role, encodeBroadcast(role, data));
      case COMMAND.PROVISION: return encodedResult(command, role, encodeProvision(role, data));
      case COMMAND.PROVISION_STATUS: return encodedResult(command, role, encodeProvisionStatus(role, data));
      case COMMAND.DEVICE_INFO: return encodedResult(command, role, encodeDeviceInfo(role, data, options));
      default: fail('PUBLIC_COMMAND_UNKNOWN', 'Unknown public command: ' + String(command), 'command');
    }
  }

  function validateFrameHeader(command, bytes) {
    if (bytes.length === 0) fail('PUBLIC_PDU_TRUNCATED', 'Public PDU is empty');
    if (bytes.length > MAX_PDU_BYTES) fail('PUBLIC_PDU_TOO_LARGE', 'Public application PDU exceeds 2048 bytes');
    if (bytes.length < 2) fail('PUBLIC_PDU_TRUNCATED', 'Public PDU is missing SID/CID');
    if (bytes[0] !== SID) fail('PUBLIC_SID_MISMATCH', 'Public PDU SID must be 0x01');
    if (bytes[1] !== CID_BY_COMMAND[command]) {
      fail('PUBLIC_CID_MISMATCH', 'Public PDU CID 0x' + bytes[1].toString(16).toUpperCase() + ' does not match ' + command);
    }
  }

  function decode(command, role, input, options) {
    if (!hasOwn.call(CID_BY_COMMAND, command)) fail('PUBLIC_COMMAND_UNKNOWN', 'Unknown public command: ' + String(command), 'command');
    var bytes = parseInputBytes(input, 'wire');
    validateFrameHeader(command, bytes);
    var data;
    switch (command) {
      case COMMAND.CAPABILITY: data = decodeCapability(role, bytes); break;
      case COMMAND.BATTERY: data = decodeBattery(role, bytes); break;
      case COMMAND.BROADCAST: data = decodeBroadcast(role, bytes); break;
      case COMMAND.PROVISION: data = decodeProvision(role, bytes); break;
      case COMMAND.PROVISION_STATUS: data = decodeProvisionStatus(role, bytes); break;
      case COMMAND.DEVICE_INFO: data = decodeDeviceInfo(role, bytes, options); break;
      default: fail('PUBLIC_COMMAND_UNKNOWN', 'Unknown public command: ' + String(command), 'command');
    }
    return {
      command: command,
      sid: SID,
      cid: CID_BY_COMMAND[command],
      role: role,
      data: data,
      bytes: bytes,
      hex: wireHex(bytes),
      byteLength: bytes.length
    };
  }

  var api = {
    MAX_VALUE_BYTES: MAX_VALUE_BYTES,
    MAX_PDU_BYTES: MAX_PDU_BYTES,
    SID: SID,
    COMMAND: COMMAND,
    CID_BY_COMMAND: CID_BY_COMMAND,
    PROVISION_STATUS_NAMES: PROVISION_STATUS_NAMES,
    PROVISION_ERROR_CODES: PROVISION_ERROR_CODES,
    DEVICE_INFO_FIELDS: DEVICE_INFO_FIELDS,
    encodeLength: encodeLength,
    decodeLength: decodeLength,
    encode: encode,
    decode: decode,
    intersectCapabilities: intersectCapabilities
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BLEPublicCommands = api;
})(typeof window !== 'undefined' ? window : this);
