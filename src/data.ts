const mockData = {
  sales: [
    { id: '1', customerId: 'c1', total: 1250, date: new Date().toISOString(), dueDate: new Date(Date.now() + 30 * 86400000).toISOString() },
    { id: '2', customerId: 'c2', total: 4500, date: new Date().toISOString(), dueDate: new Date(Date.now() + 30 * 86400000).toISOString() },
    { id: '3', customerId: 'c1', total: 800, date: new Date(Date.now() - 86400000).toISOString(), dueDate: new Date(Date.now() + 29 * 86400000).toISOString() },
  ],
  customers: [
    { id: 'c1', name: 'Rahul Sharma' },
    { id: 'c2', name: 'Anjali Gupta' },
  ],
  inventory: [
    { id: 'i1', productId: 'p1', qty: 45, batch: 'B2024', expiry: new Date().toISOString() },
    { id: 'i2', productId: 'p2', qty: 12, batch: 'B2023', expiry: new Date().toISOString() },
  ],
  products: [
    { id: 'p1', name: 'Paracetamol 500mg' },
    { id: 'p2', name: 'Amoxicillin Capsule' },
  ]
};

export default mockData