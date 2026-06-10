/**
 * Add `suspended` to Subscriptions — an admin can block an org's access without
 * formally canceling the subscription (kept distinct from the status lifecycle).
 */
module.exports = {
  async up({ addColumn, DataTypes }) {
    await addColumn('Subscriptions', 'suspended', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },

  async down({ removeColumn }) {
    await removeColumn('Subscriptions', 'suspended')
  },
}
