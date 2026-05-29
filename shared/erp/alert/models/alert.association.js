/**
 * Alert associations — Alert, AlertRead.
 *
 * departmentId references an HRMS Department but is kept as a plain column
 * (no Sequelize association) because ERP associations are wired with the ERP
 * model registry only; the department name is resolved in the service.
 */
module.exports = function associate({ Alert, AlertRead }) {
  Alert.hasMany(AlertRead, { foreignKey: 'alertId', as: 'reads' })
  AlertRead.belongsTo(Alert, { foreignKey: 'alertId', as: 'alert' })
}
