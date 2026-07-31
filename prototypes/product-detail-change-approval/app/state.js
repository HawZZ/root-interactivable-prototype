export const state = {
  page: 'product',
  modal: null,
  drawer: null,
  activeApplication: 'A-001',
  activeProductLock: true,
  pendingAction: '详情变更',
  testConfirmed: false,
  evidence: '',
  testerEmail: '',
  applicationStatus: '等待外部测试',
  annotations: 'product',
  demoMode: 'lock',
  notifications: [
    { name: '测试工程师企业邮箱', target: 'qa.liu@example.com', status: '已受理', copy: '冻结快照、变更差异与 7 天只读链接' },
    { name: '审批人企业邮箱', target: 'li.na@example.com', status: '已受理', copy: '审批待办、申请详情与外部测试提醒' },
    { name: '飞书机器人（可选）', target: '机器人：产品变更审批', status: '失败待重试', copy: '待办提醒；不承载审批动作' }
  ],
  toast: ''
};

export const apps = [
  { id: 'A-001', action: '详情变更', status: '等待外部测试', product: 'W1 Lite', applicant: '陈晓 / 产品经理', submitted: '2026-07-31 10:18', lock: true },
  { id: 'A-002', action: '上架', status: '已生效', product: 'T3 Wearable Pump', applicant: '陈晓 / 产品经理', submitted: '2026-07-29 09:20', lock: false },
  { id: 'A-003', action: '下架', status: '已驳回', product: 'S9 Sterilizer', applicant: '陈晓 / 产品经理', submitted: '2026-07-28 14:06', lock: false },
  { id: 'A-006', action: '上架', status: '应用失败（未生效）', product: 'M5 Monitor', applicant: '陈晓 / 产品经理', submitted: '2026-07-26 11:32', lock: false }
];

export function set(patch) { Object.assign(state, patch); window.dispatchEvent(new CustomEvent('prototype:change')); }
export function tagType(status) {
  if (status === '已生效') return 'success';
  if (status.includes('失败') || status === '已驳回') return 'danger';
  if (status.includes('外部测试')) return 'primary';
  return 'info';
}
