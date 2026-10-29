/* System-owned GATT carrier profiles for the local 0.6.1 prototype. Static demo only. */
(function attachBLEGattProfile(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BLEGattProfile = api;
})(typeof window !== 'undefined' ? window : globalThis, function createBLEGattProfile() {
  'use strict';

  var VERSION = '0.6.1';
  var PROFILE_REVISION = '2026-10-29-demo-r1';
  var SERVICE_ID = 8;
  var SERVICE_FUNCTION = 0;
  var DOWN_FUNCTION = 4;
  var UP_FUNCTION = 16;
  var DOWN_METHOD = 'writeWithoutResponse';
  var UP_METHOD = 'notify';
  var UUID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/;

  function copy(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function each(key) { freeze(value[key]); });
    return value;
  }

  var PROFILES = freeze({
    pump: {
      key: 'pump',
      profileId: 'system-gatt-pump-future-demo',
      productId: 'PUMP_NEXT_DEMO',
      transportRef: 'demo/pump-confirmed-transport',
      displayName: '便携吸奶器 P1',
      sourceLabel: '未来产品配置演示',
      boundaryLabel: '未来 pump 显式配置，非 BM08S 现网映射',
      serviceId: SERVICE_ID,
      serviceFunction: SERVICE_FUNCTION,
      downFunction: DOWN_FUNCTION,
      upFunction: UP_FUNCTION,
      driverRegistration: 'pending',
      simulationOnly: true,
      serviceUuid: '4C540001-0101-0800-0100-4D4341496F54',
      downUuid: '4C540001-0101-0804-0100-4D4341496F54',
      upUuid: '4C540001-0101-0810-0100-4D4341496F54'
    },
    camera: {
      key: 'camera',
      profileId: 'system-gatt-camera-future-demo',
      productId: 'CAMERA_NEXT_DEMO',
      transportRef: 'demo/camera-confirmed-transport',
      displayName: '室内摄像头 C1',
      sourceLabel: '派生演示配置',
      boundaryLabel: '未来 camera 派生演示，非 BM08S 现网映射',
      serviceId: SERVICE_ID,
      serviceFunction: SERVICE_FUNCTION,
      downFunction: DOWN_FUNCTION,
      upFunction: UP_FUNCTION,
      driverRegistration: 'pending',
      simulationOnly: true,
      serviceUuid: '4C540002-0101-0800-0100-7D3F9A2C1E8B',
      downUuid: '4C540002-0101-0804-0100-7D3F9A2C1E8B',
      upUuid: '4C540002-0101-0810-0100-7D3F9A2C1E8B'
    },
    generic: {
      key: 'generic',
      profileId: 'system-gatt-generic-engineering-demo',
      productId: 'GENERIC_DEVICE_DEMO',
      transportRef: 'demo/generic-confirmed-transport',
      displayName: '通用设备 G1',
      sourceLabel: '显式工程演示',
      boundaryLabel: '工程演示值，非正式登记；不按 SID 动态拼接',
      serviceId: SERVICE_ID,
      serviceFunction: SERVICE_FUNCTION,
      downFunction: DOWN_FUNCTION,
      upFunction: UP_FUNCTION,
      driverRegistration: 'pending',
      simulationOnly: true,
      serviceUuid: '4C5400FF-0101-0800-0100-4D4341496F54',
      downUuid: '4C5400FF-0101-0804-0100-4D4341496F54',
      upUuid: '4C5400FF-0101-0810-0100-4D4341496F54'
    }
  });

  var SCENARIOS = freeze([
    { id: 'normal', label: '标准发现 · Notify 已开启', description: 'Service 08/Func00、下行 08/04 WWR、上行 08/10 Notify 全部匹配。' },
    { id: 'missing-service', label: '缺少 Service 08/Func00', description: '发现结果中没有目标服务。' },
    { id: 'missing-down', label: '缺少下行 08/04 特征', description: '目标服务存在，但下行特征缺失。' },
    { id: 'missing-up', label: '缺少上行 08/10 特征', description: '目标服务存在，但上行特征缺失。' },
    { id: 'service-uuid-mismatch', label: 'Service UUID 不符', description: '完整 Service UUID 与系统显式配置不一致。' },
    { id: 'down-uuid-mismatch', label: '下行 UUID 不符', description: '下行特征 UUID 与 08/04 显式配置不一致。' },
    { id: 'up-uuid-mismatch', label: '上行 UUID 不符', description: '上行特征 UUID 与 08/10 显式配置不一致。' },
    { id: 'down-property-mismatch', label: '下行属性不是 WWR', description: '下行特征没有 writeWithoutResponse 属性。' },
    { id: 'up-property-mismatch', label: '上行属性不是 Notify', description: '上行特征没有 notify 属性。' },
    { id: 'notify-disabled', label: 'Notify 未开启', description: '服务与 UUID 正确，但 GATT Notify 尚未启用。' }
  ]);

  function profileList() {
    return [copy(PROFILES.pump), copy(PROFILES.camera), copy(PROFILES.generic)];
  }

  function resolveProfile(input) {
    var profileKey = typeof input === 'string' && PROFILES[input] ? input : null;
    var productId = typeof input === 'string' ? (profileKey ? null : input) : input && input.productId;
    var transportRef = typeof input === 'object' && input ? input.transportRef : null;
    var values = Object.keys(PROFILES).map(function get(key) { return PROFILES[key]; });
    var matches = values.filter(function find(item) {
      if (profileKey && item.key !== profileKey) return false;
      if (productId && item.productId !== productId) return false;
      if (transportRef && item.transportRef !== transportRef) return false;
      return !!(profileKey || productId || transportRef);
    });
    return matches.length === 1 ? copy(matches[0]) : null;
  }

  function expectedEndpoint(profile, key) {
    if (!profile) return null;
    if (key === 'service') {
      return {
        key: 'service',
        present: true,
        uuid: profile.serviceUuid,
        parentServiceUuid: null,
        serviceId: SERVICE_ID,
        functionId: SERVICE_FUNCTION,
        requiredProperties: []
      };
    }
    if (key === 'down') {
      return {
        key: 'down',
        present: true,
        uuid: profile.downUuid,
        parentServiceUuid: profile.serviceUuid,
        serviceId: SERVICE_ID,
        functionId: DOWN_FUNCTION,
        requiredProperties: [DOWN_METHOD]
      };
    }
    return {
      key: 'up',
      present: true,
      uuid: profile.upUuid,
      parentServiceUuid: profile.serviceUuid,
      serviceId: SERVICE_ID,
      functionId: UP_FUNCTION,
      requiredProperties: [UP_METHOD],
      notifyEnabled: true
    };
  }

  function expectedDiscovery(profile) {
    return {
      service: expectedEndpoint(profile, 'service'),
      down: expectedEndpoint(profile, 'down'),
      up: expectedEndpoint(profile, 'up')
    };
  }

  function mutateUuid(uuid, groupIndex, replacement) {
    var parts = String(uuid || '').split('-');
    parts[groupIndex] = replacement;
    return parts.join('-');
  }

  function discoveryForScenario(profile, scenarioId) {
    var discovery = expectedDiscovery(profile);
    switch (scenarioId) {
      case 'normal':
        return discovery;
      case 'missing-service':
        discovery.service.present = false;
        break;
      case 'missing-down':
        discovery.down.present = false;
        break;
      case 'missing-up':
        discovery.up.present = false;
        break;
      case 'service-uuid-mismatch':
        discovery.service.uuid = mutateUuid(discovery.service.uuid, 2, '0801');
        break;
      case 'down-uuid-mismatch':
        discovery.down.uuid = mutateUuid(discovery.down.uuid, 2, '0805');
        break;
      case 'up-uuid-mismatch':
        discovery.up.uuid = mutateUuid(discovery.up.uuid, 2, '0811');
        break;
      case 'down-property-mismatch':
        discovery.down.requiredProperties = ['write'];
        break;
      case 'up-property-mismatch':
        discovery.up.requiredProperties = ['indicate'];
        break;
      case 'notify-disabled':
        discovery.up.notifyEnabled = false;
        break;
      default:
        throw new Error('未知 GATT 演示场景：' + scenarioId);
    }
    return discovery;
  }

  function uuidLayoutErrors(profile) {
    var errors = [];
    function check(name, uuid, func) {
      var match = UUID_PATTERN.test(String(uuid || ''));
      var parts = String(uuid || '').split('-');
      if (!match) {
        errors.push({ code: 'GATT_PROFILE_UUID_INVALID', path: name, message: '系统显式配置必须保存完整 128-bit UUID。' });
        return;
      }
      if (parts[2] !== '08' + Number(func).toString(16).padStart(2, '0')) {
        errors.push({ code: 'GATT_PROFILE_FUNCTION_MISMATCH', path: name, message: 'UUID 第 3 段必须表达 Service 08 / Func ' + Number(func).toString(16).padStart(2, '0').toUpperCase() + '。' });
      }
      if (parts[3] !== '0100') {
        errors.push({ code: 'GATT_PROFILE_FOURTH_SEGMENT', path: name, message: '用户确认的 UUID 第 4 段必须为 0100。' });
      }
    }
    if (!profile) return [{ code: 'GATT_PROFILE_MISSING', path: 'transportRef', message: '协议方案没有可解析的显式 GATT 配置。' }];
    check('Service 08/Func00 UUID', profile.serviceUuid, SERVICE_FUNCTION);
    check('下行 08/04 UUID', profile.downUuid, DOWN_FUNCTION);
    check('上行 08/10 UUID', profile.upUuid, UP_FUNCTION);
    if (!profile.serviceUuid || !profile.downUuid || !profile.upUuid) {
      errors.push({ code: 'GATT_PROFILE_ENDPOINT_MISSING', path: '系统 GATT 配置', message: '三个端点必须使用显式完整 UUID。' });
    }
    return errors;
  }

  function validateDiscovery(profile, discovery) {
    var errors = uuidLayoutErrors(profile);
    if (!discovery) {
      errors.push({ code: 'GATT_DISCOVERY_MISSING', path: 'GATT 发现结果', message: '没有可校验的 GATT 服务与特征发现结果，禁止进入 READY。' });
      return errors;
    }
    if (!profile) return errors;
    var service = discovery.service;
    if (!service || service.present === false) {
      errors.push({ code: 'GATT_SERVICE_MISSING', path: 'Service 08/Func00', message: '未发现协议方案指定的 GATT 服务，禁止进入 READY。' });
      return errors;
    }
    if (service.uuid !== profile.serviceUuid) {
      errors.push({ code: 'GATT_SERVICE_UUID_MISMATCH', path: 'Service 08/Func00', message: '发现的服务 UUID 与系统显式配置不一致。' });
    }

    ['down', 'up'].forEach(function checkCharacteristic(key) {
      var expected = expectedEndpoint(profile, key);
      var actual = discovery[key];
      var path = key === 'down' ? '下行特征 08/04' : '上行特征 08/10';
      if (!actual || actual.present === false) {
        errors.push({ code: 'GATT_CHARACTERISTIC_MISSING', path: path, message: '协议方案要求的 GATT 特征缺失，禁止进入 READY。' });
        return;
      }
      if (actual.uuid !== expected.uuid) {
        errors.push({ code: key === 'down' ? 'GATT_DOWN_UUID_MISMATCH' : 'GATT_UP_UUID_MISMATCH', path: path, message: '特征的完整 UUID 与系统显式配置不一致。' });
      }
      if (actual.parentServiceUuid !== profile.serviceUuid) {
        errors.push({ code: 'GATT_PARENT_SERVICE_MISMATCH', path: path, message: '特征所属 Service 与系统显式配置不一致。' });
      }
      var properties = Array.isArray(actual.properties) ? actual.properties : actual.requiredProperties || [];
      var required = expected.requiredProperties[0];
      if (!properties.includes(required)) {
        errors.push({
          code: key === 'down' ? 'GATT_DOWN_PROPERTY_MISMATCH' : 'GATT_UP_PROPERTY_MISMATCH',
          path: path,
          message: key === 'down' ? '下行特征必须声明 writeWithoutResponse（WWR）。' : '上行特征必须声明 notify。'
        });
      }
      if (key === 'up' && actual.notifyEnabled !== true) {
        errors.push({ code: 'GATT_NOTIFY_DISABLED', path: '上行特征 08/10', message: 'GATT Notify 尚未开启，禁止进入 READY。' });
      }
    });
    return errors;
  }

  function Carrier(options) {
    options = options || {};
    this.profile = options.profile ? copy(options.profile) : resolveProfile(options);
    this.appTransport = options.appTransport || null;
    this.sequence = 0;
    this.dynamicSequence = 0;
    this.status = 'idle';
    this.scenario = 'normal';
    this.discovery = this.profile ? discoveryForScenario(this.profile, this.scenario) : null;
    this.errors = this.profile ? [] : uuidLayoutErrors(null);
    this.transfers = [];
    this.notifications = [];
    this.writeCompletions = [];
    this.linkAcks = [];
    this.logs = [];
    if (!this.profile) this.status = 'blocked';
  }

  Carrier.prototype._next = function _next(prefix) {
    this.dynamicSequence += 1;
    return prefix + '-' + String(this.dynamicSequence).padStart(2, '0');
  };

  Carrier.prototype._log = function _log(type, message, detail) {
    this.sequence += 1;
    var entry = { sequence: this.sequence, type: type, message: message, detail: copy(detail || null) };
    this.logs.push(entry);
    if (this.logs.length > 80) this.logs.shift();
    return entry;
  };

  Carrier.prototype.setScenario = function setScenario(scenarioId) {
    if (!SCENARIOS.some(function find(item) { return item.id === scenarioId; })) {
      return { ok: false, code: 'GATT_SCENARIO_INVALID', message: '未知 GATT 演示场景。' };
    }
    this.scenario = scenarioId;
    this.scenarioLabel = (SCENARIOS.find(function find(item) { return item.id === scenarioId; }) || {}).label;
    this.discovery = this.profile ? discoveryForScenario(this.profile, scenarioId) : null;
    this.status = 'idle';
    this.errors = this.profile ? [] : uuidLayoutErrors(null);
    this._log('scenario', '切换诊断场景：' + this.scenarioLabel, { scenario: scenarioId });
    return { ok: true, code: null, message: null, snapshot: this.snapshot() };
  };

  Carrier.prototype.connect = function connect(discovery) {
    if (arguments.length) this.discovery = discovery ? copy(discovery) : null;
    this.errors = validateDiscovery(this.profile, this.discovery);
    if (this.errors.length) {
      this.status = 'blocked';
      this._log('blocked', 'GATT 配置校验失败，未进入 READY。', { errors: this.errors });
      return { ok: false, code: this.errors[0].code, message: this.errors[0].message, errors: copy(this.errors), snapshot: this.snapshot() };
    }
    this.status = 'ready';
    this._log('ready', 'GATT 服务、特征、UUID、属性和 Notify 校验通过。', {
      serviceId: SERVICE_ID,
      serviceFunction: SERVICE_FUNCTION,
      downFunction: DOWN_FUNCTION,
      upFunction: UP_FUNCTION
    });
    return { ok: true, code: null, message: 'GATT 承载校验通过，进入 READY。', snapshot: this.snapshot() };
  };

  Carrier.prototype.recover = function recover() {
    this.setScenario('normal');
    this.errors = [];
    return this.connect(this.discovery);
  };

  Carrier.prototype.invalidate = function invalidate(reason) {
    this.status = 'stale';
    this.discovery = null;
    this.errors = [];
    this._log('invalidated', '连接代次结束：旧发现结果与 Notify 订阅失效，下次连接必须重新校验。', {
      reason: reason || 'connection_closed'
    });
    return { ok: true, code: null, message: 'GATT 通道已失效，必须重新发现并校验。', snapshot: this.snapshot() };
  };

  Carrier.prototype.sendApplicationPdu = function sendApplicationPdu(pdu, meta) {
    meta = meta || {};
    if (this.status !== 'ready') {
      return { ok: false, code: 'GATT_NOT_READY', message: 'GATT 未进入 READY，不能发送下行 Write。' };
    }
    if (typeof pdu !== 'string' || !pdu.trim()) {
      return { ok: false, code: 'APP_PDU_MISSING', message: '下行 Write 必须携带原应用 PDU。' };
    }
    var appWait = this.currentAppWait();
    var transfer = {
      id: this._next('TX'),
      direction: 'down',
      characteristicKey: 'down',
      serviceId: SERVICE_ID,
      functionId: DOWN_FUNCTION,
      serviceUuid: this.profile.serviceUuid,
      characteristicUuid: this.profile.downUuid,
      method: DOWN_METHOD,
      operation: meta.operation || null,
      label: meta.label || '应用请求',
      messageId: meta.messageId === undefined ? appWait && appWait.messageId : meta.messageId,
      queueId: meta.queueId === undefined ? appWait && appWait.queueId : meta.queueId,
      connectionId: appWait && appWait.connectionId,
      appPdu: pdu,
      createdAtSequence: this.sequence + 1,
      writeCompleted: false,
      linkAcknowledged: false
    };
    transfer.businessKey = [transfer.connectionId, transfer.queueId, transfer.messageId].join(':');
    this.transfers.push(transfer);
    this._log('down_write', '下行写入 08/04（WWR）：' + transfer.label, {
      transferId: transfer.id,
      messageId: transfer.messageId,
      appPdu: pdu
    });
    return { ok: true, code: null, message: null, transfer: copy(transfer), snapshot: this.snapshot() };
  };

  Carrier.prototype.observeAppRequest = function observeAppRequest(pdu, meta) {
    var wait = this.currentAppWait();
    if (!wait) return null;
    var businessKey = [wait.connectionId, wait.queueId, wait.messageId].join(':');
    var existing = this.transfers.find(function find(item) { return item.businessKey === businessKey; });
    if (existing) return copy(existing);
    var sent = this.sendApplicationPdu(pdu, meta);
    return sent.ok ? copy(sent.transfer) : null;
  };

  Carrier.prototype.writeComplete = function writeComplete(transferId) {
    var transfer = this.transfers.find(function find(item) { return item.id === transferId; });
    if (!transfer) return { ok: false, code: 'GATT_TRANSFER_MISSING', message: '找不到对应的下行 Write。' };
    transfer.writeCompleted = true;
    var wait = this.currentAppWait();
    var event = {
      id: this._next('WC'),
      transferId: transferId,
      meaning: 'controller_write_complete',
      requestReleased: false,
      appWait: wait
    };
    this.writeCompletions.push(event);
    this._log('write_complete', '控制器写出完成只表示链路写入结束；业务等待保持不变。', event);
    return { ok: true, code: null, message: 'GATT 写完成；应用层仍等待匹配响应。', requestReleased: false, appWait: copy(wait), snapshot: this.snapshot() };
  };

  Carrier.prototype.linkAck = function linkAck(transferId) {
    var transfer = this.transfers.find(function find(item) { return item.id === transferId; });
    if (!transfer) return { ok: false, code: 'GATT_TRANSFER_MISSING', message: '找不到对应的下行 Write。' };
    transfer.linkAcknowledged = true;
    var wait = this.currentAppWait();
    var event = {
      id: this._next('LA'),
      transferId: transferId,
      meaning: 'link_layer_ack',
      requestReleased: false,
      appWait: wait
    };
    this.linkAcks.push(event);
    this._log('link_ack', '链路 ACK 不是应用响应；业务等待保持不变。', event);
    return { ok: true, code: null, message: '链路 ACK 已记录；应用层仍等待匹配响应。', requestReleased: false, appWait: copy(wait), snapshot: this.snapshot() };
  };

  Carrier.prototype.notify = function notify(pdu, appFrame, meta) {
    meta = meta || {};
    if (this.status !== 'ready') {
      return { ok: false, code: 'GATT_NOT_READY', message: 'GATT 未进入 READY，不能接收 Notify。' };
    }
    if (typeof pdu !== 'string' || !pdu.trim()) {
      return { ok: false, code: 'APP_PDU_MISSING', message: 'Notify 必须携带原应用 PDU。' };
    }
    var waitBefore = this.currentAppWait();
    var receipt = null;
    if (appFrame && this.appTransport && typeof this.appTransport.receive === 'function') {
      receipt = this.appTransport.receive(appFrame);
    }
    var notification = {
      id: this._next('RX'),
      direction: 'up',
      characteristicKey: 'up',
      serviceId: SERVICE_ID,
      functionId: UP_FUNCTION,
      serviceUuid: this.profile.serviceUuid,
      characteristicUuid: this.profile.upUuid,
      method: UP_METHOD,
      kind: appFrame && appFrame.kind || meta.kind || 'notify',
      messageId: appFrame && appFrame.messageId,
      appPdu: pdu,
      requestReleased: !!(receipt && receipt.released),
      independentReport: !!(appFrame && (appFrame.kind === 'report' || appFrame.kind === 'event')),
      waitBefore: waitBefore,
      waitAfter: this.currentAppWait()
    };
    this.notifications.push(notification);
    this._log('up_notify', notification.requestReleased ? '上行 Notify 携带匹配应用响应，释放业务等待。' : '上行 Notify 已接收；当前业务等待不被独立上报或链路事件解除。', {
      notificationId: notification.id,
      kind: notification.kind,
      messageId: notification.messageId,
      requestReleased: notification.requestReleased
    });
    return { ok: true, code: null, message: null, notification: copy(notification), receipt: copy(receipt), snapshot: this.snapshot() };
  };

  Carrier.prototype.currentAppWait = function currentAppWait() {
    var inFlight = this.appTransport && this.appTransport.inFlight;
    if (!inFlight) return null;
    return {
      connectionId: inFlight.connectionId,
      queueId: inFlight.queueId,
      messageId: inFlight.messageId,
      operation: inFlight.operation,
      label: inFlight.label,
      kind: inFlight.kind,
      status: inFlight.status
    };
  };

  Carrier.prototype.currentTransfer = function currentTransfer() {
    var wait = this.currentAppWait();
    if (!wait) return null;
    var key = [wait.connectionId, wait.queueId, wait.messageId].join(':');
    return copy(this.transfers.slice().reverse().find(function find(item) { return item.businessKey === key; }) || null);
  };

  Carrier.prototype.snapshot = function snapshot() {
    return copy({
      version: VERSION,
      profileRevision: PROFILE_REVISION,
      profile: this.profile,
      scenario: this.scenario,
      scenarioLabel: this.scenarioLabel || (SCENARIOS.find(function find(item) { return item.id === this.scenario; }, this) || {}).label,
      status: this.status,
      discovery: this.discovery,
      errors: this.errors,
      transfers: this.transfers,
      notifications: this.notifications,
      writeCompletions: this.writeCompletions,
      linkAcks: this.linkAcks,
      currentTransfer: this.currentTransfer(),
      currentAppWait: this.currentAppWait(),
      logs: this.logs
    });
  };

  return {
    VERSION: VERSION,
    PROFILE_REVISION: PROFILE_REVISION,
    SERVICE_ID: SERVICE_ID,
    SERVICE_FUNCTION: SERVICE_FUNCTION,
    DOWN_FUNCTION: DOWN_FUNCTION,
    UP_FUNCTION: UP_FUNCTION,
    DOWN_METHOD: DOWN_METHOD,
    UP_METHOD: UP_METHOD,
    SCENARIOS: copy(SCENARIOS),
    PROFILES: PROFILES,
    profileList: profileList,
    resolveProfile: resolveProfile,
    expectedDiscovery: expectedDiscovery,
    discoveryForScenario: discoveryForScenario,
    validateDiscovery: validateDiscovery,
    uuidLayoutErrors: uuidLayoutErrors,
    Carrier: Carrier,
    create: function create(options) { return new Carrier(options); }
  };
});
