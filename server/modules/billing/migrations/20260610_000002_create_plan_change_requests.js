/**
 * PlanChangeRequests — tenant plan requests awaiting admin approval.
 * Guarded so it no-ops when boot sync() has already created the table.
 */
module.exports = {
  async up({ queryInterface, tableExists, DataTypes }) {
    if (await tableExists('PlanChangeRequests')) return
    await queryInterface.createTable('PlanChangeRequests', {
      id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      organizationId: { type: DataTypes.UUID, allowNull: false },
      planId:         { type: DataTypes.UUID, allowNull: false },
      status:         { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'canceled'), allowNull: false, defaultValue: 'pending' },
      note:           { type: DataTypes.TEXT, allowNull: true },
      decidedBy:      { type: DataTypes.UUID, allowNull: true },
      decidedAt:      { type: DataTypes.DATE, allowNull: true },
      decisionNote:   { type: DataTypes.TEXT, allowNull: true },
      createdAt:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    })
  },

  async down({ queryInterface, tableExists }) {
    if (await tableExists('PlanChangeRequests')) await queryInterface.dropTable('PlanChangeRequests')
  },
}
