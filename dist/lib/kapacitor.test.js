"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("power-assert");
const kapacitor_1 = require("./kapacitor");
const kapacitor_2 = require("./kapacitor");
const kapacitor = new kapacitor_1.Kapacitor({
    host: '192.168.99.100'
});
const testCreateTask = () => __awaiter(this, void 0, void 0, function* () {
    const task = {
        id: 'test_kapa',
        type: 'stream',
        dbrps: [{ db: 'test', rp: 'autogen' }],
        script: `stream
              |from()
                .measurement("tick")`,
        vars: {
            var1: {
                value: 42,
                type: kapacitor_2.VarType.Float
            }
        }
    };
    const res = yield kapacitor.createTask(task);
    // console.log(res);
});
const testGetTask = () => __awaiter(this, void 0, void 0, function* () {
    const taskId = 'test_kapa';
    let res = yield kapacitor.getTask(taskId);
    assert(res.id === taskId);
    res = yield kapacitor.getTask(taskId, { dotView: 'labels' });
    console.log(res.status);
});
const testUpdateTask = () => __awaiter(this, void 0, void 0, function* () {
    const task = {
        id: 'test_kapa',
        status: 'enabled'
    };
    const res = yield kapacitor.updateTask(task);
    console.log(res.status);
    // console.log(res);
});
const testRemoveTask = () => __awaiter(this, void 0, void 0, function* () {
    yield kapacitor.removeTask('test_kapa');
});
const testGetTasks = () => __awaiter(this, void 0, void 0, function* () {
    let res = yield kapacitor.getTasks();
    assert(res.tasks);
    res = yield kapacitor.getTasks({
        dotView: 'labels',
        limit: 5
    });
    console.log(JSON.stringify(res, null, 2));
});
const testCreateTemplate = () => __awaiter(this, void 0, void 0, function* () {
    const template = {
        id: 'test_template',
        type: 'stream',
        script: `
      // Which measurement to consume
      var measurement string
      // Optional where filter
      var where_filter = lambda: TRUE
      // Optional list of group by dimensions
      var groups = [*]
      // Which field to process
      var field string
      // Warning criteria, has access to 'mean' field
      var warn lambda
      // Critical criteria, has access to 'mean' field
      var crit lambda
      // How much data to window
      var window = 5m
      // The slack channel for alerts
      var slack_channel = '#alerts'

      stream
          |from()
              .measurement(measurement)
              .where(where_filter)
              .groupBy(groups)
          |window()
              .period(window)
              .every(window)
          |mean(field)
          |alert()
              .warn(warn)
              .crit(crit)
              .slack()
              .channel(slack_channel)
    `,
        vars: {
            var1: {
                value: 42,
                type: kapacitor_2.VarType.Float
            }
        }
    };
    const res = yield kapacitor.createTemplate(template);
    console.log(res);
});
const testGetTemplate = () => __awaiter(this, void 0, void 0, function* () {
    const tmplId = 'test_template';
    let res = yield kapacitor.getTemplate(tmplId);
    assert(res.id === tmplId);
    res = yield kapacitor.getTemplate(tmplId, { scriptFormat: 'raw' });
    console.log(res.dot);
});
const testGetNoExistsTemplate = () => __awaiter(this, void 0, void 0, function* () {
    const tmplId = 'test_template22';
    try {
        let res = yield kapacitor.getTemplate(tmplId);
        assert(res.id === tmplId);
        res = yield kapacitor.getTemplate(tmplId, { scriptFormat: 'raw' });
        console.log(res.dot);
    }
    catch (e) {
        assert(e.message === 'no template exists');
    }
});
const testUpdateTemplate = () => __awaiter(this, void 0, void 0, function* () {
    const tmpl = {
        id: 'test_template',
        vars: {
            var1: {
                value: 42,
                type: kapacitor_2.VarType.Float
            }
        }
    };
    const res = yield kapacitor.updateTemplate(tmpl);
    console.log(res.modified);
    // console.log(res);
});
const testRemoveTemplate = () => __awaiter(this, void 0, void 0, function* () {
    yield kapacitor.removeTemplate('test_template');
});
const testGetTemplates = () => __awaiter(this, void 0, void 0, function* () {
    let res = yield kapacitor.getTemplates();
    assert(res.templates);
    res = yield kapacitor.getTemplates({
        scriptFormat: 'raw',
        limit: 5
    });
    console.log(JSON.stringify(res, null, 2));
});
const testPing = () => __awaiter(this, void 0, void 0, function* () {
    const res = yield kapacitor.ping(3000);
    assert(res.length > 0);
    assert(res[0].online);
    console.log('version: ', res[0].version);
});
const testGetConfig = () => __awaiter(this, void 0, void 0, function* () {
    let res = yield kapacitor.getConfig();
    assert(res['link']['href'] === '/kapacitor/v1/config');
    res = yield kapacitor.getConfig('influxdb');
    assert(res['link']['href'] === '/kapacitor/v1/config/influxdb');
    res = yield kapacitor.getConfig('influxdb', 'default');
    assert(res['link']['href'] === '/kapacitor/v1/config/influxdb/default');
});
const testUpdateConfig = () => __awaiter(this, void 0, void 0, function* () {
    let influxdb = yield kapacitor.getConfig('influxdb', 'default');
    const disableSubscriptions = influxdb.options['disable-subscriptions'];
    console.log('disable-subscriptions: ', disableSubscriptions);
    const action = {
        set: {
            'disable-subscriptions': !disableSubscriptions
        }
    };
    yield kapacitor.updateConfig(action, 'influxdb', 'default');
    influxdb = (yield kapacitor.getConfig('influxdb', 'default'));
    const disableSubscriptions2 = influxdb.options['disable-subscriptions'];
    console.log('disable-disableSubscriptions2: ', disableSubscriptions2);
    assert(disableSubscriptions2 === !disableSubscriptions);
});
describe('test kapacitor', () => {
    it('should create task', testCreateTask);
    it('should get task', testGetTask);
    it('should update task', testUpdateTask);
    it('should remove task', testRemoveTask);
    it('should get all task', testGetTasks);
    it('should create template', testCreateTemplate);
    it('should get template', testGetTemplate);
    it('should test get no exists template', testGetNoExistsTemplate);
    it('should update template', testUpdateTemplate);
    it('should remove template', testRemoveTemplate);
    it('should get all template', testGetTemplates);
    it('should test ping', testPing);
    it('should get config', testGetConfig);
    it('should update config', testUpdateConfig);
});
