// Demo employees.
const EMPLOYEES = [
  { employeeCode: 'EMP-001', firstName: 'Somchai', lastName: 'Kittipong', position: 'IT Manager',      phone: '081-100-0001', startDate: '2020-01-15' },
  { employeeCode: 'EMP-002', firstName: 'Nipa',    lastName: 'Sriwan',    position: 'HR Specialist',   phone: '082-100-0002', startDate: '2019-06-01' },
  { employeeCode: 'EMP-003', firstName: 'Wanchai', lastName: 'Thongsuk',  position: 'Finance Officer', phone: '083-100-0003', startDate: '2021-03-10' },
  { employeeCode: 'EMP-004', firstName: 'Malee',   lastName: 'Phongphan', position: 'Sales Executive', phone: '084-100-0004', startDate: '2022-07-20' },
  { employeeCode: 'EMP-005', firstName: 'Prawit',  lastName: 'Suksai',    position: 'Warehouse Staff', phone: '085-100-0005', startDate: '2021-11-05' },
  { employeeCode: 'EMP-006', firstName: 'Supawit', lastName: 'Nakorn',    position: 'Sales Manager',   phone: '086-100-0006', startDate: '2018-04-01' },
  { employeeCode: 'EMP-007', firstName: 'Kannika', lastName: 'Buranee',   position: 'Accountant',      phone: '087-100-0007', startDate: '2023-01-09' },
  { employeeCode: 'EMP-008', firstName: 'Arthit',  lastName: 'Wongkham',  position: 'IT Developer',    phone: '088-100-0008', startDate: '2022-09-15' },
]

module.exports = {
  name: 'employees',
  tier: 'demo',
  order: 210,
  async run(ctx) {
    const { Employee } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    for (const e of EMPLOYEES) {
      await Employee.findOrCreate({
        where: { employeeCode: e.employeeCode, organizationId },
        defaults: { ...e, status: 'active', organizationId, createdBy },
      })
    }
  },
}
