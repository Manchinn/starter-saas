const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const bcrypt = require('bcryptjs')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  defaultPage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Link to parent Organization (User ID). If null, this user is the Organization itself.'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Parent organization ID — enables org hierarchy (sub-organizations).'
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emailVerificationExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passwordResetExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12)
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12)
      }
    },
  },
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: { attributes: {} },
  },
})

User.prototype.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password)
}

User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.password
  return values
}

module.exports = User
