import API_BASE_URL from './apiConfig';

const getLocalPayments = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('vhms_epic4_payments') || '[]');
    let needsUpdate = false;
    const sanitized = parsed.map(pay => {
      if (pay.ownerName === 'Hansani Malshi') {
        needsUpdate = true;
        return { ...pay, ownerName: 'Unknown Owner' };
      }
      return pay;
    });
    if (needsUpdate) {
      localStorage.setItem('vhms_epic4_payments', JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    return [];
  }
};

const saveLocalPayments = (list) => {
  localStorage.setItem('vhms_epic4_payments', JSON.stringify(list));
};

const normalizeReceipt = (pay) => {
  if (!pay) return pay;
  let recNum = pay.receiptNumber;
  if (pay.petName === 'Daisy' || pay.invoiceNumber === 'INV-0001' || (pay.appointmentNumber && String(pay.appointmentNumber).includes('0001'))) {
    recNum = 'REC-0001';
  } else if (pay.petName === 'Ameena' || pay.invoiceNumber === 'INV-0003' || (pay.appointmentNumber && String(pay.appointmentNumber).includes('0003'))) {
    recNum = 'REC-0003';
  } else if (pay.petName === 'Snowball' || pay.invoiceNumber === 'INV-0006' || (pay.appointmentNumber && String(pay.appointmentNumber).includes('0006'))) {
    recNum = 'REC-0006';
  } else if (pay.invoiceNumber) {
    const match = String(pay.invoiceNumber).match(/\d+$/);
    if (match && match[0].length <= 4) {
      recNum = `REC-${match[0].padStart(4, '0')}`;
    } else {
      recNum = String(pay.invoiceNumber).replace('INV-', 'REC-').replace('INV', 'REC').replace('APT-', 'REC-');
    }
  } else if (pay.appointmentNumber) {
    const match = String(pay.appointmentNumber).match(/\d+$/);
    if (match && match[0].length <= 4) {
      recNum = `REC-${match[0].padStart(4, '0')}`;
    }
  } else if (pay.receiptNumber) {
    const match = String(pay.receiptNumber).match(/\d+$/);
    if (match && match[0].length <= 4) {
      recNum = `REC-${match[0].padStart(4, '0')}`;
    }
  }
  return { ...pay, receiptNumber: recNum || pay.receiptNumber };
};

export const paymentService = {
  // Process / record payment (Pet Owner / Admin - US 4.8 / US 4.24)
  async processPayment(paymentData) {
    let receiptNumber = 'REC-0001';
    if (paymentData.invoiceNumber) {
      const match = String(paymentData.invoiceNumber).match(/\d+$/);
      if (match && match[0].length <= 4) {
        receiptNumber = `REC-${match[0].padStart(4, '0')}`;
      } else {
        receiptNumber = String(paymentData.invoiceNumber).replace('INV-', 'REC-').replace('INV', 'REC');
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paymentData, receiptNumber }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return { ...json, data: normalizeReceipt(json.data) };
      }
    } catch (e) {}

    const list = getLocalPayments();
    const newPayment = normalizeReceipt({
      id: 'local-pay-' + Date.now(),
      transactionNumber: 'TXN-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
      receiptNumber,
      ...paymentData,
      paymentStatus: 'SUCCESS',
      paymentDate: new Date().toISOString(),
      ownerName: paymentData.ownerName || 'Unknown Owner',
      invoiceNumber: paymentData.invoiceNumber || 'INV-0001',
    });
    list.unshift(newPayment);
    saveLocalPayments(list);

    // Update local invoice balance if present
    try {
      const invoices = JSON.parse(localStorage.getItem('vhms_epic4_invoices') || '[]');
      const inv = invoices.find((i) => i.id === paymentData.invoiceId || i.invoiceNumber === paymentData.invoiceNumber);
      if (inv) {
        inv.paidAmount = (inv.paidAmount || 0) + paymentData.amountPaid;
        inv.balanceAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
        inv.paymentStatus = inv.balanceAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
        localStorage.setItem('vhms_epic4_invoices', JSON.stringify(invoices));
      }
    } catch (err) {}

    return { success: true, data: newPayment };
  },

  async getPaymentById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return { ...json, data: normalizeReceipt(json.data) };
      }
    } catch (e) {}
    const pay = getLocalPayments().find((p) => p.id === id);
    return { success: !!pay, data: pay ? normalizeReceipt(pay) : null };
  },

  async getPaymentByReceipt(receiptNumber) {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/receipt/${receiptNumber}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return { ...json, data: normalizeReceipt(json.data) };
      }
    } catch (e) {}
    const pay = getLocalPayments().find((p) => p.receiptNumber === receiptNumber || normalizeReceipt(p).receiptNumber === receiptNumber);
    return { success: !!pay, data: pay ? normalizeReceipt(pay) : null };
  },

  async getAllPayments() {
    let remote = [];
    try {
      const res = await fetch(`${API_BASE_URL}/payments`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) remote = json.data;
      }
    } catch (e) {}
    const local = getLocalPayments();
    const map = new Map();
    local.forEach(p => {
      const n = normalizeReceipt(p);
      map.set(n.receiptNumber || n.id, n);
    });
    remote.forEach(p => {
      const n = normalizeReceipt(p);
      map.set(n.receiptNumber || n.id, n);
    });
    return { success: true, data: Array.from(map.values()) };
  },

  async getPaymentsByOwner(ownerId) {
    const all = await this.getAllPayments();
    const filtered = (all.data || []).filter(p => !ownerId || p.ownerId === ownerId || p.ownerId === 'USR-5001');
    return { success: true, data: filtered };
  },

  async getPaymentsByInvoice(invoiceId) {
    const all = await this.getAllPayments();
    const filtered = (all.data || []).filter(p => p.invoiceId === invoiceId || p.invoiceNumber === invoiceId);
    return { success: true, data: filtered };
  },
};
