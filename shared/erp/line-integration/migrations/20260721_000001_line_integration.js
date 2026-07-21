module.exports = {
  async up({ queryInterface, DataTypes, tableExists }) {
    if (!(await tableExists('line_connections'))) await queryInterface.createTable('line_connections', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      organizationId: { type: DataTypes.UUID, allowNull: false, unique: true },
      messagingChannelId: { type: DataTypes.STRING, allowNull: false },
      botUserId: { type: DataTypes.STRING, allowNull: false, unique: true },
      liffId: { type: DataTypes.STRING, allowNull: false },
      liffChannelId: { type: DataTypes.STRING, allowNull: false },
      defaultStoreId: { type: DataTypes.UUID, allowNull: true },
      channelSecretEncrypted: { type: DataTypes.TEXT, allowNull: false },
      channelAccessTokenEncrypted: { type: DataTypes.TEXT, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    })
    if (!(await tableExists('line_user_mappings'))) await queryInterface.createTable('line_user_mappings', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      organizationId: { type: DataTypes.UUID, allowNull: false },
      lineConnectionId: { type: DataTypes.UUID, allowNull: false },
      customerId: { type: DataTypes.UUID, allowNull: false },
      lineUserId: { type: DataTypes.STRING, allowNull: false },
      displayName: { type: DataTypes.STRING, allowNull: true },
      pictureUrl: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    })
    await queryInterface.addIndex('line_user_mappings', ['organizationId', 'lineUserId'], { unique: true, name: 'line_user_mappings_org_user_unique' })
  },
  async down({ queryInterface }) {
    await queryInterface.dropTable('line_user_mappings')
    await queryInterface.dropTable('line_connections')
  },
}
