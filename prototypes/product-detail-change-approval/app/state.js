export const users = {
  productManager: { id: 'chen.xiao', name: '陈晓', role: '普通用户' },
  approver: { id: 'li.na', name: '李娜', role: '审批员' },
  admin: { id: 'wang.admin', name: '王敏', role: '系统管理员' }
};

export const state = {
  page: 'product',
  activeApplication: 'A-001',
  approvalTab: 'initiated',
  role: '普通用户',
  productStatus: '已上架',
  activeProductLock: true,
  pendingAction: '详情变更',
  testerEmail: 'qa.liu@example.com',
  evidence: '',
  toast: ''
};

export const apps = [
  { id: 'A-001', productId: '2075767415740338177', action: '详情变更', status: '待审批', product: 'W1 Lite', model: 'W1Lite', applicant: '陈晓 / 产品经理', applicantId: 'chen.xiao', submitted: '2026-08-05 10:18', lock: true, outcome: '' },
  { id: 'A-002', productId: '2042519931187200001', action: '上架', status: '已生效', product: 'T3 Wearable Pump', model: 'T3', applicant: '陈晓 / 产品经理', applicantId: 'chen.xiao', submitted: '2026-08-04 09:20', lock: false, outcome: '审批通过，应用成功' },
  { id: 'A-003', productId: '2042519931187200002', action: '下架', status: '已驳回', product: 'S9 Sterilizer', model: 'S9', applicant: '赵青 / 产品经理', applicantId: 'zhao.qing', submitted: '2026-08-03 14:06', lock: false, outcome: '审批驳回' },
  { id: 'A-004', productId: '2042519931187200003', action: '上架范围变更', status: '待审批', product: 'DreamSync Tech', model: 'WN05', applicant: '赵青 / 产品经理', applicantId: 'zhao.qing', submitted: '2026-08-05 08:42', lock: true, outcome: '' },
  { id: 'A-005', productId: '2042519931187200004', action: '详情变更', status: '已生效', product: 'N1 Nursery', model: 'N1', applicant: '王敏 / 系统管理员', applicantId: 'wang.admin', submitted: '2026-08-02 16:10', lock: false, outcome: '审批通过，应用成功' },
  { id: 'A-006', productId: '2042519931187200005', action: '上架', status: '未生效', product: 'M5 Monitor', model: 'M5', applicant: '赵青 / 产品经理', applicantId: 'zhao.qing', submitted: '2026-08-01 11:32', lock: true, outcome: '审批通过，但应用失败' }
];

export const approvalConfig = {
  detail: { action: '产品详情 / 上架范围变更', userId: 'li.na', name: '李娜', account: 'li.na' },
  listing: { action: '产品上架', userId: 'li.na', name: '李娜', account: 'li.na' },
  delisting: { action: '产品下架', userId: 'li.na', name: '李娜', account: 'li.na' }
};

export function currentUser() {
  return Object.values(users).find((user) => user.role === state.role) || users.productManager;
}

export function set(patch) {
  Object.assign(state, patch);
  window.dispatchEvent(new CustomEvent('prototype:change'));
}

export function isActive(status) {
  return status === '待审批' || status === '未生效';
}

export function tagType(status) {
  if (status === '已生效' || status === '已上架') return 'success';
  if (status === '待审批' || status === '上架中') return 'warning';
  if (status === '已驳回' || status === '未生效' || status === '已下架') return 'danger';
  return 'info';
}
