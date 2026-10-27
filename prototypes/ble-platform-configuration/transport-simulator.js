/* Local, pure application-transport demo. It never opens BLE, calls IoT APIs or executes device work. */
(function attachBLETransportSimulator(root) {
  'use strict';

  var POLICY = Object.freeze({
    maxInFlightRequests: 1,
    requestScheduling: 'serial_per_connection',
    responseTimeoutMs: 5000,
    automaticRetries: 0,
    timeoutRecovery: 'pause_until_reconnect_and_initialization',
    invokeCompletion: 'synchronous',
    asyncInvokeHandling: 'not_in_generic_template',
    writeCommit: 'all_or_none',
    writeCommitSubject: 'configuration_values',
    writeUnsupportedFallback: 'custom_interface',
    writeValidation: 'all_fields_before_commit',
    offlineVerificationScope: 'configuration_and_format_only',
    physicalCompletionGuaranteed: false
  });
  var STATUS = Object.freeze({
    DISCONNECTED: 'disconnected',
    INITIALIZING: 'initializing',
    READY: 'ready',
    PAUSED: 'paused',
    BLOCKED: 'blocked'
  });
  var SUCCESS = 100000;
  var MAX_MESSAGE_ID = 65535;
  var hasOwn = Object.prototype.hasOwnProperty;

  function copy(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function result(ok, code, message, extra) {
    return Object.assign({ ok: ok, code: code || null, message: message || null }, extra || {});
  }

  function validReceivedTime(value) {
    var numeric = typeof value === 'string' && /^(?:0|[1-9][0-9]*)$/.test(value) ? Number(value) : value;
    return typeof numeric === 'number' && Number.isSafeInteger(numeric) && numeric >= 0;
  }

  function dictionaryIdentity(entry) {
    return [
      entry.productId,
      entry.firmwareVersion,
      entry.dictionaryVersion,
      entry.featureVersion,
      entry.sid,
      entry.templateVersion,
      entry.schemaVersion || '',
      entry.hash || ''
    ].join('|');
  }

  function TransportSimulator(options) {
    options = options || {};
    this.catalog = copy(options.catalog || []);
    this.startTime = Number.isFinite(options.startTime) ? options.startTime : 0;
    this.expectedSchemaVersion = options.expectedSchemaVersion || '1.0.0';
    this.expectedTemplateVersion = options.expectedTemplateVersion || 'flat-v1-draft';
    this.reset();
  }

  TransportSimulator.prototype.reset = function reset() {
    this.clockMs = this.startTime;
    this.connectionSerial = 0;
    this.status = STATUS.DISCONNECTED;
    this.dictionary = null;
    this.blockReason = null;
    this.pauseReason = null;
    this.queue = [];
    this.inFlight = null;
    this.completed = [];
    this.rejections = [];
    this.properties = {};
    this.propertyHistory = [];
    this.events = [];
    this.timeline = [];
    this.lastIssuedMessageId = 0;
    this.sentMessageIds = [];
    this._nextCommandId = 1;
    this._initializationValues = {};
    return this.snapshot();
  };

  TransportSimulator.prototype.now = function now() {
    return this.clockMs;
  };

  TransportSimulator.prototype._log = function _log(kind, message, detail) {
    var entry = {
      at: this.clockMs,
      connectionId: this.connectionSerial,
      kind: kind,
      message: message,
      detail: copy(detail || null)
    };
    this.timeline.push(entry);
    if (this.timeline.length > 100) this.timeline.shift();
    return entry;
  };

  TransportSimulator.prototype._pause = function _pause(code, message) {
    this.status = STATUS.PAUSED;
    this.pauseReason = { code: code, message: message, at: this.clockMs };
    this._log('paused', message, this.pauseReason);
  };

  TransportSimulator.prototype._cancelQueued = function _cancelQueued(code, message) {
    if (!this.queue.length) return [];
    var cancelled = this.queue.map(function (item) {
      return Object.assign({}, item, {
        status: 'cancelled',
        cancelledAt: this.clockMs,
        cancellationCode: code,
        cancellationMessage: message
      });
    }, this);
    this.completed.push.apply(this.completed, cancelled);
    if (this.completed.length > 100) this.completed = this.completed.slice(-100);
    this.queue = [];
    this._log('queue_cancelled', message, {
      count: cancelled.length,
      labels: cancelled.map(function (item) { return item.label; })
    });
    return cancelled;
  };

  TransportSimulator.prototype._block = function _block(code, message) {
    this.status = STATUS.BLOCKED;
    this.blockReason = { code: code, message: message, at: this.clockMs };
    this._log('blocked', message, this.blockReason);
  };

  TransportSimulator.prototype._resolveDictionary = function _resolveDictionary(productId, firmwareVersion, catalog) {
    var entries = (catalog || this.catalog || []).filter(function (entry) {
      return entry.productId === productId && entry.firmwareVersion === firmwareVersion;
    });
    if (entries.length === 0) {
      return result(false, 'DICTIONARY_MISSING', '未找到固件版本精确匹配的字典缓存，业务暂停。');
    }
    var identities = Object.create(null);
    entries.forEach(function (entry) { identities[dictionaryIdentity(entry)] = true; });
    if (Object.keys(identities).length !== 1) {
      return result(false, 'DICTIONARY_CONFLICT', '同一产品与固件版本命中多个不同字典，拒绝猜测。');
    }
    var entry = entries[0];
    if (entry.productId !== productId || entry.firmwareVersion !== firmwareVersion) {
      return result(false, 'DICTIONARY_MISMATCH', '字典缓存身份与设备版本不一致。');
    }
    if (entry.schemaVersion && entry.schemaVersion !== this.expectedSchemaVersion) {
      return result(false, 'DICTIONARY_MISMATCH', '字典 schemaVersion 与当前模板不兼容。');
    }
    if (entry.templateVersion && entry.templateVersion !== this.expectedTemplateVersion) {
      return result(false, 'DICTIONARY_MISMATCH', '字典模板版本与当前 flat-v1-draft 不匹配。');
    }
    return result(true, null, null, { dictionary: copy(entry) });
  };

  TransportSimulator.prototype.connect = function connect(params) {
    params = params || {};
    if ([STATUS.INITIALIZING, STATUS.READY].indexOf(this.status) !== -1) {
      return result(false, 'ALREADY_CONNECTED', '当前连接仍在使用，请先断开。');
    }
    if (!params.productId || !params.firmwareVersion) {
      return result(false, 'DEVICE_IDENTITY_REQUIRED', '必须提供产品标识与设备固件版本。');
    }
    this.connectionSerial += 1;
    this.lastIssuedMessageId = 0;
    this.sentMessageIds = [];
    this.inFlight = null;
    this.dictionary = null;
    this.blockReason = null;
    this.pauseReason = null;
    this._initializationValues = copy(params.initializationValues || {});
    this._log('connect', '建立新连接代次，旧连接响应不可完成本连接请求。', {
      connectionId: this.connectionSerial,
      productId: params.productId,
      firmwareVersion: params.firmwareVersion
    });

    var resolved = this._resolveDictionary(
      params.productId,
      params.firmwareVersion,
      params.catalog || this.catalog
    );
    if (!resolved.ok) {
      this._block(resolved.code, resolved.message);
      return this.snapshot();
    }
    this.dictionary = resolved.dictionary;
    this.status = STATUS.INITIALIZING;
    this._log('dictionary_resolved', '固件版本、功能版本与字典精确匹配。', {
      dictionaryVersion: this.dictionary.dictionaryVersion,
      featureVersion: this.dictionary.featureVersion,
      sid: this.dictionary.sid
    });
    var initialization = this._allocateInitialization();
    if (!initialization.ok) return this.snapshot();
    return this.snapshot();
  };

  TransportSimulator.prototype._allocateMessageId = function _allocateMessageId() {
    if (this.lastIssuedMessageId >= MAX_MESSAGE_ID) {
      this.inFlight = null;
      this._cancelQueued('MESSAGE_ID_EXHAUSTED', '请求号耗尽，旧未发送队列已取消；重连后需重新提交业务。');
      this._pause(
        'MESSAGE_ID_EXHAUSTED',
        '本连接 65535 个请求号已耗尽；禁止回绕，须断开并完成重连初始化。'
      );
      return result(false, 'MESSAGE_ID_EXHAUSTED', this.pauseReason.message);
    }
    this.lastIssuedMessageId += 1;
    this.sentMessageIds.push({
      connectionId: this.connectionSerial,
      messageId: this.lastIssuedMessageId
    });
    if (this.sentMessageIds.length > 256) this.sentMessageIds.shift();
    return result(true, null, null, { messageId: this.lastIssuedMessageId });
  };

  TransportSimulator.prototype._newInFlight = function _newInFlight(command) {
    var allocation = this._allocateMessageId();
    if (!allocation.ok) return allocation;
    var now = this.clockMs;
    this.inFlight = Object.assign({}, command, {
      connectionId: this.connectionSerial,
      messageId: allocation.messageId,
      status: 'in_flight',
      sentAt: now,
      deadline: now + POLICY.responseTimeoutMs
    });
    this._log('request_sent', command.label + ' · Message ID ' + allocation.messageId, {
      messageId: allocation.messageId,
      cid: command.cid,
      operation: command.operation,
      deadline: this.inFlight.deadline
    });
    return result(true, null, null, { inFlight: copy(this.inFlight) });
  };

  TransportSimulator.prototype._allocateInitialization = function _allocateInitialization() {
    var dictionary = this.dictionary || {};
    var command = {
      queueId: null,
      kind: 'initialization',
      label: '重连初始化：读取全部可读属性',
      operation: 'read',
      cid: 1,
      sid: dictionary.sid,
      selection: copy(dictionary.readableAddresses || []),
      expectedValues: copy(dictionary.initializationValues || this._initializationValues || {}),
      expectedResultCode: SUCCESS,
      completionMeaning: 'initialization_complete'
    };
    return this._newInFlight(command);
  };

  TransportSimulator.prototype.enqueue = function enqueue(command) {
    if (this.status !== STATUS.READY) {
      return result(false, 'NOT_READY', '只有初始化成功后才能排队业务请求。');
    }
    if (!command || !command.operation || !command.label) {
      return result(false, 'REQUEST_INVALID', '业务请求必须包含 operation 与 label。');
    }
    var normalized = {
      queueId: this._nextCommandId,
      kind: command.kind || 'business',
      label: command.label,
      operation: command.operation,
      cid: command.cid,
      sid: command.sid || (this.dictionary && this.dictionary.sid),
      actionId: command.actionId === undefined ? null : command.actionId,
      selection: copy(command.selection || []),
      fields: copy(command.fields || []),
      expectedValues: copy(command.expectedValues || {}),
      expectedResultCode: command.expectedResultCode === undefined ? SUCCESS : command.expectedResultCode,
      completionMeaning: command.completionMeaning || 'request_response_complete',
      status: 'queued'
    };
    this._nextCommandId += 1;
    this.queue.push(normalized);
    this._log('queued', '排队：' + normalized.label, { queueId: normalized.queueId });
    this._pump();
    return result(true, null, null, { queueId: normalized.queueId, snapshot: this.snapshot() });
  };

  TransportSimulator.prototype.enqueueMany = function enqueueMany(commands) {
    if (this.status !== STATUS.READY) {
      return result(false, 'NOT_READY', '只有初始化成功后才能排队业务请求。');
    }
    if (!Array.isArray(commands) || commands.length === 0) {
      return result(false, 'REQUEST_INVALID', '至少需要一个业务请求。');
    }
    var added = [];
    var self = this;
    commands.forEach(function (command) {
      var normalized = {
        queueId: self._nextCommandId,
        kind: command.kind || 'business',
        label: command.label,
        operation: command.operation,
        cid: command.cid,
        sid: command.sid || (self.dictionary && self.dictionary.sid),
        actionId: command.actionId === undefined ? null : command.actionId,
        selection: copy(command.selection || []),
        fields: copy(command.fields || []),
        expectedValues: copy(command.expectedValues || {}),
        expectedResultCode: command.expectedResultCode === undefined ? SUCCESS : command.expectedResultCode,
        completionMeaning: command.completionMeaning || 'request_response_complete',
        status: 'queued'
      };
      self._nextCommandId += 1;
      self.queue.push(normalized);
      added.push(normalized.queueId);
      self._log('queued', '排队：' + normalized.label, { queueId: normalized.queueId });
    });
    this._pump();
    return result(true, null, null, { queueIds: added, snapshot: this.snapshot() });
  };

  TransportSimulator.prototype._pump = function _pump() {
    if (this.status !== STATUS.READY || this.inFlight || this.queue.length === 0) return;
    var next = this.queue.shift();
    next.status = 'in_flight';
    var dispatched = this._newInFlight(next);
    if (!dispatched.ok) {
      next.status = 'cancelled';
      next.cancelledAt = this.clockMs;
      next.cancellationCode = dispatched.code;
      next.cancellationMessage = '发送前暂停，旧请求已取消；重连后需重新提交。';
      this.completed.push(next);
      this._log('queue_cancelled', '队首请求未发送即取消；重连后需重新提交。', { label: next.label });
    }
  };

  TransportSimulator.prototype.advance = function advance(milliseconds) {
    var amount = Number(milliseconds);
    if (!Number.isFinite(amount) || amount < 0) {
      return result(false, 'TIME_INVALID', '演示时钟只能向前推进非负毫秒数。');
    }
    this.clockMs += amount;
    if (this.inFlight && this.clockMs >= this.inFlight.deadline) {
      var timedOut = copy(this.inFlight);
      timedOut.status = 'timed_out';
      timedOut.resultKnown = false;
      timedOut.outcome = 'unknown';
      timedOut.timedOutAt = this.inFlight.deadline;
      this.completed.push(timedOut);
      this.inFlight = null;
      this._cancelQueued('REQUEST_TIMEOUT', '超时后旧未发送队列已取消；重连初始化不会自动执行旧意图。');
      this._pause(
        'REQUEST_TIMEOUT',
        '已发请求超过 5000ms，结果未知；本地等待已清理，未自动重试，等待重连初始化。'
      );
    }
    return result(true, null, null, { snapshot: this.snapshot() });
  };

  TransportSimulator.prototype._receivedAt = function _receivedAt(frame) {
    var value = frame && frame.receivedAt !== undefined ? Number(frame.receivedAt) : this.clockMs;
    return value;
  };

  TransportSimulator.prototype._timeRoleField = function _timeRoleField(frame) {
    var fields = this.dictionary && Array.isArray(this.dictionary.fields) ? this.dictionary.fields : [];
    var isEvent = frame && frame.kind === 'event';
    var matches = fields.filter(function (field) {
      if (!field || field.timeRole !== 'device_generated_utc_ms') return false;
      if (field.kind && field.kind !== (isEvent ? 'event' : 'property')) return false;
      if (isEvent && field.eventId !== undefined && frame.eventId !== undefined && String(field.eventId) !== String(frame.eventId)) return false;
      return true;
    });
    return matches.length === 1 ? matches[0] : null;
  };

  TransportSimulator.prototype._timeForState = function _timeForState(frame) {
    var receivedAt = this._receivedAt(frame);
    var field = this._timeRoleField(frame);
    if (!field) {
      return {
        validAt: receivedAt,
        timeSource: 'received_at',
        reason: 'no_time_role',
        timeRoleStatus: 'absent',
        timeFallbackReason: 'time_role_absent',
        orderComparable: false,
        lateDetection: 'received_time_only'
      };
    }
    var values = frame && frame.values && typeof frame.values === 'object' ? frame.values : {};
    var addressKey = String(field.address);
    var hasAddress = Object.prototype.hasOwnProperty.call(values, addressKey);
    var hasIdentifier = field.identifier && Object.prototype.hasOwnProperty.call(values, field.identifier);
    if (!hasAddress && !hasIdentifier) {
      return {
        validAt: receivedAt,
        timeSource: 'received_at',
        reason: 'missing_time_field',
        timeRoleStatus: 'fallback',
        timeFallbackReason: 'time_role_field_missing',
        orderComparable: false,
        lateDetection: 'received_time_only',
        timeField: copy(field)
      };
    }
    var raw = hasAddress ? values[addressKey] : values[field.identifier];
    var numeric = typeof raw === 'string' && /^(?:0|[1-9][0-9]*)$/.test(raw) ? Number(raw) : raw;
    if (typeof numeric !== 'number' || !Number.isFinite(numeric) || !Number.isSafeInteger(numeric) || numeric < 1) {
      return {
        validAt: receivedAt,
        timeSource: 'received_at',
        reason: 'invalid_time_field',
        timeRoleStatus: 'fallback',
        timeFallbackReason: 'time_role_value_invalid',
        orderComparable: false,
        lateDetection: 'received_time_only',
        timeField: copy(field),
        invalidTimeValue: copy(raw)
      };
    }
    return {
      validAt: numeric,
      timeSource: 'device_utc_ms',
      reason: 'declared_time_field',
      timeRoleStatus: 'present',
      timeFallbackReason: null,
      orderComparable: true,
      lateDetection: 'device_generated_time',
      timeField: copy(field)
    };
  };

  TransportSimulator.prototype._mergeValues = function _mergeValues(values, frame, source) {
    var keys = Object.keys(values || {});
    var stamp = this._timeForState(frame);
    var changed = [];
    var stale = [];
    var self = this;
    keys.forEach(function (key) {
      if (stamp.reason === 'invalid_time_field' && stamp.timeField &&
          (String(key) === String(stamp.timeField.address) || String(key) === String(stamp.timeField.identifier))) {
        self.propertyHistory.push({
          address: key,
          value: null,
          invalidValue: copy(stamp.invalidTimeValue),
          validAt: stamp.validAt,
          receivedAt: frame && frame.receivedAt !== undefined ? Number(frame.receivedAt) : self.clockMs,
          timeSource: stamp.timeSource,
          source: source,
          stale: false,
          sourceSwitch: false,
          timeRoleStatus: stamp.timeRoleStatus,
          reason: stamp.reason,
          fallbackReason: 'time_role_value_invalid',
          orderComparable: false,
          lateDetection: 'received_time_only'
        });
        if (self.propertyHistory.length > 200) self.propertyHistory.shift();
        return;
      }
      var current = self.properties[key] || null;
      var sourceChanged = !!(current && current.timeSource !== stamp.timeSource);
      var history = {
        address: key,
        value: copy(values[key]),
        validAt: stamp.validAt,
        receivedAt: frame && frame.receivedAt !== undefined ? Number(frame.receivedAt) : self.clockMs,
        timeSource: stamp.timeSource,
        source: source,
        stale: !!(current && !sourceChanged && stamp.validAt < current.validAt),
        sourceSwitch: sourceChanged,
        timeRoleStatus: stamp.timeRoleStatus,
        reason: stamp.reason,
        timeFallbackReason: stamp.timeFallbackReason,
        orderComparable: stamp.orderComparable,
        lateDetection: stamp.lateDetection
      };
      self.propertyHistory.push(history);
      if (self.propertyHistory.length > 200) self.propertyHistory.shift();
      if (!current || stamp.validAt >= current.validAt) {
        self.properties[key] = {
          value: copy(values[key]),
          validAt: stamp.validAt,
          receivedAt: history.receivedAt,
          timeSource: stamp.timeSource,
          source: source,
          sequence: (current ? current.sequence : 0) + 1,
          timeRoleStatus: stamp.timeRoleStatus,
          reason: stamp.reason,
          timeFallbackReason: stamp.timeFallbackReason,
          orderComparable: stamp.orderComparable,
          lateDetection: stamp.lateDetection,
          sourceSwitch: sourceChanged
        };
        changed.push(key);
      } else {
        stale.push(key);
      }
    });
    return { changed: changed, stale: stale, timeSource: stamp.timeSource };
  };

  TransportSimulator.prototype._receiveState = function _receiveState(frame) {
    if (frame.connectionId !== undefined && frame.connectionId !== this.connectionSerial) {
      var old = result(false, 'OLD_CONNECTION_REPORT', '旧连接代次的属性/事件上报仅记录，不进入当前状态。', {
        released: false
      });
      this._log('report_rejected', old.message, { connectionId: frame.connectionId });
      return old;
    }
    if (frame.kind === 'event') {
      var eventStamp = this._timeForState(frame);
      var eventValues = copy(frame.values || {});
      if (eventStamp.reason === 'invalid_time_field' && eventStamp.timeField) {
        var timeAddress = String(eventStamp.timeField.address);
        var timeIdentifier = String(eventStamp.timeField.identifier);
        if (Object.prototype.hasOwnProperty.call(eventValues, timeAddress)) eventValues[timeAddress] = null;
        if (Object.prototype.hasOwnProperty.call(eventValues, timeIdentifier)) eventValues[timeIdentifier] = null;
      }
      var event = {
        eventId: frame.eventId,
        name: frame.name || '事件',
        values: eventValues,
        validAt: eventStamp.validAt,
        receivedAt: frame.receivedAt !== undefined ? Number(frame.receivedAt) : this.clockMs,
        timeSource: eventStamp.timeSource,
        source: frame.source || 'event_report'
      };
      event.timeRoleStatus = eventStamp.timeRoleStatus;
      event.reason = eventStamp.reason;
      event.invalidTimeValue = copy(eventStamp.invalidTimeValue);
      event.timeFallbackReason = eventStamp.timeFallbackReason;
      event.orderComparable = eventStamp.orderComparable;
      event.lateDetection = eventStamp.lateDetection;
      this.events.push(event);
      if (this.events.length > 100) this.events.shift();
      this._log('event_received', '事件上报：' + event.name + '（不释放在途请求）', event);
      return result(true, null, null, {
        released: false,
        inFlightPreserved: !!this.inFlight,
        event: copy(event)
      });
    }
    var merged = this._mergeValues(frame.values || {}, frame, frame.source || 'property_report');
    this._log(
      'report_received',
      '属性上报部分更新 ' + merged.changed.length + ' 项' +
        (merged.stale.length ? '；' + merged.stale.length + ' 项迟到仅入历史' : '') +
        '（不释放在途请求）',
      merged
    );
    return result(true, null, null, {
      released: false,
      inFlightPreserved: !!this.inFlight,
      changed: merged.changed,
      stale: merged.stale,
      timeSource: merged.timeSource
    });
  };

  TransportSimulator.prototype._rejectResponse = function _rejectResponse(code, message, frame) {
    var entry = {
      code: code,
      message: message,
      at: this.clockMs,
      frame: copy(frame),
      inFlightPreserved: !!this.inFlight
    };
    this.rejections.push(entry);
    if (this.rejections.length > 100) this.rejections.shift();
    this._log('response_rejected', message, entry);
    return result(false, code, message, {
      released: false,
      inFlightPreserved: !!this.inFlight,
      snapshot: this.snapshot()
    });
  };

  TransportSimulator.prototype._receiveResponse = function _receiveResponse(frame) {
    if (frame.connectionId !== undefined && frame.connectionId !== this.connectionSerial) {
      return this._rejectResponse('LATE_RESPONSE', '响应来自旧连接代次，已拒绝。', frame);
    }
    if (!this.inFlight) {
      var known = this.sentMessageIds.some(function (sent) {
        return sent.connectionId === frame.connectionId && sent.messageId === frame.messageId;
      });
      return this._rejectResponse(
        known ? 'LATE_RESPONSE' : 'ORPHAN_RESPONSE',
        known ? '该请求号已结束，迟到响应不能完成新请求。' : '没有匹配的在途请求。',
        frame
      );
    }
    if (frame.messageId !== this.inFlight.messageId) {
      var staleId = this.sentMessageIds.some(function (sent) {
        return sent.connectionId === frame.connectionId && sent.messageId === frame.messageId;
      });
      return this._rejectResponse(
        staleId ? 'LATE_RESPONSE' : 'WRONG_MESSAGE_ID',
        staleId ? '请求号属于已结束请求，响应已拒绝。' : '响应 message_id 与当前在途请求不一致，已拒绝。',
        frame
      );
    }
    if (frame.sid !== this.inFlight.sid || frame.cid !== this.inFlight.cid) {
      return this._rejectResponse('RESPONSE_ID_MISMATCH', '响应 SID/CID 与当前在途请求不一致，已拒绝。', frame);
    }

    var completed = Object.assign({}, this.inFlight, {
      status: frame.resultCode === SUCCESS ? 'completed' : 'failed',
      resultCode: frame.resultCode,
      resultKnown: true,
      completedAt: this.clockMs
    });
    this.inFlight = null;
    this.completed.push(completed);
    if (this.completed.length > 100) this.completed.shift();
    this._log(
      'response_matched',
      completed.label + ' · ' + (frame.resultCode === SUCCESS ? '匹配响应完成' : '匹配响应返回失败结果'),
      { messageId: completed.messageId, resultCode: frame.resultCode }
    );

    if (completed.kind === 'initialization') {
      if (frame.resultCode !== SUCCESS) {
        this._cancelQueued('INITIALIZATION_FAILED', '初始化失败，等待的旧业务已取消；重连后需重新提交。');
        this._pause('INITIALIZATION_FAILED', '初始化读取失败，业务保持暂停并等待重新连接。');
        return result(false, 'INITIALIZATION_FAILED', this.pauseReason.message, { snapshot: this.snapshot() });
      }
      var initValues = frame.values && Object.keys(frame.values).length ? frame.values : completed.expectedValues;
      this._mergeValues(initValues || {}, frame, 'initialization_read');
      this.status = STATUS.READY;
      this.pauseReason = null;
      this.blockReason = null;
      this._log('initialized', '初始化完成，连接恢复接收新业务；不会自动派发旧队列。', {
        queue: this.queue.length
      });
      return result(true, null, '初始化完成。', { snapshot: this.snapshot(), released: true });
    }

    if (frame.values && Object.keys(frame.values).length) {
      this._mergeValues(frame.values, frame, 'query_response');
    }
    this._pump();
    return result(true, null, null, { snapshot: this.snapshot(), released: true });
  };

  TransportSimulator.prototype.receive = function receive(frame) {
    if (!frame || typeof frame !== 'object') {
      return result(false, 'FRAME_INVALID', '模拟帧必须是对象。');
    }
    var receipt = frame.receivedAt === undefined ? this.clockMs : frame.receivedAt;
    // Validate before JSON copying: NaN/Infinity would otherwise turn into null.
    if (!validReceivedTime(receipt)) {
      this._log('time_rejected', '本次接收时间无效，未写入状态。', { receivedAt: frame.receivedAt });
      return result(false, 'TIME_VALUE', '本次接收时间无效，消息未写入状态。');
    }
    frame = copy(frame);
    if (frame.interfaceMode === 'legacy') return this.receiveLegacy(frame);
    if (frame.connectionId === undefined) frame.connectionId = this.connectionSerial;
    if (frame.kind === 'report' || frame.kind === 'event') return this._receiveState(frame);
    if (frame.kind === 'response') return this._receiveResponse(frame);
    return result(false, 'FRAME_KIND_INVALID', '只接受 response、report 或 event 模拟帧。');
  };

  TransportSimulator.prototype.receiveLegacy = function receiveLegacy(frame) {
    var receipt = frame && frame.receivedAt !== undefined ? frame.receivedAt : this.clockMs;
    if (!validReceivedTime(receipt)) {
      return result(false, 'TIME_VALUE', '本次接收时间无效，旧接口消息未写入状态。');
    }
    frame = copy(frame || {});
    var stateUpdated = false;
    if (frame.values && Object.keys(frame.values).length) {
      this._mergeValues(frame.values, frame, 'legacy_compatible_message');
      stateUpdated = true;
    }
    this._log(
      'legacy_state_only',
      '旧接口同形消息只更新可见状态；没有通用请求引用，不宣称精确完成。',
      { kind: frame.kind, stateUpdated: stateUpdated }
    );
    return result(true, 'LEGACY_STATE_ONLY', '旧接口同形消息只更新状态，不释放或完成当前请求。', {
      stateOnly: true,
      completionUpdated: false,
      released: false,
      stateUpdated: stateUpdated,
      inFlightPreserved: !!this.inFlight,
      snapshot: this.snapshot()
    });
  };

  TransportSimulator.prototype.correctResponse = function correctResponse(overrides) {
    overrides = overrides || {};
    if (!this.inFlight) return null;
    var values = overrides.values;
    if (values === undefined) {
      if (this.inFlight.kind === 'initialization') {
        values = this.inFlight.expectedValues || {};
      } else if (this.inFlight.operation === 'read') {
        values = this.inFlight.expectedValues || {};
      } else {
        values = {};
      }
    }
    return {
      connectionId: overrides.connectionId === undefined ? this.connectionSerial : overrides.connectionId,
      kind: 'response',
      sid: overrides.sid === undefined ? this.inFlight.sid : overrides.sid,
      cid: overrides.cid === undefined ? this.inFlight.cid : overrides.cid,
      messageId: overrides.messageId === undefined ? this.inFlight.messageId : overrides.messageId,
      resultCode: overrides.resultCode === undefined ? SUCCESS : overrides.resultCode,
      interfaceMode: overrides.interfaceMode || 'verified',
      receivedAt: overrides.receivedAt === undefined ? this.clockMs : overrides.receivedAt,
      values: copy(values)
    };
  };

  TransportSimulator.prototype.lateResponse = function lateResponse() {
    var prior = this.completed.slice().reverse().find(function (item) {
      return item.messageId !== undefined;
    });
    if (!prior) return null;
    return {
      connectionId: prior.connectionId,
      kind: 'response',
      sid: prior.sid,
      cid: prior.cid,
      messageId: prior.messageId,
      resultCode: SUCCESS,
      interfaceMode: 'verified',
      receivedAt: this.clockMs,
      values: {}
    };
  };

  TransportSimulator.prototype.report = function report(values, receivedAt) {
    return {
      connectionId: this.connectionSerial,
      kind: 'report',
      cid: 4,
      messageId: this.lastIssuedMessageId + 10000,
      interfaceMode: 'verified',
      receivedAt: receivedAt === undefined ? this.clockMs : receivedAt,
      values: copy(values || {})
    };
  };

  TransportSimulator.prototype.event = function event(eventId, name, values, receivedAt) {
    return {
      connectionId: this.connectionSerial,
      kind: 'event',
      cid: 5,
      messageId: this.lastIssuedMessageId + 10001,
      eventId: eventId,
      name: name,
      interfaceMode: 'verified',
      receivedAt: receivedAt === undefined ? this.clockMs : receivedAt,
      values: copy(values || {})
    };
  };

  TransportSimulator.prototype.disconnect = function disconnect() {
    if (this.status === STATUS.DISCONNECTED) {
      return result(false, 'ALREADY_DISCONNECTED', '连接已断开。');
    }
    if (this.inFlight) {
      var abandoned = Object.assign({}, this.inFlight, {
        status: 'disconnected',
        resultKnown: false,
        outcome: 'unknown',
        disconnectedAt: this.clockMs
      });
      this.completed.push(abandoned);
    }
    this.inFlight = null;
    this._cancelQueued('DISCONNECTED', '断开后旧未发送队列已取消；重连初始化不会自动执行旧意图。');
    this.status = STATUS.DISCONNECTED;
    this.pauseReason = null;
    this._log('disconnected', '连接已断开：已发请求本地等待清理且结果未知；未发送旧队列取消，不重放。', { queued: 0 });
    return result(true, null, null, { snapshot: this.snapshot() });
  };

  TransportSimulator.prototype.setMessageIdForTest = function setMessageIdForTest(value) {
    if (!Number.isInteger(value) || value < 0 || value > MAX_MESSAGE_ID) {
      return result(false, 'MESSAGE_ID_INVALID', '测试请求号必须在 0..65535。');
    }
    this.lastIssuedMessageId = value;
    return result(true);
  };

  TransportSimulator.prototype.snapshot = function snapshot() {
    return copy({
      policy: POLICY,
      status: this.status,
      clockMs: this.clockMs,
      connectionId: this.connectionSerial,
      dictionary: this.dictionary,
      blockReason: this.blockReason,
      pauseReason: this.pauseReason,
      queue: this.queue,
      inFlight: this.inFlight,
      completed: this.completed,
      rejections: this.rejections,
      properties: this.properties,
      propertyHistory: this.propertyHistory,
      events: this.events,
      timeline: this.timeline,
      messageIdAllocator: {
        lastIssued: this.lastIssuedMessageId,
        maximum: MAX_MESSAGE_ID,
        exhausted: this.lastIssuedMessageId >= MAX_MESSAGE_ID,
        reusableWithinConnection: false
      }
    });
  };

  var api = {
    POLICY: POLICY,
    STATUS: STATUS,
    SUCCESS: SUCCESS,
    MAX_MESSAGE_ID: MAX_MESSAGE_ID,
    TransportSimulator: TransportSimulator,
    create: function create(options) { return new TransportSimulator(options); }
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BLETransportSimulator = api;
})(typeof window !== 'undefined' ? window : this);
